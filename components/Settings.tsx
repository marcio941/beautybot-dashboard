'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/hooks/useProfile'

interface Props {
  onLogoChange?: (url: string | null) => void
}

export default function Settings({ onLogoChange }: Props) {
  const { contaId, logoUrl, loading: perfilCarregando } = useProfile()
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

  return (
    <div>
      <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 30, color: '#227069', marginBottom: 8 }}>⚙ Configurações</h2>
      <p style={{ color: '#6E807D', fontSize: 13, marginBottom: 24 }}>Conexão Evolution API, N8N e variáveis do sistema.</p>

      <section style={{
        background: '#fff', border: '1px solid #E3ECE9', borderRadius: 14,
        padding: 20, maxWidth: 420,
      }}>
        <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 18, color: '#227069', margin: '0 0 4px' }}>Logo da conta</h3>
        <p style={{ color: '#6E807D', fontSize: 13, margin: '0 0 16px' }}>
          Aparece no menu lateral e na página pública de agendamento.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 14, background: '#F4F9F7',
            border: '1px solid #E3ECE9', display: 'flex', alignItems: 'center',
            justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
          }}>
            {perfilCarregando ? (
              <span style={{ fontSize: 12, color: '#6E807D' }}>...</span>
            ) : logoAtual ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoAtual} alt="Logo atual" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 12, color: '#6E807D', textAlign: 'center', padding: 4 }}>Sem logo</span>
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
    </div>
  )
}
