/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { createClient } from "@/app/lib/supabase/server"
import { createAdminClient } from "@/app/lib/supabase/admin"

const SUPER_ADMIN_EMAIL = "superadmin@internal.local"

export async function POST(request: Request) {
  let username: string
  let password: string
  try {
    const body = await request.json()
    username = String(body.username || "")
    password = String(body.password || "")
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  if (!username || !password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son requeridos" },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD

  // Ruta del super admin: credenciales de env vars, sincronizadas como
  // usuario real en auth.users para que todo el resto del sistema (RLS,
  // middleware, app_metadata.role) funcione igual que con cualquier otra cuenta.
  if (adminUser && adminPass && username === adminUser && password === adminPass) {
    try {
      await syncSuperAdmin(password)
    } catch (err) {
      console.error("Error sincronizando super admin:", err)
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 },
      )
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: SUPER_ADMIN_EMAIL,
      password,
    })
    if (error) {
      console.error("Error iniciando sesión como super admin:", error)
      return NextResponse.json(
        { error: "No se pudo iniciar sesión" },
        { status: 500 },
      )
    }
    return NextResponse.json({ ok: true })
  }

  // Cuentas admin creadas desde el panel: login normal contra Supabase Auth.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username.toLowerCase().trim(),
    password,
  })

  if (error || !data.user) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
  }

  const role = data.user.app_metadata?.role
  if (role !== "admin" && role !== "super_admin") {
    await supabase.auth.signOut()
    return NextResponse.json(
      { error: "Esta cuenta no tiene permisos de administrador" },
      { status: 403 },
    )
  }

  return NextResponse.json({ ok: true })
}

async function syncSuperAdmin(password: string) {
  const supabaseAdmin = createAdminClient()

  const { data: existing, error: selectError } = (await supabaseAdmin
    .from("users")
    .select("id")
    .eq("role", "super_admin")
    .maybeSingle()) as { data: { id: string } | null; error: { message: string } | null }

  if (selectError) throw selectError

  if (existing) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { role: "super_admin" },
    })
    if (error) throw error
    return
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: SUPER_ADMIN_EMAIL,
    password,
    email_confirm: true,
    app_metadata: { role: "super_admin" },
  })
  if (createError) throw createError

  const { error: insertError } = await (supabaseAdmin as any).from("users").insert({
    id: created.user.id,
    email: SUPER_ADMIN_EMAIL,
    name: "Super Admin",
    role: "super_admin",
    is_active: true,
  })
  if (insertError) throw insertError
}
