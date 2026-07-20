import { createClient } from './server'
import type { User } from '@supabase/supabase-js'

type AuthzResult = { user: User } | { error: string; status: 401 | 403 }

/**
 * Verifica que la request tenga una sesion Supabase valida con rol
 * admin/super_admin. El rol se lee de app_metadata (JWT), no de la tabla
 * users, para evitar un round-trip extra a la base de datos.
 */
export async function requireAdminSession(): Promise<AuthzResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return { error: 'No autenticado', status: 401 }
  }

  const role = data.user.app_metadata?.role
  if (role !== 'admin' && role !== 'super_admin') {
    return { error: 'No autorizado', status: 403 }
  }

  return { user: data.user }
}
