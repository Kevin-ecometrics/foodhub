/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type VirtualCategoryId = 'favorites' | 'repite-item'

export interface DisplayCategory extends Category {
  is_virtual?: false
}

export interface VirtualCategory {
  id: VirtualCategoryId
  name: string
  description: string
  is_virtual: true
  display_order: number
}

export type MenuCategory = DisplayCategory | VirtualCategory

export const VIRTUAL_CATEGORIES: VirtualCategory[] = [
  {
    id: 'favorites',
    name: 'Favoritos',
    description: 'Los productos más populares',
    is_virtual: true,
    display_order: 1,
  },
  {
    id: 'repite-item',
    name: 'Repite Item',
    description: 'Tus items recientes de esta orden',
    is_virtual: true,
    display_order: 2,
  },
]

export const categoriesService = {
  async getActiveCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return (data || []) as Category[]
  },

  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) throw error
    return (data || []) as Category[]
  },

  async createCategory(category: {
    name: string
    slug: string
    description?: string
    display_order?: number
    is_active?: boolean
  }): Promise<Category> {
    const { data, error } = await (supabase as any)
      .from('categories')
      .insert([{
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        display_order: category.display_order ?? 0,
        is_active: category.is_active ?? true,
      }])
      .select()
      .single() as { data: Category | null; error: Error | null }

    if (error) throw error
    return data as Category
  },

  async updateCategory(id: number, updates: Partial<{
    name: string
    slug: string
    description: string
    display_order: number
    is_active: boolean
  }>): Promise<Category> {
    const payload = { ...updates, updated_at: new Date().toISOString() }
    const { data, error } = await (supabase as any)
      .from('categories')
      .update(payload)
      .eq('id', id)
      .select()
      .single() as { data: Category | null; error: Error | null }

    if (error) throw error
    return data as Category
  },

  async deleteCategory(id: number): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  getMenuCategories(categories: Category[]): MenuCategory[] {
    return [
      ...VIRTUAL_CATEGORIES,
      ...categories.map((c) => ({ ...c, is_virtual: false as const })),
    ]
  },
}
