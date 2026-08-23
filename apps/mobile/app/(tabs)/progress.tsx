import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { WEEKDAY_LONG, WEEKDAY_SHORT, formatShort, todayISO } from "@foco/shared";
import { Bars } from "@/components/bars";
import { Screen } from "@/components/screen";
import { Banner, Card, Loading, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { space, useTheme } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

function Stat({ icon, value, label }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <Card style={{ flex: 1, padding: 12, gap: 4 }}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Txt weight="600" size={20}>
        {value}
      </Txt>
      <Txt muted size={11}>
        {label}
      </Txt>
    </Card>
  );
}

export default function Progress() {
  const date = todayISO();
  const { data, error, loading, refreshing, refresh } = useQuery(() => api.stats(date), [date]);

  if (loading && !data) return <Loading />;

  const consistency = data?.consistency ?? [];
  const doneDays30 = consistency.filter((d) => d.done > 0).length;
  const rate30 = consistency.filter((d) => !d.rest && d.total > 0);
  const constancy = rate30.length ? Math.round((rate30.reduce((s, d) => s + d.done / d.total, 0) / rate30.length) * 100) : 0;

  return (
    <Screen eyebrow="Últimos 30 dias" title="Seu progresso" refreshing={refreshing} onRefresh={refresh}>
      {error && <Banner>{error}</Banner>}
      {data && (
        <>
          <Row gap={space.sm} style={{ alignItems: "stretch" }}>
            <Stat icon="flame" value={String(data.streak)} label="dias seguidos" />
            <Stat icon="ribbon" value={String(data.bestStreak)} label="melhor sequência" />
            <Stat icon="checkmark-done" value={String(data.totalDone)} label="passos feitos" />
          </Row>

          <Card>
            <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <Txt weight="600" size={14}>
                Constância
              </Txt>
              <Txt muted size={12}>
                {constancy}% · {doneDays30} dias ativos
              </Txt>
            </Row>
            <Bars
              data={consistency.map((d, i) => ({
                label: i % 7 === 0 || i === consistency.length - 1 ? formatShort(d.date).split(" ")[0] : "",
                value: d.total > 0 ? d.done / d.total : 0,
                muted: d.rest || d.total === 0,
                highlight: d.date === date,
              }))}
              height={80}
            />
            <Txt muted size={11} style={{ marginTop: 6 }}>
              Cada barra é um dia: quanto dos passos previstos você concluiu. Dias de descanso ficam apagados.
            </Txt>
          </Card>

          <Card>
            <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <Txt weight="600" size={14}>
                Dias fortes
              </Txt>
              <Txt muted size={12}>
                {data.strongestWeekday != null ? `melhor: ${WEEKDAY_LONG[data.strongestWeekday]}` : "ainda sem dados"}
              </Txt>
            </Row>
            <Bars
              data={data.weekdays.map((w) => ({
                label: WEEKDAY_SHORT[w.weekday],
                value: w.rate,
                muted: w.samples === 0,
                highlight: w.weekday === data.strongestWeekday,
              }))}
              height={70}
            />
          </Card>

          <Card>
            <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <Txt weight="600" size={14}>
                Dificuldade média
              </Txt>
              <Txt muted size={12}>
                {data.avgDifficulty != null ? `${data.avgDifficulty} / 5 nos últimos 30 dias` : "registre como foi"}
              </Txt>
            </Row>
            <Bars
              data={data.difficultyTrend.map((w) => ({
                label: formatShort(w.weekStart),
                value: w.avg ?? 0,
                max: 5,
                muted: w.avg == null,
              }))}
              height={70}
            />
            <Txt muted size={11} style={{ marginTop: 6 }}>
              Média semanal do quanto foi difícil (1 a 5). Com o tempo, dá pra ver padrões — e ajustar o ritmo.
            </Txt>
          </Card>

          <Row gap={space.sm} style={{ alignItems: "stretch" }}>
            <Stat icon="flag" value={String(data.activeGoals)} label="metas ativas" />
            <Stat icon="trophy" value={String(data.trophiesEarned)} label="troféus" />
          </Row>
          <View style={{ height: 1 }} />
        </>
      )}
    </Screen>
  );
}
