import { supabase } from './client'
import { UserRole } from './types'

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
  pin_code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Lecturas directas a public.users protegidas por RLS: un admin/super_admin
 * ve todas las filas, cualquier otro usuario autenticado solo ve la suya.
 * Crear/editar/eliminar cuentas requiere tocar auth.users (service role),
 * asi que esas operaciones viven en app/api/admin/users/** en vez de aca.
 */
export const usersService = {
  async getAllUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as AppUser[]
  },

  async getCurrentUser(): Promise<AppUser | null> {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return null

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (error) throw error
    return data ? (data as unknown as AppUser) : null
  },
}
