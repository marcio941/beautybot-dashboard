import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ProfileState {
  userName: string | null
  userAvatarUrl: string | null
  accountName: string | null
  contaId: string | null
  logoUrl: string | null
  categoriasKanban: string[] | null
  corDestaque: string | null
  loading: boolean
  error: boolean
}

export function useProfile(): ProfileState {
  const [state, setState] = useState<ProfileState>({
    userName: null,
    userAvatarUrl: null,
    accountName: null,
    contaId: null,
    logoUrl: null,
    categoriasKanban: null,
    corDestaque: null,
    loading: true,
    error: false,
  })

  useEffect(() => {
    async function load() {
      try {
        const [{ data: perfil, error: perfilError }, { data: conta, error: contaError }, { data: userData, error: userError }] = await Promise.all([
          supabase.from('perfis').select('nome').single(),
          supabase.from('contas').select('id, nome, logo_url, categorias_kanban, cor_destaque').single(),
          supabase.auth.getUser(),
        ])

        if (perfilError) console.error('Erro ao buscar perfil:', perfilError.message)
        if (contaError) console.error('Erro ao buscar conta:', contaError.message)
        if (userError) console.error('Erro ao buscar usuário autenticado:', userError.message)

        const metadata = userData?.user?.user_metadata ?? {}

        setState({
          userName: perfil?.nome ?? null,
          userAvatarUrl: metadata.avatar_url ?? metadata.picture ?? null,
          accountName: conta?.nome ?? null,
          contaId: conta?.id ?? null,
          logoUrl: conta?.logo_url ?? null,
          categoriasKanban: conta?.categorias_kanban ?? null,
          corDestaque: conta?.cor_destaque ?? null,
          loading: false,
          error: Boolean(perfilError || contaError),
        })
      } catch (err) {
        console.error('Erro inesperado ao buscar perfil/conta:', err)
        setState({ userName: null, userAvatarUrl: null, accountName: null, contaId: null, logoUrl: null, categoriasKanban: null, corDestaque: null, loading: false, error: true })
      }
    }
    load()
  }, [])

  return state
}
