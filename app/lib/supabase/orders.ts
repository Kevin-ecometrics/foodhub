import { supabase } from './client'

export interface Order {
  id: string
  table_id: number
  customer_name: string | null
  status: 'active' | 'completed' | 'cancelled' | 'paid'
  total_amount: number
  created_at: string
}

export const ordersService = {
  // Crear nueva orden
  async createOrder(tableId: number, customerName?: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        table_id: tableId,
        customer_name: customerName || null,
        status: 'active',
        total_amount: 0
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Obtener orden activa por mesa
  async getActiveOrderByTable(tableId: number): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .eq('status', 'active')
      .single()
    
    if (error) return null
    return data
  },

  // Actualizar total de orden
  async updateOrderTotal(orderId: string, total: number) {
    const { error } = await supabase
      .from('orders')
      .update({ 
        total_amount: total,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (error) throw error
  }
}