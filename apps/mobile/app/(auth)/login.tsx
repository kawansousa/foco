import { Link } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { AuthScreen } from "@/components/auth-screen";
import { Banner, Button, Field, Input, Txt } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { errorMessage } from "@/lib/use-query";

export default function Login() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login({ email: email.trim(), password });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthScreen title="Bem-vindo de volta" subtitle="Entre pra ver os passos de hoje.">
      {error && <Banner>{error}</Banner>}
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
      <Field label="Senha">
        <Input
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          textContentType="password"
          onSubmitEditing={submit}
        />
      </Field>
      <Button title="Entrar" size="lg" loading={busy} onPress={submit} disabled={!email || !password} />
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4 }}>
        <Txt muted size={14}>
          Ainda não tem conta?
        </Txt>
        <Link href="/(auth)/register">
          <Txt size={14} weight="600" style={{ color: colors.primary }}>
            Criar conta
          </Txt>
        </Link>
      </View>
    </AuthScreen>
  );
}
