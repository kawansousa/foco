import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { FoMessage } from "@foco/shared";

/**
 * Lembretes do Fô como notificações locais. A API devolve a agenda do dia
 * (`/fo/schedule`) já com o tom escolhido; aqui só agendamos os horários.
 */

let configured = false;

function configureHandler() {
  if (configured || Platform.OS === "web") return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  configureHandler();
  if (!Device.isDevice) return false; // simulador não entrega notificações locais com confiança
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function cancelFoReminders() {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    /* ignore */
  }
}

/**
 * Agenda as mensagens do dia como notificações diárias recorrentes
 * (mesmo horário todo dia). Mensagens sem horário são ignoradas.
 */
export async function scheduleFoReminders(messages: FoMessage[]): Promise<number> {
  if (Platform.OS === "web") return 0;
  const ok = await ensureNotificationPermission();
  if (!ok) return 0;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("fo", {
      name: "Lembretes do Fô",
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: "#2f9e5a",
    });
  }

  await cancelFoReminders();
  let count = 0;
  for (const m of messages) {
    if (!m.time) continue;
    const [hour, minute] = m.time.split(":").map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: m.title, body: m.text, data: { kind: m.kind }, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: "fo",
      },
    });
    count++;
  }
  return count;
}
