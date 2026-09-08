import type { ReactNode } from "react";
import Script from "next/script";
import { LiveRegion } from "@/components/live-region";
import "@/styles/tokens.css";
import "./globals.css";

export const metadata = {
  title: "CAAB — Administração",
  description: "Sistema interno de gestão da CAAB",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <Script id="caab-theme" strategy="beforeInteractive">
          {
            "try{var t=localStorage.getItem('caab-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}"
          }
        </Script>
        <a className="skip-link" href="#main-content">
          Pular para o conteúdo
        </a>
        {children}
        <LiveRegion />
      </body>
    </html>
  );
}
