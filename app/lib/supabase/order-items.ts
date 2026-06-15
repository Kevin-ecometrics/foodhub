/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import type { OrderItemStatus } from './types'

interface ProductRef {
  id: number
  name: string
  price: number
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: number
  product_name: string
  price: number
  quantity: number
  notes: string | null
  status: OrderItemStatus
  cancelled_quantity: number
  created_at: string
  updated_at?: string
}

export const orderItemsService = {
  async addItemToOrder(
    orderId: string,
    product: ProductRef,
    quantity: number = 1,
    notes?: string,
    customPrice?: number
  ): Promise<OrderItem> {
    const price = customPrice !== undefined ? customPrice : product.price
    const { data, error } = await (supabase as any)
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        price,
        quantity,
        notes: notes || null,
        status: 'ordered',
      })
      .select()
      .single() as { data: OrderItem | null; error: Error | null }

    if (error) throw error
    return data as OrderItem
  },

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await (supabase as any)
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true }) as { data: OrderItem[] | null; error: Error | null }

    if (error) throw error
    return (data as OrderItem[]) || []
  },

  async updateItemQuantity(itemId: string, quantity: number, notes?: string, customPrice?: number): Promise<OrderItem> {
    const updateData: Record<string, unknown> = {
      quantity,
      updated_at: new Date().toISOString(),
    }

    if (notes !== undefined) {
      updateData.notes = notes || null
    }

    if (customPrice !== undefined) {
      updateData.price = customPrice
    }

    const { data, error } = await (supabase as any)
      .from('order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single() as { data: OrderItem | null; error: Error | null }

    if (error) throw error
    return data as OrderItem
  },

  async removeItemFromOrder(itemId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('order_items')
      .delete()
      .eq('id', itemId) as { error: Error | null }

    if (error) throw error
  },

  async getOrderTotal(orderId: string): Promise<number> {
    const { data, error } = await (supabase as any)
      .from('order_items')
      .select('price, quantity')
      .eq('order_id', orderId) as { data: { price: number; quantity: number }[] | null; error: Error | null }

    if (error) throw error

    return (data || []).reduce((sum, item) => sum + item.price * item.quantity, 0)
  },

  async updateItemNotes(itemId: string, notes: string): Promise<OrderItem> {
    const { data, error } = await (supabase as any)
      .from('order_items')
      .update({
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single() as { data: OrderItem | null; error: Error | null }

    if (error) throw error
    return data as OrderItem
  },

  async getItemsByTable(tableId: number): Promise<OrderItem[]> {
    const { data, error } = await (supabase as any)
      .from('order_items')
      .select(`*, orders!inner(table_id)`)
      .eq('orders.table_id', tableId)
      .order('created_at', { ascending: false }) as { data: OrderItem[] | null; error: Error | null }

    if (error) throw error
    return (data as OrderItem[]) || []
  },

  async updateItemStatus(itemId: string, status: OrderItemStatus): Promise<OrderItem> {
    const { data, error } = await (supabase as any)
      .from('order_items')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single() as { data: OrderItem | null; error: Error | null }

    if (error) throw error
    return data as OrderItem
  },
}
