'use client'

import { useEffect, useRef, useState } from 'react'
import { Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

interface ProfissionalRow {
  id: string
  nome: string
  ativo: boolean
  avatar_url: string | null
}

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--card-bg)', borderRadius: 22,
  boxShadow: 'var(--shadow)', ...style,
})

export default function Professionals() {
  const { contaId, loading: perfilCarregando } = useProfile()

  const [profissionais, setProfissionais] = useState<ProfissionalRow[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizandoId, setAtualizandoId] = useState<string | null>(null)

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<ProfissionalRow | null>(null)
  const [formNome, setFormNome] = useState('')
  const [formAvatarUrl, setFormAvatarUrl] = useState<string | null>(null)
  const [enviandoAvatar, setEnviandoAvatar] = useState(false)
  const [formErro, setFormErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (perfilCarregando) return
    if (!contaId) { setCarregando(false); return }
    carregarProfissionais()
  }, [contaId, perfilCarregando])

  async function carregarProfissionais() {
    setCarregando(true)
    setErro(null)
    try {
      const { data, error } = await supabase
        .from('profissionais')
        .select('id, nome, ativo, avatar_url')
        .eq('conta_id', contaId)
        .order('ativo', { ascending: false })
        .order('nome', { ascending: true })
      if (error) throw error
      setProfissionais((data ?? []) as ProfissionalRow[])
    } catch (err) {
      console.error('Erro ao buscar profissionais:', err)
      setErro('Não foi possível carregar os profissionais. Tente recarregar.')
      setProfissionais([])
    } finally {
      setCarregando(false)
    }
  }

  function abrirNovo() {
    setEditando(null)
    setFormNome('')
    setFormAvatarUrl(null)
    setFormErro(null)
    setModalAberto(true)
  }

  function abrirEditar(p: ProfissionalRow) {
    setEditando(p)
    setFormNome(p.nome)
    setFormAvatarUrl(p.avatar_url)
    setFormErro(null)
    setModalAberto(true)
  }

  function fecharModal() {
    if (salvando) return
    setModalAberto(false)
  }

  async function handleAvatarSelecionado(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo || !contaId) return

    if (!arquivo.type.startsWith('image/')) {
      setFormErro('Selecione um arquivo de imagem.')
      return
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setFormErro('A imagem precisa ter até 5MB.')
      return
    }

    setFormErro(null)
    setEnviandoAvatar(true)
    try {
      const caminho = `${contaId}/profissionais/${editando?.id ?? crypto.randomUUID()}`
      const { error: erroUpload } = await supabase.storage
        .from('logos')
        .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type })
      if (erroUpload) throw erroUpload

      const { data: publicUrlData } = supabase.storage.from('logos').getPublicUrl(caminho)
      setFormAvatarUrl(`${publicUrlData.publicUrl}?v=${Date.now()}`)
    } catch (err) {
      console.error('Erro ao enviar avatar:', err)
      setFormErro('Não foi possível enviar a imagem. Tente de novo.')
    } finally {
      setEnviandoAvatar(false)
    }
  }

  async function salvar() {
    const nome = formNome.trim()
    if (!nome) { setFormErro('Informe o nome do profissional.'); return }

    setFormErro(null)
    setSalvando(true)
    try {
      if (editando) {
        const { error } = await supabase
          .from('profissionais')
          .update({ nome, avatar_url: formAvatarUrl })
          .eq('id', editando.id)
        if (error) throw error
        setProfissionais(prev => prev.map(p => (p.id === editando.id ? { ...p, nome, avatar_url: formAvatarUrl } : p)))
      } else {
        const { data, error } = await supabase
          .from('profissionais')
          .insert({ conta_id: contaId, nome, avatar_url: formAvatarUrl, ativo: true })
          .select('id, nome, ativo, avatar_url')
          .single()
        if (error) throw error
        setProfissionais(prev => [...prev, data as ProfissionalRow].sort((a, b) => a.nome.localeCompare(b.nome)))
      }
      setModalAberto(false)
    } catch (err) {
      console.error('Erro ao salvar profissional:', err)
      setFormErro('Não foi possível salvar o profissional. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function toggleAtivo(p: ProfissionalRow) {
    const novoAtivo = !p.ativo
    setAtualizandoId(p.id)
    setErro(null)
    setProfissionais(prev => prev.map(x => (x.id === p.id ? { ...x, ativo: novoAtivo } : x)))
    try {
      const { error } = await supabase.from('profissionais').update({ ativo: novoAtivo }).eq('id', p.id)
      if (error) throw error
    } catch (err) {
      console.error('Erro ao atualizar profissional:', err)
      setErro('Não foi possível atualizar o profissional. Tente de novo.')
      setProfissionais(prev => prev.map(x => (x.id === p.id ? { ...x, ativo: !novoAtivo } : x)))
    } finally {
      setAtualizandoId(null)
    }
  }

  const carregandoTela = perfilCarregando || carregando

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>
            <Users size={26} />
            Profissionais
          </h2>
          <p style={{ color: 'var(--sub)', fontSize: 13 }}>Equipe disponível para atendimentos e agendamentos.</p>
        </div>
        <button
          onClick={abrirNovo}
          disabled={!contaId}
          style={{
            border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#fff',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '11px 18px',
            borderRadius: 12, boxShadow: '0 6px 16px rgba(34,112,105,.3)',
            opacity: !contaId ? 0.6 : 1,
          }}
        >
          + Novo profissional
        </button>
      </div>

      {erro && (
        <p style={{ background: '#FDECEF', color: '#8C2340', borderRadius: 12, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
          {erro}
        </p>
      )}

      {carregandoTela ? (
        <p style={{ color: 'var(--sub)', fontSize: 13 }}>Carregando profissionais…</p>
      ) : profissionais.length === 0 ? (
        <div style={{ ...card(), padding: '40px 24px', textAlign: 'center' }}>
          <p style={{ color: 'var(--sub)', fontSize: 14, margin: 0 }}>Nenhum profissional cadastrado ainda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {profissionais.map(p => (
            <div key={p.id} style={{ ...card(), padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, opacity: p.ativo ? 1 : 0.6 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', background: 'var(--mist)', color: '#227069',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16,
                overflow: 'hidden', flexShrink: 0,
              }}>
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.avatar_url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  p.nome.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <b style={{ fontSize: 14.5 }}>{p.nome}</b>
                  <span style={{
                    background: p.ativo ? '#DFF7E9' : 'var(--mist)',
                    color: p.ativo ? '#1E7C46' : 'var(--sub)',
                    fontSize: 10.5, fontWeight: 700, borderRadius: 8, padding: '2px 9px',
                  }}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => abrirEditar(p)}
                style={{
                  border: '1.5px solid var(--line)', background: 'var(--card-bg)', color: '#227069',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 14px',
                  borderRadius: 10, cursor: 'pointer', flexShrink: 0,
                }}
              >
                Editar
              </button>
              <button
                onClick={() => toggleAtivo(p)}
                disabled={atualizandoId === p.id}
                style={{
                  border: 'none', background: p.ativo ? '#FBE3DF' : '#E7F2F0',
                  color: p.ativo ? '#B5473A' : '#227069',
                  fontFamily: 'inherit', fontSize: 12.5, fontWeight: 600, padding: '8px 14px',
                  borderRadius: 10, cursor: atualizandoId === p.id ? 'wait' : 'pointer', flexShrink: 0,
                  opacity: atualizandoId === p.id ? 0.6 : 1,
                }}
              >
                {p.ativo ? 'Desativar' : 'Reativar'}
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
              {editando ? 'Editar profissional' : 'Novo profissional'}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'var(--mist)',
                border: '1px solid var(--line)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
              }}>
                {formAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formAvatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--sub)', textAlign: 'center', padding: 4 }}>Sem foto</span>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={enviandoAvatar || !contaId}
                  style={{
                    background: '#227069', color: '#fff', border: 'none', borderRadius: 10,
                    padding: '9px 14px', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                    opacity: enviandoAvatar || !contaId ? 0.6 : 1,
                  }}
                >
                  {enviandoAvatar ? 'Enviando...' : 'Trocar foto'}
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelecionado}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>
                Nome
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Ex: Dra. Ana Souza"
                  style={{
                    display: 'block', width: '100%', marginTop: 6, border: '1.5px solid var(--line)',
                    borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13.5, outline: 'none',
                    background: 'var(--card-bg)', color: 'var(--ink)',
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
                  flex: 1, border: 'none', background: 'var(--mist)', color: 'var(--sub)',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '11px 0',
                  borderRadius: 10, cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando || enviandoAvatar}
                style={{
                  flex: 1, border: 'none', background: 'var(--accent)', color: '#fff',
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
