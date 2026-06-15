/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import type { NotificationType } from './types'

export const notificationsService = {
  async createNotification(tableId: number, type: NotificationType, message: string, orderId?: string) {
    const { error } = await (supabase as any)
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        order_id: orderId || null,
        type,
        message,
        status: 'pending',
      }) as { error: Error | null }

    if (error) throw error
  }
}
