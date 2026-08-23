import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FoAvatar } from "./fo-avatar";
import { Title, Txt } from "./ui";
import { API_URL } from "@/lib/api";
import { space, useTheme } from "@/lib/theme";

/** Moldura comum das telas de login/cadastro. */
export function AuthScreen({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: space.xl,
          justifyContent: "center",
          gap: space.xl,
        }}
      >
        <View style={{ alignItems: "center", gap: space.md }}>
          <FoAvatar mood="wave" size={96} />
          <Title style={{ textAlign: "center" }}>{title}</Title>
          <Txt muted center>
            {subtitle}
          </Txt>
        </View>
        <View style={{ gap: space.lg }}>{children}</View>
        <Txt muted size={11} center>
          API: {API_URL}
        </Txt>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
