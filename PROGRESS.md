# ScanEat — Progress Tracker

> Restaurant management platform with real-time ordering, table management, and payment processing.
> Stack: Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4 · Supabase (PostgreSQL + Realtime)

---

## ✅ Completed

### Infrastructure & Tech Stack
- [x] Next.js 16 App Router project setup with TypeScript
- [x] Tailwind CSS 4 with custom design system (OKLCH colors, Plus Jakarta Sans)
- [x] Supabase client configured with SSR support
- [x] Context providers: OrderContext, SessionContext, ToastContext, ConfirmContext
- [x] Admin JWT authentication (`/api/admin/login`, `/api/admin/verify`)
- [x] Environment variable configuration for Supabase and admin credentials

---

### Database Schema (Supabase PostgreSQL)
- [x] `tables` — restaurant seating (number, status, capacity, location)
- [x] `categories` — product grouping (name, slug, display_order, is_active)
- [x] `products` — menu items (name, price, category FK, image_url, is_available, rating, extras JSONB)
- [x] `orders` — customer orders (table_id FK, customer_name, status, total_amount)
- [x] `order_items` — items per order with status lifecycle (ordered → preparing → ready → served / cancelled)
- [x] `waiter_notifications` — alerts to waiter (new_order, refill, assistance, bill_request)
- [x] `sales_history` — archived closed orders (table_number, total_amount, payment_method, closed_at)
- [x] `sales_items` — archived items per closed sale
- [x] `customer_feedback` — ratings and reviews (1–5 stars, comment, order summary)

---

### Customer Portal (`/customer/*`)
- [x] QR code entry — table discovery via scanned QR
- [x] Menu page — browse by category, view products, add to cart with custom notes
- [x] Per-customer ordering — multiple diners per table each with their own session
- [x] Real-time order status tracking
- [x] Product ratings and favorites
- [x] Order history page — view past orders for the session
- [x] Payment page — view full bill, send payment request notification to waiter
- [x] QR Share page — display/share table QR code with other diners

---

### Waiter Dashboard (`/waiter`)
- [x] Tab navigation: Notifications · Tables · Products
- [x] **Notifications tab** — live feed of: new orders, refill requests, assistance calls, bill requests
- [x] Real-time subscriptions via Supabase (orders, order_items, tables, waiter_notifications)
- [x] Auto-refresh every 2 minutes as fallback
- [x] **Tables tab** — grid of all tables with per-customer order breakdown
  - [x] Item status controls: ordered → preparing → ready → served
  - [x] Password-protected item cancellation
  - [x] Table sorting by number or occupation time
  - [x] FCFS (First-Come-First-Served) filter
- [x] **Unified Payment Calculator** — single total with:
  - [x] Cash (MXN)
  - [x] Terminal / Card (MXN)
  - [x] USD with configurable exchange rate
  - [x] Mixed payment methods
  - [x] Automatic change calculation
- [x] **Split Payments modal** — per-customer payment breakdown with individual payment modals
- [x] **Products tab** — quick availability toggle for inventory management

---

### Admin Dashboard (`/admin`)
- [x] Login page with JWT session (persisted in localStorage)
- [x] Collapsible sidebar navigation
- [x] **Dashboard / Analytics**
  - [x] Daily stats cards: total orders, revenue, items sold, active tables, avg order value
  - [x] Date range filtering for historical analysis
  - [x] Top 10 popular products by quantity sold
  - [x] Sales history table with payment method tracking
- [x] **Tables Management** — full CRUD (create, edit, delete tables; set capacity & location; manage status)
- [x] **Products Management** — full CRUD (add/edit/delete, image upload, pricing, prep time, availability, extras/add-ons)
- [x] **Categories Management** — create/edit/delete, set display order, activate/deactivate
- [x] Logo upload — store restaurant branding in Supabase Storage (`logo` bucket)
- [x] Direct link to Waiter portal from admin sidebar

---

### Service Layer (`/app/lib/supabase/`)
- [x] `orders.ts` — order CRUD and status updates
- [x] `order-items.ts` — order item operations
- [x] `products.ts` — product catalog queries
- [x] `tables.ts` — table management queries
- [x] `categories.ts` — category operations
- [x] `waiter.ts` — notification fetching and table subscriptions
- [x] `notifications.ts` — bill/alert notification creation
- [x] `history.ts` — sales history archival on table close

---

## 🔲 Pending

### Tips (Propinas) — Customer Flow + Nueva Tabla Supabase
- [ ] **Nueva tabla `tips`** en Supabase que usará todo el sistema
  - Campos planeados: `id` (UUID PK), `order_id` FK, `table_id` FK, `customer_name`, `amount`, `payment_method`, `created_at`
- [ ] **Nuevo step en el flujo de pago del cliente** — antes de calificar la comida y dejar comentario, se insertará un paso intermedio de propina
  - Pantalla de selección de propina (porcentajes sugeridos: 10%, 15%, 20% + monto personalizado + sin propina)
  - El step de tips aparece entre el pago y el de calificación/comentario
- [ ] Integrar el monto de propina al total mostrado en el **Payment Calculator** del waiter (unified y split)
- [ ] Mostrar propinas en el **Admin Dashboard** — incluir en métricas diarias y en `sales_history`
- [ ] Guardar propina en la tabla `tips` al confirmar el cliente

---

## 🗒️ Notes

- Project name in codebase: `menu-jp` (package.json), branded as **ScanEat**
- Package manager: Bun
- All monetary values are in MXN by default; USD exchange rate is configurable per payment
