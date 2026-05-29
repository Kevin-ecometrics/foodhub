import { NextResponse } from "next/server"
import { verifyToken } from "../token"

export async function GET(request: Request) {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  const token = auth.slice(7)
  const payload = verifyToken(token)

  if (!payload) {
    return NextResponse.json({ valid: false }, { status: 401 })
  }

  return NextResponse.json({ valid: true, username: payload.username })
}
