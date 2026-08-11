'use client'

import { useEffect, useState } from 'react'
import { X, MessageCircle, Stethoscope, AlertTriangle, Camera, Target, History, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

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
  tags: string[] | null
  valor_potencial: number | null
  resultado: 'ganho' | 'perdido' | null
  valor_fechado: number | null
  resultado_data: string | null
}

export type LeadPatch = Partial<Pick<LeadRow, 'tags' | 'valor_potencial' | 'resultado' | 'valor_fechado' | 'resultado_data'>>

interface MensagemRow {
  id: string
  remetente: 'cliente' | 'bot'
  texto: string
  created_at: string
}

interface HistoricoRow {
  id: string
  conta_id: string
  lead_id: string
  servico_id: string | null
  data: string
  observacoes: string | null
  alergias: string | null
}

interface FotoRow {
  id: string
  historico_id: string
  url: string
  tipo: 'antes' | 'depois'
  consentimento: boolean
}

interface ServicoOpcao {
  id: string
  nome: string
}

interface HistoricoEtapaRow {
  id: string
  etapa_anterior: string | null
  nova_etapa: string
  usuario: string | null
  created_at: string
}

const campoInputStyle: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 12.5, border: '1.5px solid var(--line)',
  borderRadius: 10, padding: '7px 10px', background: 'var(--card-bg)', color: 'var(--ink)',
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--card-bg)', borderRadius: 22,
  boxShadow: 'var(--shadow)', ...style,
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

const fmtDataHoraEtapa = (iso: string) => {
  try {
    const d = new Date(iso)
    const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return `${data} às ${hora}`
  } catch { return '' }
}

const fmtValorPotencial = (valor: number | null) => {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function BadgeOrigem({ origem }: { origem: string | null }) {
  const outbound = origem === 'outbound'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: outbound ? '#EDE4FC' : 'var(--mist)',
      color: outbound ? '#6A3BC0' : 'var(--accent)',
      fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap',
    }}>
      {outbound ? <Target size={11} /> : <MessageCircle size={11} />}
      {outbound ? 'Prospecção' : 'WhatsApp'}
    </span>
  )
}

export default function LeadDetailModal({ lead, categorias, atualizando, onFechar, onMudarStatus, onAtualizarLead }: {
  lead: LeadRow | null
  categorias: string[]
  atualizando: boolean
  onFechar: () => void
  onMudarStatus: (id: string, status: string) => void
  onAtualizarLead: (id: string, patch: LeadPatch) => void
}) {
  const { contaId } = useProfile()
  const [aba, setAba] = useState<'conversa' | 'procedimentos' | 'historico'>('conversa')

  const [mensagens, setMensagens] = useState<MensagemRow[]>([])
  const [mensagensCarregando, setMensagensCarregando] = useState(false)
  const [mensagensErro, setMensagensErro] = useState<string | null>(null)

  const [historico, setHistorico] = useState<HistoricoRow[]>([])
  const [fotos, setFotos] = useState<FotoRow[]>([])
  const [fotoUrls, setFotoUrls] = useState<Record<string, string>>({})
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [erroHistorico, setErroHistorico] = useState<string | null>(null)

  const [servicosOpcoes, setServicosOpcoes] = useState<ServicoOpcao[]>([])

  const [formServicoId, setFormServicoId] = useState('')
  const [formData, setFormData] = useState('')
  const [formObservacoes, setFormObservacoes] = useState('')
  const [formAlergias, setFormAlergias] = useState('')
  const [formErroHistorico, setFormErroHistorico] = useState<string | null>(null)
  const [salvandoHistorico, setSalvandoHistorico] = useState(false)

  const [uploadHistoricoId, setUploadHistoricoId] = useState<string | null>(null)
  const [uploadTipo, setUploadTipo] = useState<'antes' | 'depois'>('antes')
  const [uploadConsentimento, setUploadConsentimento] = useState(false)
  const [uploadArquivo, setUploadArquivo] = useState<File | null>(null)
  const [enviandoFoto, setEnviandoFoto] = useState(false)
  const [erroFoto, setErroFoto] = useState<string | null>(null)

  const [editTags, setEditTags] = useState<string[]>([])
  const [novaTag, setNovaTag] = useState('')
  const [editValorPotencial, setEditValorPotencial] = useState('')
  const [salvandoTagsValor, setSalvandoTagsValor] = useState(false)
  const [erroTagsValor, setErroTagsValor] = useState<string | null>(null)

  const [historicoEtapas, setHistoricoEtapas] = useState<HistoricoEtapaRow[]>([])
  const [carregandoHistoricoEtapas, setCarregandoHistoricoEtapas] = useState(false)
  const [erroHistoricoEtapas, setErroHistoricoEtapas] = useState<string | null>(null)

  const [marcandoGanho, setMarcandoGanho] = useState(false)
  const [valorFechadoInput, setValorFechadoInput] = useState('')
  const [salvandoResultado, setSalvandoResultado] = useState(false)
  const [erroResultado, setErroResultado] = useState<string | null>(null)

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

  useEffect(() => {
    if (!lead) return
    let ativo = true
    async function carregarHistorico() {
      setCarregandoHistorico(true)
      setErroHistorico(null)
      try {
        const { data: hist, error: histErro } = await supabase
          .from('historico_procedimentos')
          .select('id, conta_id, lead_id, servico_id, data, observacoes, alergias')
          .eq('lead_id', lead!.id)
          .order('data', { ascending: false })
        if (histErro) throw histErro
        const historicoData = (hist ?? []) as HistoricoRow[]
        if (ativo) setHistorico(historicoData)

        const ids = historicoData.map((h) => h.id)
        if (ids.length > 0) {
          const { data: fot, error: fotErro } = await supabase
            .from('fotos_procedimento')
            .select('id, historico_id, url, tipo, consentimento')
            .in('historico_id', ids)
          if (fotErro) throw fotErro
          if (ativo) setFotos((fot ?? []) as FotoRow[])
        } else if (ativo) {
          setFotos([])
        }
      } catch (err) {
        console.error('Erro ao buscar histórico de procedimentos:', err)
        if (ativo) {
          setErroHistorico('Não foi possível carregar o histórico de procedimentos.')
          setHistorico([])
          setFotos([])
        }
      } finally {
        if (ativo) setCarregandoHistorico(false)
      }
    }
    carregarHistorico()
    return () => { ativo = false }
  }, [lead])

  useEffect(() => {
    if (!lead) return
    let ativo = true
    async function carregarHistoricoEtapas() {
      setCarregandoHistoricoEtapas(true)
      setErroHistoricoEtapas(null)
      try {
        const { data, error } = await supabase
          .from('lead_stage_history')
          .select('id, etapa_anterior, nova_etapa, usuario, created_at')
          .eq('lead_id', lead!.id)
          .order('created_at', { ascending: false })
        if (error) throw error
        if (ativo) setHistoricoEtapas((data ?? []) as HistoricoEtapaRow[])
      } catch (err) {
        console.error('Erro ao buscar histórico de movimentação:', err)
        if (ativo) {
          setErroHistoricoEtapas('Não foi possível carregar o histórico de movimentação.')
          setHistoricoEtapas([])
        }
      } finally {
        if (ativo) setCarregandoHistoricoEtapas(false)
      }
    }
    carregarHistoricoEtapas()
    return () => { ativo = false }
  }, [lead])

  useEffect(() => {
    let ativo = true
    async function gerarUrls() {
      const entradas = await Promise.all(fotos.map(async (f) => {
        const { data, error } = await supabase.storage.from('fotos-procedimento').createSignedUrl(f.url, 3600)
        if (error || !data) return [f.id, null] as const
        return [f.id, data.signedUrl] as const
      }))
      if (!ativo) return
      const mapa: Record<string, string> = {}
      entradas.forEach(([id, url]) => { if (url) mapa[id] = url })
      setFotoUrls(mapa)
    }
    if (fotos.length > 0) gerarUrls()
    else setFotoUrls({})
    return () => { ativo = false }
  }, [fotos])

  useEffect(() => {
    if (!contaId) return
    let ativo = true
    async function carregarServicos() {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome')
        .eq('conta_id', contaId)
        .eq('ativo', true)
        .order('nome', { ascending: true })
      if (!error && ativo) setServicosOpcoes((data ?? []) as ServicoOpcao[])
    }
    carregarServicos()
    return () => { ativo = false }
  }, [contaId])

  useEffect(() => {
    setAba('conversa')
    setFormServicoId('')
    setFormData('')
    setFormObservacoes('')
    setFormAlergias('')
    setFormErroHistorico(null)
    setUploadHistoricoId(null)
    setUploadTipo('antes')
    setUploadConsentimento(false)
    setUploadArquivo(null)
    setErroFoto(null)
    setEditTags(lead?.tags ?? [])
    setNovaTag('')
    setEditValorPotencial(lead?.valor_potencial != null ? String(lead.valor_potencial) : '')
    setErroTagsValor(null)
    setMarcandoGanho(false)
    setValorFechadoInput(lead?.valor_potencial != null ? String(lead.valor_potencial) : '')
    setErroResultado(null)
  }, [lead?.id])

  async function adicionarHistorico() {
    if (!lead || !contaId) return
    if (!formData) {
      setFormErroHistorico('Informe a data do procedimento.')
      return
    }
    setSalvandoHistorico(true)
    setFormErroHistorico(null)
    try {
      const { data, error } = await supabase
        .from('historico_procedimentos')
        .insert({
          conta_id: contaId,
          lead_id: lead.id,
          servico_id: formServicoId || null,
          data: formData,
          observacoes: formObservacoes || null,
          alergias: formAlergias || null,
        })
        .select('id, conta_id, lead_id, servico_id, data, observacoes, alergias')
        .single()
      if (error) throw error
      setHistorico((prev) => [data as HistoricoRow, ...prev])
      setFormServicoId('')
      setFormData('')
      setFormObservacoes('')
      setFormAlergias('')
    } catch (err) {
      console.error('Erro ao adicionar histórico:', err)
      setFormErroHistorico('Não foi possível salvar o procedimento.')
    } finally {
      setSalvandoHistorico(false)
    }
  }

  function abrirUploadFoto(historicoId: string) {
    setUploadHistoricoId((atual) => (atual === historicoId ? null : historicoId))
    setUploadTipo('antes')
    setUploadConsentimento(false)
    setUploadArquivo(null)
    setErroFoto(null)
  }

  async function enviarFoto(historicoId: string) {
    if (!lead || !contaId || !uploadArquivo || !uploadConsentimento) return
    setEnviandoFoto(true)
    setErroFoto(null)
    try {
      const extensao = uploadArquivo.name.split('.').pop() || 'jpg'
      const caminho = `${contaId}/${crypto.randomUUID()}.${extensao}`
      const { error: uploadErro } = await supabase.storage
        .from('fotos-procedimento')
        .upload(caminho, uploadArquivo)
      if (uploadErro) throw uploadErro

      const { data, error: insertErro } = await supabase
        .from('fotos_procedimento')
        .insert({
          conta_id: contaId,
          lead_id: lead.id,
          historico_id: historicoId,
          url: caminho,
          tipo: uploadTipo,
          consentimento: uploadConsentimento,
        })
        .select('id, historico_id, url, tipo, consentimento')
        .single()
      if (insertErro) throw insertErro

      setFotos((prev) => [...prev, data as FotoRow])
      setUploadHistoricoId(null)
      setUploadArquivo(null)
      setUploadConsentimento(false)
    } catch (err) {
      console.error('Erro ao enviar foto:', err)
      setErroFoto('Não foi possível enviar a foto.')
    } finally {
      setEnviandoFoto(false)
    }
  }

  function adicionarTagModal() {
    const t = novaTag.trim()
    if (!t || editTags.includes(t)) { setNovaTag(''); return }
    setEditTags((prev) => [...prev, t])
    setNovaTag('')
  }

  function removerTagModal(tag: string) {
    setEditTags((prev) => prev.filter((t) => t !== tag))
  }

  async function salvarTagsValor() {
    if (!lead) return
    setSalvandoTagsValor(true)
    setErroTagsValor(null)
    try {
      const bruto = editValorPotencial.trim()
      const valorNum = bruto === '' ? null : Number(bruto.replace(',', '.'))
      if (valorNum !== null && Number.isNaN(valorNum)) {
        setErroTagsValor('Valor potencial inválido.')
        setSalvandoTagsValor(false)
        return
      }
      const { error } = await supabase
        .from('leads')
        .update({ tags: editTags, valor_potencial: valorNum })
        .eq('id', lead.id)
      if (error) throw error
      onAtualizarLead(lead.id, { tags: editTags, valor_potencial: valorNum })
    } catch (err) {
      console.error('Erro ao salvar tags e valor potencial:', err)
      setErroTagsValor('Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvandoTagsValor(false)
    }
  }

  async function confirmarGanho() {
    if (!lead) return
    const bruto = valorFechadoInput.trim()
    const valorNum = bruto === '' ? null : Number(bruto.replace(',', '.'))
    if (valorNum === null || Number.isNaN(valorNum)) {
      setErroResultado('Informe um valor fechado válido.')
      return
    }
    setSalvandoResultado(true)
    setErroResultado(null)
    try {
      const agora = new Date().toISOString()
      const { error } = await supabase
        .from('leads')
        .update({ resultado: 'ganho', valor_fechado: valorNum, resultado_data: agora })
        .eq('id', lead.id)
      if (error) throw error
      onAtualizarLead(lead.id, { resultado: 'ganho', valor_fechado: valorNum, resultado_data: agora })
      setMarcandoGanho(false)
    } catch (err) {
      console.error('Erro ao marcar lead como ganho:', err)
      setErroResultado('Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvandoResultado(false)
    }
  }

  async function marcarPerdido() {
    if (!lead) return
    setSalvandoResultado(true)
    setErroResultado(null)
    try {
      const agora = new Date().toISOString()
      const { error } = await supabase
        .from('leads')
        .update({ resultado: 'perdido', resultado_data: agora })
        .eq('id', lead.id)
      if (error) throw error
      onAtualizarLead(lead.id, { resultado: 'perdido', resultado_data: agora })
    } catch (err) {
      console.error('Erro ao marcar lead como perdido:', err)
      setErroResultado('Não foi possível salvar. Tente de novo.')
    } finally {
      setSalvandoResultado(false)
    }
  }

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
              <span style={{ fontSize: 12.5, color: 'var(--sub)' }}>{formatarTelefone(lead.phone)}</span>
            </div>
          </div>
          <button onClick={onFechar} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', color: 'var(--sub)' }}><X size={18} /></button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <BadgeOrigem origem={lead.origem} />
          <span style={{ background: 'var(--mist)', border: '1px solid var(--line)', fontSize: 11, fontWeight: 600, color: 'var(--sub)', borderRadius: 9, padding: '4px 10px' }}>
            Criado em {fmtData(lead.created_at)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>Status:</span>
          <select
            value={lead.status ?? ''}
            disabled={atualizando}
            onChange={(e) => onMudarStatus(lead.id, e.target.value)}
            style={{
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#227069',
              border: '1.5px solid var(--line)', borderRadius: 10, padding: '6px 8px',
              background: 'var(--card-bg)', cursor: atualizando ? 'wait' : 'pointer', textTransform: 'capitalize',
            }}
          >
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          {lead.resultado === 'ganho' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#DFF7E9', color: '#1E7C46', borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700 }}>
              <CheckCircle2 size={15} />
              Ganho — {fmtValorPotencial(lead.valor_fechado)}{lead.resultado_data ? ` em ${fmtData(lead.resultado_data)}` : ''}
            </div>
          ) : lead.resultado === 'perdido' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FBE3DF', color: '#B5473A', borderRadius: 12, padding: '9px 12px', fontSize: 12.5, fontWeight: 700 }}>
              <XCircle size={15} />
              Perdido{lead.resultado_data ? ` em ${fmtData(lead.resultado_data)}` : ''}
            </div>
          ) : marcandoGanho ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--mist)', border: '1px solid var(--line)', borderRadius: 12, padding: 12 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink)' }}>Valor fechado (R$)</span>
              <input
                type="number"
                inputMode="decimal"
                autoFocus
                value={valorFechadoInput}
                onChange={(e) => setValorFechadoInput(e.target.value)}
                style={campoInputStyle}
              />
              {erroResultado && (
                <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '6px 10px', fontSize: 12, margin: 0 }}>{erroResultado}</p>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={confirmarGanho}
                  disabled={salvandoResultado}
                  style={{
                    flex: 1, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 10,
                    padding: '7px 10px', background: salvandoResultado ? 'var(--sub)' : '#1E7C46', color: '#fff',
                    cursor: salvandoResultado ? 'wait' : 'pointer',
                  }}
                >
                  {salvandoResultado ? 'Salvando…' : 'Confirmar ganho'}
                </button>
                <button
                  onClick={() => { setMarcandoGanho(false); setErroResultado(null) }}
                  disabled={salvandoResultado}
                  style={{
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 700, border: '1px solid var(--line)', borderRadius: 10,
                    padding: '7px 10px', background: 'var(--card-bg)', color: 'var(--sub)', cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setMarcandoGanho(true); setErroResultado(null) }}
                disabled={salvandoResultado}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 10,
                  padding: '8px 10px', background: '#1E7C46', color: '#fff', cursor: salvandoResultado ? 'wait' : 'pointer',
                }}
              >
                <CheckCircle2 size={14} /> Marcar como ganho
              </button>
              <button
                onClick={marcarPerdido}
                disabled={salvandoResultado}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 10,
                  padding: '8px 10px', background: '#B5473A', color: '#fff', cursor: salvandoResultado ? 'wait' : 'pointer',
                }}
              >
                <XCircle size={14} /> {salvandoResultado ? 'Salvando…' : 'Marcar como perdido'}
              </button>
            </div>
          )}
        </div>

        {temEnriquecimento && (
          <div style={{ background: 'var(--mist)', border: '1px solid var(--line)', borderRadius: 14, padding: '12px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lead.nicho && <p style={{ fontSize: 12.5, margin: 0 }}><b>Nicho:</b> {lead.nicho}</p>}
            {lead.score != null && <p style={{ fontSize: 12.5, margin: 0 }}><b>Score:</b> {lead.score}</p>}
            {lead.score_motivo && <p style={{ fontSize: 12.5, margin: 0 }}><b>Motivo do score:</b> {lead.score_motivo}</p>}
            {doresTexto && <p style={{ fontSize: 12.5, margin: 0 }}><b>Dores:</b> {doresTexto}</p>}
            {lead.gancho && <p style={{ fontSize: 12.5, margin: 0 }}><b>Gancho:</b> {lead.gancho}</p>}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
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
                  onClick={() => removerTagModal(tag)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'flex', color: 'var(--sub)', padding: 0 }}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              value={novaTag}
              onChange={(e) => setNovaTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarTagModal() } }}
              placeholder="Nova tag…"
              style={{ ...campoInputStyle, flex: 1 }}
            />
            <button
              onClick={adicionarTagModal}
              style={{
                border: 'none', background: 'var(--mist)', borderRadius: 10, width: 32, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#227069',
              }}
            >
              <Plus size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--sub)', whiteSpace: 'nowrap' }}>Valor potencial (R$)</span>
            <input
              type="number"
              inputMode="decimal"
              value={editValorPotencial}
              onChange={(e) => setEditValorPotencial(e.target.value)}
              placeholder="0,00"
              style={{ ...campoInputStyle, width: 110 }}
            />
          </div>
          {erroTagsValor && (
            <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '6px 10px', fontSize: 12, margin: '0 0 8px' }}>{erroTagsValor}</p>
          )}
          <button
            onClick={salvarTagsValor}
            disabled={salvandoTagsValor}
            style={{
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 10,
              padding: '7px 14px', background: salvandoTagsValor ? 'var(--sub)' : '#227069', color: '#fff',
              cursor: salvandoTagsValor ? 'wait' : 'pointer', opacity: salvandoTagsValor ? 0.65 : 1,
            }}
          >
            {salvandoTagsValor ? 'Salvando…' : 'Salvar tags e valor'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button
            onClick={() => setAba('conversa')}
            style={{
              flex: 1, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
              padding: '8px 10px', borderRadius: 10, border: aba === 'conversa' ? 'none' : '1px solid var(--line)',
              background: aba === 'conversa' ? '#227069' : 'var(--card-bg)',
              color: aba === 'conversa' ? '#fff' : 'var(--sub)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <MessageCircle size={14} />
            Conversa
          </button>
          <button
            onClick={() => setAba('procedimentos')}
            style={{
              flex: 1, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
              padding: '8px 10px', borderRadius: 10, border: aba === 'procedimentos' ? 'none' : '1px solid var(--line)',
              background: aba === 'procedimentos' ? '#227069' : 'var(--card-bg)',
              color: aba === 'procedimentos' ? '#fff' : 'var(--sub)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Stethoscope size={14} />
            Procedimentos
          </button>
          <button
            onClick={() => setAba('historico')}
            style={{
              flex: 1, fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700,
              padding: '8px 10px', borderRadius: 10, border: aba === 'historico' ? 'none' : '1px solid var(--line)',
              background: aba === 'historico' ? '#227069' : 'var(--card-bg)',
              color: aba === 'historico' ? '#fff' : 'var(--sub)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <History size={14} />
            Histórico
          </button>
        </div>

        {aba === 'conversa' ? (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--mist)', borderRadius: 14, padding: 12, minHeight: 120 }}>
            {mensagensCarregando ? (
              <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>Carregando mensagens…</p>
            ) : mensagensErro ? (
              <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>{mensagensErro}</p>
            ) : mensagens.length === 0 ? (
              <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>Nenhuma mensagem registrada ainda.</p>
            ) : (
              mensagens.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.remetente === 'cliente' ? 'flex-start' : 'flex-end',
                    maxWidth: '78%',
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
        ) : aba === 'procedimentos' ? (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--mist)', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#227069' }}>Nova entrada</div>
              <select
                value={formServicoId}
                onChange={(e) => setFormServicoId(e.target.value)}
                style={campoInputStyle}
              >
                <option value="">Serviço (opcional)</option>
                {servicosOpcoes.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
              <input
                type="date"
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
                style={campoInputStyle}
              />
              <textarea
                placeholder="Observações"
                value={formObservacoes}
                onChange={(e) => setFormObservacoes(e.target.value)}
                rows={2}
                style={{ ...campoInputStyle, resize: 'vertical' }}
              />
              <input
                type="text"
                placeholder="Alergias"
                value={formAlergias}
                onChange={(e) => setFormAlergias(e.target.value)}
                style={campoInputStyle}
              />
              {formErroHistorico && (
                <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '6px 10px', fontSize: 12, margin: 0 }}>{formErroHistorico}</p>
              )}
              <button
                onClick={adicionarHistorico}
                disabled={salvandoHistorico}
                style={{
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, border: 'none', borderRadius: 10,
                  padding: '8px 10px', background: '#227069', color: '#fff', cursor: salvandoHistorico ? 'wait' : 'pointer',
                }}
              >
                {salvandoHistorico ? 'Salvando…' : '+ Adicionar procedimento'}
              </button>
            </div>

            {carregandoHistorico ? (
              <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>Carregando histórico…</p>
            ) : erroHistorico ? (
              <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>{erroHistorico}</p>
            ) : historico.length === 0 ? (
              <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>Nenhum procedimento registrado ainda.</p>
            ) : (
              historico.map((h) => {
                const fotosEntrada = fotos.filter((f) => f.historico_id === h.id)
                const servicoNome = servicosOpcoes.find((s) => s.id === h.servico_id)?.nome
                return (
                  <div key={h.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 14, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ fontSize: 13 }}>{servicoNome || 'Procedimento'}</b>
                      <span style={{ fontSize: 11.5, color: 'var(--sub)' }}>{fmtData(h.data)}</span>
                    </div>
                    {h.observacoes && <p style={{ fontSize: 12.5, margin: 0 }}><b>Observações:</b> {h.observacoes}</p>}
                    {h.alergias && <p style={{ fontSize: 12.5, margin: 0, color: '#8C2340' }}><b>Alergias:</b> {h.alergias}</p>}

                    {fotosEntrada.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                        {fotosEntrada.map((f) => (
                          <div key={f.id} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)' }}>
                            {fotoUrls[f.id] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={fotoUrls[f.id]} alt={f.tipo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'var(--mist)' }} />
                            )}
                            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: 9, textAlign: 'center', padding: '1px 0', textTransform: 'capitalize' }}>
                              {f.tipo}
                            </span>
                            {!f.consentimento && (
                              <span title="Sem consentimento para uso" style={{ position: 'absolute', top: 2, right: 2, display: 'flex', color: '#fff', filter: 'drop-shadow(0 0 2px rgba(0,0,0,.6))' }}>
                                <AlertTriangle size={13} />
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => abrirUploadFoto(h.id)}
                      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, border: 'none', background: 'none', color: '#227069', cursor: 'pointer', padding: 0, marginTop: 4 }}
                    >
                      {uploadHistoricoId === h.id ? <X size={13} /> : <Camera size={13} />}
                      {uploadHistoricoId === h.id ? 'Cancelar' : 'Adicionar foto'}
                    </button>

                    {uploadHistoricoId === h.id && (
                      <div style={{ background: 'var(--mist)', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <select value={uploadTipo} onChange={(e) => setUploadTipo(e.target.value as 'antes' | 'depois')} style={campoInputStyle}>
                          <option value="antes">Antes</option>
                          <option value="depois">Depois</option>
                        </select>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setUploadArquivo(e.target.files?.[0] ?? null)}
                          style={{ fontSize: 12 }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={uploadConsentimento}
                            onChange={(e) => setUploadConsentimento(e.target.checked)}
                          />
                          Cliente autorizou o uso desta foto
                        </label>
                        {erroFoto && (
                          <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '6px 10px', fontSize: 12, margin: 0 }}>{erroFoto}</p>
                        )}
                        <button
                          onClick={() => enviarFoto(h.id)}
                          disabled={!uploadArquivo || !uploadConsentimento || enviandoFoto}
                          style={{
                            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 700, border: 'none', borderRadius: 10,
                            padding: '7px 10px', background: (!uploadArquivo || !uploadConsentimento) ? 'var(--line)' : '#227069',
                            color: (!uploadArquivo || !uploadConsentimento) ? 'var(--sub)' : '#fff',
                            cursor: (!uploadArquivo || !uploadConsentimento || enviandoFoto) ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {enviandoFoto ? 'Enviando…' : 'Enviar foto'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {carregandoHistoricoEtapas ? (
              <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>Carregando histórico…</p>
            ) : erroHistoricoEtapas ? (
              <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>{erroHistoricoEtapas}</p>
            ) : historicoEtapas.length === 0 ? (
              <p style={{ color: 'var(--sub)', fontSize: 13, textAlign: 'center' }}>Nenhuma movimentação registrada ainda.</p>
            ) : (
              historicoEtapas.map((h) => (
                <div key={h.id} style={{ background: 'var(--mist)', borderRadius: 12, padding: '10px 12px' }}>
                  <p style={{ fontSize: 12.5, margin: 0, color: 'var(--ink)' }}>
                    {h.etapa_anterior ? (
                      <>{h.etapa_anterior} → <b>{h.nova_etapa}</b></>
                    ) : (
                      <>Lead criado em <b>{h.nova_etapa}</b></>
                    )}
                    {', em '}{fmtDataHoraEtapa(h.created_at)}
                  </p>
                  {h.usuario && (
                    <span style={{ fontSize: 11, color: 'var(--sub)' }}>por {h.usuario}</span>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
