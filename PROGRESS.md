# RioChia7CafeBistro — Progress Tracker

> Restaurant management platform with real-time ordering, table management, and payment processing.
> Stack: Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase (PostgreSQL + Realtime)
> Package manager: **Bun** · Project codename in package.json: `menu-jp` · Brand: **RioChia7CafeBistro**

---

## Database Schema (Supabase PostgreSQL)

All tables have RLS enabled.

### `tables`

| Column     | Type        | Default        | Notes                |
| ---------- | ----------- | -------------- | -------------------- |
| id         | integer PK  | auto-increment |                      |
| number     | integer     | —              | mesa número          |
| status     | varchar     | `'available'`  | available / occupied |
| capacity   | integer     | —              |                      |
| location   | varchar     | —              | nullable             |
| created_at | timestamptz | now()          |                      |
| updated_at | timestamptz | now()          |                      |

### `categories`

| Column        | Type           | Default        | Notes    |
| ------------- | -------------- | -------------- | -------- |
| id            | integer PK     | auto-increment |          |
| name          | varchar        | —              |          |
| slug          | varchar UNIQUE | —              |          |
| description   | text           | `''`           | nullable |
| display_order | integer        | 0              |          |
| is_active     | boolean        | true           |          |
| created_at    | timestamptz    | now()          |          |
| updated_at    | timestamptz    | now()          |          |

### `products`

| Column           | Type        | Default        | Notes                                                                  |
| ---------------- | ----------- | -------------- | ---------------------------------------------------------------------- |
| id               | integer PK  | auto-increment |                                                                        |
| name             | varchar     | —              |                                                                        |
| description      | text        | —              | nullable                                                               |
| price            | integer     | —              | en centavos MXN                                                        |
| category         | varchar     | —              | FK reference                                                           |
| image_url        | varchar     | —              | nullable                                                               |
| is_available     | boolean     | true           |                                                                        |
| preparation_time | integer     | —              | nullable, minutos                                                      |
| rating           | numeric     | 0.0            | promedio acumulado                                                     |
| rating_count     | integer     | 0              | número de ratings                                                      |
| is_favorite      | boolean     | false          |                                                                        |
| extras           | jsonb       | `[]`           | add-ons con precio                                                     |
| meal_type        | text        | `'both'`       | CHECK IN (breakfast, lunch, both) — controla en qué horario se muestra |
| created_at       | timestamptz | now()          |                                                                        |
| updated_at       | timestamptz | now()          |                                                                        |

### `orders`

| Column        | Type              | Default           | Notes                  |
| ------------- | ----------------- | ----------------- | ---------------------- |
| id            | uuid PK           | gen_random_uuid() |                        |
| table_id      | integer FK→tables | —                 |                        |
| customer_name | varchar           | —                 | nullable               |
| status        | varchar           | `'active'`        | active / sent / closed |
| total_amount  | numeric           | 0                 |                        |
| created_at    | timestamptz       | now()             |                        |
| updated_at    | timestamptz       | now()             |                        |

### `order_items`

| Column             | Type                | Default           | Notes                                      |
| ------------------ | ------------------- | ----------------- | ------------------------------------------ |
| id                 | uuid PK             | gen_random_uuid() |                                            |
| order_id           | uuid FK→orders      | —                 |                                            |
| product_id         | integer FK→products | —                 |                                            |
| product_name       | varchar             | —                 | snapshot del nombre                        |
| price              | numeric             | —                 | snapshot del precio                        |
| quantity           | integer             | 1                 |                                            |
| notes              | text                | —                 | nullable, notas + extras                   |
| status             | varchar             | `'ordered'`       | ordered→preparing→ready→served / cancelled |
| cancelled_quantity | integer             | 0                 | cancelaciones parciales                    |
| created_at         | timestamptz         | now()             |                                            |
| updated_at         | timestamptz         | now()             |                                            |

### `waiter_notifications`

| Column         | Type              | Default           | Notes                                          |
| -------------- | ----------------- | ----------------- | ---------------------------------------------- |
| id             | uuid PK           | gen_random_uuid() |                                                |
| table_id       | integer FK→tables | —                 |                                                |
| order_id       | uuid FK→orders    | —                 | nullable                                       |
| type           | varchar           | —                 | new_order / refill / assistance / bill_request |
| message        | text              | —                 |                                                |
| status         | varchar           | `'pending'`       | pending / completed / cancelled                |
| payment_method | varchar           | —                 | nullable: cash / terminal / usd / mixed        |
| tip_amount     | numeric           | 0                 | **propina elegida por el cliente** (nullable), monto en pesos |
| tip_percentage | numeric           | —                 | nullable (2026-07-23): `0` = sin propina, `10`/`15`/`20` = botón de %, `null` = monto personalizado ("Otro"). Usado por el mesero para saber qué botón resaltar sin adivinar comparando montos |
| created_at     | timestamptz       | now()             |                                                |
| updated_at     | timestamptz       | now()             | nullable                                       |

### `tips`

| Column         | Type              | Default           | Notes                          |
| -------------- | ----------------- | ----------------- | ------------------------------ |
| id             | uuid PK           | gen_random_uuid() |                                |
| order_id       | uuid              | —                 | nullable FK→orders             |
| table_id       | integer FK→tables | —                 |                                |
| customer_name  | text              | —                 | ej. "Mesa 5"                   |
| amount         | numeric           | 0                 | monto final de propina cobrada |
| payment_method | text              | —                 | nullable                       |
| payment_breakdown | jsonb          | —                 | nullable, solo si hay efectivo involucrado (`cash` o `mixed`): `{cash, terminal, usd, cashTendered, change}` en MXN — normalmente `null` en `tips` (ver nota en `cash_reports`) |
| created_at     | timestamptz       | now()             |                                |

### `sales_history`

| Column         | Type              | Default           | Notes    |
| -------------- | ----------------- | ----------------- | -------- |
| id             | uuid PK           | gen_random_uuid() |          |
| table_id       | integer FK→tables | —                 |          |
| table_number   | integer           | —                 | snapshot |
| customer_name  | varchar           | —                 | nullable |
| total_amount   | numeric           | 0                 |          |
| order_count    | integer           | 0                 |          |
| item_count     | integer           | 0                 |          |
| payment_method | varchar           | —                 | nullable |
| payment_breakdown | jsonb          | —                 | nullable, se llena cuando hay efectivo involucrado (`cash` o `mixed`): `{cash, terminal, usd, cashTendered, change}` en MXN — ver nota en `cash_reports` |
| created_at     | timestamptz       | now()             |          |
| closed_at      | timestamptz       | now()             |          |

### `sales_items`

| Column       | Type                  | Default           | Notes    |
| ------------ | --------------------- | ----------------- | -------- |
| id           | uuid PK               | gen_random_uuid() |          |
| sale_id      | uuid FK→sales_history | —                 |          |
| product_name | varchar               | —                 |          |
| price        | numeric               | —                 |          |
| quantity     | integer               | 1                 |          |
| subtotal     | numeric               | —                 |          |
| notes        | text                  | —                 | nullable |

### `customer_feedback`

| Column        | Type        | Default           | Notes                                                                                                        |
| ------------- | ----------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| id            | uuid PK     | gen_random_uuid() |                                                                                                              |
| table_id      | text        | —                 |                                                                                                              |
| customer_name | text        | —                 |                                                                                                              |
| rating        | integer     | —                 | CHECK 1–5                                                                                                    |
| comment       | text        | —                 | nullable                                                                                                     |
| order_count   | integer     | —                 |                                                                                                              |
| total_amount  | numeric     | —                 |                                                                                                              |
| created_at    | timestamptz | now()             | nullable                                                                                                     |
| feedback_type | text        | `'general'`       | CHECK IN (general, product) — distingue reseña general del servicio vs. reseña de un producto específico     |
| product_id    | integer     | —                 | nullable, solo si `feedback_type='product'`; sin FK a propósito (preserva histórico si se borra el producto) |
| product_name  | varchar     | —                 | nullable, snapshot del nombre al momento de la reseña                                                        |

### `users`

| Column     | Type        | Default | Notes                                                                                                |
| ---------- | ----------- | ------- | ---------------------------------------------------------------------------------------------------- |
| id         | uuid PK     | —       | FK→auth.users, ON DELETE CASCADE                                                                     |
| email      | text UNIQUE | —       |                                                                                                      |
| name       | text        | —       |                                                                                                      |
| role       | text        | —       | CHECK IN (super_admin, admin, waiter) — fuente de verdad real es `auth.users.raw_app_meta_data.role` |
| pin_code   | char(4)     | —       | nullable, CHECK 4 dígitos, único entre waiters activos                                               |
| is_active  | boolean     | true    |                                                                                                      |
| created_at | timestamptz | now()   |                                                                                                      |
| updated_at | timestamptz | now()   | trigger `set_updated_at`                                                                             |

> Única tabla con RLS real por rol (`current_role()` lee `app_metadata` del JWT). Ver `docs/AUTH.md`.

### `app_settings`

| Column     | Type        | Default   | Notes                                                                                                                                                                            |
| ---------- | ----------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| key        | text PK     | —         | ej. `product_notes_enabled`, `product_ratings_enabled`, `breakfast_end_hour`, `printing_enabled`, `default_check_ui`, `close_table_pin`, `check_ui_customization`, `order_steps` |
| value      | text        | `'false'` | toggles: `'true'`/`'false'`, time: `"HH:MM"`, select: string, JSON: `check_ui_customization` y `order_steps`                                                                     |
| updated_at | timestamptz | now()     | trigger `set_updated_at`                                                                                                                                                         |

> Feature flags configurables desde `/admin` → Configuración. Soporta tipos: toggle (`'true'`/`'false'`), time (`"HH:MM"`), select (string), JSON (`check_ui_customization` — diseño de cuenta personalizado, `order_steps` — etiquetas/colores de estados). Lectura pública (RLS `select` abierto), escritura solo admin/super_admin.

### `cash_reports`

| Column                                                              | Type        | Default           | Notes                                                                                                                              |
| ------------------------------------------------------------------- | ----------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| id                                                                  | uuid PK     | gen_random_uuid() |                                                                                                                                    |
| report_number                                                       | integer     | identity (always) | numeración secuencial propia del reporte, para mostrar "Corte de caja #N"                                                          |
| opened_at                                                           | timestamptz | now()             | cuándo se abrió la caja — inicio del periodo que cubre el reporte                                                                  |
| closed_at                                                           | timestamptz | —                 | nullable; **"abierta" = `closed_at is null"`** (mismo patrón que `waiter_sessions.started_at/ended_at`)                            |
| opening_cash                                                        | numeric     | 0                 | entrada manual del cajero al **abrir**                                                                                             |
| cash_deposits                                                       | numeric     | 0                 | **automático**, calculado al cerrar: suma de `payment_breakdown.cashTendered` (efectivo bruto entregado por clientes) en el periodo |
| cash_withdrawals                                                    | numeric     | 0                 | **automático**, calculado al cerrar: suma de `payment_breakdown.change` (cambio devuelto a clientes) en el periodo                 |
| counted_cash                                                        | numeric     | —                 | nullable hasta el cierre; entrada manual del cajero al **cerrar**                                                                  |
| notes                                                               | text        | —                 | nullable, capturado al cerrar                                                                                                      |
| cash_sales / terminal_sales / usd_sales / total_sales | numeric     | 0                 | snapshot calculado al cerrar, agregando `sales_history` (`closed_at` de la venta) en `[opened_at, closed_at]` por `payment_method` — los cobros `mixed` se reparten usando `payment_breakdown`, así que siempre suman exactamente `total_sales`. Es la cuenta SIN propina (para "Forma de pago ventas"), distinto de `cash_deposits`/`cash_withdrawals` que sí incluyen la propina bruta entregada en efectivo |
| cash_tips / terminal_tips / usd_tips / total_tips      | numeric     | 0                 | propinas **recibidas** (informativo, sección "Forma de pago propina"), snapshot calculado al cerrar, agregando `tips` (`created_at`) en el mismo rango, mismo reparto de `mixed` — **NO es lo mismo que `tips_paid`** (ver abajo)                                                    |
| paid_accounts_count                                                 | integer     | 0                 | conteo de filas de `sales_history` en el periodo ("cuentas normal")                                                                |
| average_ticket                                                      | numeric     | 0                 | `total_sales / paid_accounts_count` ("cuenta promedio")                                                                            |
| subtotal / tax_amount                                               | numeric     | 0                 | sobre `total_sales`, según `tax_rate` (ver nota abajo)                                                                             |
| tax_rate                                                            | numeric     | 16                | % de IVA usado, leído de `app_settings.iva_rate` al cerrar — snapshot, no cambia si el setting cambia después                     |
| tips_paid                                                           | numeric     | 0                 | **"Propinas pagadas"** (corrección 2026-07-22, dos rondas — ver sección "Propinas acumuladas" abajo): suma de `tip_payouts.amount` (pagos **realmente marcados como pagados** en la pestaña Propinas del admin) con `paid_at` en `[opened_at, closed_at]`. Ya NO es lo que se acumula al cerrar turno (`waiter_sessions.tips_paid_out`) — ese dinero sigue en la caja hasta que se marca pagado. Distinto de `cash_tips`/`total_tips` (recibidas); usado en `expected_cash`, no ellas |
| expected_cash                                                       | numeric     | 0                 | `opening_cash + cash_deposits - cash_withdrawals - tips_paid` — **100% automático**, sin ningún input manual de movimientos de caja |
| cash_difference                                                     | numeric     | 0                 | `counted_cash - expected_cash` (sobrante +/faltante -)                                                                             |
| opened_by / closed_by                                               | uuid        | —                 | nullable, FK→users, `on delete set null`                                                                                           |
| created_at                                                          | timestamptz | now()             |                                                                                                                                    |

> Índice único parcial `cash_reports_single_open_idx on ((closed_at is null)) where closed_at is null` — solo puede haber una caja abierta a la vez (mismo truco que `users_pin_code_unique_idx`). Sin FK hacia `sales_history`/`tips` — es un snapshot congelado al cerrar. RLS "allow all" (mismo patrón que `sales_history`/`tips`). **Nota de tasa de impuesto:** este reporte lee `app_settings.iva_rate` (editable en admin, Configuración → "IVA y tipo de cambio", `SettingsManagement.tsx`) al momento de cerrar la caja y lo guarda como snapshot en `tax_rate` (2026-07-22) — mismo setting/convención que ya usan `Payment.tsx`/`Menu.tsx` del lado cliente. Si el setting falta o no es numérico, cae a 16% por defecto (`getTaxRatePercent()` en `cashRegister.ts`). Como es snapshot, un reporte ya cerrado no cambia si el admin edita `iva_rate` después. `TableCard.tsx` (vista de mesas del mesero) y otros lugares (`Dashboard.tsx`, `History.tsx`) siguen con tasas hardcodeadas (16%/8% respectivamente) — inconsistencia preexistente, fuera del alcance de este reporte. **No hay columna "mixed" aparte** (se eliminó `mixed_sales`/`mixed_tips`, 2026-07-22) — era redundante, porque `cash_sales`/`terminal_sales`/`usd_sales` YA incluyen el reparto real de las ventas/propinas mixtas, leído de `payment_breakdown` (ver nota en `sales_history`/`tips` arriba); `cash_sales + terminal_sales + usd_sales == total_sales` siempre. **El "cambio" (vuelto) SÍ se persiste** (desde 2026-07-22, corrección) en `payment_breakdown.change` — antes era efímero (solo un `toast`); ahora se guarda porque `cash_deposits - cash_withdrawals` (bruto entregado − cambio) necesita el dato real para calcular el efectivo neto que entra a la caja, incluyendo la propina en efectivo (que físicamente sigue en la caja hasta que se reparte al cerrar turno — ver `tips_paid`). **"Propinas pagadas" = solo lo realmente pagado, no lo acumulado** (corrección 2026-07-22, dos rondas): primero se cambió de restar `cash_tips` (recibidas) a restar el reparto calculado al cerrar turno (`waiter_sessions.tips_paid_out`) — pero el usuario señaló que ese dinero **tampoco** sale de la caja en ese momento, sigue ahí hasta que alguien lo entrega físicamente. Se rediseñó con un modelo de saldo acumulado (`tip_ledger_entries`/`tip_payouts`, ver sección "Propinas acumuladas" abajo): `tips_paid` ahora es la suma de pagos **marcados como pagado** en la pestaña Propinas del admin dentro del periodo del corte, no lo acumulado. **Campos del ticket físico de corte de caja que NO se implementaron** por no existir la feature/dato detrás: vales/"otros" como método de pago, venta por tipo de producto (alimentos/bebidas/otros — categorías son texto libre sin bucket fijo), venta por tipo de servicio (comedor/domicilio/rápido — la app es 100% para comer en mesa), descuentos y cortesías (no existe el mecanismo), folio de órdenes (usan UUID, no numeración secuencial), comensales/consumo promedio por comensal (no se persiste conteo de comensales), cuentas canceladas (`waiterService.resetTable()` no deja rastro).

### `tip_ledger_entries` (2026-07-22)

| Columna            | Tipo        | Default | Notas                                                                                                    |
| ------------------ | ----------- | ------- | --------------------------------------------------------------------------------------------------------- |
| id                 | uuid PK     | gen_random_uuid() |                                                                                                   |
| waiter_session_id  | uuid FK→waiter_sessions | — | nullable, `on delete set null` — trazabilidad de qué cierre de turno generó la fila                     |
| recipient_type     | text        | —       | `'waiter'` o `'role'` (check constraint)                                                                    |
| recipient_key      | text        | —       | `users.id` (texto) si es mesero, o el nombre del rol (ej. `'Barra'`) si es rol de `tip_distribution`       |
| recipient_name     | text        | —       | snapshot del nombre al momento de acumular (el saldo actual siempre muestra el nombre vigente de `users`) |
| amount             | numeric     | 0       | lo que se acumula para ese destinatario en ese cierre de turno                                             |
| created_at         | timestamptz | now()   |                                                                                                              |

### `tip_payouts` (2026-07-22)

| Columna         | Tipo        | Default | Notas                                                                    |
| --------------- | ----------- | ------- | --------------------------------------------------------------------------- |
| id              | uuid PK     | gen_random_uuid() |                                                                |
| recipient_type  | text        | —       | `'waiter'` o `'role'`                                                       |
| recipient_key   | text        | —       | igual que en `tip_ledger_entries`                                           |
| recipient_name  | text        | —       | snapshot al momento de pagar                                                |
| amount          | numeric     | 0       | monto pagado (puede ser parcial — el admin puede editarlo, no siempre es el saldo completo) |
| paid_at         | timestamptz | now()   | **esto es lo que usa `cash_reports.tips_paid`** (suma en `[opened_at, closed_at]`) |
| paid_by         | uuid FK→users | —     | nullable, admin que marcó el pago                                           |
| notes           | text        | —       | nullable                                                                    |
| created_at      | timestamptz | now()   |                                                                              |

> Saldo pendiente de un destinatario = `SUM(tip_ledger_entries.amount) - SUM(tip_payouts.amount)` agrupado por `(recipient_type, recipient_key)` — modelo tipo "cuenta corriente", sin ligar pagos a acumulaciones específicas (permite pagos parciales). RLS "allow all" (mismo patrón que `tips`/`cash_reports`/`waiter_sessions`). Índices: `tip_ledger_entries_recipient_idx`, `tip_payouts_recipient_idx`, `tip_payouts_paid_at_idx`.

---

## Realtime Channels

| Canal                      | Escucha                                                   | Usado en                |
| -------------------------- | --------------------------------------------------------- | ----------------------- |
| `table-{id}-notifications` | INSERT/UPDATE `waiter_notifications`                      | OrderContext (customer) |
| `table-{id}-orders`        | `*` en `orders`                                           | Payment.tsx             |
| `table-{id}-payments`      | `*` en `waiter_notifications`                             | Payment.tsx             |
| waiter subscriptions       | `orders`, `order_items`, `tables`, `waiter_notifications` | waiter/page.tsx         |

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
  └─ Configuración con 9 settings:
       ├─ Notas especiales en productos (toggle)
       ├─ Calificación de productos en el menú (toggle) — promedio de estrellas por producto en su modal de detalle
       ├─ Cambio de Desayuno a Comida (time picker)
       ├─ Impresión (toggle) — al activar muestra modal de pago simulado con tarjeta ($35 USD)
       ├─ Diseño de cuenta por defecto (select: Moderno/Clásico/Compacto)
       │    └─ Vista Previa — modal con preview del ticket
       │    └─ Personalizar — modal con editor completo de 3 modos (CheckUiCustomizer)
       │         ├─ Tabs: Moderno / Clásico / Compacto
       │         ├─ Secciones: Container, Header, Customers, Items, Totals, Footer
       │         ├─ Color picker con 12 swatches de la paleta webapp + color nativo + texto OKLCH/hex
       │         └─ Reset / Guardar — guarda en `check_ui_customization` + sincroniza `default_check_ui`
       ├─ Pasos del pedido — editor de estados (ordenado→preparación→listo→servido→cancelado)
       │    └─ Modal con campos: label, shortLabel, bg color, text color por paso
       │    └─ Guarda en `order_steps` — usado por waiter y customer
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
    │       ├── CheckUiCustomizer.tsx   # Editor completo de diseño de cuenta (3 modos)
    │       ├── CheckUiCustomizerColor.tsx  # Color picker con paleta webapp + nativo + texto
    │       ├── CheckUiPreview.tsx      # Preview visual de diseños de cuenta
    │       ├── CashRegisterManagement.tsx  # Gestión de Caja: generar/ver corte de caja diario
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
├── lib/
    │   ├── supabase/
    │   │   ├── client.ts               # Supabase client singleton
    │   │   ├── config.ts               # URL + anon key
    │   │   ├── types.ts                # Tipos TypeScript de DB
    │   │   ├── orders.ts               # CRUD órdenes
    │   │   ├── order-items.ts          # CRUD items de orden
    │   │   ├── products.ts             # Catálogo
    │   │   ├── tables.ts               # Gestión de mesas
    │   │   ├── categories.ts           # Categorías
    │   │   ├── waiter.ts               # freeTableAndClean, notif management
    │   │   ├── notifications.ts        # Crear notificaciones
    │   │   ├── history.ts              # requestBill, sales archival, historial
    │   │   ├── settings.ts             # settingsService — getSetting, getAllSettings, updateSetting
    │   │   ├── tips.ts                 # insertTip, getTipsTotal, getTipsByDateRange
    │   │   ├── feedback.ts             # getProductRatingSummaries, getGoodGeneralReviews
    │   │   └── cashRegister.ts         # getOpenReport, openRegister, previewClose, closeRegister, getAllReports, deleteReport
    │   ├── checkUiTypes.ts             # Tipos: ModeConfig, CheckUiConfig, DEFAULT_CONFIG, SPACING_MAP, etc.
    │   ├── checkUiRenderer.ts          # configToStyles() → TicketStyles con CSSProperties
    │   └── orderSteps.ts               # Tipos: OrderStep, OrderStepsConfig, DEFAULT_ORDER_STEPS, parseOrderSteps()
└── api/
    ├── admin/login/route.ts        # JWT login
    ├── admin/verify/route.ts       # JWT verify
    ├── invoice/route.ts            # Envío de factura por email
    └── settings/public/route.ts    # GET — todas las settings (service_role, bypass RLS) para customer
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
- [x] **Selector de propina para el cliente** — 10%/15%/20%/personalizado; se guarda en `waiter_notifications.tip_amount`/`tip_percentage` vía realtime; visible para el mesero al cobrar, **solo lectura** (2026-07-23, corrección — ver bullet dedicado abajo)
- [x] **Propina del mesero: solo lectura + resalta el % correcto** (2026-07-23, corrección de bug reportado por el usuario): `PaymentCalculator` (`app/waiter/page.tsx`) dejaba que el mesero cambiara la propina que el cliente ya eligió — se quitaron los `onClick`/`onChange` de los botones de % y del input personalizado (ahora son `<div>`s de solo lectura, ya no `<button>`/`<input>` editables), se eliminó `waiterModifiedRef` (el mesero ya no puede "sobreescribir" la propina en vivo). Además, antes SIEMPRE se mostraba como "Otro" con el monto crudo, porque solo se guardaba `tip_amount` (el monto en pesos) y nunca el porcentaje elegido — se agregó `waiter_notifications.tip_percentage` (`0`=sin propina, `10`/`15`/`20`=botón de %, `null`=monto personalizado) para que `resolveTipSelection()` reconstruya el modo exacto sin adivinar comparando montos. `Payment.tsx` (cliente) ahora guarda `tip_percentage` junto con `tip_amount` en cada cambio de propina
- [x] Encuesta de satisfacción post-pago (1–5 estrellas + comentario → `customer_feedback`)
  - [x] **Reseñas por producto** (2026-07-21): arriba de la encuesta general se listan los productos activos de la orden del cliente (deduplicados, cantidad neta de cancelaciones), cada uno con su propio selector de 1-5 estrellas y comentario opcional; al enviar, se insertan como filas separadas (`feedback_type='product'`, `product_id`, `product_name`) junto a la fila general (`feedback_type='general'`) en una sola llamada — la general sigue siendo la única obligatoria
- [x] Solicitud de factura por email (`/api/invoice`)
- [x] Generación de ticket PDF
- [x] **Calificación de productos en el menú** (2026-07-21): en el modal de detalle de producto (`ProductModal`), si el toggle `app_settings.product_ratings_enabled` está activo (apagado por defecto), se muestra el promedio de estrellas y número de reseñas de ese producto — calculado de `customer_feedback` (`feedback_type='product'`) vía `feedbackService.getProductRatingSummaries()`, cargado una sola vez al abrir el menú
- [x] **Pestaña "Reseñas"** (2026-07-21): 4ta pestaña en `/customer/menu` (junto a Menú/Cuenta/Mi QR) que muestra las reseñas generales del servicio con 4-5 estrellas (`feedbackService.getGoodGeneralReviews(4)`), carga perezosa al entrar al tab
  - [x] Animación de aparición por scroll (`RevealOnScroll`, IntersectionObserver con `rootMargin` de anticipación para evitar el "flash en blanco" en scroll rápido): efecto escalera para las tarjetas visibles al entrar al tab (delay escalonado por índice, tope 6 ítems), y aparición fluida una por una para las reveladas después por scroll (sin delay)
  - [x] Botón "Ver más/Ver menos" (`ReviewCard`) cuando el comentario supera 160 caracteres
- [x] **Banner de portada rediseñado** (2026-07-21): degradado oscuro en la parte inferior de la imagen de portada para legibilidad, nombre del restaurante ("RioChia7") superpuesto en blanco sobre la imagen; el header debajo ahora muestra el nombre del cliente donde antes iba el nombre del restaurante, con "Mesa N" y el código de orden debajo
- [x] **Buscador en el menú** (2026-07-21): input arriba de la barra de categorías en `Menu.tsx`; busca por nombre de producto y por nombre de categoría (insensible a acentos/mayúsculas vía `normalizeText`); resultados por nombre de producto salen primero (agrupados en una sección "Resultados para..."), seguidos de las categorías completas cuyo nombre coincide; ranking por relevancia con `getNameMatchRank` (coincidencia exacta > empieza con la búsqueda > alguna palabra empieza con la búsqueda) para evitar falsos positivos por substring (ej. buscar "té" ya no muestra "Latte")

### Waiter Dashboard

- [x] Login en `/waiter/login` por correo+contraseña o PIN de 4 dígitos (Supabase Auth), protegido por `middleware.ts`
- [x] Tab Notificaciones — feed realtime: new_order, refill, assistance, bill_request
- [x] Tab Mesas — grid con desglose por comensal
  - [x] Controles de estado por item (ordered→preparing→ready→served)
  - [x] Cancelación con PIN (parcial o total) — usa `close_table_pin` de DB (sin hardcode)
  - [x] Ordenado por número o tiempo de ocupación
  - [x] Filtro FCFS
  - [x] **Agregar productos a mesa en 2 pasos** (actualizado 2026-07-21): selecciona productos → asigna obligatoriamente a un cliente activo de la mesa (chip, comensales con orden `status='sent'`) o a sí mismo ("Mesero - {nombre}", vía `usersService.getCurrentUser()`); ya no escribe nombres libres ni permite continuar sin seleccionar
  - [x] **Bucket "general" identificado por mesero** — la sección antes llamada "General (sin cliente)" ahora muestra "Mesero - {nombre del mesero logueado}"; cada mesero tiene su propio bucket en vez de uno genérico compartido por mesa
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
- [x] Configuración (`SettingsManagement.tsx`) — panel de settings con 9 tipos: toggle, time picker, select dropdown, image upload (cover/logo), password, JSON (check_ui_customization + order_steps)
  - [x] Toggle: Notas especiales en productos, Calificación de productos en el menú, Impresión (con modal de pago simulado al activar)
  - [x] Time picker: Cambio de Desayuno a Comida
  - [x] Select: Diseño de cuenta por defecto (Moderno/Clásico/Compacto) — con botones "Vista Previa" y "Personalizar"
  - [x] **Check UI Customizer** — modal con editor completo de diseño de cuenta en 3 modos (modern, classic, compact)
    - [x] Tabs por modo con preview dinámica
    - [x] Secciones: Container, Header, Customers, Items, Totals, Footer
    - [x] Color picker (`CheckUiCustomizerColor.tsx`) con 12 swatches de la paleta webapp + input nativo + texto OKLCH/hex
    - [x] Reset por modo, Guardar persiste en `check_ui_customization` + sincroniza `default_check_ui`
    - [x] Cierre automático del modal al guardar
  - [x] **Pasos del pedido editor** — modal con campos editables para cada estado (ordered, preparing, ready, served, cancelled)
    - [x] Por paso: label, shortLabel, bg color, text color (usa CheckUiCustomizerColor)
    - [x] Guarda en `order_steps`
  - [x] Image upload: Cover del menú + Logo del negocio (movidos del sidebar a settings)
  - [x] Password: PIN para cerrar mesa (input enmascarado + toggle visibilidad + auto-save)
- [x] Upload de logo (Supabase Storage bucket `logo`) — ahora desde Configuración
- [x] Upload de cover (Supabase Storage bucket `cover-image`) — ahora desde Configuración
- [x] **Gestión de Caja** (`CashRegisterManagement.tsx`, 2026-07-22) — nueva pestaña: genera y guarda un corte de caja diario (tabla `cash_reports`), lista de reportes anteriores con detalle. Ver sección dedicada abajo.

### Check UI Customization (Diseño de Cuenta)

- [x] `app/lib/checkUiTypes.ts` — Tipos (`ModeConfig`, `CheckUiConfig`), defaults para 3 modos, `SPACING_MAP`, `BORDER_RADIUS_MAP`, `FONT_MAP`
- [x] `app/lib/checkUiRenderer.ts` — `configToStyles()` → `TicketStyles` con CSSProperties para todas las secciones del ticket
- [x] `app/admin/components/CheckUiCustomizer.tsx` — Panel de personalización con tabs por modo, secciones colapsables, reset/save
- [x] `app/admin/components/CheckUiCustomizerColor.tsx` — Color picker popover con 12 swatches + color nativo + texto OKLCH/hex
- [x] `app/admin/components/CheckUiPreview.tsx` — Preview visual de los 3 modos de ticket
- [x] `app/api/settings/public/route.ts` — GET endpoint con service_role para que customer acceda a settings sin RLS
- [x] `app/customer/components/Payment.tsx` — Render config-driven del ticket; carga settings desde `/api/settings/public`
- [x] `app/customer/components/Menu.tsx` — Carga `check_ui_customization` en loadInitialData() para render del tab "Cuenta"
- [x] Compact v2.0: sin sidebar, header transparente con texto navy, footer muted, borde sólido radius medium
- [x] CSS variables en `configToStyles()` usan `var(--border)`, `var(--muted)`, `var(--text)`, `var(--navy)`, `var(--navy-light)`, `var(--red-light)` — consistentes con webapp palette

### Order Steps (Pasos del Pedido Centralizados)

- [x] `app/lib/orderSteps.ts` — Tipos (`OrderStep`, `OrderStepsConfig`), `DEFAULT_ORDER_STEPS`, `parseOrderSteps()`, `getStepKeys()`
- [x] SQL: `INSERT INTO app_settings (key, value) VALUES ('order_steps', '{...}')` en Supabase
- [x] **Waiter prop chain**: `waiter/page.tsx` → `TablesTab` → `TableCard` → `CustomerOrderSection` → `OrderItem`
  - [x] Carga de `order_steps` en `loadData()` usando `settingsService.getSetting()`
  - [x] `OrderItem.tsx` reemplaza `STATUS_LABEL/BG/COLOR/NEXT` hardcodeados por `parseOrderSteps(orderSteps)` dinámico
- [x] **Customer Menu.tsx** — carga `order_steps` en `loadInitialData()`; badges en Cuenta tab reemplazados por render dinámico; **agregado badge `ready` que faltaba** en modo compact y normal

### Gestión de Caja (Corte de Caja Diario, 2026-07-22)

- [x] Tabla `cash_reports` — modelo **abrir/cerrar caja** (`opened_at`/`closed_at`, "abierta" = `closed_at is null`, índice único parcial garantiza una sola caja abierta a la vez). Snapshot de `sales_history`/`tips` del periodo calculado **al cerrar**. Ver detalle de columnas en "Database Schema" arriba.
- [x] `app/lib/supabase/cashRegister.ts` — `getOpenReport` (caja abierta actual), `openRegister` (efectivo inicial + `openedBy`, `openedAt` opcional), `previewClose` (agrega `sales_history`/`tips` desde `opened_at` hasta ahora, sin guardar; reutiliza `tipsService.getTipsByDateRange`), `closeRegister` (calcula `expected_cash`/`cash_difference`, guarda, y **abre automáticamente la siguiente caja**, ver bullet abajo), `getAllReports` (cerrados), `deleteReport`
- [x] `app/admin/components/CashRegisterManagement.tsx` — tarjeta "Abrir Caja" (solo efectivo inicial) cuando no hay caja abierta (en la práctica solo ocurre la primera vez, ver bullet abajo); tarjeta "Caja Abierta" persistente con botón "Cerrar Caja" que muestra preview en vivo (ventas/propinas por método de pago, cuentas, promedio) + input de efectivo contado + `expected_cash`/`cash_difference` recalculados al escribir; lista de reportes cerrados con badge sobrante/faltante/exacto y detalle en modal, eliminar con confirmación
- [x] **Siempre hay una caja activa — apertura automática al cerrar** (2026-07-22, a pedido del usuario): para evitar que a los dueños se les olvide abrir la caja al empezar el día, `closeRegister()` ya no solo cierra el reporte — inmediatamente abre el siguiente, encadenado: la hora de cierre de uno (`closed_at`) es la hora de apertura del siguiente (`opened_at`), y el efectivo **contado** físicamente (`counted_cash`, no el `expected_cash` teórico) es el efectivo inicial de la nueva caja — cualquier diferencia sobrante/faltante ya queda registrada en `cash_difference` del reporte que se cierra, no se arrastra oculta al día siguiente. `openRegister()` ahora acepta un `openedAt` opcional para fijar esa hora exacta (si no se pasa, usa `now()` — solo pasa en la apertura manual inicial/bootstrap). `closeRegister()` devuelve `{ closed, opened }` en vez de un solo reporte; `CashRegisterManagement.tsx`'s `handleCloseRegister` actualiza el estado con `opened` directamente (nunca queda en "sin caja abierta"). El flujo manual "Abrir Caja" solo se usa la primera vez que se usa el sistema — después de eso nunca vuelve a mostrarse, porque cerrar siempre deja una caja abierta detrás
- [x] **Pagos mixtos incluidos en el cálculo** (2026-07-22, corrección post-implementación): antes los cobros `payment_method='mixed'` quedaban excluidos del efectivo esperado (no se sabía cuánto de la cuenta fue efectivo vs. tarjeta). Ahora `handlePaymentConfirm` (`app/waiter/page.tsx`) calcula el desglose en MXN (`{cash, terminal, usd}`, neto de cambio) y lo guarda como JSON en `sales_history.payment_breakdown` / `tips.payment_breakdown` al momento del cobro. `cashRegisterService`'s `aggregate()` reparte cada venta/propina mixta usando ese JSON: `cash_sales`/`terminal_sales`/`usd_sales` ahora sí suman exactamente `total_sales`. Nota: la propina de un pago mixto solo guarda el desglose si viene con uno explícito — por ahora `tips.payment_breakdown` normalmente queda `null` (no se calculó un reparto proporcional propina/cuenta, fuera de alcance de este cambio)
- [x] **Columnas `mixed_sales`/`mixed_tips` eliminadas** (2026-07-22, a pedido del usuario): eran solo informativas y redundantes una vez que `cash_sales`/`terminal_sales`/`usd_sales` ya reparten los pagos mixtos por completo — no aportaban nada que no estuviera ya contemplado en esos tres. La UI ya no muestra una columna "Mixto" aparte en el desglose de ventas/propinas
- [x] **Depósitos/retiros de efectivo automáticos** (2026-07-22, a pedido del usuario): `cash_deposits`/`cash_withdrawals` regresan a `cash_reports` pero **calculados**, no como input manual. `handlePaymentConfirm` ahora arma `payment_breakdown` (con `cashTendered`/`change`) para **todo** pago con efectivo (100% efectivo o mixto, antes solo mixto). `cashRegisterService.aggregate()` suma `cashTendered` → `cash_deposits` (efectivo bruto entregado) y `change` → `cash_withdrawals` (cambio devuelto) de todo el periodo. Fórmula corregida: `expected_cash = opening_cash + cash_deposits - cash_withdrawals - cash_tips` — esto arregla un bug latente de la fórmula anterior (`opening + cash_sales - cash_tips`, que restaba propinas sin haberlas sumado primero, porque `cash_sales` es la cuenta sin propina). Verificado a mano contra Supabase con cuenta $350 + propina $50, pago $500 efectivo, cambio $100: `500 - 100 - 50 = 350` ✔️
- [x] **Ticket imprimible del corte de caja** (2026-07-22): botón "Imprimir" en la lista de reportes cerrados y en el modal de detalle, función `printCashReportTicket()` en `CashRegisterManagement.tsx`, mismo patrón que `generateTicketPDF` (`app/admin/components/Dashboard.tsx:1430-1636` — `window.open` + `document.write` + `printWindow.print()`, sin librería de PDF). Respeta el orden del ticket físico original: Caja → Forma de pago ventas → Forma de pago propina → Venta (sin impuestos, con cuentas/promedio/propinas) → Declaración de cajero al final. Omite por completo (no como "N/A") las secciones sin dato real: vales/otros, venta por tipo de producto/servicio, descuentos/cortesías, folio, comensales, cuentas canceladas
- [x] Nueva pestaña "Gestión de Caja" en el sidebar admin (`app/admin/types.ts` `AdminSection`, `app/admin/page.tsx`)
- [x] Verificado a pedido del usuario: el "cambio" (vuelto) que se le da al cliente **nunca se guarda** en la BD (`app/waiter/page.tsx:300`, solo se calcula en memoria y se muestra en un `toast`) — no afecta el cálculo porque `sales_history.total_amount` ya es neto de cambio para ventas 100% en efectivo
- [x] **"Propinas pagadas" = reparto real, no propinas recibidas** (2026-07-22, corrección del usuario): primera corrección — la línea "Propinas pagadas" usaba `cash_tips` (RECIBIDAS); se cambió a restar el reparto calculado al cerrar turno (`waiter_sessions.tips_paid_out`). **Superado por la corrección siguiente** (ver sección "Propinas acumuladas y pestaña Propinas" abajo): ese reparto tampoco sale de la caja al cerrar turno, solo cuando se marca como pagado.
- [x] **Tasa de IVA dinámica** (2026-07-22, a pedido del usuario): `cash_reports.tax_rate` ya no es un 16% hardcodeado — `cashRegister.ts`'s `getTaxRatePercent()` lee `app_settings.iva_rate` (mismo setting que `SettingsManagement.tsx` expone en "IVA y tipo de cambio", ya consumido por `Payment.tsx`/`Menu.tsx` del lado cliente) y cae a 16% solo si el setting falta o no es numérico. El valor se guarda como snapshot en `tax_rate` al cerrar la caja, así un reporte cerrado no cambia si el admin edita el setting después
- [x] Decisiones de alcance (confirmadas con el usuario): reporte diario vía abrir/cerrar (no ligado a `waiter_sessions` de un mesero), "cuentas canceladas" excluido (`resetTable()` no deja rastro hoy)
- [x] Campos del ticket físico de corte de caja NO implementados por falta de feature/dato real: vales, venta por tipo de producto/servicio, descuentos/cortesías, folio de órdenes, comensales/consumo promedio, cuentas canceladas

### Propinas acumuladas y pestaña "Propinas" en Admin (2026-07-22)

El usuario señaló que el reparto de propinas (a Barra/Cocina/etc. y lo que se le debe a un mesero por sus propinas en tarjeta) **no sale de la caja al cerrar turno** — sigue ahí hasta que alguien físicamente lo entrega. Se rediseñó de "pagado automático al cerrar turno" a un modelo de **saldo acumulado por destinatario**, con pago manual marcado desde el admin:

- [x] Tablas nuevas `tip_ledger_entries` (acumulación) y `tip_payouts` (pago real) — ver "Database Schema" arriba. Saldo pendiente = `SUM(ledger) - SUM(payouts)` por `(recipient_type, recipient_key)`.
- [x] `sessionsService.endSession()` (`app/lib/supabase/sessions.ts`) ahora, además de actualizar `waiter_sessions`, **inserta una fila en `tip_ledger_entries` por cada rol de `tip_distribution` con pct>0** (`amount = totalTips * pct/100`) y, si aplica, **una fila para el mesero** por lo que se le debe de sus propinas en tarjeta/dólares (misma fórmula `mustProvide`/`stillOwed` de `EndShiftModal.tsx`: el mesero solo entrega lo que trae en efectivo; el faltante para cubrir el reparto se descuenta de lo que se le debe, no se acumula aparte). Firma cambió: ahora recibe `waiterId`, `waiterName` y el desglose completo de propinas, no solo el total.
- [x] Nuevo `app/lib/supabase/tipLedger.ts` (`tipLedgerService`): `recordSessionAccrual` (insert masivo, usado por `endSession`), `getAllBalances` (todos los meseros activos + todos los roles configurados, con su acumulado/pagado/saldo — incluye destinatarios con movimientos aunque ya no estén en la config vigente), `markAsPaid` (inserta en `tip_payouts`, monto **editable** — permite pagos parciales, decisión confirmada con el usuario), `getRecentPayouts`, `getPaidTotalByDateRange` (usado por `cashRegister.ts` para `cash_reports.tips_paid` — reemplaza a `sessionsService.getTipsPaidOutByDateRange`, que se eliminó).
- [x] `cashRegister.ts`'s `aggregate()`: `tips_paid` ahora viene de `tipLedgerService.getPaidTotalByDateRange()` (pagos reales marcados en el periodo), no de lo acumulado al cerrar turno. Sin cambios en la fórmula de `expected_cash` en sí.
- [x] Nueva pestaña **"Propinas"** en el sidebar admin (`app/admin/types.ts` `AdminSection`, `app/admin/page.tsx`) → `app/admin/components/PropinasManagement.tsx`: tabla con todos los meseros + roles, columnas Acumulado/Pagado/Saldo pendiente, botón "Marcar como pagado" (modal con monto prellenado = saldo completo pero editable, notas opcionales) y una sección de historial de pagos recientes.
- [x] Verificado a mano contra Supabase: cerrar turno de prueba (propina $300, mezcla efectivo/tarjeta, reparto 4.2%) inserta las filas de `tip_ledger_entries` correctas (Cocina $9, Barra $3.6, mesero $200) y un corte de caja en ese periodo da `tips_paid = 0` (nada pagado todavía); al marcar Cocina como pagado (`tip_payouts`, $9), su saldo baja a $0 y un corte de caja posterior sí refleja los $9 en `tips_paid`.

### Service Layer

- [x] `tips.ts` — insertTip, getTipsTotal, getTipsByDateRange
- [x] `history.ts` — requestBill (con tip_amount), archival de ventas
- [x] `waiter.ts` — freeTableAndClean, resetTable, moveOrderItemToCustomer (reasignación de producto entre clientes de una mesa)
- [x] `notifications.ts` — creación de alertas
- [x] `feedback.ts` — getProductRatingSummaries (promedio/conteo por producto), getGoodGeneralReviews (reseñas generales 4-5★)
- [x] `cashRegister.ts` — getOpenReport, openRegister, previewClose, closeRegister, getAllReports, deleteReport
- [x] `tipLedger.ts` — recordSessionAccrual, getAllBalances, markAsPaid, getRecentPayouts, getPaidTotalByDateRange
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

| Fecha      | Nombre                                       | Descripción                                                                                                                                                                                                                                                                 |
| ---------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-15 | `add_tip_amount_to_waiter_notifications`     | Columna `tip_amount numeric DEFAULT 0` en `waiter_notifications` para comunicar propina del cliente al mesero                                                                                                                                                               |
| 2026-07-20 | `create_users_table_and_role_auth`           | Tabla `users` (roles admin/waiter/super_admin) + función `current_role()` + RLS por rol; migra el login de admin/waiter a Supabase Auth real                                                                                                                                |
| 2026-07-20 | `fix_current_role_search_path`               | Fix del linter de seguridad: `search_path` explícito en `current_role()`                                                                                                                                                                                                    |
| 2026-07-20 | `create_app_settings_table`                  | Tabla `app_settings` (feature flags opt-in/opt-out) + seed de `product_notes_enabled = false`                                                                                                                                                                               |
| 2026-07-20 | —                                            | `app_settings.value` migrado a text para soportar string (time/select) además de boolean; service layer (`settings.ts`) actualizado con tipo `string`                                                                                                                       |
| 2026-07-20 | `add_meal_type_to_products`                  | Columna `meal_type text NOT NULL DEFAULT 'both' CHECK (meal_type IN ('breakfast','lunch','both'))` en `products` — controla visibilidad por horario de desayuno/comida                                                                                                      |
| 2026-07-20 | —                                            | `close_table_pin` agregado a seeds de `app_settings`                                                                                                                                                                                                                        |
| 2026-07-20 | —                                            | `PasswordModal` refactorizado: elimina hardcode `"restaurant"`, valida contra `targetPin` prop                                                                                                                                                                              |
| 2026-07-20 | —                                            | `waiterService.resetTable()` — elimina pedidos/notificaciones sin historial (como admin)                                                                                                                                                                                    |
| 2026-07-20 | —                                            | Modal de pago simulado para `printing_enabled` — formulario tipo Shopify con tarjeta, $35 USD, mock                                                                                                                                                                         |
| 2026-07-21 | —                                            | `app/lib/checkUiTypes.ts` + `checkUiRenderer.ts` — sistema de diseño de cuenta configurable (3 modos: modern, classic, compact)                                                                                                                                             |
| 2026-07-21 | —                                            | `app/admin/components/CheckUiCustomizer.tsx` + `CheckUiCustomizerColor.tsx` + `CheckUiPreview.tsx` — editor visual de diseño de cuenta                                                                                                                                      |
| 2026-07-21 | —                                            | `app/api/settings/public/route.ts` — endpoint público para customer acceda a settings con service_role                                                                                                                                                                      |
| 2026-07-21 | —                                            | `Payment.tsx` + `Menu.tsx` — customer usa diseño config-driven desde `/api/settings/public`                                                                                                                                                                                 |
| 2026-07-21 | —                                            | `app/lib/orderSteps.ts` — tipos, defaults y parser para configuración centralizada de pasos del pedido                                                                                                                                                                      |
| 2026-07-21 | —                                            | SQL: `order_steps` agregado a `app_settings`                                                                                                                                                                                                                                |
| 2026-07-21 | —                                            | Waiter prop chain: `orderSteps` cargado en waiter/page y propagado hasta OrderItem, reemplazando STATUS\_\* hardcodeados                                                                                                                                                    |
| 2026-07-21 | —                                            | Menu.tsx: badges dinámicos en Cuenta tab + fix: agregado badge `ready` faltante                                                                                                                                                                                             |
| 2026-07-21 | —                                            | SettingsManagement.tsx: agregado editor de pasos del pedido (modal con label, shortLabel, bg, text color por paso)                                                                                                                                                          |
| 2026-07-21 | `add_feedback_type_to_customer_feedback`     | Columnas `feedback_type text NOT NULL DEFAULT 'general' CHECK (IN ('general','product'))`, `product_id integer` (sin FK), `product_name character varying` en `customer_feedback` — distingue reseña general de reseña por producto                                         |
| 2026-07-21 | `seed_product_ratings_enabled_setting`       | Seed `product_ratings_enabled = 'false'` en `app_settings` — toggle para mostrar calificación de productos en el menú                                                                                                                                                       |
| 2026-07-22 | `create_cash_reports_table`                  | Tabla `cash_reports` inicial (corte de caja diario por fecha manual) — versión reemplazada el mismo día, ver fila siguiente                                                                                                                                                 |
| 2026-07-22 | `cash_reports_open_close_flow`               | Rediseño a sesión abrir/cerrar: se eliminan `report_date`, `cash_deposits`, `cash_withdrawals`; se agregan `opened_at`, `closed_at`, `closed_by` (`created_by` → `opened_by`); índice único parcial `cash_reports_single_open_idx` garantiza una sola caja abierta a la vez |
| 2026-07-22 | `create_table_waiter_assignments`            | Nueva tabla `table_waiter_assignments` (table_id, waiter_id, waiter_name, assigned_at) + RLS público — permite al cliente asignar un mesero a su mesa desde el tab Cuenta                                                                                                   |
| 2026-07-22 | `add_delete_policy_table_waiter_assignments` | Política `for delete to public` en `table_waiter_assignments` — faltaba y RLS bloqueaba el DELETE en `freeTableAndClean`/`resetTable`                                                                                                                                       |
| 2026-07-22 | `add_payment_breakdown_for_mixed_payments`   | Columna `payment_breakdown jsonb` en `sales_history` y `tips` (solo se llena si `payment_method='mixed'`: `{cash, terminal, usd}` en MXN) — permite a `cash_reports` repartir cobros mixtos entre efectivo/tarjeta en vez de excluirlos del cálculo                          |
| 2026-07-22 | `drop_mixed_columns_from_cash_reports`       | Se eliminan `cash_reports.mixed_sales`/`mixed_tips` — redundantes, `cash_sales`/`terminal_sales`/`usd_sales` ya reparten los pagos mixtos por completo                                                                                                                      |
| 2026-07-22 | `add_cash_deposits_withdrawals_computed`     | Regresan `cash_reports.cash_deposits`/`cash_withdrawals`, ahora calculados (no manuales) desde `payment_breakdown.cashTendered`/`change`; fórmula de `expected_cash` actualizada para incluir depósitos/retiros en vez de `cash_sales`                                       |
| 2026-07-22 | `add_tax_rate_snapshot_to_cash_reports`      | Columna `cash_reports.tax_rate numeric not null default 16` — snapshot de `app_settings.iva_rate` tomado al cerrar la caja, reemplaza el 16% hardcodeado que usaba `subtotal`/`tax_amount`                                                                                 |
| 2026-07-22 | `add_tip_payout_snapshot_to_waiter_sessions` | Columnas `waiter_sessions.tips_collected`/`tips_paid_out numeric not null default 0`/`tip_distribution_snapshot jsonb` — persiste el reparto de propinas al cerrar turno (antes se calculaba solo para mostrar en `EndShiftModal.tsx` y se descartaba)                     |
| 2026-07-22 | `add_tips_paid_to_cash_reports`              | Columna `cash_reports.tips_paid numeric not null default 0` — en un inicio suma de `waiter_sessions.tips_paid_out`; luego redefinida (ver fila siguiente) para sumar `tip_payouts` en su lugar. Reemplaza `cash_tips` (propinas recibidas) en la fórmula de `expected_cash` y en la línea "Propinas pagadas" del ticket |
| 2026-07-22 | `create_tip_ledger_and_payouts`              | Tablas nuevas `tip_ledger_entries` (acumulación al cerrar turno) y `tip_payouts` (pago real marcado en el admin) — `cash_reports.tips_paid` pasa a sumar `tip_payouts` en vez de `waiter_sessions.tips_paid_out`, porque ese reparto tampoco sale de la caja hasta que se paga de verdad |
| 2026-07-23 | `add_tip_percentage_to_waiter_notifications` | Columna `waiter_notifications.tip_percentage numeric` (nullable) — guarda qué botón de % eligió el cliente (`0`/`10`/`15`/`20`, `null`=personalizado), para que el mesero vea el botón correcto resaltado en vez de siempre "Otro"                                          |

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

## Courses (Tiempos de Comida) — 2026-07-21

### SQL

- `alter table public.order_items add column course smallint not null default 1 check (course >= 1 and course <= 3)`

### UI Mejoras

| Cambio                                   | Archivo(s)                           | Detalle                                                                                                                       |
| ---------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Selector de course en modal del producto | `Menu.tsx` (ProductModal)            | Botones `Primer / Segundo / Tercer tiempo` al agregar item al carrito, con estado `course` que se pasa a `addToCart`          |
| Labels mejorados en carrito              | `Menu.tsx` (CartDrawer)              | Botones `1\|2\|3` → `1er\|2do\|3er`                                                                                           |
| Agrupación global en Cuenta tab          | `Menu.tsx` (Cuenta tab, ambos modos) | Items agrupados por course sobre todos los pedidos del cliente, con headers `⏱ PRIMER TIEMPO (N)` y timestamp inline por item |
| course en query del waiter               | `waiter.ts` (`getTablesWithOrders`)  | Agregado `course` a la lista de columnas SELECT de `order_items`                                                              |
| Agrupación por course en waiter          | `CustomerOrderSection.tsx`           | Items agrupados por course con headers `⏱ PRIMER TIEMPO (N)` por cliente                                                      |
| Selector de course al agregar productos  | `TableHeader.tsx`                    | Botones de tiempo en Step 1 del modal "Agregar Productos"; `course` incluido en insert payload y en dedup                     |
| course en OrderItemWithProduct           | `history.ts`                         | Agregado `course: number` a la interfaz para datos históricos                                                                 |

### Archivos modificados

- `app/lib/supabase/types.ts` — `course` en `order_items.Row`, `Insert`, `Update`
- `app/lib/supabase/order-items.ts` — `course` en `OrderItem`, parámetro en `addItemToOrder` y `updateItemQuantity`
- `app/lib/supabase/waiter.ts` — `course` en `OrderItemRow`, `getTablesWithOrders` query, mapping
- `app/lib/supabase/history.ts` — `course` en `OrderItemWithProduct`
- `app/context/OrderContext.tsx` — `course?: number` en `addToCart` y `updateCartItem`
- `app/customer/components/Menu.tsx` — ProductModal course selector, CartDrawer labels, Cuenta tab grouping global
- `app/waiter/components/TableHeader.tsx` — Course selector en modal de agregar productos
- `app/waiter/components/CustomerOrderSection.tsx` — Grouping por course con headers
- `app/waiter/components/OrderItem.tsx` — Badge T1/T2/T3
- `app/customer/components/Payment.tsx` — Items agrupados por course

### Comportamiento

- Nuevos items se crean con `course = 1` por defecto (default DB)
- Customer elige tiempo al agregar producto en el modal
- Customer puede cambiar tiempo desde el carrito
- Waiter elige tiempo al agregar productos a una mesa
- Waiter ve items agrupados por tiempo dentro de cada cliente
- Cuenta tab del customer muestra items agrupados globalmente por tiempo
- Ticket de pago agrupa items por tiempo

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

### 6. Sistema de Reservaciones

- [ ] Tabla `reservations` (id, table_id, customer_name, phone, date, time, party_size, status)
- [ ] Vista en Admin para crear/ver/cancelar reservaciones
- [ ] Vista en Waiter — agenda del día con reservas pendientes
- [ ] Al llegar la hora, cambiar mesa a `occupied` automáticamente
- [ ] Opcional: link público para que el cliente reserve sin QR

### 7. Cierre de Turno / Distribución de Propinas

Rastrea la sesión de cada mesero y muestra un modal al cerrar turno con la distribución de propinas recolectadas según porcentajes configurables.

#### SQL aplicado en Supabase (`hewsvtyerwmntekkmyav`)

- ✅ `waiter_sessions` tabla creada con FK a `users`
- ✅ `tips.waiter_id` columna agregada con FK a `users`
- ✅ Índices: `waiter_sessions_waiter_id_idx`, `waiter_sessions_started_at_idx`, `tips_waiter_id_idx`
- ✅ Seed `tip_distribution` insertado en `app_settings`

#### Esquema

**Nueva tabla:** `waiter_sessions`

| Columna     | Tipo          | Notas                                     |
| ----------- | ------------- | ----------------------------------------- |
| id          | uuid PK       | gen_random_uuid()                         |
| waiter_id   | uuid FK→users | CASCADE                                   |
| waiter_name | text          | snapshot al iniciar sesión                |
| started_at  | timestamptz   | default now()                             |
| ended_at    | timestamptz   | nullable, se llena al cerrar turno        |
| total_sales | numeric       | default 0, se acumula al cobrar cada mesa |
| tips_collected | numeric    | default 0, snapshot: total de propinas de la sesión (todas las formas de pago) al cerrar turno (2026-07-22) |
| tips_paid_out | numeric     | default 0, monto realmente repartido al cerrar turno = `tips_collected × (Σ% con pct>0) / 100` — lo que usa `cash_reports.tips_paid` (2026-07-22) |
| tip_distribution_snapshot | jsonb | copia de `app_settings.tip_distribution` usada en ese cierre, para trazabilidad si el admin cambia los % después (2026-07-22) |
| created_at  | timestamptz   | default now()                             |

**Columna agregada:** `tips.waiter_id` (uuid FK→users, nullable)

**Setting en `app_settings`:** `tip_distribution`

```json
{
  "Barra": 1.2,
  "Cocina": 3.0,
  "Garrotero": 0,
  "Capitan": 0,
  "Staff": 1.0,
  "Caja": 1.2,
  "Empaque": 0
}
```

#### Ciclo de Vida

| Paso                        | Acción                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Login exitoso (PIN o email) | `INSERT waiter_sessions { waiter_id, waiter_name, started_at: now() }`                    |
| Cobro exitoso               | `UPDATE waiter_sessions SET total_sales = total_sales + $monto WHERE id = session_activa` |
| Cobro con propina           | `INSERT tips { ..., waiter_id }` con el ID del mesero que cobró                           |
| Click "Salir"               | En vez de logout inmediato → abre `EndShiftModal`                                         |
| Modal → "Cerrar Sesión"     | `UPDATE waiter_sessions SET ended_at, tips_collected, tips_paid_out, tip_distribution_snapshot` + inserta filas en `tip_ledger_entries` (una por rol, una para el mesero si le deben dinero) — ver sección "Propinas acumuladas" arriba → logout |
| Modal → "Cancelar"          | Cierra modal, permanece en el dashboard                                                   |

#### EndShiftModal

Al hacer click en "Salir", se muestra un modal con:

- **Encabezado:** Logo / nombre del restaurante, fecha actual
- **Sesión:** Inicio y fin del turno, nombre del mesero
- **Ventas:** Total de ventas procesadas (con impuestos) en el turno
- **Propinas:** Total de propinas recolectadas en el turno, con desglose Efectivo/Tarjeta/Dólares (2026-07-22, a pedido del usuario — antes solo mostraba el total)
- **Distribución:** Tabla con cada rol, su porcentaje y el monto calculado; fila final **"Total a repartir"** con el % y el monto en pesos (2026-07-22 — antes solo mostraba el % sumado, sin el monto)
- **Te toca de propina:** (2026-07-22, nuevo) lo que le corresponde al mesero = `totalTips - montoARepartir`; debajo, dos avisos **independientes** (no mutuamente excluyentes), cada uno solo si es > 0:
  - **"Debes entregar (para la repartición): $X"** — lo que el mesero entrega en efectivo para el reparto; nunca más de lo que trae en efectivo (`min(tipsCash, montoARepartir)`)
  - **"Te falta recibir (tarjeta/dólares): $X"** — lo que aún no recibió en mano porque llegó por tarjeta/dólares, menos lo que el efectivo no alcanzó a cubrir del reparto (ver `cashShortfall` abajo)
- **Botones:** "Cerrar Sesión" (confirma, guarda el reparto y hace logout) / "Cancelar" (vuelve al dashboard)

#### Cálculo

```
totalTips = SUM(tips.amount) WHERE waiter_id = ? AND created_at BETWEEN session.started_at AND NOW()
tipsCash/tipsTerminal/tipsUsd = mismo query desglosado por payment_method (reparte 'mixed' via payment_breakdown)
por cada rol en tip_distribution:
    monto = totalTips * (porcentaje / 100)
montoARepartir = totalTips * (Σ porcentajes / 100)
teToca = totalTips - montoARepartir
debeEntregar = min(tipsCash, montoARepartir)                          -- nunca más de lo que trae en efectivo
cashShortfall = max(0, montoARepartir - tipsCash)                     -- lo que el efectivo NO alcanzó a cubrir del reparto
teFaltaRecibir = max(0, tipsTerminal + tipsUsd - cashShortfall)       -- el faltante se descuenta de la tarjeta/dólares, no se pide "de la nada"
```
Corrección 2026-07-22 (dos rondas, tras pruebas reales): 1) con propina 100% en efectivo, antes no se mostraba "Debes entregar" porque el efectivo alcanzaba a cubrir el reparto sin mostrar nada — se corrigió mostrando siempre `debeEntregar` cuando es > 0. 2) con propina 100% en tarjeta (`tipsCash = 0`), la fórmula anterior (`debeEntregar = montoARepartir` fijo) le pedía entregar dinero que nunca tuvo en la mano — se corrigió con `min(tipsCash, montoARepartir)`, y el faltante que el efectivo no cubre (`cashShortfall`) ahora se descuenta de `teFaltaRecibir` en vez de exigírsele aparte. Ejemplo verificado a mano: propina $300 (100% tarjeta), reparto 4.2% → `montoARepartir=12.6`, `debeEntregar=0` (no se muestra), `teFaltaRecibir=287.4` (= `teToca` completo, ya que no tiene nada de efectivo).
`sessionsService.getTipsBreakdownForSession(waiterId, startedAt)` (`app/lib/supabase/sessions.ts`, 2026-07-22) hace el query desglosado; `handleLogout` en `app/waiter/page.tsx` lo llama y pasa el resultado a `EndShiftModal.tsx`, que hace los cálculos de arriba.

#### Archivos modificados ✅

| Archivo                              | Cambio                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `schema_export.sql`                  | Tabla `waiter_sessions`, columna `tips.waiter_id`, índices, seed `tip_distribution` |
| `app/lib/supabase/types.ts`          | Tipo `WaiterSession`, `waiter_id` en `Tip`                                          |
| `app/lib/supabase/tips.ts`           | `insertTip` acepta `waiter_id`                                                      |
| `app/lib/supabase/sessions.ts`       | **Nuevo** — service layer completo                                                  |
| `app/api/auth/waiter-login/route.ts` | Crea `waiter_sessions` al iniciar sesión                                            |
| `app/waiter/page.tsx`                | `handleLogout` → abre modal; al cobrar actualiza `total_sales` + pasa `waiter_id`   |

#### Archivos nuevos ✅

| Archivo                                   | Propósito                                                               |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `app/waiter/components/EndShiftModal.tsx` | Modal de cierre de turno con distribución                               |
| `app/admin/components/SessionsView.tsx`   | Vista de turnos en Admin con histórico de ventas y propinas             |
| `app/admin/types.ts`                      | Tipo `AdminSection` incluye `"sessions"`, nuevo `WaiterSessionWithTips` |
| `app/lib/supabase/sessions.ts`            | `getAllSessionsWithTips()` — lista todas las sesiones con sus propinas  |

#### Settings en Admin ✅

Editor JSON para `tip_distribution` en `SettingsManagement.tsx` para modificar porcentajes de cada rol.

#### Admin — Turnos (nueva sección, abajo del sidebar)

Sidebar agrega **Turnos** separado del resto por un divider `<hr>`, al final del menú de navegación.

| Columna  | Descripción                                                                    |
| -------- | ------------------------------------------------------------------------------ |
| Mesero   | Nombre del waiter                                                              |
| Inicio   | Fecha y hora de login                                                          |
| Fin      | Fecha y hora de logout (o badge "Activo")                                      |
| Ventas   | `total_sales` de la sesión                                                     |
| Propinas | Suma de `tips.amount` filtrada por `waiter_id` entre `started_at` y `ended_at` |
| Duración | Minutos/horas entre inicio y fin                                               |

Tres tarjetas de resumen arriba: Total ventas, Total propinas, Turnos registrados.

---

## 8. Waiter — Realtime heartbeat (sin polling)

Eliminado el `setInterval` de 2 min que hacía polling de datos. Ahora el waiter se actualiza 100% vía Realtime:

- 4 canales Supabase: `waiter-notifications`, `waiter-orders`, `order-items`, `tables`
- Lógica de recarga centralizada en `reloadData()` (antes duplicada 4 veces)
- Detección automática de reconexión: cada canal monitorea su estado (`SUBSCRIBED` / `CHANNEL_ERROR` / `TIMED_OUT` / `CLOSED`). Si se reconecta tras una caída, ejecuta `reloadData()` automáticamente.

### Archivos modificados ✅

| Archivo               | Cambio                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `app/waiter/page.tsx` | Eliminado `setInterval` de 120s; centralizado `reloadData()`; agregado `onStatus()` para detectar reconexiones y refrescar datos |

### Beneficios

- Sin requests periódicas innecesarias
- Datos siempre frescos vía WebSocket
- Cobertura ante caídas de conexión (recarga al reconectar)

---

## 9. Admin — Realtime en vivo

Agregado Realtime a las secciones del Admin que más se benefician de actualizaciones en vivo:

| Sección          | Canales Supabase                                            | Comportamiento                                                                                                          |
| ---------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Dashboard        | `orders`, `order_items`, `waiter_sessions`, `sales_history` | Al recibir cualquier cambio (`INSERT`/`UPDATE`/`DELETE`), recarga `loadDailyData()` + `loadSalesData()` automáticamente |
| Gestión de Mesas | `tables`                                                    | Recarga la lista de mesas cuando un waiter cambia el estado                                                             |
| Turnos           | `waiter_sessions`                                           | Refresca la tabla de turnos cuando alguien inicia/cierra sesión                                                         |

### Archivos modificados ✅

| Archivo                                     | Cambio                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `app/admin/page.tsx`                        | Nuevo `useEffect` con 4 canales Realtime que recargan el Dashboard en vivo |
| `app/admin/components/TablesManagement.tsx` | Agregado canal `admin-tables` que recarga mesas al cambiar                 |
| `app/admin/components/SessionsView.tsx`     | Agregado canal `admin-sessions` que recarga turnos al cambiar              |

### Documentación

`schema_export.sql` incluye comentario al inicio listando las 6 tablas que usan Realtime (`tables`, `orders`, `order_items`, `waiter_notifications`, `waiter_sessions`, `sales_history`).

---

## 10. Stripe + pagos con tarjeta (futuro — no urgente)

Si se quisiera agregar cobro con tarjeta, la arquitectura ya lo soporta sin backend adicional:

### Componentes necesarios

1. **Edge Function `create-checkout-session`** — crea sesión de Stripe Checkout con los items del carrito
2. **Edge Function `stripe-webhook`** — recibe el webhook de Stripe, verifica la firma, y escribe en DB con `SUPABASE_SERVICE_ROLE_KEY`
3. **Frontend** — redirige a Stripe Checkout y maneja el `success_url`/`cancel_url`

### Ventajas de Edge Functions para Stripe

- `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` se guardan como secrets de Edge Function
- `SUPABASE_SERVICE_ROLE_KEY` permite escribir en DB sin RLS (necesario para confirmar pagos)
- No requiere servidor propio, certificado SSL, ni despliegue aparte

### Cuándo tendría sentido

- Cuando el restaurant quiera aceptar tarjetas además de efectivo
- Se puede mantener el cobro en efectivo existente + agregar Stripe como alternativa sin migración

---

## 11. Waiter — Pestaña de Propinas en vivo

Nueva pestaña **Propinas** en el panel del mesero (junto a Notificaciones, Mesas, Productos) que muestra las propinas acumuladas durante la sesión activa:

### Componentes

| Archivo                             | Propósito                                                                        |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `app/waiter/components/TipsTab.tsx` | **Nuevo** — tarjeta con total, distribución por rol, y lista de últimas propinas |
| `app/waiter/components/Tabs.tsx`    | Agregado tab `"tips"` con label "Propinas"                                       |
| `app/lib/supabase/tips.ts`          | Nuevo método `getTipsByWaiterAndSession(waiterId, startedAt)`                    |

### Datos mostrados

- **Total de propinas** en la sesión activa (con Realtime — se actualiza al cobrar)
- **Distribución por rol** (`tip_distribution` desde settings) con montos calculados
- **Últimas 20 propinas**: mesa, cliente, monto, hora

### Realtime

Canal `waiter-tips` escucha `INSERT` en `tips` con filtro `waiter_id=eq.${waiterId}` + detección de reconexión.

### Archivos modificados ✅

| Archivo                             | Cambio                                                               |
| ----------------------------------- | -------------------------------------------------------------------- |
| `app/waiter/page.tsx`               | Import de `TipsTab`; union type incluye `"tips"`; render condicional |
| `app/waiter/components/Tabs.tsx`    | Tab `"tips"` agregado a `TABS` y `TabsProps`                         |
| `app/waiter/components/TipsTab.tsx` | **Nuevo** — componente completo                                      |
| `app/lib/supabase/tips.ts`          | `getTipsByWaiterAndSession()` agregado                               |

---

## 12. Settings UI — Unificado + Fixes finales

### Settings — UI consistente

"Pasos del pedido" y "Distribución de propinas" se integraron al array `SETTINGS` principal con tipo `"action"` (vs. standalone cards separados), usando el mismo patrón de ícono + label + descripción + control que el resto de settings. Ya no son tarjetas sueltas con estilo distinto.

| Archivo                                       | Cambio                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/admin/components/SettingsManagement.tsx` | `SETTINGS` ahora incluye `order_steps` y `tip_distribution` con `type: "action"`; `renderControl` añade caso `"action"` que renderiza un botón "Personalizar"/"Editar" igual que los demás controles; eliminadas las 2 secciones standalone duplicadas |

### Customer Realtime — Fix currentTableId

El `useEffect` de Realtime para actualizar la cuenta del customer en vivo usaba `tableId` directamente, pero cuando el customer entra vía QR session el valor real está en `currentTableId` (localStorage). Ahora usa `const tid = tableId || currentTableId;` como el resto de subscriptions, con `[tableId, currentTableId]` en dependencias.

| Archivo                            | Cambio                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `app/customer/components/Menu.tsx` | Subscription Realtime corregida: `tid = tableId \|\| currentTableId`, dependencias incluyen ambos |

### Waiter — Badge de course eliminado

El badge azul `T1`/`T2`/`T3` que aparecía al lado del nombre del producto en el panel del mesero fue removido. El course se sigue viendo en la agrupación por tiempo dentro de cada cliente (`CustomerOrderSection.tsx`).

| Archivo                               | Cambio                                                         |
| ------------------------------------- | -------------------------------------------------------------- |
| `app/waiter/components/OrderItem.tsx` | Eliminado `<span>` del badge de course T1/T2/T3 (líneas 87-91) |

---

## 13. Asignación de Mesero a Mesa

### Problema

En `Payment.tsx`, el nombre del mesero se cargaba desde la sesión activa más reciente de `waiter_sessions` (cualquier mesero, no uno asignado a la mesa), mostrando un nombre de mesero aleatorio por defecto.

### Solución

Nueva tabla `table_waiter_assignments` y botón "⇽ Asignarme" en cada tarjeta de mesa para que el mesero se asigne manualmente. Si no hay asignación, se muestra `"—"`.

### SQL aplicado en Supabase

- ✅ `CREATE TABLE table_waiter_assignments` con `table_id`, `waiter_id`, `waiter_name`, `assigned_at`
- ✅ RLS: `SELECT`, `INSERT` y `DELETE` públicos
- ✅ Migration: `add_delete_policy_table_waiter_assignments` — agrega política `for delete to public`

### Bugs corregidos

1. **Stale state en `assignedWaiter`**: El `useEffect` cargaba la asignación con `[table.id, waiterId]`. Cuando la mesa se cobraba/reseteaba y luego un nuevo cliente se conectaba, `table.id` y `waiterId` eran los mismos → el efecto no se re-ejecutaba, y `assignedWaiter` mantenía el valor de la sesión anterior. El badge "✓ {nombre}" se mostraba en la nueva sesión sin que el mesero se hubiera asignado.  
   **Fix**: agregado `table.status` a dependencias + `setAssignedWaiter(null)` al inicio del efecto.

2. **RLS bloqueaba DELETE**: El `table_waiter_assignments` no tenía política `for delete`, así que el `DELETE` en `freeTableAndClean` y `resetTable` fallaba silenciosamente vía RLS, dejando la asignación vieja en la BD.  
   **Fix**: agregada política `"Anyone can delete table_waiter_assignments"` vía migration + datos stale limpiados manualmente.

3. **PERSONAS contaba al mesero**: En `Payment.tsx`, `customerSummaries.length` incluía el grupo "Mesero - dev" como si fuera un comensal.  
   **Fix**: `realCustomerSummaries` filtra grupos `startsWith("Mesero - ")`.

### Flujo

1. Mesero ve la mesa en el tab Mesas
2. Hace clic en **⇽ Asignarme** en el header de la tarjeta
3. Se upserta en `table_waiter_assignments` (delete previo + insert nuevo)
4. El botón se reemplaza por un badge **✓ {nombre}** indicando que ya está asignado
5. Customer en `Payment.tsx` consulta `table_waiter_assignments` por `table_id`
6. Si nadie se ha asignado → se muestra `"—"`
7. Se eliminó la sección "Mesero - {name}" vacía que aparecía por defecto en las tarjetas de mesa
8. Al cobrar/cerrar mesa: `freeTableAndClean` / `resetTable` borran `table_waiter_assignments` para que la próxima sesión comience sin asignación

| Archivo                                 | Cambio                                                                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/waiter/components/TableHeader.tsx` | `useEffect` depende de `[table.id, waiterId, table.status]` + resetea `assignedWaiter` a null antes de cada query                                    |
| `app/waiter/components/TableCard.tsx`   | Eliminado el auto-create de sección "Mesero - dev" vacía; propagada prop `waiterId`                                                                  |
| `app/waiter/components/TablesTab.tsx`   | Prop `waiterId` agregada y propagada a TableCard                                                                                                     |
| `app/waiter/page.tsx`                   | Pasa `activeSession?.waiter_id` como `waiterId` a TablesTab                                                                                          |
| `app/customer/components/Payment.tsx`   | Query de `waiter_sessions` → `table_waiter_assignments` por `table_id`; si no hay asignación, `"—"`; `realCustomerSummaries` para conteo de PERSONAS |
| `app/lib/supabase/waiter.ts`            | `freeTableAndClean` y `resetTable` ahora borran `table_waiter_assignments`                                                                           |
| `schema_export.sql`                     | Política `for delete to public` agregada                                                                                                             |

### Settings — UI consistente

"Pasos del pedido" y "Distribución de propinas" se integraron al array `SETTINGS` principal con tipo `"action"` (vs. standalone cards separados), usando el mismo patrón de ícono + label + descripción + control que el resto de settings. Ya no son tarjetas sueltas con estilo distinto.

| Archivo                                       | Cambio                                                                                                                                                                                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `app/admin/components/SettingsManagement.tsx` | `SETTINGS` ahora incluye `order_steps` y `tip_distribution` con `type: "action"`; `renderControl` añade caso `"action"` que renderiza un botón "Personalizar"/"Editar" igual que los demás controles; eliminadas las 2 secciones standalone duplicadas |

### Customer Realtime — Fix currentTableId

El `useEffect` de Realtime para actualizar la cuenta del customer en vivo usaba `tableId` directamente, pero cuando el customer entra vía QR session el valor real está en `currentTableId` (localStorage). Ahora usa `const tid = tableId || currentTableId;` como el resto de subscriptions, con `[tableId, currentTableId]` en dependencias.

| Archivo                            | Cambio                                                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `app/customer/components/Menu.tsx` | Subscription Realtime corregida: `tid = tableId \|\| currentTableId`, dependencias incluyen ambos |

### Waiter — Badge de course eliminado

El badge azul `T1`/`T2`/`T3` que aparecía al lado del nombre del producto en el panel del mesero fue removido. El course se sigue viendo en la agrupación por tiempo dentro de cada cliente (`CustomerOrderSection.tsx`).

| Archivo                               | Cambio                                                         |
| ------------------------------------- | -------------------------------------------------------------- |
| `app/waiter/components/OrderItem.tsx` | Eliminado `<span>` del badge de course T1/T2/T3 (líneas 87-91) |
