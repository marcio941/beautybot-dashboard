import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BeautyBot — Painel',
  description: 'Sistema de atendimento WhatsApp com IA para clínicas de estética',
}

const THEME_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('beautybot-theme');
    var theme = stored === 'dark' || stored === 'light'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
