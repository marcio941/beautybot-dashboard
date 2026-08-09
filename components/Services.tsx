'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

interface ServicoRow {
  id: string
  nome: string
  duracao_min: number
  preco: number | null
  ativo: boolean
  slug: string | null
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#fff', borderRadius: 22,
  boxShadow: '0 10px 30px rgba(30,70,66,.08)', ...style,
})

const fmtPreco = (preco: number | null) => {
  if (preco == null) return '—'
  return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Services() {
  const { contaId, loading: perfilCarregando } = useProfile()

  const [servicos, setServicos] = useState<ServicoRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<ServicoRow | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formDuracao, setFormDuracao] = useState('')
  const [formPreco, setFormPreco] = useState('')
  const [formErro, setFormErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (perfilCarregando) return
    if (!contaId) { setCarregando(false); return }
    carregarServicos()
  }, [contaId, perfilCarregando])

  async function carregarServicos() {
    setCarregando(true)
    setErro(null)
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome, duracao_min, preco, ativo, slug')
        .eq('conta_id', contaId)
        .order('ativo', { ascending: false })
        .order('nome', { ascending: true })
      if (error) throw error
      setServicos((data ?? []) as ServicoRow[])
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setErro('Não foi possível carregar os serviços. Tente recarregar.')
      setServicos([])
    } finally {
      setCarregando(false)
    }
  }

  function abrirNovo() {
    setEditando(null)
    setFormNome('')
    setFormDuracao('')
    setFormPreco('')
    setFormErro(null)
    setModalAberto(true)
  }

  function abrirEditar(s: ServicoRow) {
    setEditando(s)
    setFormNome(s.nome)
    setFormDuracao(String(s.duracao_min))
    setFormPreco(s.preco != null ? String(s.preco) : '')
    setFormErro(null)
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return
    setModalAberto(false)
  }

  async function salvar() {
    const nome = formNome.trim()
    const duracao = parseInt(formDuracao, 10)
    const preco = parseFloat(formPreco.replace(',', '.'))

    if (!nome) { setFormErro('Informe o nome do serviço.'); return }
    if (!Number.isFinite(duracao) || duracao <= 0) { setFormErro('A duração precisa ser um número positivo de minutos.'); return }
    if (!Number.isFinite(preco) || preco <= 0) { setFormErro('O preço precisa ser um valor positivo.'); return }

    setFormErro(null)
    setSalvando(true)
    try {
      if (editando) {
        const { error } = await supabase
          .from('servicos')
          .update({ nome, duracao_min: duracao, preco })
          .eq('id', editando.id)
        if (error) throw error
        setServicos(prev => prev.map(s => (s.id === editando.id ? { ...s, nome, duracao_min: duracao, preco } : s)))
      } else {
        const { data, error } = await supabase
          .from('servicos')
          .insert({ conta_id: contaId, nome, duracao_min: duracao, preco, ativo: true })
          .select('id, nome, duracao_min, preco, ativo, slug')
          .single()
        if (error) throw error
        setServicos(prev => [...prev, data as ServicoRow].sort((a, b) => a.nome.localeCompare(b.nome)))
      }
      setModalAberto(false)
    } catch (err) {
      console.error('Erro ao salvar serviço:', err)
      setFormErro('Não foi possível salvar o serviço. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(s: ServicoRow) {
    const novoAtivo = !s.ativo
    setAtualizandoId(s.id)
    setErro(null)
    setServicos(prev => prev.map(x => (x.id === s.id ? { ...x, ativo: novoAtivo } : x)))
    try {
      const { error } = await supabase.from('servicos').update({ ativo: novoAtivo }).eq('id', s.id)
      if (error) throw error
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err)
      setErro('Não foi possível atualizar o serviço. Tente de novo.')
      setServicos(prev => prev.map(x => (x.id === s.id ? { ...x, ativo: !novoAtivo } : x)))
    } finally {
      setAtualizandoId(null)
    }
  }

  const carregandoTela = perfilCarregando || carregando

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>✨ Serviços</h2>
          <p style={{ color: '#6E807D', fontSize: 13 }}>Catálogo de procedimentos oferecidos pela conta.</p>
        </div>
        <button
          onClick={abrirNovo}
          disabled={!contaId}
          style={{
            border: 'none', cursor: 'pointer', background: '#227069', color: '#fff',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '11px 18px',
            borderRadius: 12, boxShadow: '0 6px 16px rgba(34,112,105,.3)',
            opacity: !contaId ? 0.6 : 1,
          }}
        >
          + Novo serviço
        </button>
      </div>

      {erro && (
        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {erro}
        </p>
      )}

      {carregandoTela ? (
        <p style={{ color: '#6E807D', fontSize: 13 }}>Carregando serviços…</p>
      ) : servicos.length === 0 ? (
        <div style={{ ...card(), padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: '#9BB0AD', fontSize: 14, margin: 0 }}>Nenhum serviço cadastrado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {servicos.map(s => (
            <div key={s.id} style={{ ...card(), padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: s.ativo ? 1 : 0.6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <b style={{ fontSize: 14.5 }}>{s.nome}</b>
                  <span style={{
                    background: s.ativo ? '#DFF7E9' : '#F2F7F6',
                    color: s.ativo ? '#1E7C46' : '#6E807D',
                    fontSize: 10.5, fontWeight: 700, borderRadius: 8, padding: '2px 9px',
                  }}>
                    {s.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <span style={{ fontSize: 12.5, color: '#6E807D' }}>{s.duracao_min} min · {fmtPreco(s.preco)}</span>
              </div>
              <button
                onClick={() => abrirEditar(s)}
                style={{
                  border: '1.5px solid #DFE9E7', background: '#fff', color: '#227069',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 14px',
                  borderRadius: 10, cursor: 'pointer', flexShrink: 0,
                }}
              >
                Editar
              </button>
              <button
                onClick={() => toggleAtivo(s)}
                disabled={atualizandoId === s.id}
                style={{
                  border: 'none', background: s.ativo ? '#FBE3DF' : '#E7F2F0',
                  color: s.ativo ? '#B5473A' : '#227069',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 14px',
                  borderRadius: 10, cursor: atualizandoId === s.id ? 'wait' : 'pointer', flexShrink: 0,
                  opacity: atualizandoId === s.id ? 0.6 : 1,
                }}
              >
                {s.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div
          onClick={fecharModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(18,48,44,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={card({ padding: 26, maxWidth: 380, width: '100%' })}
          >
            <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 18, color: '#227069', margin: '0 0 18px' }}>
              {editando ? 'Editar serviço' : 'Novo serviço'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3A5754' }}>
                Nome
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Limpeza de pele"
                  style={{
                    display: 'block', width: '100%', marginTop: 6, border: '1.5px solid #DFE9E7',
                    borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, outline: 'none',
                  }}
                />
              </label>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3A5754' }}>
                Duração (minutos)
                <input
                  type="number"
                  min={1}
                  value={formDuracao}
                  onChange={(e) => setFormDuracao(e.target.value)}
                  placeholder="Ex: 60"
                  style={{
                    display: 'block', width: '100%', marginTop: 6, border: '1.5px solid #DFE9E7',
                    borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, outline: 'none',
                  }}
                />
              </label>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3A5754' }}>
                Preço (R$)
                <input
                  type="text"
                  inputMode="decimal"
                  value={formPreco}
                  onChange={(e) => setFormPreco(e.target.value)}
                  placeholder="Ex: 120,00"
                  style={{
                    display: 'block', width: '100%', marginTop: 6, border: '1.5px solid #DFE9E7',
                    borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, outline: 'none',
                  }}
                />
              </label>
            </div>

            {formErro && (
              <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 10, padding: '8px 12px', fontSize: 13, marginTop: 14 }}>
                {formErro}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                onClick={fecharModal}
                disabled={salvando}
                style={{
                  flex: 1, border: 'none', background: '#F2F7F6', color: '#6E807D',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '11px 0',
                  borderRadius: 10, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                style={{
                  flex: 1, border: 'none', background: '#227069', color: '#fff',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '11px 0',
                  borderRadius: 10, cursor: salvando ? 'wait' : 'pointer', opacity: salvando ? 0.7 : 1,
                }}
              >
                {salvando ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
