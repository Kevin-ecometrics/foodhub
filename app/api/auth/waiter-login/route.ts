import { NextResponse } from "next/server"
import { createClient } from "@/app/lib/supabase/server"
import { createAdminClient } from "@/app/lib/supabase/admin"

export async function POST(request: Request) {
  let body: { mode?: string; email?: string; password?: string; pin?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const supabase = await createClient()

  if (body.mode === "pin") {
    return loginWithPin(supabase, String(body.pin || ""))
  }

  if (body.mode === "password") {
    return loginWithPassword(supabase, String(body.email || ""), String(body.password || ""))
  }

  return NextResponse.json({ error: "Modo de login inválido" }, { status: 400 })
}

async function loginWithPin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pinRaw: string,
) {
  const pin = pinRaw.trim()
  if (!/^[0-9]{4}$/.test(pin)) {
    return NextResponse.json({ error: "El PIN debe tener 4 dígitos" }, { status: 400 })
  }

  let supabaseAdmin
  try {
    supabaseAdmin = createAdminClient()
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Error de configuración del servidor" },
      { status: 500 },
    )
  }

  const { data: user, error: lookupError } = (await supabaseAdmin
    .from("users")
    .select("email")
    .eq("pin_code", pin)
    .eq("role", "waiter")
    .eq("is_active", true)
    .maybeSingle()) as { data: { email: string } | null; error: { message: string } | null }

  if (lookupError) {
    console.error("Error buscando PIN:", lookupError)
    return NextResponse.json({ error: "Error al validar el PIN" }, { status: 500 })
  }
  if (!user) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 })
  }

  const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email: user.email,
  })
  const tokenHash = link?.properties?.hashed_token
  if (linkError || !tokenHash) {
    console.error("Error generando link de acceso:", linkError)
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 })
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  })
  if (verifyError) {
    console.error("Error verificando token:", verifyError)
    return NextResponse.json({ error: "No se pudo iniciar sesión" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

async function loginWithPassword(
  supabase: Awaited<ReturnType<typeof createClient>>,
  emailRaw: string,
  password: string,
) {
  const email = emailRaw.trim().toLowerCase()
  if (!email || !password) {
    return NextResponse.json(
      { error: "Correo y contraseña son requeridos" },
      { status: 400 },
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
  }

  const role = data.user.app_metadata?.role
  if (role !== "waiter" && role !== "admin" && role !== "super_admin") {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: "Esta cuenta no tiene acceso al panel de meseros" },
      { status: 403 },
    )
  }

  return NextResponse.json({ ok: true })
}
