/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

interface Product {
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
  status: 'ordered' | 'preparing' | 'ready' | 'served'
  created_at: string
  updated_at?: string
}

export const orderItemsService = {
  // Agregar item a una orden
  async addItemToOrder(
    orderId: string, 
    product: Product, 
    quantity: number = 1, 
    notes?: string
  ): Promise<OrderItem> {
    const { data, error } = await supabase
      .from('order_items')
      .insert({
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        quantity,
        notes: notes || null,
        status: 'ordered'
      } as never)
      .select()
      .single()
    
    if (error) throw error
    return data as OrderItem
  },

  // Obtener items de una orden
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return (data as OrderItem[]) || []
  },

  // Actualizar cantidad de un item
  async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', itemId)
    
    if (error) throw error
  },

  // Eliminar item de una orden
  async removeItemFromOrder(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
  },

  // Obtener total de una orden
  async getOrderTotal(orderId: string): Promise<number> {
    const { data, error } = await supabase
      .from('order_items')
      .select('price, quantity')
      .eq('order_id', orderId)
    
    if (error) throw error
    
    const itemsData = data as { price: number; quantity: number }[] | null
    const total = itemsData?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0
    
    return total
  }
}