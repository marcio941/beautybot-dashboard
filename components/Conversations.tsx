'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

interface MensagemRow {
  id: string
  remetente: 'cliente' | 'bot'
  texto: string
  created_at: string
}

interface ConversaResumo {
  leadId: string
  nome: string | null
  phone: string | null
  ultimoTexto: string
  ultimaData: string
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--card-bg)', borderRadius: 22,
  boxShadow: 'var(--shadow)', ...style,
})

const formatarTelefone = (phone: string | null | undefined) => {
  if (!phone) return '—'
  return phone
    .replace('@s.whatsapp.net', '')
    .replace(/^55/, '')
    .replace(/(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

const fmtHoraLista = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const fmtHoraMsg = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export default function Conversations() {
  const { contaId, loading: perfilCarregando } = useProfile()

  const [conversas, setConversas] = useState<ConversaResumo[]>([])
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [erroLista, setErroLista] = useState<string | null>(null)

  const [leadSelecionado, setLeadSelecionado] = useState<ConversaResumo | null>(null)
  const [mensagens, setMensagens] = useState<MensagemRow[]>([])
  const [carregandoMensagens, setCarregandoMensagens] = useState(false)
  const [erroMensagens, setErroMensagens] = useState<string | null>(null)

  useEffect(() => {
    if (perfilCarregando) return
    if (!contaId) { setCarregandoLista(false); return }

    let ativo = true
    async function carregarLista() {
      setCarregandoLista(true)
      setErroLista(null)
      try {
        const { data, error } = await supabase
          .from('mensagens')
          .select('lead_id, texto, created_at, leads(name, phone)')
          .eq('conta_id', contaId)
          .order('created_at', { ascending: false })
        if (error) throw error
        if (!ativo) return

        const vistos = new Set<string>()
        const resumos: ConversaResumo[] = []
        for (const m of (data ?? []) as unknown as { lead_id: string; texto: string; created_at: string; leads: { name: string | null; phone: string | null } | null }[]) {
          if (!m.lead_id || vistos.has(m.lead_id)) continue
          vistos.add(m.lead_id)
          resumos.push({
            leadId: m.lead_id,
            nome: m.leads?.name ?? null,
            phone: m.leads?.phone ?? null,
            ultimoTexto: m.texto,
            ultimaData: m.created_at,
          })
        }
        setConversas(resumos)
        setLeadSelecionado(prev => prev ?? resumos[0] ?? null)
      } catch (err) {
        console.error('Erro ao buscar conversas:', err)
        if (ativo) {
          setErroLista('Não foi possível carregar as conversas. Tente recarregar.')
          setConversas([])
        }
      } finally {
        if (ativo) setCarregandoLista(false)
      }
    }
    carregarLista()
    return () => { ativo = false }
  }, [contaId, perfilCarregando])

  useEffect(() => {
    if (!leadSelecionado) { setMensagens([]); return }

    let ativo = true
    async function carregarMensagens() {
      setCarregandoMensagens(true)
      setErroMensagens(null)
      try {
        const { data, error } = await supabase
          .from('mensagens')
          .select('id, remetente, texto, created_at')
          .eq('lead_id', leadSelecionado!.leadId)
          .order('created_at', { ascending: true })
        if (error) throw error
        if (ativo) setMensagens((data ?? []) as MensagemRow[])
      } catch (err) {
        console.error('Erro ao buscar mensagens:', err)
        if (ativo) {
          setErroMensagens('Não foi possível carregar o histórico de mensagens.')
          setMensagens([])
        }
      } finally {
        if (ativo) setCarregandoMensagens(false)
      }
    }
    carregarMensagens()
    return () => { ativo = false }
  }, [leadSelecionado])

  const carregandoTela = perfilCarregando || carregandoLista

  return (
    <div>
      <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>💬 Conversas</h2>
      <p style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 24 }}>Histórico completo de conversas via WhatsApp.</p>

      {erroLista && (
        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {erroLista}
        </p>
      )}

      {carregandoTela ? (
        <p style={{ color: 'var(--sub)', fontSize: 13 }}>Carregando conversas…</p>
      ) : conversas.length === 0 ? (
        <div style={{ ...card(), padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--sub)', fontSize: 14, margin: 0 }}>Nenhuma mensagem registrada ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 200px)', minHeight: 420 }}>
          <div style={{ ...card(), width: 300, flexShrink: 0, overflowY: 'auto', padding: 8 }}>
            {conversas.map((c) => {
              const ativo = leadSelecionado?.leadId === c.leadId
              return (
                <button
                  key={c.leadId}
                  onClick={() => setLeadSelecionado(c)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left',
                    border: 'none', cursor: 'pointer', background: ativo ? '#E7F2F0' : 'transparent',
                    borderRadius: 14, padding: '10px 12px', marginBottom: 4,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', background: '#F2F7F6', color: '#227069',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0,
                  }}>
                    {(c.nome || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                      <b style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.nome || formatarTelefone(c.phone)}
                      </b>
                      <span style={{ fontSize: 10.5, color: 'var(--sub)', flexShrink: 0 }}>{fmtHoraLista(c.ultimaData)}</span>
                    </div>
                    <p style={{
                      fontSize: 12, color: 'var(--sub)', margin: '2px 0 0', whiteSpace: 'nowrap',
                      overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {c.ultimoTexto}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ ...card(), flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {leadSelecionado && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: '#E7F2F0', color: '#227069',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0,
                }}>
                  {(leadSelecionado.nome || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <b style={{ fontSize: 14.5, display: 'block' }}>{leadSelecionado.nome || 'Lead sem nome'}</b>
                  <span style={{ fontSize: 12, color: 'var(--sub)' }}>{formatarTelefone(leadSelecionado.phone)}</span>
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--mist)', padding: 16 }}>
              {carregandoMensagens ? (
                <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>Carregando mensagens…</p>
              ) : erroMensagens ? (
                <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>{erroMensagens}</p>
              ) : mensagens.length === 0 ? (
                <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>Nenhuma mensagem registrada ainda.</p>
              ) : (
                mensagens.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.remetente === 'cliente' ? 'flex-start' : 'flex-end',
                      maxWidth: '70%',
                      background: m.remetente === 'cliente' ? 'var(--card-bg)' : '#227069',
                      color: m.remetente === 'cliente' ? 'var(--ink)' : '#fff',
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
      )}
    </div>
  )
}
