import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { todayISO } from "@foco/shared";
import { Screen } from "@/components/screen";
import { GoalCard } from "@/components/goal-card";
import { Banner, Button, Chip, Empty, Loading, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { space, useTheme } from "@/lib/theme";
import { useQuery } from "@/lib/use-query";

type Filter = "active" | "done" | "archived";

export default function Goals() {
  const { colors } = useTheme();
  const router = useRouter();
  const date = todayISO();
  const [filter, setFilter] = useState<Filter>("active");
  const { data, error, loading, refreshing, refresh } = useQuery(() => api.goals.list({ date }), [date]);

  const goals = (data?.goals ?? []).filter((g) => g.status === filter);
  const activeCount = data?.goals.filter((g) => g.status === "active").length ?? 0;

  return (
    <Screen
      eyebrow={`${activeCount} ${activeCount === 1 ? "ativa" : "ativas"}`}
      title="Suas metas"
      refreshing={refreshing}
      onRefresh={refresh}
      right={
        <Link href="/goals/new" asChild>
          <Pressable hitSlop={8} style={{ padding: 6 }} accessibilityLabel="Nova meta">
            <Ionicons name="add-circle" size={30} color={colors.primary} />
          </Pressable>
        </Link>
      }
    >
      {error && <Banner>{error}</Banner>}
      <Row gap={8}>
        <Chip label="Ativas" active={filter === "active"} onPress={() => setFilter("active")} />
        <Chip label="Concluídas" active={filter === "done"} onPress={() => setFilter("done")} />
        <Chip label="Arquivadas" active={filter === "archived"} onPress={() => setFilter("archived")} />
      </Row>

      {loading && !data ? (
        <Loading />
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
  );
}
