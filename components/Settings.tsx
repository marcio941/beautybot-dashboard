'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

interface Props {
  onLogoChange?: (url: string | null) => void
  onNomeChange?: (nome: string | null) => void
}

interface DiaHorario {
  fechado: boolean
  inicio: string
  fim: string
}

const DIAS: { key: string; label: string }[] = [
  { key: '1', label: 'Segunda-feira' },
  { key: '2', label: 'Terça-feira' },
  { key: '3', label: 'Quarta-feira' },
  { key: '4', label: 'Quinta-feira' },
  { key: '5', label: 'Sexta-feira' },
  { key: '6', label: 'Sábado' },
  { key: '7', label: 'Domingo' },
]

function parseHorarios(raw: unknown): Record<string, DiaHorario> {
  const resultado: Record<string, DiaHorario> = {}
  const obj = (raw ?? {}) as Record<string, unknown>
  for (const dia of DIAS) {
    const intervalos = obj[dia.key]
    if (Array.isArray(intervalos) && intervalos.length > 0 && Array.isArray(intervalos[0])) {
      const [inicio, fim] = intervalos[0] as [string, string]
      resultado[dia.key] = { fechado: false, inicio: inicio || '09:00', fim: fim || '18:00' }
    } else {
      resultado[dia.key] = { fechado: true, inicio: '09:00', fim: '18:00' }
    }
  }
  return resultado
}

const secao = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--card-bg)', border: '1px solid var(--line)', borderRadius: 14,
  padding: 20, maxWidth: 420, marginTop: 20, ...style,
})

const campoLabel: React.CSSProperties = { fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }

const campoInput: React.CSSProperties = {
  display: 'block', width: '100%', marginTop: 6, border: '1.5px solid var(--line)',
  borderRadius: 10, padding: '9px 12px', fontFamily: 'inherit', fontSize: 13.5, outline: 'none',
  background: 'var(--card-bg)', color: 'var(--ink)',
}

const botaoSalvar = (desabilitado: boolean): React.CSSProperties => ({
  background: '#227069', color: '#fff', border: 'none', borderRadius: 10,
  padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: desabilitado ? 'wait' : 'pointer',
  opacity: desabilitado ? 0.6 : 1, marginTop: 16,
})

const caixaErro: React.CSSProperties = {
  background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginTop: 12,
}

export default function Settings({ onLogoChange, onNomeChange }: Props) {
  const { contaId, logoUrl, loading: perfilCarregando } = useProfile()

  // Logo (existente, não alterado)
  const [logoAtual, setLogoAtual] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!perfilCarregando) setLogoAtual(logoUrl)
  }, [perfilCarregando, logoUrl])

  async function handleArquivoSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo || !contaId) return

    if (!arquivo.type.startsWith('image/')) {
      setErro('Selecione um arquivo de imagem.')
      return
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErro('A imagem precisa ter até 5MB.')
      return
    }

    setErro(null)
    setEnviando(true)
    try {
      const caminho = `${contaId}/logo`
      const { error: erroUpload } = await supabase.storage
        .from('logos')
        .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type })
      if (erroUpload) throw erroUpload

      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(caminho)
      const novaUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`

      const { error: erroUpdate } = await supabase
        .from('contas')
        .update({ logo_url: novaUrl })
        .eq('id', contaId)
      if (erroUpdate) throw erroUpdate

      setLogoAtual(novaUrl)
      onLogoChange?.(novaUrl)
    } catch (err) {
      console.error('Erro ao enviar logo:', err)
      setErro('Não foi possível salvar a logo. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  // Rótulos, horários e regras — carregados juntos de `contas`
  const [configCarregando, setConfigCarregando] = useState(true)
  const [configErro, setConfigErro] = useState<string | null>(null)

  const [nomeConta, setNomeConta] = useState('')
  const [nomeSalvando, setNomeSalvando] = useState(false)
  const [nomeErro, setNomeErro] = useState<string | null>(null)

  const [rotuloServico, setRotuloServico] = useState('')
  const [rotuloSegmento, setRotuloSegmento] = useState('')
  const [rotuloProfissional, setRotuloProfissional] = useState('')
  const [rotulosSalvando, setRotulosSalvando] = useState(false)
  const [rotulosErro, setRotulosErro] = useState<string | null>(null)

  const [horarios, setHorarios] = useState<Record<string, DiaHorario>>({})
  const [horariosSalvando, setHorariosSalvando] = useState(false)
  const [horariosErro, setHorariosErro] = useState<string | null>(null)

  const [slotGranularidade, setSlotGranularidade] = useState('')
  const [antecedenciaMinima, setAntecedenciaMinima] = useState('')
  const [antecedenciaMaxima, setAntecedenciaMaxima] = useState('')
  const [regrasSalvando, setRegrasSalvando] = useState(false)
  const [regrasErro, setRegrasErro] = useState<string | null>(null)

  useEffect(() => {
    if (perfilCarregando) return
    if (!contaId) { setConfigCarregando(false); return }

    let ativo = true
    async function carregar() {
      setConfigCarregando(true)
      setConfigErro(null)
      try {
        const { data, error } = await supabase
          .from('contas')
          .select('nome, rotulo_servico, rotulo_segmento, rotulo_profissional, horarios_funcionamento, slot_granularidade_min, antecedencia_minima_horas, antecedencia_maxima_dias')
          .eq('id', contaId)
          .single()
        if (error) throw error
        if (!ativo) return

        setNomeConta(data?.nome ?? '')
        setRotuloServico(data?.rotulo_servico ?? '')
        setRotuloSegmento(data?.rotulo_segmento ?? '')
        setRotuloProfissional(data?.rotulo_profissional ?? '')
        setHorarios(parseHorarios(data?.horarios_funcionamento))
        setSlotGranularidade(data?.slot_granularidade_min != null ? String(data.slot_granularidade_min) : '')
        setAntecedenciaMinima(data?.antecedencia_minima_horas != null ? String(data.antecedencia_minima_horas) : '')
        setAntecedenciaMaxima(data?.antecedencia_maxima_dias != null ? String(data.antecedencia_maxima_dias) : '')
      } catch (err) {
        console.error('Erro ao carregar configurações da conta:', err)
        if (ativo) setConfigErro('Não foi possível carregar as configurações da conta.')
      } finally {
        if (ativo) setConfigCarregando(false)
      }
    }
    carregar()
    return () => { ativo = false }
  }, [contaId, perfilCarregando])

  async function salvarNomeConta() {
    if (!contaId) return
    const nome = nomeConta.trim()
    if (!nome) { setNomeErro('Informe o nome da conta.'); return }

    setNomeErro(null)
    setNomeSalvando(true)
    try {
      const { error } = await supabase.from('contas').update({ nome }).eq('id', contaId)
      if (error) throw error
      setNomeConta(nome)
      onNomeChange?.(nome)
    } catch (err) {
      console.error('Erro ao salvar nome da conta:', err)
      setNomeErro('Não foi possível salvar o nome da conta. Tente de novo.')
    } finally {
      setNomeSalvando(false)
    }
  }

  async function salvarRotulos() {
    if (!contaId) return
    setRotulosErro(null)
    setRotulosSalvando(true)
    try {
      const { error } = await supabase
        .from('contas')
        .update({
          rotulo_servico: rotuloServico.trim() || null,
          rotulo_segmento: rotuloSegmento.trim() || null,
          rotulo_profissional: rotuloProfissional.trim() || null,
        })
        .eq('id', contaId)
      if (error) throw error
    } catch (err) {
      console.error('Erro ao salvar rótulos:', err)
      setRotulosErro('Não foi possível salvar os rótulos. Tente de novo.')
    } finally {
      setRotulosSalvando(false)
    }
  }

  function atualizarDia(dia: string, alteracao: Partial<DiaHorario>) {
    setHorarios(prev => ({ ...prev, [dia]: { ...prev[dia], ...alteracao } }))
  }

  async function salvarHorarios() {
    if (!contaId) return
    setHorariosErro(null)
    setHorariosSalvando(true)
    try {
      const payload: Record<string, [string, string][]> = {}
      for (const dia of DIAS) {
        const d = horarios[dia.key]
        payload[dia.key] = d?.fechado ? [] : [[d?.inicio || '09:00', d?.fim || '18:00']]
      }
      const { error } = await supabase
        .from('contas')
        .update({ horarios_funcionamento: payload })
        .eq('id', contaId)
      if (error) throw error
    } catch (err) {
      console.error('Erro ao salvar horários de funcionamento:', err)
      setHorariosErro('Não foi possível salvar os horários. Tente de novo.')
    } finally {
      setHorariosSalvando(false)
    }
  }

  async function salvarRegras() {
    if (!contaId) return
    const granularidade = parseInt(slotGranularidade, 10)
    const minima = parseInt(antecedenciaMinima, 10)
    const maxima = parseInt(antecedenciaMaxima, 10)

    if (!Number.isFinite(granularidade) || granularidade <= 0) {
      setRegrasErro('A granularidade dos horários precisa ser um número positivo de minutos.')
      return
    }
    if (!Number.isFinite(minima) || minima < 0) {
      setRegrasErro('A antecedência mínima precisa ser um número de horas maior ou igual a zero.')
      return
    }
    if (!Number.isFinite(maxima) || maxima <= 0) {
      setRegrasErro('A antecedência máxima precisa ser um número positivo de dias.')
      return
    }

    setRegrasErro(null)
    setRegrasSalvando(true)
    try {
      const { error } = await supabase
        .from('contas')
        .update({
          slot_granularidade_min: granularidade,
          antecedencia_minima_horas: minima,
          antecedencia_maxima_dias: maxima,
        })
        .eq('id', contaId)
      if (error) throw error
    } catch (err) {
      console.error('Erro ao salvar regras de agendamento:', err)
      setRegrasErro('Não foi possível salvar as regras. Tente de novo.')
    } finally {
      setRegrasSalvando(false)
    }
  }

  return (
    <div>
      <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>⚙ Configurações</h2>
      <p style={{ color: 'var(--sub)', fontSize: 13, marginBottom: 24 }}>Conexão Evolution API, N8N e variáveis do sistema.</p>

      <section style={secao({ marginTop: 0 })}>
        <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 18, color: '#227069', margin: '0 0 4px' }}>Logo da conta</h3>
        <p style={{ color: 'var(--sub)', fontSize: 13, margin: '0 0 16px' }}>
          Aparece no menu lateral e na página pública de agendamento.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14, background: 'var(--mist)',
            border: '1px solid var(--line)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
          }}>
            {perfilCarregando ? (
              <span style={{ fontSize: 12, color: 'var(--sub)' }}>...</span>
            ) : logoAtual ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoAtual} alt="Logo atual" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 12, color: 'var(--sub)', textAlign: 'center', padding: 4 }}>Sem logo</span>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={enviando || perfilCarregando || !contaId}
              style={{
                background: '#227069', color: '#fff', border: 'none', borderRadius: 10,
                padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                opacity: enviando || perfilCarregando || !contaId ? 0.6 : 1,
              }}
            >
              {enviando ? 'Enviando...' : 'Trocar logo'}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleArquivoSelecionado}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {erro && (
          <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>
            {erro}
          </p>
        )}
      </section>

      {configErro && (
        <p style={{ ...caixaErro, maxWidth: 420 }}>{configErro}</p>
      )}

      <section style={secao()}>
        <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 18, color: '#227069', margin: '0 0 4px' }}>Nome da conta</h3>
        <p style={{ color: 'var(--sub)', fontSize: 13, margin: '0 0 16px' }}>
          Aparece em destaque no topo do menu lateral.
        </p>

        {configCarregando ? (
          <p style={{ color: 'var(--sub)', fontSize: 13 }}>Carregando…</p>
        ) : (
          <>
            <label style={campoLabel}>
              Nome
              <input type="text" value={nomeConta} onChange={(e) => setNomeConta(e.target.value)} style={campoInput} />
            </label>

            {nomeErro && <p style={caixaErro}>{nomeErro}</p>}

            <button onClick={salvarNomeConta} disabled={nomeSalvando || !contaId} style={botaoSalvar(nomeSalvando || !contaId)}>
              {nomeSalvando ? 'Salvando...' : 'Salvar nome'}
            </button>
          </>
        )}
      </section>

      <section style={secao()}>
        <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 18, color: '#227069', margin: '0 0 4px' }}>Rótulos da conta</h3>
        <p style={{ color: 'var(--sub)', fontSize: 13, margin: '0 0 16px' }}>
          Como os termos aparecem na página pública de agendamento. Deixe o segmento em branco para escondê-lo.
        </p>

        {configCarregando ? (
          <p style={{ color: 'var(--sub)', fontSize: 13 }}>Carregando…</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={campoLabel}>
                Serviço (ex: Serviço, Corte, Sessão, Consulta)
                <input type="text" value={rotuloServico} onChange={(e) => setRotuloServico(e.target.value)} style={campoInput} />
              </label>
              <label style={campoLabel}>
                Segmento (opcional — some da página pública se vazio)
                <input type="text" value={rotuloSegmento} onChange={(e) => setRotuloSegmento(e.target.value)} style={campoInput} />
              </label>
              <label style={campoLabel}>
                Profissional (ex: Profissional, Barbeiro, Dentista)
                <input type="text" value={rotuloProfissional} onChange={(e) => setRotuloProfissional(e.target.value)} style={campoInput} />
              </label>
            </div>

            {rotulosErro && <p style={caixaErro}>{rotulosErro}</p>}

            <button onClick={salvarRotulos} disabled={rotulosSalvando || !contaId} style={botaoSalvar(rotulosSalvando || !contaId)}>
              {rotulosSalvando ? 'Salvando...' : 'Salvar rótulos'}
            </button>
          </>
        )}
      </section>

      <section style={secao({ maxWidth: 520 })}>
        <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 18, color: '#227069', margin: '0 0 4px' }}>Horário de funcionamento</h3>
        <p style={{ color: 'var(--sub)', fontSize: 13, margin: '0 0 16px' }}>
          Dias e horários em que a conta aceita agendamentos.
        </p>

        {configCarregando ? (
          <p style={{ color: 'var(--sub)', fontSize: 13 }}>Carregando…</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DIAS.map((dia) => {
                const d = horarios[dia.key] ?? { fechado: true, inicio: '09:00', fim: '18:00' }
                return (
                  <div key={dia.key} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', width: 128, flexShrink: 0 }}>
                      <input
                        type="checkbox"
                        checked={!d.fechado}
                        onChange={(e) => atualizarDia(dia.key, { fechado: !e.target.checked })}
                      />
                      {dia.label}
                    </label>
                    {d.fechado ? (
                      <span style={{ fontSize: 12.5, color: 'var(--sub)' }}>Fechado</span>
                    ) : (
                      <>
                        <input
                          type="time"
                          value={d.inicio}
                          onChange={(e) => atualizarDia(dia.key, { inicio: e.target.value })}
                          style={{ border: '1.5px solid var(--line)', borderRadius: 8, padding: '6px 8px', fontFamily: 'inherit', fontSize: 13, background: 'var(--card-bg)', color: 'var(--ink)' }}
                        />
                        <span style={{ color: 'var(--sub)', fontSize: 12.5 }}>até</span>
                        <input
                          type="time"
                          value={d.fim}
                          onChange={(e) => atualizarDia(dia.key, { fim: e.target.value })}
                          style={{ border: '1.5px solid var(--line)', borderRadius: 8, padding: '6px 8px', fontFamily: 'inherit', fontSize: 13, background: 'var(--card-bg)', color: 'var(--ink)' }}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            {horariosErro && <p style={caixaErro}>{horariosErro}</p>}

            <button onClick={salvarHorarios} disabled={horariosSalvando || !contaId} style={botaoSalvar(horariosSalvando || !contaId)}>
              {horariosSalvando ? 'Salvando...' : 'Salvar horários'}
            </button>
          </>
        )}
      </section>

      <section style={secao()}>
        <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 18, color: '#227069', margin: '0 0 4px' }}>Regras de agendamento</h3>
        <p style={{ color: 'var(--sub)', fontSize: 13, margin: '0 0 16px' }}>
          Controlam os horários oferecidos e a janela de agendamento.
        </p>

        {configCarregando ? (
          <p style={{ color: 'var(--sub)', fontSize: 13 }}>Carregando…</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={campoLabel}>
                Granularidade dos horários (minutos)
                <input type="number" min={1} value={slotGranularidade} onChange={(e) => setSlotGranularidade(e.target.value)} style={campoInput} />
              </label>
              <label style={campoLabel}>
                Antecedência mínima para agendar (horas)
                <input type="number" min={0} value={antecedenciaMinima} onChange={(e) => setAntecedenciaMinima(e.target.value)} style={campoInput} />
              </label>
              <label style={campoLabel}>
                Antecedência máxima para agendar (dias)
                <input type="number" min={1} value={antecedenciaMaxima} onChange={(e) => setAntecedenciaMaxima(e.target.value)} style={campoInput} />
              </label>
            </div>

            {regrasErro && <p style={caixaErro}>{regrasErro}</p>}

            <button onClick={salvarRegras} disabled={regrasSalvando || !contaId} style={botaoSalvar(regrasSalvando || !contaId)}>
              {regrasSalvando ? 'Salvando...' : 'Salvar regras'}
            </button>
          </>
        )}
      </section>
    </div>
  )
}
