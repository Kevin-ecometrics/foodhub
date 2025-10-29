import { supabase } from './client'

export interface Table {
  id: number
  number: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  capacity: number
  branch: string
  location: string | null
}

export const tablesService = {
  // Obtener todas las mesas
  async getTablesByBranch(branch: string): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
            .eq('branch', branch)

      .order('number')
    
    if (error) throw error
    return data || []
  },

  // Obtener mesa por número
  async getTableByNumber(tableNumber: number): Promise<Table | null> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('number', tableNumber)
      .single()
    
    if (error) return null
    return data
  },

  // Actualizar estado de mesa
  async updateTableStatus(tableId: number, status: Table['status']) {
    const { error } = await supabase
      .from('tables')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', tableId)
    
    if (error) throw error
  }
}