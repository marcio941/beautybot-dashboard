'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

interface FollowUpRow {
  id: string
  mensagem: string | null
  enviado_em: string
  canal: string | null
  leads: { name: string | null; phone: string | null } | null
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#fff', borderRadius: 22,
  boxShadow: '0 10px 30px rgba(30,70,66,.08)', ...style,
})

const formatarTelefone = (phone: string | null | undefined) => {
  if (!phone) return '—'
  return phone
    .replace('@s.whatsapp.net', '')
    .replace(/^55/, '')
    .replace(/(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

const fmtDataHora = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

export default function FollowUps() {
  const { contaId, loading: perfilCarregando } = useProfile()
  const [followUps, setFollowUps] = useState<FollowUpRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (perfilCarregando) return
    if (!contaId) { setCarregando(false); return }

    let ativo = true
    async function carregar() {
      setCarregando(true)
      setErro(null)
      try {
        const { data, error } = await supabase
          .from('follow_ups')
          .select('id, mensagem, enviado_em, canal, leads(name, phone)')
          .eq('conta_id', contaId)
          .order('enviado_em', { ascending: false })
        if (error) throw error
        if (ativo) setFollowUps((data ?? []) as unknown as FollowUpRow[])
      } catch (err) {
        console.error('Erro ao buscar follow-ups:', err)
        if (ativo) {
          setErro('Não foi possível carregar os follow-ups. Tente recarregar.')
          setFollowUps([])
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }
    carregar()
    return () => { ativo = false }
  }, [contaId, perfilCarregando])

  const carregandoTela = perfilCarregando || carregando

  return (
    <div>
      <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>🔁 Follow-ups</h2>
      <p style={{ color: '#6E807D', fontSize: 13, marginBottom: 24 }}>
        Histórico de follow-ups já enviados para os leads.
      </p>

      {erro && (
        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {erro}
        </p>
      )}

      {carregandoTela ? (
        <p style={{ color: '#6E807D', fontSize: 13 }}>Carregando follow-ups…</p>
      ) : followUps.length === 0 ? (
        <div style={{ ...card(), padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: '#9BB0AD', fontSize: 14, margin: 0 }}>Nenhum follow-up enviado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {followUps.map((f) => (
            <div key={f.id} style={{ ...card(), padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: '#E7F2F0', color: '#227069',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0,
              }}>
                {(f.leads?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <b style={{ fontSize: 13.5 }}>{f.leads?.name || 'Lead sem nome'}</b>
                  <span style={{ fontSize: 11.5, color: '#6E807D' }}>{formatarTelefone(f.leads?.phone)}</span>
                  <span style={{ background: '#F2F7F6', border: '1px solid #DFE9E7', fontSize: 10.5, fontWeight: 600, color: '#6E807D', borderRadius: 8, padding: '2px 8px', textTransform: 'capitalize' }}>
                    {f.canal || 'chat'}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: '#3A5754', margin: 0, lineHeight: 1.45 }}>{f.mensagem || '—'}</p>
              </div>
              <span style={{ fontSize: 11.5, color: '#9BB0AD', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDataHora(f.enviado_em)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
