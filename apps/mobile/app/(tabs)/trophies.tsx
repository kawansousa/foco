import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { TIER_LABEL, formatShort, type TrophyDef, type TrophyView } from "@foco/shared";
import { Screen } from "@/components/screen";
import { Banner, Button, Card, Field, Input, Loading, Row, Txt } from "@/components/ui";
import { api } from "@/lib/api";
import { radius, space, tierGradient, useTheme } from "@/lib/theme";
import { errorMessage, useQuery } from "@/lib/use-query";

const iconFor: Record<TrophyDef["icon"], keyof typeof Ionicons.glyphMap> = {
  Sunrise: "sunny",
  Flame: "flame",
  Mountain: "trending-up",
  Calendar: "calendar",
  Medal: "medal",
  Zap: "flash",
  Crown: "star",
  Lock: "lock-closed",
  Coffee: "cafe",
};

export default function Trophies() {
  const { colors } = useTheme();
  const { data, error, loading, refreshing, refresh, setData } = useQuery(() => api.trophies.list(), []);
  const [selected, setSelected] = useState<TrophyView | null>(null);

  if (loading && !data) return <Loading />;
  const list = data?.trophies ?? [];
  const earned = list.filter((t) => t.earned).length;

  return (
    <Screen eyebrow={`${earned} de ${list.length}`} title="Troféus" refreshing={refreshing} onRefresh={refresh}>
      {error && <Banner>{error}</Banner>}
      <Txt muted size={13}>
        Cada conquista guarda a data, o contexto e o seu comentário.
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
        {list.map((t, i) => {
          const locked = !t.earned;
          const hidden = locked && t.secret;
          const [from, to] = tierGradient[t.tier];
          return (
            <Pressable
              key={`${t.code}-${t.earned?.id ?? i}`}
              onPress={() => !locked && setSelected(t)}
              style={({ pressed }) => ({
                width: "48%",
                flexGrow: 1,
                alignItems: "center",
                padding: 14,
                gap: 6,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                opacity: locked ? 0.55 : pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 999,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: locked ? colors.muted : to,
                  borderWidth: locked ? 0 : 3,
                  borderColor: from,
                }}
              >
                <Ionicons name={hidden ? "lock-closed" : iconFor[t.icon]} size={24} color={locked ? colors.mutedForeground : "#fff"} />
              </View>
              <Txt weight="600" size={13} center>
                {hidden ? "???" : t.name}
              </Txt>
              <Txt muted size={11} center>
                {hidden ? "Conquista secreta" : t.desc}
              </Txt>
              <Txt muted size={10} weight="500" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
                {t.earned ? `${formatShort(t.earned.date)} · ${TIER_LABEL[t.tier]}` : "Bloqueado"}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      <TrophySheet
        trophy={selected}
        onClose={() => setSelected(null)}
        onSaved={(updated) => {
          setData((d) => d && { trophies: d.trophies.map((t) => (t.earned?.id === updated.earned?.id ? updated : t)) });
          setSelected(null);
        }}
      />
    </Screen>
  );
}

function TrophySheet({ trophy, onClose, onSaved }: { trophy: TrophyView | null; onClose: () => void; onSaved: (t: TrophyView) => void }) {
  const { colors } = useTheme();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastId, setLastId] = useState<string | null>(null);

  if (trophy?.earned && trophy.earned.id !== lastId) {
    setLastId(trophy.earned.id);
    setNote(trophy.earned.note ?? "");
    setError(null);
  }

  const save = async () => {
    if (!trophy?.earned) return;
    setBusy(true);
    try {
      const earned = await api.trophies.update(trophy.earned.id, { note: note.trim() || null });
      onSaved({ ...trophy, earned });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={!!trophy} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "#0008" }} onPress={onClose} />
      <View style={{ backgroundColor: colors.background, padding: space.xl, gap: space.lg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: 40 }}>
        {trophy?.earned && (
          <>
            <Row gap={space.md}>
              <View style={{ width: 48, height: 48, borderRadius: 999, backgroundColor: tierGradient[trophy.tier][1], alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={iconFor[trophy.icon]} size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="600" size={17}>
                  {trophy.name}
                </Txt>
                <Txt muted size={13}>
                  {trophy.desc} · conquistado em {formatShort(trophy.earned.date)}
                </Txt>
              </View>
            </Row>
            {error && <Banner>{error}</Banner>}
            <Field label="Seu comentário sobre esse dia">
              <Input value={note} onChangeText={setNote} multiline placeholder="Como foi chegar aqui?" maxLength={300} />
            </Field>
            <Card soft style={{ padding: 12 }}>
              <Txt size={13}>Esse registro fica junto do troféu — a história da conquista, não só o ícone.</Txt>
            </Card>
            <Button title="Salvar" loading={busy} onPress={save} />
            <Button title="Fechar" variant="ghost" onPress={onClose} />
          </>
        )}
      </View>
    </Modal>
  );
}
