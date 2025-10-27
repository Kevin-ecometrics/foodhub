import { supabase } from './client'

export const notificationsService = {
  // Crear notificación para mesero
  async createNotification(tableId: number, type: string, message: string, orderId?: string) {
    const { error } = await supabase
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        order_id: orderId || null,
        type,
        message,
        status: 'pending'
      })
    
    if (error) throw error
  }
}