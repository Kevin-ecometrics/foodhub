/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import type { Json, ProductExtra } from './types'

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
  rating_count?: number
  extras: ProductExtra[]
}

function parseProduct(raw: Record<string, unknown>): Product {
  return {
    ...raw,
    rating: Number(raw.rating) || 0,
    extras: Array.isArray(raw.extras) ? (raw.extras as unknown as ProductExtra[]) : [],
  } as Product
}

export const productsService = {
  async getProducts(): Promise<Product[]> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('is_favorite', { ascending: false })
      .order('category')
      .order('name') as { data: Record<string, unknown>[] | null; error: Error | null }

    if (error) throw error
    return (data || []).map(p => parseProduct(p))
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .order('is_favorite', { ascending: false })
      .order('name') as { data: Record<string, unknown>[] | null; error: Error | null }

    if (error) throw error
    return (data || []).map(p => parseProduct(p))
  },

  async getFavoriteProducts(): Promise<Product[]> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('is_favorite', true)
      .eq('is_available', true)
      .order('rating', { ascending: false })
      .order('name') as { data: Record<string, unknown>[] | null; error: Error | null }

    if (error) throw error
    return (data || []).map(p => parseProduct(p))
  },

  async createProductWithExtras(productData: {
    name: string
    description?: string | null
    price: string | number
    category: string
    image_url?: string | null
    is_available: boolean
    is_favorite: boolean
    preparation_time?: string | number | null
    rating?: string | number
    extras?: ProductExtra[]
  }): Promise<Product> {
    const productPayload = {
      name: productData.name,
      description: productData.description ?? null,
      price: parseInt(String(productData.price)) || 0,
      category: productData.category,
      image_url: typeof productData.image_url === 'string' ? productData.image_url : null,
      is_available: productData.is_available,
      is_favorite: productData.is_favorite,
      preparation_time: productData.preparation_time ? parseInt(String(productData.preparation_time)) : null,
      rating: Number(productData.rating) || 0,
      rating_count: 0,
      extras: (productData.extras || []) as unknown as Json,
    }

    const { data: product, error } = await (supabase as any)
      .from('products')
      .insert(productPayload)
      .select()
      .single() as { data: Record<string, unknown> | null; error: Error | null }

    if (error) throw error
    return parseProduct(product as Record<string, unknown>)
  },

  async updateProductWithExtras(productId: number, productData: {
    name: string
    description?: string | null
    price: string | number
    category: string
    image_url?: string | null
    is_available: boolean
    is_favorite: boolean
    preparation_time?: string | number | null
    rating?: string | number
    extras?: ProductExtra[]
  }): Promise<Product> {
    const productPayload = {
      name: productData.name,
      description: productData.description ?? null,
      price: parseInt(String(productData.price)) || 0,
      category: productData.category,
      image_url: typeof productData.image_url === 'string' ? productData.image_url : undefined,
      is_available: productData.is_available,
      is_favorite: productData.is_favorite,
      preparation_time: productData.preparation_time ? parseInt(String(productData.preparation_time)) : null,
      rating: Number(productData.rating) || 0,
      updated_at: new Date().toISOString(),
      extras: (productData.extras || []) as unknown as Json,
    }

    const { data: product, error } = await (supabase as any)
      .from('products')
      .update(productPayload)
      .eq('id', productId)
      .select()
      .single() as { data: Record<string, unknown> | null; error: Error | null }

    if (error) throw error
    return parseProduct(product as Record<string, unknown>)
  },

  async getProductById(productId: number): Promise<Product> {
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('id', productId)
      .single() as { data: Record<string, unknown> | null; error: Error | null }

    if (error) throw error
    return parseProduct(data as Record<string, unknown>)
  },

  async deleteProduct(productId: number): Promise<void> {
    const { error } = await (supabase as any)
      .from('products')
      .delete()
      .eq('id', productId) as { error: Error | null }

    if (error) throw error
  },

  async uploadProductImage(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `product-images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return data.publicUrl
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await (supabase as any)
      .from('categories')
      .select('name')
      .eq('is_active', true)
      .order('display_order', { ascending: true }) as { data: { name: string }[] | null; error: Error | null }

    if (error) throw error
    return (data || []).map(c => c.name)
  },
}
