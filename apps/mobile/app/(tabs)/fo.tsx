import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { TONE_LABEL, WEEKDAY_SHORT, isValidTime, todayISO, type FoMessage, type Settings, type Tone } from "@foco/shared";
import { FoAvatar } from "@/components/fo-avatar";
import { Screen } from "@/components/screen";
import { Banner, Button, Card, Chip, Field, Input, Row, Switch, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { scheduleFoReminders } from "@/lib/notifications";
import { space, useTheme } from "@/lib/theme";
import { errorMessage } from "@/lib/use-query";

const tones: Tone[] = ["leve", "neutro", "firme"];

export default function Fo() {
  const { colors } = useTheme();
  const { user, settings, setSettings, logout } = useAuth();
  const [form, setForm] = useState<Settings | null>(settings);
  const [preview, setPreview] = useState<FoMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings && !form) setForm(settings);
  }, [settings, form]);

  useEffect(() => {
    api.fo
      .schedule(todayISO())
      .then((r) => setPreview(r.messages))
      .catch(() => {});
  }, [settings]);

  if (!form) return null;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setForm((f) => f && { ...f, [k]: v });
  const toggleRest = (d: number) =>
    set("restDays", form.restDays.includes(d) ? form.restDays.filter((x) => x !== d) : [...form.restDays, d].sort());

  const save = async () => {
    setError(null);
    setSaved(null);
    for (const k of ["reminderTime", "middayTime", "streakAlertTime"] as const) {
      if (!isValidTime(form[k])) {
        setError("Horários no formato HH:MM (ex.: 08:00).");
        return;
      }
    }
    setBusy(true);
    try {
      const updated = await api.settings.update(form);
      setSettings(updated);
      setForm(updated);
      const sched = await api.fo.schedule(todayISO());
      setPreview(sched.messages);
      const n = await scheduleFoReminders(sched.messages);
      setSaved(
        Platform.OS === "web"
          ? "Salvo. Notificações só no app do celular."
          : n > 0
            ? `Salvo. ${n} ${n === 1 ? "lembrete agendado" : "lembretes agendados"} no seu celular.`
            : "Salvo. Permita notificações pra receber os lembretes.",
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ alignItems: "center", gap: 8, paddingTop: 8 }}>
        <FoAvatar mood="wave" size={112} />
        <Txt weight="600" size={20}>
          Oi, eu sou o Fô 🌱
        </Txt>
        <Txt muted center size={14}>
          Eu lembro você dos passos do dia, comemoro as conquistas e ajusto o tom quando o dia foi puxado.
        </Txt>
      </View>

      {error && <Banner>{error}</Banner>}
      {saved && <Banner kind="info">{saved}</Banner>}

      <Card style={{ gap: space.md }}>
        <Txt weight="600" size={14}>
          Horários
        </Txt>
        <Row gap={space.sm} style={{ alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Field label="Bom dia">
              <Input value={form.reminderTime} onChangeText={(v) => set("reminderTime", v)} placeholder="08:00" maxLength={5} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Meio do dia">
              <Input value={form.middayTime} onChangeText={(v) => set("middayTime", v)} placeholder="13:00" maxLength={5} />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Sequência">
              <Input value={form.streakAlertTime} onChangeText={(v) => set("streakAlertTime", v)} placeholder="20:00" maxLength={5} />
            </Field>
          </View>
        </Row>
        <Txt muted size={12}>
          O alerta de sequência em risco só dispara se ainda faltar passo. Metas podem ter horário próprio.
        </Txt>
      </Card>

      <Card style={{ gap: space.md }}>
        <Txt weight="600" size={14}>
          Tom das mensagens
        </Txt>
        <Row gap={8}>
          {tones.map((t) => (
            <Chip key={t} label={TONE_LABEL[t]} active={form.tone === t} onPress={() => set("tone", t)} />
          ))}
        </Row>
        <Row style={{ justifyContent: "space-between" }}>
          <Txt size={14}>Comemorar troféus</Txt>
          <Switch value={form.celebrateTrophies} onChange={(v) => set("celebrateTrophies", v)} />
        </Row>
      </Card>

      <Card style={{ gap: space.md }}>
        <Txt weight="600" size={14}>
          Dias de descanso
        </Txt>
        <Txt muted size={12}>
          Nesses dias a sequência não quebra e o Fô fica em modo silencioso.
        </Txt>
        <Row gap={6} style={{ flexWrap: "wrap" }}>
          {WEEKDAY_SHORT.map((label, d) => (
            <Chip key={d} label={label} active={form.restDays.includes(d)} onPress={() => toggleRest(d)} />
          ))}
        </Row>
        <Row style={{ justifyContent: "space-between" }}>
          <Txt size={14}>Modo silencioso no descanso</Txt>
          <Switch value={form.quietOnRestDays} onChange={(v) => set("quietOnRestDays", v)} />
        </Row>
      </Card>

      <Button title="Salvar e agendar lembretes" size="lg" icon="notifications" loading={busy} onPress={save} />

      {preview.length > 0 && (
        <View style={{ gap: 8 }}>
          <Txt weight="600" size={14}>
            Hoje o Fô vai dizer
          </Txt>
          {preview.map((m, i) => (
            <Card key={i} style={{ padding: 12 }}>
              <Row gap={10} style={{ alignItems: "flex-start" }}>
                <FoAvatar mood={m.mood} size={36} animate={false} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: "space-between" }}>
                    <Txt weight="600" size={13}>
                      {m.title}
                    </Txt>
                    <Txt muted size={11}>
                      {m.time}
                    </Txt>
                  </Row>
                  <Txt muted size={13}>
                    {m.text}
                  </Txt>
                </View>
              </Row>
            </Card>
          ))}
        </View>
      )}

      <Card style={{ gap: 8 }}>
        <Row gap={10}>
          <Ionicons name="person-circle-outline" size={22} color={colors.mutedForeground} />
          <View style={{ flex: 1 }}>
            <Txt weight="500" size={14}>
              {user?.name}
            </Txt>
            <Txt muted size={12}>
              {user?.email}
            </Txt>
          </View>
        </Row>
        <Button title="Sair da conta" variant="outline" size="sm" icon="log-out-outline" onPress={logout} />
      </Card>
    </Screen>
  );
}
