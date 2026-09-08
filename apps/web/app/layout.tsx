import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "CAAB — Administração",
  description: "Sistema interno de gestão da CAAB",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
