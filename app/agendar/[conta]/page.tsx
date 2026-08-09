'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Conta = { id: string; nome: string; segmento: string | null }
type Servico = { id: string; nome: string; duracao_min: number; preco: number | null }
type Slot = { inicio: string; fim: string }
type Status = 'carregando' | 'nao_encontrada' | 'carregada'

const TZ = 'America/Sao_Paulo'

const fmtDiaCurto = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: TZ })
const fmtDiaNum = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: TZ })
const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: TZ })
const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: TZ })
const fmtCompleto = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: TZ,
})

const chaveDia = (iso: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))

const moeda = (v: number | null) =>
  v == null ? null : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function AgendarPage() {
  const params = useParams<{ conta: string }>()
  const search = useSearchParams()
  const servicoNaUrl = search.get('servico')

  // Só vira true depois que o componente monta no cliente. Nenhum cálculo de
  // data/hora pode acontecer antes disso — servidor e cliente podem estar em
  // fusos diferentes, e é isso que causa hydration mismatch.
  const [montado, setMontado] = useState(false)
  const [status, setStatus] = useState<Status>('carregando')

  const [conta, setConta] = useState<Conta | null>(null)
  const [servicos, setServicos] = useState<Servico[]>([])
  const [servicoId, setServicoId] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [dias, setDias] = useState<[string, Slot[]][]>([])
  const [diaAtivo, setDiaAtivo] = useState<string | null>(null)
  const [escolhido, setEscolhido] = useState<Slot | null>(null)

  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacao, setObservacao] = useState('')

  const [buscandoSlots, setBuscandoSlots] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmado, setConfirmado] = useState<{ data_legivel: string } | null>(null)

  useEffect(() => {
    setMontado(true)
  }, [])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      setStatus('carregando')
      setErro(null)
      try {
        const { data: contas, error: e1 } = await supabase.rpc('conta_publica', { p_slug: params.conta })
        if (e1) throw e1
        const c: Conta | undefined = contas?.[0]
        if (!vivo) return
        if (!c) {
          setStatus('nao_encontrada')
          setErro('Esta página de agendamento não existe. Confira o link.')
          return
        }
        const { data: servs, error: e2 } = await supabase.rpc('servicos_publicos', { p_conta_id: c.id })
        if (e2) throw e2
        if (!vivo) return
        setConta(c)
        setServicos(servs ?? [])
        const pre = (servs ?? []).find(
          (s: Servico) => s.id === servicoNaUrl || s.nome.toLowerCase() === (servicoNaUrl ?? '').toLowerCase()
        )
        if (pre) setServicoId(pre.id)
        setStatus('carregada')
      } catch {
        if (!vivo) return
        setStatus('nao_encontrada')
        setErro('Não foi possível carregar esta página. Tente recarregar.')
      }
    })()
    return () => { vivo = false }
  }, [params.conta, servicoNaUrl])

  const carregarSlots = useCallback(async (contaId: string, servId: string) => {
    setBuscandoSlots(true)
    setErro(null)
    setEscolhido(null)
    try {
      const { data, error } = await supabase.rpc('horarios_disponiveis', {
        p_conta_id: contaId, p_servico_id: servId, p_dias: 21,
      })
      if (error) throw error
      setSlots(data ?? [])
    } catch {
      setErro('Não foi possível carregar os horários. Tente de novo.')
      setSlots([])
    } finally {
      setBuscandoSlots(false)
    }
  }, [])

  useEffect(() => {
    if (conta && servicoId) carregarSlots(conta.id, servicoId)
  }, [conta, servicoId, carregarSlots])

  // Agrupar os slots por dia envolve Intl/timeZone — só pode acontecer depois
  // de montado, então fica inteiramente dentro de um efeito, nunca no corpo
  // do componente durante o render.
  useEffect(() => {
    const mapa = new Map<string, Slot[]>()
    for (const s of slots) {
      const k = chaveDia(s.inicio)
      if (!mapa.has(k)) mapa.set(k, [])
      mapa.get(k)!.push(s)
    }
    const lista = Array.from(mapa.entries())
    setDias(lista)
    setDiaAtivo(lista.length ? lista[0][0] : null)
  }, [slots])

  const servico = servicos.find((s) => s.id === servicoId) ?? null
  const horariosDoDia = dias.find(([k]) => k === diaAtivo)?.[1] ?? []
  const podeEnviar = !!escolhido && nome.trim().length > 1 && telefone.replace(/\D/g, '').length >= 10

  async function confirmar() {
    if (!conta || !servicoId || !escolhido) return
    setEnviando(true)
    setErro(null)
    try {
      const { data, error } = await supabase.rpc('criar_agendamento', {
        p_conta_id: conta.id,
        p_servico_id: servicoId,
        p_inicio: escolhido.inicio,
        p_nome: nome,
        p_telefone: telefone,
        p_observacao: observacao || null,
      })
      if (error) throw error
      if (data?.ok) {
        setConfirmado({ data_legivel: data.data_legivel })
      } else if (data?.erro === 'horario_indisponivel') {
        setErro('Esse horário acabou de ser ocupado. Escolha outro abaixo.')
        await carregarSlots(conta.id, servicoId)
      } else if (data?.erro === 'dados_invalidos') {
        setErro('Confira o nome e o telefone com DDD.')
      } else {
        setErro('Não foi possível concluir. Tente novamente.')
      }
    } catch {
      setErro('Não foi possível concluir. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="pagina">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700&family=Karla:wght@400;500;600&display=swap');

        .pagina {
          --ink: #12302C;
          --ink-mute: #5B7A74;
          --teal: #12695E;
          --teal-soft: #DDEDE8;
          --rose: #C24C72;
          --cream: #F4F9F7;
          --linha: #DCE8E4;

          min-height: 100dvh;
          background: var(--cream);
          color: var(--ink);
          font-family: 'Karla', system-ui, sans-serif;
          padding: 24px 18px 96px;
        }
        .caixa { max-width: 560px; margin: 0 auto; }

        .topo { margin-bottom: 28px; }
        .eyebrow {
          font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
          color: var(--ink-mute); margin: 0 0 6px;
        }
        .titulo {
          font-family: 'Baloo 2', system-ui, sans-serif; font-weight: 700;
          font-size: clamp(28px, 7vw, 38px); line-height: 1.1; margin: 0;
          color: var(--teal);
        }

        .secao { margin-bottom: 30px; }
        .rotulo {
          font-size: 13px; font-weight: 600; letter-spacing: .04em;
          text-transform: uppercase; color: var(--ink-mute); margin: 0 0 12px;
        }

        .servicos { display: grid; gap: 10px; }
        .servico {
          display: flex; justify-content: space-between; align-items: baseline; gap: 14px;
          width: 100%; text-align: left; cursor: pointer;
          background: #fff; border: 1.5px solid var(--linha); border-radius: 14px;
          padding: 14px 16px; font: inherit; color: inherit;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .servico:hover { border-color: var(--teal); }
        .servico[aria-pressed="true"] {
          border-color: var(--teal); box-shadow: inset 3px 0 0 var(--teal);
        }
        .servico-nome { font-weight: 600; }
        .servico-meta { font-size: 13px; color: var(--ink-mute); white-space: nowrap; }

        .rail {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px;
          scrollbar-width: none; -webkit-overflow-scrolling: touch;
        }
        .rail::-webkit-scrollbar { display: none; }
        .dia {
          flex: 0 0 auto; width: 62px; padding: 10px 0; cursor: pointer;
          background: #fff; border: 1.5px solid var(--linha); border-radius: 14px;
          font: inherit; color: inherit; text-align: center; line-height: 1.25;
        }
        .dia[aria-pressed="true"] { background: var(--teal); border-color: var(--teal); color: #fff; }
        .dia-semana { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; opacity: .75; }
        .dia-num { font-family: 'Baloo 2', sans-serif; font-weight: 700; font-size: 20px; }
        .dia-mes { font-size: 11px; opacity: .75; }

        .horas { display: grid; grid-template-columns: repeat(auto-fill, minmax(88px, 1fr)); gap: 8px; }
        .hora {
          padding: 12px 0; cursor: pointer; font: inherit; color: inherit;
          background: #fff; border: 1.5px solid var(--linha); border-radius: 12px;
          font-variant-numeric: tabular-nums; font-weight: 500;
        }
        .hora[aria-pressed="true"] { background: var(--rose); border-color: var(--rose); color: #fff; }

        .campo { display: grid; gap: 6px; margin-bottom: 14px; }
        .campo label { font-size: 13px; font-weight: 600; color: var(--ink-mute); }
        .campo input, .campo textarea {
          font: inherit; color: inherit; padding: 12px 14px;
          background: #fff; border: 1.5px solid var(--linha); border-radius: 12px;
        }
        .campo input:focus, .campo textarea:focus { outline: 2px solid var(--teal); outline-offset: 1px; }

        .resumo {
          background: var(--teal-soft); border-radius: 14px; padding: 14px 16px;
          margin-bottom: 18px; font-size: 15px;
        }
        .resumo strong { font-weight: 600; }

        .cta {
          width: 100%; padding: 16px; cursor: pointer; font: inherit; font-weight: 600; font-size: 16px;
          background: var(--teal); color: #fff; border: none; border-radius: 14px;
        }
        .cta:disabled { background: #B7CCC7; cursor: not-allowed; }

        .aviso {
          background: #FDECEF; color: #8C2340; border-radius: 12px;
          padding: 12px 14px; margin-bottom: 16px; font-size: 14px;
        }
        .vazio { color: var(--ink-mute); font-size: 14px; }

        .sucesso { text-align: center; padding-top: 40px; }
        .sucesso-data {
          font-family: 'Baloo 2', sans-serif; font-weight: 700; color: var(--teal);
          font-size: clamp(22px, 6vw, 30px); margin: 12px 0 6px; line-height: 1.25;
        }

        button:focus-visible { outline: 2px solid var(--rose); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>

      <div className="caixa">
        {!montado || status === 'carregando' ? (
          <header className="topo">
            <p className="eyebrow">Agendamento</p>
            <h1 className="titulo">Carregando…</h1>
          </header>
        ) : status === 'nao_encontrada' ? (
          <>
            <header className="topo">
              <p className="eyebrow">Agendamento</p>
              <h1 className="titulo">Página não encontrada</h1>
            </header>
            <p className="aviso">{erro ?? 'Esta página de agendamento não existe. Confira o link.'}</p>
          </>
        ) : confirmado ? (
          <div className="sucesso">
            <p className="eyebrow">Agendamento confirmado</p>
            <p className="sucesso-data">{confirmado.data_legivel}</p>
            <p className="vazio">
              {servico?.nome} · {conta?.nome}
              <br />
              Guarde esta data. Se precisar remarcar, é só chamar no WhatsApp.
            </p>
          </div>
        ) : (
          <>
            <header className="topo">
              <p className="eyebrow">{conta?.segmento ?? 'Agendamento'}</p>
              <h1 className="titulo">{conta?.nome ?? 'Agendar'}</h1>
            </header>

            {erro && <p className="aviso">{erro}</p>}

            <section className="secao">
              <p className="rotulo">Serviço</p>
              <div className="servicos">
                {servicos.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="servico"
                    aria-pressed={s.id === servicoId}
                    onClick={() => setServicoId(s.id)}
                  >
                    <span className="servico-nome">{s.nome}</span>
                    <span className="servico-meta">
                      {s.duracao_min} min{moeda(s.preco) ? ` · ${moeda(s.preco)}` : ''}
                    </span>
                  </button>
                ))}
                {servicos.length === 0 && <p className="vazio">Nenhum serviço disponível no momento.</p>}
              </div>
            </section>

            {servicoId && (
              <section className="secao">
                <p className="rotulo">Dia</p>
                {buscandoSlots ? (
                  <p className="vazio">Procurando horários livres…</p>
                ) : dias.length === 0 ? (
                  <p className="vazio">Sem horários livres nas próximas semanas. Chame no WhatsApp que a gente encaixa.</p>
                ) : (
                  <div className="rail">
                    {dias.map(([k, lista]) => {
                      const d = new Date(lista[0].inicio)
                      return (
                        <button
                          key={k}
                          type="button"
                          className="dia"
                          aria-pressed={k === diaAtivo}
                          onClick={() => { setDiaAtivo(k); setEscolhido(null) }}
                        >
                          <span className="dia-semana">{fmtDiaCurto.format(d).replace('.', '')}</span>
                          <br />
                          <span className="dia-num">{fmtDiaNum.format(d)}</span>
                          <br />
                          <span className="dia-mes">{fmtMes.format(d).replace('.', '')}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {horariosDoDia.length > 0 && (
              <section className="secao">
                <p className="rotulo">Horário</p>
                <div className="horas">
                  {horariosDoDia.map((s) => (
                    <button
                      key={s.inicio}
                      type="button"
                      className="hora"
                      aria-pressed={escolhido?.inicio === s.inicio}
                      onClick={() => setEscolhido(s)}
                    >
                      {fmtHora.format(new Date(s.inicio))}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {escolhido && (
              <section className="secao">
                <div className="resumo">
                  <strong>{servico?.nome}</strong> · {fmtCompleto.format(new Date(escolhido.inicio))}
                </div>

                <p className="rotulo">Seus dados</p>
                <div className="campo">
                  <label htmlFor="nome">Nome</label>
                  <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
                </div>
                <div className="campo">
                  <label htmlFor="tel">WhatsApp com DDD</label>
                  <input
                    id="tel" inputMode="tel" value={telefone} placeholder="62 99999-9999"
                    onChange={(e) => setTelefone(e.target.value)} autoComplete="tel"
                  />
                </div>
                <div className="campo">
                  <label htmlFor="obs">Alguma observação? (opcional)</label>
                  <textarea id="obs" rows={2} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
                </div>

                <button type="button" className="cta" disabled={!podeEnviar || enviando} onClick={confirmar}>
                  {enviando ? 'Confirmando…' : 'Confirmar agendamento'}
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}
