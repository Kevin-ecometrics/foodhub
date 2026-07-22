/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import { tipsService } from './tips'

export interface CashReport {
  id: string
  report_number: number
  opened_at: string
  closed_at: string | null
  opening_cash: number
  counted_cash: number | null
  notes: string | null
  cash_sales: number
  terminal_sales: number
  usd_sales: number
  mixed_sales: number
  total_sales: number
  cash_tips: number
  terminal_tips: number
  usd_tips: number
  mixed_tips: number
  total_tips: number
  paid_accounts_count: number
  average_ticket: number
  subtotal: number
  tax_amount: number
  expected_cash: number
  cash_difference: number
  opened_by: string | null
  closed_by: string | null
  created_at: string
}

export interface CashReportPreview {
  cash_sales: number
  terminal_sales: number
  usd_sales: number
  mixed_sales: number
  total_sales: number
  cash_tips: number
  terminal_tips: number
  usd_tips: number
  mixed_tips: number
  total_tips: number
  paid_accounts_count: number
  average_ticket: number
  subtotal: number
  tax_amount: number
}

// Tasa de impuesto usada para este reporte: 16%, igual que TableCard.tsx (vista
// de mesas del mesero). El resto de la app (ticket cliente, historial,
// Dashboard admin) usa 8% — inconsistencia preexistente, fuera de alcance aqui.
const TAX_RATE = 0.16

const aggregate = async (startISO: string, endISO: string): Promise<CashReportPreview> => {
  const { data: sales, error: salesError } = await (supabase as any)
    .from('sales_history')
    .select('total_amount, payment_method')
    .gte('closed_at', startISO)
    .lte('closed_at', endISO) as {
      data: { total_amount: number; payment_method: string | null }[] | null
      error: Error | null
    }
  if (salesError) throw salesError
  const salesRows = sales || []

  const salesByMethod = (method: string) =>
    salesRows.filter((s) => s.payment_method === method).reduce((sum, s) => sum + s.total_amount, 0)

  const cash_sales = salesByMethod('cash')
  const terminal_sales = salesByMethod('terminal')
  const usd_sales = salesByMethod('usd')
  const mixed_sales = salesByMethod('mixed')
  const total_sales = salesRows.reduce((sum, s) => sum + s.total_amount, 0)

  const tips = await tipsService.getTipsByDateRange(startISO, endISO)
  const tipsByMethod = (method: string) =>
    tips.filter((t) => t.payment_method === method).reduce((sum, t) => sum + t.amount, 0)

  const cash_tips = tipsByMethod('cash')
  const terminal_tips = tipsByMethod('terminal')
  const usd_tips = tipsByMethod('usd')
  const mixed_tips = tipsByMethod('mixed')
  const total_tips = tips.reduce((sum, t) => sum + t.amount, 0)

  const paid_accounts_count = salesRows.length
  const average_ticket = paid_accounts_count > 0 ? total_sales / paid_accounts_count : 0

  const subtotal = total_sales / (1 + TAX_RATE)
  const tax_amount = total_sales - subtotal

  return {
    cash_sales, terminal_sales, usd_sales, mixed_sales, total_sales,
    cash_tips, terminal_tips, usd_tips, mixed_tips, total_tips,
    paid_accounts_count, average_ticket, subtotal, tax_amount,
  }
}

export const cashRegisterService = {
  /** Reportes cerrados, mas recientes primero. */
  async getAllReports(): Promise<CashReport[]> {
    const { data, error } = await (supabase as any)
      .from('cash_reports')
      .select('*')
      .not('closed_at', 'is', null)
      .order('closed_at', { ascending: false }) as { data: CashReport[] | null; error: Error | null }

    if (error) throw error
    return data || []
  },

  /** La caja abierta ahora mismo, si existe (closed_at is null). */
  async getOpenReport(): Promise<CashReport | null> {
    const { data, error } = await (supabase as any)
      .from('cash_reports')
      .select('*')
      .is('closed_at', null)
      .maybeSingle() as { data: CashReport | null; error: Error | null }

    if (error) throw error
    return data
  },

  /** Abre una caja nueva con el efectivo inicial capturado por el cajero. */
  async openRegister(openingCash: number, openedBy: string | null): Promise<CashReport> {
    const existing = await this.getOpenReport()
    if (existing) throw new Error('Ya hay una caja abierta')

    const { data, error } = await (supabase as any)
      .from('cash_reports')
      .insert({ opening_cash: openingCash, opened_by: openedBy })
      .select()
      .single() as { data: CashReport | null; error: Error | null }

    if (error) throw error
    return data as CashReport
  },

  /** Agrega sales_history + tips desde que se abrio la caja hasta ahora, sin guardar nada. */
  async previewClose(report: CashReport): Promise<CashReportPreview> {
    return aggregate(report.opened_at, new Date().toISOString())
  },

  /** Cierra la caja: calcula el snapshot del periodo y guarda el efectivo contado. */
  async closeRegister(
    report: CashReport,
    countedCash: number,
    notes: string | null,
    closedBy: string | null,
  ): Promise<CashReport> {
    const preview = await this.previewClose(report)
    const expected_cash = report.opening_cash + preview.cash_sales - preview.cash_tips
    const cash_difference = countedCash - expected_cash

    const { data, error } = await (supabase as any)
      .from('cash_reports')
      .update({
        closed_at: new Date().toISOString(),
        counted_cash: countedCash,
        notes,
        ...preview,
        expected_cash,
        cash_difference,
        closed_by: closedBy,
      })
      .eq('id', report.id)
      .select()
      .single() as { data: CashReport | null; error: Error | null }

    if (error) throw error
    return data as CashReport
  },

  async deleteReport(id: string): Promise<void> {
    const { error } = await supabase.from('cash_reports').delete().eq('id', id)
    if (error) throw error
  },
}
