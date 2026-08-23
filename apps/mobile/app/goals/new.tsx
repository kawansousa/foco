import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { addDays, createGoalSchema, formatShort, isISODate, todayISO } from "@foco/shared";
import { Screen } from "@/components/screen";
import { Banner, Button, Chip, Field, Input, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { space } from "@/lib/theme";
import { errorMessage } from "@/lib/use-query";

const presets = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "42 dias", days: 42 },
  { label: "90 dias", days: 90 },
  { label: "Contínua", days: null },
] as const;

export default function NewGoal() {
  const router = useRouter();
  const today = todayISO();
  const [title, setTitle] = useState("");
  const [stepTitle, setStepTitle] = useState("");
  const [description, setDescription] = useState("");
  const [preset, setPreset] = useState<number | null | "custom">(42);
  const [customDate, setCustomDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const dueDate = preset === "custom" ? customDate.trim() : preset === null ? null : addDays(today, preset);

  const submit = async () => {
    setError(null);
    if (preset === "custom" && !isISODate(customDate.trim())) {
      setError("Data do prazo inválida (use AAAA-MM-DD).");
      return;
    }
    const parsed = createGoalSchema.safeParse({
      title,
      stepTitle,
      description: description.trim() || null,
      startDate: today,
      dueDate,
      reminderTime: reminderTime.trim() || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados.");
      return;
    }
    setBusy(true);
    try {
      await api.goals.create(parsed.data);
      router.back();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <Screen inStack>
      {error && <Banner>{error}</Banner>}

      <Field label="Meta" hint="Ex.: “Correr 10 km”, “12 livros no ano”.">
        <Input value={title} onChangeText={setTitle} placeholder="O que você quer alcançar?" maxLength={80} />
      </Field>

      <Field label="Passo diário" hint="O que você vai marcar como feito todo dia.">
        <Input value={stepTitle} onChangeText={setStepTitle} placeholder="Ex.: Correr 3 km" maxLength={80} />
      </Field>

      <View>
        <Txt size={13} weight="500" style={{ marginBottom: 6 }}>
          Prazo
        </Txt>
        <Row gap={8} style={{ flexWrap: "wrap" }}>
          {presets.map((p) => (
            <Chip key={p.label} label={p.label} active={preset === p.days} onPress={() => setPreset(p.days)} />
          ))}
          <Chip label="Escolher data" active={preset === "custom"} onPress={() => setPreset("custom")} />
        </Row>
        {preset === "custom" ? (
          <Input value={customDate} onChangeText={setCustomDate} placeholder="AAAA-MM-DD" style={{ marginTop: 10 }} autoCapitalize="none" />
        ) : (
          <Txt muted size={12} style={{ marginTop: 8 }}>
            {dueDate ? `Termina em ${formatShort(dueDate)} · começa hoje` : "Hábito sem data final · o progresso olha os últimos 30 dias"}
          </Txt>
        )}
      </View>

      <Field label="Lembrete desta meta (opcional)" hint="Horário HH:MM. Vazio = usa o horário do Fô.">
        <Input value={reminderTime} onChangeText={setReminderTime} placeholder="07:30" keyboardType="numbers-and-punctuation" maxLength={5} />
      </Field>

      <Field label="Por que essa meta? (opcional)">
        <Input value={description} onChangeText={setDescription} multiline placeholder="O que muda quando você chegar lá?" maxLength={500} />
      </Field>

      <View style={{ gap: space.sm, marginTop: space.sm }}>
        <Button title="Criar meta" size="lg" icon="flag" loading={busy} onPress={submit} disabled={!title || !stepTitle} />
        <Button title="Cancelar" variant="ghost" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
