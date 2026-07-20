/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

export const settingsService = {
  /**
   * Lectura de un solo flag. Usada por el customer (sin login) para decidir
   * si mostrar features opt-in. Si la fila no existe todavia, devuelve false.
   */
  async getSetting(key: string): Promise<string> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle() as { data: { value: string } | null; error: { message: string } | null }

    if (error) throw error
    return data?.value ?? 'false'
  },

  async getAllSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')

    if (error) throw error
    return (data || []).reduce((acc, row: any) => {
      acc[row.key] = row.value
      return acc
    }, {} as Record<string, string>)
  },

  async updateSetting(key: string, value: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('app_settings')
      .upsert({ key, value })

    if (error) throw error
  },
}
