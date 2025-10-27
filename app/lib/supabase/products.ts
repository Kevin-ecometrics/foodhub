import { supabase } from './client'

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_available: boolean
  preparation_time: number | null
}

export const productsService = {
  // Obtener todos los productos disponibles
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('category')
      .order('name')
    
    if (error) throw error
    
    // Direct type assertion
    return (data as Product[]) || []
  },

  // Obtener productos por categoría
  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .order('name')
    
    if (error) throw error
    
    return (data as Product[]) || []
  },

  // Obtener categorías únicas
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_available', true)
      .order('category')
    
    if (error) throw error
    
    // Type assertion para el objeto con categoría
    const categoriesData = data as { category: string }[] | null
    
    const uniqueCategories = [...new Set(categoriesData?.map(item => item.category) || [])]
    return uniqueCategories
  }
}