'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useProfile } from '@/lib/hooks/useProfile'

const NAV = [
  { id: 'dashboard',     icon: '▦', label: 'Visão Geral',     badge: 0 },
  { id: 'appointments',  icon: '🗓', label: 'Agendamentos',    badge: 0 },
  { id: 'conversations', icon: '💬', label: 'Conversas',       badge: 0 },
  { id: 'kanban',        icon: '📋', label: 'Kanban de Leads', badge: 0 },
  { id: 'services',      icon: '✨', label: 'Serviços',        badge: 0 },
  { id: 'followups',     icon: '🔁', label: 'Follow-ups',      badge: 0 },
  { id: 'settings',      icon: '⚙', label: 'Configurações',   badge: 0 },
]

interface Props {
  active: string
  onNavigate: (id: string) => void
  logoOverride?: string | null
  nomeOverride?: string | null
}

export default function Sidebar({ active, onNavigate, logoOverride, nomeOverride }: Props) {
  const supabase = createClient()
  const { accountName, contaId, logoUrl, loading: profileLoading } = useProfile()
  const nomeContaAtual = nomeOverride !== undefined ? nomeOverride : accountName
  const displayAccount = profileLoading ? 'Carregando...' : (nomeContaAtual || 'Sua conta')
  const avatarInicialConta = nomeContaAtual ? nomeContaAtual.trim().charAt(0).toUpperCase() : '?'
  const logoParaExibir = logoOverride !== undefined ? logoOverride : logoUrl

  const [conversasCount, setConversasCount] = useState(0)

  useEffect(() => {
    if (!contaId) return
    let ativo = true
    async function carregarContagemConversas() {
      try {
        const { data, error } = await supabase.from('mensagens').select('lead_id').eq('conta_id', contaId)
        if (error) throw error
        if (!ativo) return
        setConversasCount(new Set((data ?? []).map((m) => m.lead_id)).size)
      } catch (err) {
        console.error('Erro ao contar conversas:', err)
      }
    }
    carregarContagemConversas()
    return () => { ativo = false }
  }, [contaId])

  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrImage, setQrImage] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)
  const [wppConectado, setWppConectado] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function pararPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function iniciarPolling() {
    pararPolling()
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/whatsapp/status')
        const data = await res.json()
        if (res.ok && data.state === 'open') {
          setWppConectado(true)
          pararPolling()
          setQrModalOpen(false)
        }
      } catch {
        // falha pontual do polling: ignora e tenta de novo no próximo tick
      }
    }, 4000)
  }

  async function abrirModalQr() {
    setQrModalOpen(true)
    setQrError(null)
    setQrImage(null)
    setQrLoading(true)
    try {
      const res = await fetch('/api/whatsapp/connect')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Não foi possível gerar o QR code.')
      if (!data.base64) throw new Error('QR code não retornado pela Evolution API.')
      setQrImage(data.base64)
      iniciarPolling()
    } catch (err: any) {
      setQrError(err.message || 'Erro ao conectar com o WhatsApp.')
    } finally {
      setQrLoading(false)
    }
  }

  function fecharModalQr() {
    setQrModalOpen(false)
    pararPolling()
  }

  useEffect(() => pararPolling, [])

  return (
    <aside style={{
      width: 240, flexShrink: 0,
      background: 'linear-gradient(180deg, #2E8F87, #3AA79D)',
      color: '#fff', display: 'flex', flexDirection: 'column',
      padding: '26px 16px 20px',
      borderRadius: '0 22px 22px 0',
      position: 'sticky', top: 0, height: '100vh',
    }}>

      {/* Brand: logo/avatar + nome da conta */}
      <button
        onClick={() => onNavigate('dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 22px',
          border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
          fontFamily: 'inherit',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: logoParaExibir ? 12 : '50%',
          border: logoParaExibir ? '3px solid #fff' : 'none',
          background: logoParaExibir ? 'transparent' : '#fff', color: '#227069',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17,
          overflow: 'hidden', flexShrink: 0,
        }}>
          {logoParaExibir ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoParaExibir} alt={displayAccount} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            avatarInicialConta
          )}
        </div>
        <h1 style={{
          fontFamily: "'Baloo 2', sans-serif", fontSize: 18, fontWeight: 700, color: '#fff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayAccount}
        </h1>
      </button>

      {/* WPP Status */}
      <button
        onClick={abrirModalQr}
        style={{
          background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.3)',
          borderRadius: 12, padding: '9px 12px', fontSize: 12, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26,
          width: '100%', cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
        }}
      >
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: wppConectado ? '#7CF5A8' : '#F6BE4F',
          boxShadow: wppConectado ? '0 0 8px #7CF5A8' : '0 0 8px #F6BE4F',
          display: 'inline-block', flexShrink: 0,
        }} />
        {wppConectado ? 'WhatsApp Conectado' : 'Reconectar WhatsApp'}
      </button>

      {/* Nav */}
      <div style={{ fontSize: 10, letterSpacing: '0.25em', opacity: 0.7, padding: '0 10px 10px', fontWeight: 600 }}>MENU</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(item => {
          const isActive = active === item.id
          const badge = item.id === 'conversations' ? conversasCount : item.badge
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                color: isActive ? '#227069' : '#fff',
                background: isActive ? '#fff' : 'none',
                border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                padding: '11px 12px', borderRadius: 12, textAlign: 'left', width: '100%',
                boxShadow: isActive ? '0 6px 16px rgba(15,55,50,.18)' : 'none',
                transition: 'all .15s',
              }}
            >
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  background: '#F6BE4F', color: '#5c4308',
                  fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 8px',
                }}>{badge}</span>
              )}
            </button>
          )
        })}
      </nav>

      {qrModalOpen && (
        <div
          onClick={fecharModalQr}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 20, padding: 28, width: 320,
              textAlign: 'center', color: '#1c1c1c', fontFamily: 'inherit',
            }}
          >
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>Conectar WhatsApp</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12.5, color: '#666' }}>
              Abra o WhatsApp no celular, vá em Aparelhos conectados e escaneie o código abaixo.
            </p>

            {qrLoading && (
              <div style={{ padding: '40px 0', fontSize: 13, color: '#666' }}>Gerando QR code...</div>
            )}

            {!qrLoading && qrError && (
              <div style={{ padding: '20px 0', fontSize: 13, color: '#c0392b' }}>{qrError}</div>
            )}

            {!qrLoading && !qrError && qrImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrImage}
                alt="QR code do WhatsApp"
                style={{ width: 220, height: 220, margin: '0 auto 14px', display: 'block', borderRadius: 12 }}
              />
            )}

            <button
              onClick={fecharModalQr}
              style={{
                marginTop: 8, border: 'none', background: '#eee', color: '#333',
                fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600,
                padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
