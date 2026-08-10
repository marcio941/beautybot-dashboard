'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const THEME_KEY = 'beautybot-theme'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    } catch {
      // localStorage indisponível (modo privado, etc.): preferência não é persistida, mas o toggle continua funcionando na sessão atual
    }
  }

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      style={{
        border: '1px solid var(--line)', background: 'var(--card-bg)', color: 'var(--ink)',
        cursor: 'pointer', width: 44, height: 44, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
