/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import type { WaiterSession } from './types'
import { tipsService } from './tips'
import { tipLedgerService, type TipLedgerEntryInput } from './tipLedger'

export const sessionsService = {
  async getActiveSession(waiterId: string): Promise<WaiterSession | null> {
    const { data, error } = await (supabase as any)
      .from('waiter_sessions')
      .select('*')
      .eq('waiter_id', waiterId)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: WaiterSession | null; error: Error | null }

    if (error) throw error
    return data as WaiterSession | null
  },

  async createSession(waiterId: string, waiterName: string): Promise<WaiterSession> {
    const { data, error } = await (supabase as any)
      .from('waiter_sessions')
      .insert({ waiter_id: waiterId, waiter_name: waiterName })
      .select()
      .single() as { data: WaiterSession | null; error: Error | null }

    if (error) throw error
    return data as WaiterSession
  },

  /**
   * Cierra el turno y ACUMULA (no paga) el reparto de propinas: una fila por
   * rol con pct>0 y, si el efectivo del mesero no alcanza a cubrir lo que le
   * corresponde en tarjeta/dolares, una fila para el mesero por lo que se le
   * debe. Nada de esto cuenta como "pagado" hasta que un admin lo marque en
   * la pestana Propinas (tipLedgerService.markAsPaid) — el dinero sigue
   * fisicamente en la caja hasta entonces.
   */
  async endSession(
    sessionId: string,
    waiterId: string,
    waiterName: string,
    tipsBreakdown: { cash: number; terminal: number; usd: number; total: number },
    distribution: Record<string, number>,
  ): Promise<void> {
    const totalPct = Object.values(distribution).reduce((s, v) => s + v, 0)
    const distributionTotal = tipsBreakdown.total * (totalPct / 100)

    const { error } = await (supabase as any)
      .from('waiter_sessions')
      .update({
        ended_at: new Date().toISOString(),
        tips_collected: tipsBreakdown.total,
        tips_paid_out: distributionTotal,
        tip_distribution_snapshot: distribution,
      })
      .eq('id', sessionId) as { error: Error | null }

    if (error) throw error

    // Misma formula que EndShiftModal.tsx: el mesero solo puede entregar
    // hasta lo que trae en efectivo; lo que falte para cubrir el reparto se
    // descuenta de lo que se le debe por tarjeta/dolares, no se le pide aparte.
    const cashShortfall = Math.max(0, distributionTotal - tipsBreakdown.cash)
    const stillOwedToWaiter = Math.max(0, tipsBreakdown.terminal + tipsBreakdown.usd - cashShortfall)

    const entries: TipLedgerEntryInput[] = Object.entries(distribution)
      .filter(([, pct]) => pct > 0)
      .map(([role, pct]) => ({
        waiter_session_id: sessionId,
        recipient_type: 'role',
        recipient_key: role,
        recipient_name: role,
        amount: tipsBreakdown.total * (pct / 100),
      }))

    if (stillOwedToWaiter > 0) {
      entries.push({
        waiter_session_id: sessionId,
        recipient_type: 'waiter',
        recipient_key: waiterId,
        recipient_name: waiterName,
        amount: stillOwedToWaiter,
      })
    }

    await tipLedgerService.recordSessionAccrual(entries)
  },

  async addSessionSale(sessionId: string, amount: number): Promise<void> {
    const { data: session, error: fetchError } = await (supabase as any)
      .from('waiter_sessions')
      .select('total_sales')
      .eq('id', sessionId)
      .single() as { data: { total_sales: number } | null; error: Error | null }

    if (fetchError) throw fetchError

    const currentTotal = (session as { total_sales: number }).total_sales || 0
    const { error: updateError } = await (supabase as any)
      .from('waiter_sessions')
      .update({ total_sales: currentTotal + amount })
      .eq('id', sessionId) as { error: Error | null }

    if (updateError) throw updateError
  },

  /** Propinas de la sesion desglosadas por forma de pago (reparte 'mixed' via payment_breakdown). */
  async getTipsBreakdownForSession(
    waiterId: string,
    startedAt: string,
  ): Promise<{ cash: number; terminal: number; usd: number; total: number }> {
    const tips = await tipsService.getTipsByWaiterAndSession(waiterId, startedAt)

    let cash = 0
    let terminal = 0
    let usd = 0
    let total = 0

    tips.forEach((t) => {
      total += t.amount
      if (t.payment_method === 'cash') cash += t.amount
      else if (t.payment_method === 'terminal') terminal += t.amount
      else if (t.payment_method === 'usd') usd += t.amount
      else if (t.payment_method === 'mixed' && t.payment_breakdown) {
        cash += t.payment_breakdown.cash
        terminal += t.payment_breakdown.terminal
        usd += t.payment_breakdown.usd
      }
    })

    return { cash, terminal, usd, total }
  },

  async getTipsForSession(sessionId: string): Promise<number> {
    const { data: session, error: sessionError } = await (supabase as any)
      .from('waiter_sessions')
      .select('waiter_id, started_at')
      .eq('id', sessionId)
      .single() as { data: { waiter_id: string; started_at: string } | null; error: Error | null }

    if (sessionError) throw sessionError
    const s = session as { waiter_id: string; started_at: string }
    if (!s) return 0

    const { data, error } = await (supabase as any)
      .from('tips')
      .select('amount')
      .eq('waiter_id', s.waiter_id)
      .gte('created_at', s.started_at) as { data: { amount: number }[] | null; error: Error | null }

    if (error) throw error
    const rows = (data || []) as { amount: number }[]
    return rows.reduce((sum, t) => sum + t.amount, 0)
  },

  async getAllSessionsWithTips(): Promise<any[]> {
    const { data, error } = await (supabase as any)
      .from('waiter_sessions')
      .select('*')
      .order('started_at', { ascending: false }) as { data: any[] | null; error: Error | null }

    if (error) throw error
    const sessions = (data || []) as any[]

    const tipsPromises = sessions.map(async (s) => {
      let query = (supabase as any)
        .from('tips')
        .select('amount')
        .eq('waiter_id', s.waiter_id)
        .gte('created_at', s.started_at)
      if (s.ended_at) {
        query = query.lte('created_at', s.ended_at)
      }
      const { data: tipData, error: tipError } = await query as { data: { amount: number }[] | null; error: Error | null }
      if (tipError) return { ...s, total_tips: 0 }
      const rows = (tipData || []) as { amount: number }[]
      return { ...s, total_tips: rows.reduce((sum, t) => sum + t.amount, 0) }
    })

    return Promise.all(tipsPromises)
  },

  async getTipDistributionConfig(): Promise<Record<string, number>> {
    const { data, error } = await (supabase as any)
      .from('app_settings')
      .select('value')
      .eq('key', 'tip_distribution')
      .maybeSingle() as { data: { value: string } | null; error: Error | null }

    if (error) throw error
    if (!data) return {}
    try {
      return JSON.parse(data.value) as Record<string, number>
    } catch {
      return {}
    }
  },
}
