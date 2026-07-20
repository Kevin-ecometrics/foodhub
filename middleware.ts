import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

/**
 * Protege /waiter (excepto /waiter/login) y /api/admin/** exigiendo una
 * sesion Supabase valida. /admin se gatea client-side (ver app/admin/page.tsx)
 * porque esa ruta ya renderiza el LoginForm inline cuando no hay sesion.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isWaiterLogin = pathname === "/waiter/login"
  const isProtectedWaiterRoute = pathname.startsWith("/waiter") && !isWaiterLogin
  const isProtectedAdminApi = pathname.startsWith("/api/admin")

  if (!user && isProtectedWaiterRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/waiter/login"
    return NextResponse.redirect(redirectUrl)
  }

  if (!user && isProtectedAdminApi) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  return response
}

export const config = {
  matcher: ["/waiter/:path*", "/api/admin/:path*"],
}
