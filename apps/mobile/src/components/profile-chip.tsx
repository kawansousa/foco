import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Avatar } from "./avatar";
import { Txt } from "./ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

/** Chip do canto superior: foto + primeiro nome + troféus. Toca → tela de perfil. */
export function ProfileChip() {
  const { colors } = useTheme();
  const { user, trophyCount } = useAuth();
  const router = useRouter();
  if (!user) return null;
  const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

  return (
    <Pressable
      onPress={() => router.push("/profile")}
      accessibilityRole="button"
      accessibilityLabel={`Perfil de ${user.name}, ${trophyCount} troféus`}
      hitSlop={6}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 4,
        paddingLeft: 4,
        paddingRight: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Avatar user={user} size={34} />
      <View>
        <Txt weight="600" size={13} numberOfLines={1} style={{ maxWidth: 110, lineHeight: 16 }}>
          {firstName}
        </Txt>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Ionicons name="trophy" size={11} color={colors.orange} />
          <Txt muted size={11} weight="500" style={{ lineHeight: 14 }}>
            {trophyCount} {trophyCount === 1 ? "troféu" : "troféus"}
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}
