import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ProfileState {
  userName: string | null
  accountName: string | null
  contaId: string | null
  logoUrl: string | null
  categoriasKanban: string[] | null
  loading: boolean
  error: boolean
}

export function useProfile(): ProfileState {
  const [state, setState] = useState<ProfileState>({
    userName: null,
    accountName: null,
    contaId: null,
    logoUrl: null,
    categoriasKanban: null,
    loading: true,
    error: false,
  })

  useEffect(() => {
    async function load() {
      try {
        const [{ data: perfil, error: perfilError }, { data: conta, error: contaError }] = await Promise.all([
          supabase.from('perfis').select('nome').single(),
          supabase.from('contas').select('id, nome, logo_url, categorias_kanban').single(),
        ])

        if (perfilError) console.error('Erro ao buscar perfil:', perfilError.message)
        if (contaError) console.error('Erro ao buscar conta:', contaError.message)

        setState({
          userName: perfil?.nome ?? null,
          accountName: conta?.nome ?? null,
          contaId: conta?.id ?? null,
          logoUrl: conta?.logo_url ?? null,
          categoriasKanban: conta?.categorias_kanban ?? null,
          loading: false,
          error: Boolean(perfilError || contaError),
        })
      } catch (err) {
        console.error('Erro inesperado ao buscar perfil/conta:', err)
        setState({ userName: null, accountName: null, contaId: null, logoUrl: null, categoriasKanban: null, loading: false, error: true })
      }
    }
    load()
  }, [])

  return state
}
