import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      console.error('Erro ao trocar code por sessão:', {
        message: error.message,
        name: error.name,
        status: error.status,
        code,
      })
      return NextResponse.redirect(`${origin}/login?error=auth&reason=exchange_failed`)
    } catch (err) {
      console.error('Exceção ao trocar code por sessão:', err, { code })
      return NextResponse.redirect(`${origin}/login?error=auth&reason=exception`)
    }
  }

  console.error('Callback de auth chamado sem code na query string')
  return NextResponse.redirect(`${origin}/login?error=auth&reason=no_code`)
}
