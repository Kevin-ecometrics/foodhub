/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import type { OrderStatus, OrderItemStatus } from './types'

export interface OrderWithItems {
  id: string
  table_id: number
  customer_name: string | null
  status: OrderStatus
  total_amount: number
  created_at: string
  updated_at: string
  order_items: OrderItemWithProduct[]
}

export interface OrderItemWithProduct {
  cancelled_quantity: number
  id: string
  order_id: string
  product_id: number
  product_name: string
  price: number
  quantity: number
  notes: string | null
  status: OrderItemStatus
  created_at: string
  updated_at: string
  products?: {
    name: string
    image_url: string | null
    preparation_time: number | null
  } | null
}

const ORDER_WITH_ITEMS_SELECT = `
  *,
  order_items (
    *,
    products (
      name,
      image_url,
      preparation_time
    )
  )
` as const

export const historyService = {

  async createOrder(tableId: number, customerName: string): Promise<OrderWithItems> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .insert([{
        table_id: tableId,
        customer_name: customerName,
        status: 'active' as OrderStatus,
        total_amount: 0,
      }])
      .select(ORDER_WITH_ITEMS_SELECT)
      .single() as { data: unknown; error: { message: string } | null }

    if (error) {
      console.error('Error creating order:', error)
      throw new Error(`Error al crear la orden: ${error.message}`)
    }

    console.log('✅ Nueva orden creada para:', customerName, 'en mesa:', tableId)
    return data as unknown as OrderWithItems
  },

  async getCustomerOrderHistory(tableId: number, currentOrderId?: string): Promise<OrderWithItems[]> {
    let query = supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })

    if (currentOrderId) {
      query = query.or(`id.eq.${currentOrderId},status.eq.sent,status.eq.completed,status.eq.paid`)
    } else {
      query = query.in('status', ['sent', 'completed', 'paid'])
    }

    const { data, error } = await query

    if (error) {
      console.error('Error getting customer order history:', error)
      throw error
    }

    console.log('📊 HistoryService: Órdenes encontradas:', data?.length)
    return (data as unknown as OrderWithItems[]) || []
  },

  async getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Error getting order with items:', error)
      return null
    }

    return data as unknown as OrderWithItems
  },

  async getCurrentActiveOrder(tableId: number): Promise<OrderWithItems | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('table_id', tableId)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error getting current active order:', error)
      throw error
    }

    return data as unknown as OrderWithItems
  },

  async getOrderHistoryOnly(tableId: number): Promise<OrderWithItems[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('table_id', tableId)
      .in('status', ['sent', 'completed', 'paid'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting order history only:', error)
      throw error
    }

    return (data as unknown as OrderWithItems[]) || []
  },

  async requestAssistance(tableId: number, message: string = 'Solicito asistencia'): Promise<void> {
    const { error } = await (supabase as any)
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        type: 'assistance',
        message,
        status: 'pending',
      }) as { error: Error | null }

    if (error) {
      console.error('Error requesting assistance:', error)
      throw error
    }

    console.log('✅ Asistencia solicitada para mesa:', tableId)
  },

  async requestBill(tableId: number, orderId?: string, paymentMethod?: string): Promise<void> {
    let message = 'Solicita la cuenta'
    if (paymentMethod === 'cash') message = 'Solicita la cuenta - Pago en efectivo'
    else if (paymentMethod === 'terminal') message = 'Solicita la cuenta - Pago con terminal'

    const { error } = await (supabase as any)
      .from('waiter_notifications')
      .insert({
        table_id: tableId,
        order_id: orderId || null,
        type: 'bill_request',
        message,
        status: 'pending',
        payment_method: paymentMethod || null,
      }) as { error: Error | null }

    if (error) {
      console.error('Error requesting bill:', error)
      throw error
    }

    console.log('✅ Cuenta solicitada para mesa:', tableId, 'método:', paymentMethod)
  },

  async getAllTableOrders(tableId: number): Promise<OrderWithItems[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_WITH_ITEMS_SELECT)
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error getting all table orders:', error)
      throw error
    }

    return (data as unknown as OrderWithItems[]) || []
  },
}
