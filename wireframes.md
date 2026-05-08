# ScanEat — Wireframes

Wireframes ASCII de todas las páginas del proyecto. Representan estructura y jerarquía visual, no estilos finales.

**Leyenda:**
```
[ btn ]       → botón
[_____]       → input de texto
[v]           → select / dropdown
■             → imagen / media
░░░░░         → área de contenido / card
│ │           → borde de card o contenedor
●             → badge / indicador activo
○             → badge / indicador inactivo
≡             → ícono de menú / lista
★             → rating star
▲ ▼           → estado / toggle
◉             → radio button seleccionado
◯             → radio button vacío
☑             → checkbox activo
☐             → checkbox vacío
```

---

## Índice

1. [Landing (`/`)](#1-landing-)
2. [Admin — Login (`/admin`)](#2-admin--login-admin)
3. [Admin — Dashboard](#3-admin--dashboard)
4. [Admin — Gestión de Mesas](#4-admin--gestión-de-mesas)
5. [Admin — Gestión de Productos](#5-admin--gestión-de-productos)
6. [Admin — Modal: Crear/Editar Mesa](#6-admin--modal-creaeditar-mesa)
7. [Admin — Modal: Crear/Editar Producto](#7-admin--modal-creaeditar-producto)
8. [Admin — Modal: Subir Logo](#8-admin--modal-subir-logo)
9. [Customer — Bienvenida (`/customer`)](#9-customer--bienvenida-customer)
10. [Customer — Menú (`/customer/menu`)](#10-customer--menú-customermenu)
11. [Customer — Menú: Panel de Carrito](#11-customer--menú-panel-de-carrito)
12. [Customer — Historial (`/customer/history`)](#12-customer--historial-customerhistory)
13. [Customer — Pago (`/customer/payment`)](#13-customer--pago-customerpayment)
14. [Customer — QR (`/customer/qr`)](#14-customer--qr-customerqr)
15. [Waiter — Panel del Mesero (`/waiter`)](#15-waiter--panel-del-mesero-waiter)
16. [Waiter — Tab: Notificaciones](#16-waiter--tab-notificaciones)
17. [Waiter — Tab: Mesas](#17-waiter--tab-mesas)
18. [Waiter — Tab: Productos](#18-waiter--tab-productos)
19. [Not Found (`*`)](#19-not-found-)

---

## 1. Landing (`/`)

Página pública de entrada. Centrada, minimalista. Font: Plus Jakarta Sans.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              ★  MENÚ DIGITAL  (badge)               │
│                                                     │
│            Bienvenido a                             │
│               ScanEat          (accent, 64px)       │
│                                                     │
│       Disfruta de una experiencia digital           │
│       simple, rápida y elegante. Explora            │
│       nuestro menú desde tu mesa.  (muted)          │
│                                                     │
│            [ Entrar  →  ]   (accent CTA)            │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  100%          ⚡               🍴           │   │
│  │  Digital    Tiempo real    Desde la mesa    │   │
│  │  sin papel  actualización  pedido digital   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Notas:**
- Fondo `bg-white`, sin header/footer
- Badge superior: `bg-accent-light`, texto `text-accent`, `rounded-full`
- Headline: `clamp(36px, 6vw, 64px)` `font-extrabold`
- "ScanEat" en `text-accent`
- CTA: `bg-accent`, hover eleva + sombra accent
- Metrics card: `bg-surface`, `border`, `rounded-2xl`

---

## 2. Admin — Login (`/admin`)

Pantalla de autenticación. Diseño independiente, no usa sidebar.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│         ┌───────────────────────────────┐           │
│         │   ■■  ScanEat                 │           │
│         │   logo + nombre               │           │
│         │   ─────────────────────────── │           │
│         │   Panel Administrativo        │           │
│         │   Ingresa tus credenciales    │           │
│         │                               │           │
│         │   Usuario                     │           │
│         │   [_________________________] │           │
│         │                               │           │
│         │   Contraseña                  │           │
│         │   [_________________________] │           │
│         │                               │           │
│         │   ⚠ Credenciales incorrectas  │  (error)  │
│         │                               │           │
│         │   [ Iniciar Sesión ▷ ]        │           │
│         └───────────────────────────────┘           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Notas:**
- Card centrada, `max-w-md`, `rounded-[18px]`, `shadow-2xl`
- Credenciales hardcoded: `admin` / `restaurant`
- Botón: `bg-accent`, ancho completo

---

## 3. Admin — Dashboard

Vista principal tras login. Sidebar + contenido con métricas y tablas.

```
┌──────┬──────────────────────────────────────────────────────┐
│  ■■  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                   │
│  Logo│  │ $   │ │ #   │ │  ≡  │ │ ★   │  (stat cards x4)  │
│ ─────│  │325  │ │ 48  │ │  3  │ │ 4.7 │                   │
│ Dash │  │ing  │ │items│ │ord. │ │/5.0 │                   │
│ ─────│  └─────┘ └─────┘ └─────┘ └─────┘                   │
│ Mesas│                                                      │
│ ─────│  Filtro de fecha:  [ Hoy ▼ ]  [Aplicar]  [Excel]   │
│ Prod.│                                                      │
│ ─────│  ┌─────────────────────────────────────────────┐    │
│      │  │ Órdenes de Hoy                               │    │
│      │  │ Mesa  Cliente   Items  Total  Método  Hora   │    │
│      │  │ ──────────────────────────────────────────── │    │
│      │  │  3    Juan P.     4   $42.00  Efectivo 14:20 │    │
│      │  │  7    María G.    2   $18.50  Terminal 13:05 │    │
│      │  │  1    —          6   $67.00  Efectivo 12:30 │    │
│      │  └─────────────────────────────────────────────┘    │
│      │                                                      │
│      │  ┌────────────────┐  ┌────────────────────────┐     │
│      │  │ Productos       │  │ Rango de Ventas         │     │
│      │  │ Populares       │  │ [inicio] → [fin]        │     │
│      │  │ 1. Tacos x28   │  │ [Buscar Ventas]          │     │
│      │  │ 2. Café  x21   │  │ ─────────────────────── │     │
│      │  │ 3. Burger x18  │  │ Total: $1,240.00         │     │
│      │  │ ...            │  │ 12 cierres de mesa       │     │
│      │  └────────────────┘  └────────────────────────┘     │
│ ─────│                                                      │
│[User]│                                                      │
│[Logo]│                                                      │
│[Exit]│                                                      │
└──────┴──────────────────────────────────────────────────────┘
```

**Sidebar (expandido `w-60` / colapsado `w-16`):**
```
┌─────────────────────┐       ┌──────┐
│ ■■  Dashboard       │  ←→  │  ■■  │
│ ─────────────────── │       │ ──── │
│ ▐ Dashboard         │       │  ≡   │
│   Gestión de Mesas  │       │  ■   │
│   Gestión de Prod.  │       │  □   │
│ ─────────────────── │       │ ──── │
│ [ Waiter          ] │       │  👤  │
│ [ Subir Logo      ] │       │  ↑   │
│ [ Cerrar Sesión   ] │       │  ⏻   │
└─────────────────────┘       └──────┘
```

**Stat cards:**
```
┌──────────────────────┐
│ INGRESOS TOTALES      │
│  [$]  $325.00         │  ← azul
│       5 ventas        │
└──────────────────────┘
┌──────────────────────┐
│ ITEMS VENDIDOS        │
│  [🛒]  48 items       │  ← esmeralda
└──────────────────────┘
┌──────────────────────┐
│ ÓRDENES ACTIVAS       │
│  [≡]   3              │  ← ámbar
└──────────────────────┘
┌──────────────────────┐
│ SATISFACCIÓN          │
│  [★]  4.7 / 5.0      │  ← morado
└──────────────────────┘
```

---

## 4. Admin — Gestión de Mesas

CRUD completo de mesas del restaurante.

```
┌──────┬──────────────────────────────────────────────────────┐
│      │  Gestión de Mesas              [ + Nueva Mesa ]      │
│Sidebar                                                      │
│      │  ┌──────────────────────────────────────────────┐   │
│      │  │ #  Número  Capacidad  Ubicación  Estado  QR  │   │
│      │  │ ─────────────────────────────────────────── │   │
│      │  │ 1    1        4       Salón    ● Disponible  [QR][✎][✕]│
│      │  │ 2    2        2       Terraza  ● Ocupada     [QR][✎][✕]│
│      │  │ 3    3        6       VIP      ○ Mantenimto  [QR][✎][✕]│
│      │  │ 4    4        4       Salón    ● Reservada   [QR][✎][✕]│
│      │  └──────────────────────────────────────────────┘   │
└──────┴──────────────────────────────────────────────────────┘
```

**Badges de estado en tabla:**
```
● Disponible   →  bg-emerald-50  text-emerald-700
● Ocupada      →  bg-red-50      text-red-600
○ Mantenimiento→  bg-gray-100    text-slate-500
● Reservada    →  bg-amber-50    text-amber-600
```

---

## 5. Admin — Gestión de Productos

Listado con filtros y acciones de CRUD.

```
┌──────┬──────────────────────────────────────────────────────┐
│      │  Gestión de Productos          [ + Nuevo Producto ]  │
│Sidebar                                                      │
│      │  [ Buscar producto... ]  [Categoría v]  [Estado v]   │
│      │                                                      │
│      │  ┌────────────────────────────────────────────────┐  │
│      │  │ Img  Nombre      Categoría   Precio  Dispon.   │  │
│      │  │ ─────────────────────────────────────────────── │  │
│      │  │ ■■   Tacos      [Lunch]      $12.00  ▲ Sí  [✎][✕]│
│      │  │ ■■   Café Latte [Drinks]     $ 4.50  ▲ Sí  [✎][✕]│
│      │  │ ■■   Burger     [Combos]     $15.00  ▼ No  [✎][✕]│
│      │  │ ■■   Hotcakes   [Breakfast]  $ 8.00  ▲ Sí  [✎][✕]│
│      │  └────────────────────────────────────────────────┘  │
│      │  Mostrando 10 de 34. Exporta para ver todos.         │
└──────┴──────────────────────────────────────────────────────┘
```

**Columnas adicionales visibles en fila:**
- Imagen `rounded-[8px]` 40×40px
- Rating: `★★★★☆ (4.2)`
- Badge categoría: `bg-blue-50 text-blue-700`
- Toggle disponibilidad: verde/gris
- Favorito: toggle ámbar

---

## 6. Admin — Modal: Crear/Editar Mesa

```
┌─────────────────────────────────────────────┐
│  Nueva Mesa                          [ ✕ ]  │
│  Completa los campos de la mesa             │
│ ─────────────────────────────────────────── │
│                                             │
│  Número de Mesa *                           │
│  [__________________________________]       │
│                                             │
│  Capacidad *                                │
│  [__________________________________]       │
│                                             │
│  Ubicación *                                │
│  [__________________________________]       │
│                                             │
│  Estado *                                   │
│  [Disponible                       v]       │
│                                             │
│ ─────────────────────────────────────────── │
│  [ Cancelar ]           [ Crear Mesa ]      │
└─────────────────────────────────────────────┘
```

---

## 7. Admin — Modal: Crear/Editar Producto

Modal grande (`max-w-2xl`), scroll interno.

```
┌──────────────────────────────────────────────────────┐
│  Nuevo Producto                              [ ✕ ]   │
│  Completa la información del producto                │
│ ──────────────────────────────────────────────────── │
│                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ Nombre *             │  │ Categoría *          │   │
│  │ [_________________] │  │ [Lunch            v] │   │
│  └─────────────────────┘  └─────────────────────┘   │
│                                                      │
│  Descripción *                                       │
│  [________________________________________________]  │
│  [________________________________________________]  │
│  0/500                                               │
│                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │ Precio *             │  │ Tiempo Preparación * │   │
│  │ [_________________] │  │ [_______________min] │   │
│  └─────────────────────┘  └─────────────────────┘   │
│                                                      │
│  Imagen del Producto                                 │
│  [ Seleccionar archivo... ]                          │
│  ■■■■■■■■■■  (preview si hay imagen)                │
│                                                      │
│  Rating inicial                                      │
│  ★ ★ ★ ★ ☆  (4.0)                                   │
│                                                      │
│  ○──●  Disponible         ○──●  Favorito             │
│                                                      │
│  Extras / Complementos                               │
│  ┌──────────────────────────────────────────────┐   │
│  │ Nombre extra    Precio   Disponible          │   │
│  │ [____________]  [_____]  ▲         [ ✕ ]    │   │
│  │ [____________]  [_____]  ▼         [ ✕ ]    │   │
│  └──────────────────────────────────────────────┘   │
│  [ + Agregar Extra ]                                 │
│                                                      │
│ ──────────────────────────────────────────────────── │
│  [ Cancelar ]                    [ Guardar Producto ]│
└──────────────────────────────────────────────────────┘
```

---

## 8. Admin — Modal: Subir Logo

```
┌───────────────────────────────────────┐
│  Logo del Restaurante         [ ✕ ]   │
│  Sube la imagen de tu negocio         │
│ ───────────────────────────────────── │
│                                       │
│       ┌───────────────────────┐       │
│       │                       │       │
│       │   ■■■ (preview logo)  │       │
│       │   o ícono placeholder │       │
│       │                       │       │
│       └───────────────────────┘       │
│                                       │
│   [ Seleccionar imagen... ]           │
│   PNG, JPG · máx 5MB                 │
│                                       │
│ ───────────────────────────────────── │
│  [ Cancelar ]    [ Subir Logo  ↑ ]   │
└───────────────────────────────────────┘
```

---

## 9. Customer — Bienvenida (`/customer`)

Página de entrada del cliente al escanear el QR.

```
┌─────────────────────────────────────────────┐
│  ■QR  ScanEat            ● Mesa 3 — Ocupada │  ← header
│ ─────────────────────────────────────────── │
│                                             │
│         ┌──────────────────────────┐        │
│         │  ¡Bienvenido!            │        │
│         │  Mesa N° 3               │        │
│         │                          │        │
│         │  Tu nombre               │        │
│         │  [______________________]│        │
│         │                          │        │
│         │  [ Comenzar a ordenar ]  │        │
│         └──────────────────────────┘        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  ¿Cómo funciona?                    │   │
│  │  1. Busca el código QR en tu mesa   │   │
│  │  2. Escanea el código               │   │
│  │  3. Ingresa tu nombre y ordena      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│       © 2026 ScanEat (footer)               │
└─────────────────────────────────────────────┘
```

**Estado sin QR (acceso directo sin mesa):**
```
┌─────────────────────────────────────────────┐
│  ■QR  ScanEat               ○ Sin mesa      │
│ ─────────────────────────────────────────── │
│                                             │
│         ┌──────────────────────────┐        │
│         │  ⚠  Sin mesa asignada    │        │
│         │                          │        │
│         │  Escanea el QR de tu     │        │
│         │  mesa para continuar.    │        │
│         │                          │        │
│         │  Pasos para acceder:     │        │
│         │  1. QR en la mesa        │        │
│         │  2. Escanear cámara      │        │
│         │  3. Ingresar nombre      │        │
│         └──────────────────────────┘        │
└─────────────────────────────────────────────┘
```

---

## 10. Customer — Menú (`/customer/menu`)

Vista principal de catálogo. Layout: header fijo + tabs categorías + grid productos + carrito flotante.

```
┌─────────────────────────────────────────────────┐
│  ■QR  ScanEat              Mesa 3  [🛒 2]  [?] │  ← header fijo
│ ─────────────────────────────────────────────── │
│                                                 │
│  [ Buscar producto... ]                         │
│                                                 │
│  [Todos][Breakfast][Lunch][Dinner][Combos][Drinks] ← tabs
│                                                 │
│  Recomendados ★                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │   ■■■■   │ │   ■■■■   │ │   ■■■■   │  ←fav  │
│  │ Tacos    │ │ Burger   │ │ Café     │        │
│  │ $12.00   │ │ $15.00   │ │ $ 4.50   │        │
│  │ ⏱ 15min  │ │ ⏱ 20min  │ │ ⏱  5min  │        │
│  │ [+ Pedir]│ │ [+ Pedir]│ │ [+ Pedir]│        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│  Lunch                                          │
│  ┌──────────┐ ┌──────────┐                     │
│  │   ■■■■   │ │   ■■■■   │                     │
│  │ Pozole   │ │ Enchilad.│                     │
│  │ $10.00   │ │ $11.00   │                     │
│  │ [+ Pedir]│ │ [+ Pedir]│                     │
│  └──────────┘ └──────────┘                     │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  🛒  Ver carrito (2 items) — $24.50  → │   │ ← sticky bottom
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Card de producto con extras:**
```
┌──────────────────────────────────────────────────┐
│  ■■■■■■■■                                        │
│  Tacos al Pastor          ★ 4.5  [Lunch]         │
│  Deliciosos tacos con piña y cilantro             │
│  ⏱ 15 min                          $12.00        │
│                                                  │
│  Extras:                                         │
│  ☑ Guacamole +$2.00    ☐ Salsa extra +$1.00      │
│                                                  │
│  Nota especial: [_____________________________]  │
│                                                  │
│              [ − ]  1  [ + ]   [ Agregar $12 ]   │
└──────────────────────────────────────────────────┘
```

---

## 11. Customer — Menú: Panel de Carrito

Panel deslizante desde la derecha (slide-in).

```
                    ┌──────────────────────────────┐
                    │ Tu Pedido              [ ✕ ]  │
                    │ Mesa 3 — Juan P.              │
                    │ ────────────────────────────  │
                    │                               │
                    │  Tacos al Pastor              │
                    │  + Guacamole                  │
                    │  [ − ] 2 [ + ]      $24.00   │
                    │                               │
                    │  Café Latte                   │
                    │  [ − ] 1 [ + ]       $4.50   │
                    │                               │
                    │  ────────────────────────────  │
                    │  Subtotal:            $28.50  │
                    │                               │
                    │  [ Enviar pedido → ]          │
                    │                               │
                    │  [ Ver mi cuenta ]            │
                    └──────────────────────────────┘
```

---

## 12. Customer — Historial (`/customer/history`)

Órdenes enviadas por la mesa en la sesión actual.

```
┌─────────────────────────────────────────────────┐
│  ■QR  ScanEat              Mesa 3               │
│ ─────────────────────────────────────────────── │
│                                                 │
│  Mis Pedidos                                    │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Pedido #1 — 14:20          $28.50      │   │
│  │  ─────────────────────────────────────  │   │
│  │  2x Tacos al Pastor         $24.00      │   │
│  │     + Guacamole                         │   │
│  │  1x Café Latte               $4.50      │   │
│  │                    ● Preparando         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Pedido #2 — 15:05          $15.00      │   │
│  │  ─────────────────────────────────────  │   │
│  │  1x Burger                  $15.00      │   │
│  │                    ● Entregado          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Total acumulado:              $43.50           │
│                                                 │
│  [ Ver mi cuenta / Pagar ]                      │
│                                                 │
│       © 2026 ScanEat                            │
└─────────────────────────────────────────────────┘
```

---

## 13. Customer — Pago (`/customer/payment`)

Resumen de cuenta y métodos de pago.

```
┌─────────────────────────────────────────────────┐
│  ■QR  ScanEat              Mesa 3               │
│ ─────────────────────────────────────────────── │
│                                                 │
│  Tu Cuenta — Mesa 3                             │
│  Juan P.                                        │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Resumen de pedidos                     │   │
│  │  ─────────────────────────────────────  │   │
│  │  2x Tacos al Pastor    $24.00           │   │
│  │    + Guacamole                          │   │
│  │  1x Café Latte          $4.50           │   │
│  │  1x Burger             $15.00           │   │
│  │  ─────────────────────────────────────  │   │
│  │  Total:                $43.50           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Método de pago                                 │
│  ◉ Efectivo   ◯ Terminal   ◯ USD                │
│                                                 │
│  [ Solicitar la cuenta ]                        │
│                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│                                                 │
│  [ Ver historial de pedidos ]                   │
│  [ Compartir QR de la mesa ]                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Estado: cuenta solicitada:**
```
│  ┌─────────────────────────────────────────┐   │
│  │  ✓  Cuenta solicitada                   │   │
│  │     El mesero llegará en breve          │   │
│  │     Total a pagar:    $43.50            │   │
│  └─────────────────────────────────────────┘   │
```

---

## 14. Customer — QR (`/customer/qr`)

QR de la mesa para compartir con otros comensales.

```
┌─────────────────────────────────────────────────┐
│  ■QR  ScanEat              Mesa 3               │
│ ─────────────────────────────────────────────── │
│                                                 │
│         Comparte esta mesa                      │
│         Escanea para unirte al pedido           │
│                                                 │
│         ┌─────────────────────┐                 │
│         │ ▐█▌ ░░░░░░ ▐█▌      │                 │
│         │ ░░░ ░░░░░░ ░░░      │                 │
│         │ ░░░ ░░░░░░ ░░░      │  (QR code)      │
│         │ ▐█▌ ░░░░░░ ▐█▌      │                 │
│         └─────────────────────┘                 │
│                                                 │
│         Mesa N° 3                               │
│         /customer?table=3                       │
│                                                 │
│         [ Copiar enlace ]                       │
│         [ Descargar QR  ]                       │
│                                                 │
│  ← Volver al menú                               │
└─────────────────────────────────────────────────┘
```

---

## 15. Waiter — Panel del Mesero (`/waiter`)

Layout sin sidebar. Header + tabs + contenido. Estilos inline (no Tailwind).

```
┌─────────────────────────────────────────────────────┐
│  Panel del Mesero                    [ Actualizar ↻ ]│
│  Pedidos enviados y cuentas por mesa                │
│ ─────────────────────────────────────────────────── │
│                                                     │
│  [ Notificaciones 🔔 3 ]  [ Mesas ]  [ Productos ]  │  ← tabs
│                                                     │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  (contenido del tab activo)                         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└─────────────────────────────────────────────────────┘
```

---

## 16. Waiter — Tab: Notificaciones

Alertas en tiempo real de nuevos pedidos o llamados.

```
┌─────────────────────────────────────────────────────┐
│  Notificaciones            3 nuevas                 │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔔  Mesa 3 — Juan P.              14:32      │  │
│  │     Nuevo pedido enviado                     │  │
│  │     2x Tacos, 1x Café                        │  │
│  │                          [ Marcar vista ]    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔔  Mesa 7 — María G.             14:28      │  │
│  │     Solicita la cuenta                       │  │
│  │                          [ Marcar vista ]    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ 🔔  Mesa 1 — Carlos R.            14:15      │  │
│  │     Nuevo pedido enviado                     │  │
│  │     1x Burger                                │  │
│  │                          [ Marcar vista ]    │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  [ Marcar todas como vistas ]                       │
└─────────────────────────────────────────────────────┘
```

**Íconos de notificación por tipo:**
```
🔔 Nuevo pedido      → amber
💬 Solicitud cuenta  → blue
⚠  Cancelación       → red
```

---

## 17. Waiter — Tab: Mesas

Vista de mesas ocupadas con sus pedidos y acciones de cobro.

```
┌─────────────────────────────────────────────────────┐
│  Cuentas por Mesa                                   │
│  3 mesas ocupadas             $ Total: $126.00      │
│                                                     │
│  Ordenar: [ Por número ▼ ]   [ Por tiempo ▼ ]       │
│                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │  Mesa 1   #1        │  │  Mesa 3   #3        │  │  ← badge ranking
│  │  Juan P.  45 min    │  │  María G. 22 min    │  │
│  │  ──────────────────  │  │  ──────────────────  │  │
│  │  2x Tacos   $24.00  │  │  1x Burger  $15.00  │  │
│  │  1x Café     $4.50  │  │  2x Cafe    $ 9.00  │  │
│  │  ──────────────────  │  │  ──────────────────  │  │
│  │  Total:     $28.50  │  │  Total:     $24.00  │  │
│  │                     │  │                     │  │
│  │  [Cobrar Mesa] [Sep]│  │  [Cobrar Mesa] [Sep]│  │
│  └─────────────────────┘  └─────────────────────┘  │
│                                                     │
│  ┌─────────────────────┐                           │
│  │  Mesa 7             │                           │
│  │  Carlos R. 10 min   │                           │
│  │  ──────────────────  │                           │
│  │  1x Pozole  $10.00  │                           │
│  │  Total:     $10.00  │                           │
│  │  [Cobrar Mesa] [Sep]│                           │
│  └─────────────────────┘                           │
└─────────────────────────────────────────────────────┘
```

**TableCard expandida (con items y estados):**
```
┌─────────────────────────────────────────────────────┐
│  Mesa 1                              🔔 45 min      │
│  Juan P.                        Total: $28.50       │
│ ─────────────────────────────────────────────────── │
│  Pedido #1 — 14:05                                  │
│                                                     │
│  Tacos al Pastor x2              ● En preparación   │
│  + Guacamole                     [ ✓ Listo ] [✕]   │
│                                                     │
│  Café Latte x1                   ● Entregado        │
│                                                     │
│ ─────────────────────────────────────────────────── │
│  [ Cobrar Mesa completa ]   [ Pagar por separado ]  │
└─────────────────────────────────────────────────────┘
```

**Estados de item:**
```
● Pendiente      → amber
● En preparación → blue
● Listo          → green (pulse animation)
● Entregado      → muted
✕ Cancelado      → red strikethrough
```

---

## 18. Waiter — Tab: Productos

Gestión rápida de disponibilidad de productos desde el panel del mesero.

```
┌─────────────────────────────────────────────────────┐
│  Gestión de Productos                               │
│  Actualiza disponibilidad rápidamente               │
│                                                     │
│  [ Buscar... ]                [Categoría ▼]         │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ ■■  Tacos al Pastor   $12.00   ▲ Disponible  │  │
│  │ ■■  Café Latte        $ 4.50   ▲ Disponible  │  │
│  │ ■■  Burger Classic    $15.00   ▼ No disponib.│  │
│  │ ■■  Hotcakes          $ 8.00   ▲ Disponible  │  │
│  │ ■■  Pozole            $10.00   ▲ Disponible  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 19. Not Found (`*`)

Página 404 con brand completo.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│              ┌────────────────────┐                 │
│              │                    │                 │
│              │   ■■  ScanEat      │                 │
│              │   logo 40×40       │                 │
│              │                    │                 │
│              │   404              │  (accent, 64px) │
│              │                    │                 │
│              │   Página no        │                 │
│              │   encontrada       │                 │
│              │                    │                 │
│              │   La página que    │                 │
│              │   buscas no existe │                 │
│              │   o fue movida.    │                 │
│              │                    │                 │
│              │   [ Volver al inicio → ]             │
│              │                    │                 │
│              └────────────────────┘                 │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Notas:**
- Fondo `bg-white`, centrado vertical y horizontal
- "404" en `text-accent`, `font-extrabold`, ~64px
- CTA: `bg-accent`, `rounded-[9px]`
- Logo: `w-10 h-10 rounded-[10px] bg-accent`

---

## Flujo de navegación

```
                    ┌─────────┐
                    │ Landing │  /
                    └────┬────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
      ┌──────────┐             ┌──────────┐
      │  Admin   │  /admin     │ Customer │  /customer?table=N
      │  Login   │             │ Welcome  │
      └────┬─────┘             └────┬─────┘
           │                        │ (ingresa nombre)
           ▼                        ▼
      ┌──────────┐             ┌──────────┐
      │Dashboard │             │  Menú    │  /customer/menu
      │  Mesas   │             │  Carrito │
      │ Productos│             └──┬───┬───┘
      └──────────┘                │   │
                              ┌───┘   └───┐
                              ▼           ▼
                         ┌─────────┐ ┌──────────┐
                         │Historial│ │  Pago    │
                         │/history │ │ /payment │
                         └─────────┘ └──────────┘
                                          │
                                          ▼
                                    ┌──────────┐
                                    │ QR Mesa  │
                                    │   /qr    │
                                    └──────────┘

      ┌──────────┐
      │  Waiter  │  /waiter
      │  Panel   │
      ├──────────┤
      │ Notifs.  │
      │  Mesas   │
      │ Productos│
      └──────────┘
```

---

## Breakpoints y responsividad

| Sección | Mobile | Tablet | Desktop |
|---|---|---|---|
| Landing | Stack vertical, CTA full | Igual | Max-w centrado |
| Admin sidebar | Colapsado por defecto | Expandido | Expandido |
| Dashboard stats | 1 col | 2 col | 4 col |
| Tabla productos | Scroll horizontal | Scroll | Full |
| Customer menú | 2 col cards | 3 col | 4 col |
| Waiter mesas | 1 col | 2 col | auto-fill 300px |
| Modals | Full width p-4 | max-w-md | max-w según tipo |
