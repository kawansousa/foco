import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { addDays, todayISO, type GoalWithProgress } from "@foco/shared";
import { DateRangeButton, DateRangePicker, type DateRange } from "@/components/date-range-picker";
import { Screen } from "@/components/screen";
import { GoalCard } from "@/components/goal-card";
import { Banner, Button, Chip, Empty, Fab, Loading, Row, SearchInput, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { matches } from "@/lib/search";
import { space } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

type Filter = "active" | "done" | "archived";
/** Meta vigente em algum dia do período: começou até o fim e (sem prazo ou) vence a partir do início. */
function inRange(g: GoalWithProgress, r: DateRange): boolean {
  return g.startDate <= r.to && (!g.dueDate || g.dueDate >= r.from);
}

export default function Goals() {
  const router = useRouter();
  const today = todayISO();
  const [filter, setFilter] = useState<Filter>("active");
  const [range, setRange] = useState<DateRange>({ from: today, to: today });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState("");
  // progresso calculado até o fim do período (hoje, por padrão)
  const date = range.to <= today ? range.to : today;
  const { data, error, loading, refreshing, refresh } = useQuery(() => api.goals.list({ date }), [date]);

  const byStatus = (data?.goals ?? []).filter((g) => g.status === filter);
  const goals = byStatus.filter((g) => inRange(g, range) && matches(query, g.title, g.stepTitle, g.description));
  const filtering = range.from !== today || range.to !== today || query.trim().length > 0;
  const statusLabel: Record<Filter, [string, string]> = {
    active: ["ativa", "ativas"],
    done: ["concluída", "concluídas"],
    archived: ["arquivada", "arquivadas"],
  };
  const countLabel = `${goals.length} ${statusLabel[filter][goals.length === 1 ? 0 : 1]}${filtering && goals.length !== byStatus.length ? ` de ${byStatus.length}` : ""}`;

  return (
    <View style={{ flex: 1 }}>
      <Screen title="Suas metas" refreshing={refreshing} onRefresh={refresh} contentStyle={{ paddingBottom: 96 }}>
        {error && <Banner>{error}</Banner>}
        <Row gap={space.sm}>
          <SearchInput value={query} onChangeText={setQuery} placeholder="Buscar…" style={{ flex: 1 }} />
          <DateRangeButton value={range} onPress={() => setPickerOpen(true)} />
        </Row>
        <Row gap={8}>
          <Chip label="Ativas" active={filter === "active"} onPress={() => setFilter("active")} />
          <Chip label="Concluídas" active={filter === "done"} onPress={() => setFilter("done")} />
          <Chip label="Arquivadas" active={filter === "archived"} onPress={() => setFilter("archived")} />
        </Row>
        {data && (
          <Txt muted size={13}>
            {countLabel}
          </Txt>
        )}

        {loading && !data ? (
          <Loading />
        ) : goals.length === 0 && filtering ? (
          <Empty icon="search-outline" title="Nada encontrado" text="Nenhuma meta combina com a busca ou o período escolhido." />
        ) : goals.length === 0 ? (
          <Empty
            icon="flag-outline"
            title={filter === "active" ? "Nenhuma meta ativa" : "Nada por aqui"}
            text={
              filter === "active"
                ? "Defina o objetivo, a data e o passo diário. O Foco cuida do resto."
                : "Metas concluídas ou arquivadas aparecem aqui."
            }
            action={filter === "active" ? <Button title="Criar meta" icon="add" onPress={() => router.push("/goals/new")} /> : undefined}
          />
        ) : (
          <View style={{ gap: space.sm }}>
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </View>
        )}
      </Screen>
      <Fab accessibilityLabel="Nova meta" onPress={() => router.push("/goals/new")} />
      <DateRangePicker
        visible={pickerOpen}
        value={range}
        maxDate={addDays(today, 365 * 3)}
        onClose={() => setPickerOpen(false)}
        onApply={(r) => {
          setRange(r);
          setPickerOpen(false);
        }}
      />
    </View>
  );
}
