export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Domain Enums ─────────────────────────────────────────────────────────────
// Fuente de verdad para todos los union types del sistema.
// Los servicios y componentes deben importar desde aquí, no redefinir.

export type NotificationType =
  | 'new_order'
  | 'refill'
  | 'assistance'
  | 'bill_request'
  | 'order_updated'
  | 'table_freed'

export type NotificationStatus = 'pending' | 'acknowledged' | 'completed'
export type TableStatus        = 'available' | 'occupied' | 'reserved' | 'cleaning'
export type OrderItemStatus    = 'ordered' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type OrderStatus        = 'active' | 'pending' | 'sent' | 'completed' | 'cancelled' | 'paid'
export type PaymentMethod      = 'cash' | 'terminal' | 'usd' | 'mixed' | null

// ─── Shared Interfaces ────────────────────────────────────────────────────────

export interface ProductExtra {
  id?: string
  name: string
  price: number
  is_available: boolean
}

// ─── Database Schema ──────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {

      // ── tables ──────────────────────────────────────────────────────────────
      tables: {
        Row: {
          id: number
          number: number
          status: TableStatus
          capacity: number
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          number: number
          status?: TableStatus
          capacity: number
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          number?: number
          status?: TableStatus
          capacity?: number
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── products ─────────────────────────────────────────────────────────────
      products: {
        Row: {
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
          rating_count: number
          extras: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          price: number
          category: string
          image_url?: string | null
          is_available?: boolean
          is_favorite?: boolean
          preparation_time?: number | null
          rating?: number
          rating_count?: number
          extras?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          price?: number
          category?: string
          image_url?: string | null
          is_available?: boolean
          is_favorite?: boolean
          preparation_time?: number | null
          rating?: number
          rating_count?: number
          extras?: Json
          created_at?: string
          updated_at?: string
        }
      }

      // ── orders ───────────────────────────────────────────────────────────────
      // status real en DB: 'active' (historyService) | 'pending' (ordersService)
      // → 'sent' → 'completed' | 'cancelled' | 'paid'
      orders: {
        Row: {
          id: string
          table_id: number
          customer_name: string | null
          status: OrderStatus
          total_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id: number
          customer_name?: string | null
          status?: OrderStatus
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: number
          customer_name?: string | null
          status?: OrderStatus
          total_amount?: number
          created_at?: string
          updated_at?: string
        }
      }

      // ── order_items ───────────────────────────────────────────────────────────
      order_items: {
        Row: {
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
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: number
          product_name: string
          price: number
          quantity?: number
          notes?: string | null
          status?: OrderItemStatus
          cancelled_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: number
          product_name?: string
          price?: number
          quantity?: number
          notes?: string | null
          status?: OrderItemStatus
          cancelled_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }

      // ── categories ───────────────────────────────────────────────────────────
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          description: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // ── waiter_notifications ──────────────────────────────────────────────────
      waiter_notifications: {
        Row: {
          id: string
          table_id: number
          order_id: string | null
          type: NotificationType
          message: string
          status: NotificationStatus
          payment_method: string | null
          tip_amount: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          table_id: number
          order_id?: string | null
          type: NotificationType
          message: string
          status?: NotificationStatus
          payment_method?: string | null
          tip_amount?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          table_id?: number
          order_id?: string | null
          type?: NotificationType
          message?: string
          status?: NotificationStatus
          payment_method?: string | null
          tip_amount?: number | null
          created_at?: string
          updated_at?: string | null
        }
      }

      // ── tips ─────────────────────────────────────────────────────────────────
      tips: {
        Row: {
          id: string
          order_id: string | null
          table_id: number
          customer_name: string
          amount: number
          payment_method: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          table_id: number
          customer_name: string
          amount: number
          payment_method?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          table_id?: number
          customer_name?: string
          amount?: number
          payment_method?: string | null
          created_at?: string
        }
      }

      // ── sales_history ─────────────────────────────────────────────────────────
      sales_history: {
        Row: {
          id: string
          table_id: number
          table_number: number
          customer_name: string | null
          total_amount: number
          order_count: number
          item_count: number
          payment_method: string | null
          created_at: string
          closed_at: string
        }
        Insert: {
          id?: string
          table_id: number
          table_number: number
          customer_name?: string | null
          total_amount: number
          order_count: number
          item_count: number
          payment_method?: string | null
          created_at?: string
          closed_at?: string
        }
        Update: {
          id?: string
          table_id?: number
          table_number?: number
          customer_name?: string | null
          total_amount?: number
          order_count?: number
          item_count?: number
          payment_method?: string | null
          created_at?: string
          closed_at?: string
        }
      }

      // ── sales_items ───────────────────────────────────────────────────────────
      sales_items: {
        Row: {
          id: string
          sale_id: string
          product_name: string
          price: number
          quantity: number
          subtotal: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          sale_id: string
          product_name: string
          price: number
          quantity: number
          subtotal: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          sale_id?: string
          product_name?: string
          price?: number
          quantity?: number
          subtotal?: number
          notes?: string | null
          created_at?: string
        }
      }

      // ── customer_feedback ─────────────────────────────────────────────────────
      customer_feedback: {
        Row: {
          id: string
          table_id: string
          customer_name: string
          rating: number
          comment: string | null
          order_count: number
          total_amount: number
          created_at: string | null
        }
        Insert: {
          id?: string
          table_id: string
          customer_name: string
          rating: number
          comment?: string | null
          order_count: number
          total_amount: number
          created_at?: string | null
        }
        Update: {
          id?: string
          table_id?: string
          customer_name?: string
          rating?: number
          comment?: string | null
          order_count?: number
          total_amount?: number
          created_at?: string | null
        }
      }

    }
  }
}
