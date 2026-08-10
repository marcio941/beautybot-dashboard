'use client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks/useProfile'
import ThemeToggle from './ThemeToggle'

interface Props {
  logoOverride?: string | null
}

export default function Header({ logoOverride }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { userName, logoUrl, loading: profileLoading } = useProfile()
  const displayName = profileLoading ? 'Carregando...' : (userName || 'Usuário')
  const avatarInitial = userName ? userName.trim().charAt(0).toUpperCase() : '?'
  const logoParaExibir = logoOverride !== undefined ? logoOverride : logoUrl

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14,
      padding: '14px 30px', background: 'var(--card-bg)', borderBottom: '1px solid var(--line)',
    }}>
      <ThemeToggle />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        <button
          onClick={handleLogout}
          title="Sair"
          style={{
            border: '1px solid var(--line)', background: 'var(--mist)', color: 'var(--ink)',
            cursor: 'pointer', width: 32, height: 32, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  )
}
