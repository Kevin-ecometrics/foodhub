# ScanEat — Progress Tracker

> Restaurant management platform with real-time ordering, table management, and payment processing.
> Stack: Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase (PostgreSQL + Realtime)
> Package manager: **Bun** · Project codename in package.json: `menu-jp` · Brand: **ScanEat**

---

## Database Schema (Supabase PostgreSQL)

All tables have RLS enabled.

### `tables`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | integer PK | auto-increment | |
| number | integer | — | mesa número |
| status | varchar | `'available'` | available / occupied |
| capacity | integer | — | |
| location | varchar | — | nullable |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

### `categories`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | integer PK | auto-increment | |
| name | varchar | — | |
| slug | varchar UNIQUE | — | |
| description | text | `''` | nullable |
| display_order | integer | 0 | |
| is_active | boolean | true | |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

### `products`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | integer PK | auto-increment | |
| name | varchar | — | |
| description | text | — | nullable |
| price | integer | — | en centavos MXN |
| category | varchar | — | FK reference |
| image_url | varchar | — | nullable |
| is_available | boolean | true | |
| preparation_time | integer | — | nullable, minutos |
| rating | numeric | 0.0 | promedio acumulado |
| rating_count | integer | 0 | número de ratings |
| is_favorite | boolean | false | |
| extras | jsonb | `[]` | add-ons con precio |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

### `orders`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | gen_random_uuid() | |
| table_id | integer FK→tables | — | |
| customer_name | varchar | — | nullable |
| status | varchar | `'active'` | active / sent / closed |
| total_amount | numeric | 0 | |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

### `order_items`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | gen_random_uuid() | |
| order_id | uuid FK→orders | — | |
| product_id | integer FK→products | — | |
| product_name | varchar | — | snapshot del nombre |
| price | numeric | — | snapshot del precio |
| quantity | integer | 1 | |
| notes | text | — | nullable, notas + extras |
| status | varchar | `'ordered'` | ordered→preparing→ready→served / cancelled |
| cancelled_quantity | integer | 0 | cancelaciones parciales |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | |

### `waiter_notifications`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | gen_random_uuid() | |
| table_id | integer FK→tables | — | |
| order_id | uuid FK→orders | — | nullable |
| type | varchar | — | new_order / refill / assistance / bill_request |
| message | text | — | |
| status | varchar | `'pending'` | pending / completed / cancelled |
| payment_method | varchar | — | nullable: cash / terminal / usd / mixed |
| tip_amount | numeric | 0 | **propina sugerida por el cliente** (nullable) |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | nullable |

### `tips`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | gen_random_uuid() | |
| order_id | uuid | — | nullable FK→orders |
| table_id | integer FK→tables | — | |
| customer_name | text | — | ej. "Mesa 5" |
| amount | numeric | 0 | monto final de propina cobrada |
| payment_method | text | — | nullable |
| created_at | timestamptz | now() | |

### `sales_history`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | gen_random_uuid() | |
| table_id | integer FK→tables | — | |
| table_number | integer | — | snapshot |
| customer_name | varchar | — | nullable |
| total_amount | numeric | 0 | |
| order_count | integer | 0 | |
| item_count | integer | 0 | |
| payment_method | varchar | — | nullable |
| created_at | timestamptz | now() | |
| closed_at | timestamptz | now() | |

### `sales_items`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | gen_random_uuid() | |
| sale_id | uuid FK→sales_history | — | |
| product_name | varchar | — | |
| price | numeric | — | |
| quantity | integer | 1 | |
| subtotal | numeric | — | |
| notes | text | — | nullable |

### `customer_feedback`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | gen_random_uuid() | |
| table_id | text | — | |
| customer_name | text | — | |
| rating | integer | — | CHECK 1–5 |
| comment | text | — | nullable |
| order_count | integer | — | |
| total_amount | numeric | — | |
| created_at | timestamptz | now() | nullable |

---

## Realtime Channels

| Canal | Escucha | Usado en |
|---|---|---|
| `table-{id}-notifications` | INSERT/UPDATE `waiter_notifications` | OrderContext (customer) |
| `table-{id}-orders` | `*` en `orders` | Payment.tsx |
| `table-{id}-payments` | `*` en `waiter_notifications` | Payment.tsx |
| waiter subscriptions | `orders`, `order_items`, `tables`, `waiter_notifications` | waiter/page.tsx |

---

## Flujo General del Sistema

```
Customer (QR scan)
  └─ /customer → ingresa nombre
  └─ /customer/menu → navega categorías, agrega items al carrito
       → confirma pedido → INSERT orders + order_items
       → INSERT waiter_notifications (type: new_order)
  └─ /customer/history → historial de órdenes de la sesión
  └─ /customer/payment → ticket completo
       → selector de propina (10%/15%/20%/custom)
           → UPDATE waiter_notifications.tip_amount
       → botón "Solicitar Cuenta"
           → INSERT waiter_notifications (type: bill_request)
       → escucha realtime: cuando waiter marca completed → muestra encuesta → redirige

Waiter (/waiter)
  └─ Tab Notificaciones → feed en tiempo real de todos los eventos
  └─ Tab Mesas → estado por mesa, controles de items
       → botón "Cobrar" → handleCobrarMesa
           → fetcha tip_amount del bill_request pendiente
           → abre PaymentCalculator pre-llenado con propina del cliente
           → badge "💬 Cliente sugirió $X.XX"
           → waiter confirma pago
           → freeTableAndClean (archiva en sales_history / sales_items)
           → INSERT tips si tip > 0
           → UPDATE waiter_notifications.status = 'completed'
           → customer recibe confirmación realtime
  └─ Tab Productos → toggle disponibilidad rápido

Admin (/admin)
  └─ Login JWT
  └─ Dashboard con métricas diarias (ingresos, propinas, órdenes, productos top)
  └─ CRUD: Mesas / Productos / Categorías
  └─ Upload logo (Supabase Storage bucket: logo)
```

---

## Arquitectura de Archivos

```
app/
├── layout.tsx                      # Root layout + providers
├── page.tsx                        # Landing / redirect
├── not-found.tsx
│
├── admin/
│   ├── page.tsx                    # Admin shell + routing
│   └── components/
│       ├── LoginForm.tsx
│       ├── Dashboard.tsx           # Analytics, stats, tips del día
│       ├── TablesManagement.tsx    # CRUD mesas
│       ├── TableForm.tsx
│       ├── ProductsManagement.tsx  # CRUD productos
│       ├── ProductForm.tsx
│       ├── CategoriesManagement.tsx
│       └── StarRating.tsx
│
├── customer/
│   ├── page.tsx                    # Entry → nombre de cliente
│   ├── menu/page.tsx               # Menú principal
│   ├── payment/page.tsx            # Ticket + selector propina
│   ├── history/page.tsx            # Historial de órdenes
│   ├── qr/page.tsx                 # QR Share
│   └── components/
│       ├── CustomerPage.tsx        # Onboarding / nombre
│       ├── Menu.tsx                # Catálogo + carrito + solicitar cuenta
│       ├── Payment.tsx             # Ticket + propina customer + encuesta
│       ├── History.tsx             # Historial sesión
│       └── QRShare.tsx
│
├── waiter/
│   ├── page.tsx                    # Dashboard principal + PaymentCalculator
│   └── components/
│       ├── Header.tsx
│       ├── Tabs.tsx
│       ├── LoadingScreen.tsx
│       ├── NotificationsTab.tsx
│       ├── NotificationCard.tsx
│       ├── NotificationIcon.tsx
│       ├── TablesTab.tsx
│       ├── TableCard.tsx
│       ├── TableHeader.tsx         # Botones Cobrar / Separado
│       ├── TableSummary.tsx
│       ├── CustomerOrderSection.tsx
│       ├── OrderItem.tsx           # Estado por item + cancelación
│       └── ProductsManagement.tsx  # Toggle disponibilidad
│
├── context/
│   ├── OrderContext.tsx            # Estado global de orden + bill notification polling
│   ├── SessionContext.tsx          # Sesión del customer (tableId, userId, etc.)
│   ├── ToastContext.tsx
│   └── ConfirmContext.tsx
│
├── lib/supabase/
│   ├── client.ts                   # Supabase client singleton
│   ├── config.ts                   # URL + anon key
│   ├── types.ts                    # Tipos TypeScript de DB
│   ├── orders.ts                   # CRUD órdenes
│   ├── order-items.ts              # CRUD items de orden
│   ├── products.ts                 # Catálogo
│   ├── tables.ts                   # Gestión de mesas
│   ├── categories.ts               # Categorías
│   ├── waiter.ts                   # freeTableAndClean, notif management
│   ├── notifications.ts            # Crear notificaciones
│   ├── history.ts                  # requestBill, sales archival, historial
│   └── tips.ts                     # insertTip, getTipsTotal, getTipsByDateRange
│
└── api/
    ├── admin/login/route.ts        # JWT login
    ├── admin/verify/route.ts       # JWT verify
    └── invoice/route.ts            # Envío de factura por email
```

---

## ✅ Completado

### Infrastructure
- [x] Next.js 16 App Router + TypeScript
- [x] Tailwind CSS 4 con colores OKLCH + fuente Plus Jakarta Sans
- [x] Supabase client con SSR
- [x] Providers: OrderContext, SessionContext, ToastContext, ConfirmContext
- [x] Admin JWT auth (`/api/admin/login` + `/api/admin/verify`)

### Customer Portal
- [x] Entrada por QR — descubrimiento de mesa
- [x] Menú por categorías con carrito y notas por item
- [x] Extras con precio adicional (JSONB en productos)
- [x] Sesiones multi-comensal por mesa
- [x] Tracking de estado de orden en tiempo real
- [x] Ratings y favoritos de productos
- [x] Historial de órdenes de la sesión
- [x] QR Share — compartir mesa con otros comensales
- [x] Página de pago — ticket completo con totales por comensal
- [x] **Selector de propina para el cliente** — 10%/15%/20%/personalizado; se guarda en `waiter_notifications.tip_amount` vía realtime; visible para el mesero al cobrar
- [x] Encuesta de satisfacción post-pago (1–5 estrellas + comentario → `customer_feedback`)
- [x] Solicitud de factura por email (`/api/invoice`)
- [x] Generación de ticket PDF

### Waiter Dashboard
- [x] Tab Notificaciones — feed realtime: new_order, refill, assistance, bill_request
- [x] Tab Mesas — grid con desglose por comensal
  - [x] Controles de estado por item (ordered→preparing→ready→served)
  - [x] Cancelación con contraseña (parcial o total)
  - [x] Ordenado por número o tiempo de ocupación
  - [x] Filtro FCFS
- [x] PaymentCalculator — efectivo + terminal + USD (tasa configurable) + mixto + cambio automático
- [x] **Propina en calculadora pre-llenada desde sugerencia del cliente**
- [x] **Badge "💬 Cliente sugirió $X.XX"** cuando hay propina del customer
- [x] Split Payments — pago individual por comensal
- [x] Tab Productos — toggle disponibilidad rápido

### Admin Dashboard
- [x] Login JWT con sesión en localStorage
- [x] Sidebar colapsable
- [x] Dashboard con stats diarias (órdenes, ingresos, propinas, mesas activas, ticket promedio)
- [x] Filtro por rango de fechas
- [x] Top 10 productos por cantidad vendida
- [x] CRUD Mesas (capacidad, ubicación, estado)
- [x] CRUD Productos (imagen, precio, tiempo prep, disponibilidad, extras)
- [x] CRUD Categorías (orden de display, activo/inactivo)
- [x] Upload de logo (Supabase Storage bucket `logo`)

### Service Layer
- [x] `tips.ts` — insertTip, getTipsTotal, getTipsByDateRange
- [x] `history.ts` — requestBill (con tip_amount), archival de ventas
- [x] `waiter.ts` — freeTableAndClean
- [x] `notifications.ts` — creación de alertas
- [x] Todos los servicios CRUD de entidades

---

## Migraciones Aplicadas

| Fecha | Nombre | Descripción |
|---|---|---|
| 2026-06-15 | `add_tip_amount_to_waiter_notifications` | Columna `tip_amount numeric DEFAULT 0` en `waiter_notifications` para comunicar propina del cliente al mesero |

---

## Flujo de Propina (Implementado 2026-06-15)

**Problema resuelto:** El mesero tenía que adivinar o preguntar verbalmente la propina. Ahora el cliente la elige desde su pantalla y el mesero la recibe pre-cargada.

```
1. Customer solicita cuenta (Menu.tsx → history.requestBill)
   → INSERT waiter_notifications { type: 'bill_request', tip_amount: 0, status: 'pending' }

2. Customer va a /customer/payment
   → Ve selector de propina (Sin propina / 10% / 15% / 20% / Personalizado)
   → Al elegir: UPDATE waiter_notifications SET tip_amount = X WHERE id = notif.id
   → Muestra confirmación: "Propina guardada: $X.XX — el mesero la verá al cobrar"

3. Waiter hace click en "Cobrar" (handleCobrarMesa)
   → SELECT tip_amount FROM waiter_notifications WHERE table_id = X AND type = 'bill_request' AND status = 'pending'
   → Abre PaymentCalculator con initialTip pre-llenado
   → Badge azul: "💬 Cliente sugirió $X.XX"
   → Waiter puede aceptar, modificar o borrar la propina

4. Waiter confirma pago (handlePaymentConfirm)
   → freeTableAndClean() → archiva en sales_history + sales_items
   → Si tip > 0: INSERT tips { table_id, amount, payment_method }
   → UPDATE waiter_notifications.status = 'completed'

5. Customer recibe confirmación realtime → encuesta → redirect
```

---

## Notas Técnicas

- Todos los montos monetarios en **MXN** por defecto
- Tasa USD/MXN configurable por sesión del waiter (guardada en `localStorage`)
- Colores con **OKLCH** para mejor consistencia en pantallas
- Polling de respaldo cada 3–5 segundos en cliente además de Realtime para garantizar entrega
- `cancelled_quantity` en `order_items` soporta cancelaciones parciales sin eliminar el registro
- `extras` en `products` es JSONB con formato `[{ name, price }]`
- Notas de items incluyen extras formateados: `"Nota | Extras: X (+$Y) | Total: $Z"`

---

## 🔴 Pendiente — Prioridad Alta: Optimización de Types

> Cada paso desbloquea el siguiente. Resolver esto elimina todos los `as any` / `as never` del codebase y da seguridad de tipos real en toda la app.

### T1. Completar `app/lib/supabase/types.ts` — Columnas faltantes

**Tabla `products`** — agregar en Row / Insert / Update:
- [ ] `rating: number` (default 0)
- [ ] `rating_count: number` (default 0)
- [ ] `is_favorite: boolean` (default false)
- [ ] `extras: Json` (JSONB array `[{ name, price }]`)

**Tabla `order_items`** — agregar en Row / Insert / Update:
- [ ] `cancelled_quantity: number` (default 0)

**Tabla `orders`** — reconciliar status union:
- [ ] Verificar en DB qué valores existen realmente y unificar a `'active' | 'sent' | 'completed' | 'cancelled' | 'paid'`

### T2. Completar `types.ts` — Tablas faltantes

- [ ] Agregar tabla `tips` (actualmente solo definida localmente en `tips.ts`)
- [ ] Agregar tabla `sales_history` (actualmente en `admin/types.ts` local)
- [ ] Agregar tabla `sales_items` (actualmente en `Dashboard.tsx` local)
- [ ] Agregar tabla `customer_feedback` (usada en `Payment.tsx` sin tipo)

### T3. Mover tipos de estado a `types.ts` como exports centrales

Actualmente definidos solo en `waiter.ts` — moverlos a `types.ts`:
- [ ] `NotificationType = 'new_order' | 'refill' | 'assistance' | 'bill_request'`
- [ ] `NotificationStatus = 'pending' | 'acknowledged' | 'completed'`
- [ ] `TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'`
- [ ] `OrderItemStatus = 'ordered' | 'preparing' | 'ready' | 'served' | 'cancelled'`
- [ ] `OrderStatus = 'active' | 'sent' | 'completed' | 'cancelled' | 'paid'`
- [ ] `PaymentMethod = 'cash' | 'terminal' | 'usd' | 'mixed'`

### T4. Eliminar interfaces locales duplicadas

| Tipo | Archivos con duplicado | Acción |
|---|---|---|
| `Product` | `order-items.ts`, `products.ts`, `admin/types.ts`, `TableHeader.tsx` | Una sola en `types.ts`, importar en todos |
| `Order` / `OrderWithItems` | `orders.ts`, `waiter.ts`, `history.ts`, `admin/types.ts` x2 | Merge en `types.ts` |
| `OrderItem` | `order-items.ts`, `waiter.ts`, `history.ts`, `types.ts` (incompleta) | Una sola con `cancelled_quantity` |
| `WaiterNotification` | `waiter.ts` (con relaciones), `types.ts` (sin relaciones) | Merge: agregar `tables?` y `orders?` opcionales |
| `Category` | `categories.ts` (idéntica a `types.ts`) | Eliminar la de `categories.ts`, importar de `types.ts` |
| `SalesHistory` / `SalesItem` | `admin/types.ts`, `Dashboard.tsx`, `waiter.ts` | Mover a Database en `types.ts` |

### T5. Eliminar casteos `as any` / `as never` en servicios

Resueltos automáticamente al completar T1 y T2:
- [ ] `products.ts` — 6 casteos `as any` para `rating`, `extras` (líneas 33, 55, 77, 113–115, 147–149, 164–166)
- [ ] `order-items.ts` — `updateData as never` (línea 68)
- [ ] `history.ts` — 3 inserciones `as any` / `as never` (líneas 58, 223, 253)
- [ ] `notifications.ts` — insert `as any` (línea 15)
- [ ] `waiter.ts` — casteos en inserts a `sales_history` y `sales_items` (líneas 340–390)
- [ ] `lib/supabase/config.ts` — 3 seeds con `as any` (líneas 45, 68, 106)
- [ ] `waiter/page.tsx` — `_notif as any` (temporal hasta T1 completo)
- [ ] `Payment.tsx` — `as any` en update de `tip_amount` (temporal hasta T1 completo)

### T6. Tipar props de componentes

- [ ] `OrderItem.tsx` — `item: any` → `item: OrderItem`
- [ ] `CustomerOrderSection.tsx` — `orders: any[]` → `orders: OrderWithItems[]`
- [ ] `TableCard.tsx` — `i: any` en reduce → `i: OrderItem`; `Map<string, any>` → `Map<string, OrderGroup>`
- [ ] `TableHeader.tsx` — `Product` local con `extras?: never[]` → importar `Product` central
- [ ] `History.tsx` — `item: any` en renderOrderItem → `item: OrderItem`
- [ ] `Menu.tsx` — `item: any` en map de order_items (líneas 1989, 2986, 3250, 3418)
- [ ] `admin/page.tsx` — reducers con `sale: any`, `order: any` → tipos reales

---

## ⏳ Pendiente

### 1. Kitchen Display System (KDS) — `/kitchen`
- [ ] Nueva ruta `/kitchen` con vista en tiempo real de pedidos activos
- [ ] Ordenado por mesa y tiempo de entrada (FCFS)
- [ ] Botones para avanzar estado de items: ordered → preparing → ready
- [ ] Suscripción Realtime a `order_items` y `orders`
- [ ] Sin autenticación (pantalla fija en cocina) o PIN simple

### 2. "Pedir algo más" en Customer
- [ ] Permitir al customer añadir items a una orden ya enviada (status `active` o `sent`)
- [ ] Botón en `/customer/menu` o `/customer/history` para reabrir el carrito sobre la orden activa
- [ ] Los nuevos items se agregan como `order_items` adicionales a la misma `order_id`
- [ ] INSERT `waiter_notifications` (type: `new_order`) para alertar al mesero

### 3. PWA + Notificaciones Push para Mesero
- [ ] Agregar `manifest.json` y Service Worker para convertir a PWA
- [ ] Implementar Web Push API — suscripción desde `/waiter`
- [ ] Guardar suscripciones push en Supabase
- [ ] Disparar notificaciones desde Edge Function al recibir INSERT en `waiter_notifications`
- [ ] Funciona con browser en segundo plano o pantalla apagada

### 4. Múltiples Meseros / Gestión de Personal
- [ ] Tabla `staff` en Supabase (id, name, pin, role: waiter/manager)
- [ ] Login por PIN en `/waiter` — sesión en `localStorage`
- [ ] Asignación de mesas a mesero (`tables.assigned_staff_id`)
- [ ] Tracking en `orders` y `sales_history` de qué mesero atendió
- [ ] Vista en Admin de rendimiento por mesero (órdenes, propinas, ventas)

### 5. Sistema de Reservaciones
- [ ] Tabla `reservations` (id, table_id, customer_name, phone, date, time, party_size, status)
- [ ] Vista en Admin para crear/ver/cancelar reservaciones
- [ ] Vista en Waiter — agenda del día con reservas pendientes
- [ ] Al llegar la hora, cambiar mesa a `occupied` automáticamente
- [ ] Opcional: link público para que el cliente reserve sin QR
