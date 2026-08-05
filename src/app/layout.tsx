import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import "./theme.css";

const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-condensed", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-hand", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Denise Galvão | Fotografia de ensaios e eventos",
  description:
    "Fotografia autoral em preto e branco: ensaios em estúdio e externos, gestante, família, retratos profissionais e cobertura de eventos.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${playfair.variable} ${jakarta.variable} ${caveat.variable}`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
