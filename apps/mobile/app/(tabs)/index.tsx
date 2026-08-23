import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, View } from "react-native";
import { eachDay, foMessage, formatDayLabel, todayISO, type FoMessage, type TodayResponse, type TodayStep } from "@foco/shared";
import { DateRangeButton, DateRangePicker, type DateRange } from "@/components/date-range-picker";
import { FoAvatar } from "@/components/fo-avatar";
import { Screen } from "@/components/screen";
import { Banner, Button, Card, Empty, Loading, ProgressRing, Row, SearchInput, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notifyNow } from "@/lib/notifications";
import { matches } from "@/lib/search";
import { radius, space, useTheme } from "@/lib/theme";
import { errorMessage, useQuery } from "@/lib/use-query";

function localTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function Today() {
  const { colors } = useTheme();
  const { user, settings, addTrophies } = useAuth();
  const router = useRouter();
  const today = todayISO();
  const [range, setRange] = useState<DateRange>({ from: today, to: today });
  const [pickerOpen, setPickerOpen] = useState(false);
  const single = range.from === range.to;
  const isToday = single && range.from === today;
  const [query, setQuery] = useState("");
  // um dia = uma chamada; intervalo = uma chamada por dia (máx. 31)
  const { data, error, loading, refreshing, refresh, setData } = useQuery(
    () => Promise.all(eachDay(range.from, range.to).map((d) => api.today(d))),
    [range.from, range.to],
  );
  const [toast, setToast] = useState<FoMessage | null>(null);
  /** streak a celebrar quando o modal "Como foi?" fechar (null = nada pendente) */
  const [celebrate, setCelebrate] = useState<number | null>(null);
  const pendingCelebrate = useRef<number | null>(null);
  const celebrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** "<data>-<goalId>" do passo em requisição (a mesma meta aparece em vários dias no intervalo) */
  const [busyKey, setBusyKey] = useState<string | null>(null);
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
      if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
    },
    [],
  );

  // Voltou para esta tela (modal fechou) → libera os outros passos e,
  // se o dia foi completado, mostra os parabéns depois do feedback.
  useFocusEffect(
    useCallback(() => {
      setLocked(false);
      if (pendingCelebrate.current != null) {
        setCelebrate(pendingCelebrate.current);
        pendingCelebrate.current = null;
        if (celebrateTimer.current) clearTimeout(celebrateTimer.current);
        celebrateTimer.current = setTimeout(() => setCelebrate(null), 2400);
      }
    }, []),
  );

  const patchDay = (date: string, fn: (d: TodayResponse) => TodayResponse) =>
    setData((days) => days && days.map((d) => (d.date === date ? fn(d) : d)));

  const toggle = async (step: TodayStep, day: TodayResponse) => {
    if (!data || busyKey || locked) return;
    const nextDone = !step.done;
    setBusyKey(`${day.date}-${step.goal.id}`);
    setActionError(null);
    // otimista
    patchDay(day.date, (d) => patchStep(d, step.goal.id, nextDone));
    try {
      const res = await api.checkins.upsert({
        goalId: step.goal.id,
        date: day.date,
        done: nextDone,
        localTime: localTime(),
      });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(nextDone ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
      }
      patchDay(day.date, (d) => ({ ...patchStep(d, step.goal.id, nextDone, res.checkin.difficulty), streak: res.streak }));
      if (nextDone) {
        if (res.dayComplete && day.date === today) {
          // parabéns só depois do feedback: guarda para quando o modal fechar
          pendingCelebrate.current = res.streak;
          // notificação "Dia completo!" mapeada no Fô (shared/fo.ts)
          void notifyNow(
            foMessage("day_complete", {
              name: user?.name ?? "",
              tone: settings?.tone ?? "leve",
              total: day.total,
              done: day.total,
              streak: res.streak,
            }),
          );
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
              params: { goalId: step.goal.id, date: day.date, trophies },
            }),
          150,
        );
      } else {
        showToast(res.fo);
      }
    } catch (e) {
      patchDay(day.date, (d) => patchStep(d, step.goal.id, step.done));
      setActionError(errorMessage(e));
    } finally {
      setBusyKey(null);
    }
  };

  if (loading && !data) return <Loading />;

  // `data` pode ser de um período anterior enquanto o novo carrega: só usa se bater com o período atual.
  const expected = eachDay(range.from, range.to);
  const fresh = !!data && data.length === expected.length && data[0]?.date === range.from && data[data.length - 1]?.date === range.to;
  const days = fresh ? data : [];
  const current = single ? days[0] : undefined;
  const total = days.reduce((n, d) => n + d.total, 0);
  const doneCount = days.reduce((n, d) => n + d.doneCount, 0);
  const pct = total > 0 ? (doneCount / total) * 100 : 0;
  const filterSteps = (d: TodayResponse) => d.steps.filter((s) => matches(query, s.goal.stepTitle, s.goal.title));
  const anySteps = days.some((d) => d.steps.length > 0);
  const anyVisible = days.some((d) => filterSteps(d).length > 0);

  return (
    <View style={{ flex: 1 }}>
      <Screen
        title={total > 0 || !single ? "Seus passos" : `Oi, ${user?.name.split(" ")[0] ?? ""}`}
        refreshing={refreshing}
        onRefresh={refresh}
      >
        <Row gap={space.sm}>
          <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar…" style={{ flex: 1 }} />
          <DateRangeButton value={range} onPress={() => setPickerOpen(true)} />
        </Row>

        {error && <Banner>{error}</Banner>}
        {actionError && <Banner>{actionError}</Banner>}

        {data && !fresh && <Loading />}

        {fresh && (
          <>
            <Card>
              <Row gap={space.lg}>
                <ProgressRing value={pct} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt weight="600">
                    {doneCount}/{total} concluídos
                  </Txt>
                  {current ? (
                    <Row gap={4}>
                      <Ionicons name="flame" size={14} color={colors.orange} />
                      <Txt muted size={13}>
                        {current.streak} {current.streak === 1 ? "dia seguido" : "dias seguidos"}
                      </Txt>
                    </Row>
                  ) : (
                    <Txt muted size={13}>
                      {days.length} dias · {days.filter((d) => d.total > 0 && d.doneCount === d.total).length} completos
                    </Txt>
                  )}
                </View>
              </Row>
            </Card>

            {!anySteps ? (
              <Empty
                icon="flag-outline"
                title={isToday ? "Nenhuma meta ativa" : single ? "Nenhum passo neste dia" : "Nenhum passo no período"}
                text={
                  isToday ? "Crie sua primeira meta com prazo e o Foco quebra em passos diários." : "Não havia metas ativas nessas datas."
                }
                action={isToday ? <Button title="Criar meta" icon="add" onPress={() => router.push("/goals/new")} /> : undefined}
              />
            ) : !anyVisible ? (
              <Empty icon="search-outline" title="Nada encontrado" text={`Nenhum passo combina com "${query.trim()}".`} />
            ) : single && current ? (
              <View style={{ gap: space.sm }}>
                {filterSteps(current).map((s) => (
                  <StepRow
                    key={s.goal.id}
                    step={s}
                    busy={busyKey === `${current.date}-${s.goal.id}`}
                    disabled={locked}
                    onPress={() => toggle(s, current)}
                  />
                ))}
              </View>
            ) : (
              <View style={{ gap: space.lg }}>
                {[...days].reverse().map((d) => {
                  const steps = filterSteps(d);
                  if (steps.length === 0) return null;
                  return (
                    <View key={d.date} style={{ gap: space.sm }}>
                      <Row style={{ justifyContent: "space-between" }}>
                        <Txt weight="600" size={14}>
                          {d.date === today ? `Hoje · ${formatDayLabel(d.date)}` : formatDayLabel(d.date)}
                        </Txt>
                        <Txt muted size={12} weight="500">
                          {d.doneCount}/{d.total}
                          {d.isRestDay ? " · descanso" : ""}
                        </Txt>
                      </Row>
                      {steps.map((s) => (
                        <StepRow
                          key={`${d.date}-${s.goal.id}`}
                          step={s}
                          busy={busyKey === `${d.date}-${s.goal.id}`}
                          disabled={locked}
                          onPress={() => toggle(s, d)}
                        />
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </Screen>

      <DateRangePicker
        visible={pickerOpen}
        value={range}
        onClose={() => setPickerOpen(false)}
        onApply={(r) => {
          setRange(r);
          setPickerOpen(false);
        }}
      />

      {toast && <FoToast message={toast} />}
      {celebrate != null && <Celebration streak={celebrate} />}
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
