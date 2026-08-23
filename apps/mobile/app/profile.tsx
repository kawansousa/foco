import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, View } from "react-native";
import { Avatar } from "@/components/avatar";
import { Screen } from "@/components/screen";
import { Banner, Button, Card, Chip, Field, Input, Row, Txt } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { THEME_PREF_LABEL, radius, space, useTheme, useThemePref, type ThemePref } from "@/lib/theme";
import { errorMessage } from "@/lib/use-query";

const AVATAR_PX = 256;

/** Redimensiona para 256x256 JPEG e devolve como data URL (cabe no limite da API). */
async function toDataUrl(uri: string): Promise<string> {
  const ctx = ImageManipulator.ImageManipulator.manipulate(uri);
  ctx.resize({ width: AVATAR_PX, height: AVATAR_PX });
  const ref = await ctx.renderAsync();
  const out = await ref.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 0.8,
    base64: true,
  });
  if (!out.base64) throw new Error("Não foi possível processar a imagem.");
  return `data:image/jpeg;base64,${out.base64}`;
}

export default function Profile() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, trophyCount, updateProfile, logout } = useAuth();
  const { pref: themePref, setPref: setThemePref } = useThemePref();
  const [name, setName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState<"photo" | "name" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.9,
  };

  const applyPhoto = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets[0]) return;
    setBusy("photo");
    setError(null);
    try {
      await updateProfile({ avatar: await toDataUrl(result.assets[0].uri) });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const fromLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError("Permita o acesso às fotos para escolher uma imagem.");
      return;
    }
    await applyPhoto(await ImagePicker.launchImageLibraryAsync(pickerOptions));
  };

  const fromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setError("Permita o acesso à câmera para tirar uma foto.");
      return;
    }
    await applyPhoto(await ImagePicker.launchCameraAsync(pickerOptions));
  };

  const removePhoto = async () => {
    setBusy("photo");
    setError(null);
    try {
      await updateProfile({ avatar: null });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const choosePhoto = () => {
    if (Platform.OS === "web") {
      void fromLibrary();
      return;
    }
    Alert.alert("Foto de perfil", undefined, [
      { text: "Escolher da galeria", onPress: () => void fromLibrary() },
      { text: "Tirar foto", onPress: () => void fromCamera() },
      ...(user.avatar
        ? [
            {
              text: "Remover foto",
              style: "destructive" as const,
              onPress: () => void removePhoto(),
            },
          ]
        : []),
      { text: "Cancelar", style: "cancel" as const },
    ]);
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed === user.name) return;
    setBusy("name");
    setError(null);
    try {
      await updateProfile({ name: trimmed });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const nameDirty = name.trim() !== user.name;

  return (
    <Screen inStack>
      {error && <Banner>{error}</Banner>}

      <View
        style={{
          alignItems: "center",
          gap: space.md,
          paddingVertical: space.sm,
        }}
      >
        <Pressable onPress={choosePhoto} disabled={busy === "photo"} accessibilityLabel="Alterar foto de perfil" hitSlop={6}>
          <Avatar user={user} size={112} />
          <View
            style={{
              position: "absolute",
              right: 0,
              bottom: 0,
              width: 34,
              height: 34,
              borderRadius: 999,
              backgroundColor: colors.primary,
              borderWidth: 3,
              borderColor: colors.background,
              alignItems: "center",
              justifyContent: "center",
              opacity: busy === "photo" ? 0.5 : 1,
            }}
          >
            <Ionicons name="camera" size={16} color={colors.primaryForeground} />
          </View>
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Txt weight="600" size={20}>
            {user.name}
          </Txt>
          <Txt muted size={13}>
            {user.email}
          </Txt>
        </View>
        <Button
          title={busy === "photo" ? "Enviando…" : user.avatar ? "Trocar foto" : "Adicionar foto"}
          variant="outline"
          size="sm"
          icon="image-outline"
          loading={busy === "photo"}
          onPress={choosePhoto}
        />
      </View>

      <Pressable
        onPress={() => {
          router.back();
          router.push("/(tabs)/trophies");
        }}
        accessibilityRole="button"
        accessibilityLabel="Ver troféus"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <Card>
          <Row gap={space.md}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: radius.md,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="trophy" size={24} color={colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="600" size={22} style={{ letterSpacing: -0.4 }}>
                {trophyCount}
              </Txt>
              <Txt muted size={13}>
                {trophyCount === 1 ? "troféu conquistado" : "troféus conquistados"}
              </Txt>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Row>
        </Card>
      </Pressable>

      <Field label="Nome">
        <Input
          value={name}
          onChangeText={setName}
          placeholder="Seu nome"
          maxLength={60}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={saveName}
        />
      </Field>
      {nameDirty && <Button title="Salvar nome" loading={busy === "name"} onPress={saveName} />}

      <Field label="Aparência" hint="Sistema segue o modo claro/escuro do aparelho.">
        <Row gap={8}>
          {(["system", "light", "dark"] as ThemePref[]).map((p) => (
            <Chip key={p} label={THEME_PREF_LABEL[p]} active={themePref === p} onPress={() => setThemePref(p)} />
          ))}
        </Row>
      </Field>

      <View style={{ marginTop: space.lg, gap: space.sm }}>
        <Button
          title="Sair da conta"
          variant="outline"
          icon="log-out-outline"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/login");
          }}
        />
      </View>
    </Screen>
  );
}
