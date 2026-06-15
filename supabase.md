# 🗄️ Supabase Database Schema

## Overview

Database schema for ScanEat — restaurant management system with real-time ordering, table management, tips, and payment processing. All tables have **RLS enabled**.

---

## Tables

### `tables`

| Column     | Type         | Constraints / Default          |
| ---------- | ------------ | ------------------------------ |
| id         | serial       | PK                             |
| number     | integer      | NULL                           |
| status     | varchar(20)  | DEFAULT 'available'            |
| capacity   | integer      | NOT NULL                       |
| location   | varchar(100) | NULL                           |
| created_at | timestamptz  | DEFAULT timezone('utc', now()) |
| updated_at | timestamptz  | DEFAULT timezone('utc', now()) |

**Status values:** `available` · `occupied`

---

### `categories`

| Column        | Type         | Constraints / Default          |
| ------------- | ------------ | ------------------------------ |
| id            | serial       | PK                             |
| name          | varchar(100) | NOT NULL                       |
| slug          | varchar(100) | NOT NULL, UNIQUE               |
| description   | text         | DEFAULT ''                     |
| display_order | integer      | DEFAULT 0                      |
| is_active     | boolean      | DEFAULT true                   |
| created_at    | timestamptz  | DEFAULT timezone('utc', now()) |
| updated_at    | timestamptz  | DEFAULT timezone('utc', now()) |

---

### `products`

| Column           | Type         | Constraints / Default          |
| ---------------- | ------------ | ------------------------------ |
| id               | serial       | PK                             |
| name             | varchar(100) | NOT NULL                       |
| description      | text         | NULL                           |
| price            | integer      | NOT NULL (centavos MXN)        |
| category         | varchar(50)  | NOT NULL                       |
| image_url        | varchar(255) | NULL                           |
| is_available     | boolean      | DEFAULT true                   |
| preparation_time | integer      | NULL (minutos)                 |
| rating           | numeric(2,1) | DEFAULT 0.0                    |
| rating_count     | integer      | DEFAULT 0                      |
| is_favorite      | boolean      | DEFAULT false                  |
| extras           | jsonb        | DEFAULT '[]'                   |
| created_at       | timestamptz  | DEFAULT timezone('utc', now()) |
| updated_at       | timestamptz  | DEFAULT timezone('utc', now()) |

**`extras` formato:** `[{ "name": "Extra queso", "price": 15 }, ...]`

---

### `orders`

| Column        | Type          | Constraints / Default          |
| ------------- | ------------- | ------------------------------ |
| id            | uuid          | PK, DEFAULT gen_random_uuid()  |
| table_id      | integer       | FK → tables.id NOT NULL        |
| customer_name | varchar(100)  | NULL                           |
| status        | varchar(20)   | DEFAULT 'active'               |
| total_amount  | numeric(10,2) | DEFAULT 0                      |
| created_at    | timestamptz   | DEFAULT timezone('utc', now()) |
| updated_at    | timestamptz   | DEFAULT timezone('utc', now()) |

**Status values:** `active` · `sent` · `closed`

---

### `order_items`

| Column             | Type          | Constraints / Default              |
| ------------------ | ------------- | ---------------------------------- |
| id                 | uuid          | PK, DEFAULT gen_random_uuid()      |
| order_id           | uuid          | FK → orders.id NOT NULL            |
| product_id         | integer       | FK → products.id NOT NULL          |
| product_name       | varchar(100)  | NOT NULL (snapshot)                |
| price              | numeric(10,2) | NOT NULL (snapshot)                |
| quantity           | integer       | DEFAULT 1                          |
| notes              | text          | NULL                               |
| status             | varchar(20)   | DEFAULT 'ordered'                  |
| cancelled_quantity | integer       | DEFAULT 0                          |
| created_at         | timestamptz   | DEFAULT timezone('utc', now())     |
| updated_at         | timestamptz   | DEFAULT timezone('utc', now())     |

**Status lifecycle:** `ordered` → `preparing` → `ready` → `served` / `cancelled`

**`notes` formato:** `"Instrucción | Extras: Extra queso (+$15) | Total extras: $15"`

**Cancelaciones parciales:** `cancelled_quantity` permite cancelar N de M unidades sin eliminar el registro. La cantidad activa es `quantity - cancelled_quantity`.

---

### `waiter_notifications`

| Column         | Type        | Constraints / Default          |
| -------------- | ----------- | ------------------------------ |
| id             | uuid        | PK, DEFAULT gen_random_uuid()  |
| table_id       | integer     | FK → tables.id NOT NULL        |
| order_id       | uuid        | FK → orders.id NULL            |
| type           | varchar(50) | NOT NULL                       |
| message        | text        | NOT NULL                       |
| status         | varchar(20) | DEFAULT 'pending'              |
| payment_method | varchar(20) | NULL                           |
| tip_amount     | numeric     | DEFAULT 0 NULL                 |
| created_at     | timestamptz | DEFAULT timezone('utc', now()) |
| updated_at     | timestamptz | NULL                           |

**Type values:** `new_order` · `refill` · `assistance` · `bill_request`

**Status values:** `pending` · `completed` · `cancelled`

**Payment method values:** `cash` · `terminal` · `usd` · `mixed`

**`tip_amount`:** Propina sugerida por el cliente desde `/customer/payment`. El customer la actualiza con UPDATE mientras el ticket está `pending`. El waiter la ve pre-cargada en la calculadora al hacer click en "Cobrar".

---

### `tips`

| Column         | Type          | Constraints / Default         |
| -------------- | ------------- | ----------------------------- |
| id             | uuid          | PK, DEFAULT gen_random_uuid() |
| order_id       | uuid          | FK → orders.id NULL           |
| table_id       | integer       | FK → tables.id NOT NULL       |
| customer_name  | text          | NOT NULL (ej. "Mesa 5")       |
| amount         | numeric(10,2) | DEFAULT 0 NOT NULL            |
| payment_method | text          | NULL                          |
| created_at     | timestamptz   | DEFAULT now()                 |

**Nota:** Esta tabla registra la propina **final cobrada** por el waiter. Es diferente de `waiter_notifications.tip_amount` que es la propina *sugerida* por el cliente. El waiter puede modificar el monto antes de confirmar.

---

### `sales_history`

| Column         | Type          | Constraints / Default          |
| -------------- | ------------- | ------------------------------ |
| id             | uuid          | PK, DEFAULT gen_random_uuid()  |
| table_id       | integer       | FK → tables.id NOT NULL        |
| table_number   | integer       | NOT NULL (snapshot)            |
| customer_name  | varchar(100)  | NULL                           |
| total_amount   | numeric(10,2) | DEFAULT 0                      |
| order_count    | integer       | DEFAULT 0                      |
| item_count     | integer       | DEFAULT 0                      |
| payment_method | varchar(20)   | NULL                           |
| created_at     | timestamptz   | DEFAULT timezone('utc', now()) |
| closed_at      | timestamptz   | DEFAULT timezone('utc', now()) |

---

### `sales_items`

| Column       | Type          | Constraints / Default                     |
| ------------ | ------------- | ----------------------------------------- |
| id           | uuid          | PK, DEFAULT gen_random_uuid()             |
| sale_id      | uuid          | FK → sales_history.id NOT NULL            |
| product_name | varchar(100)  | NOT NULL                                  |
| price        | numeric(10,2) | NOT NULL                                  |
| quantity     | integer       | DEFAULT 1 NOT NULL                        |
| subtotal     | numeric(10,2) | NOT NULL                                  |
| notes        | text          | NULL                                      |

---

### `customer_feedback`

| Column        | Type          | Constraints / Default               |
| ------------- | ------------- | ----------------------------------- |
| id            | uuid          | PK, DEFAULT gen_random_uuid()       |
| table_id      | text          | NOT NULL                            |
| customer_name | text          | NOT NULL                            |
| rating        | integer       | NOT NULL, CHECK (1 ≤ rating ≤ 5)   |
| comment       | text          | NULL                                |
| order_count   | integer       | NOT NULL                            |
| total_amount  | numeric(10,2) | NOT NULL                            |
| created_at    | timestamptz   | DEFAULT now() NULL                  |

---

## Foreign Key Summary

```
orders.table_id              → tables.id
order_items.order_id         → orders.id
order_items.product_id       → products.id
waiter_notifications.table_id → tables.id
waiter_notifications.order_id → orders.id
tips.table_id                → tables.id
tips.order_id                → orders.id (nullable)
sales_history.table_id       → tables.id
sales_items.sale_id          → sales_history.id
```

---

## Migraciones Aplicadas

| Fecha      | Nombre                                       | SQL                                                                                   |
| ---------- | -------------------------------------------- | ------------------------------------------------------------------------------------- |
| 2026-06-15 | `add_tip_amount_to_waiter_notifications`     | `ALTER TABLE waiter_notifications ADD COLUMN IF NOT EXISTS tip_amount numeric DEFAULT 0;` |

---

## Realtime Channels

| Canal                          | Evento         | Tabla                  | Usado en               |
| ------------------------------ | -------------- | ---------------------- | ---------------------- |
| `table-{id}-notifications`     | `*`            | `waiter_notifications` | OrderContext (customer) |
| `table-{id}-orders`            | `*`            | `orders`               | Payment.tsx            |
| `table-{id}-payments`          | `UPDATE`       | `waiter_notifications` | Payment.tsx            |
| waiter global                  | `*`            | `orders`, `order_items`, `tables`, `waiter_notifications` | waiter/page.tsx |

---

## Notas de Implementación

- **Montos monetarios** en MXN por defecto. USD se convierte con tasa configurable por sesión (guardada en `localStorage`).
- **`products.price`** está en centavos (integer) para evitar problemas de flotantes.
- **Snapshots** — `order_items.product_name` y `order_items.price` guardan el valor al momento del pedido, no la referencia, para que los cambios de precio no afecten órdenes activas.
- **Supabase Storage** — bucket `logo` para el logo del restaurante (admin).
- **Polling de respaldo** — además de Realtime, el cliente hace polling cada 3–5 s para garantizar entrega de notificaciones.
