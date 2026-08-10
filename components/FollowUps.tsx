'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Repeat } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

interface FollowUpRow {
  id: string
  mensagem: string | null
  enviado_em: string
  canal: string | null
  leads: { name: string | null; phone: string | null } | null
}

interface AppointmentJoinRow {
  id: string
  lead_id: string
  appointment_date: string
  leads: { name: string | null; phone: string | null } | null
  servicos: { nome: string | null } | null
}

interface SugestaoRow {
  appointmentId: string
  leadId: string
  leadName: string | null
  leadPhone: string | null
  servicoNome: string | null
  diasAtras: number
  mensagemInicial: string
  manutencao: boolean
}

// Não há campo de recorrência esperada por serviço no banco hoje — então a
// detecção é por palavra-chave no nome do serviço. Um campo do tipo "dias até
// recomendar retorno" por serviço deixaria isso muito mais preciso (ver aviso
// no card de sugestão).
const TERMOS_RECORRENCIA = [
  'unha', 'unhas', 'esmalta', 'toxina', 'botox', 'preenchimento',
  'sobrancelha', 'micropigmenta', 'limpeza de pele', 'peeling', 'design de sobrancelha',
]

function ehServicoRecorrente(nome: string | null): boolean {
  if (!nome) return false
  const alvo = nome.toLowerCase()
  return TERMOS_RECORRENCIA.some((termo) => alvo.includes(termo))
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

  const [sugestoes, setSugestoes] = useState<SugestaoRow[]>([])
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(true)
  const [erroSugestoes, setErroSugestoes] = useState<string | null>(null)
  const [textos, setTextos] = useState<Record<string, string>>({})
  const [ignoradosIds, setIgnoradosIds] = useState<Set<string>>(new Set())
  const [enviandoId, setEnviandoId] = useState<string | null>(null)
  const [errosEnvio, setErrosEnvio] = useState<Record<string, string>>({})

  useEffect(() => {
    if (perfilCarregando) return
    if (!contaId) { setCarregandoSugestoes(false); return }

    let ativo = true
    async function carregarSugestoes() {
      setCarregandoSugestoes(true)
      setErroSugestoes(null)
      try {
        const tresDiasAtras = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

        const { data: appts, error: apptsError } = await supabase
          .from('appointments')
          .select('id, lead_id, appointment_date, leads(name, phone), servicos(nome)')
          .eq('conta_id', contaId)
          .eq('status', 'completed')
          .lte('appointment_date', tresDiasAtras)
          .order('appointment_date', { ascending: false })
        if (apptsError) throw apptsError

        const candidatosBrutos = (appts ?? []) as unknown as AppointmentJoinRow[]
        const leadIds = Array.from(new Set(candidatosBrutos.map(a => a.lead_id).filter(Boolean)))

        const ultimoFollowUpPorLead: Record<string, string> = {}
        if (leadIds.length > 0) {
          const { data: fups, error: fupsError } = await supabase
            .from('follow_ups')
            .select('lead_id, enviado_em')
            .eq('conta_id', contaId)
            .in('lead_id', leadIds)
          if (fupsError) throw fupsError
          for (const f of (fups ?? []) as { lead_id: string; enviado_em: string }[]) {
            const atual = ultimoFollowUpPorLead[f.lead_id]
            if (!atual || f.enviado_em > atual) ultimoFollowUpPorLead[f.lead_id] = f.enviado_em
          }
        }

        const candidatos: SugestaoRow[] = candidatosBrutos
          .filter(a => {
            const ultimo = ultimoFollowUpPorLead[a.lead_id]
            return !ultimo || new Date(ultimo) <= new Date(a.appointment_date)
          })
          .map(a => {
            const diasAtras = Math.max(0, Math.floor((Date.now() - new Date(a.appointment_date).getTime()) / 86400000))
            const nome = a.leads?.name || null
            const servicoNome = a.servicos?.nome || null
            const saudacao = nome ? `Oi ${nome}!` : 'Oi!'
            const servicoTexto = servicoNome || 'um atendimento com a gente'
            const manutencao = ehServicoRecorrente(servicoNome)
            const mensagemInicial = manutencao
              ? `${saudacao} Já fazem ${diasAtras} dias desde ${servicoTexto === 'um atendimento com a gente' ? 'seu último atendimento' : servicoTexto}. Geralmente essa é a hora de renovar a manutenção! Quer agendar seu horário? 💅`
              : `${saudacao} Notei que você fez ${servicoTexto} recentemente. Que tal aproveitar um horário especial para outro cuidado? Me chama se quiser saber mais! 😊`
            return {
              appointmentId: a.id,
              leadId: a.lead_id,
              leadName: nome,
              leadPhone: a.leads?.phone || null,
              servicoNome,
              diasAtras,
              mensagemInicial,
              manutencao,
            }
          })
          .sort((a, b) => Number(b.manutencao) - Number(a.manutencao))

        if (ativo) {
          setSugestoes(candidatos)
          setTextos(Object.fromEntries(candidatos.map(c => [c.appointmentId, c.mensagemInicial])))
        }
      } catch (err) {
        console.error('Erro ao buscar sugestões de follow-up:', err)
        if (ativo) {
          setErroSugestoes('Não foi possível carregar as sugestões de follow-up.')
          setSugestoes([])
        }
      } finally {
        if (ativo) setCarregandoSugestoes(false)
      }
    }
    carregarSugestoes()
    return () => { ativo = false }
  }, [contaId, perfilCarregando])

  function ignorarSugestao(appointmentId: string) {
    setIgnoradosIds(prev => {
      const next = new Set(prev)
      next.add(appointmentId)
      return next
    })
  }

  async function enviarSugestao(s: SugestaoRow) {
    const texto = (textos[s.appointmentId] ?? s.mensagemInicial).trim()
    if (!texto || enviandoId) return
    setEnviandoId(s.appointmentId)
    setErrosEnvio(prev => {
      const next = { ...prev }
      delete next[s.appointmentId]
      return next
    })
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: s.leadId, texto, followUp: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Não foi possível enviar o follow-up.')

      setSugestoes(prev => prev.filter(x => x.appointmentId !== s.appointmentId))
      if (data.followUp) {
        setFollowUps(prev => [{
          id: data.followUp.id,
          mensagem: data.followUp.mensagem,
          enviado_em: data.followUp.enviado_em,
          canal: data.followUp.canal,
          leads: { name: s.leadName, phone: s.leadPhone },
        }, ...prev])
      }
    } catch (err: any) {
      console.error('Erro ao enviar follow-up:', err)
      setErrosEnvio(prev => ({ ...prev, [s.appointmentId]: err.message || 'Erro ao enviar follow-up.' }))
    } finally {
      setEnviandoId(null)
    }
  }

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
  const carregandoSugestoesTela = perfilCarregando || carregandoSugestoes
  const sugestoesVisiveis = sugestoes.filter(s => !ignoradosIds.has(s.appointmentId))

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>
        <Sparkles size={26} />
        Sugestões de Follow-up
      </h2>
      <p style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 4 }}>
        Leads que finalizaram um atendimento há pelo menos 3 dias e ainda não receberam um follow-up.
      </p>
      <p style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--sub)', fontSize: 11.5, marginBottom: 24 }}>
        <Repeat size={12} />
        Serviços com padrão de recorrência conhecido (ex: unha, toxina) aparecem destacados como &quot;Hora da manutenção&quot;.
      </p>

      {erroSugestoes && (
        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {erroSugestoes}
        </p>
      )}

      {carregandoSugestoesTela ? (
        <p style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 32 }}>Carregando sugestões…</p>
      ) : sugestoesVisiveis.length === 0 ? (
        <div style={{ ...card(), padding: '40px 24px', textAlign: 'center', marginBottom: 32 }}>
          <p style={{ color: 'var(--sub)', fontSize: 14, margin: 0 }}>Nenhum follow-up pendente no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {sugestoesVisiveis.map((s) => {
            const enviando = enviandoId === s.appointmentId
            return (
              <div
                key={s.appointmentId}
                style={{
                  ...card(), padding: '18px 20px',
                  ...(s.manutencao ? { border: '1.5px solid #E8A93A', background: '#FFF9EE' } : {}),
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: '#E7F2F0', color: '#227069',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>
                    {(s.leadName || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <b style={{ fontSize: 13.5 }}>{s.leadName || 'Lead sem nome'}</b>
                      <span style={{ fontSize: 11.5, color: 'var(--sub)' }}>{formatarTelefone(s.leadPhone)}</span>
                      {s.manutencao && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F5C266', color: '#6B4A05', fontSize: 10.5, fontWeight: 700, borderRadius: 8, padding: '2px 9px' }}>
                          <Repeat size={11} />
                          Hora da manutenção
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12.5, color: 'var(--sub)', margin: 0 }}>
                      Fez {s.servicoNome || 'um atendimento'} há {s.diasAtras} {s.diasAtras === 1 ? 'dia' : 'dias'}
                    </p>
                  </div>
                </div>

                <textarea
                  value={textos[s.appointmentId] ?? s.mensagemInicial}
                  onChange={(e) => setTextos(prev => ({ ...prev, [s.appointmentId]: e.target.value }))}
                  rows={3}
                  disabled={enviando}
                  style={{
                    width: '100%', boxSizing: 'border-box', borderRadius: 12, border: '1px solid var(--line)',
                    padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)',
                    background: 'var(--card-bg)', resize: 'vertical', marginBottom: 10,
                  }}
                />

                {errosEnvio[s.appointmentId] && (
                  <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 12.5, marginBottom: 10 }}>
                    {errosEnvio[s.appointmentId]}
                  </p>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <button
                    onClick={() => ignorarSugestao(s.appointmentId)}
                    disabled={enviando}
                    style={{
                      background: 'var(--mist)', color: 'var(--sub)', border: '1px solid var(--line)', borderRadius: 10,
                      padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: enviando ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Ignorar
                  </button>
                  <button
                    onClick={() => enviarSugestao(s)}
                    disabled={enviando}
                    style={{
                      background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10,
                      padding: '8px 16px', fontSize: 12.5, fontWeight: 600, cursor: enviando ? 'not-allowed' : 'pointer',
                      opacity: enviando ? 0.7 : 1,
                    }}
                  >
                    {enviando ? 'Enviando…' : 'Enviar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>
        <Repeat size={26} />
        Follow-ups
      </h2>
      <p style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 24 }}>
        Histórico de follow-ups já enviados para os leads.
      </p>

      {erro && (
        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {erro}
        </p>
      )}

      {carregandoTela ? (
        <p style={{ color: 'var(--sub)', fontSize: 13 }}>Carregando follow-ups…</p>
      ) : followUps.length === 0 ? (
        <div style={{ ...card(), padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--sub)', fontSize: 14, margin: 0 }}>Nenhum follow-up enviado ainda.</p>
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
                  <span style={{ fontSize: 11.5, color: 'var(--sub)' }}>{formatarTelefone(f.leads?.phone)}</span>
                  <span style={{ background: 'var(--mist)', border: '1px solid var(--line)', fontSize: 10.5, fontWeight: 600, color: 'var(--sub)', borderRadius: 8, padding: '2px 8px', textTransform: 'capitalize' }}>
                    {f.canal || 'chat'}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--ink)', margin: 0, lineHeight: 1.45 }}>{f.mensagem || '—'}</p>
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--sub)', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtDataHora(f.enviado_em)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
