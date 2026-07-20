/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server"
import { requireAdminSession } from "@/app/lib/supabase/authz"
import { createAdminClient } from "@/app/lib/supabase/admin"

interface UpdateUserBody {
  name?: string
  role?: string
  pin_code?: string | null
  is_active?: boolean
  password?: string
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  let body: UpdateUserBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  if (body.role === "super_admin") {
    return NextResponse.json(
      { error: "No se puede asignar el rol super_admin desde el panel" },
      { status: 400 },
    )
  }
  if (body.pin_code && !/^[0-9]{4}$/.test(body.pin_code)) {
    return NextResponse.json({ error: "El PIN debe tener 4 dígitos" }, { status: 400 })
  }

  let supabaseAdmin
  try {
    supabaseAdmin = createAdminClient()
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
  }

  const { data: target, error: targetError } = (await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("id", id)
    .maybeSingle()) as { data: { id: string; role: string } | null; error: { message: string } | null }

  if (targetError || !target) {
    return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 })
  }
  if (target.role === "super_admin") {
    return NextResponse.json(
      { error: "La cuenta de super admin no se puede editar desde aquí" },
      { status: 400 },
    )
  }
  const isSelf = id === auth.user.id
  const isDemotingOrDeactivatingSelf =
    isSelf && (body.role === "waiter" || body.is_active === false)
  if (isDemotingOrDeactivatingSelf) {
    return NextResponse.json(
      { error: "No puedes quitarte tu propio acceso de administrador" },
      { status: 400 },
    )
  }

  const profileUpdates: Record<string, unknown> = {}
  if (body.name !== undefined) profileUpdates.name = String(body.name).trim()
  if (body.role !== undefined) profileUpdates.role = body.role
  if (body.pin_code !== undefined) profileUpdates.pin_code = body.pin_code || null
  if (body.is_active !== undefined) profileUpdates.is_active = body.is_active

  if (Object.keys(profileUpdates).length > 0) {
    const { error: updateError } = await (supabaseAdmin as any)
      .from("users")
      .update(profileUpdates)
      .eq("id", id) as { error: { code?: string; message: string } | null }

    if (updateError) {
      const status = updateError.code === "23505" ? 409 : 500
      const message =
        updateError.code === "23505"
          ? "Ese PIN ya está en uso por otro mesero activo"
          : "No se pudo actualizar la cuenta"
      console.error("Error actualizando usuario:", updateError)
      return NextResponse.json({ error: message }, { status })
    }
  }

  if (body.role !== undefined || body.password || body.is_active !== undefined) {
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ...(body.password ? { password: body.password } : {}),
      ...(body.role !== undefined ? { app_metadata: { role: body.role } } : {}),
      ...(body.is_active === false ? { ban_duration: "876000h" } : {}),
      ...(body.is_active === true ? { ban_duration: "none" } : {}),
    })
    if (authUpdateError) {
      console.error("Error actualizando cuenta de auth:", authUpdateError)
      return NextResponse.json({ error: "No se pudo actualizar la cuenta" }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdminSession()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  if (id === auth.user.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
  }

  let supabaseAdmin
  try {
    supabaseAdmin = createAdminClient()
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 })
  }

  const { data: target } = (await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", id)
    .maybeSingle()) as { data: { role: string } | null }

  if (target?.role === "super_admin") {
    return NextResponse.json(
      { error: "La cuenta de super admin no se puede eliminar" },
      { status: 400 },
    )
  }

  // public.users cae en cascada por la FK a auth.users
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) {
    console.error("Error eliminando usuario:", error)
    return NextResponse.json({ error: "No se pudo eliminar la cuenta" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
