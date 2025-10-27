import { supabase } from './client'

export interface WaiterNotification {
  id: string
  table_id: number
  order_id: string | null
  type: 'new_order' | 'refill' | 'assistance' | 'bill_request' | 'order_updated' | 'table_freed'
  message: string
  status: 'pending' | 'acknowledged' | 'completed'
  created_at: string
  updated_at?: string
  tables?: {
    number: number
  }
  orders?: {
    total_amount: number
    customer_name: string | null
  }
}

export interface TableWithOrder {
  id: number
  number: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  capacity: number
  location: string | null
  orders: {
    id: string
    total_amount: number
    customer_name: string | null
    created_at: string
    status: string
    order_items: {
      id: string
      product_name: string
      quantity: number
      status: string
    }[]
  }[]
}

export const waiterService = {
  // Obtener todas las notificaciones pendientes
  async getPendingNotifications(): Promise<WaiterNotification[]> {
    const { data, error } = await supabase
      .from('waiter_notifications')
      .select(`
        *,
        tables ( number ),
        orders ( total_amount, customer_name )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Obtener todas las mesas con sus órdenes activas
  async getTablesWithOrders(): Promise<TableWithOrder[]> {
    const { data, error } = await supabase
      .from('tables')
      .select(`
        *,
        orders (
          id,
          total_amount,
          customer_name,
          created_at,
          status,
          order_items (
            id,
            product_name,
            quantity,
            status
          )
        )
      `)
      .order('number')
    
    if (error) throw error
    
    // Filtrar solo órdenes activas
    const tablesWithActiveOrders = data?.map(table => ({
      ...table,
      orders: table.orders
        ?.filter(order => order.status === 'active')
        .map(order => ({
          ...order,
          order_items: order.order_items || []
        })) || []
    })) || []
    
    return tablesWithActiveOrders
  },

  // Marcar notificación como atendida
  async acknowledgeNotification(notificationId: string) {
    const { error } = await supabase
      .from('waiter_notifications')
      .update({ 
        status: 'acknowledged'
      })
      .eq('id', notificationId)
    
    if (error) throw error
  },

  // Marcar notificación como completada
  async completeNotification(notificationId: string) {
    const { error } = await supabase
      .from('waiter_notifications')
      .update({ 
        status: 'completed'
      })
      .eq('id', notificationId)
    
    if (error) throw error
  },

  // Actualizar estado de un item
  async updateItemStatus(itemId: string, status: 'ordered' | 'preparing' | 'ready' | 'served') {
    const { error } = await supabase
      .from('order_items')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
    
    if (error) throw error
  },

  // Marcar orden como completada
  async completeOrder(orderId: string) {
    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (error) throw error
  },
  

  // Liberar mesa (volver a disponible)
  async freeTable(tableId: number) {
    const { error } = await supabase
      .from('tables')
      .update({ 
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .eq('id', tableId)
    
    if (error) throw error
  },

  // Notificar que la mesa fue liberada (para redirigir clientes)
  async notifyTableFreed(tableId: number) {
    const { error } = await supabase
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        type: 'table_freed',
        message: 'Mesa liberada - Redirigiendo clientes',
        status: 'pending'
      })
    
    if (error) throw error
  }
}