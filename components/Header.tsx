'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings as SettingsIcon, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks/useProfile'
import ThemeToggle from './ThemeToggle'

interface Props {
  logoOverride?: string | null
  onNavigate?: (id: string) => void
}

const itemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
  border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 13, color: 'var(--ink)', padding: '9px 10px', borderRadius: 9,
}

export default function Header({ logoOverride, onNavigate }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { userName, logoUrl, loading: profileLoading } = useProfile()
  const displayName = profileLoading ? 'Carregando...' : (userName || 'Usuário')
  const avatarInitial = userName ? userName.trim().charAt(0).toUpperCase() : '?'
  const logoParaExibir = logoOverride !== undefined ? logoOverride : logoUrl

  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuAberto) return
    function aoClicarFora(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false)
    }
    function aoPressionarTecla(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuAberto(false)
    }
    document.addEventListener('mousedown', aoClicarFora)
    document.addEventListener('keydown', aoPressionarTecla)
    return () => {
      document.removeEventListener('mousedown', aoClicarFora)
      document.removeEventListener('keydown', aoPressionarTecla)
    }
  }, [menuAberto])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function irParaConfiguracoes() {
    setMenuAberto(false)
    onNavigate?.('settings')
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14,
      padding: '14px 30px', background: 'var(--card-bg)', borderBottom: '1px solid var(--line)',
    }}>
      <ThemeToggle />

      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuAberto(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none',
            cursor: 'pointer', padding: '4px 8px 4px 4px', borderRadius: 12, fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'var(--mist)', color: '#227069',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
            overflow: 'hidden', flexShrink: 0,
          }}>
            {logoParaExibir ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoParaExibir} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              avatarInitial
            )}
          </div>
          <b style={{ fontSize: 13, color: 'var(--ink)' }}>{displayName}</b>
          <ChevronDown
            size={14}
            style={{ color: 'var(--sub)', transform: menuAberto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}
          />
        </button>

        {menuAberto && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 190,
            background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 14,
            boxShadow: '0 12px 28px rgba(0,0,0,.14)', padding: 6, zIndex: 60,
          }}>
            <button onClick={irParaConfiguracoes} style={itemStyle}>
              <SettingsIcon size={15} />
              Configurações
            </button>
            <button onClick={handleLogout} style={itemStyle}>
              <LogOut size={15} />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
