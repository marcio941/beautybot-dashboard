'use client'
import { useState, useEffect } from 'react'
import { Calendar, MessageCircle, Headset, UserPlus, Users, Sparkles, StickyNote, CalendarClock, ArrowRight, Send, TrendingUp, DollarSign, Wallet, Percent, Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'
import LeadDetailModal, { LeadPatch } from '@/components/LeadDetailModal'

/* ─── tipos ─── */
interface Lead {
  id: string
  name: string
  phone: string
  status: string
  created_at: string
  notes: string | null
  origem: string | null
  nicho: string | null
  score: number | null
  score_motivo: string | null
  dores: unknown[] | null
  gancho: string | null
  atendimento_humano: boolean | null
  tags: string[] | null
  valor_potencial: number | null
  resultado: 'ganho' | 'perdido' | null
  valor_fechado: number | null
  resultado_data: string | null
}

interface MensagemRow {
  id: string
  remetente: 'cliente' | 'bot' | 'humano'
  texto: string
  created_at: string
}

interface Appointment {
  id: string
  lead_id: string
  appointment_date: string
  name: string
  status: string
  notes: string | null
}

interface Conversa {
  telefone: string
  estado: string
  mensagem_original: string | null
  resumo_provisorio: string | null
  categoria_provisoria: string | null
  prioridade_provisoria: string | null
  created_at: string
}

/* ─── helpers ─── */
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  scheduled:   { bg: '#DFF7E9', color: '#1E7C46' },
  confirmed:   { bg: '#DFF7E9', color: '#1E7C46' },
  pending:     { bg: '#FCEFD3', color: '#8A6410' },
  cancelled:   { bg: '#FBE3DF', color: '#B5473A' },
  completed:   { bg: '#E7F2F0', color: '#227069' },
  novo:        { bg: '#EDE4FC', color: '#6A3BC0' },
  'em atendimento': { bg: '#E7F2F0', color: '#227069' },
}
const getStatusStyle = (s: string) =>
  STATUS_STYLE[s] ?? { bg: 'var(--mist)', color: 'var(--sub)' }

const statusLabel: Record<string, string> = {
  scheduled: 'Agendado', confirmed: 'Confirmado', pending: 'Pendente',
  cancelled: 'Cancelado', completed: 'Concluído',
  novo: 'Novo', 'em atendimento': 'Em atendimento', aguardando_menu: 'Aguardando',
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--card-bg)', borderRadius: 22,
  boxShadow: 'var(--shadow)', ...style,
})

const fmtHora = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

const fmtBRL = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function inicioDoPeriodo(period: string): Date {
  const agora = new Date()
  if (period === 'today') return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  const dias = period === '30d' ? 30 : 7
  const inicio = new Date(agora)
  inicio.setDate(inicio.getDate() - dias)
  return inicio
}

const STATUS_COR: Record<string, string> = {
  scheduled: '#37C977', confirmed: '#37C977',
  pending: '#F6BE4F', cancelled: '#F07B6B',
  completed: '#2E8F87', novo: '#9B6CF0',
  'em atendimento': '#2E8F87',
}

const HEATMAP_DATA = [
  [1,2,2,3,2,1,2,3,3,4,3,2,1,0],[1,2,3,3,2,1,2,3,4,4,3,2,1,1],
  [0,1,2,2,2,1,2,2,3,3,2,1,1,0],[1,2,2,3,2,1,3,3,4,3,3,2,1,0],
  [1,2,3,4,3,2,3,4,4,4,3,2,2,1],[2,3,4,4,3,2,2,3,2,1,1,0,0,0],
  [0,0,1,1,1,0,0,1,1,0,0,0,0,0],
]
const DIAS  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const HORAS = ['8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h','20h','21h']
const HEAT_COLORS = ['var(--mist)','#CFE7E3','#9CCFC8','#5FB2A8','#227069']

/* ═══════════════════════════════════════════════ */
export default function Dashboard({ onVerConversaCompleta }: { onVerConversaCompleta?: (leadId: string) => void } = {}) {
  const { userName, accountName, categoriasKanban, loading: profileLoading } = useProfile()
  const [period, setPeriod]           = useState('7d')
  const [selIdx, setSelIdx]           = useState(0)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [leads, setLeads]             = useState<Lead[]>([])
  const [conversas, setConversas]     = useState<Conversa[]>([])
  const [loading, setLoading]         = useState(true)
  const [fichaLeadId, setFichaLeadId] = useState<string | null>(null)
  const [atualizandoLeadId, setAtualizandoLeadId] = useState<string | null>(null)
  const [togglingIAId, setTogglingIAId] = useState<string | null>(null)
  const [mensagensSelLead, setMensagensSelLead] = useState<MensagemRow[]>([])
  const [totalMensagensSelLead, setTotalMensagensSelLead] = useState(0)
  const [mensagensCarregando, setMensagensCarregando] = useState(false)
  const [mensagemTexto, setMensagemTexto] = useState('')
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  /* ── KPIs derivados ── */
  const today = new Date().toISOString().split('T')[0]
  const apptToday  = appointments.filter(a => a.appointment_date?.startsWith(today))
  const leadsNovos = leads.filter(l => l.status === 'novo').length
  const emAtend    = leads.filter(l => l.status === 'em atendimento').length
  const totalLeads = leads.length

  /* ── resultado comercial (respeita filtro de período) ── */
  const periodoInicio = inicioDoPeriodo(period)
  const leadsCriadosNoPeriodo = leads.filter(l => new Date(l.created_at) >= periodoInicio)
  const leadsGanhosNoPeriodo  = leadsCriadosNoPeriodo.filter(l => l.resultado === 'ganho')
  const leadsFechadosNoPeriodo = leads.filter(l => l.resultado === 'ganho' && l.resultado_data && new Date(l.resultado_data) >= periodoInicio)

  const receitaPotencial  = leadsCriadosNoPeriodo
    .filter(l => l.resultado == null)
    .reduce((soma, l) => soma + (l.valor_potencial ?? 0), 0)
  const receitaConfirmada = leadsFechadosNoPeriodo.reduce((soma, l) => soma + (l.valor_fechado ?? 0), 0)
  const taxaConversao = leadsCriadosNoPeriodo.length > 0
    ? (leadsGanhosNoPeriodo.length / leadsCriadosNoPeriodo.length) * 100
    : null
  const ticketMedio = leadsFechadosNoPeriodo.length > 0
    ? receitaConfirmada / leadsFechadosNoPeriodo.length
    : null

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [
          { data: appts, error: apptsError },
          { data: lds, error: leadsError },
          { data: convs, error: convsError },
        ] = await Promise.all([
          supabase.from('appointments').select('*').order('appointment_date', { ascending: true }),
          supabase.from('leads').select('*').order('created_at', { ascending: false }),
          supabase.from('conversas_pendentes').select('*').order('created_at', { ascending: false }),
        ])

        if (apptsError) console.error('Erro ao buscar appointments:', apptsError.message)
        if (leadsError) console.error('Erro ao buscar leads:', leadsError.message)
        if (convsError) console.error('Erro ao buscar conversas_pendentes:', convsError.message)

        setAppointments(appts ?? [])
        setLeads(lds ?? [])
        setConversas(convs ?? [])
      } catch (err) {
        console.error('Erro inesperado ao carregar dados do dashboard:', err)
        setAppointments([])
        setLeads([])
        setConversas([])
      } finally {
        setLoading(false)
      }
    }
    load()

    /* realtime leads */
    const ch = supabase.channel('leads-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const selLead = leads[selIdx]

  useEffect(() => {
    if (!selLead) { setMensagensSelLead([]); setTotalMensagensSelLead(0); return }
    let ativo = true
    async function carregarMensagens() {
      setMensagensCarregando(true)
      try {
        const [{ data, error }, { count, error: erroContagem }] = await Promise.all([
          supabase
            .from('mensagens')
            .select('id, remetente, texto, created_at')
            .eq('lead_id', selLead!.id)
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('mensagens')
            .select('id', { count: 'exact', head: true })
            .eq('lead_id', selLead!.id),
        ])
        if (error) throw error
        if (erroContagem) throw erroContagem
        if (ativo) {
          setMensagensSelLead(((data ?? []) as MensagemRow[]).slice().reverse())
          setTotalMensagensSelLead(count ?? 0)
        }
      } catch (err) {
        console.error('Erro ao buscar mensagens do lead:', err)
        if (ativo) { setMensagensSelLead([]); setTotalMensagensSelLead(0) }
      } finally {
        if (ativo) setMensagensCarregando(false)
      }
    }
    carregarMensagens()
    return () => { ativo = false }
  }, [selLead?.id])

  async function toggleAtendimentoHumano(lead: Lead) {
    const valorAnterior = lead.atendimento_humano
    const novoValor = !valorAnterior
    setTogglingIAId(lead.id)
    setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, atendimento_humano: novoValor } : l)))
    try {
      const { error } = await supabase.from('leads').update({ atendimento_humano: novoValor }).eq('id', lead.id)
      if (error) throw error
    } catch (err) {
      console.error('Erro ao atualizar atendimento humano:', err)
      setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, atendimento_humano: valorAnterior } : l)))
    } finally {
      setTogglingIAId(null)
    }
  }

  async function enviarMensagem() {
    if (!selLead || !mensagemTexto.trim() || enviandoMensagem) return
    setEnviandoMensagem(true)
    setErroEnvio(null)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: selLead.id, texto: mensagemTexto.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Não foi possível enviar a mensagem.')
      setMensagensSelLead(prev => [...prev, data.mensagem].slice(-5))
      setTotalMensagensSelLead(prev => prev + 1)
      setMensagemTexto('')
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err)
      setErroEnvio(err.message || 'Erro ao enviar mensagem.')
    } finally {
      setEnviandoMensagem(false)
    }
  }

  function atualizarLeadLocal(id: string, patch: LeadPatch) {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)))
  }

  async function mudarStatusLead(id: string, novoStatus: string) {
    const anterior = leads.find(l => l.id === id)?.status ?? null
    if (anterior === novoStatus) return
    setAtualizandoLeadId(id)
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, status: novoStatus } : l)))
    try {
      const { error } = await supabase.from('leads').update({ status: novoStatus }).eq('id', id)
      if (error) throw error
    } catch (err) {
      console.error('Erro ao mudar status do lead:', err)
      setLeads(prev => prev.map(l => (l.id === id ? { ...l, status: anterior ?? l.status } : l)))
    } finally {
      setAtualizandoLeadId(null)
    }
  }

  return (
    <div>
      {/* ── Topbar ── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 className="bb-greeting" style={{ fontFamily:"'Baloo 2',sans-serif", color:'#227069' }}>
            Bom dia, <span style={{ background:'linear-gradient(0deg,#F6BE4F 0 30%,transparent 30%)', padding:'0 2px' }}>
              {profileLoading ? 'Carregando...' : (userName || 'Usuário')}
            </span>
          </h2>
          <p style={{ fontSize:13, color:'var(--sub)' }}>
            {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
            {!profileLoading && ` · ${accountName || 'Sua conta'}`}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ ...card(), padding:'10px 16px', display:'flex', alignItems:'center', gap:10, fontSize:12.5, fontWeight:600 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#9B6CF0', display:'inline-block', boxShadow:'0 0 0 4px rgba(155,108,240,.25)', animation:'pulse 1.6s infinite' }} />
            {conversas.filter(c => c.estado === 'em atendimento').length} conversas em andamento
          </div>
          <div style={{ ...card(), padding:5, display:'flex', gap:4 }}>
            {[['today','Hoje'],['7d','7 dias'],['30d','30 dias']].map(([v,l])=>(
              <button key={v} onClick={()=>setPeriod(v)} style={{
                border:'none', background: period===v ? '#2E8F87' : 'none',
                color: period===v ? '#fff' : 'var(--sub)', fontFamily:'inherit',
                fontSize:12, fontWeight:600, padding:'7px 14px', borderRadius:10, cursor:'pointer',
                boxShadow: period===v ? '0 4px 10px rgba(46,143,135,.3)' : 'none',
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="bb-kpi-grid" style={{ display:'grid', gap:16, marginBottom:18 }}>
        {[
          { Icon: Calendar,       v: loading ? '…' : String(apptToday.length),   label:'Agendamentos hoje',  d:'+' },
          { Icon: MessageCircle,  v: loading ? '…' : String(conversas.length),   label:'Conversas ativas',   d:'↑' },
          { Icon: Headset,        v: loading ? '…' : String(emAtend),            label:'Em atendimento',     d:'↑' },
          { Icon: UserPlus,       v: loading ? '…' : String(leadsNovos),         label:'Leads novos',        d:'↑' },
          { Icon: Users,          v: loading ? '…' : String(totalLeads),         label:'Total de leads',     d:'↑' },
        ].map(k=>(
          <div key={k.label} style={{ ...card(), padding:'18px 20px', position:'relative' }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'#E7F2F0', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
              <k.Icon size={18} color="#227069" />
            </div>
            <b style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:25 }}>{k.v}</b>
            <span style={{ display:'block', fontSize:12, color:'var(--sub)', marginTop:2 }}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* ── Resultado comercial ── */}
      <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:19, color:'#227069', margin:'6px 0 14px', display:'flex', alignItems:'center', gap:8 }}>
        <DollarSign size={18} /> Resultado comercial
      </h3>
      <div className="bb-resultado-grid" style={{ display:'grid', gap:16, marginBottom:18 }}>
        {[
          { Icon: DollarSign, v: loading ? '…' : fmtBRL(receitaPotencial),  label:'Receita potencial' },
          { Icon: Wallet,     v: loading ? '…' : fmtBRL(receitaConfirmada), label:'Receita confirmada' },
          { Icon: Percent,    v: loading ? '…' : (taxaConversao == null ? '—' : `${taxaConversao.toFixed(1)}%`), label:'Taxa de conversão' },
          { Icon: Receipt,    v: loading ? '…' : (ticketMedio == null ? '—' : fmtBRL(ticketMedio)), label:'Ticket médio' },
        ].map(k=>(
          <div key={k.label} style={{ ...card(), padding:'18px 20px', position:'relative' }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'#E7F2F0', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
              <k.Icon size={18} color="#227069" />
            </div>
            <b style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:22 }}>{k.v}</b>
            <span style={{ display:'block', fontSize:12, color:'var(--sub)', marginTop:2 }}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* ── Fila + Chat ── */}
      <div className="bb-fila-chat-grid" style={{ display:'grid', gap:16, marginBottom:18, alignItems:'stretch' }}>

        {/* FILA — agendamentos de hoje + leads em atendimento */}
        <section style={card()}>
          <div style={{ padding:'18px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:17, color:'#227069' }}>Fila de hoje</h3>
              <span style={{ fontSize:11.5, color:'var(--sub)' }}>{apptToday.length} agendamento{apptToday.length!==1?'s':''}</span>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'0 14px 16px', maxHeight:480, overflowY:'auto' }}>
            {loading && <p style={{ color:'var(--sub)', fontSize:13, padding:8 }}>Carregando…</p>}
            {!loading && apptToday.length === 0 && (
              <p style={{ color:'var(--sub)', fontSize:13, padding:8 }}>Nenhum agendamento hoje.</p>
            )}
            {apptToday.map((a,i) => {
              const cor = STATUS_COR[a.status] ?? '#9B6CF0'
              const ss  = getStatusStyle(a.status)
              return (
                <div key={a.id} onClick={()=>setSelIdx(i)} style={{
                  display:'flex', alignItems:'center', gap:12,
                  background: selIdx===i ? 'var(--card-bg)' : 'var(--mist)',
                  borderLeft: `5px solid ${cor}`, borderRadius:14, padding:'11px 12px',
                  cursor:'pointer', border:`1px solid var(--line)`, borderLeftColor:cor, borderLeftWidth:5,
                  boxShadow: selIdx===i ? '0 8px 20px rgba(30,70,66,.14)' : 'none', transition:'all .12s',
                }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:'#E7F2F0', color:'#227069', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, flexShrink:0 }}>
                    {(a.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <b style={{ fontSize:13.5, display:'block' }}>{a.name || 'Cliente'}</b>
                    <small style={{ fontSize:11.5, color:'var(--sub)' }}>{a.notes || '—'}</small>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <b style={{ fontSize:13, color:'#227069', display:'block' }}>{fmtHora(a.appointment_date)}</b>
                    <span style={{ ...ss, fontSize:10, fontWeight:700, borderRadius:8, padding:'2px 8px', display:'inline-block', marginTop:3 }}>{statusLabel[a.status] ?? a.status}</span>
                  </div>
                </div>
              )
            })}

            {/* Leads em atendimento abaixo dos agendamentos */}
            {!loading && conversas.length > 0 && (
              <>
                <div style={{ fontSize:11, fontWeight:600, color:'#9B6CF0', padding:'8px 4px 2px', letterSpacing:'0.04em' }}>IA ATENDENDO AGORA</div>
                {conversas.slice(0,5).map((c,i)=>(
                  <div key={c.telefone} style={{
                    display:'flex', alignItems:'center', gap:12,
                    background:'#F5F0FE', borderLeft:'5px solid #9B6CF0',
                    borderRadius:14, padding:'11px 12px', cursor:'pointer',
                    border:'1px solid #E8DEF8', borderLeftColor:'#9B6CF0', borderLeftWidth:5,
                  }}>
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'#EDE4FC', color:'#6A3BC0', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, flexShrink:0 }}>
                      {c.telefone.slice(-2)}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <b style={{ fontSize:13.5, display:'block' }}>{c.telefone.replace('@s.whatsapp.net','').replace('55','').replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3')}</b>
                      <small style={{ fontSize:11.5, color:'var(--sub)' }}>{c.resumo_provisorio || c.mensagem_original?.slice(0,40) || '—'}</small>
                    </div>
                    <span style={{ background:'#EDE4FC', color:'#6A3BC0', fontSize:10, fontWeight:700, borderRadius:8, padding:'2px 8px', flexShrink:0 }}>IA ativa</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </section>

        {/* CHAT / DETALHE DO LEAD */}
        <section style={{ ...card(), display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {selLead ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', borderBottom:'1px solid var(--line)', background:'var(--card-bg)', flexWrap:'wrap' }}>
                <div style={{ width:46, height:46, borderRadius:'50%', background:'#E7F2F0', color:'#227069', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:17, flexShrink:0 }}>
                  {(selLead.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <b style={{ fontSize:16 }}>{selLead.name}</b>
                  <div style={{ fontSize:12, color:'var(--sub)' }}>{selLead.phone?.replace('@s.whatsapp.net','')}</div>
                </div>
                <div style={{ display:'flex', gap:8, marginLeft:14, flexWrap:'wrap' }}>
                  <span style={{ background:'var(--mist)', border:'1px solid var(--line)', fontSize:11, fontWeight:600, color:'var(--sub)', borderRadius:9, padding:'4px 10px' }}>{statusLabel[selLead.status] ?? selLead.status}</span>
                  <span style={{ background:'var(--mist)', border:'1px solid var(--line)', fontSize:11, fontWeight:600, color:'var(--sub)', borderRadius:9, padding:'4px 10px' }}>
                    {new Date(selLead.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <button onClick={() => setFichaLeadId(selLead.id)} style={{ marginLeft:'auto', border:'none', cursor:'pointer', background:'var(--accent)', color:'#fff', fontFamily:'inherit', fontSize:12.5, fontWeight:600, padding:'10px 18px', borderRadius:12, boxShadow:'0 6px 16px rgba(34,112,105,.3)', flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
                  <Sparkles size={14} />
                  Ficha do lead
                </button>
              </div>
              <div style={{ flex:1, padding:22, display:'flex', flexDirection:'column', gap:12, background:'var(--mist)', overflowY:'auto', minHeight:280 }}>
                <div style={{ alignSelf:'center', fontSize:11, fontWeight:600, color:'var(--sub)', background:'var(--card-bg)', borderRadius:10, padding:'3px 12px', boxShadow:'0 2px 6px rgba(30,70,66,.06)' }}>Informações do lead</div>
                {selLead.notes && (
                  <div style={{ maxWidth:'72%', background:'var(--card-bg)', color:'var(--ink)', alignSelf:'flex-start', borderRadius:'16px 16px 16px 5px', padding:'11px 15px', fontSize:13.5, lineHeight:1.45, boxShadow:'0 3px 8px rgba(30,70,66,.06)', display:'flex', alignItems:'flex-start', gap:8 }}>
                    <StickyNote size={15} style={{ flexShrink:0, marginTop:2 }} />
                    {selLead.notes}
                  </div>
                )}
                {/* agendamentos desse lead */}
                {appointments.filter(a=>a.lead_id===selLead.id).map(a=>(
                  <div key={a.id} style={{ alignSelf:'center', background:'#FCF3DF', color:'#7a5a12', fontSize:12, fontWeight:600, borderRadius:12, padding:'8px 14px', maxWidth:'80%', textAlign:'center', display:'inline-flex', alignItems:'center', gap:6 }}>
                    <CalendarClock size={13} />
                    {statusLabel[a.status] ?? a.status} — {new Date(a.appointment_date).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })} {a.notes ? `· ${a.notes}` : ''}
                  </div>
                ))}
                {!selLead.notes && appointments.filter(a=>a.lead_id===selLead.id).length===0 && !mensagensCarregando && mensagensSelLead.length===0 && (
                  <p style={{ color:'var(--sub)', fontSize:13, textAlign:'center', marginTop:40 }}>Nenhuma nota ou agendamento para este lead.</p>
                )}
                {mensagensCarregando ? (
                  <p style={{ color:'var(--sub)', fontSize:12.5, textAlign:'center' }}>Carregando conversa…</p>
                ) : (
                  mensagensSelLead.map((m) => (
                    <div key={m.id} style={{ alignSelf: m.remetente === 'cliente' ? 'flex-start' : 'flex-end', maxWidth:'72%', display:'flex', flexDirection:'column', gap:2 }}>
                      {m.remetente !== 'cliente' && (
                        <span style={{ fontSize:10, fontWeight:600, color:'var(--sub)', textAlign:'right', paddingRight:4 }}>{m.remetente === 'bot' ? 'IA' : 'Você'}</span>
                      )}
                      <div style={{
                        background: m.remetente === 'cliente' ? 'var(--card-bg)' : m.remetente === 'bot' ? '#227069' : '#2E8F87',
                        color: m.remetente === 'cliente' ? 'var(--ink)' : '#fff',
                        borderRadius: m.remetente === 'cliente' ? '16px 16px 16px 5px' : '16px 16px 5px 16px',
                        padding:'11px 15px', fontSize:13.5, lineHeight:1.45, boxShadow:'0 3px 8px rgba(30,70,66,.06)',
                      }}>
                        {m.texto}
                      </div>
                    </div>
                  ))
                )}
                {!mensagensCarregando && totalMensagensSelLead > 5 && (
                  <button
                    onClick={() => onVerConversaCompleta?.(selLead.id)}
                    style={{ alignSelf:'center', border:'none', background:'none', color:'var(--accent)', fontSize:12.5, fontWeight:600, cursor:'pointer', padding:'6px 4px', fontFamily:'inherit', textDecoration:'underline', display:'flex', alignItems:'center', gap:4 }}
                  >
                    Ver conversa completa <ArrowRight size={13} />
                  </button>
                )}
              </div>
              <div style={{ display:'flex', gap:10, alignItems:'center', padding:'14px 18px', borderTop:'1px solid var(--line)', background:'var(--card-bg)' }}>
                <button
                  onClick={() => toggleAtendimentoHumano(selLead)}
                  disabled={togglingIAId === selLead.id}
                  title={selLead.atendimento_humano ? 'Atendimento humano — clique para devolver à IA' : 'IA respondendo automaticamente — clique para assumir'}
                  style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600, color:'var(--sub)', border:'none', background:'none', padding:0, fontFamily:'inherit', cursor: togglingIAId === selLead.id ? 'wait' : 'pointer' }}
                >
                  <div style={{ width:38, height:22, background: selLead.atendimento_humano ? 'var(--line)' : '#9B6CF0', borderRadius:20, position:'relative', transition:'background .15s' }}>
                    <span style={{ position:'absolute', top:3, left: selLead.atendimento_humano ? 3 : 19, width:16, height:16, background:'#fff', borderRadius:'50%', display:'block', transition:'left .15s' }}/>
                  </div>
                  IA
                </button>
                <input
                  type="text"
                  placeholder="Escreva sua mensagem…"
                  value={mensagemTexto}
                  onChange={(e) => setMensagemTexto(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem() } }}
                  disabled={enviandoMensagem}
                  style={{ flex:1, border:'1.5px solid var(--line)', borderRadius:14, padding:'12px 16px', fontFamily:'inherit', fontSize:13.5, outline:'none', background:'var(--mist)' }}
                />
                <button
                  onClick={enviarMensagem}
                  disabled={enviandoMensagem || !mensagemTexto.trim()}
                  style={{ border:'none', width:44, height:44, borderRadius:14, background: enviandoMensagem || !mensagemTexto.trim() ? 'var(--sub)' : 'var(--accent)', color:'#fff', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 6px 14px rgba(46,143,135,.35)', cursor: enviandoMensagem || !mensagemTexto.trim() ? 'default' : 'pointer' }}
                >
                  {enviandoMensagem ? '…' : <Send size={17} />}
                </button>
              </div>
              {erroEnvio && (
                <p style={{ background:'#FDECEF', color:'#8C2340', fontSize:12, padding:'8px 18px', margin:0 }}>{erroEnvio}</p>
              )}
            </>
          ) : (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--sub)', fontSize:14 }}>
              Selecione um lead na fila para ver os detalhes.
            </div>
          )}
        </section>
      </div>

      {/* ── Analytics ── */}
      <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:19, color:'#227069', margin:'6px 0 14px', display:'flex', alignItems:'center', gap:8 }}>
        <TrendingUp size={18} /> Desempenho da semana
      </h3>

      <div className="bb-analytics-grid-2" style={{ display:'grid', gap:16, marginBottom:18 }}>
        {/* Barras */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Leads por status</h3>
          <p style={{ fontSize:11.5, color:'var(--sub)', marginBottom:16 }}>Distribuição atual dos leads no CRM</p>
          <div style={{ display:'flex', alignItems:'flex-end', gap:14, height:180, paddingTop:8 }}>
            {[
              ['Novos',      leads.filter(l=>l.status==='novo').length,           '#9B6CF0'],
              ['Atendendo',  leads.filter(l=>l.status==='em atendimento').length, '#2E8F87'],
              ['Agendados',  appointments.filter(a=>a.status==='scheduled'||a.status==='confirmed').length, '#37C977'],
              ['Cancelados', appointments.filter(a=>a.status==='cancelled').length, '#F07B6B'],
              ['Concluídos', appointments.filter(a=>a.status==='completed').length, '#F6BE4F'],
            ].map(([label,val,cor])=>{
              const maxVal = Math.max(1, leads.length, appointments.length)
              const pct = Math.max(4, Math.round(((val as number)/maxVal)*100))
              return (
                <div key={label as string} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, height:'100%', justifyContent:'flex-end' }}>
                  <span style={{ fontSize:11, fontWeight:700, color: cor as string }}>{val}</span>
                  <div style={{ width:'100%', maxWidth:44, borderRadius:'9px 9px 4px 4px', background: cor as string, height:`${pct}%`, opacity:.85 }} />
                  <span style={{ fontSize:10, color:'var(--sub)', fontWeight:600, textAlign:'center' }}>{label}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Heatmap */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Horários de pico</h3>
          <p style={{ fontSize:11.5, color:'var(--sub)', marginBottom:16 }}>Mensagens por horário (referência)</p>
          <div style={{ overflowX:'auto' }}>
            <div style={{ display:'grid', gridTemplateColumns:'34px repeat(14,minmax(26px,1fr))', gap:4, alignItems:'center', minWidth:520 }}>
              {HEATMAP_DATA.map((row,di)=>([
                <span key={`d${di}`} style={{ fontSize:10.5, color:'var(--sub)', fontWeight:600, position:'sticky', left:0, background:'var(--card-bg)' }}>{DIAS[di]}</span>,
                ...row.map((v,hi)=>(
                  <div key={`${di}-${hi}`} style={{ aspectRatio:'1', borderRadius:5, background: HEAT_COLORS[v] }} />
                ))
              ]))}
              <span style={{ position:'sticky', left:0, background:'var(--card-bg)' }}/>
              {HORAS.map(h=><span key={h} style={{ fontSize:9.5, color:'var(--sub)', textAlign:'center' }}>{h}</span>)}
            </div>
          </div>
        </section>
      </div>

      <div className="bb-analytics-grid-3" style={{ display:'grid', gap:16, marginBottom:32 }}>
        {/* Funil real */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Funil de leads</h3>
          <p style={{ fontSize:11.5, color:'var(--sub)', marginBottom:16 }}>Do lead novo ao atendimento</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              ['Total de leads', totalLeads, totalLeads, '#2E8F87'],
              ['Em atendimento', emAtend, totalLeads, '#3AA79D'],
              ['Agendados', appointments.filter(a=>a.status==='scheduled'||a.status==='confirmed').length, totalLeads, '#9B6CF0'],
              ['Concluídos', appointments.filter(a=>a.status==='completed').length, totalLeads, '#37C977'],
            ].map(([label,val,total,c])=>{
              const pct = total ? Math.round(((val as number)/(total as number))*100) : 0
              return (
                <div key={label as string} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ width:106, fontSize:12, fontWeight:600 }}>{label}</span>
                  <div style={{ flex:1, background:'var(--mist)', borderRadius:10, height:30, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:10, background: c as string, width:`${Math.max(pct,4)}%`, display:'flex', alignItems:'center', padding:'0 12px', color:'#fff', fontSize:12, fontWeight:700, minWidth:36 }}>{val}</div>
                  </div>
                  <span style={{ width:40, fontSize:12, fontWeight:700, color:'var(--sub)', textAlign:'right' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Conversas pendentes */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Conversas pendentes</h3>
          <p style={{ fontSize:11.5, color:'var(--sub)', marginBottom:16 }}>Estado atual das conversas abertas</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loading ? <p style={{ color:'var(--sub)', fontSize:13 }}>Carregando…</p> :
            conversas.slice(0,5).map(c=>(
              <div key={c.telefone} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#F5F0FE', borderRadius:12, border:'1px solid #E8DEF8' }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:'#EDE4FC', color:'#6A3BC0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>
                  {c.telefone.slice(-2)}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <b style={{ fontSize:12, display:'block' }}>{c.telefone.replace('@s.whatsapp.net','').replace('55','').replace(/(\d{2})(\d{5})(\d{4})/,'($1) $2-$3')}</b>
                  <small style={{ fontSize:11, color:'var(--sub)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{c.categoria_provisoria || c.resumo_provisorio || c.estado}</small>
                </div>
              </div>
            ))}
            {!loading && conversas.length === 0 && <p style={{ color:'var(--sub)', fontSize:13 }}>Nenhuma conversa pendente.</p>}
          </div>
        </section>

        {/* Leads recentes */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Leads recentes</h3>
          <p style={{ fontSize:11.5, color:'var(--sub)', marginBottom:16 }}>Últimos leads cadastrados</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loading ? <p style={{ color:'var(--sub)', fontSize:13 }}>Carregando…</p> :
            leads.slice(0,5).map(l=>{
              const ss = getStatusStyle(l.status)
              return (
                <div key={l.id} style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'#E7F2F0', color:'#227069', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
                    {(l.name||'?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <b style={{ fontSize:13, display:'block' }}>{l.name || 'Sem nome'}</b>
                    <div style={{ height:5, borderRadius:4, background:'var(--mist)', marginTop:4 }}>
                      <div style={{ height:'100%', borderRadius:4, background:'#2E8F87', width: l.status==='em atendimento'?'60%':l.status==='novo'?'20%':'90%' }}/>
                    </div>
                  </div>
                  <span style={{ ...ss, fontSize:10, fontWeight:700, borderRadius:8, padding:'2px 8px', flexShrink:0, whiteSpace:'nowrap' }}>{statusLabel[l.status]??l.status}</span>
                </div>
              )
            })}
            {!loading && leads.length === 0 && <p style={{ color:'var(--sub)', fontSize:13 }}>Nenhum lead encontrado.</p>}
          </div>
        </section>
      </div>

      <LeadDetailModal
        lead={leads.find(l => l.id === fichaLeadId) ?? null}
        categorias={categoriasKanban ?? []}
        atualizando={fichaLeadId ? atualizandoLeadId === fichaLeadId : false}
        onFechar={() => setFichaLeadId(null)}
        onMudarStatus={mudarStatusLead}
        onAtualizarLead={atualizarLeadLocal}
      />

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 4px rgba(155,108,240,.25)}50%{box-shadow:0 0 0 10px rgba(155,108,240,0)}}`}</style>
    </div>
  )
}
