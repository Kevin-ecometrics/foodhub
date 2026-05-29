import { createHmac } from "crypto"

function getSecret(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "change-me-in-production"
}

export function createToken(username: string): string {
  const payload = JSON.stringify({ username, iat: Date.now() })
  const encoded = Buffer.from(payload).toString("base64url")
  const sig = createHmac("sha256", getSecret()).update(encoded).digest("hex")
  return `${encoded}.${sig}`
}

export function verifyToken(token: string): { username: string; iat: number } | null {
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [encoded, sig] = parts
  const expectedSig = createHmac("sha256", getSecret()).update(encoded).digest("hex")
  if (sig !== expectedSig) return null
  try {
    const raw = Buffer.from(encoded, "base64url").toString()
    return JSON.parse(raw)
  } catch {
    return null
  }
}
