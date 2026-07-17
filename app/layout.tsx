import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BeautyBot — Painel',
  description: 'Sistema de atendimento WhatsApp com IA para clínicas de estética',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
