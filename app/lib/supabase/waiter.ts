import { supabase } from './client'

// Tipos base
type NotificationType =
  | 'new_order'
  | 'refill'           // ¡Ahora incluido en el tipo!
  | 'assistance'
  | 'bill_request'
  | 'order_updated'
  | 'table_freed'

type NotificationStatus = 'pending' | 'acknowledged' | 'completed'
type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'
type OrderItemStatus = 'ordered' | 'preparing' | 'ready' | 'served' | 'cancelled'
type OrderStatus = 'sent' | 'completed'
type PaymentMethod = 'cash' | 'terminal' | null

// Interfaces públicas (para tu lógica)
export interface WaiterNotification {
  id: string
  table_id: number
  order_id: string | null
  type: NotificationType  // ¡Ahora incluye 'refill'!
  message: string
  status: NotificationStatus
  payment_method: PaymentMethod
  created_at: string
  updated_at?: string
  tables?: {
    number: number
  }
  orders?: {
    total_amount: number
    customer_name: string | null
  }
  // Agregar campo para table_number directo (para casos donde no haya join)
  table_number?: number
}

export interface OrderItem {
  id: string
  product_name: string
  quantity: number
  status: OrderItemStatus
  price: number
  notes?: string
  order_id?: string
  cancelled_quantity?: number
}

export interface Order {
  id: string
  total_amount: number
  customer_name: string | null
  created_at: string
  status: OrderStatus
  order_items: OrderItem[]
}

export interface TableWithOrder {
  id: number
  number: number
  status: TableStatus
  capacity: number
  location: string | null
  orders: Order[]
}

// -----------------------------
// Tipos internos que mapean filas de la DB (mínimos necesarios)
// -----------------------------
interface OrderRow {
  id: string
  table_id?: number
  total_amount: number
  customer_name: string | null
  created_at: string
  status: OrderStatus
  order_items?: {
    status: string
    id: string
    product_name: string
    quantity: number
    price: number
    notes?: string | null
    order_id?: string
    cancelled_quantity?: number
  }[]
}

interface TableRow {
  id: number
  number: number
  status: TableStatus
  capacity: number
  location?: string | null
  updated_at?: string
}

interface SalesHistoryRow {
  id: string
  table_id: number
  table_number: number
  customer_name?: string | null
  total_amount: number
  order_count: number
  item_count: number
  payment_method: PaymentMethod
  closed_at: string
}

interface SalesItemRow {
  id?: string
  sale_id: string
  product_name: string
  price: number
  quantity: number
  subtotal: number
  notes?: string | null
}

// NUEVO: Interface para order_items con cancelled_quantity
interface OrderItemRow {
  id: string
  order_id: string
  product_id: number
  product_name: string
  price: number
  quantity: number
  notes?: string | null
  status: OrderItemStatus
  created_at: string
  updated_at: string
  cancelled_quantity?: number
}

// Helpers tipados -> permitimos cualquier tipo (objeto o array)
function assertUpdate<T>(data: T): T {
  return data
}

function assertInsert<T>(data: T): T {
  return data
}

// Servicio principal
export const waiterService = {
  async getPendingNotifications(): Promise<WaiterNotification[]> {
    const { data, error } = await supabase
      .from('waiter_notifications')
      .select(
        `
        *,
        tables ( number ),
        orders ( total_amount, customer_name )
      `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .returns<WaiterNotification[]>()

    if (error) throw error
    
    // Procesar los datos para asegurar que table_number esté disponible
    const processedData = (data || []).map(notification => {
      // Asegurar que table_number esté disponible
      const tableNumber = notification.tables?.number || notification.table_number || 0;
      
      // También podríamos asegurar que type sea válido
      const validTypes: NotificationType[] = ['new_order', 'refill', 'assistance', 'bill_request', 'order_updated', 'table_freed'];
      const notificationType: NotificationType = validTypes.includes(notification.type as NotificationType) 
        ? notification.type as NotificationType 
        : 'assistance'; // Valor por defecto
      
      return {
        ...notification,
        type: notificationType,
        // Agregar table_number si no está presente
        ...(notification.tables?.number && !notification.table_number 
          ? { table_number: notification.tables.number } 
          : {})
      };
    });
    
    return processedData;
  },

  async getTablesWithOrders(): Promise<TableWithOrder[]> {
    const { data, error } = await supabase
      .from('tables')
      .select(
        `
        *,
        orders (
          id,
          total_amount,
          customer_name,
          created_at,
          status,
          order_items (
            id,
            product_name,
            quantity,
            status,
            price,
            notes,
            cancelled_quantity
          )
        )
      `
      )
      .order('number')
      .returns<
        (
          TableRow & {
            orders?: {
              id: string
              total_amount: number
              customer_name: string | null
              created_at: string
              status: OrderStatus
              order_items?: {
                id: string
                product_name: string
                quantity: number
                status: OrderItemStatus
                price: number
                notes?: string | null
                cancelled_quantity?: number
              }[]
            }[]
          }
        )[]
      >()

    if (error) throw error

    const tables = data || []

    // Normalizamos a tu interface TableWithOrder
    return tables.map((table) => ({
      id: table.id,
      number: table.number,
      status: table.status,
      capacity: table.capacity,
      location: table.location ?? null,
      orders:
        (table.orders || [])
          .filter((order) => order.status === 'sent' || order.status === 'completed')
          .map((order) => ({
            id: order.id,
            total_amount: order.total_amount,
            customer_name: order.customer_name,
            created_at: order.created_at,
            status: order.status,
            order_items:
              (order.order_items || []).map((it) => ({
                id: it.id,
                product_name: it.product_name,
                quantity: it.quantity,
                status: it.status,
                price: it.price,
                notes: it.notes ?? undefined,
                cancelled_quantity: it.cancelled_quantity || 0,
                order_id: undefined,
              })) || [],
          })) || [],
    }))
  },

async saveSalesHistory(
  tableId: number,
  tableNumber: number,
  paymentMethod: PaymentMethod = null
): Promise<string> {
  try {
    console.log(`💰 Guardando historial de venta para mesa ${tableNumber}, método: ${paymentMethod}`)

    // Obtener órdenes con sus items INCLUYENDO cancelled_quantity
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(
        `
        id,
        total_amount,
        customer_name,
        created_at,
        order_items (
          id,
          product_name,
          quantity,
          price,
          notes,
          status,
          cancelled_quantity
        )
      `
      )
      .eq('table_id', tableId)
      .in('status', ['sent', 'completed'])
      .returns<OrderRow[]>()

    if (ordersError) throw ordersError
    if (!orders || orders.length === 0) {
      throw new Error('No hay órdenes para guardar en el historial')
    }

    // Calcular totales CONSIDERANDO cancelled_quantity
    let totalAmount = 0;
    let itemCount = 0;
    let cancelledItemsCount = 0;

    orders.forEach((order) => {
      if (order.order_items) {
        order.order_items.forEach((item) => {
          // Calcular cantidad REAL (excluyendo cancelados)
          const cancelledQty = item.cancelled_quantity || 0;
          const actualQuantity = item.quantity - cancelledQty;
          
          // Solo contar items con cantidad activa > 0
          if (actualQuantity > 0) {
            totalAmount += (item.price ?? 0) * actualQuantity;
            itemCount += actualQuantity;
          }
          
          // Contar cancelados para el log
          if (cancelledQty > 0) {
            cancelledItemsCount += cancelledQty;
          }
        });
      }
    });

    const orderCount = orders.length
    const customerName = orders[0]?.customer_name ?? null

    console.log(`📊 Resumen venta: $${totalAmount.toFixed(2)}, ${orderCount} órdenes, ${itemCount} items activos, ${cancelledItemsCount} unidades canceladas excluidas`)

    // Insertamos el historial CON el método de pago
    const { data: saleData, error: saleError } = await supabase
      .from('sales_history')
      .insert(
        assertInsert({
          table_id: tableId,
          table_number: tableNumber,
          customer_name: customerName,
          total_amount: totalAmount,
          order_count: orderCount,
          item_count: itemCount,
          payment_method: paymentMethod,
          closed_at: new Date().toISOString(),
        } as never)
      )
      .select()
      .single()

    if (saleError) throw saleError
    if (!saleData) throw new Error('No se pudo crear el registro de venta')

    const sale = saleData as SalesHistoryRow

    // Crear sales_items CONSIDERANDO cancelled_quantity
    const salesItems: SalesItemRow[] = orders.flatMap((order) =>
      (order.order_items || [])
        .filter(item => {
          // Filtrar items que tengan cantidad activa > 0
          const cancelledQty = item.cancelled_quantity || 0;
          const actualQuantity = item.quantity - cancelledQty;
          return actualQuantity > 0;
        })
        .map((item) => {
          const cancelledQty = item.cancelled_quantity || 0;
          const actualQuantity = item.quantity - cancelledQty;
          
          return {
            sale_id: sale.id,
            product_name: item.product_name,
            price: item.price,
            quantity: actualQuantity, // ← Usar cantidad REAL
            subtotal: (item.price ?? 0) * actualQuantity, // ← Calcular con cantidad REAL
            notes: item.notes ?? null,
          }
        })
    )

    if (salesItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('sales_items')
        .insert(assertInsert(salesItems) as never)
      if (itemsError) throw itemsError
    }

    console.log(
      `✅ Historial guardado: $${totalAmount.toFixed(2)}, ${orderCount} órdenes, ${salesItems.length} items activos, ${cancelledItemsCount} unidades canceladas excluidas, método: ${paymentMethod}`
    )
    return sale.id
  } catch (err) {
    console.error('Error guardando historial de venta:', err)
    throw err
  }
},

  async freeTableAndClean(
    tableId: number,
    tableNumber: number,
    paymentMethod: PaymentMethod = null
  ): Promise<void> {
    try {
      console.log(`🔄 Iniciando proceso completo para mesa ${tableNumber}, método: ${paymentMethod}`)

      await this.saveSalesHistory(tableId, tableNumber, paymentMethod)

      console.log(`🗑️ Eliminando notificaciones para mesa ${tableId}`)
      const { error: notificationsError } = await supabase
        .from('waiter_notifications')
        .delete()
        .eq('table_id', tableId)

      if (notificationsError) throw notificationsError

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .eq('table_id', tableId)
        .returns<{ id: string }[]>()

      if (ordersError) throw ordersError

      const orderIds = orders?.map((order) => order.id) || []

      if (orderIds.length > 0) {
        console.log(`🗑️ Eliminando order_items para ${orderIds.length} órdenes`)
        const { error: itemsError } = await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds)

        if (itemsError) throw itemsError

        console.log(`🗑️ Eliminando órdenes`)
        const { error: ordersDeleteError } = await supabase
          .from('orders')
          .delete()
          .in('id', orderIds)

        if (ordersDeleteError) throw ordersDeleteError
      }

      console.log(`🔄 Liberando mesa ${tableId}`)
      const { error: tableError } = await supabase
        .from('tables')
        .update(
          assertUpdate({
            status: 'available' as TableStatus,
            updated_at: new Date().toISOString(),
          } as never)
        )
        .eq('id', tableId)

      if (tableError) throw tableError

      console.log(`✅ Mesa ${tableNumber} procesada completamente, método: ${paymentMethod}`)
    } catch (err) {
      console.error('❌ Error en proceso completo:', err)
      throw err
    }
  },

  async acknowledgeNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .update(
        assertUpdate({
          status: 'acknowledged' as NotificationStatus,
          updated_at: new Date().toISOString(),
        } as never)
      )
      .eq('id', notificationId)

    if (error) throw error
  },

  async completeNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('waiter_notifications')
      .update(
        assertUpdate({
          status: 'completed' as NotificationStatus,
          updated_at: new Date().toISOString(),
        } as never)
      )
      .eq('id', notificationId)

    if (error) throw error
  },

  async updateItemStatus(itemId: string, status: OrderItemStatus): Promise<void> {
    const { error } = await supabase
      .from('order_items')
      .update(
        assertUpdate({
          status,
          updated_at: new Date().toISOString(),
        } as never)
      )
      .eq('id', itemId)

    if (error) throw error
  },

async cancelOrderItem(itemId: string, cancelQuantity: number = 1) {
  try {
    console.log(`🔄 Cancelando ${cancelQuantity} unidad(es) del item ${itemId}`);

    // Obtener item actual
    const { data, error: fetchError } = await supabase
      .from('order_items')
      .select('*')
      .eq('id', itemId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!data) throw new Error('Item no encontrado');

    // Aseguramos el tipo
    const item = data as OrderItemRow;

    const currentCancelled = item.cancelled_quantity ?? 0;
    const newCancelledQuantity = currentCancelled + cancelQuantity;
    const remainingQuantity = item.quantity - newCancelledQuantity;

    console.log(
      `📊 Estado actual: ${item.quantity} total, ${currentCancelled} cancelados, ${remainingQuantity} restantes`
    );

    // Determinar el nuevo estado
    const newStatus =
      remainingQuantity <= 0 ? 'cancelled' : item.status;

    const updateData: Partial<OrderItemRow> = {
      status: newStatus,
      cancelled_quantity: newCancelledQuantity,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('order_items')
      .update(updateData as never)
      .eq('id', itemId);

    if (error) throw error;

    console.log(
      `✅ Canceladas ${cancelQuantity} unidad(es). Nuevo estado: ${newStatus}`
    );
  } catch (error) {
    console.error('Error cancelando item:', error);
    throw error;
  }
}
}