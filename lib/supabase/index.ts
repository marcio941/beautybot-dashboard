import { createClient } from './client'

/**
 * Mantido para compatibilidade com o import existente em Dashboard.tsx:
 *   import { supabase } from '@/lib/supabase'
 * Agora usa @supabase/ssr por baixo, então a sessão fica sincronizada
 * via cookies com o middleware e o /auth/callback.
 */
export const supabase = createClient()
