/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import { usersService } from './users'
import { settingsService } from './settings'

export type TipRecipientType = 'waiter' | 'role'

export interface TipLedgerEntryInput {
  waiter_session_id: string
  recipient_type: TipRecipientType
  recipient_key: string
  recipient_name: string
  amount: number
}

export interface TipPayout {
  id: string
  recipient_type: TipRecipientType
  recipient_key: string
  recipient_name: string
  amount: number
  paid_at: string
  paid_by: string | null
  notes: string | null
  created_at: string
}

export interface TipBalance {
  recipient_type: TipRecipientType
  recipient_key: string
  recipient_name: string
  accrued: number
  paid: number
  balance: number
}

// Duplica sessionsService.getTipDistributionConfig() (no se importa directo
// para evitar un ciclo: sessions.ts -> tipLedger.ts -> sessions.ts).
const getTipDistributionConfig = async (): Promise<Record<string, number>> => {
  const raw = await settingsService.getSetting('tip_distribution')
  try {
    return JSON.parse(raw) as Record<string, number>
  } catch {
    return {}
  }
}

export const tipLedgerService = {
  /** Inserta las acumulaciones de un cierre de turno (una fila por rol + una para el mesero si le deben dinero). */
  async recordSessionAccrual(entries: TipLedgerEntryInput[]): Promise<void> {
    if (entries.length === 0) return
    const { error } = await (supabase as any).from('tip_ledger_entries').insert(entries) as { error: Error | null }
    if (error) throw error
  },

  /** Saldo pendiente por destinatario: todos los meseros + todos los roles configurados, aunque no tengan movimientos. */
  async getAllBalances(): Promise<TipBalance[]> {
    const [entriesRes, payoutsRes, waiters, distribution] = await Promise.all([
      (supabase as any)
        .from('tip_ledger_entries')
        .select('recipient_type, recipient_key, amount') as Promise<{ data: { recipient_type: TipRecipientType; recipient_key: string; amount: number }[] | null; error: Error | null }>,
      (supabase as any)
        .from('tip_payouts')
        .select('recipient_type, recipient_key, amount') as Promise<{ data: { recipient_type: TipRecipientType; recipient_key: string; amount: number }[] | null; error: Error | null }>,
      usersService.getAllUsers(),
      getTipDistributionConfig(),
    ])

    if (entriesRes.error) throw entriesRes.error
    if (payoutsRes.error) throw payoutsRes.error

    const accruedMap = new Map<string, number>()
    for (const e of entriesRes.data || []) {
      const key = `${e.recipient_type}:${e.recipient_key}`
      accruedMap.set(key, (accruedMap.get(key) || 0) + e.amount)
    }

    const paidMap = new Map<string, number>()
    for (const p of payoutsRes.data || []) {
      const key = `${p.recipient_type}:${p.recipient_key}`
      paidMap.set(key, (paidMap.get(key) || 0) + p.amount)
    }

    const recipients = new Map<string, { type: TipRecipientType; key: string; name: string }>()

    const activeWaiters = waiters.filter((u) => u.role === 'waiter' && u.is_active)
    for (const w of activeWaiters) {
      recipients.set(`waiter:${w.id}`, { type: 'waiter', key: w.id, name: w.name })
    }
    for (const role of Object.keys(distribution)) {
      recipients.set(`role:${role}`, { type: 'role', key: role, name: role })
    }
    // Incluir destinatarios con movimientos aunque ya no esten en la config/lista activa vigente.
    for (const key of new Set([...accruedMap.keys(), ...paidMap.keys()])) {
      if (!recipients.has(key)) {
        const [type, ...rest] = key.split(':')
        const recipientKey = rest.join(':')
        recipients.set(key, { type: type as TipRecipientType, key: recipientKey, name: recipientKey })
      }
    }

    const balances: TipBalance[] = []
    for (const [key, r] of recipients) {
      const accrued = accruedMap.get(key) || 0
      const paid = paidMap.get(key) || 0
      balances.push({ recipient_type: r.type, recipient_key: r.key, recipient_name: r.name, accrued, paid, balance: accrued - paid })
    }

    return balances.sort((a, b) => b.balance - a.balance)
  },

  async markAsPaid(
    recipientType: TipRecipientType,
    recipientKey: string,
    recipientName: string,
    amount: number,
    paidBy: string | null,
    notes: string | null,
  ): Promise<void> {
    const { error } = await (supabase as any).from('tip_payouts').insert({
      recipient_type: recipientType,
      recipient_key: recipientKey,
      recipient_name: recipientName,
      amount,
      paid_by: paidBy,
      notes,
    }) as { error: Error | null }
    if (error) throw error
  },

  async getRecentPayouts(limit = 30): Promise<TipPayout[]> {
    const { data, error } = await (supabase as any)
      .from('tip_payouts')
      .select('*')
      .order('paid_at', { ascending: false })
      .limit(limit) as { data: TipPayout[] | null; error: Error | null }
    if (error) throw error
    return data || []
  },

  /** Suma de pagos REALES (marcados como pagado) en el rango — esto es lo que cuenta como "propinas pagadas" en el corte de caja. */
  async getPaidTotalByDateRange(startISO: string, endISO: string): Promise<number> {
    const { data, error } = await (supabase as any)
      .from('tip_payouts')
      .select('amount')
      .gte('paid_at', startISO)
      .lte('paid_at', endISO) as { data: { amount: number }[] | null; error: Error | null }
    if (error) throw error
    return (data || []).reduce((sum, r) => sum + (r.amount || 0), 0)
  },
}
