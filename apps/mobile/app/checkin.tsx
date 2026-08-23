import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { DIFFICULTY_LEVELS, TROPHY_BY_CODE, type FoMessage, type TrophyCode } from "@foco/shared";
import { FoAvatar } from "@/components/fo-avatar";
import { Screen } from "@/components/screen";
import { Banner, Button, Card, Field, Input, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { radius, space, useTheme } from "@/lib/theme";
import { errorMessage } from "@/lib/use-query";

/**
 * Diário do dia: depois de marcar um passo, o usuário registra
 * o quanto foi difícil (1–5) e deixa um comentário.
 */
export default function CheckinModal() {
  const { goalId, date, trophies } = useLocalSearchParams<{ goalId: string; date: string; trophies?: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const [level, setLevel] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [stepTitle, setStepTitle] = useState<string>("");
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [reply, setReply] = useState<FoMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const newTrophies = (trophies ? trophies.split(",").filter(Boolean) : []) as TrophyCode[];

  useEffect(() => {
    if (!goalId) return;
    api.goals
      .get(goalId, date)
      .then((g) => {
        setStepTitle(g.stepTitle);
        setGoalTitle(g.title);
        const existing = g.checkins.find((c) => c.date === date);
        if (existing?.difficulty) setLevel(existing.difficulty);
        if (existing?.note) setNote(existing.note);
      })
      .catch(() => {});
  }, [goalId, date]);

  const save = async () => {
    if (!goalId || !date) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.checkins.upsert({ goalId, date, done: true, difficulty: level, note: note.trim() || null });
      setReply(res.fo);
      setTimeout(() => router.back(), 1600);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen inStack>
      {newTrophies.length > 0 && (
        <Card soft>
          <Row gap={space.md}>
            <Ionicons name="trophy" size={26} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Txt weight="600" size={14}>
                {newTrophies.length === 1 ? "Troféu desbloqueado" : `${newTrophies.length} troféus desbloqueados`}
              </Txt>
              <Txt size={13}>{newTrophies.map((c) => TROPHY_BY_CODE[c]?.name ?? c).join(" · ")}</Txt>
            </View>
          </Row>
        </Card>
      )}

      <Card>
        <Txt muted size={11} weight="500" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
          Passo concluído
        </Txt>
        <Row gap={10} style={{ marginTop: 6 }}>
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Txt weight="600">{stepTitle || "…"}</Txt>
            <Txt muted size={12}>
              {goalTitle}
            </Txt>
          </View>
        </Row>
      </Card>

      {error && <Banner>{error}</Banner>}

      <View>
        <Txt weight="600" style={{ marginBottom: 10 }}>
          Quanto foi difícil hoje?
        </Txt>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DIFFICULTY_LEVELS.map((l) => {
            const active = level === l.value;
            return (
              <Pressable
                key={l.value}
                onPress={() => setLevel(l.value)}
                accessibilityLabel={l.label}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 10,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primarySoft : colors.card,
                }}
              >
                <Txt size={22}>{l.emoji}</Txt>
                <Txt muted size={11}>
                  {l.value}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        <Txt muted size={12} style={{ marginTop: 8, minHeight: 18 }}>
          {level ? DIFFICULTY_LEVELS[level - 1].label : "Toque num nível"}
        </Txt>
      </View>

      <Field label="Comentário (opcional)">
        <Input value={note} onChangeText={setNote} multiline placeholder="Hoje rendeu, mas o listening ainda pega…" maxLength={500} />
      </Field>

      {reply ? (
        <Card soft>
          <Row gap={space.md} style={{ alignItems: "flex-start" }}>
            <FoAvatar mood={reply.mood} size={44} />
            <View style={{ flex: 1 }}>
              <Txt weight="600" size={14}>
                Fô
              </Txt>
              <Txt size={14}>{reply.text}</Txt>
            </View>
          </Row>
        </Card>
      ) : (
        <View style={{ gap: space.sm }}>
          <Button title="Salvar registro" size="lg" icon="send" loading={busy} disabled={!level} onPress={save} />
          <Button title="Pular por hoje" variant="ghost" onPress={() => router.back()} />
        </View>
      )}
    </Screen>
  );
}
