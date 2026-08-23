import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { View } from "react-native";
import { WEEKDAY_LONG, WEEKDAY_SHORT, addDays, diffDays, formatShort, todayISO } from "@foco/shared";
import { Bars } from "@/components/bars";
import { DateRangeButton, DateRangePicker, type DateRange } from "@/components/date-range-picker";
import { Pie, PieLegend, type PieSlice } from "@/components/pie";
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
  const today = todayISO();
  // padrão: últimos 30 dias; um dia só vira uma janela de 1 dia
  const [range, setRange] = useState<DateRange>({ from: addDays(today, -29), to: today });
  const [pickerOpen, setPickerOpen] = useState(false);
  const { data, error, loading, refreshing, refresh } = useQuery(() => api.stats(range.to, range.from), [range.from, range.to]);

  if (loading && !data) return <Loading />;

  const nDays = diffDays(range.from, range.to) + 1;
  const periodLabel = nDays === 1 ? "1 dia" : `${nDays} dias`;
  const fresh = !!data && data.consistency.length === nDays && data.consistency[0]?.date === range.from;
  const consistency = fresh ? data.consistency : [];
  const doneDays = consistency.filter((d) => d.done > 0).length;
  const rated = consistency.filter((d) => !d.rest && d.total > 0);
  const constancy = rated.length ? Math.round((rated.reduce((s, d) => s + d.done / d.total, 0) / rated.length) * 100) : 0;
  const labelEvery = nDays <= 7 ? 1 : nDays <= 31 ? 7 : Math.ceil(nDays / 5);

  // pizza: como foram os dias do período
  const fullDays = consistency.filter((d) => !d.rest && d.total > 0 && d.done >= d.total).length;
  const partialDays = consistency.filter((d) => !d.rest && d.total > 0 && d.done > 0 && d.done < d.total).length;
  const missedDays = consistency.filter((d) => !d.rest && d.total > 0 && d.done === 0).length;
  const restDaysCount = consistency.filter((d) => d.rest).length;
  const noGoalDays = consistency.length - fullDays - partialDays - missedDays - restDaysCount;

  return (
    <Screen title="Seu progresso" refreshing={refreshing} onRefresh={refresh}>
      <DateRangeButton value={range} onPress={() => setPickerOpen(true)} />
      <DateRangePicker
        visible={pickerOpen}
        value={range}
        maxRangeDays={366}
        onClose={() => setPickerOpen(false)}
        onApply={(r) => {
          setRange(r);
          setPickerOpen(false);
        }}
      />
      {error && <Banner>{error}</Banner>}
      {data && !fresh && <Loading />}
      {fresh && (
        <>
          <Row gap={space.sm} style={{ alignItems: "stretch" }}>
            <Stat icon="flame" value={String(data.streak)} label="dias seguidos" />
            <Stat icon="ribbon" value={String(data.bestStreak)} label="melhor sequência" />
            <Stat icon="checkmark-done" value={String(data.totalDone)} label="passos no período" />
          </Row>

          <Card>
            <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <Txt weight="600" size={14}>
                Constância
              </Txt>
              <Txt muted size={12}>
                {constancy}% · {doneDays} {doneDays === 1 ? "dia ativo" : "dias ativos"}
              </Txt>
            </Row>
            <Bars
              data={consistency.map((d, i) => ({
                label: i % labelEvery === 0 || i === consistency.length - 1 ? formatShort(d.date).split(" ")[0] : "",
                value: d.total > 0 ? d.done / d.total : 0,
                muted: d.rest || d.total === 0,
                highlight: d.date === today,
              }))}
              height={80}
            />
            <Txt muted size={11} style={{ marginTop: 6 }}>
              Cada barra é um dia: quanto dos passos previstos você concluiu. Dias de descanso ficam apagados.
            </Txt>
          </Card>

          <DaysPie
            full={fullDays}
            partial={partialDays}
            missed={missedDays}
            rest={restDaysCount}
            noGoal={noGoalDays}
            periodLabel={periodLabel}
          />

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
                {data.avgDifficulty != null ? `${data.avgDifficulty} / 5 no período` : "registre como foi"}
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

/** Pizza "como foram os dias" + uma leitura rápida do período. */
function DaysPie({
  full,
  partial,
  missed,
  rest,
  noGoal,
  periodLabel,
}: {
  full: number;
  partial: number;
  missed: number;
  rest: number;
  noGoal: number;
  periodLabel: string;
}) {
  const { colors } = useTheme();
  const slices: PieSlice[] = [
    { value: full, color: colors.primary, label: "Dias completos" },
    { value: partial, color: colors.chart1, label: "Parciais" },
    { value: missed, color: colors.orange, label: "Sem check-in" },
    { value: rest, color: colors.mutedForeground, label: "Descanso" },
    { value: noGoal, color: colors.muted, label: "Sem meta ativa" },
  ];
  const tracked = full + partial + missed;
  const total = tracked + rest + noGoal;
  const fullRate = tracked > 0 ? Math.round((full / tracked) * 100) : 0;

  let insight: string;
  if (tracked === 0) {
    insight = "Nenhum dia com meta ativa no período — crie uma meta para começar a medir.";
  } else if (fullRate >= 80) {
    insight = `Excelente: ${fullRate}% dos dias com meta você fechou tudo. Ritmo de constância alto.`;
  } else if (fullRate >= 50) {
    insight = `Bom ritmo: ${fullRate}% dos dias com meta terminaram completos. Os parciais (${partial}) são a margem para subir.`;
  } else if (full + partial > missed) {
    insight = `Você se mexeu em ${full + partial} de ${tracked} dias, mas só ${fullRate}% fecharam completos — vale reduzir o tamanho do passo diário.`;
  } else {
    insight = `${missed} de ${tracked} dias passaram sem check-in. Um lembrete do Fô num horário melhor pode ajudar.`;
  }

  return (
    <Card>
      <Row style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <Txt weight="600" size={14}>
          Como foram os dias
        </Txt>
        <Txt muted size={12}>
          {periodLabel}
        </Txt>
      </Row>
      <Row gap={space.lg} style={{ alignItems: "center" }}>
        <Pie slices={slices} size={116} centerLabel={tracked > 0 ? `${fullRate}%` : "—"} />
        <PieLegend slices={slices.filter((s) => s.value > 0)} total={total} />
      </Row>
      <Txt muted size={11} style={{ marginTop: 10 }}>
        {insight}
      </Txt>
    </Card>
  );
}
