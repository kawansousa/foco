import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { radius, space, useTheme } from "@/lib/theme";

/* ---------- texto ---------- */

type TxtProps = TextProps & {
  muted?: boolean;
  size?: number;
  weight?: "400" | "500" | "600" | "700";
  center?: boolean;
};

export function Txt({ muted, size = 15, weight = "400", center, style, ...rest }: TxtProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        {
          color: muted ? colors.mutedForeground : colors.foreground,
          fontSize: size,
          fontWeight: weight,
          lineHeight: size * 1.4,
        },
        center && { textAlign: "center" },
        style,
      ]}
    />
  );
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Txt size={22} weight="600" style={[{ letterSpacing: -0.4 }, style]}>
      {children}
    </Txt>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Txt muted size={11} weight="500" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
      {children}
    </Txt>
  );
}

/* ---------- superfícies ---------- */

export function Card({ children, style, soft }: { children: ReactNode; style?: StyleProp<ViewStyle>; soft?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: soft ? colors.primarySoft : colors.card,
          borderColor: soft ? "transparent" : colors.border,
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: space.lg,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}

/* ---------- botões ---------- */

type ButtonProps = PressableProps & {
  title: string;
  variant?: "primary" | "outline" | "ghost" | "destructive";
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: "md" | "lg" | "sm";
};

export function Button({ title, variant = "primary", loading, icon, size = "md", style, disabled, ...rest }: ButtonProps) {
  const { colors } = useTheme();
  const bg =
    variant === "primary"
      ? colors.primary
      : variant === "destructive"
        ? colors.destructive
        : variant === "outline"
          ? colors.card
          : "transparent";
  const fg = variant === "primary" || variant === "destructive" ? colors.primaryForeground : colors.foreground;
  const height = size === "lg" ? 52 : size === "sm" ? 36 : 46;
  return (
    <Pressable
      {...rest}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height,
          paddingHorizontal: size === "sm" ? 12 : 18,
          borderRadius: radius.md,
          backgroundColor: bg,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === "sm" ? 16 : 18} color={fg} />}
          <RNText
            style={{
              color: fg,
              fontWeight: "600",
              fontSize: size === "sm" ? 14 : 16,
            }}
          >
            {title}
          </RNText>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color,
  size = 22,
  style,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [{ padding: 6, borderRadius: 999, opacity: pressed ? 0.6 : 1 }, style]}
    >
      <Ionicons name={icon} size={size} color={color ?? colors.foreground} />
    </Pressable>
  );
}

/** Botão flutuante (canto inferior direito da tela). */
export function Fab({
  icon = "add",
  onPress,
  accessibilityLabel,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        {
          position: "absolute",
          right: space.lg,
          bottom: space.lg,
          width: 56,
          height: 56,
          borderRadius: 999,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
          shadowColor: "#000",
          shadowOpacity: 0.22,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          transform: [{ scale: pressed ? 0.94 : 1 }],
          opacity: pressed ? 0.9 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={28} color={colors.primaryForeground} />
    </Pressable>
  );
}

/* ---------- formulário ---------- */

export function Label({ children }: { children: ReactNode }) {
  return (
    <Txt size={13} weight="500" style={{ marginBottom: 6 }}>
      {children}
    </Txt>
  );
}

export function Input({ style, ...rest }: TextInputProps) {
  const { colors } = useTheme();
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      {...rest}
      style={[
        {
          height: 46,
          borderWidth: 1,
          borderColor: colors.input,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          fontSize: 15,
          color: colors.foreground,
          backgroundColor: colors.card,
        },
        rest.multiline && {
          height: 96,
          paddingTop: 12,
          textAlignVertical: "top",
        },
        style,
      ]}
    />
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <View style={{ gap: 0 }}>
      <Label>{label}</Label>
      {children}
      {hint && (
        <Txt muted size={12} style={{ marginTop: 6 }}>
          {hint}
        </Txt>
      )}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        height: 34,
        borderRadius: 999,
        borderWidth: 1,
        justifyContent: "center",
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primarySoft : colors.card,
      }}
    >
      <RNText
        style={{
          color: active ? colors.primary : colors.foreground,
          fontWeight: "500",
          fontSize: 13,
        }}
      >
        {label}
      </RNText>
    </Pressable>
  );
}

export function Switch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{
        width: 46,
        height: 28,
        borderRadius: 999,
        padding: 3,
        backgroundColor: value ? colors.primary : colors.muted,
        alignItems: value ? "flex-end" : "flex-start",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: "#fff",
        }}
      />
    </Pressable>
  );
}

/* ---------- progresso ---------- */

export function ProgressBar({ value, height = 6 }: { value: number; height?: number }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height,
        borderRadius: 999,
        backgroundColor: colors.muted,
        overflow: "hidden",
        flex: 1,
      }}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(100, value))}%`,
          height,
          borderRadius: 999,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}

export function ProgressRing({ value, size = 72, stroke = 7 }: { value: number; size?: number; stroke?: number }) {
  const { colors } = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.muted} strokeWidth={stroke} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colors.primary}
        strokeWidth={stroke}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c - (c * pct) / 100}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <SvgText x={size / 2} y={size / 2 + size * 0.07} textAnchor="middle" fontSize={size * 0.22} fontWeight="600" fill={colors.foreground}>
        {`${Math.round(pct)}%`}
      </SvgText>
    </Svg>
  );
}

/* ---------- estados ---------- */

export function Banner({ kind = "error", children }: { kind?: "error" | "info"; children: ReactNode }) {
  const { colors } = useTheme();
  const color = kind === "error" ? colors.destructive : colors.primary;
  return (
    <View
      style={{
        borderRadius: radius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: color + "55",
        backgroundColor: color + "12",
      }}
    >
      <RNText style={{ color, fontSize: 13, lineHeight: 18 }}>{children}</RNText>
    </View>
  );
}

export function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        alignItems: "center",
        gap: 8,
        paddingVertical: 40,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          backgroundColor: colors.primarySoft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Txt weight="600" size={17} center>
        {title}
      </Txt>
      <Txt muted center size={14}>
        {text}
      </Txt>
      {action && <View style={{ marginTop: 8 }}>{action}</View>}
    </View>
  );
}

export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
