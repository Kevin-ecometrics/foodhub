/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import { ProductExtra } from '@/app/admin/types'

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  category: string
  image_url: string | null
  is_available: boolean
  is_favorite: boolean
  preparation_time: number | null
  rating: number
  extras?: ProductExtra[]
}

export const productsService = {
  // Obtener todos los productos disponibles
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('is_favorite', { ascending: false })
      .order('category')
      .order('name')
    
    if (error) throw error
    
    // Convertir el rating de string a number si es necesario
    const products = (data as any[] || []).map(product => ({
      ...product,
      rating: parseFloat(product.rating) || 0,
      extras: product.extras || [],
    })) as Product[]
    
    return products
  },

  // Obtener productos por categoría
  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .order('is_favorite', { ascending: false }) 
      .order('name')
    
    if (error) throw error
    
    // Convertir el rating de string a number si es necesario
    const products = (data as any[] || []).map(product => ({
      ...product,
      rating: parseFloat(product.rating) || 0,
      extras: product.extras || [],
    })) as Product[]
    
    return products
  },

  // Obtener productos favoritos
  async getFavoriteProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_favorite', true)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .order('name')
    
    if (error) throw error
    
    // Convertir el rating de string a number si es necesario
    const products = (data as any[] || []).map(product => ({
      ...product,
      rating: parseFloat(product.rating) || 0,
      extras: product.extras || [],
    })) as Product[]
    
    return products
  },


async createProductWithExtras(productData: any): Promise<Product> {
  // Preparar datos del producto incluyendo extras
  const productPayload = {
    name: productData.name,
    description: productData.description,
    price: parseInt(productData.price) || 0,
    category: productData.category,
    image_url: typeof productData.image_url === 'string' ? productData.image_url : null,
    is_available: productData.is_available,
    is_favorite: productData.is_favorite,
    preparation_time: parseInt(productData.preparation_time) || null,
    rating: parseFloat(productData.rating) || 0,
    rating_count: 0,
    extras: productData.extras || [] 
  }

  // Crear producto (los extras se guardan automáticamente)
  const { data: product, error } = await supabase
    .from('products')
    .insert(productPayload as never)
    .select()
    .single()

  if (error) throw error

  return {
    ...(product as any),
    rating: parseFloat((product as any).rating) || 0,
    extras: (product as any).extras || []
  } as Product
},

// Actualizar producto con extras
async updateProductWithExtras(productId: number, productData: any): Promise<Product> {
  // Preparar datos del producto incluyendo extras
  const productPayload = {
    name: productData.name,
    description: productData.description,
    price: parseInt(productData.price) || 0,
    category: productData.category,
    image_url: typeof productData.image_url === 'string' ? productData.image_url : undefined,
    is_available: productData.is_available,
    is_favorite: productData.is_favorite,
    preparation_time: parseInt(productData.preparation_time) || null,
    rating: parseFloat(productData.rating) || 0,
    updated_at: new Date().toISOString(),
    extras: productData.extras || [] // ← ESTA ES LA LÍNEA CLAVE
  }

  // Actualizar producto (los extras se actualizan automáticamente)
  const { data: product, error } = await supabase
    .from('products')
    .update(productPayload as never)
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error

  return {
    ...(product as any),
    rating: parseFloat((product as any).rating) || 0,
    extras: (product as any).extras || []
  } as Product
},

// Obtener producto por ID (para admin)
async getProductById(productId: number): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (error) throw error

  return {
    ...(data as any),
    rating: parseFloat((data as any).rating) || 0,
    extras: (data as any).extras || []
  } as Product
},

// Eliminar producto
async deleteProduct(productId: number): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) throw error
},

// Subir imagen de producto
async uploadProductImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `product-images/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file)

  if (uploadError) throw uploadError

  // Obtener URL pública
  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  return data.publicUrl
}
,
  // Obtener categorías únicas
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_available', true)
      .order('category')
    
    if (error) throw error
    
    const categoriesData = data as { category: string }[] | null
    const uniqueCategories = [...new Set(categoriesData?.map(item => item.category) || [])]
    return uniqueCategories
  }
}