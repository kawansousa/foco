import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider as AppThemeProvider, palettes, useTheme } from "@/lib/theme";

function navTheme(dark: boolean) {
  const p = dark ? palettes.dark : palettes.light;
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: { ...base.colors, primary: p.primary, background: p.background, card: p.card, text: p.foreground, border: p.border },
  };
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const { dark, colors } = useTheme();
  return (
    <SafeAreaProvider>
      <ThemeProvider value={navTheme(dark)}>
        <AuthProvider>
          <StatusBar style={dark ? "light" : "dark"} />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerTintColor: colors.foreground,
              headerTitleStyle: { fontWeight: "600" },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="goals/new" options={{ presentation: "modal", title: "Nova meta" }} />
            <Stack.Screen name="goals/[id]" options={{ title: "Meta" }} />
            <Stack.Screen name="checkin" options={{ presentation: "modal", title: "Como foi?" }} />
            <Stack.Screen name="profile" options={{ presentation: "modal", title: "Perfil" }} />
            <Stack.Screen name="notifications" options={{ title: "Notificações" }} />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
