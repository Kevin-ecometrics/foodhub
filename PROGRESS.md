# RioChia7CafeBistro — Progress Tracker

> Restaurant management platform with real-time ordering, table management, and payment processing.
> Stack: Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase (PostgreSQL + Realtime)
> Package manager: **Bun** · Project codename in package.json: `menu-jp` · Brand: **RioChia7CafeBistro**

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
| meal_type | text | `'both'` | CHECK IN (breakfast, lunch, both) — controla en qué horario se muestra |
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

### `users`
| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | — | FK→auth.users, ON DELETE CASCADE |
| email | text UNIQUE | — | |
| name | text | — | |
| role | text | — | CHECK IN (super_admin, admin, waiter) — fuente de verdad real es `auth.users.raw_app_meta_data.role` |
| pin_code | char(4) | — | nullable, CHECK 4 dígitos, único entre waiters activos |
| is_active | boolean | true | |
| created_at | timestamptz | now() | |
| updated_at | timestamptz | now() | trigger `set_updated_at` |

> Única tabla con RLS real por rol (`current_role()` lee `app_metadata` del JWT). Ver `docs/AUTH.md`.

### `app_settings`
| Column | Type | Default | Notes |
|---|---|---|---|
| key | text PK | — | ej. `product_notes_enabled`, `breakfast_end_hour`, `printing_enabled`, `default_check_ui`, `close_table_pin` |
| value | text | `'false'` | toggles: `'true'`/`'false'`, time: `"HH:MM"`, select: string |
| updated_at | timestamptz | now() | trigger `set_updated_at` |

> Feature flags configurables desde `/admin` → Configuración. Soporta tipos: toggle (`'true'`/`'false'`), time (`"HH:MM"`), select (string). Lectura pública (RLS `select` abierto), escritura solo admin/super_admin.

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
  └─ Configuración con 7 settings:
       ├─ Notas especiales en productos (toggle)
       ├─ Cambio de Desayuno a Comida (time picker)
       ├─ Impresión (toggle) — al activar muestra modal de pago simulado con tarjeta ($35 USD)
       ├─ Diseño de cuenta por defecto (select: Moderno/Clásico/Compacto)
       ├─ Cover del menú (preview + upload)
       ├─ Logo del negocio (preview + upload)
       └─ PIN para cerrar mesa (password)
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
│       ├── SettingsManagement.tsx  # Panel de config (toggles, time, select, cover/logo upload)
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
- [x] Auth real con Supabase (`app/api/auth/login`, `app/api/auth/waiter-login`, `app/api/auth/logout`) + `middleware.ts` — reemplaza el login JWT propio anterior, ver `docs/AUTH.md`

### Customer Portal
- [x] Entrada por QR — descubrimiento de mesa
- [x] Menú por categorías con carrito y notas por item — instrucciones especiales (textarea) opt-in/opt-out vía `app_settings.product_notes_enabled`, controlado desde `/admin` → Configuración (apagado por defecto)
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
- [x] Login en `/waiter/login` por correo+contraseña o PIN de 4 dígitos (Supabase Auth), protegido por `middleware.ts`
- [x] Tab Notificaciones — feed realtime: new_order, refill, assistance, bill_request
- [x] Tab Mesas — grid con desglose por comensal
  - [x] Controles de estado por item (ordered→preparing→ready→served)
   - [x] Cancelación con PIN (parcial o total) — usa `close_table_pin` de DB (sin hardcode)
  - [x] Ordenado por número o tiempo de ocupación
  - [x] Filtro FCFS
  - [x] **Agregar productos a mesa en 2 pasos** (2026-07-20): selecciona productos → asigna a un cliente activo de la mesa (chip) o a "Sin cliente (General)"; ya no escribe nombres libres, solo elige entre los comensales con orden `status='sent'`
  - [x] **Merge de cantidades** — si el mismo producto se agrega dos veces al mismo cliente mientras sigue `status='ordered'` y sin cancelaciones, incrementa la `quantity` de la línea existente en vez de crear una fila duplicada
  - [x] **Drag & drop entre clientes** — arrastrar un `OrderItem` y soltarlo sobre la sección de otro cliente (o sobre "General") reasigna el producto vía `waiterService.moveOrderItemToCustomer`; mueve el `order_id` del item y resincroniza `total_amount` en la orden origen y destino
- [x] PaymentCalculator — efectivo + terminal + USD (tasa configurable) + mixto + cambio automático
- [x] **Propina en calculadora pre-llenada desde sugerencia del cliente**
- [x] **Badge "💬 Cliente sugirió $X.XX"** cuando hay propina del customer
- [x] Split Payments — pago individual por comensal
- [x] **Cerrar Mesa** — botón rojo que elimina pedidos/notificaciones sin cobrar (protegido por `close_table_pin`)
- [x] Tab Productos — toggle disponibilidad rápido

### Admin Dashboard
- [x] Login con Supabase Auth (correo/contraseña; super admin vía `ADMIN_USERNAME`/`ADMIN_PASSWORD` sincronizado como cuenta real)
- [x] Sidebar colapsable
- [x] Dashboard con stats diarias (órdenes, ingresos, propinas, mesas activas, ticket promedio)
- [x] Filtro por rango de fechas
- [x] Top 10 productos por cantidad vendida
- [x] CRUD Mesas (capacidad, ubicación, estado)
- [x] CRUD Productos (imagen, precio, tiempo prep, disponibilidad, extras)
- [x] CRUD Categorías (orden de display, activo/inactivo)
- [x] CRUD Usuarios (`UsersManagement.tsx`) — crear/editar/desactivar/eliminar cuentas admin/waiter, PIN, ya verificadas sin correo
- [x] Configuración (`SettingsManagement.tsx`) — panel de settings con 5 tipos: toggle, time picker, select dropdown, image upload (cover/logo), password
  - [x] Toggle: Notas especiales en productos, Impresión (con modal de pago simulado al activar)
  - [x] Time picker: Cambio de Desayuno a Comida
  - [x] Select: Diseño de cuenta por defecto (Moderno/Clásico/Compacto)
  - [x] Image upload: Cover del menú + Logo del negocio (movidos del sidebar a settings)
  - [x] Password: PIN para cerrar mesa (input enmascarado + toggle visibilidad + auto-save)
- [x] Upload de logo (Supabase Storage bucket `logo`) — ahora desde Configuración
- [x] Upload de cover (Supabase Storage bucket `cover-image`) — ahora desde Configuración

### Service Layer
- [x] `tips.ts` — insertTip, getTipsTotal, getTipsByDateRange
- [x] `history.ts` — requestBill (con tip_amount), archival de ventas
- [x] `waiter.ts` — freeTableAndClean, resetTable, moveOrderItemToCustomer (reasignación de producto entre clientes de una mesa)
- [x] `notifications.ts` — creación de alertas
- [x] Todos los servicios CRUD de entidades

### TypeScript & Code Quality (2026-06-15)
- [x] **T1** — `types.ts` reescrito: columnas faltantes añadidas (`rating`, `rating_count`, `is_favorite`, `extras`, `cancelled_quantity`, `tip_amount`, `payment_method`, `updated_at`)
- [x] **T2** — Tablas nuevas en `types.ts`: `tips`, `sales_history`, `sales_items`, `customer_feedback`
- [x] **T3** — Enums de dominio centralizados: `NotificationType`, `NotificationStatus`, `TableStatus`, `OrderItemStatus`, `OrderStatus`, `PaymentMethod` — exportados desde `types.ts`
- [x] **T5** — 0 errores TypeScript en todos los archivos `lib/supabase/`: `waiter.ts`, `history.ts`, `orders.ts`, `order-items.ts`, `products.ts`, `categories.ts`, `notifications.ts`, `tips.ts`
- [x] **TablesTab.tsx** — `Date.now()` movido a `useState` + `setInterval` (fix React purity warning)
- [x] **T4** — Interfaces duplicadas eliminadas: `OrderItem` consolidado en `order-items.ts` + re-exportado desde `waiter.ts`; `TableOrder` separado de `Order`; `Product` central en `products.ts` usado por `TableHeader.tsx` y `ProductsManagement.tsx`; interfaces locales `CustomerGroupSummary` tipadas
- [x] **T6** — Props `any` reemplazados con tipos concretos: `OrderItemWithProduct` en `Payment.tsx`, `History.tsx`, `Menu.tsx`; `Guest`, `TableOrder[]`, `OrderItem`, `SeparatePayment`, `PaymentData` en `waiter/page.tsx`; `SalesItem` en `admin/components/Dashboard.tsx`; `Product` array cast en `admin/components/ProductsManagement.tsx`; interfaces `Guest`/`SeparatePayment`/`PaymentData` movidas a scope de módulo
- [x] **TableHeader.tsx** — `supabase` import faltante añadido; `calculateTotalItems`, `toast`, `tableTotal`, `hasNotifications`, `totalItems` removidos (muertos); `eslint-disable any` añadido para casts de Supabase
- [x] **waiter/page.tsx** — `PaymentData` ampliado con campo `change`; 10 íconos react-icons no usados eliminados; `setFcfsFilter` y `usdRateUsed` removidos
- [x] **waiter.ts** — `OrderItemRow` expandido con `order_id`, `product_id`, `created_at`; query `getTablesWithOrders` actualizado para seleccionar esos campos — `TableOrder.order_items` ahora satisface `OrderItem[]` correctamente
- [x] **admin/components/ProductsManagement.tsx** — `parseFloat(product.rating)` → `product.rating` (era `number`, no `string`); `FaSpinner` y `ProductUpdate` no usados eliminados

---

## Migraciones Aplicadas

| Fecha | Nombre | Descripción |
|---|---|---|
| 2026-06-15 | `add_tip_amount_to_waiter_notifications` | Columna `tip_amount numeric DEFAULT 0` en `waiter_notifications` para comunicar propina del cliente al mesero |
| 2026-07-20 | `create_users_table_and_role_auth` | Tabla `users` (roles admin/waiter/super_admin) + función `current_role()` + RLS por rol; migra el login de admin/waiter a Supabase Auth real |
| 2026-07-20 | `fix_current_role_search_path` | Fix del linter de seguridad: `search_path` explícito en `current_role()` |
| 2026-07-20 | `create_app_settings_table` | Tabla `app_settings` (feature flags opt-in/opt-out) + seed de `product_notes_enabled = false` |
| 2026-07-20 | — | `app_settings.value` migrado a text para soportar string (time/select) además de boolean; service layer (`settings.ts`) actualizado con tipo `string` |
| 2026-07-20 | `add_meal_type_to_products` | Columna `meal_type text NOT NULL DEFAULT 'both' CHECK (meal_type IN ('breakfast','lunch','both'))` en `products` — controla visibilidad por horario de desayuno/comida |
| 2026-07-20 | — | `close_table_pin` agregado a seeds de `app_settings` |
| 2026-07-20 | — | `PasswordModal` refactorizado: elimina hardcode `"restaurant"`, valida contra `targetPin` prop |
| 2026-07-20 | — | `waiterService.resetTable()` — elimina pedidos/notificaciones sin historial (como admin) |
| 2026-07-20 | — | Modal de pago simulado para `printing_enabled` — formulario tipo Shopify con tarjeta, $35 USD, mock |

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
- [x] Tabla `users` en Supabase (id, email, name, role: super_admin/admin/waiter, pin_code, is_active) — vinculada a `auth.users`, ver `docs/AUTH.md`
- [x] Login por PIN en `/waiter/login` — sesión real de Supabase Auth (cookies), no `localStorage`
- [x] Login admin/waiter por correo+contraseña vía Supabase Auth, cuentas creadas desde el panel ya verificadas (sin correo de confirmación)
- [x] Super admin (`ADMIN_USERNAME`/`ADMIN_PASSWORD`) sincronizado como cuenta real de Supabase Auth
- [ ] Asignación de mesas a mesero (`tables.assigned_staff_id`)
- [ ] Tracking en `orders` y `sales_history` de qué mesero atendió
- [ ] Vista en Admin de rendimiento por mesero (órdenes, propinas, ventas)

### 5. Sistema de Reservaciones
- [ ] Tabla `reservations` (id, table_id, customer_name, phone, date, time, party_size, status)
- [ ] Vista en Admin para crear/ver/cancelar reservaciones
- [ ] Vista en Waiter — agenda del día con reservas pendientes
- [ ] Al llegar la hora, cambiar mesa a `occupied` automáticamente
- [ ] Opcional: link público para que el cliente reserve sin QR
