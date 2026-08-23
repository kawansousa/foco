import { View } from "react-native";
import { Txt } from "./ui";
import { useTheme } from "@/lib/theme";

export type Bar = { label: string; value: number; max?: number; muted?: boolean; highlight?: boolean };

/**
 * Gráfico de barras simples (sem lib): `value` de 0 a `max` (padrão 1).
 */
export function Bars({ data, height = 96, showLabels = true }: { data: Bar[]; height?: number; showLabels?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height }}>
        {data.map((b, i) => {
          const max = b.max ?? 1;
          const pct = max > 0 ? Math.max(0, Math.min(1, b.value / max)) : 0;
          return (
            <View key={i} style={{ flex: 1, height: "100%", justifyContent: "flex-end" }}>
              <View
                style={{
                  height: Math.max(3, pct * height),
                  borderRadius: 4,
                  backgroundColor: b.muted ? colors.muted : b.highlight ? colors.chart2 : colors.primary,
                  opacity: b.muted ? 1 : 0.55 + pct * 0.45,
                }}
              />
            </View>
          );
        })}
      </View>
      {showLabels && (
        <View style={{ flexDirection: "row", gap: 4 }}>
          {data.map((b, i) => (
            <Txt key={i} muted size={10} center style={{ flex: 1 }} numberOfLines={1}>
              {b.label}
            </Txt>
          ))}
        </View>
      )}
    </View>
  );
}
