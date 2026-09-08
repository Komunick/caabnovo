import type { ReactNode } from "react";
import { LiveRegion } from "@/components/live-region";
import "@/styles/tokens.css";
import "./globals.css";

export const metadata = {
  title: "CAAB — Administração",
  description: "Sistema interno de gestão da CAAB",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#main-content">
          Pular para o conteúdo
        </a>
        {children}
        <LiveRegion />
      </body>
    </html>
  );
}
