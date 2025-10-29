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

// Helper function para type assertions
const assertUpdate = <T>(data: T): never => data as never
const assertInsert = <T>(data: T): never => data as never

export const waiterService = {
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
    return (data as WaiterNotification[]) || []
  },

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
    
    const tablesData = data as TableWithOrder[] | null
    
    const tablesWithActiveOrders = (tablesData || []).map(table => ({
      ...table,
      orders: (table.orders || [])
        .filter(order => order.status === 'active')
        .map(order => ({
          ...order,
          order_items: order.order_items || []
        }))
    }))
    
    return tablesWithActiveOrders
  },

  async acknowledgeNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .update(assertUpdate({ 
        status: 'acknowledged',
        updated_at: new Date().toISOString()
      }))
      .eq('id', notificationId)
    
    if (error) throw error
  },

  async completeNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .update(assertUpdate({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      }))
      .eq('id', notificationId)
    
    if (error) throw error
  },

  async updateItemStatus(itemId: string, status: 'ordered' | 'preparing' | 'ready' | 'served'): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .update(assertUpdate({ 
        status,
        updated_at: new Date().toISOString()
      }))
      .eq('id', itemId)
    
    if (error) throw error
  },

  async completeOrder(orderId: string): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update(assertUpdate({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      }))
      .eq('id', orderId)
    
    if (error) throw error
  },

  async freeTable(tableId: number): Promise<void> {
    const { error } = await supabase
      .from('tables')
      .update(assertUpdate({ 
        status: 'available',
        updated_at: new Date().toISOString()
      }))
      .eq('id', tableId)
    
    if (error) throw error
  },

  async notifyTableFreed(tableId: number): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .insert(assertInsert({
        table_id: tableId,
        type: 'table_freed',
        message: 'Mesa liberada - Redirigiendo clientes',
        status: 'pending'
      }))
    
    if (error) throw error
  },

  async cleanAllNotifications(): Promise<void> {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const { error } = await supabase
      .from('waiter_notifications')
      .update(assertUpdate({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      }))
      .gte('created_at', startOfDay.toISOString())
      .eq('status', 'pending')
    
    if (error) throw error
  }
}