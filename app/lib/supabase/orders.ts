/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from '@/app/lib/supabase/client'
import { OrderItem } from './order-items'
import type { OrderStatus } from './types'

export interface Order {
  id: string
  table_id: number
  customer_name: string
  status: OrderStatus
  total_amount: number
  created_at: string
  updated_at: string
}

export const ordersService = {
  async createOrder(tableId: number, customerName: string): Promise<Order> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .insert([{
        table_id: tableId,
        customer_name: customerName,
        status: 'pending' as OrderStatus,
        total_amount: 0,
      }])
      .select()
      .single() as { data: Order | null; error: { message: string } | null }

    if (error) {
      console.error('Error creating order:', error)
      throw new Error(`Error al crear la orden: ${error.message}`)
    }

    return data as Order
  },

  async getActiveOrderByTable(tableId: number): Promise<Order | null> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single() as { data: Order | null; error: { code: string; message: string } | null }

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting active order:', error)
      throw error
    }

    return data as Order | null
  },

  async getActiveOrdersByTable(tableId: number): Promise<Order[]> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true }) as { data: Order[] | null; error: { message: string } | null }

    if (error) {
      console.error('Error getting active orders:', error)
      throw new Error(`Error al obtener órdenes: ${error.message}`)
    }

    return (data as Order[]) || []
  },

  async getOrder(orderId: string): Promise<Order | null> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single() as { data: Order | null; error: Error | null }

    if (error) {
      console.error('Error getting order:', error)
      throw error
    }

    return data as Order | null
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await (supabase as any)
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId) as { error: { message: string } | null }

    if (error) {
      console.error('Error updating order status:', error)
      throw new Error(`Error al actualizar estado: ${error.message}`)
    }
  },

  async updateOrderTotal(orderId: string, total: number): Promise<void> {
    const { error } = await (supabase as any)
      .from('orders')
      .update({ total_amount: total, updated_at: new Date().toISOString() })
      .eq('id', orderId) as { error: { message: string } | null }

    if (error) {
      console.error('Error updating order total:', error)
      throw new Error(`Error al actualizar total: ${error.message}`)
    }
  },

  async createNewOrderForTable(tableId: number, customerName: string): Promise<Order> {
    return this.createOrder(tableId, customerName)
  },

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await (supabase as any)
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }) as { data: OrderItem[] | null; error: { message: string } | null }

    if (error) {
      console.error('Error getting order items:', error)
      throw new Error(`Error al obtener items: ${error.message}`)
    }

    return (data as OrderItem[]) || []
  },

  async getOrderByUser(tableId: number, customerName: string): Promise<Order | null> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .eq('customer_name', customerName)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single() as { data: Order | null; error: { code: string; message: string } | null }

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting order by user:', error)
      throw error
    }

    return data as Order | null
  },

  async getAllOrdersByTable(tableId: number): Promise<Order[]> {
    const { data, error } = await (supabase as any)
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false }) as { data: Order[] | null; error: { message: string } | null }

    if (error) {
      console.error('Error getting all orders:', error)
      throw new Error(`Error al obtener historial: ${error.message}`)
    }

    return (data as Order[]) || []
  },

  async deleteOrder(orderId: string): Promise<void> {
    const { error: itemsError } = await (supabase as any)
      .from('order_items')
      .delete()
      .eq('order_id', orderId) as { error: { message: string } | null }

    if (itemsError) {
      console.error('Error deleting order items:', itemsError)
      throw new Error(`Error al eliminar items: ${itemsError.message}`)
    }

    const { error } = await (supabase as any)
      .from('orders')
      .delete()
      .eq('id', orderId) as { error: { message: string } | null }

    if (error) {
      console.error('Error deleting order:', error)
      throw new Error(`Error al eliminar orden: ${error.message}`)
    }
  }
}
