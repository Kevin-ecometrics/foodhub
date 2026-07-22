/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

// Desglose en MXN de un pago que involucra efectivo ('cash' puro o 'mixed').
// - cash/terminal/usd: neto por metodo, usado para repartir cobros 'mixed'
//   entre cash_sales/terminal_sales/usd_sales (se asume que el cambio sale de
//   la parte en efectivo).
// - cashTendered/change: el efectivo BRUTO entregado por el cliente y el
//   cambio devuelto, usados por cash_reports para calcular depositos/retiros
//   de efectivo automaticamente (sin importar si el pago fue 100% efectivo o
//   mixto).
export interface PaymentBreakdown {
  cash: number
  terminal: number
  usd: number
  cashTendered: number
  change: number
}

export interface Tip {
  id: string
  order_id: string | null
  table_id: number
  customer_name: string
  amount: number
  payment_method: string | null
  payment_breakdown: PaymentBreakdown | null
  waiter_id: string | null
  created_at: string
}

export const tipsService = {
  async insertTip(tip: {
    order_id?: string | null
    table_id: number
    customer_name: string
    amount: number
    payment_method?: string | null
    paymentBreakdown?: PaymentBreakdown | null
    waiter_id?: string | null
  }): Promise<void> {
    const { error } = await (supabase as any).from('tips').insert({
      order_id: tip.order_id ?? null,
      table_id: tip.table_id,
      customer_name: tip.customer_name,
      amount: tip.amount,
      payment_method: tip.payment_method ?? null,
      payment_breakdown: tip.paymentBreakdown ?? null,
      waiter_id: tip.waiter_id ?? null,
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

  async getTipsByWaiterAndSession(waiterId: string, startedAt: string): Promise<Tip[]> {
    const { data, error } = await (supabase as any)
      .from('tips')
      .select('*')
      .eq('waiter_id', waiterId)
      .gte('created_at', startedAt)
      .order('created_at', { ascending: false }) as { data: Tip[] | null; error: Error | null }
    if (error) throw error
    return (data as Tip[]) || []
  },
}
