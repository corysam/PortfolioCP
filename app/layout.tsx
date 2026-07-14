import type { Metadata } from "next";
import { Tomorrow, Red_Hat_Display } from "next/font/google";
import "./globals.css";

const tomorrow = Tomorrow({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-tomorrow",
});

const redHatDisplay = Red_Hat_Display({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-red-hat",
});

export const metadata: Metadata = {
  title: "Clément Pellat — Développeur Full Stack",
  description:
    "Portfolio de Clément Pellat, développeur expert en JavaScript : projets, expérimentations et stack technique.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${tomorrow.variable} ${redHatDisplay.variable}`}>
      <body>{children}</body>
    </html>
  );
}
