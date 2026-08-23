import type { ReactNode } from "react";
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationsBell } from "./notifications-bell";
import { ProfileChip } from "./profile-chip";
import { Eyebrow, Title } from "./ui";
import { space, useTheme } from "@/lib/theme";

type Props = {
  eyebrow?: string;
  title?: string;
  /** conteúdo extra do cabeçalho fixo, entre o título e os ícones */
  right?: ReactNode;
  /** esconde o chip de perfil padrão */
  hideProfile?: boolean;
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** sem safe-area no topo (telas com header nativo) */
  inStack?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ eyebrow, title, right, hideProfile, children, refreshing = false, onRefresh, inStack, contentStyle }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Abas: perfil + sino no canto superior direito, ao lado do título.
  const showTopBar = !inStack && !hideProfile;
  const hasHeader = !inStack && (!!title || !!right || showTopBar);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Cabeçalho fixo: título + sino + perfil não rolam com o conteúdo. */}
      {hasHeader && (
        <View
          style={{
            paddingTop: insets.top + space.md,
            paddingHorizontal: space.lg,
            paddingBottom: space.md,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: space.md,
            backgroundColor: colors.background,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <Title>{title}</Title>}
          </View>
          {right}
          {showTopBar && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
              <NotificationsBell />
              <ProfileChip />
            </View>
          )}
        </View>
      )}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          {
            paddingTop: inStack || hasHeader ? space.lg : insets.top + space.md,
            paddingBottom: space.xxl + insets.bottom,
            paddingHorizontal: space.lg,
            gap: space.lg,
          },
          contentStyle,
        ]}
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}
