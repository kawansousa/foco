import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Platform, View } from "react-native";
import { todayISO, type FoMessage } from "@foco/shared";
import { FoAvatar } from "@/components/fo-avatar";
import { Screen } from "@/components/screen";
import { Banner, Button, Card, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { scheduleFoReminders } from "@/lib/notifications";
import { radius, space, useTheme } from "@/lib/theme";
import { errorMessage } from "@/lib/use-query";

type Perm = "granted" | "denied" | "undetermined" | "web";

/** Central de notificações: permissão, lembretes do Fô agendados e atalho para ajustar horários. */
export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [perm, setPerm] = useState<Perm>(Platform.OS === "web" ? "web" : "undetermined");
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);
  const [agenda, setAgenda] = useState<FoMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        const p = await Notifications.getPermissionsAsync();
        setPerm(p.granted ? "granted" : p.canAskAgain ? "undetermined" : "denied");
        setScheduledCount(p.granted ? (await Notifications.getAllScheduledNotificationsAsync()).length : 0);
      } catch {
        setPerm("denied");
        setScheduledCount(0);
      }
    }
    try {
      const r = await api.fo.schedule(todayISO());
      setAgenda(r.messages.filter((m) => m.time));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activate = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const r = await api.fo.schedule(todayISO());
      const n = await scheduleFoReminders(r.messages);
      if (n === 0) {
        const p = await Notifications.getPermissionsAsync();
        if (!p.granted) {
          setInfo("Sem permissão. Libere as notificações do Foco nos Ajustes do aparelho.");
        } else {
          setInfo("Nenhum lembrete com horário para agendar.");
        }
      } else {
        setInfo(`${n} ${n === 1 ? "lembrete agendado" : "lembretes agendados"} no aparelho.`);
      }
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const active = perm === "granted" && (scheduledCount ?? 0) > 0;

  return (
    <Screen inStack>
      {error && <Banner>{error}</Banner>}
      {info && <Banner kind="info">{info}</Banner>}

      <Card soft>
        <Row gap={space.md}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.md,
              backgroundColor: active ? colors.primary + "22" : colors.muted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name={active ? "notifications" : "notifications-off-outline"}
              size={22}
              color={active ? colors.primary : colors.mutedForeground}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="600">{statusTitle(perm, scheduledCount)}</Txt>
            <Txt muted size={13}>
              {statusText(perm, scheduledCount)}
            </Txt>
          </View>
        </Row>
      </Card>

      {perm === "denied" ? (
        <Button title="Abrir ajustes do aparelho" icon="settings-outline" variant="outline" onPress={() => Linking.openSettings()} />
      ) : perm !== "web" ? (
        <Button
          title={active ? "Reagendar lembretes" : "Ativar lembretes"}
          icon={active ? "refresh" : "notifications-outline"}
          loading={busy}
          onPress={activate}
        />
      ) : null}

      <View style={{ gap: space.sm }}>
        <Txt weight="600" size={14}>
          Lembretes de hoje
        </Txt>
        {agenda.length === 0 ? (
          <Txt muted size={13}>
            Nenhum lembrete com horário para hoje.
          </Txt>
        ) : (
          agenda.map((m, i) => (
            <Card key={`${m.kind}-${i}`} style={{ padding: 12 }}>
              <Row gap={space.md} style={{ alignItems: "flex-start" }}>
                <FoAvatar mood={m.mood} size={36} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Txt weight="600" size={14}>
                      {m.title}
                    </Txt>
                    <Txt muted size={12} weight="500">
                      {m.time}
                    </Txt>
                  </Row>
                  <Txt size={13} muted style={{ marginTop: 2 }}>
                    {m.text}
                  </Txt>
                </View>
              </Row>
            </Card>
          ))
        )}
      </View>

      <Button
        title="Ajustar horários e tom do Fô"
        variant="ghost"
        icon="options-outline"
        onPress={() => {
          router.back();
          router.push("/(tabs)/fo");
        }}
      />
    </Screen>
  );
}

function statusTitle(perm: Perm, count: number | null): string {
  if (perm === "web") return "Indisponível no navegador";
  if (perm === "denied") return "Notificações bloqueadas";
  if (perm === "undetermined") return "Lembretes desativados";
  if (!count) return "Permitido, nada agendado";
  return `${count} ${count === 1 ? "lembrete ativo" : "lembretes ativos"}`;
}

function statusText(perm: Perm, count: number | null): string {
  if (perm === "web") return "Os lembretes do Fô funcionam no app do celular.";
  if (perm === "denied") return "Libere nos Ajustes para receber os lembretes do Fô.";
  if (perm === "undetermined") return "Ative para o Fô te lembrar dos seus passos todo dia.";
  if (!count) return "Toque em reagendar para criar os lembretes no aparelho.";
  return "O Fô vai te avisar nos horários abaixo, todo dia.";
}
