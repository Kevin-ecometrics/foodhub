# 🗄️ Supabase Database Schema

## Overview

This database schema supports a restaurant management system, including tables for orders, products, tables, sales history, notifications, and customer feedback.

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

---

### `products`

| Column           | Type         | Constraints / Default          |
| ---------------- | ------------ | ------------------------------ |
| id               | serial       | PK                             |
| name             | varchar(100) | NOT NULL                       |
| description      | text         | NULL                           |
| price            | integer      | NOT NULL                       |
| category         | varchar(50)  | NOT NULL                       |
| image_url        | varchar(255) | NULL                           |
| is_available     | boolean      | DEFAULT true                   |
| preparation_time | integer      | NULL                           |
| created_at       | timestamptz  | DEFAULT timezone('utc', now()) |
| updated_at       | timestamptz  | DEFAULT timezone('utc', now()) |
| rating           | numeric(2,1) | DEFAULT 0.0                    |
| rating_count     | integer      | DEFAULT 0                      |
| is_favorite      | boolean      | DEFAULT false                  |
| extras           | jsonb        | DEFAULT '[]'                   |

---

### `orders`

| Column        | Type          | Constraints / Default          |
| ------------- | ------------- | ------------------------------ |
| id            | uuid          | PK, DEFAULT gen_random_uuid()  |
| table_id      | integer       | FK → tables.id                 |
| customer_name | varchar(100)  | NULL                           |
| status        | varchar(20)   | DEFAULT 'active'               |
| total_amount  | numeric(10,2) | DEFAULT 0                      |
| created_at    | timestamptz   | DEFAULT timezone('utc', now()) |
| updated_at    | timestamptz   | DEFAULT timezone('utc', now()) |

---

### `order_items`

| Column             | Type          | Constraints / Default              |
| ------------------ | ------------- | ---------------------------------- |
| id                 | uuid          | PK, DEFAULT gen_random_uuid()      |
| order_id           | uuid          | FK → orders.id (ON DELETE CASCADE) |
| product_id         | integer       | FK → products.id                   |
| product_name       | varchar(100)  | NOT NULL                           |
| price              | numeric(10,2) | NOT NULL                           |
| quantity           | integer       | DEFAULT 1                          |
| notes              | text          | NULL                               |
| status             | varchar(20)   | DEFAULT 'ordered'                  |
| cancelled_quantity | integer       | DEFAULT 0                          |
| created_at         | timestamptz   | DEFAULT timezone('utc', now())     |
| updated_at         | timestamptz   | DEFAULT timezone('utc', now())     |

---

### `sales_history`

| Column         | Type          | Constraints / Default          |
| -------------- | ------------- | ------------------------------ |
| id             | uuid          | PK, DEFAULT gen_random_uuid()  |
| table_id       | integer       | FK → tables.id                 |
| table_number   | integer       | NOT NULL                       |
| customer_name  | varchar(100)  | NULL                           |
| total_amount   | numeric(10,2) | DEFAULT 0                      |
| order_count    | integer       | DEFAULT 0                      |
| item_count     | integer       | DEFAULT 0                      |
| created_at     | timestamptz   | DEFAULT timezone('utc', now()) |
| closed_at      | timestamptz   | DEFAULT timezone('utc', now()) |
| payment_method | varchar(20)   | NULL                           |

---

### `sales_items`

| Column       | Type          | Constraints / Default                     |
| ------------ | ------------- | ----------------------------------------- |
| id           | uuid          | PK, DEFAULT gen_random_uuid()             |
| sale_id      | uuid          | FK → sales_history.id (ON DELETE CASCADE) |
| product_name | varchar(100)  | NOT NULL                                  |
| price        | numeric(10,2) | NOT NULL                                  |
| quantity     | integer       | DEFAULT 1                                 |
| subtotal     | numeric(10,2) | NOT NULL                                  |
| notes        | text          | NULL                                      |

---

### `waiter_notifications`

| Column         | Type        | Constraints / Default          |
| -------------- | ----------- | ------------------------------ |
| id             | uuid        | PK, DEFAULT gen_random_uuid()  |
| table_id       | integer     | FK → tables.id                 |
| order_id       | uuid        | FK → orders.id                 |
| type           | varchar(50) | NOT NULL                       |
| message        | text        | NOT NULL                       |
| status         | varchar(20) | DEFAULT 'pending'              |
| payment_method | varchar(20) | NULL                           |
| created_at     | timestamptz | DEFAULT timezone('utc', now()) |
| updated_at     | timestamptz | DEFAULT timezone('utc', now()) |

---

### `categories`

| Column        | Type         | Constraints / Default          |
| ------------- | ------------ | ------------------------------ |
| id            | serial       | PK                             |
| name          | varchar(100) | NOT NULL                       |
| slug          | varchar(100) | NOT NULL                       |
| description   | text         | NULL                           |
| display_order | integer      | DEFAULT 0                      |
| is_active     | boolean      | DEFAULT true                   |
| created_at    | timestamptz  | DEFAULT timezone('utc', now()) |
| updated_at    | timestamptz  | DEFAULT timezone('utc', now()) |

---

### `customer_feedback`

| Column        | Type          | Constraints / Default               |
| ------------- | ------------- | ----------------------------------- |
| id            | uuid          | PK, DEFAULT gen_random_uuid()       |
| table_id      | text          | NOT NULL                            |
| customer_name | text          | NOT NULL                            |
| rating        | integer       | CHECK (rating >= 1 AND rating <= 5) |
| comment       | text          | NULL                                |
| order_count   | integer       | NOT NULL                            |
| total_amount  | numeric(10,2) | NOT NULL                            |
| created_at    | timestamptz   | DEFAULT now()                       |

---

## 🔲 Pending Tables

### `tips` _(por implementar)_

Nueva tabla para registrar propinas dejadas por los clientes. Se integrará en el flujo del cliente entre el paso de pago y el de calificación.

| Column         | Type          | Constraints / Default          |
| -------------- | ------------- | ------------------------------ |
| id             | uuid          | PK, DEFAULT gen_random_uuid()  |
| order_id       | uuid          | FK → orders.id                 |
| table_id       | integer       | FK → tables.id                 |
| customer_name  | varchar(100)  | NULL                           |
| amount         | numeric(10,2) | NOT NULL                       |
| percentage     | integer       | NULL (10, 15, 20 o custom)     |
| payment_method | varchar(20)   | NULL                           |
| created_at     | timestamptz   | DEFAULT timezone('utc', now()) |

**Columnas a agregar en tablas existentes:**

- `sales_history.tip_amount` — `numeric(10,2) DEFAULT 0` para registrar el total de propinas en el historial de ventas

---
