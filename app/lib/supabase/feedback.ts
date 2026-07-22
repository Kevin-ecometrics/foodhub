/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'

export interface ProductRatingSummary {
  average: number
  count: number
}

export interface GeneralReview {
  id: string
  customer_name: string
  rating: number
  comment: string | null
  created_at: string | null
}

export const feedbackService = {
  /**
   * Promedio y conteo de reseñas por producto, calculado a partir de las filas
   * `feedback_type = 'product'` en customer_feedback. Se agrega en el cliente
   * (una sola query) en vez de un RPC, ya que el volumen esperado es bajo.
   */
  async getProductRatingSummaries(): Promise<Record<number, ProductRatingSummary>> {
    const { data, error } = await (supabase as any)
      .from('customer_feedback')
      .select('product_id, rating')
      .eq('feedback_type', 'product') as {
        data: { product_id: number | null; rating: number }[] | null
        error: Error | null
      }

    if (error) throw error

    const totals: Record<number, { sum: number; count: number }> = {}
    ;(data || []).forEach((row) => {
      if (row.product_id == null) return
      if (!totals[row.product_id]) totals[row.product_id] = { sum: 0, count: 0 }
      totals[row.product_id].sum += row.rating
      totals[row.product_id].count += 1
    })

    const summaries: Record<number, ProductRatingSummary> = {}
    Object.entries(totals).forEach(([productId, { sum, count }]) => {
      summaries[Number(productId)] = { average: sum / count, count }
    })
    return summaries
  },

  /**
   * Reseñas generales (servicio, no producto) con buena calificación, para
   * mostrarlas como prueba social al cliente. Por defecto 4-5 estrellas.
   */
  async getGoodGeneralReviews(minRating = 4, limit = 30): Promise<GeneralReview[]> {
    const { data, error } = await (supabase as any)
      .from('customer_feedback')
      .select('id, customer_name, rating, comment, created_at')
      .eq('feedback_type', 'general')
      .gte('rating', minRating)
      .order('created_at', { ascending: false })
      .limit(limit) as { data: GeneralReview[] | null; error: Error | null }

    if (error) throw error
    return data || []
  },
}
