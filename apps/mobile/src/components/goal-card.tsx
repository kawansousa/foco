import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import type { GoalWithProgress } from "@foco/shared";
import { ProgressBar, Row, Txt } from "./ui";
import { radius, useTheme } from "@/lib/theme";

export function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: "/goals/[id]", params: { id: goal.id } })}
      style={({ pressed }) => ({
        padding: 14,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        opacity: pressed ? 0.8 : 1,
        gap: 10,
      })}
    >
      <Row style={{ justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Txt weight="600" numberOfLines={1}>
            {goal.title}
          </Txt>
          <Txt muted size={12} numberOfLines={1}>
            Prazo · {goal.progress.dueLabel} · passo: {goal.stepTitle}
          </Txt>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </Row>
      <Row>
        <ProgressBar value={goal.progress.percent} />
        <Txt muted size={12} weight="500" style={{ width: 36, textAlign: "right" }}>
          {goal.progress.percent}%
        </Txt>
      </Row>
    </Pressable>
  );
}
