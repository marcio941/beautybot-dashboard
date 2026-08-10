'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

type StatusAgendamento = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
type SinalStatus = 'nao_aplicavel' | 'pendente' | 'pago' | 'expirado'
type Visao = 'lista' | 'calendario'
type FiltroStatus = 'todos' | StatusAgendamento
type Periodo = 'dia' | 'semana'

interface AppointmentRow {
  id: string
  appointment_date: string
  status: StatusAgendamento
  notes: string | null
  servico_id: string | null
  lead_id: string | null
  name: string | null
  profissional_id: string | null
  sinal_status: SinalStatus | null
}

interface ServicoInfo { id: string; nome: string }
interface LeadInfo { id: string; name: string | null; phone: string | null }
interface ProfissionalInfo { id: string; nome: string }

interface Agendamento extends AppointmentRow {
  servicoNome: string | null
  clienteNome: string
  clienteTelefone: string | null
  profissionalNome: string | null
}

type StatusEspera = 'aguardando' | 'notificado' | 'atendido' | 'cancelado'

interface EsperaRow {
  id: string
  lead_id: string
  servico_id: string
  data_desejada: string | null
  status: StatusEspera
}

interface EsperaEnriquecida extends EsperaRow {
  leadNome: string
  leadTelefone: string | null
  servicoNome: string | null
}

const STATUS_ESPERA_LABEL: Record<StatusEspera, string> = {
  aguardando: 'Aguardando',
  notificado: 'Notificado',
  atendido: 'Atendido',
  cancelado: 'Cancelado',
}

const STATUS_ESPERA_STYLE: Record<StatusEspera, { bg: string; color: string }> = {
  aguardando: { bg: '#FCF3DF', color: '#8A6416' },
  notificado: { bg: '#E3EEFC', color: '#2361B5' },
  atendido: { bg: '#DFF7E9', color: '#1E7C46' },
  cancelado: { bg: '#ECECEC', color: '#5C5C5C' },
}

const PROXIMIDADE_ESPERA_MS = 3 * 24 * 60 * 60 * 1000

const TZ = 'America/Sao_Paulo'

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  scheduled: 'Agendado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
}

const STATUS_STYLE: Record<StatusAgendamento, { bg: string; color: string }> = {
  scheduled: { bg: '#E3EEFC', color: '#2361B5' },
  completed: { bg: '#DFF7E9', color: '#1E7C46' },
  cancelled: { bg: '#FBE3DF', color: '#B5473A' },
  no_show: { bg: '#ECECEC', color: '#5C5C5C' },
}

const SINAL_LABEL: Record<SinalStatus, string> = {
  nao_aplicavel: '',
  pendente: 'Sinal pendente',
  pago: 'Sinal pago',
  expirado: 'Sinal expirado',
}

const SINAL_STYLE: Record<SinalStatus, { bg: string; color: string }> = {
  nao_aplicavel: { bg: 'transparent', color: 'transparent' },
  pendente: { bg: '#FCF3DF', color: '#8A6416' },
  pago: { bg: '#DFF7E9', color: '#1E7C46' },
  expirado: { bg: '#FBE3DF', color: '#B5473A' },
}

const FILTROS: { id: FiltroStatus; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'scheduled', label: 'Agendado' },
  { id: 'completed', label: 'Concluído' },
  { id: 'cancelled', label: 'Cancelado' },
  { id: 'no_show', label: 'Não compareceu' },
]

const fmtDiaSemanaCurto = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: TZ })
const fmtDiaNum = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: TZ })
const fmtMesCurto = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: TZ })
const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
const fmtCompleto = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: TZ,
})

const chaveDia = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

const addDias = (chave: string, delta: number) => {
  const d = new Date(`${chave}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + delta)
  return d.toISOString().slice(0, 10)
}

// Segunda = 1 ... Domingo = 7, mesma convenção Luxon usada em contas.horarios_funcionamento.
const diaSemanaLuxon = (chave: string) => {
  const js = new Date(`${chave}T00:00:00Z`).getUTCDay()
  return js === 0 ? 7 : js
}

const inicioDaSemana = (chave: string) => addDias(chave, -(diaSemanaLuxon(chave) - 1))

const formatarTelefone = (phone: string | null) => {
  if (!phone) return '—'
  return phone
    .replace('@s.whatsapp.net', '')
    .replace(/^55/, '')
    .replace(/(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--card-bg)', borderRadius: 22,
  boxShadow: 'var(--shadow)', ...style,
})

const navBtnStyle: React.CSSProperties = {
  border: '1.5px solid var(--line)', background: 'var(--card-bg)', color: '#227069',
  width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16, fontWeight: 700,
}

async function buscarPorIds<T>(tabela: string, colunas: string, ids: string[]): Promise<T[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from(tabela).select(colunas).in('id', ids)
  if (error) {
    console.error(`Erro ao buscar ${tabela}:`, error.message)
    return []
  }
  return (data ?? []) as T[]
}

function BadgeStatus({ status }: { status: StatusAgendamento }) {
  const s = STATUS_STYLE[status]
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap' }}>
      {STATUS_LABEL[status]}
    </span>
  )
}

function BadgeSinal({ status }: { status: SinalStatus | null }) {
  if (!status || status === 'nao_aplicavel') return null
  const s = SINAL_STYLE[status]
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap' }}>
      {SINAL_LABEL[status]}
    </span>
  )
}

function SeletorStatus({ value, disabled, onChange }: {
  value: StatusAgendamento
  disabled: boolean
  onChange: (status: StatusAgendamento) => void
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StatusAgendamento)}
      style={{
        fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#227069',
        border: '1.5px solid var(--line)', borderRadius: 10, padding: '6px 8px',
        background: 'var(--card-bg)', cursor: disabled ? 'wait' : 'pointer',
      }}
    >
      {(Object.keys(STATUS_LABEL) as StatusAgendamento[]).map((s) => (
        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
      ))}
    </select>
  )
}

function LinhaAgendamento({ a, atualizando, mostrarProfissional, onMudarStatus, onAbrirDetalhe }: {
  a: Agendamento
  atualizando: boolean
  mostrarProfissional: boolean
  onMudarStatus: (id: string, status: StatusAgendamento) => void
  onAbrirDetalhe: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E7F2F0', color: '#227069', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {a.clienteNome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: '1 1 160px', minWidth: 0, cursor: 'pointer' }} onClick={() => onAbrirDetalhe(a.id)}>
        <b style={{ fontSize: 13.5, display: 'block', color: 'var(--ink)' }}>{a.clienteNome}</b>
        <small style={{ fontSize: 11.5, color: 'var(--sub)' }}>{formatarTelefone(a.clienteTelefone)}</small>
      </div>
      <div style={{ flex: '1 1 140px', fontSize: 12.5, color: 'var(--ink)' }}>{a.servicoNome ?? '—'}</div>
      {mostrarProfissional && (
        <div style={{ flex: '1 1 130px', fontSize: 12.5, color: 'var(--ink)' }}>{a.profissionalNome ?? '—'}</div>
      )}
      <div style={{ flex: '1 1 210px', fontSize: 12.5, color: '#227069', fontWeight: 600, textTransform: 'capitalize' }}>
        {fmtCompleto.format(new Date(a.appointment_date))}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', gap: 6 }}>
        <BadgeStatus status={a.status} />
        <BadgeSinal status={a.sinal_status} />
      </div>
      <div style={{ flexShrink: 0 }}>
        <SeletorStatus value={a.status} disabled={atualizando} onChange={(s) => onMudarStatus(a.id, s)} />
      </div>
    </div>
  )
}

function ModalDetalhe({ a, atualizando, onFechar, onMudarStatus }: {
  a: Agendamento
  atualizando: boolean
  onFechar: () => void
  onMudarStatus: (id: string, status: StatusAgendamento) => void
}) {
  return (
    <div
      onClick={onFechar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(18,48,44,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}
    >
      <div onClick={(e) => e.stopPropagation()} style={card({ padding: 24, maxWidth: 380, width: '100%' })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div>
            <b style={{ fontSize: 16, display: 'block' }}>{a.clienteNome}</b>
            <span style={{ fontSize: 12.5, color: 'var(--sub)' }}>{formatarTelefone(a.clienteTelefone)}</span>
          </div>
          <button onClick={onFechar} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--sub)' }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}><b>Serviço:</b> {a.servicoNome ?? '—'}</p>
        {a.profissionalNome && (
          <p style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}><b>Profissional:</b> {a.profissionalNome}</p>
        )}
        <p style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6, textTransform: 'capitalize' }}>
          <b>Quando:</b> {fmtCompleto.format(new Date(a.appointment_date))}
        </p>
        {a.notes && <p style={{ fontSize: 13, color: 'var(--ink)', marginBottom: 6 }}><b>Observação:</b> {a.notes}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <BadgeStatus status={a.status} />
          <BadgeSinal status={a.sinal_status} />
          <SeletorStatus value={a.status} disabled={atualizando} onChange={(s) => onMudarStatus(a.id, s)} />
        </div>
      </div>
    </div>
  )
}

export default function Appointments({ onAbrirConversa }: { onAbrirConversa?: (leadId: string) => void } = {}) {
  const { contaId } = useProfile()
  const [montado, setMontado] = useState(false)
  const [visao, setVisao] = useState<Visao>('lista')
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const [filtroProfissional, setFiltroProfissional] = useState<string>('todos')
  const [periodo, setPeriodo] = useState<Periodo>('semana')

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [profissionais, setProfissionais] = useState<ProfissionalInfo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null)

  const [referencia, setReferencia] = useState<string | null>(null)
  const [detalheId, setDetalheId] = useState<string | null>(null)

  const [avisoCancelamento, setAvisoCancelamento] = useState<{ agendamento: Agendamento; esperando: EsperaEnriquecida[] } | null>(null)

  const [listaEspera, setListaEspera] = useState<EsperaEnriquecida[]>([])
  const [carregandoEspera, setCarregandoEspera] = useState(true)
  const [erroEspera, setErroEspera] = useState<string | null>(null)
  const [atualizandoEsperaId, setAtualizandoEsperaId] = useState<string | null>(null)

  const [leadsOpcoes, setLeadsOpcoes] = useState<LeadInfo[]>([])
  const [servicosOpcoes, setServicosOpcoes] = useState<ServicoInfo[]>([])

  const [formEsperaLeadId, setFormEsperaLeadId] = useState('')
  const [formEsperaServicoId, setFormEsperaServicoId] = useState('')
  const [formEsperaData, setFormEsperaData] = useState('')
  const [formErroEspera, setFormErroEspera] = useState<string | null>(null)
  const [salvandoEspera, setSalvandoEspera] = useState(false)

  useEffect(() => {
    setMontado(true)
    setReferencia(chaveDia(new Date().toISOString()))
  }, [])

  useEffect(() => {
    if (!contaId) return
    let ativo = true
    async function carregarProfissionais() {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, nome')
        .eq('conta_id', contaId)
        .order('nome', { ascending: true })
      if (error) { console.error('Erro ao buscar profissionais:', error.message); return }
      if (ativo) setProfissionais((data ?? []) as ProfissionalInfo[])
    }
    carregarProfissionais()
    return () => { ativo = false }
  }, [contaId])

  useEffect(() => {
    if (!contaId) return
    let ativo = true
    async function carregarOpcoes() {
      const [leadsRes, servicosRes] = await Promise.all([
        supabase.from('leads').select('id, name, phone').eq('conta_id', contaId).order('name', { ascending: true }),
        supabase.from('servicos').select('id, nome').eq('conta_id', contaId).eq('ativo', true).order('nome', { ascending: true }),
      ])
      if (leadsRes.error) console.error('Erro ao buscar leads:', leadsRes.error.message)
      if (servicosRes.error) console.error('Erro ao buscar serviços:', servicosRes.error.message)
      if (!ativo) return
      setLeadsOpcoes((leadsRes.data ?? []) as LeadInfo[])
      setServicosOpcoes((servicosRes.data ?? []) as ServicoInfo[])
    }
    carregarOpcoes()
    return () => { ativo = false }
  }, [contaId])

  const carregarEspera = useCallback(async () => {
    setCarregandoEspera(true)
    setErroEspera(null)
    try {
      const { data, error } = await supabase
        .from('lista_espera')
        .select('id, lead_id, servico_id, data_desejada, status')
        .order('status', { ascending: true })
      if (error) throw error

      const linhas = (data ?? []) as EsperaRow[]
      const leadIds = Array.from(new Set(linhas.map((l) => l.lead_id).filter((v): v is string => !!v)))
      const servicoIds = Array.from(new Set(linhas.map((l) => l.servico_id).filter((v): v is string => !!v)))

      const [leadsData, servicosData] = await Promise.all([
        buscarPorIds<LeadInfo>('leads', 'id, name, phone', leadIds),
        buscarPorIds<ServicoInfo>('servicos', 'id, nome', servicoIds),
      ])
      const leadsMap = new Map(leadsData.map((l) => [l.id, l]))
      const servicosMap = new Map(servicosData.map((s) => [s.id, s.nome]))

      const enriquecidos: EsperaEnriquecida[] = linhas.map((l) => ({
        ...l,
        leadNome: leadsMap.get(l.lead_id)?.name || 'Cliente',
        leadTelefone: leadsMap.get(l.lead_id)?.phone ?? null,
        servicoNome: l.servico_id ? servicosMap.get(l.servico_id) ?? null : null,
      }))

      setListaEspera(enriquecidos)
    } catch (err) {
      console.error('Erro ao carregar lista de espera:', err)
      setErroEspera('Não foi possível carregar a lista de espera. Tente recarregar.')
      setListaEspera([])
    } finally {
      setCarregandoEspera(false)
    }
  }, [])

  useEffect(() => { carregarEspera() }, [carregarEspera])

  const verificarEspera = useCallback(async (agendamentoCancelado: Agendamento) => {
    if (!agendamentoCancelado.servico_id) return
    try {
      const { data, error } = await supabase
        .from('lista_espera')
        .select('id, lead_id, servico_id, data_desejada, status')
        .eq('servico_id', agendamentoCancelado.servico_id)
        .eq('status', 'aguardando')
      if (error) throw error

      const candidatos = (data ?? []) as EsperaRow[]
      const alvo = new Date(agendamentoCancelado.appointment_date).getTime()
      const proximos = candidatos.filter((c) => {
        if (!c.data_desejada) return true
        return Math.abs(new Date(c.data_desejada).getTime() - alvo) <= PROXIMIDADE_ESPERA_MS
      })
      if (proximos.length === 0) return

      const leadIds = Array.from(new Set(proximos.map((p) => p.lead_id)))
      const leadsData = await buscarPorIds<LeadInfo>('leads', 'id, name, phone', leadIds)
      const leadsMap = new Map(leadsData.map((l) => [l.id, l]))

      const enriquecidos: EsperaEnriquecida[] = proximos.map((p) => ({
        ...p,
        leadNome: leadsMap.get(p.lead_id)?.name || 'Cliente',
        leadTelefone: leadsMap.get(p.lead_id)?.phone ?? null,
        servicoNome: agendamentoCancelado.servicoNome,
      }))

      setAvisoCancelamento({ agendamento: agendamentoCancelado, esperando: enriquecidos })
    } catch (err) {
      console.error('Erro ao verificar lista de espera:', err)
    }
  }, [])

  async function adicionarEspera() {
    if (!contaId || salvandoEspera) return
    if (!formEsperaLeadId) { setFormErroEspera('Selecione o lead.'); return }
    if (!formEsperaServicoId) { setFormErroEspera('Selecione o serviço.'); return }

    setFormErroEspera(null)
    setSalvandoEspera(true)
    try {
      const payload: { conta_id: string; lead_id: string; servico_id: string; status: StatusEspera; data_desejada?: string } = {
        conta_id: contaId, lead_id: formEsperaLeadId, servico_id: formEsperaServicoId, status: 'aguardando',
      }
      if (formEsperaData) payload.data_desejada = new Date(formEsperaData).toISOString()

      const { data, error } = await supabase
        .from('lista_espera')
        .insert(payload)
        .select('id, lead_id, servico_id, data_desejada, status')
        .single()
      if (error) throw error

      const lead = leadsOpcoes.find((l) => l.id === formEsperaLeadId)
      const servico = servicosOpcoes.find((s) => s.id === formEsperaServicoId)
      const novo: EsperaEnriquecida = {
        ...(data as EsperaRow),
        leadNome: lead?.name || 'Cliente',
        leadTelefone: lead?.phone ?? null,
        servicoNome: servico?.nome ?? null,
      }
      setListaEspera((prev) => [novo, ...prev])
      setFormEsperaLeadId('')
      setFormEsperaServicoId('')
      setFormEsperaData('')
    } catch (err) {
      console.error('Erro ao adicionar à lista de espera:', err)
      setFormErroEspera('Não foi possível adicionar à lista de espera. Tente de novo.')
    } finally {
      setSalvandoEspera(false)
    }
  }

  async function mudarStatusEspera(id: string, status: StatusEspera) {
    setAtualizandoEsperaId(id)
    setErroEspera(null)
    try {
      const { error } = await supabase.from('lista_espera').update({ status }).eq('id', id)
      if (error) throw error
      setListaEspera((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
    } catch (err) {
      console.error('Erro ao atualizar status da lista de espera:', err)
      setErroEspera('Não foi possível atualizar o status. Tente de novo.')
    } finally {
      setAtualizandoEsperaId(null)
    }
  }

  const usaProfissionais = profissionais.length > 0
  const mostrarFiltroProfissional = profissionais.length > 1

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, notes, servico_id, lead_id, name, profissional_id, sinal_status')
        .order('appointment_date', { ascending: true })
      if (error) throw error

      const linhas = (data ?? []) as AppointmentRow[]
      const servicoIds = Array.from(new Set(linhas.map((a) => a.servico_id).filter((v): v is string => !!v)))
      const leadIds = Array.from(new Set(linhas.map((a) => a.lead_id).filter((v): v is string => !!v)))
      const profissionalIds = Array.from(new Set(linhas.map((a) => a.profissional_id).filter((v): v is string => !!v)))

      const [servicosData, leadsData, profissionaisData] = await Promise.all([
        buscarPorIds<ServicoInfo>('servicos', 'id, nome', servicoIds),
        buscarPorIds<LeadInfo>('leads', 'id, name, phone', leadIds),
        buscarPorIds<ProfissionalInfo>('profissionais', 'id, nome', profissionalIds),
      ])

      const servicosMap = new Map(servicosData.map((s) => [s.id, s.nome]))
      const leadsMap = new Map(leadsData.map((l) => [l.id, l]))
      const profissionaisMap = new Map(profissionaisData.map((p) => [p.id, p.nome]))

      const enriquecidos: Agendamento[] = linhas.map((a) => {
        const lead = a.lead_id ? leadsMap.get(a.lead_id) : undefined
        return {
          ...a,
          servicoNome: a.servico_id ? servicosMap.get(a.servico_id) ?? null : null,
          clienteNome: lead?.name || a.name || 'Cliente',
          clienteTelefone: lead?.phone ?? null,
          profissionalNome: a.profissional_id ? profissionaisMap.get(a.profissional_id) ?? null : null,
        }
      })

      setAgendamentos(enriquecidos)
    } catch (err) {
      console.error('Erro ao carregar agendamentos:', err)
      setErro('Não foi possível carregar os agendamentos. Tente recarregar.')
      setAgendamentos([])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const mudarStatus = useCallback(async (id: string, status: StatusAgendamento) => {
    setAtualizandoId(id)
    setErro(null)
    try {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
      setAgendamentos((prev) => {
        const alvo = prev.find((a) => a.id === id)
        if (status === 'cancelled' && alvo) verificarEspera({ ...alvo, status })
        return prev.map((a) => (a.id === id ? { ...a, status } : a))
      })
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setErro('Não foi possível atualizar o status. Tente de novo.')
    } finally {
      setAtualizandoId(null)
    }
  }, [verificarEspera])

  const agendamentosVisiveis = useMemo(
    () => (mostrarFiltroProfissional && filtroProfissional !== 'todos'
      ? agendamentos.filter((a) => a.profissional_id === filtroProfissional)
      : agendamentos),
    [agendamentos, mostrarFiltroProfissional, filtroProfissional]
  )

  const listaFiltrada = useMemo(
    () => (filtro === 'todos' ? agendamentosVisiveis : agendamentosVisiveis.filter((a) => a.status === filtro)),
    [agendamentosVisiveis, filtro]
  )

  // diasPeriodo só ganha datas reais depois do mount (referencia deixa de ser null);
  // antes disso a grade de calendário fica vazia, sem cálculo de Date/Intl no render inicial.
  const diasPeriodo = useMemo(() => {
    if (!referencia) return []
    if (periodo === 'dia') return [referencia]
    const inicio = inicioDaSemana(referencia)
    return Array.from({ length: 7 }, (_, i) => addDias(inicio, i))
  }, [referencia, periodo])

  const porDia = useMemo(() => {
    const mapa = new Map<string, Agendamento[]>()
    for (const chave of diasPeriodo) mapa.set(chave, [])
    for (const a of agendamentosVisiveis) {
      const chave = chaveDia(a.appointment_date)
      if (mapa.has(chave)) mapa.get(chave)!.push(a)
    }
    return mapa
  }, [agendamentosVisiveis, diasPeriodo])

  function irPara(delta: number) {
    setReferencia((prev) => (prev ? addDias(prev, periodo === 'dia' ? delta : delta * 7) : prev))
  }
  function irParaHoje() {
    setReferencia(chaveDia(new Date().toISOString()))
  }

  const detalhe = agendamentos.find((a) => a.id === detalheId) ?? null

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>🗓 Agendamentos</h2>
          <p style={{ color: 'var(--sub)', fontSize: 13 }}>Gerencie todos os agendamentos da clínica.</p>
        </div>
        {mostrarFiltroProfissional && (
          <select
            value={filtroProfissional}
            onChange={(e) => setFiltroProfissional(e.target.value)}
            style={{
              fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, color: '#227069',
              border: '1.5px solid var(--line)', borderRadius: 10, padding: '9px 10px',
              background: 'var(--card-bg)', cursor: 'pointer',
            }}
          >
            <option value="todos">Todos os profissionais</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        )}
        <div style={{ ...card(), padding: 5, display: 'flex', gap: 4 }}>
          {(['lista', 'calendario'] as Visao[]).map((v) => (
            <button
              key={v}
              onClick={() => setVisao(v)}
              style={{
                border: 'none', background: visao === v ? '#2E8F87' : 'none',
                color: visao === v ? '#fff' : 'var(--sub)', fontFamily: 'inherit',
                fontSize: 12, fontWeight: 600, padding: '7px 16px', borderRadius: 10, cursor: 'pointer',
                boxShadow: visao === v ? '0 4px 10px rgba(46,143,135,.3)' : 'none',
              }}
            >
              {v === 'lista' ? 'Lista' : 'Calendário'}
            </button>
          ))}
        </div>
      </div>

      {erro && <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{erro}</p>}

      {avisoCancelamento && (
        <div style={{ background: '#FCF3DF', border: '1px solid #F0D889', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <b style={{ fontSize: 13.5, color: '#8A6416' }}>
                ⚠️ {avisoCancelamento.esperando.length} {avisoCancelamento.esperando.length === 1 ? 'pessoa está esperando' : 'pessoas estão esperando'} por esse horário
              </b>
              <p style={{ fontSize: 12.5, color: '#8A6416', margin: '4px 0 0' }}>
                {avisoCancelamento.agendamento.servicoNome ?? 'Serviço'} — {fmtCompleto.format(new Date(avisoCancelamento.agendamento.appointment_date))}
              </p>
            </div>
            <button
              onClick={() => setAvisoCancelamento(null)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#8A6416' }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {avisoCancelamento.esperando.map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#fff', borderRadius: 10, padding: '8px 12px', flexWrap: 'wrap' }}>
                <div>
                  <b style={{ fontSize: 12.5 }}>{e.leadNome}</b>
                  <span style={{ fontSize: 11.5, color: 'var(--sub)', marginLeft: 8 }}>{formatarTelefone(e.leadTelefone)}</span>
                </div>
                <button
                  onClick={() => onAbrirConversa?.(e.lead_id)}
                  disabled={!onAbrirConversa}
                  style={{ border: 'none', background: '#227069', color: '#fff', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, padding: '6px 12px', borderRadius: 8, cursor: onAbrirConversa ? 'pointer' : 'default', opacity: onAbrirConversa ? 1 : 0.5 }}
                >
                  Ver conversa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {visao === 'lista' ? (
        <section style={card()}>
          <div style={{ padding: '16px 18px 4px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                style={{
                  border: '1.5px solid', borderColor: filtro === f.id ? '#2E8F87' : 'var(--line)',
                  background: filtro === f.id ? '#2E8F87' : 'var(--card-bg)',
                  color: filtro === f.id ? '#fff' : 'var(--sub)',
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '7px 14px',
                  borderRadius: 20, cursor: 'pointer',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ padding: '8px 0 4px' }}>
            {carregando ? (
              <p style={{ color: 'var(--sub)', fontSize: 13, padding: '20px 18px' }}>Carregando agendamentos…</p>
            ) : listaFiltrada.length === 0 ? (
              <p style={{ color: 'var(--sub)', fontSize: 13, padding: '20px 18px' }}>
                {filtro === 'todos'
                  ? 'Nenhum agendamento encontrado.'
                  : `Nenhum agendamento com status "${FILTROS.find((f) => f.id === filtro)?.label}".`}
              </p>
            ) : (
              listaFiltrada.map((a) => (
                <LinhaAgendamento
                  key={a.id}
                  a={a}
                  atualizando={atualizandoId === a.id}
                  mostrarProfissional={usaProfissionais}
                  onMudarStatus={mudarStatus}
                  onAbrirDetalhe={setDetalheId}
                />
              ))
            )}
          </div>
        </section>
      ) : (
        <section style={card({ padding: '16px 18px' })}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => irPara(-1)} style={navBtnStyle}>‹</button>
              <button onClick={irParaHoje} style={{ ...navBtnStyle, width: 'auto', padding: '0 14px' }}>Hoje</button>
              <button onClick={() => irPara(1)} style={navBtnStyle}>›</button>
            </div>
            <div style={{ ...card(), padding: 5, display: 'flex', gap: 4 }}>
              {(['dia', 'semana'] as Periodo[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  style={{
                    border: 'none', background: periodo === p ? '#2E8F87' : 'none',
                    color: periodo === p ? '#fff' : 'var(--sub)', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                  }}
                >
                  {p === 'dia' ? 'Dia' : 'Semana'}
                </button>
              ))}
            </div>
          </div>

          {!montado || !referencia || carregando ? (
            <p style={{ color: 'var(--sub)', fontSize: 13, padding: '12px 4px' }}>Carregando calendário…</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${diasPeriodo.length}, 1fr)`, gap: 10 }}>
              {diasPeriodo.map((chave) => {
                const d = new Date(`${chave}T12:00:00Z`)
                const itens = (porDia.get(chave) ?? [])
                  .slice()
                  .sort((x, y) => x.appointment_date.localeCompare(y.appointment_date))
                const hoje = chave === chaveDia(new Date().toISOString())
                return (
                  <div key={chave} style={{ minWidth: 0 }}>
                    <div style={{ textAlign: 'center', marginBottom: 8, padding: '6px 0', borderRadius: 10, background: hoje ? '#227069' : 'var(--mist)', color: hoje ? '#fff' : 'var(--ink)' }}>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em', opacity: .85 }}>
                        {fmtDiaSemanaCurto.format(d).replace('.', '')}
                      </div>
                      <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        {fmtDiaNum.format(d)} <span style={{ fontSize: 11, fontWeight: 500 }}>{fmtMesCurto.format(d).replace('.', '')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
                      {itens.length === 0 && <p style={{ fontSize: 11, color: 'var(--sub)', textAlign: 'center' }}>—</p>}
                      {itens.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setDetalheId(a.id)}
                          style={{
                            textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                            background: STATUS_STYLE[a.status].bg, color: STATUS_STYLE[a.status].color,
                            borderRadius: 10, padding: '6px 8px', fontSize: 11.5,
                          }}
                        >
                          <b style={{ display: 'block', fontSize: 12 }}>{fmtHora.format(new Date(a.appointment_date))}</b>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.clienteNome}</span>
                          <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: .8 }}>{a.servicoNome ?? '—'}</span>
                          {usaProfissionais && (
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: .8 }}>{a.profissionalNome ?? '—'}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      <section style={{ ...card(), padding: '20px 22px', marginTop: 22 }}>
        <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 20, color: '#227069', margin: '0 0 4px' }}>🕒 Lista de Espera</h3>
        <p style={{ color: 'var(--sub)', fontSize: 13, margin: '0 0 18px' }}>
          Clientes aguardando um horário para um serviço específico.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', flex: '1 1 180px' }}>
            Lead
            <select
              value={formEsperaLeadId}
              onChange={(e) => setFormEsperaLeadId(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 6, border: '1.5px solid var(--line)', borderRadius: 10, padding: '9px 10px', fontFamily: 'inherit', fontSize: 13, background: 'var(--card-bg)', color: 'var(--ink)', cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <option value="">Selecione…</option>
              {leadsOpcoes.map((l) => (
                <option key={l.id} value={l.id}>{l.name || formatarTelefone(l.phone)}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', flex: '1 1 180px' }}>
            Serviço
            <select
              value={formEsperaServicoId}
              onChange={(e) => setFormEsperaServicoId(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 6, border: '1.5px solid var(--line)', borderRadius: 10, padding: '9px 10px', fontFamily: 'inherit', fontSize: 13, background: 'var(--card-bg)', color: 'var(--ink)', cursor: 'pointer', boxSizing: 'border-box' }}
            >
              <option value="">Selecione…</option>
              {servicosOpcoes.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', flex: '1 1 180px' }}>
            Data desejada (opcional)
            <input
              type="datetime-local"
              value={formEsperaData}
              onChange={(e) => setFormEsperaData(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: 6, border: '1.5px solid var(--line)', borderRadius: 10, padding: '8px 10px', fontFamily: 'inherit', fontSize: 13, background: 'var(--card-bg)', color: 'var(--ink)', boxSizing: 'border-box' }}
            />
          </label>
          <button
            onClick={adicionarEspera}
            disabled={salvandoEspera || !contaId}
            style={{
              border: 'none', cursor: salvandoEspera ? 'wait' : 'pointer', background: 'var(--accent)', color: '#fff',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '10px 18px',
              borderRadius: 10, opacity: salvandoEspera || !contaId ? 0.6 : 1, flexShrink: 0,
            }}
          >
            {salvandoEspera ? 'Adicionando…' : '+ Adicionar'}
          </button>
        </div>

        {formErroEspera && (
          <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>{formErroEspera}</p>
        )}
        {erroEspera && (
          <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>{erroEspera}</p>
        )}

        {carregandoEspera ? (
          <p style={{ color: 'var(--sub)', fontSize: 13 }}>Carregando lista de espera…</p>
        ) : listaEspera.length === 0 ? (
          <p style={{ color: 'var(--sub)', fontSize: 13 }}>Ninguém na lista de espera no momento.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {listaEspera.map((e) => {
              const s = STATUS_ESPERA_STYLE[e.status]
              return (
                <div key={e.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                    <b style={{ fontSize: 13 }}>{e.leadNome}</b>
                    <span style={{ fontSize: 11.5, color: 'var(--sub)', marginLeft: 8 }}>{formatarTelefone(e.leadTelefone)}</span>
                  </div>
                  <div style={{ flex: '1 1 140px', fontSize: 12.5, color: 'var(--ink)' }}>{e.servicoNome ?? '—'}</div>
                  <div style={{ flex: '1 1 160px', fontSize: 12.5, color: '#227069', fontWeight: 600 }}>
                    {e.data_desejada ? fmtCompleto.format(new Date(e.data_desejada)) : 'Qualquer horário'}
                  </div>
                  <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                    {STATUS_ESPERA_LABEL[e.status]}
                  </span>
                  <select
                    value={e.status}
                    disabled={atualizandoEsperaId === e.id}
                    onChange={(ev) => mudarStatusEspera(e.id, ev.target.value as StatusEspera)}
                    style={{
                      fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#227069',
                      border: '1.5px solid var(--line)', borderRadius: 10, padding: '6px 8px',
                      background: 'var(--card-bg)', cursor: atualizandoEsperaId === e.id ? 'wait' : 'pointer',
                    }}
                  >
                    {(Object.keys(STATUS_ESPERA_LABEL) as StatusEspera[]).map((st) => (
                      <option key={st} value={st}>{STATUS_ESPERA_LABEL[st]}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => onAbrirConversa?.(e.lead_id)}
                    disabled={!onAbrirConversa}
                    style={{ border: '1.5px solid var(--line)', background: 'var(--card-bg)', color: '#227069', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 9, cursor: onAbrirConversa ? 'pointer' : 'default', flexShrink: 0, opacity: onAbrirConversa ? 1 : 0.5 }}
                  >
                    Ver conversa
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {detalhe && (
        <ModalDetalhe
          a={detalhe}
          atualizando={atualizandoId === detalhe.id}
          onFechar={() => setDetalheId(null)}
          onMudarStatus={mudarStatus}
        />
      )}
    </div>
  )
}
