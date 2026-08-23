import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Foco — metas com prazo, progresso dia a dia, troféus de verdade",
  description:
    "Defina metas com prazo, marque o que concluiu todo dia, registre como foi e conquiste troféus. Seu avanço pessoal, um passo por vez.",
  openGraph: {
    title: "Foco — avanço pessoal, um passo por vez",
    description:
      "Metas com prazo, check-in diário, diário de dificuldade e troféus. Com o Fô, seu lembrete amigável.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
