import { useColorScheme } from "react-native";

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

export function useTheme(): { colors: Palette; dark: boolean } {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  return { colors: dark ? palettes.dark : palettes.light, dark };
}

export const tierGradient: Record<"bronze" | "prata" | "ouro", [string, string]> = {
  bronze: ["#a5ecbd", "#2db35d"],
  prata: ["#3bcf70", "#2f9e5a"],
  ouro: ["#2db35d", "#1f7a45"],
};
