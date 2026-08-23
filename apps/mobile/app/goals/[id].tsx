import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, View } from "react-native";
import { TROPHY_BY_CODE, addDays, eachDay, formatDayLabel, formatShort, todayISO, weekdayOf, WEEKDAY_SHORT } from "@foco/shared";
import { Bars } from "@/components/bars";
import { Screen } from "@/components/screen";
import { Banner, Button, Card, Loading, ProgressRing, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { space, useTheme } from "@/lib/theme";
import { errorMessage, useQuery } from "@/lib/use-query";

function confirm(title: string, message: string, onOk: () => void) {
  if (Platform.OS === "web") {
    if (globalThis.confirm?.(`${title}\n\n${message}`)) onOk();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancelar", style: "cancel" },
    { text: "Confirmar", style: "destructive", onPress: onOk },
  ]);
}

export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const today = todayISO();
  const { data: goal, error, loading, refreshing, refresh, reload } = useQuery(() => api.goals.get(id!, today), [id, today]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<unknown>, after?: () => void) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      after ? after() : await reload();
    } catch (e) {
      setActionError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !goal) return <Loading />;
  if (!goal) return <Screen inStack>{error && <Banner>{error}</Banner>}</Screen>;

  // últimos 14 dias: feito/não feito
  const doneSet = new Set(goal.checkins.filter((c) => c.done).map((c) => c.date));
  const last14 = eachDay(addDays(today, -13), today).map((d) => ({
    label: WEEKDAY_SHORT[weekdayOf(d)].slice(0, 1).toUpperCase(),
    value: doneSet.has(d) ? 1 : 0,
    muted: !doneSet.has(d),
    highlight: d === today,
  }));

  const history = goal.checkins.filter((c) => c.done || c.note).slice(0, 30);

  return (
    <>
      <Stack.Screen options={{ title: goal.title }} />
      <Screen inStack refreshing={refreshing} onRefresh={refresh}>
        {error && <Banner>{error}</Banner>}
        {actionError && <Banner>{actionError}</Banner>}

        <Card>
          <Row gap={space.lg}>
            <ProgressRing value={goal.progress.percent} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt weight="600">{goal.stepTitle}</Txt>
              <Txt muted size={13}>
                {goal.progress.doneDays} de {goal.progress.plannedDays} dias · prazo {goal.progress.dueLabel}
              </Txt>
              <Txt muted size={12}>
                Início {formatShort(goal.startDate)}
                {goal.dueDate ? ` · fim ${formatShort(goal.dueDate)}` : " · contínua"}
                {goal.avgDifficulty != null ? ` · dificuldade média ${goal.avgDifficulty}` : ""}
              </Txt>
              {goal.status !== "active" && (
                <Txt size={12} weight="600" style={{ color: colors.primary }}>
                  {goal.status === "done" ? "Concluída" : "Arquivada"}
                </Txt>
              )}
            </View>
          </Row>
          {goal.description ? (
            <Txt muted size={13} style={{ marginTop: 12 }}>
              {goal.description}
            </Txt>
          ) : null}
        </Card>

        <Card>
          <Txt weight="600" size={14} style={{ marginBottom: 10 }}>
            Últimos 14 dias
          </Txt>
          <Bars data={last14} height={40} />
        </Card>

        {goal.trophies.length > 0 && (
          <Card soft>
            <Row gap={10}>
              <Ionicons name="trophy" size={20} color={colors.primary} />
              <Txt size={14} style={{ flex: 1 }}>
                {goal.trophies.map((t) => `${TROPHY_BY_CODE[t.code]?.name ?? t.code} · ${formatShort(t.date)}`).join("\n")}
              </Txt>
            </Row>
          </Card>
        )}

        {goal.status === "active" && (
          <View style={{ gap: space.sm }}>
            <Button
              title="Marcar meta como concluída"
              icon="medal-outline"
              loading={busy}
              onPress={() =>
                confirm("Concluir meta?", "Ela sai da lista do dia. Se for antes do prazo, você ganha o troféu “Meta batida”.", () =>
                  run(() => api.goals.complete(goal.id, today)),
                )
              }
            />
            <Button
              title="Arquivar"
              variant="outline"
              icon="archive-outline"
              onPress={() => run(() => api.goals.update(goal.id, { status: "archived" }))}
            />
          </View>
        )}
        {goal.status !== "active" && (
          <Button title="Reativar meta" variant="outline" icon="refresh" loading={busy} onPress={() => run(() => api.goals.update(goal.id, { status: "active" }))} />
        )}

        <View>
          <Txt weight="600" size={14} style={{ marginBottom: 8 }}>
            Diário
          </Txt>
          {history.length === 0 ? (
            <Txt muted size={13}>
              Os registros de cada dia (dificuldade e comentário) aparecem aqui.
            </Txt>
          ) : (
            <View style={{ gap: 8 }}>
              {history.map((c) => (
                <Card key={c.id} style={{ padding: 12 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Txt weight="500" size={13}>
                      {formatDayLabel(c.date)}
                    </Txt>
                    <Row gap={4}>
                      {c.done && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
                      {c.difficulty ? (
                        <Txt muted size={12}>
                          dificuldade {c.difficulty}/5
                        </Txt>
                      ) : null}
                    </Row>
                  </Row>
                  {c.note ? (
                    <Txt size={13} style={{ marginTop: 4 }}>
                      {c.note}
                    </Txt>
                  ) : null}
                </Card>
              ))}
            </View>
          )}
        </View>

        <Button
          title="Excluir meta"
          variant="ghost"
          onPress={() =>
            confirm("Excluir meta?", "Apaga a meta e todo o histórico de check-ins. Não dá pra desfazer.", () =>
              run(() => api.goals.remove(goal.id), () => router.back()),
            )
          }
        />
      </Screen>
    </>
  );
}
