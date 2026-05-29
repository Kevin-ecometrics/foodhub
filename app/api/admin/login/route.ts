import { NextResponse } from "next/server"
import { createToken } from "../token"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const adminUser = process.env.ADMIN_USERNAME
    const adminPass = process.env.ADMIN_PASSWORD

    if (!adminUser || !adminPass) {
      return NextResponse.json(
        { error: "Servidor mal configurado: credenciales de administrador no definidas" },
        { status: 500 },
      )
    }

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json(
        { error: "Credenciales incorrectas" },
        { status: 401 },
      )
    }

    const token = createToken(username)

    return NextResponse.json({ token })
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida" },
      { status: 400 },
    )
  }
}
