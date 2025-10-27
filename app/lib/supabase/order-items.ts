import { supabase } from './client'

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
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Obtener items de una orden
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Actualizar cantidad de un item
  async updateItemQuantity(itemId: string, quantity: number) {
    const { error } = await supabase
      .from('order_items')
      .update({ 
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
    
    if (error) throw error
  },

  // Eliminar item de una orden
  async removeItemFromOrder(itemId: string) {
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
    
    const total = data?.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0) || 0
    
    return total
  }
}