import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Caveat } from "next/font/google";
import "./globals.css";
import "./theme.css";
import { Footer } from "./_components/Footer";
import { PreviewOverlay } from "./_components/PreviewOverlay";

const playfair = Playfair_Display({ variable: "--font-display", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-condensed", subsets: ["latin"] });
const caveat = Caveat({ variable: "--font-hand", subsets: ["latin"] });

const appUrl = "https://denisegalvao.com.br"; // TODO: substituir pelo domínio real quando definido

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Denise Galvão | Fotografia de ensaios e eventos",
  description:
    "Valorize sua imagem com um ensaio pensado nos mínimos detalhes, unindo direção estratégica, estética e autenticidade. Cada sessão é conduzida de forma personalizada, respeitando seu estilo, objetivo e essência.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${playfair.variable} ${jakarta.variable} ${caveat.variable}`}>
      <body className="font-sans antialiased">
        <PreviewOverlay />
        {children}
        <Footer />
      </body>
    </html>
  );
}
