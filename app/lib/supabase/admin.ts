import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

/**
 * Cliente con la service_role key: bypassa RLS y habilita las operaciones
 * de Auth Admin API (crear/actualizar/borrar usuarios, generar magic links).
 *
 * SOLO debe importarse desde route handlers bajo app/api/admin/** y
 * app/api/auth/**. Nunca debe llegar a codigo que corra en el browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no esta configurada. Agregala en .env ' +
        '(Supabase Dashboard > Settings > API > service_role, NUNCA con prefijo NEXT_PUBLIC_).',
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
