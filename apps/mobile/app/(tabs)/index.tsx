import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, View } from "react-native";
import { formatDayLabel, todayISO, type FoMessage, type TodayResponse, type TodayStep } from "@foco/shared";
import { FoAvatar } from "@/components/fo-avatar";
import { Screen } from "@/components/screen";
import { Banner, Button, Card, Empty, Loading, ProgressRing, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { radius, space, useTheme } from "@/lib/theme";
import { errorMessage, useQuery } from "@/lib/use-query";

function localTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Today() {
  const { colors } = useTheme();
  const { user, addTrophies } = useAuth();
  const router = useRouter();
  const date = todayISO();
  const { data, error, loading, refreshing, refresh, setData } = useQuery(() => api.today(date), [date]);
  const [toast, setToast] = useState<FoMessage | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** true entre concluir um passo e fechar o modal "Como foi?" — bloqueia os outros passos */
  const [locked, setLocked] = useState(false);

  const showToast = useCallback((m: FoMessage) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (navTimer.current) clearTimeout(navTimer.current);
    },
    [],
  );

  // Voltou para esta tela (modal fechou) → libera os outros passos.
  useFocusEffect(
    useCallback(() => {
      setLocked(false);
    }, []),
  );

  const toggle = async (step: TodayStep) => {
    if (!data || busyId || locked) return;
    const nextDone = !step.done;
    setBusyId(step.goal.id);
    setActionError(null);
    // otimista
    setData((d) => d && patchStep(d, step.goal.id, nextDone));
    try {
      const res = await api.checkins.upsert({
        goalId: step.goal.id,
        date,
        done: nextDone,
        localTime: localTime(),
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(nextDone ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
      }
      setData(
        (d) =>
          d && {
            ...patchStep(d, step.goal.id, nextDone, res.checkin.difficulty),
            streak: res.streak,
          },
      );
      if (nextDone) {
        if (res.dayComplete) {
          setCelebrate(true);
          setTimeout(() => setCelebrate(false), 2400);
        }
        addTrophies(res.newTrophies.length);
        const trophies = res.newTrophies.map((t) => t.code).join(",");
        // um modal por vez: trava até o "Como foi?" fechar
        setLocked(true);
        if (navTimer.current) clearTimeout(navTimer.current);
        navTimer.current = setTimeout(
          () =>
            router.push({
              pathname: "/checkin",
              params: { goalId: step.goal.id, date, trophies },
            }),
          res.dayComplete ? 1800 : 150,
        );
      } else {
        showToast(res.fo);
      }
    } catch (e) {
      setData((d) => d && patchStep(d, step.goal.id, step.done));
      setActionError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !data) return <Loading />;

  const pct = data && data.total > 0 ? (data.doneCount / data.total) * 100 : 0;

  return (
    <View style={{ flex: 1 }}>
      <Screen
        eyebrow={`Hoje · ${formatDayLabel(date)}`}
        title={data && data.total > 0 ? "Seus passos" : `Oi, ${user?.name.split(" ")[0] ?? ""}`}
        refreshing={refreshing}
        onRefresh={refresh}
      >
        {error && <Banner>{error}</Banner>}
        {actionError && <Banner>{actionError}</Banner>}

        {data && (
          <>
            <Card>
              <Row gap={space.lg}>
                <ProgressRing value={pct} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt weight="600">
                    {data.doneCount}/{data.total} concluídos
                  </Txt>
                  <Row gap={4}>
                    <Ionicons name="flame" size={14} color={colors.orange} />
                    <Txt muted size={13}>
                      {data.streak} {data.streak === 1 ? "dia seguido" : "dias seguidos"}
                    </Txt>
                  </Row>
                  {data.isRestDay && (
                    <Txt muted size={12}>
                      Dia de descanso — a sequência fica guardada.
                    </Txt>
                  )}
                </View>
              </Row>
            </Card>

            <Card soft>
              <Row gap={space.md} style={{ alignItems: "flex-start" }}>
                <FoAvatar mood={data.fo.mood} size={48} />
                <View style={{ flex: 1 }}>
                  <Txt weight="600" size={14}>
                    {data.fo.title}
                  </Txt>
                  <Txt size={14} style={{ marginTop: 2 }}>
                    {data.fo.text}
                  </Txt>
                </View>
              </Row>
            </Card>

            {data.steps.length === 0 ? (
              <Empty
                icon="flag-outline"
                title="Nenhuma meta ativa"
                text="Crie sua primeira meta com prazo e o Foco quebra em passos diários."
                action={<Button title="Criar meta" icon="add" onPress={() => router.push("/goals/new")} />}
              />
            ) : (
              <View style={{ gap: space.sm }}>
                {data.steps.map((s) => (
                  <StepRow key={s.goal.id} step={s} busy={busyId === s.goal.id} disabled={locked} onPress={() => toggle(s)} />
                ))}
              </View>
            )}
          </>
        )}
      </Screen>

      {toast && <FoToast message={toast} />}
      {celebrate && data && <Celebration streak={data.streak} />}
    </View>
  );
}

function patchStep(d: TodayResponse, goalId: string, done: boolean, difficulty?: number | null): TodayResponse {
  const steps = d.steps.map((s) =>
    s.goal.id === goalId
      ? {
          ...s,
          done,
          checkin: s.checkin
            ? {
                ...s.checkin,
                done,
                difficulty: difficulty ?? s.checkin.difficulty,
              }
            : {
                id: "tmp",
                goalId,
                date: d.date,
                done,
                difficulty: difficulty ?? null,
                note: null,
                createdAt: "",
                updatedAt: "",
              },
        }
      : s,
  );
  return { ...d, steps, doneCount: steps.filter((s) => s.done).length };
}

function StepRow({ step, busy, disabled, onPress }: { step: TodayStep; busy: boolean; disabled?: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const router = useRouter();
  const done = step.done;
  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: done ? colors.primary + "55" : colors.border,
        backgroundColor: done ? colors.primarySoft : colors.card,
        opacity: pressed || busy ? 0.7 : disabled ? 0.55 : 1,
      })}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 7,
          borderWidth: 1.5,
          borderColor: done ? colors.primary : colors.input,
          backgroundColor: done ? colors.primary : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {done && <Ionicons name="checkmark" size={16} color={colors.primaryForeground} />}
      </View>
      <View style={{ flex: 1 }}>
        <Txt
          weight="500"
          style={
            done && {
              textDecorationLine: "line-through",
              color: colors.mutedForeground,
            }
          }
        >
          {step.goal.stepTitle}
        </Txt>
        <Txt muted size={12} numberOfLines={1}>
          {step.goal.title}
          {step.checkin?.difficulty ? ` · dificuldade ${step.checkin.difficulty}/5` : ""}
        </Txt>
      </View>
      <Pressable
        hitSlop={8}
        onPress={() => router.push({ pathname: "/goals/[id]", params: { id: step.goal.id } })}
        accessibilityLabel="Abrir meta"
      >
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </Pressable>
    </Pressable>
  );
}

function FoToast({ message }: { message: FoMessage }) {
  const { colors } = useTheme();
  const y = useRef(new Animated.Value(-80)).current;
  useEffect(() => {
    Animated.spring(y, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
    }).start();
  }, [y]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 56,
        left: 16,
        right: 16,
        transform: [{ translateY: y }],
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 6,
      }}
    >
      <FoAvatar mood={message.mood} size={40} />
      <View style={{ flex: 1 }}>
        <Txt weight="600" size={13}>
          {message.title} · agora
        </Txt>
        <Txt muted size={13}>
          {message.text}
        </Txt>
      </View>
    </Animated.View>
  );
}

function Celebration({ streak }: { streak: number }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 12,
      stiffness: 200,
    }).start();
  }, [scale]);
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        backgroundColor: colors.background + "E6",
      }}
    >
      <Animated.View
        style={{
          width: 84,
          height: 84,
          borderRadius: 999,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale }],
        }}
      >
        <Ionicons name="trophy" size={40} color={colors.primary} />
      </Animated.View>
      <Txt weight="600" size={18}>
        Dia completo! 🏆
      </Txt>
      <Txt muted size={13}>
        {streak} {streak === 1 ? "dia seguido" : "dias seguidos"}
      </Txt>
      <FoAvatar mood="celebrate" size={64} />
    </View>
  );
}
