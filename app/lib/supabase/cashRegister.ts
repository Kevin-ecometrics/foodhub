/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import { tipsService, PaymentBreakdown } from './tips'
import { settingsService } from './settings'
import { tipLedgerService } from './tipLedger'

export interface CashReport {
  id: string
  report_number: number
  opened_at: string
  closed_at: string | null
  opening_cash: number
  cash_deposits: number
  cash_withdrawals: number
  counted_cash: number | null
  notes: string | null
  cash_sales: number
  terminal_sales: number
  usd_sales: number
  total_sales: number
  cash_tips: number
  terminal_tips: number
  usd_tips: number
  total_tips: number
  paid_accounts_count: number
  average_ticket: number
  subtotal: number
  tax_amount: number
  tax_rate: number
  tips_paid: number
  expected_cash: number
  cash_difference: number
  opened_by: string | null
  closed_by: string | null
  created_at: string
}

export interface CashReportPreview {
  cash_deposits: number
  cash_withdrawals: number
  cash_sales: number
  terminal_sales: number
  usd_sales: number
  total_sales: number
  cash_tips: number
  terminal_tips: number
  usd_tips: number
  total_tips: number
  paid_accounts_count: number
  average_ticket: number
  subtotal: number
  tax_amount: number
  tax_rate: number
  tips_paid: number
}

// Tasa de IVA (%) configurada por el admin en Configuracion (app_settings.iva_rate,
// editada en SettingsManagement.tsx -> modal "IVA y tipo de cambio"). Si el
// setting no existe o no es un numero valido, cae a 16 por defecto.
const DEFAULT_TAX_RATE_PERCENT = 16

const getTaxRatePercent = async (): Promise<number> => {
  try {
    const raw = await settingsService.getSetting('iva_rate')
    const parsed = parseFloat(raw)
    return !isNaN(parsed) && parsed > 0 ? parsed : DEFAULT_TAX_RATE_PERCENT
  } catch {
    return DEFAULT_TAX_RATE_PERCENT
  }
}

// payment_breakdown llega como jsonb (objeto ya parseado por supabase-js).
// Tolera filas viejas sin cashTendered/change (quedan en 0).
const readBreakdown = (raw: unknown): PaymentBreakdown | null => {
  if (!raw || typeof raw !== 'object') return null
  const b = raw as Record<string, unknown>
  if (typeof b.cash !== 'number' || typeof b.terminal !== 'number' || typeof b.usd !== 'number') return null
  return {
    cash: b.cash,
    terminal: b.terminal,
    usd: b.usd,
    cashTendered: typeof b.cashTendered === 'number' ? b.cashTendered : 0,
    change: typeof b.change === 'number' ? b.change : 0,
  }
}

const aggregate = async (startISO: string, endISO: string): Promise<CashReportPreview> => {
  const { data: sales, error: salesError } = await (supabase as any)
    .from('sales_history')
    .select('total_amount, payment_method, payment_breakdown')
    .gte('closed_at', startISO)
    .lte('closed_at', endISO) as {
      data: { total_amount: number; payment_method: string | null; payment_breakdown: unknown }[] | null
      error: Error | null
    }
  if (salesError) throw salesError
  const salesRows = sales || []

  // cash/terminal/usd_sales son el desglose REAL por tipo de dinero: para una
  // venta 'mixed' se reparte usando payment_breakdown en vez de excluirla, asi
  // cash_sales + terminal_sales + usd_sales == total_sales siempre (no se
  // muestra un total "mixto" aparte porque ya queda contemplado en los tres).
  // cash_deposits/cash_withdrawals son el efectivo bruto entregado y el cambio
  // devuelto en CUALQUIER venta con efectivo (100% efectivo o mixta) — es lo
  // que entra/sale fisicamente de la caja, independiente de cash_sales.
  let cash_sales = 0
  let terminal_sales = 0
  let usd_sales = 0
  let total_sales = 0
  let cash_deposits = 0
  let cash_withdrawals = 0

  salesRows.forEach((s) => {
    total_sales += s.total_amount
    const breakdown = readBreakdown(s.payment_breakdown)
    if (breakdown) {
      cash_deposits += breakdown.cashTendered
      cash_withdrawals += breakdown.change
    }
    if (s.payment_method === 'cash') cash_sales += s.total_amount
    else if (s.payment_method === 'terminal') terminal_sales += s.total_amount
    else if (s.payment_method === 'usd') usd_sales += s.total_amount
    else if (s.payment_method === 'mixed' && breakdown) {
      cash_sales += breakdown.cash
      terminal_sales += breakdown.terminal
      usd_sales += breakdown.usd
    }
  })

  const tips = await tipsService.getTipsByDateRange(startISO, endISO)

  let cash_tips = 0
  let terminal_tips = 0
  let usd_tips = 0
  let total_tips = 0

  tips.forEach((t) => {
    total_tips += t.amount
    if (t.payment_method === 'cash') cash_tips += t.amount
    else if (t.payment_method === 'terminal') terminal_tips += t.amount
    else if (t.payment_method === 'usd') usd_tips += t.amount
    else if (t.payment_method === 'mixed' && t.payment_breakdown) {
      cash_tips += t.payment_breakdown.cash
      terminal_tips += t.payment_breakdown.terminal
      usd_tips += t.payment_breakdown.usd
    }
  })

  const paid_accounts_count = salesRows.length
  const average_ticket = paid_accounts_count > 0 ? total_sales / paid_accounts_count : 0

  const tax_rate = await getTaxRatePercent()
  const subtotal = total_sales / (1 + tax_rate / 100)
  const tax_amount = total_sales - subtotal

  // Propinas pagadas = pagos REALES marcados en la pestana Propinas del admin
  // (tip_payouts), NO lo acumulado al cerrar turno ni las propinas recibidas
  // (cash_tips de arriba). Mientras un pago no se marque como pagado, ese
  // dinero sigue fisicamente en la caja y no debe restarse de expected_cash.
  const tips_paid = await tipLedgerService.getPaidTotalByDateRange(startISO, endISO)

  return {
    cash_deposits, cash_withdrawals,
    cash_sales, terminal_sales, usd_sales, total_sales,
    cash_tips, terminal_tips, usd_tips, total_tips,
    paid_accounts_count, average_ticket, subtotal, tax_amount, tax_rate, tips_paid,
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
    const expected_cash = report.opening_cash + preview.cash_deposits - preview.cash_withdrawals - preview.tips_paid
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
