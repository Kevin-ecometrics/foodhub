/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

export interface OrderWithItems {
  id: string
  table_id: number
  customer_name: string | null
  status: 'active' | 'completed' | 'cancelled' | 'paid'
  total_amount: number
  created_at: string
  updated_at: string
  order_items: OrderItemWithProduct[]
}

export interface OrderItemWithProduct {
  id: string
  order_id: string
  product_id: number
  product_name: string
  price: number
  quantity: number
  notes: string | null
  status: 'ordered' | 'preparing' | 'ready' | 'served'
  created_at: string
  updated_at: string
  products?: {
    name: string
    image_url: string | null
    preparation_time: number | null
  } | null
}

// Interface para las respuestas de Supabase
interface OrderFromSupabase {
  id: string
  table_id: number
  customer_name: string | null
  status: 'active' | 'completed' | 'cancelled' | 'paid'
  total_amount: number
  created_at: string
  updated_at: string
  order_items: OrderItemWithProduct[]
}

export const historyService = {
  // Obtener historial del cliente actual (solo su orden activa + completadas)
  async getCustomerOrderHistory(tableId: number, currentOrderId?: string): Promise<OrderWithItems[]> {
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            preparation_time
          )
        )
      `)
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })

    // ✅ FILTRAR: Si hay orderId actual, mostrar esa + completadas
    if (currentOrderId) {
      query = query.or(`id.eq.${currentOrderId},status.eq.completed`)
    } else {
      // Si no hay orderId actual, mostrar solo completadas
      query = query.eq('status', 'completed')
    }

    const { data, error } = await query
    
    if (error) throw error
    
    // Type assertion para los datos de Supabase
    const ordersData = data as OrderFromSupabase[] | null
    return ordersData || []
  },

  // Obtener orden específica con sus items
  async getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            preparation_time
          )
        )
      `)
      .eq('id', orderId)
      .single()
    
    if (error) return null
    
    // Type assertion para el dato de Supabase
    const orderData = data as OrderFromSupabase | null
    return orderData
  },

  // Solicitar asistencia del mesero
  async requestAssistance(tableId: number, message: string = 'Solicito asistencia'): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        type: 'assistance',
        message,
        status: 'pending'
      } as any)
    
    if (error) throw error
  },

  // Solicitar la cuenta
  async requestBill(tableId: number, orderId?: string): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        order_id: orderId || null,
        type: 'bill_request',
        message: 'Solicita la cuenta',
        status: 'pending'
      } as any)
    
    if (error) throw error
  }
}