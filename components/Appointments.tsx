'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type StatusAgendamento = 'scheduled' | 'completed' | 'cancelled' | 'no_show'
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
}

interface ServicoInfo { id: string; nome: string }
interface LeadInfo { id: string; name: string | null; phone: string | null }

interface Agendamento extends AppointmentRow {
  servicoNome: string | null
  clienteNome: string
  clienteTelefone: string | null
}

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
  background: '#fff', borderRadius: 22,
  boxShadow: '0 10px 30px rgba(30,70,66,.08)', ...style,
})

const navBtnStyle: React.CSSProperties = {
  border: '1.5px solid #DFE9E7', background: '#fff', color: '#227069',
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
        border: '1.5px solid #DFE9E7', borderRadius: 10, padding: '6px 8px',
        background: '#fff', cursor: disabled ? 'wait' : 'pointer',
      }}
    >
      {(Object.keys(STATUS_LABEL) as StatusAgendamento[]).map((s) => (
        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
      ))}
    </select>
  )
}

function LinhaAgendamento({ a, atualizando, onMudarStatus, onAbrirDetalhe }: {
  a: Agendamento
  atualizando: boolean
  onMudarStatus: (id: string, status: StatusAgendamento) => void
  onAbrirDetalhe: (id: string) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: '1px solid #EEF3F2', flexWrap: 'wrap' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E7F2F0', color: '#227069', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
        {a.clienteNome.charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: '1 1 160px', minWidth: 0, cursor: 'pointer' }} onClick={() => onAbrirDetalhe(a.id)}>
        <b style={{ fontSize: 13.5, display: 'block' }}>{a.clienteNome}</b>
        <small style={{ fontSize: 11.5, color: '#6E807D' }}>{formatarTelefone(a.clienteTelefone)}</small>
      </div>
      <div style={{ flex: '1 1 140px', fontSize: 12.5, color: '#3A5754' }}>{a.servicoNome ?? '—'}</div>
      <div style={{ flex: '1 1 210px', fontSize: 12.5, color: '#227069', fontWeight: 600, textTransform: 'capitalize' }}>
        {fmtCompleto.format(new Date(a.appointment_date))}
      </div>
      <div style={{ flexShrink: 0 }}><BadgeStatus status={a.status} /></div>
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
            <span style={{ fontSize: 12.5, color: '#6E807D' }}>{formatarTelefone(a.clienteTelefone)}</span>
          </div>
          <button onClick={onFechar} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, color: '#6E807D' }}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: '#3A5754', marginBottom: 6 }}><b>Serviço:</b> {a.servicoNome ?? '—'}</p>
        <p style={{ fontSize: 13, color: '#3A5754', marginBottom: 6, textTransform: 'capitalize' }}>
          <b>Quando:</b> {fmtCompleto.format(new Date(a.appointment_date))}
        </p>
        {a.notes && <p style={{ fontSize: 13, color: '#3A5754', marginBottom: 6 }}><b>Observação:</b> {a.notes}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <BadgeStatus status={a.status} />
          <SeletorStatus value={a.status} disabled={atualizando} onChange={(s) => onMudarStatus(a.id, s)} />
        </div>
      </div>
    </div>
  )
}

export default function Appointments() {
  const [montado, setMontado] = useState(false)
  const [visao, setVisao] = useState<Visao>('lista')
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const [periodo, setPeriodo] = useState<Periodo>('semana')

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null)

  const [referencia, setReferencia] = useState<string | null>(null)
  const [detalheId, setDetalheId] = useState<string | null>(null)

  useEffect(() => {
    setMontado(true)
    setReferencia(chaveDia(new Date().toISOString()))
  }, [])

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('id, appointment_date, status, notes, servico_id, lead_id, name')
        .order('appointment_date', { ascending: true })
      if (error) throw error

      const linhas = (data ?? []) as AppointmentRow[]
      const servicoIds = Array.from(new Set(linhas.map((a) => a.servico_id).filter((v): v is string => !!v)))
      const leadIds = Array.from(new Set(linhas.map((a) => a.lead_id).filter((v): v is string => !!v)))

      const [servicosData, leadsData] = await Promise.all([
        buscarPorIds<ServicoInfo>('servicos', 'id, nome', servicoIds),
        buscarPorIds<LeadInfo>('leads', 'id, name, phone', leadIds),
      ])

      const servicosMap = new Map(servicosData.map((s) => [s.id, s.nome]))
      const leadsMap = new Map(leadsData.map((l) => [l.id, l]))

      const enriquecidos: Agendamento[] = linhas.map((a) => {
        const lead = a.lead_id ? leadsMap.get(a.lead_id) : undefined
        return {
          ...a,
          servicoNome: a.servico_id ? servicosMap.get(a.servico_id) ?? null : null,
          clienteNome: lead?.name || a.name || 'Cliente',
          clienteTelefone: lead?.phone ?? null,
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
      setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    } catch (err) {
      console.error('Erro ao atualizar status:', err)
      setErro('Não foi possível atualizar o status. Tente de novo.')
    } finally {
      setAtualizandoId(null)
    }
  }, [])

  const listaFiltrada = useMemo(
    () => (filtro === 'todos' ? agendamentos : agendamentos.filter((a) => a.status === filtro)),
    [agendamentos, filtro]
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
    for (const a of agendamentos) {
      const chave = chaveDia(a.appointment_date)
      if (mapa.has(chave)) mapa.get(chave)!.push(a)
    }
    return mapa
  }, [agendamentos, diasPeriodo])

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
          <p style={{ color: '#6E807D', fontSize: 13 }}>Gerencie todos os agendamentos da clínica.</p>
        </div>
        <div style={{ ...card(), padding: 5, display: 'flex', gap: 4 }}>
          {(['lista', 'calendario'] as Visao[]).map((v) => (
            <button
              key={v}
              onClick={() => setVisao(v)}
              style={{
                border: 'none', background: visao === v ? '#2E8F87' : 'none',
                color: visao === v ? '#fff' : '#6E807D', fontFamily: 'inherit',
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

      {visao === 'lista' ? (
        <section style={card()}>
          <div style={{ padding: '16px 18px 4px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                style={{
                  border: '1.5px solid', borderColor: filtro === f.id ? '#2E8F87' : '#DFE9E7',
                  background: filtro === f.id ? '#2E8F87' : '#fff',
                  color: filtro === f.id ? '#fff' : '#6E807D',
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
              <p style={{ color: '#6E807D', fontSize: 13, padding: '20px 18px' }}>Carregando agendamentos…</p>
            ) : listaFiltrada.length === 0 ? (
              <p style={{ color: '#9BB0AD', fontSize: 13, padding: '20px 18px' }}>
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
                    color: periodo === p ? '#fff' : '#6E807D', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 600, padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
                  }}
                >
                  {p === 'dia' ? 'Dia' : 'Semana'}
                </button>
              ))}
            </div>
          </div>

          {!montado || !referencia || carregando ? (
            <p style={{ color: '#6E807D', fontSize: 13, padding: '12px 4px' }}>Carregando calendário…</p>
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
                    <div style={{ textAlign: 'center', marginBottom: 8, padding: '6px 0', borderRadius: 10, background: hoje ? '#227069' : '#F2F7F6', color: hoje ? '#fff' : '#3A5754' }}>
                      <div style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.04em', opacity: .85 }}>
                        {fmtDiaSemanaCurto.format(d).replace('.', '')}
                      </div>
                      <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 16 }}>
                        {fmtDiaNum.format(d)} <span style={{ fontSize: 11, fontWeight: 500 }}>{fmtMesCurto.format(d).replace('.', '')}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60 }}>
                      {itens.length === 0 && <p style={{ fontSize: 11, color: '#9BB0AD', textAlign: 'center' }}>—</p>}
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
