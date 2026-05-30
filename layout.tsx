import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BeautyAI — Atendimento Clínica",
  description: "Sistema de atendimento e agendamento via WhatsApp para clínicas de estética",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
