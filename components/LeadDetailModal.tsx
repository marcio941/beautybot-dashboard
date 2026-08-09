'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface LeadRow {
  id: string
  name: string | null
  phone: string | null
  status: string | null
  origem: string | null
  created_at: string
  nicho: string | null
  score: number | null
  score_motivo: string | null
  dores: unknown[] | null
  gancho: string | null
}

interface MensagemRow {
  id: string
  remetente: 'cliente' | 'bot'
  texto: string
  created_at: string
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#fff', borderRadius: 22,
  boxShadow: '0 10px 30px rgba(30,70,66,.08)', ...style,
})

const formatarTelefone = (phone: string | null) => {
  if (!phone) return '—'
  return phone
    .replace('@s.whatsapp.net', '')
    .replace(/^55/, '')
    .replace(/(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

const fmtData = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return '—' }
}

const fmtHoraMsg = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function BadgeOrigem({ origem }: { origem: string | null }) {
  const outbound = origem === 'outbound'
  return (
    <span style={{
      background: outbound ? '#EDE4FC' : '#E7F2F0',
      color: outbound ? '#6A3BC0' : '#227069',
      fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap',
    }}>
      {outbound ? '🎯 Prospecção' : '💬 WhatsApp'}
    </span>
  )
}

export default function LeadDetailModal({ lead, categorias, atualizando, onFechar, onMudarStatus }: {
  lead: LeadRow | null
  categorias: string[]
  atualizando: boolean
  onFechar: () => void
  onMudarStatus: (id: string, status: string) => void
}) {
  const [mensagens, setMensagens] = useState<MensagemRow[]>([])
  const [mensagensCarregando, setMensagensCarregando] = useState(false)
  const [mensagensErro, setMensagensErro] = useState<string | null>(null)

  useEffect(() => {
    if (!lead) return
    let ativo = true
    async function carregarMensagens() {
      setMensagensCarregando(true)
      setMensagensErro(null)
      try {
        const { data, error } = await supabase
          .from('mensagens')
          .select('id, remetente, texto, created_at')
          .eq('lead_id', lead!.id)
          .order('created_at', { ascending: true })
        if (error) throw error
        if (ativo) setMensagens((data ?? []) as MensagemRow[])
      } catch (err) {
        console.error('Erro ao buscar mensagens:', err)
        if (ativo) {
          setMensagensErro('Não foi possível carregar o histórico de mensagens.')
          setMensagens([])
        }
      } finally {
        if (ativo) setMensagensCarregando(false)
      }
    }
    carregarMensagens()
    return () => { ativo = false }
  }, [lead])

  if (!lead) return null

  const doresTexto = Array.isArray(lead.dores) && lead.dores.length > 0
    ? lead.dores.map((d) => (typeof d === 'string' ? d : JSON.stringify(d))).join(', ')
    : null

  const temEnriquecimento = Boolean(lead.nicho || lead.score != null || lead.score_motivo || doresTexto || lead.gancho)

  return (
    <div
      onClick={onFechar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(18,48,44,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={card({ padding: 24, maxWidth: 460, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' })}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', background: '#E7F2F0', color: '#227069',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 17, flexShrink: 0,
            }}>
              {(lead.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <b style={{ fontSize: 16, display: 'block' }}>{lead.name || 'Sem nome'}</b>
              <span style={{ fontSize: 12.5, color: '#6E807D' }}>{formatarTelefone(lead.phone)}</span>
            </div>
          </div>
          <button onClick={onFechar} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#6E807D' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <BadgeOrigem origem={lead.origem} />
          <span style={{ background: '#F2F7F6', border: '1px solid #DFE9E7', fontSize: 11, fontWeight: 600, color: '#6E807D', borderRadius: 9, padding: '4px 10px' }}>
            Criado em {fmtData(lead.created_at)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#3A5754' }}>Status:</span>
          <select
            value={lead.status ?? ''}
            disabled={atualizando}
            onChange={(e) => onMudarStatus(lead.id, e.target.value)}
            style={{
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#227069',
              border: '1.5px solid #DFE9E7', borderRadius: 10, padding: '6px 8px',
              background: '#fff', cursor: atualizando ? 'wait' : 'pointer', textTransform: 'capitalize',
            }}
          >
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {temEnriquecimento && (
          <div style={{ background: '#F9FBFA', border: '1px solid #E3ECE9', borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.nicho && <p style={{ fontSize: 12.5, margin: 0 }}><b>Nicho:</b> {lead.nicho}</p>}
            {lead.score != null && <p style={{ fontSize: 12.5, margin: 0 }}><b>Score:</b> {lead.score}</p>}
            {lead.score_motivo && <p style={{ fontSize: 12.5, margin: 0 }}><b>Motivo do score:</b> {lead.score_motivo}</p>}
            {doresTexto && <p style={{ fontSize: 12.5, margin: 0 }}><b>Dores:</b> {doresTexto}</p>}
            {lead.gancho && <p style={{ fontSize: 12.5, margin: 0 }}><b>Gancho:</b> {lead.gancho}</p>}
          </div>
        )}

        <div style={{ fontSize: 13, fontWeight: 700, color: '#227069', marginBottom: 8 }}>Histórico de conversa</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: '#F6FAF9', borderRadius: 14, padding: 12, minHeight: 120 }}>
          {mensagensCarregando ? (
            <p style={{ color: '#6E807D', fontSize: 13, textAlign: 'center' }}>Carregando mensagens…</p>
          ) : mensagensErro ? (
            <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>{mensagensErro}</p>
          ) : mensagens.length === 0 ? (
            <p style={{ color: '#9BB0AD', fontSize: 13, textAlign: 'center' }}>Nenhuma mensagem registrada ainda.</p>
          ) : (
            mensagens.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.remetente === 'cliente' ? 'flex-start' : 'flex-end',
                  maxWidth: '78%',
                  background: m.remetente === 'cliente' ? '#fff' : '#227069',
                  color: m.remetente === 'cliente' ? '#213432' : '#fff',
                  borderRadius: m.remetente === 'cliente' ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                  padding: '9px 13px', fontSize: 13, lineHeight: 1.4,
                  boxShadow: '0 3px 8px rgba(30,70,66,.06)',
                }}
              >
                {m.texto}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>{fmtHoraMsg(m.created_at)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
