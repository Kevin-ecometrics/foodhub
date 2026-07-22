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
export type UserRole           = 'super_admin' | 'admin' | 'waiter'
export type MealType           = 'breakfast' | 'lunch' | 'both'
export type FeedbackType       = 'general' | 'product'

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
          meal_type: MealType
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
          meal_type?: MealType
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
          meal_type?: MealType
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
          course: number
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
          course?: number
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
          course?: number
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
          waiter_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          table_id: number
          customer_name: string
          amount: number
          payment_method?: string | null
          waiter_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          table_id?: number
          customer_name?: string
          amount?: number
          payment_method?: string | null
          waiter_id?: string | null
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
          feedback_type: FeedbackType
          product_id: number | null
          product_name: string | null
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
          feedback_type?: FeedbackType
          product_id?: number | null
          product_name?: string | null
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
          feedback_type?: FeedbackType
          product_id?: number | null
          product_name?: string | null
        }
      }

      // ── users ─────────────────────────────────────────────────────────────────
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: UserRole
          pin_code: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role: UserRole
          pin_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: UserRole
          pin_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // ── app_settings ──────────────────────────────────────────────────────────
      app_settings: {
        Row: {
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          key: string
          value?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          updated_at?: string
        }
      }

      // ── waiter_sessions ────────────────────────────────────────────────────────
      waiter_sessions: {
        Row: {
          id: string
          waiter_id: string
          waiter_name: string
          started_at: string
          ended_at: string | null
          total_sales: number
          created_at: string
        }
        Insert: {
          id?: string
          waiter_id: string
          waiter_name: string
          started_at?: string
          ended_at?: string | null
          total_sales?: number
          created_at?: string
        }
        Update: {
          id?: string
          waiter_id?: string
          waiter_name?: string
          started_at?: string
          ended_at?: string | null
          total_sales?: number
          created_at?: string
        }
      }

      // ── cash_reports ───────────────────────────────────────────────────────────
      cash_reports: {
        Row: {
          id: string
          report_number: number
          opened_at: string
          closed_at: string | null
          opening_cash: number
          counted_cash: number | null
          notes: string | null
          cash_sales: number
          terminal_sales: number
          usd_sales: number
          mixed_sales: number
          total_sales: number
          cash_tips: number
          terminal_tips: number
          usd_tips: number
          mixed_tips: number
          total_tips: number
          paid_accounts_count: number
          average_ticket: number
          subtotal: number
          tax_amount: number
          expected_cash: number
          cash_difference: number
          opened_by: string | null
          closed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          report_number?: number
          opened_at?: string
          closed_at?: string | null
          opening_cash?: number
          counted_cash?: number | null
          notes?: string | null
          cash_sales?: number
          terminal_sales?: number
          usd_sales?: number
          mixed_sales?: number
          total_sales?: number
          cash_tips?: number
          terminal_tips?: number
          usd_tips?: number
          mixed_tips?: number
          total_tips?: number
          paid_accounts_count?: number
          average_ticket?: number
          subtotal?: number
          tax_amount?: number
          expected_cash?: number
          cash_difference?: number
          opened_by?: string | null
          closed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          report_number?: number
          opened_at?: string
          closed_at?: string | null
          opening_cash?: number
          counted_cash?: number | null
          notes?: string | null
          cash_sales?: number
          terminal_sales?: number
          usd_sales?: number
          mixed_sales?: number
          total_sales?: number
          cash_tips?: number
          terminal_tips?: number
          usd_tips?: number
          mixed_tips?: number
          total_tips?: number
          paid_accounts_count?: number
          average_ticket?: number
          subtotal?: number
          tax_amount?: number
          expected_cash?: number
          cash_difference?: number
          opened_by?: string | null
          closed_by?: string | null
          created_at?: string
        }
      }

    }
  }
}

export type WaiterSession = Database['public']['Tables']['waiter_sessions']['Row']
