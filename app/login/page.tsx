'use client'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(180deg,#F6FAF9,#EDF4F2)',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 22,
          boxShadow: '0 10px 30px rgba(30,70,66,.08)',
          padding: '40px 36px',
          textAlign: 'center',
          maxWidth: 360,
          width: '100%',
        }}
      >
        <h1 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 26, color: '#227069', marginBottom: 8 }}>
          💄 BeautyAI
        </h1>
        <p style={{ fontSize: 13, color: '#6E807D', marginBottom: 28 }}>
          Entre para acessar o painel de atendimento
        </p>
        <button
          onClick={handleGoogleLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            border: '1.5px solid #DFE9E7',
            borderRadius: 14,
            padding: '12px 16px',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            color: '#1f2937',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.5 0 10.5-2.1 14.3-5.5l-6.6-5.6c-2 1.5-4.6 2.5-7.7 2.5-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 39.6 16.3 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.9l6.6 5.6C41.4 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z" />
          </svg>
          Entrar com Google
        </button>
      </div>
    </div>
  )
}
