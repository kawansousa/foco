import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Appearance, Platform, useColorScheme } from "react-native";

export type Palette = {
  background: string;
  foreground: string;
  card: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  destructive: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  orange: string;
};

/** Mesma paleta do site (globals.css), convertida de oklch para hex. */
export const palettes: Record<"light" | "dark", Palette> = {
  light: {
    background: "#ffffff",
    foreground: "#0a0a0a",
    card: "#ffffff",
    muted: "#f5f5f5",
    mutedForeground: "#737373",
    border: "#e5e5e5",
    input: "#e5e5e5",
    primary: "#2f9e5a",
    primaryForeground: "#f3fbf5",
    primarySoft: "#e8f5ec",
    destructive: "#dc2626",
    chart1: "#a5ecbd",
    chart2: "#3bcf70",
    chart3: "#2db35d",
    chart4: "#2f9e5a",
    chart5: "#1f7a45",
    orange: "#f97316",
  },
  dark: {
    background: "#0f1512",
    foreground: "#fafafa",
    card: "#18201b",
    muted: "#212b25",
    mutedForeground: "#a3a3a3",
    border: "#2a342e",
    input: "#2f3a33",
    primary: "#3bb36c",
    primaryForeground: "#f3fbf5",
    primarySoft: "#17301f",
    destructive: "#ef4444",
    chart1: "#a5ecbd",
    chart2: "#3bcf70",
    chart3: "#2db35d",
    chart4: "#2f9e5a",
    chart5: "#1f7a45",
    orange: "#fb923c",
  },
};

export const radius = { sm: 10, md: 14, lg: 20, xl: 26 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/* ---------- preferência de tema (sistema / claro / escuro) ---------- */

export type ThemePref = "system" | "light" | "dark";
export const THEME_PREF_LABEL: Record<ThemePref, string> = { system: "Sistema", light: "Claro", dark: "Escuro" };
const THEME_KEY = "foco.theme";

async function readPref(): Promise<ThemePref> {
  try {
    const raw = Platform.OS === "web" ? globalThis.localStorage?.getItem(THEME_KEY) : await SecureStore.getItemAsync(THEME_KEY);
    return raw === "light" || raw === "dark" ? raw : "system";
  } catch {
    return "system";
  }
}

async function writePref(pref: ThemePref) {
  try {
    if (Platform.OS === "web") globalThis.localStorage?.setItem(THEME_KEY, pref);
    else await SecureStore.setItemAsync(THEME_KEY, pref);
  } catch {
    /* fica só em memória */
  }
}

/** Força o esquema nos componentes nativos (Alert, teclado, etc.). */
function applyNative(pref: ThemePref) {
  try {
    Appearance.setColorScheme(pref === "system" ? "unspecified" : pref);
  } catch {
    /* não suportado nesta plataforma */
  }
}

type ThemeCtx = { pref: ThemePref; setPref: (p: ThemePref) => void; ready: boolean };
const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readPref().then((p) => {
      setPrefState(p);
      applyNative(p);
      setReady(true);
    });
  }, []);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    applyNative(p);
    void writePref(p);
  }, []);

  const value = useMemo(() => ({ pref, setPref, ready }), [pref, setPref, ready]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Preferência atual e setter (para a tela de Perfil). */
export function useThemePref(): ThemeCtx {
  return useContext(ThemeContext) ?? { pref: "system", setPref: () => {}, ready: true };
}

export function useTheme(): { colors: Palette; dark: boolean } {
  const scheme = useColorScheme();
  const pref = useContext(ThemeContext)?.pref ?? "system";
  const dark = pref === "system" ? scheme === "dark" : pref === "dark";
  return { colors: dark ? palettes.dark : palettes.light, dark };
}

export const tierGradient: Record<"bronze" | "prata" | "ouro", [string, string]> = {
  bronze: ["#a5ecbd", "#2db35d"],
  prata: ["#3bcf70", "#2f9e5a"],
  ouro: ["#2db35d", "#1f7a45"],
};
