import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { registerSchema } from "@foco/shared";
import { AuthScreen } from "@/components/auth-screen";
import { Banner, Button, Field, Input, Txt } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { errorMessage } from "@/lib/use-query";

export default function Register() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const parsed = registerSchema.safeParse({ name, email: email.trim(), password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira os dados.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await register(parsed.data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title="Criar conta" subtitle="Grátis. Sem cartão. Seus dados são seus.">
      {error && <Banner>{error}</Banner>}
      <Field label="Como quer ser chamado?">
        <Input value={name} onChangeText={setName} placeholder="Seu nome" autoComplete="name" textContentType="name" />
      </Field>
      <Field label="E-mail">
        <Input
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="voce@exemplo.com"
          textContentType="emailAddress"
        />
      </Field>
      <Field label="Senha" hint="Pelo menos 8 caracteres.">
        <Input
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          textContentType="newPassword"
          onSubmitEditing={submit}
        />
      </Field>
      <Button title="Começar" size="lg" loading={busy} onPress={submit} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
        <Txt muted size={14}>
          Já tem conta?
        </Txt>
        <Link href="/(auth)/login">
          <Txt size={14} weight="600" style={{ color: colors.primary }}>
            Entrar
          </Txt>
        </Link>
      </View>
    </AuthScreen>
  );
}
