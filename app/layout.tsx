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
        <link rel="icon" href="/icon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/icon-16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#227069" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
