'use client'

import { useEffect, useState } from 'react'
import {
  MessageSquare, Send, StickyNote, User, Mail, Flag, Calendar, History,
  PanelRightClose, PanelRightOpen, Plus, X,
} from 'lucide-react'
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

interface LeadDetalhe {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  tags: string[] | null
  origem: string | null
  status: string | null
  proxima_acao: string | null
  valor_potencial: number | null
  created_at: string
}

interface AgendamentoMini {
  id: string
  appointment_date: string
  status: string
  servico_id: string | null
  profissional_id: string | null
}

interface FollowUpMini {
  id: string
  enviado_em: string
  canal: string | null
  mensagem: string
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

const fmtDataCurta = (iso: string) => {
  try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
  catch { return '—' }
}

const fmtDataHora = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return '—' }
}

const TIPO_LABEL: Record<RespostaRapida['tipo'], string> = {
  texto: '💬 Texto',
  pix: '💰 Pix',
  localizacao: '📍 Localização',
  orientacao: '📋 Orientação',
}

const STATUS_AG_LABEL: Record<string, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
}

const STATUS_AG_STYLE: Record<string, { bg: string; color: string }> = {
  scheduled: { bg: '#E3EEFC', color: '#2361B5' },
  completed: { bg: '#DFF7E9', color: '#1E7C46' },
  cancelled: { bg: '#FBE3DF', color: '#B5473A' },
  no_show: { bg: '#ECECEC', color: '#5C5C5C' },
}

const secaoTitulo: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700,
  color: 'var(--sub)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10,
}

const labelCampo: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: 'var(--sub)', marginBottom: 3, display: 'block',
}

const campoStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 12.5,
  border: '1.5px solid var(--line)', borderRadius: 10, padding: '7px 10px',
  background: 'var(--mist)', color: 'var(--ink)', outline: 'none',
}

const botaoSalvarStyle = (disabled: boolean): React.CSSProperties => ({
  border: 'none', background: disabled ? 'var(--sub)' : 'var(--accent)', color: '#fff',
  fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '7px 14px', borderRadius: 10,
  cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.65 : 1,
})

export default function Conversations({ initialLeadId }: { initialLeadId?: string | null } = {}) {
  const { contaId, userName, categoriasKanban, loading: perfilCarregando } = useProfile()

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

  const [painelAberto, setPainelAberto] = useState(true)

  const [leadDetalhe, setLeadDetalhe] = useState<LeadDetalhe | null>(null)
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null)

  const [editNome, setEditNome] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editOrigem, setEditOrigem] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [novaTag, setNovaTag] = useState('')
  const [salvandoDados, setSalvandoDados] = useState(false)
  const [erroSalvarDados, setErroSalvarDados] = useState<string | null>(null)

  const [statusAtualizando, setStatusAtualizando] = useState(false)
  const [editProximaAcao, setEditProximaAcao] = useState('')
  const [editValorPotencial, setEditValorPotencial] = useState('')
  const [salvandoSituacao, setSalvandoSituacao] = useState(false)
  const [erroSalvarSituacao, setErroSalvarSituacao] = useState<string | null>(null)

  const [proximoAg, setProximoAg] = useState<AgendamentoMini | null>(null)
  const [ultimosAg, setUltimosAg] = useState<AgendamentoMini[]>([])
  const [carregandoAg, setCarregandoAg] = useState(false)
  const [erroAg, setErroAg] = useState<string | null>(null)
  const [servicosMap, setServicosMap] = useState<Record<string, string>>({})
  const [profissionaisMap, setProfissionaisMap] = useState<Record<string, string>>({})

  const [followUpsLead, setFollowUpsLead] = useState<FollowUpMini[]>([])
  const [carregandoFups, setCarregandoFups] = useState(false)
  const [erroFups, setErroFups] = useState<string | null>(null)

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

  useEffect(() => {
    if (!leadSelecionado) {
      setLeadDetalhe(null)
      return
    }
    let ativo = true
    async function carregarDetalhe() {
      setCarregandoDetalhe(true)
      setErroDetalhe(null)
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('id, name, phone, email, tags, origem, status, proxima_acao, valor_potencial, created_at')
          .eq('id', leadSelecionado!.leadId)
          .single()
        if (error) throw error
        if (!ativo) return
        const lead = data as LeadDetalhe
        setLeadDetalhe(lead)
        setEditNome(lead.name ?? '')
        setEditEmail(lead.email ?? '')
        setEditOrigem(lead.origem ?? '')
        setEditTags(lead.tags ?? [])
        setEditProximaAcao(lead.proxima_acao ?? '')
        setEditValorPotencial(lead.valor_potencial != null ? String(lead.valor_potencial) : '')
      } catch (err) {
        console.error('Erro ao buscar dados do lead:', err)
        if (ativo) {
          setErroDetalhe('Não foi possível carregar os dados do lead.')
          setLeadDetalhe(null)
        }
      } finally {
        if (ativo) setCarregandoDetalhe(false)
      }
    }
    carregarDetalhe()
    return () => { ativo = false }
  }, [leadSelecionado])

  useEffect(() => {
    if (!leadSelecionado) {
      setProximoAg(null)
      setUltimosAg([])
      setServicosMap({})
      setProfissionaisMap({})
      return
    }
    let ativo = true
    async function carregarAgendamentos() {
      setCarregandoAg(true)
      setErroAg(null)
      try {
        const agora = new Date().toISOString()
        const [proximoRes, ultimosRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('id, appointment_date, status, servico_id, profissional_id')
            .eq('lead_id', leadSelecionado!.leadId)
            .eq('status', 'scheduled')
            .gte('appointment_date', agora)
            .order('appointment_date', { ascending: true })
            .limit(1),
          supabase
            .from('appointments')
            .select('id, appointment_date, status, servico_id, profissional_id')
            .eq('lead_id', leadSelecionado!.leadId)
            .order('appointment_date', { ascending: false })
            .limit(3),
        ])
        if (proximoRes.error) throw proximoRes.error
        if (ultimosRes.error) throw ultimosRes.error
        if (!ativo) return

        const proximo = ((proximoRes.data ?? [])[0] ?? null) as AgendamentoMini | null
        const ultimos = (ultimosRes.data ?? []) as AgendamentoMini[]
        setProximoAg(proximo)
        setUltimosAg(ultimos)

        const servicoIds = Array.from(new Set(
          [proximo?.servico_id, ...ultimos.map(a => a.servico_id)].filter((v): v is string => !!v)
        ))
        const profissionalIds = Array.from(new Set(
          [proximo?.profissional_id, ...ultimos.map(a => a.profissional_id)].filter((v): v is string => !!v)
        ))

        const [servicosRes, profissionaisRes] = await Promise.all([
          servicoIds.length
            ? supabase.from('servicos').select('id, nome').in('id', servicoIds)
            : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
          profissionalIds.length
            ? supabase.from('profissionais').select('id, nome').in('id', profissionalIds)
            : Promise.resolve({ data: [] as { id: string; nome: string }[], error: null }),
        ])
        if (!ativo) return

        const sMap: Record<string, string> = {}
        for (const s of (servicosRes.data ?? []) as { id: string; nome: string }[]) sMap[s.id] = s.nome
        setServicosMap(sMap)

        const pMap: Record<string, string> = {}
        for (const p of (profissionaisRes.data ?? []) as { id: string; nome: string }[]) pMap[p.id] = p.nome
        setProfissionaisMap(pMap)
      } catch (err) {
        console.error('Erro ao buscar agendamentos do lead:', err)
        if (ativo) {
          setErroAg('Não foi possível carregar os agendamentos.')
          setProximoAg(null)
          setUltimosAg([])
        }
      } finally {
        if (ativo) setCarregandoAg(false)
      }
    }
    carregarAgendamentos()
    return () => { ativo = false }
  }, [leadSelecionado])

  useEffect(() => {
    if (!leadSelecionado) { setFollowUpsLead([]); return }
    let ativo = true
    async function carregarFollowUps() {
      setCarregandoFups(true)
      setErroFups(null)
      try {
        const { data, error } = await supabase
          .from('follow_ups')
          .select('id, enviado_em, canal, mensagem')
          .eq('lead_id', leadSelecionado!.leadId)
          .order('enviado_em', { ascending: false })
          .limit(3)
        if (error) throw error
        if (ativo) setFollowUpsLead((data ?? []) as FollowUpMini[])
      } catch (err) {
        console.error('Erro ao buscar follow-ups do lead:', err)
        if (ativo) {
          setErroFups('Não foi possível carregar os follow-ups.')
          setFollowUpsLead([])
        }
      } finally {
        if (ativo) setCarregandoFups(false)
      }
    }
    carregarFollowUps()
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

  function adicionarTag() {
    const t = novaTag.trim()
    if (!t || editTags.includes(t)) { setNovaTag(''); return }
    setEditTags(prev => [...prev, t])
    setNovaTag('')
  }

  function removerTag(tag: string) {
    setEditTags(prev => prev.filter(t => t !== tag))
  }

  async function salvarDadosCliente() {
    if (!leadDetalhe) return
    setSalvandoDados(true)
    setErroSalvarDados(null)
    try {
      const nome = editNome.trim() || null
      const { error } = await supabase
        .from('leads')
        .update({ name: nome, email: editEmail.trim() || null, origem: editOrigem.trim() || null, tags: editTags })
        .eq('id', leadDetalhe.id)
      if (error) throw error
      setLeadDetalhe(prev => prev ? { ...prev, name: nome, email: editEmail.trim() || null, origem: editOrigem.trim() || null, tags: editTags } : prev)
      setConversas(prev => prev.map(c => c.leadId === leadDetalhe.id ? { ...c, nome } : c))
      setLeadSelecionado(prev => prev ? { ...prev, nome } : prev)
    } catch (err) {
      console.error('Erro ao salvar dados do cliente:', err)
      setErroSalvarDados('Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvandoDados(false)
    }
  }

  async function mudarStatusLead(novoStatus: string) {
    if (!leadDetalhe) return
    setStatusAtualizando(true)
    try {
      const { error } = await supabase.from('leads').update({ status: novoStatus }).eq('id', leadDetalhe.id)
      if (error) throw error
      setLeadDetalhe(prev => prev ? { ...prev, status: novoStatus } : prev)
    } catch (err) {
      console.error('Erro ao atualizar status do lead:', err)
    } finally {
      setStatusAtualizando(false)
    }
  }

  async function salvarSituacao() {
    if (!leadDetalhe) return
    setSalvandoSituacao(true)
    setErroSalvarSituacao(null)
    try {
      const bruto = editValorPotencial.trim()
      const valorNum = bruto === '' ? null : Number(bruto.replace(',', '.'))
      if (valorNum !== null && Number.isNaN(valorNum)) {
        setErroSalvarSituacao('Valor potencial inválido.')
        setSalvandoSituacao(false)
        return
      }
      const proximaAcao = editProximaAcao.trim() || null
      const { error } = await supabase
        .from('leads')
        .update({ proxima_acao: proximaAcao, valor_potencial: valorNum })
        .eq('id', leadDetalhe.id)
      if (error) throw error
      setLeadDetalhe(prev => prev ? { ...prev, proxima_acao: proximaAcao, valor_potencial: valorNum } : prev)
    } catch (err) {
      console.error('Erro ao salvar situação do lead:', err)
      setErroSalvarSituacao('Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvandoSituacao(false)
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
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', background: '#E7F2F0', color: '#227069',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0,
                  }}>
                    {(leadSelecionado.nome || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <b style={{ fontSize: 14.5, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{leadSelecionado.nome || 'Lead sem nome'}</b>
                    <span style={{ fontSize: 12, color: 'var(--sub)' }}>{formatarTelefone(leadSelecionado.phone)}</span>
                  </div>
                </div>
                {!painelAberto && (
                  <button
                    onClick={() => setPainelAberto(true)}
                    title="Mostrar detalhes do lead"
                    style={{
                      border: '1px solid var(--line)', background: 'var(--card-bg)', borderRadius: 10,
                      width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#227069', flexShrink: 0,
                    }}
                  >
                    <PanelRightOpen size={16} />
                  </button>
                )}
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

          {leadSelecionado && painelAberto && (
            <div style={{ ...card(), width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <b style={{ fontSize: 13.5, color: '#227069' }}>Detalhes do lead</b>
                <button
                  onClick={() => setPainelAberto(false)}
                  title="Ocultar painel"
                  style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', color: 'var(--sub)', padding: 0 }}
                >
                  <PanelRightClose size={16} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                {carregandoDetalhe ? (
                  <p style={{ fontSize: 12.5, color: 'var(--sub)' }}>Carregando dados do lead…</p>
                ) : erroDetalhe ? (
                  <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 12.5 }}>{erroDetalhe}</p>
                ) : (
                  <>
                    {/* Dados do cliente */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={secaoTitulo}><User size={13} />Dados do cliente</div>

                      <div style={{ marginBottom: 10 }}>
                        <label style={labelCampo}>Nome</label>
                        <input type="text" value={editNome} onChange={(e) => setEditNome(e.target.value)} style={campoStyle} />
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label style={labelCampo}>Telefone</label>
                        <p style={{ fontSize: 12.5, margin: 0, color: 'var(--ink)' }}>{formatarTelefone(leadDetalhe?.phone)}</p>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label style={labelCampo}>Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="cliente@email.com"
                          style={campoStyle}
                        />
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label style={labelCampo}>Tags</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                          {editTags.length === 0 ? (
                            <span style={{ fontSize: 11.5, color: 'var(--sub)' }}>Nenhuma tag.</span>
                          ) : editTags.map((tag) => (
                            <span
                              key={tag}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--mist)',
                                border: '1px solid var(--line)', borderRadius: 8, padding: '3px 8px', fontSize: 11,
                              }}
                            >
                              {tag}
                              <button
                                onClick={() => removerTag(tag)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', color: 'var(--sub)', padding: 0 }}
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="text"
                            value={novaTag}
                            onChange={(e) => setNovaTag(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarTag() } }}
                            placeholder="Nova tag…"
                            style={{ ...campoStyle, flex: 1 }}
                          />
                          <button
                            onClick={adicionarTag}
                            style={{
                              border: 'none', background: 'var(--mist)', borderRadius: 10, width: 32, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#227069',
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label style={labelCampo}>Origem</label>
                        <input type="text" value={editOrigem} onChange={(e) => setEditOrigem(e.target.value)} style={campoStyle} />
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label style={labelCampo}>Data de entrada</label>
                        <p style={{ fontSize: 12.5, margin: 0, color: 'var(--ink)' }}>{leadDetalhe ? fmtDataCurta(leadDetalhe.created_at) : '—'}</p>
                      </div>

                      {erroSalvarDados && (
                        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '6px 10px', fontSize: 11.5, marginBottom: 8 }}>{erroSalvarDados}</p>
                      )}
                      <button onClick={salvarDadosCliente} disabled={salvandoDados || !leadDetalhe} style={botaoSalvarStyle(salvandoDados || !leadDetalhe)}>
                        {salvandoDados ? 'Salvando…' : 'Salvar dados'}
                      </button>
                    </div>

                    {/* Status */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={secaoTitulo}><Flag size={13} />Status</div>

                      <div style={{ marginBottom: 10 }}>
                        <label style={labelCampo}>Status atual</label>
                        <select
                          value={leadDetalhe?.status ?? ''}
                          disabled={statusAtualizando || !leadDetalhe}
                          onChange={(e) => mudarStatusLead(e.target.value)}
                          style={{ ...campoStyle, cursor: statusAtualizando ? 'wait' : 'pointer', textTransform: 'capitalize' }}
                        >
                          <option value="" disabled>Selecione…</option>
                          {(categoriasKanban ?? []).map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <div style={{ marginBottom: 10 }}>
                        <label style={labelCampo}>Próxima ação</label>
                        <input
                          type="text"
                          value={editProximaAcao}
                          onChange={(e) => setEditProximaAcao(e.target.value)}
                          placeholder="Ex: ligar amanhã, enviar orçamento…"
                          style={campoStyle}
                        />
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <label style={labelCampo}>Valor potencial (R$)</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={editValorPotencial}
                          onChange={(e) => setEditValorPotencial(e.target.value)}
                          placeholder="0,00"
                          style={campoStyle}
                        />
                      </div>

                      {erroSalvarSituacao && (
                        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '6px 10px', fontSize: 11.5, marginBottom: 8 }}>{erroSalvarSituacao}</p>
                      )}
                      <button onClick={salvarSituacao} disabled={salvandoSituacao || !leadDetalhe} style={botaoSalvarStyle(salvandoSituacao || !leadDetalhe)}>
                        {salvandoSituacao ? 'Salvando…' : 'Salvar'}
                      </button>
                    </div>

                    {/* Próximo agendamento */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={secaoTitulo}><Calendar size={13} />Próximo agendamento</div>
                      {carregandoAg ? (
                        <p style={{ fontSize: 12, color: 'var(--sub)' }}>Carregando…</p>
                      ) : erroAg ? (
                        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '6px 10px', fontSize: 11.5 }}>{erroAg}</p>
                      ) : proximoAg ? (
                        <div style={{ background: 'var(--mist)', borderRadius: 12, padding: '10px 12px' }}>
                          <b style={{ fontSize: 12.5, display: 'block' }}>{servicosMap[proximoAg.servico_id ?? ''] || 'Serviço'}</b>
                          <span style={{ fontSize: 11.5, color: 'var(--sub)', display: 'block', marginTop: 2 }}>{fmtDataHora(proximoAg.appointment_date)}</span>
                          {proximoAg.profissional_id && (
                            <span style={{ fontSize: 11.5, color: 'var(--sub)', display: 'block', marginTop: 2 }}>
                              Com {profissionaisMap[proximoAg.profissional_id] || '—'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontSize: 12, color: 'var(--sub)' }}>Nenhum agendamento futuro marcado.</p>
                      )}
                    </div>

                    {/* Histórico resumido */}
                    <div style={{ marginBottom: 22 }}>
                      <div style={secaoTitulo}><History size={13} />Histórico resumido</div>

                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Últimos agendamentos</div>
                      {carregandoAg ? (
                        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 14 }}>Carregando…</p>
                      ) : ultimosAg.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--sub)', marginBottom: 14 }}>Nenhum agendamento registrado.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                          {ultimosAg.map((a) => (
                            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
                              <span style={{ color: 'var(--sub)' }}>{fmtDataHora(a.appointment_date)}</span>
                              <span style={{
                                background: STATUS_AG_STYLE[a.status]?.bg || '#ECECEC',
                                color: STATUS_AG_STYLE[a.status]?.color || '#5C5C5C',
                                fontSize: 10.5, fontWeight: 700, borderRadius: 8, padding: '2px 8px', whiteSpace: 'nowrap',
                              }}>
                                {STATUS_AG_LABEL[a.status] || a.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>Últimos follow-ups</div>
                      {carregandoFups ? (
                        <p style={{ fontSize: 12, color: 'var(--sub)' }}>Carregando…</p>
                      ) : erroFups ? (
                        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '6px 10px', fontSize: 11.5 }}>{erroFups}</p>
                      ) : followUpsLead.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--sub)' }}>Nenhum follow-up enviado ainda.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {followUpsLead.map((f) => (
                            <div key={f.id} style={{ fontSize: 11.5 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ color: 'var(--sub)' }}>{fmtDataHora(f.enviado_em)}</span>
                                {f.canal && <span style={{ color: 'var(--sub)', textTransform: 'capitalize' }}>{f.canal}</span>}
                              </div>
                              <p style={{ margin: '2px 0 0', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.mensagem}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Notas internas */}
                    <div>
                      <div style={secaoTitulo}><StickyNote size={13} />Notas internas</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                        {carregandoNotas ? (
                          <p style={{ color: 'var(--sub)', fontSize: 12.5 }}>Carregando notas…</p>
                        ) : notas.length === 0 ? (
                          <p style={{ color: 'var(--sub)', fontSize: 12.5 }}>Nenhuma nota registrada ainda.</p>
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
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
