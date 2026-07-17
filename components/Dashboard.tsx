'use client'
import { useState } from 'react'

/* ─── dados mock (substituir por queries Supabase no Passo 3) ─── */
const LEADS = [
  { n:'Juliana Mendes', proc:'Limpeza de Pele',      h:'09:00', st:'Confirmado',  stc:'conf', cor:'#37C977', meta:'Lead há 12 dias · WhatsApp', ficha:['28 anos','2ª visita'],
    msgs:[{t:'sep',x:'Hoje'},{t:'in',x:'Bom dia! Confirmando minha limpeza 😊',h:'07:41'},{t:'out',who:'BeautyBot IA',x:'Confirmadíssimo ✅ Te esperamos às 9h!',h:'07:41'},{t:'sys',x:'IA moveu para "Confirmado" no Kanban'}]},
  { n:'Carla Souza',    proc:'Preenchimento Labial',  h:'10:30', st:'Confirmado',  stc:'conf', cor:'#37C977', meta:'Cliente recorrente · WhatsApp', ficha:['34 anos','5ª visita'],
    msgs:[{t:'sep',x:'Ontem'},{t:'out',who:'BeautyBot IA',x:'Lembrete: seu preenchimento é amanhã às 10:30. Posso confirmar?',h:'16:00'},{t:'in',x:'Pode sim!',h:'16:22'},{t:'sys',x:'Confirmada automaticamente'}]},
  { n:'Fernanda Lima',  proc:'Botox',                 h:'11:00', st:'Pendente',    stc:'pend', cor:'#F6BE4F', meta:'Lead novo · Anúncio Instagram', ficha:['Lead novo','Meta Ads'],
    msgs:[{t:'sep',x:'Hoje'},{t:'in',x:'Vi o anúncio. Quanto custa o botox?',h:'08:02'},{t:'out',who:'BeautyBot IA',x:'Parte de R$ 590/região, avaliação gratuita 😊 Tenho às 11h — reservo?',h:'08:02'},{t:'in',x:'Pode ser! Mas ainda vou confirmar',h:'08:15'},{t:'sys',x:'Pré-reserva às 11h · aguardando confirmação'}]},
  { n:'Ana Paula',      proc:'Microagulhamento',      h:'14:00', st:'IA atendendo',stc:'ia',   cor:'#9B6CF0', meta:'Em conversa agora · WhatsApp', ficha:['31 anos','1ª visita'],
    msgs:[{t:'sep',x:'Hoje'},{t:'in',x:'O microagulhamento dói? Estou insegura kkk',h:'08:47'},{t:'out',who:'BeautyBot IA',x:'Super normal! Usamos anestésico tópico 💚 Quer o preparo pré-procedimento?',h:'08:47'},{t:'in',x:'Quero sim!',h:'08:49'},{t:'out',who:'BeautyBot IA',x:'Enviado! 📋 Chegar sem maquiagem, evitar sol e trazer documento. Às 14h!',h:'08:49'}]},
  { n:'Beatriz Costa',  proc:'Depilação a Laser',     h:'15:30', st:'Cancelado',   stc:'canc', cor:'#F07B6B', meta:'Cancelou hoje cedo', ficha:['3ª visita'],
    msgs:[{t:'sep',x:'Hoje'},{t:'in',x:'Vou precisar cancelar 😔 imprevisto',h:'06:58'},{t:'out',who:'BeautyBot IA',x:'Sem problemas! Cancelei. Quer remarcar? Tenho quinta 15h ou sexta 10h.',h:'06:58'},{t:'sys',x:'Follow-up automático para amanhã às 10h'}]},
  { n:'Letícia M.',     proc:'Botox — orçamento',     h:'—',     st:'IA atendendo',stc:'ia',   cor:'#9B6CF0', meta:'Lead novo · há 12 min', ficha:['Lead novo','Indicação'],
    msgs:[{t:'sep',x:'Hoje'},{t:'in',x:'Qual o preço do botox?',h:'08:53'},{t:'out',who:'BeautyBot IA',x:'Oi Letícia! Parte de R$ 590/região, avaliação gratuita 😊 Quer agendar?',h:'08:53'}]},
]

const STATUS_STYLE: Record<string, {bg:string;color:string}> = {
  conf: {bg:'#DFF7E9', color:'#1E7C46'},
  pend: {bg:'#FCEFD3', color:'#8A6410'},
  ia:   {bg:'#EDE4FC', color:'#6A3BC0'},
  canc: {bg:'#FBE3DF', color:'#B5473A'},
}

const HEATMAP_DATA = [
  [1,2,2,3,2,1,2,3,3,4,3,2,1,0],
  [1,2,3,3,2,1,2,3,4,4,3,2,1,1],
  [0,1,2,2,2,1,2,2,3,3,2,1,1,0],
  [1,2,2,3,2,1,3,3,4,3,3,2,1,0],
  [1,2,3,4,3,2,3,4,4,4,3,2,2,1],
  [2,3,4,4,3,2,2,3,2,1,1,0,0,0],
  [0,0,1,1,1,0,0,1,1,0,0,0,0,0],
]
const DIAS  = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
const HORAS = ['8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h','20h','21h']
const HEAT_COLORS = ['#F2F7F6','#CFE7E3','#9CCFC8','#5FB2A8','#227069']

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#fff', borderRadius: 22, boxShadow: '0 10px 30px rgba(30,70,66,.08)',
  ...style,
})

export default function Dashboard() {
  const [sel, setSel]   = useState(3)
  const [period, setPeriod] = useState('7d')
  const lead = LEADS[sel]

  return (
    <div>
      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:22, flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:30, color:'#227069' }}>
            Bom dia, <span style={{ background:'linear-gradient(0deg,#F6BE4F 0 30%,transparent 30%)', padding:'0 2px' }}>Admin</span>
          </h2>
          <p style={{ fontSize:13, color:'#6E807D' }}>Terça-feira, 14 de julho de 2026 · Clínica Bella Estética</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          {/* IA Status */}
          <div style={{ ...card(), padding:'10px 16px', display:'flex', alignItems:'center', gap:10, fontSize:12.5, fontWeight:600 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#9B6CF0', display:'inline-block',
              boxShadow:'0 0 0 4px rgba(155,108,240,.25)', animation:'pulse 1.6s infinite' }} />
            IA respondendo Letícia M. sobre botox…
          </div>
          {/* Period */}
          <div style={{ ...card(), padding:5, display:'flex', gap:4 }}>
            {[['today','Hoje'],['7d','7 dias'],['30d','30 dias']].map(([v,l])=>(
              <button key={v} onClick={()=>setPeriod(v)} style={{
                border:'none', background: period===v ? '#2E8F87' : 'none',
                color: period===v ? '#fff' : '#6E807D',
                fontFamily:'inherit', fontSize:12, fontWeight:600,
                padding:'7px 14px', borderRadius:10, cursor:'pointer',
                boxShadow: period===v ? '0 4px 10px rgba(46,143,135,.3)' : 'none',
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:16, marginBottom:18 }}>
        {[
          {ic:'🗓', v:'12',     label:'Agendamentos hoje',   d:'+3'},
          {ic:'💬', v:'47',     label:'Mensagens hoje',      d:'+18%'},
          {ic:'🤖', v:'89%',    label:'Resolvidas pela IA',  d:'+5%'},
          {ic:'⏱', v:'42s',    label:'Tempo de resposta',   d:'−34%'},
          {ic:'💰', v:'R$ 18,4k',label:'Receita do mês',    d:'+12%'},
        ].map(k=>(
          <div key={k.label} style={{ ...card(), padding:'18px 20px', position:'relative' }}>
            <div style={{ width:38, height:38, borderRadius:12, background:'#E7F2F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:12 }}>{k.ic}</div>
            <span style={{ position:'absolute', top:16, right:16, fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:10, background:'#DFF7E9', color:'#1E7C46' }}>{k.d}</span>
            <b style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:25 }}>{k.v}</b>
            <span style={{ display:'block', fontSize:12, color:'#6E807D', marginTop:2 }}>{k.label}</span>
          </div>
        ))}
      </div>

      {/* Fila + Chat */}
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:16, marginBottom:18, alignItems:'stretch' }}>

        {/* FILA */}
        <section style={card()}>
          <div style={{ padding:'18px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:17, color:'#227069' }}>Fila de hoje</h3>
              <span style={{ fontSize:11.5, color:'#6E807D' }}>6 atendimentos</span>
            </div>
            <button style={{ background:'#E7F2F0', color:'#227069', border:'none', fontFamily:'inherit', fontSize:12, fontWeight:600, padding:'7px 14px', borderRadius:10, cursor:'pointer' }}>Ver todos</button>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:14, padding:'4px 0 12px', fontWeight:700, fontSize:13, color:'#227069' }}>
            <button style={{ border:'none', background:'none', fontSize:15, color:'#6E807D', cursor:'pointer' }}>‹</button>
            14/07
            <button style={{ border:'none', background:'none', fontSize:15, color:'#6E807D', cursor:'pointer' }}>›</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'0 14px 16px', maxHeight:480, overflowY:'auto' }}>
            {LEADS.map((l,i)=>(
              <div key={i} onClick={()=>setSel(i)} style={{
                display:'flex', alignItems:'center', gap:12,
                background: sel===i ? '#fff' : '#F2F7F6',
                borderLeft: `5px solid ${l.cor}`,
                borderRadius:14, padding:'11px 12px', cursor:'pointer',
                border: `1px solid #DFE9E7`,
                borderLeftColor: l.cor, borderLeftWidth:5,
                boxShadow: sel===i ? '0 8px 20px rgba(30,70,66,.14)' : 'none',
                transition:'all .12s',
              }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:'#E7F2F0', color:'#227069', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:15, flexShrink:0 }}>{l.n[0]}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <b style={{ fontSize:13.5, display:'block' }}>{l.n}</b>
                  <small style={{ fontSize:11.5, color:'#6E807D' }}>{l.proc}</small>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <b style={{ fontSize:13, color:'#227069', display:'block' }}>{l.h}</b>
                  <span style={{ ...STATUS_STYLE[l.stc], fontSize:10, fontWeight:700, borderRadius:8, padding:'2px 8px', display:'inline-block', marginTop:3 }}>{l.st}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CHAT */}
        <section style={{ ...card(), display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px', borderBottom:'1px solid #DFE9E7', background:'linear-gradient(180deg,#fff,#FAFCFB)', flexWrap:'wrap' }}>
            <div style={{ width:46, height:46, borderRadius:'50%', background:'#E7F2F0', color:'#227069', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:17, flexShrink:0 }}>{lead.n[0]}</div>
            <div>
              <b style={{ fontSize:16 }}>{lead.n}</b>
              <div style={{ fontSize:12, color:'#6E807D' }}>{lead.meta}</div>
            </div>
            <div style={{ display:'flex', gap:8, marginLeft:14, flexWrap:'wrap' }}>
              {lead.ficha.map(f=>(
                <span key={f} style={{ background:'#F2F7F6', border:'1px solid #DFE9E7', fontSize:11, fontWeight:600, color:'#6E807D', borderRadius:9, padding:'4px 10px' }}>{f}</span>
              ))}
            </div>
            <button style={{ marginLeft:'auto', border:'none', cursor:'pointer', background:'linear-gradient(135deg,#9B6CF0,#7c4de0)', color:'#fff', fontFamily:'inherit', fontSize:12.5, fontWeight:600, padding:'10px 18px', borderRadius:12, boxShadow:'0 6px 16px rgba(124,77,224,.3)', flexShrink:0 }}>
              ✦ Ficha da cliente
            </button>
          </div>
          {/* Mensagens */}
          <div style={{ flex:1, padding:22, display:'flex', flexDirection:'column', gap:12, background:'linear-gradient(180deg,#F6FAF9,#EDF4F2)', overflowY:'auto', minHeight:300 }}>
            {lead.msgs.map((m,i)=>{
              if(m.t==='sep') return <div key={i} style={{ alignSelf:'center', fontSize:11, fontWeight:600, color:'#6E807D', background:'#fff', borderRadius:10, padding:'3px 12px', boxShadow:'0 2px 6px rgba(30,70,66,.06)' }}>{m.x}</div>
              if(m.t==='sys') return <div key={i} style={{ alignSelf:'center', background:'#FCF3DF', color:'#7a5a12', fontSize:12, fontWeight:600, borderRadius:12, padding:'8px 14px', maxWidth:'80%', textAlign:'center' }}>⚡ {m.x}</div>
              if(m.t==='in')  return <div key={i} style={{ maxWidth:'66%', background:'#fff', alignSelf:'flex-start', borderRadius:'16px 16px 16px 5px', padding:'11px 15px', fontSize:13.5, lineHeight:1.45, boxShadow:'0 3px 8px rgba(30,70,66,.06)' }}>{m.x}<span style={{ display:'block', fontSize:10, opacity:.65, marginTop:4, textAlign:'right' }}>{m.h}</span></div>
              return <div key={i} style={{ maxWidth:'66%', background:'#2E8F87', color:'#fff', alignSelf:'flex-end', borderRadius:'16px 16px 5px 16px', padding:'11px 15px', fontSize:13.5, lineHeight:1.45, boxShadow:'0 3px 8px rgba(30,70,66,.06)' }}>
                <span style={{ display:'block', fontSize:10.5, fontWeight:700, opacity:.85, marginBottom:3 }}>{m.who}</span>
                {m.x}<span style={{ display:'block', fontSize:10, opacity:.65, marginTop:4, textAlign:'right' }}>{m.h}</span>
              </div>
            })}
          </div>
          {/* Input */}
          <div style={{ display:'flex', gap:10, alignItems:'center', padding:'14px 18px', borderTop:'1px solid #DFE9E7', background:'#fff' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:600, color:'#6E807D' }}>
              <div style={{ width:38, height:22, background:'#9B6CF0', borderRadius:20, position:'relative', cursor:'pointer' }}>
                <span style={{ position:'absolute', top:3, right:3, width:16, height:16, background:'#fff', borderRadius:'50%', display:'block' }}/>
              </div>
              IA
            </div>
            <input type="text" placeholder="Escreva sua mensagem aqui…" style={{ flex:1, border:'1.5px solid #DFE9E7', borderRadius:14, padding:'12px 16px', fontFamily:'inherit', fontSize:13.5, outline:'none', background:'#F2F7F6' }} />
            <button style={{ border:'none', cursor:'pointer', width:44, height:44, borderRadius:14, background:'#2E8F87', color:'#fff', fontSize:17, boxShadow:'0 6px 14px rgba(46,143,135,.35)' }}>➤</button>
          </div>
        </section>
      </div>

      {/* Analytics */}
      <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:19, color:'#227069', margin:'6px 0 14px' }}>📈 Desempenho da semana</h3>

      <div style={{ display:'grid', gridTemplateColumns:'1.35fr 1fr', gap:16, marginBottom:18 }}>
        {/* Barras */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Conversas por dia</h3>
          <p style={{ fontSize:11.5, color:'#6E807D', marginBottom:16 }}>Parte roxa = resolvidas 100% pela IA</p>
          <div style={{ display:'flex', alignItems:'flex-end', gap:14, height:180, paddingTop:8 }}>
            {[['Qua',.52,.78],['Qui',.40,.82],['Sex',.66,.85],['Sáb',.88,.90],['Dom',.34,.95],['Seg',.72,.84],['Ter',.96,.88]].map(([label,total,ia])=>(
              <div key={label as string} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:8, height:'100%', justifyContent:'flex-end' }}>
                <div style={{ width:'100%', maxWidth:44, borderRadius:'9px 9px 4px 4px', background:'linear-gradient(180deg,#3AA79D,#2E8F87)', position:'relative', height:`${(total as number)*100}%` }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, borderRadius:'9px 9px 0 0', background:'#9B6CF0', height:`${(ia as number)*100}%` }} />
                </div>
                <span style={{ fontSize:11, color:'#6E807D', fontWeight:600 }}>{label}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:16, marginTop:14, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, color:'#6E807D', fontWeight:500 }}><span style={{ width:11, height:11, borderRadius:4, background:'#9B6CF0', display:'inline-block' }}/> Resolvidas pela IA</div>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, color:'#6E807D', fontWeight:500 }}><span style={{ width:11, height:11, borderRadius:4, background:'#2E8F87', display:'inline-block' }}/> Com intervenção humana</div>
          </div>
        </section>

        {/* Heatmap */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Horários de pico</h3>
          <p style={{ fontSize:11.5, color:'#6E807D', marginBottom:16 }}>Mensagens por dia da semana e hora</p>
          <div style={{ display:'grid', gridTemplateColumns:'34px repeat(14,1fr)', gap:4, alignItems:'center' }}>
            {HEATMAP_DATA.map((row,di)=>([
              <span key={`d${di}`} style={{ fontSize:10.5, color:'#6E807D', fontWeight:600 }}>{DIAS[di]}</span>,
              ...row.map((v,hi)=>(
                <div key={`${di}-${hi}`} style={{ aspectRatio:'1', borderRadius:5, background: HEAT_COLORS[v] }} />
              ))
            ]))}
            <span/>
            {HORAS.map(h=><span key={h} style={{ fontSize:9.5, color:'#6E807D', textAlign:'center' }}>{h}</span>)}
          </div>
        </section>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.2fr', gap:16, marginBottom:32 }}>
        {/* Donut */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Interesse por procedimento</h3>
          <p style={{ fontSize:11.5, color:'#6E807D', marginBottom:16 }}>Leads da semana por serviço</p>
          <div style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div style={{ width:126, height:126, borderRadius:'50%', flexShrink:0, position:'relative',
              background:'conic-gradient(#2E8F87 0 34%,#9B6CF0 34% 58%,#F6BE4F 58% 76%,#37C977 76% 90%,#CFE7E3 90% 100%)' }}>
              <div style={{ position:'absolute', inset:22, background:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Baloo 2',sans-serif", fontSize:19, color:'#227069', fontWeight:700 }}>312</div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {[['#2E8F87','Botox','34%'],['#9B6CF0','Preenchimento','24%'],['#F6BE4F','Limpeza de pele','18%'],['#37C977','Laser','14%'],['#CFE7E3','Outros','10%']].map(([c,l,p])=>(
                <div key={l} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, fontWeight:500 }}>
                  <span style={{ width:11, height:11, borderRadius:4, background:c, display:'inline-block' }}/>
                  {l} <b style={{ marginLeft:'auto', color:'#6E807D', fontWeight:600 }}>{p}</b>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Funil */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Funil do Kanban</h3>
          <p style={{ fontSize:11.5, color:'#6E807D', marginBottom:16 }}>Do lead novo ao comparecimento</p>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[['Leads novos','100%',100,'#2E8F87','312'],['Em conversa','74%',74,'#3AA79D','231'],['Agendados','28%',28,'#9B6CF0','86'],['Compareceram','22%',22,'#37C977','69']].map(([label,pct,w,c,v])=>(
              <div key={label as string} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ width:106, fontSize:12, fontWeight:600 }}>{label}</span>
                <div style={{ flex:1, background:'#F2F7F6', borderRadius:10, height:30, overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:10, background:c as string, width:`${w}%`, display:'flex', alignItems:'center', padding:'0 12px', color:'#fff', fontSize:12, fontWeight:700, minWidth:52 }}>{v}</div>
                </div>
                <span style={{ width:44, fontSize:12, fontWeight:700, color:'#6E807D', textAlign:'right' }}>{pct}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:6, marginTop:16, fontSize:12, color:'#6E807D' }}>⚡ Follow-ups recuperaram <b style={{ color:'#227069' }}>&nbsp;17 leads</b></div>
        </section>

        {/* Ranking */}
        <section style={{ ...card(), padding:'20px 22px' }}>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:16, color:'#227069' }}>Origem dos leads</h3>
          <p style={{ fontSize:11.5, color:'#6E807D', marginBottom:16 }}>De onde vieram as conversas</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {[['📱','Anúncios Meta',46,144],['🤝','Indicação',27,84],['📸','Instagram orgânico',17,53],['🔎','Google',10,31]].map(([ic,l,pct,v])=>(
              <div key={l as string} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:34, height:34, borderRadius:'50%', background:'#E7F2F0', color:'#227069', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{ic}</div>
                <div style={{ flex:1 }}>
                  <b style={{ fontSize:13, display:'block' }}>{l}</b>
                  <div style={{ height:7, borderRadius:6, background:'#F2F7F6', marginTop:5, overflow:'hidden' }}>
                    <div style={{ display:'block', height:'100%', borderRadius:6, background:'linear-gradient(90deg,#2E8F87,#3AA79D)', width:`${pct}%` }}/>
                  </div>
                </div>
                <span style={{ fontSize:12.5, fontWeight:700, color:'#227069', width:56, textAlign:'right' }}>{v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 4px rgba(155,108,240,.25)}50%{box-shadow:0 0 0 10px rgba(155,108,240,0)}}`}</style>
    </div>
  )
}
