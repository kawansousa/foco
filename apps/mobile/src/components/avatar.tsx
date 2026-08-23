import { Image, View } from "react-native";
import type { User } from "@foco/shared";
import { Txt } from "./ui";
import { useTheme } from "@/lib/theme";

/** Iniciais do nome ("Kawan Sousa" → "KS"). */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/** Foto de perfil; cai para as iniciais quando o usuário ainda não escolheu uma foto. */
export function Avatar({ user, size = 36, uri }: { user: Pick<User, "name" | "avatar"> | null; size?: number; uri?: string | null }) {
  const { colors } = useTheme();
  const src = uri !== undefined ? uri : user?.avatar;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        overflow: "hidden",
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.primary + "55",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {src ? (
        <Image source={{ uri: src }} style={{ width: size, height: size }} resizeMode="cover" accessibilityIgnoresInvertColors />
      ) : (
        <Txt weight="600" size={size * 0.38} style={{ color: colors.primary, lineHeight: size * 0.5 }}>
          {initialsOf(user?.name ?? "")}
        </Txt>
      )}
    </View>
  );
}
