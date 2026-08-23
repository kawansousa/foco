import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { useTheme } from "@/lib/theme";

/**
 * Sino do canto superior. Mostra um ponto quando os lembretes ainda não
 * estão ativos no aparelho (sem permissão ou nada agendado).
 */
export function NotificationsBell() {
  const { colors } = useTheme();
  const router = useRouter();
  const [attention, setAttention] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        if (Platform.OS === "web") return;
        try {
          const perm = await Notifications.getPermissionsAsync();
          const scheduled = perm.granted ? await Notifications.getAllScheduledNotificationsAsync() : [];
          if (alive) setAttention(!perm.granted || scheduled.length === 0);
        } catch {
          if (alive) setAttention(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <Pressable
      onPress={() => router.push("/notifications")}
      accessibilityRole="button"
      accessibilityLabel="Notificações"
      hitSlop={6}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name="notifications-outline" size={20} color={colors.foreground} />
      {attention && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 9,
            width: 9,
            height: 9,
            borderRadius: 999,
            backgroundColor: colors.orange,
            borderWidth: 1.5,
            borderColor: colors.card,
          }}
        />
      )}
    </Pressable>
  );
}
