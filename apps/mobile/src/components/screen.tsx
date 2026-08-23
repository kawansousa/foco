import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Eyebrow, Title } from "./ui";
import { space, useTheme } from "@/lib/theme";

type Props = {
  eyebrow?: string;
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** sem safe-area no topo (telas com header nativo) */
  inStack?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ eyebrow, title, right, children, refreshing = false, onRefresh, inStack, contentStyle }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        {
          paddingTop: inStack ? space.lg : insets.top + space.md,
          paddingBottom: space.xxl + insets.bottom,
          paddingHorizontal: space.lg,
          gap: space.lg,
        },
        contentStyle,
      ]}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
      keyboardShouldPersistTaps="handled"
    >
      {(title || right) && (
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: space.md }}>
          <View style={{ flex: 1 }}>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <Title>{title}</Title>}
          </View>
          {right}
        </View>
      )}
      {children}
    </ScrollView>
  );
}
