import { NextResponse } from "next/server"
import { createAdminClient } from "@/app/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("app_settings")
    .select("key, value")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const settings = (data || []).reduce((acc, row: { key: string; value: string }) => {
    acc[row.key] = row.value
    return acc
  }, {} as Record<string, string>)

  return NextResponse.json(settings)
}
