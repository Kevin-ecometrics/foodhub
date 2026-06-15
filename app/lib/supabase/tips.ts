/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

export interface Tip {
  id: string
  order_id: string | null
  table_id: number
  customer_name: string
  amount: number
  payment_method: string | null
  created_at: string
}

export const tipsService = {
  async insertTip(tip: {
    order_id?: string | null
    table_id: number
    customer_name: string
    amount: number
    payment_method?: string | null
  }): Promise<void> {
    const { error } = await (supabase as any).from('tips').insert({
      order_id: tip.order_id ?? null,
      table_id: tip.table_id,
      customer_name: tip.customer_name,
      amount: tip.amount,
      payment_method: tip.payment_method ?? null,
    }) as { error: Error | null }
    if (error) throw error
  },

  async getTipsForTable(tableId: number): Promise<Tip[]> {
    const { data, error } = await (supabase as any)
      .from('tips')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false }) as { data: Tip[] | null; error: Error | null }
    if (error) throw error
    return (data as Tip[]) || []
  },

  async getTipsTotal(tableId: number): Promise<number> {
    const { data, error } = await (supabase as any)
      .from('tips')
      .select('amount')
      .eq('table_id', tableId) as { data: { amount: number }[] | null; error: Error | null }
    if (error) throw error
    return (data || []).reduce((sum: number, t: { amount: number }) => sum + t.amount, 0)
  },

  async getTipsByDateRange(startISO: string, endISO: string): Promise<Tip[]> {
    const { data, error } = await (supabase as any)
      .from('tips')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false }) as { data: Tip[] | null; error: Error | null }
    if (error) throw error
    return (data as Tip[]) || []
  },
}
