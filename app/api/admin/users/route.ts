/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/app/lib/supabase/authz"
import { createAdminClient } from "@/app/lib/supabase/admin"

interface CreateUserBody {
  email?: string
  password?: string
  name?: string
  role?: string
  pin_code?: string | null
}

export async function GET() {
  const auth = await requireAdminSession()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let supabaseAdmin
  try {
    supabaseAdmin = createAdminClient()
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error listando usuarios:", error)
    return NextResponse.json({ error: "Error al listar cuentas" }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}

export async function POST(request: Request) {
  const auth = await requireAdminSession()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: CreateUserBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const email = String(body.email || "").trim().toLowerCase()
  const password = String(body.password || "")
  const name = String(body.name || "").trim()
  const role = body.role
  const pinCode = body.pin_code ? String(body.pin_code).trim() : null

  if (!email || !password || !name) {
    return NextResponse.json(
      { error: "Correo, contraseña y nombre son requeridos" },
      { status: 400 },
    )
  }
  if (role !== "admin" && role !== "waiter") {
    return NextResponse.json(
      { error: "El rol debe ser 'admin' o 'waiter'" },
      { status: 400 },
    )
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 },
    )
  }
  if (pinCode && !/^[0-9]{4}$/.test(pinCode)) {
    return NextResponse.json({ error: "El PIN debe tener 4 dígitos" }, { status: 400 })
  }

  let supabaseAdmin
  try {
    supabaseAdmin = createAdminClient()
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
  }

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  })

  if (createError || !created.user) {
    const status = createError?.status === 422 ? 409 : 500
    const message =
      status === 409 ? "Ya existe una cuenta con ese correo" : "No se pudo crear la cuenta"
    console.error("Error creando usuario en auth:", createError)
    return NextResponse.json({ error: message }, { status })
  }

  const { data: profile, error: insertError } = (await (supabaseAdmin as any)
    .from("users")
    .insert({
      id: created.user.id,
      email,
      name,
      role,
      pin_code: pinCode,
      is_active: true,
    })
    .select()
    .single()) as { data: unknown; error: { code?: string; message: string } | null }

  if (insertError) {
    // Rollback manual: no dejar un usuario huerfano en auth.users.
    await supabaseAdmin.auth.admin.deleteUser(created.user.id)

    const status = insertError.code === "23505" ? 409 : 500
    const message =
      insertError.code === "23505"
        ? "Ese PIN ya está en uso por otro mesero activo"
        : "No se pudo guardar el perfil de la cuenta"
    console.error("Error insertando perfil de usuario:", insertError)
    return NextResponse.json({ error: message }, { status })
  }

  return NextResponse.json({ user: profile }, { status: 201 })
}
