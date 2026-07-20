import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Cliente Supabase para usar en Route Handlers y Server Components.
 * Lee/escribe la sesion desde las cookies de la request (respeta RLS).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // setAll puede fallar si se llama desde un Server Component puro
          // (sin acceso de escritura a cookies). Las rutas y el middleware
          // sí pueden escribir, que es donde de verdad necesitamos setear sesion.
        }
      },
    },
  })
}
