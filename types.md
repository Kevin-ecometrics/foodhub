# ScanEat — Type System Reference

> Fuente de verdad: `app/lib/supabase/types.ts`
> El cliente Supabase está tipado con `createClient<Database>()` — todos los queries heredan los tipos automáticamente.

---

## Domain Enums

Exportados desde `types.ts`. **No redefinir en servicios ni componentes — importar desde aquí.**

```ts
import type { NotificationType, OrderStatus, ... } from '@/app/lib/supabase/types'
```

| Export | Valores |
|---|---|
| `NotificationType` | `'new_order' \| 'refill' \| 'assistance' \| 'bill_request' \| 'order_updated' \| 'table_freed'` |
| `NotificationStatus` | `'pending' \| 'acknowledged' \| 'completed'` |
| `TableStatus` | `'available' \| 'occupied' \| 'reserved' \| 'cleaning'` |
| `OrderItemStatus` | `'ordered' \| 'preparing' \| 'ready' \| 'served' \| 'cancelled'` |
| `OrderStatus` | `'active' \| 'pending' \| 'sent' \| 'completed' \| 'cancelled' \| 'paid'` |
| `PaymentMethod` | `'cash' \| 'terminal' \| 'usd' \| 'mixed' \| null` |

### Notas sobre OrderStatus

Hay dos servicios que crean órdenes con status inicial distinto:

| Servicio | Status inicial | Usado en |
|---|---|---|
| `historyService.createOrder` | `'active'` | Customer portal |
| `ordersService.createOrder` | `'pending'` | OrderContext legacy |

El waiter solo consume `'sent'` y `'completed'`. El flujo real es:
```
active/pending → sent → completed | cancelled | paid
```

---

## Shared Interfaces

### `ProductExtra`
```ts
interface ProductExtra {
  id?: string
  name: string
  price: number
  is_available: boolean
}
```
Almacenada como JSONB en `products.extras`. Formato: `[{ name, price, is_available }]`.

---

## Database Tables

### `tables`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `number` PK | auto-increment |
| `number` | `number` | número de mesa visible |
| `status` | `TableStatus` | available / occupied / reserved / cleaning |
| `capacity` | `number` | |
| `location` | `string \| null` | nullable |
| `created_at` | `string` | ISO timestamp |
| `updated_at` | `string` | ISO timestamp |

---

### `products`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `number` PK | |
| `name` | `string` | |
| `description` | `string \| null` | |
| `price` | `number` | en centavos MXN |
| `category` | `string` | nombre de categoría (FK ref) |
| `image_url` | `string \| null` | |
| `is_available` | `boolean` | default true |
| `is_favorite` | `boolean` | default false |
| `preparation_time` | `number \| null` | minutos |
| `rating` | `number` | promedio acumulado, default 0 |
| `rating_count` | `number` | número de ratings, default 0 |
| `extras` | `Json` | array de `ProductExtra`, default `[]` |
| `created_at` | `string` | |
| `updated_at` | `string` | |

**Importante:** `rating` llega como string de Postgres — los servicios hacen `parseFloat()`. Una vez que los types estén aplicados completamente esto no será necesario.

---

### `orders`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `string` PK | uuid |
| `table_id` | `number` FK→tables | |
| `customer_name` | `string \| null` | nombre del comensal |
| `status` | `OrderStatus` | ver flujo arriba |
| `total_amount` | `number` | |
| `created_at` | `string` | |
| `updated_at` | `string` | |

---

### `order_items`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `string` PK | uuid |
| `order_id` | `string` FK→orders | |
| `product_id` | `number` FK→products | |
| `product_name` | `string` | snapshot del nombre al momento de ordenar |
| `price` | `number` | snapshot del precio |
| `quantity` | `number` | default 1 |
| `notes` | `string \| null` | incluye extras formateados |
| `status` | `OrderItemStatus` | ordered→preparing→ready→served / cancelled |
| `cancelled_quantity` | `number` | default 0, soporta cancelación parcial |
| `created_at` | `string` | |
| `updated_at` | `string` | |

**Nota sobre cancelaciones:** `cancelled_quantity` acumula unidades canceladas. La cantidad activa real es `quantity - cancelled_quantity`. El status cambia a `'cancelled'` solo cuando `cancelled_quantity >= quantity`.

---

### `categories`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `number` PK | |
| `name` | `string` | |
| `slug` | `string` UNIQUE | |
| `description` | `string` | default `''` |
| `display_order` | `number` | default 0 |
| `is_active` | `boolean` | default true |
| `created_at` | `string` | |
| `updated_at` | `string` | |

---

### `waiter_notifications`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `string` PK | uuid |
| `table_id` | `number` FK→tables | |
| `order_id` | `string \| null` FK→orders | nullable |
| `type` | `NotificationType` | |
| `message` | `string` | |
| `status` | `NotificationStatus` | default `'pending'` |
| `payment_method` | `string \| null` | cash / terminal / usd / mixed |
| `tip_amount` | `number \| null` | propina sugerida por el cliente |
| `created_at` | `string` | |
| `updated_at` | `string \| null` | |

**Flujo de tip_amount:**
1. Customer selecciona propina en `/customer/payment`
2. UPDATE `waiter_notifications.tip_amount` con el monto
3. Waiter ve el badge "💬 Cliente sugirió $X" al abrir PaymentCalculator
4. Al confirmar pago → INSERT en `tips` si tip > 0

---

### `tips`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `string` PK | uuid |
| `order_id` | `string \| null` | FK→orders, nullable |
| `table_id` | `number` FK→tables | |
| `customer_name` | `string` | ej. "Mesa 5" |
| `amount` | `number` | monto final cobrado |
| `payment_method` | `string \| null` | |
| `created_at` | `string` | |

---

### `sales_history`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `string` PK | uuid |
| `table_id` | `number` FK→tables | |
| `table_number` | `number` | snapshot del número de mesa |
| `customer_name` | `string \| null` | primer comensal de la mesa |
| `total_amount` | `number` | total neto (excluyendo cancelados) |
| `order_count` | `number` | número de órdenes en la sesión |
| `item_count` | `number` | items activos (sin cancelados) |
| `payment_method` | `string \| null` | método de pago final |
| `created_at` | `string` | |
| `closed_at` | `string` | momento en que se cerró la mesa |

---

### `sales_items`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `string` PK | uuid |
| `sale_id` | `string` FK→sales_history | |
| `product_name` | `string` | snapshot |
| `price` | `number` | precio unitario |
| `quantity` | `number` | cantidad activa (ya sin cancelados) |
| `subtotal` | `number` | `price * quantity` |
| `notes` | `string \| null` | |
| `created_at` | `string` | |

---

### `customer_feedback`
| Columna | Tipo | Notas |
|---|---|---|
| `id` | `string` PK | uuid |
| `table_id` | `string` | número de mesa como string |
| `customer_name` | `string` | |
| `rating` | `number` | CHECK 1–5 |
| `comment` | `string \| null` | |
| `order_count` | `number` | órdenes del comensal en la sesión |
| `total_amount` | `number` | consumo total del comensal |
| `created_at` | `string \| null` | |

---

## Interfaces de Servicio

Estas interfaces están definidas en sus respectivos servicios. Los componentes deben importarlas desde ahí, no redefinir localmente.

| Interface | Archivo | Descripción |
|---|---|---|
| `OrderItem` | `order-items.ts` | Item con `cancelled_quantity` |
| `Order` | `orders.ts` | Orden básica sin items |
| `OrderWithItems` | `history.ts` | Orden con `order_items` y join a `products` |
| `OrderItemWithProduct` | `history.ts` | Item con join a `products` (image_url, prep_time) |
| `Product` | `products.ts` | Producto con `extras: ProductExtra[]` |
| `WaiterNotification` | `waiter.ts` | Notificación con joins a `tables` y `orders` |
| `TableWithOrder` | `waiter.ts` | Mesa con `orders: Order[]` anidados |
| `Tip` | `tips.ts` | Propina individual |
| `Category` | `categories.ts` | Categoría con `MenuCategory` y `VirtualCategory` |

---

## Interfaces de Admin

Definidas en `app/admin/types.ts`. Solo para uso interno del dashboard admin.

| Interface | Descripción |
|---|---|
| `DailyStats` | Métricas del día (ingresos, propinas, órdenes, etc.) |
| `OrderSummary` | Resumen de orden para tabla del dashboard |
| `PopularProduct` | Producto con total_quantity y total_revenue |
| `SalesHistory` | Historial de venta (mirror de DB) |
| `SalesSummary` | Totales agregados del período |
| `RestaurantTable` | Mesa con relaciones de órdenes |
| `Product` | Producto completo incluyendo extras (para forms) |
| `ProductExtra` | Extra con id, name, price, is_available |
| `AdminSection` | Union type de secciones del sidebar |
| `TableFormData` | Formulario de mesa (strings para inputs) |
| `ProductFormData` | Formulario de producto (strings para inputs) |

---

## Patrones comunes

### Query tipado automático
```ts
// ✅ Correcto — el tipo viene de Database
const { data } = await supabase
  .from('order_items')
  .select('cancelled_quantity, quantity')
  .eq('id', itemId)
  .single()
// data es: { cancelled_quantity: number, quantity: number } | null

// ❌ Incorrecto — sintaxis Supabase v1, colapsa a never
const { data } = await supabase
  .from<{ cancelled_quantity: number }>('order_items')
  .select(...)
```

### Insert tipado
```ts
// ✅ Correcto — Database['public']['Tables']['tips']['Insert']
await supabase.from('tips').insert({
  table_id: 1,
  customer_name: 'Mesa 5',
  amount: 50,
})

// ❌ Incorrecto — oculta errores de tipos
await supabase.from('tips').insert({ ... } as any)
```

### Casts permitidos
- `as never` en `.insert()` / `.update()` → **eliminar** cuando types.ts esté completo
- `error: any` en catch blocks → **aceptable**, es la convención de TS para errores
- `(data as MyInterface[])` en `.returns<>()` sin schema → **usar `.returns<MyInterface[]>()`** mejor

---

## Pendiente (ver PROGRESS.md sección T4–T6)

- [ ] Eliminar `as never` / `as any` en servicios — resuelto al aplicar tipos completos
- [ ] Unificar interfaces duplicadas de `Product`, `Order`, `OrderItem`
- [ ] Tipar props de componentes: `OrderItem.tsx`, `CustomerOrderSection.tsx`, `TableCard.tsx`, `TableHeader.tsx`
- [ ] Reconciliar `OrderStatus` entre `ordersService` (`pending`) y `historyService` (`active`)
