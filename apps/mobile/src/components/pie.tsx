import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { Txt } from "./ui";
import { useTheme } from "@/lib/theme";

export type PieSlice = { value: number; color: string; label: string };

/**
 * Gráfico de pizza (donut) simples com react-native-svg.
 * Fatias com valor 0 são ignoradas; se tudo for 0, mostra um anel apagado.
 */
export function Pie({
  slices,
  size = 120,
  thickness = 26,
  centerLabel,
}: {
  slices: PieSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
}) {
  const { colors } = useTheme();
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);

  let acc = 0;
  const arcs = slices
    .filter((s) => s.value > 0)
    .map((s, i) => {
      const frac = s.value / total;
      const arc = { ...s, start: acc, frac, key: `${s.label}-${i}` };
      acc += frac;
      return arc;
    });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {total === 0 ? (
            <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.muted} strokeWidth={thickness} fill="none" />
          ) : (
            arcs.map((a) => (
              <Circle
                key={a.key}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={a.color}
                strokeWidth={thickness}
                fill="none"
                strokeDasharray={`${Math.max(a.frac * c - 1.5, 0.5)} ${c}`}
                strokeDashoffset={-a.start * c}
                strokeLinecap="butt"
              />
            ))
          )}
        </G>
      </Svg>
      {centerLabel != null && (
        <View style={{ position: "absolute", alignItems: "center" }}>
          <Txt weight="600" size={16}>
            {centerLabel}
          </Txt>
        </View>
      )}
    </View>
  );
}

/** Linha de legenda: bolinha colorida + rótulo + valor. */
export function PieLegend({ slices, total }: { slices: PieSlice[]; total: number }) {
  return (
    <View style={{ gap: 6, flex: 1 }}>
      {slices.map((s) => (
        <View key={s.label} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: s.color }} />
          <Txt size={13} style={{ flex: 1 }}>
            {s.label}
          </Txt>
          <Txt muted size={12} weight="500">
            {s.value} {total > 0 ? `· ${Math.round((s.value / total) * 100)}%` : ""}
          </Txt>
        </View>
      ))}
    </View>
  );
}
