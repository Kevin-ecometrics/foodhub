/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import type { WaiterSession } from './types'

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

  async endSession(sessionId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('waiter_sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId) as { error: Error | null }

    if (error) throw error
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
