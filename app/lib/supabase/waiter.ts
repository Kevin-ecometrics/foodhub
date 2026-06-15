/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from './client'
import type { OrderItem } from './order-items'
import type {
  Database,
  NotificationType,
  NotificationStatus,
  TableStatus,
  OrderItemStatus,
  PaymentMethod,
} from './types'

export type { OrderItem }

// ─── DB shorthand types ───────────────────────────────────────────────────────
type WaiterNotifUpdate  = Database['public']['Tables']['waiter_notifications']['Update']
type OrderItemUpdate    = Database['public']['Tables']['order_items']['Update']
type TablesUpdate       = Database['public']['Tables']['tables']['Update']
type SalesHistoryInsert = Database['public']['Tables']['sales_history']['Insert']
type SalesItemInsert    = Database['public']['Tables']['sales_items']['Insert']

// ─── Nested query result types ────────────────────────────────────────────────
// Supabase v2 no infiere automáticamente joins anidados sin FK en el schema.
// Casteamos con `as unknown as T[]` después del query en lugar de .returns<>() (deprecado).

interface OrderItemRow {
  id: string
  order_id: string
  product_id: number
  product_name: string
  quantity: number
  status: string
  price: number
  notes: string | null
  cancelled_quantity: number
  created_at: string
}

interface OrderRow {
  id: string
  total_amount: number
  customer_name: string | null
  created_at: string
  status: string
  order_items: OrderItemRow[]
}

interface TableQueryRow {
  id: number
  number: number
  status: string
  capacity: number
  location: string | null
  orders: OrderRow[]
}

// ─── Public interfaces ────────────────────────────────────────────────────────
export interface WaiterNotification {
  id: string
  table_id: number
  order_id: string | null
  type: NotificationType
  message: string
  status: NotificationStatus
  payment_method: PaymentMethod
  tip_amount?: number | null
  created_at: string
  updated_at?: string
  tables?: { number: number }
  orders?: { total_amount: number; customer_name: string | null }
  table_number?: number
}

export interface TableOrder {
  id: string
  total_amount: number
  customer_name: string | null
  created_at: string
  status: 'sent' | 'completed'
  order_items: OrderItem[]
}

export interface TableWithOrder {
  id: number
  number: number
  status: TableStatus
  capacity: number
  location: string | null
  orders: TableOrder[]
}

// ─── Service ──────────────────────────────────────────────────────────────────
export const waiterService = {
  async getPendingNotifications(): Promise<WaiterNotification[]> {
    const { data, error } = await supabase
      .from('waiter_notifications')
      .select(`*, tables ( number ), orders ( total_amount, customer_name )`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    const validTypes: NotificationType[] = [
      'new_order', 'refill', 'assistance', 'bill_request', 'order_updated', 'table_freed',
    ]

    const rows = (data || []) as unknown as WaiterNotification[]
    return rows.map(n => ({
      ...n,
      type: validTypes.includes(n.type) ? n.type : 'assistance',
      ...(n.tables?.number && !n.table_number ? { table_number: n.tables.number } : {}),
    }))
  },

  async getTablesWithOrders(): Promise<TableWithOrder[]> {
    const { data, error } = await supabase
      .from('tables')
      .select(`
        *,
        orders (
          id, total_amount, customer_name, created_at, status,
          order_items ( id, order_id, product_id, product_name, quantity, status, price, notes, cancelled_quantity, created_at )
        )
      `)
      .order('number')

    if (error) throw error

    const tables = (data || []) as unknown as TableQueryRow[]

    return tables.map(table => ({
      id: table.id,
      number: table.number,
      status: table.status as TableStatus,
      capacity: table.capacity,
      location: table.location ?? null,
      orders: (table.orders || [])
        .filter(o => o.status === 'sent' || o.status === 'completed')
        .map(o => ({
          id: o.id,
          total_amount: o.total_amount,
          customer_name: o.customer_name,
          created_at: o.created_at,
          status: o.status as 'sent' | 'completed',
          order_items: (o.order_items || []).map(it => ({
            id: it.id,
            order_id: it.order_id,
            product_id: it.product_id,
            product_name: it.product_name,
            quantity: it.quantity,
            status: it.status as OrderItemStatus,
            price: it.price,
            notes: it.notes ?? null,
            cancelled_quantity: it.cancelled_quantity || 0,
            created_at: it.created_at,
          })),
        })),
    }))
  },

  async saveSalesHistory(
    tableId: number,
    tableNumber: number,
    paymentMethod: PaymentMethod = null
  ): Promise<string> {
    try {
      console.log(`💰 Guardando historial de venta para mesa ${tableNumber}, método: ${paymentMethod}`)

      const { data: rawOrders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id, total_amount, customer_name, created_at,
          order_items ( id, product_name, quantity, price, notes, status, cancelled_quantity )
        `)
        .eq('table_id', tableId)
        .in('status', ['sent', 'completed'])

      if (ordersError) throw ordersError
      if (!rawOrders || rawOrders.length === 0) throw new Error('No hay órdenes para guardar en el historial')

      const orders = rawOrders as unknown as OrderRow[]

      let totalAmount = 0
      let itemCount = 0
      let cancelledItemsCount = 0

      orders.forEach(order => {
        order.order_items.forEach(item => {
          const cancelledQty = item.cancelled_quantity || 0
          const actualQuantity = item.quantity - cancelledQty
          if (actualQuantity > 0) {
            totalAmount += (item.price ?? 0) * actualQuantity
            itemCount += actualQuantity
          }
          if (cancelledQty > 0) cancelledItemsCount += cancelledQty
        })
      })

      const orderCount = orders.length
      const customerName = orders[0]?.customer_name ?? null

      console.log(`📊 Resumen venta: $${totalAmount.toFixed(2)}, ${orderCount} órdenes, ${itemCount} items activos, ${cancelledItemsCount} canceladas`)

      const salePayload: SalesHistoryInsert = {
        table_id: tableId,
        table_number: tableNumber,
        customer_name: customerName,
        total_amount: totalAmount,
        order_count: orderCount,
        item_count: itemCount,
        payment_method: paymentMethod,
        closed_at: new Date().toISOString(),
      }

      const { data: rawSaleData, error: saleError } = await (supabase as any)
        .from('sales_history')
        .insert(salePayload)
        .select('id')
        .single() as { data: { id: string } | null; error: Error | null }

      if (saleError) throw saleError
      if (!rawSaleData) throw new Error('No se pudo crear el registro de venta')

      const saleId = rawSaleData.id

      const salesItems: SalesItemInsert[] = orders.flatMap(order =>
        order.order_items
          .filter(item => item.quantity - (item.cancelled_quantity || 0) > 0)
          .map(item => {
            const actualQuantity = item.quantity - (item.cancelled_quantity || 0)
            return {
              sale_id: saleId,
              product_name: item.product_name,
              price: item.price,
              quantity: actualQuantity,
              subtotal: (item.price ?? 0) * actualQuantity,
              notes: item.notes ?? null,
            }
          })
      )

      if (salesItems.length > 0) {
        const { error: itemsError } = await (supabase as any)
          .from('sales_items')
          .insert(salesItems) as { error: Error | null }
        if (itemsError) throw itemsError
      }

      console.log(`✅ Historial guardado: $${totalAmount.toFixed(2)}, ${orderCount} órdenes, ${salesItems.length} items, método: ${paymentMethod}`)
      return saleId
    } catch (err) {
      console.error('Error guardando historial de venta:', err)
      throw err
    }
  },

  async freeTableAndClean(
    tableId: number,
    tableNumber: number,
    paymentMethod: PaymentMethod = null
  ): Promise<string> {
    try {
      console.log(`🔄 Iniciando proceso completo para mesa ${tableNumber}, método: ${paymentMethod}`)

      const saleId = await this.saveSalesHistory(tableId, tableNumber, paymentMethod)

      const { error: notifError } = await supabase
        .from('waiter_notifications')
        .delete()
        .eq('table_id', tableId)
      if (notifError) throw notifError

      const { data: orderRows, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', tableId)
      if (ordersError) throw ordersError

      const orderIds = ((orderRows || []) as { id: string }[]).map(o => o.id)

      if (orderIds.length > 0) {
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds)
        if (itemsError) throw itemsError

        const { error: ordersDeleteError } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds)
        if (ordersDeleteError) throw ordersDeleteError
      }

      const tableUpdate: TablesUpdate = { status: 'available', updated_at: new Date().toISOString() }
      const { error: tableError } = await (supabase as any)
        .from('tables')
        .update(tableUpdate)
        .eq('id', tableId) as { error: Error | null }
      if (tableError) throw tableError

      console.log(`✅ Mesa ${tableNumber} procesada completamente`)
      return saleId
    } catch (err) {
      console.error('❌ Error en proceso completo:', err)
      throw err
    }
  },

  async acknowledgeNotification(notificationId: string): Promise<void> {
    const payload: WaiterNotifUpdate = { status: 'acknowledged', updated_at: new Date().toISOString() }
    const { error } = await (supabase as any)
      .from('waiter_notifications')
      .update(payload)
      .eq('id', notificationId) as { error: Error | null }
    if (error) throw error
  },

  async completeNotification(notificationId: string): Promise<void> {
    const payload: WaiterNotifUpdate = { status: 'completed', updated_at: new Date().toISOString() }
    const { error } = await (supabase as any)
      .from('waiter_notifications')
      .update(payload)
      .eq('id', notificationId) as { error: Error | null }
    if (error) throw error
  },

  async updateItemStatus(itemId: string, status: OrderItemStatus): Promise<void> {
    const payload: OrderItemUpdate = { status, updated_at: new Date().toISOString() }
    const { error } = await (supabase as any)
      .from('order_items')
      .update(payload)
      .eq('id', itemId) as { error: Error | null }
    if (error) throw error
  },

  async cancelOrderItem(itemId: string, cancelQuantity: number = 1): Promise<void> {
    try {
      console.log(`🔄 Cancelando ${cancelQuantity} unidad(es) del item ${itemId}`)

      const { data, error: fetchError } = await supabase
        .from('order_items')
        .select('id, quantity, status, cancelled_quantity')
        .eq('id', itemId)
        .maybeSingle()

      if (fetchError) throw fetchError
      if (!data) throw new Error('Item no encontrado')

      const item = data as unknown as OrderItemRow
      const currentCancelled = item.cancelled_quantity ?? 0
      const newCancelledQuantity = currentCancelled + cancelQuantity
      const remainingQuantity = item.quantity - newCancelledQuantity

      console.log(`📊 ${item.quantity} total, ${currentCancelled} cancelados, ${remainingQuantity} restantes`)

      const newStatus: OrderItemStatus = remainingQuantity <= 0 ? 'cancelled' : item.status as OrderItemStatus

      const payload: OrderItemUpdate = {
        status: newStatus,
        cancelled_quantity: newCancelledQuantity,
        updated_at: new Date().toISOString(),
      }

      const { error } = await (supabase as any)
        .from('order_items')
        .update(payload)
        .eq('id', itemId) as { error: Error | null }
      if (error) throw error

      console.log(`✅ Canceladas ${cancelQuantity} unidad(es). Nuevo estado: ${newStatus}`)
    } catch (error) {
      console.error('Error cancelando item:', error)
      throw error
    }
  },
}
