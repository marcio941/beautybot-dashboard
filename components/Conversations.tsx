'use client'

import { useEffect, useState } from 'react'
import { MessageSquare, Send, StickyNote } from 'lucide-react'
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

interface NotaRow {
  id: string
  autor: string | null
  texto: string
  created_at: string
}

interface RespostaRapida {
  id: string
  titulo: string
  texto: string
  tipo: 'texto' | 'pix' | 'localizacao' | 'orientacao'
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

const TIPO_LABEL: Record<RespostaRapida['tipo'], string> = {
  texto: '💬 Texto',
  pix: '💰 Pix',
  localizacao: '📍 Localização',
  orientacao: '📋 Orientação',
}

export default function Conversations({ initialLeadId }: { initialLeadId?: string | null } = {}) {
  const { contaId, userName, loading: perfilCarregando } = useProfile()

  const [conversas, setConversas] = useState<ConversaResumo[]>([])
  const [carregandoLista, setCarregandoLista] = useState(true)
  const [erroLista, setErroLista] = useState<string | null>(null)

  const [leadSelecionado, setLeadSelecionado] = useState<ConversaResumo | null>(null)
  const [mensagens, setMensagens] = useState<MensagemRow[]>([])
  const [carregandoMensagens, setCarregandoMensagens] = useState(false)
  const [erroMensagens, setErroMensagens] = useState<string | null>(null)

  const [mensagemTexto, setMensagemTexto] = useState('')
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  const [respostas, setRespostas] = useState<RespostaRapida[]>([])
  const [respostaSelecionada, setRespostaSelecionada] = useState('')

  const [notas, setNotas] = useState<NotaRow[]>([])
  const [carregandoNotas, setCarregandoNotas] = useState(false)
  const [erroNotas, setErroNotas] = useState<string | null>(null)
  const [novaNota, setNovaNota] = useState('')
  const [salvandoNota, setSalvandoNota] = useState(false)

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
        setLeadSelecionado(prev => prev ?? resumos.find(r => r.leadId === initialLeadId) ?? resumos[0] ?? null)
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
    if (!contaId) return
    let ativo = true
    async function carregarRespostas() {
      try {
        const { data, error } = await supabase
          .from('respostas_rapidas')
          .select('id, titulo, texto, tipo')
          .eq('conta_id', contaId)
          .order('titulo', { ascending: true })
        if (error) throw error
        if (ativo) setRespostas((data ?? []) as RespostaRapida[])
      } catch (err) {
        console.error('Erro ao buscar respostas rápidas:', err)
      }
    }
    carregarRespostas()
    return () => { ativo = false }
  }, [contaId])

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

  useEffect(() => {
    if (!leadSelecionado) { setNotas([]); return }

    let ativo = true
    async function carregarNotas() {
      setCarregandoNotas(true)
      setErroNotas(null)
      try {
        const { data, error } = await supabase
          .from('notas_internas')
          .select('id, autor, texto, created_at')
          .eq('lead_id', leadSelecionado!.leadId)
          .order('created_at', { ascending: false })
        if (error) throw error
        if (ativo) setNotas((data ?? []) as NotaRow[])
      } catch (err) {
        console.error('Erro ao buscar notas internas:', err)
        if (ativo) {
          setErroNotas('Não foi possível carregar as notas internas.')
          setNotas([])
        }
      } finally {
        if (ativo) setCarregandoNotas(false)
      }
    }
    carregarNotas()
    return () => { ativo = false }
  }, [leadSelecionado])

  async function enviarMensagem() {
    if (!leadSelecionado || !mensagemTexto.trim() || enviandoMensagem) return
    setEnviandoMensagem(true)
    setErroEnvio(null)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: leadSelecionado.leadId, texto: mensagemTexto.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Não foi possível enviar a mensagem.')
      setMensagens(prev => [...prev, data.mensagem])
      setMensagemTexto('')
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err)
      setErroEnvio(err.message || 'Erro ao enviar mensagem.')
    } finally {
      setEnviandoMensagem(false)
    }
  }

  function selecionarResposta(id: string) {
    const r = respostas.find(x => x.id === id)
    if (r) setMensagemTexto(r.texto)
    setRespostaSelecionada('')
  }

  async function adicionarNota() {
    if (!leadSelecionado || !contaId || !novaNota.trim() || salvandoNota) return
    setSalvandoNota(true)
    setErroNotas(null)
    try {
      const { data, error } = await supabase
        .from('notas_internas')
        .insert({ conta_id: contaId, lead_id: leadSelecionado.leadId, autor: userName, texto: novaNota.trim() })
        .select('id, autor, texto, created_at')
        .single()
      if (error) throw error
      setNotas(prev => [data as NotaRow, ...prev])
      setNovaNota('')
    } catch (err) {
      console.error('Erro ao adicionar nota interna:', err)
      setErroNotas('Não foi possível salvar a nota. Tente de novo.')
    } finally {
      setSalvandoNota(false)
    }
  }

  const carregandoTela = perfilCarregando || carregandoLista

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>
        <MessageSquare size={26} />
        Conversas
      </h2>
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

            {leadSelecionado && (
              <div style={{ borderTop: '1px solid var(--line)', padding: '12px 16px', background: 'var(--card-bg)' }}>
                {respostas.length > 0 && (
                  <select
                    value={respostaSelecionada}
                    onChange={(e) => selecionarResposta(e.target.value)}
                    style={{
                      fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#227069',
                      border: '1.5px solid var(--line)', borderRadius: 10, padding: '7px 8px',
                      background: 'var(--mist)', cursor: 'pointer', marginBottom: 8, width: '100%',
                    }}
                  >
                    <option value="">↪ Inserir resposta rápida…</option>
                    {respostas.map((r) => (
                      <option key={r.id} value={r.id}>{TIPO_LABEL[r.tipo]} — {r.titulo}</option>
                    ))}
                  </select>
                )}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Escreva sua mensagem…"
                    value={mensagemTexto}
                    onChange={(e) => setMensagemTexto(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() } }}
                    disabled={enviandoMensagem}
                    style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 14, padding: '12px 16px', fontFamily: 'inherit', fontSize: 13.5, outline: 'none', background: 'var(--mist)' }}
                  />
                  <button
                    onClick={enviarMensagem}
                    disabled={enviandoMensagem || !mensagemTexto.trim()}
                    style={{ border: 'none', width: 44, height: 44, borderRadius: 14, background: enviandoMensagem || !mensagemTexto.trim() ? 'var(--sub)' : 'var(--accent)', color: '#fff', fontSize: 17, boxShadow: '0 6px 14px rgba(46,143,135,.35)', cursor: enviandoMensagem || !mensagemTexto.trim() ? 'default' : 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {enviandoMensagem ? '…' : <Send size={17} />}
                  </button>
                </div>
                {erroEnvio && (
                  <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 12.5, marginTop: 8 }}>{erroEnvio}</p>
                )}
              </div>
            )}
          </div>

          {leadSelecionado && (
            <div style={{ ...card(), width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
                <b style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: '#227069' }}>
                  <StickyNote size={14} />
                  Notas internas
                </b>
                <p style={{ fontSize: 11.5, color: 'var(--sub)', margin: '2px 0 0' }}>Visíveis apenas para a equipe.</p>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {carregandoNotas ? (
                  <p style={{ color: 'var(--sub)', fontSize: 12.5, textAlign: 'center' }}>Carregando notas…</p>
                ) : notas.length === 0 ? (
                  <p style={{ color: 'var(--sub)', fontSize: 12.5, textAlign: 'center' }}>Nenhuma nota registrada ainda.</p>
                ) : (
                  notas.map((n) => (
                    <div key={n.id} style={{ background: '#FEF9E4', border: '1px solid #F3E4A8', borderRadius: 12, padding: '10px 12px' }}>
                      <p style={{ fontSize: 12.5, color: '#5C4A0B', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{n.texto}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, gap: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 600, color: '#8C7A2E' }}>{n.autor || 'Equipe'}</span>
                        <span style={{ fontSize: 10.5, color: '#8C7A2E' }}>{fmtHoraMsg(n.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--line)', padding: 12 }}>
                {erroNotas && (
                  <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 12, marginBottom: 8 }}>{erroNotas}</p>
                )}
                <textarea
                  value={novaNota}
                  onChange={(e) => setNovaNota(e.target.value)}
                  placeholder="Adicionar nota interna…"
                  rows={2}
                  disabled={salvandoNota}
                  style={{
                    width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1.5px solid var(--line)',
                    padding: '8px 10px', fontSize: 12.5, fontFamily: 'inherit', color: 'var(--ink)',
                    background: 'var(--mist)', resize: 'vertical', marginBottom: 8,
                  }}
                />
                <button
                  onClick={adicionarNota}
                  disabled={salvandoNota || !novaNota.trim()}
                  style={{
                    width: '100%', border: 'none', background: '#227069', color: '#fff',
                    fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '9px 0',
                    borderRadius: 10, cursor: salvandoNota || !novaNota.trim() ? 'default' : 'pointer',
                    opacity: salvandoNota || !novaNota.trim() ? 0.6 : 1,
                  }}
                >
                  {salvandoNota ? 'Salvando…' : '+ Adicionar nota'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
