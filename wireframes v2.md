# ScanEat — Wireframes v2

Actualizaciones y adiciones respecto al wireframe v1.

**Nuevos símbolos en leyenda:**
```
[ btn ]·      → botón secundario / outline
☆             → rating star vacía
↻             → refresh / carga
⏱             → tiempo de preparación
🔔            → notificación
⚠             → advertencia / error
✓             → confirmado / completado
✕             → cerrar / cancelar / eliminar
→             → redirección / siguiente
←             → regresar
╔ ╗ ╚ ╝       → bordes de modal (doble borde)
```

---

## Índice

**Customer**
1. [Bienvenida — Estado C](#1-customer--bienvenida-estado-c)
2. [Menú — Actualizaciones](#2-customer--menú-actualizaciones)
3. [Carrito — Actualizaciones](#3-customer--carrito-actualizaciones)
4. [Historial — Actualizaciones](#4-customer--historial-actualizaciones)
5. [Pago — Actualizaciones](#5-customer--pago-actualizaciones)
6. [QR — Comportamiento](#6-customer--qr-comportamiento)

**Admin**
7. [Login — Estado cargando](#7-admin--login-estado-cargando)
8. [Dashboard — Actualizaciones](#8-admin--dashboard-actualizaciones)
9. [Gestión de Mesas — Actualizaciones](#9-admin--gestión-de-mesas-actualizaciones)
10. [Gestión de Productos — Actualizaciones](#10-admin--gestión-de-productos-actualizaciones)
11. [Modal Mesa — Opciones de estado](#11-admin--modal-mesa-opciones-de-estado)
12. [Modal Producto — Categorías](#12-admin--modal-producto-categorías)
13. [Modal Logo — Nota técnica](#13-admin--modal-logo-nota-técnica)

**Waiter**
14. [Panel — Actualizaciones](#14-waiter--panel-actualizaciones)
15. [Notificaciones — Actualizaciones](#15-waiter--notificaciones-actualizaciones)
16. [Mesas — Actualizaciones](#16-waiter--mesas-actualizaciones)
17. [Productos — Actualizaciones](#17-waiter--productos-actualizaciones)
18. [NUEVO: Modal Calculadora de Pago](#18-waiter--modal-calculadora-de-pago)
19. [NUEVO: Modal Pago por Separado](#19-waiter--modal-pago-por-separado)
20. [NUEVO: Modal Confirmación de Contraseña](#20-waiter--modal-confirmación-de-contraseña)

**Sistema**
21. [Flujo de navegación — Flujo QR completo](#21-flujo-de-navegación--flujo-qr-completo)
22. [NUEVO: Flujo de estados de orden](#22-flujo-de-estados-de-orden)
23. [Breakpoints — Tabla ampliada](#23-breakpoints--tabla-ampliada)
24. [NUEVO: Jerarquía de componentes](#24-jerarquía-de-componentes)

---

## 1. Customer — Bienvenida: Estado C

Estado nuevo cuando el nombre ya existe en la mesa.

```
│          ┌────────────────────────────────────┐           │
│          │                                    │           │
│          │   ¡Bienvenido de vuelta!           │           │
│          │   Mesa N° 3                        │           │
│          │                                    │           │
│          │   Tu nombre                        │           │
│          │   [Juan P.________________________]│           │
│          │                                    │           │
│          │  ⚠  Este nombre ya está en uso      │           │
│          │     en esta mesa. ¿Eres tú?        │           │
│          │                                    │           │
│          │  [ Continuar como Juan P.  →  ]    │           │
│          │  [ Usar otro nombre ]·             │           │
│          │                                    │           │
│          └────────────────────────────────────┘           │
```

**Comportamiento (aplica a todos los estados de Bienvenida):**
- Input con `autoFocus` al cargar
- `Enter` dispara submit
- Redirección a `/customer/menu?table=N&name=Juan` tras submit válido
- Badge de mesa: `bg-green-50 text-green-700` (ocupada) · `bg-gray-100 text-gray-500` (sin mesa)

---

## 2. Customer — Menú: Actualizaciones

### Card de producto sin disponibilidad

```
┌──────────┐
│  ■■■■■■  │
│          │  ← imagen con overlay oscuro
│  ✕ No    │
│  dispon. │
│ Pozole   │
│ [Lunch]  │
│ $10.00   │
│ [Agotado]│  ← botón deshabilitado, gris
└──────────┘
```

### Modal de detalle de producto (al hacer click en la card)

```
╔══════════════════════════════════════════════════════╗
║  ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■  [ ✕ ]  ║ ← imagen grande
║                                                      ║
║  Tacos al Pastor                    [Lunch]          ║
║  ★ ★ ★ ★ ☆  (4.5 · 128 reseñas)                   ║
║                                                      ║
║  Deliciosos tacos con piña, cilantro y salsa roja.   ║
║  Ingredientes frescos del día.                       ║
║                                                      ║
║  ⏱ Tiempo de preparación: 15 min       $12.00       ║
║                                                      ║
║  ── Extras ──────────────────────────────────────── ║
║  ☑ Guacamole                         +$2.00         ║
║  ☐ Salsa verde extra                 +$1.00         ║
║  ☐ Queso extra                       +$1.50         ║
║                                                      ║
║  Nota especial para la cocina:                       ║
║  [____________________________________________]      ║
║                                                      ║
║  ── Cantidad ────────────────────────────────────── ║
║                                                      ║
║         [ − ]    1    [ + ]                          ║
║                                                      ║
║  ──────────────────────────────────────────────────  ║
║                                                      ║
║         [ Agregar al pedido  · $14.00  ]             ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

**Interacciones clave:**
- Click en card → abre modal de detalle
- `[+ Pedir]` en card pequeña → agrega 1 unidad directamente (sin modal si no tiene extras)
- Badge `[Lunch]` → filtra por esa categoría
- Tabs de categoría → scroll suave al heading de sección
- Barra sticky aparece cuando hay ≥1 item en carrito

---

## 3. Customer — Carrito: Actualizaciones

**Nuevas líneas en resumen:**
```
│  Subtotal:            $32.50   │
│  Impuesto (16%):       $5.20   │
│  Total:               $37.70   │
```

**Nuevos botones en el panel:**
```
│  [ Ver historial ]·            │
│  [ Solicitar cuenta ]·         │
```

### Estado carrito vacío

```
│  Tu Pedido              [ ✕ ]  │
│  Mesa 3 · Juan P.              │
│ ─────────────────────────────  │
│                                │
│        ░░░░░░░░░░░░░░░         │
│        🛒                      │
│        Tu carrito está vacío   │
│        Agrega productos        │
│        del menú                │
│        ░░░░░░░░░░░░░░░         │
│                                │
│  [ Ir al menú ]·               │
│                                │
```

### Toast de confirmación (al enviar pedido)

```
┌────────────────────────────────────────────────────┐
│  ✓  ¡Pedido enviado exitosamente!                  │
│     El mesero comenzará a prepararlo en breve.     │
└────────────────────────────────────────────────────┘
```
*Aparece en esquina inferior derecha, auto-dismiss 4s, color verde.*

---

## 4. Customer — Historial: Actualizaciones

**Nueva línea por pedido:**
```
│  Subtotal: $28.50  │  Impuesto: $4.56              │
```

**Nueva línea en total acumulado:**
```
│  Impuesto incluido:                            $6.96       │
```

**Nuevo botón de acción:**
```
│  [ Pedir asistencia del mesero ]·                         │
```

**Badges de estado de items:**
```
● Pendiente      → bg-amber-50   text-amber-700   (pulsando)
● Preparando     → bg-blue-50    text-blue-700
● Listo          → bg-green-50   text-green-700   (pulsando)
● Entregado      → bg-gray-50    text-gray-500
✕ Cancelado      → bg-red-50     text-red-600     (tachado)
```

**Estado: sin pedidos:**
```
│           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│           📋                                               │
│           Aún no has hecho ningún pedido                  │
│           Explora el menú y agrega productos               │
│           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  │
│                                                            │
│           [ Ir al menú ]                                   │
```

---

## 5. Customer — Pago: Actualizaciones

**Nueva sección de resumen (subtotal + impuesto):**
```
│  Subtotal:                      $43.50             │
│  Impuesto (16%):                 $6.96             │
│  Total:                         $50.46             │
```

**Métodos de pago — campos de input mixto (reemplaza radio buttons):**
```
│  Efectivo (MXN)                                    │
│  [_________________________________________]  [↑]  │
│                                                    │
│  Terminal (MXN)                                    │
│  [_________________________________________]       │
│                                                    │
│  USD  × [ 18.50 ▼ ] = MXN                         │
│  [_________________________________________]       │
│                                                    │
│  ────────────────────────────────────────────────  │
│  Total pagado:                  $50.46             │
│  Cambio:                         $0.00             │
```

### Modal: Calificar productos (aparece al confirmar pago)

```
╔══════════════════════════════════════════════════════╗
║  ¿Cómo fue tu experiencia?              [ ✕ ]       ║
║  Tu opinión nos ayuda a mejorar                      ║
║ ────────────────────────────────────────────────────  ║
║                                                      ║
║  Tacos al Pastor                                     ║
║  ★ ★ ★ ★ ☆   (selecciona)                           ║
║                                                      ║
║  Café Latte                                          ║
║  ★ ★ ★ ★ ★   (selecciona)                           ║
║                                                      ║
║  Burger Classic                                      ║
║  ★ ★ ★ ☆ ☆   (selecciona)                           ║
║                                                      ║
║  Comentario adicional (opcional):                    ║
║  [________________________________________________] ║
║                                                      ║
║  [ Omitir ]·           [ Enviar calificación  ✓ ]   ║
╚══════════════════════════════════════════════════════╝
```

---

## 6. Customer — QR: Comportamiento

- QR generado con la librería `qrcode`
- URL codificada: `https://dominio.com/customer?table=3`
- "Copiar enlace" → clipboard API + toast de confirmación
- "Descargar QR" → descarga PNG nombrado `mesa-3-qr.png`

---

## 7. Admin — Login: Estado cargando

- Loading state: spinner dentro del botón al autenticar
- Error: `bg-red-50 border border-red-200 text-red-700 rounded-[9px]`

---

## 8. Admin — Dashboard: Actualizaciones

**Filtro de fecha — ahora con radio buttons:**
```
│   ◉ Hoy  ◯ Rango    [ Fecha inicio ]  [ Fecha fin ]        │
│                     [ Aplicar Filtro ]   [ Exportar Excel ] │
```

**Nueva fila en tabla de órdenes:**
```
│   1     —           6    $67.00   Mixto    12:30 │
```
*(método "Mixto" para pagos combinados, no existía en v1)*

**Nueva línea en Historial de Ventas:**
```
│  Prom. por mesa: $103   │
```

**Stat cards — colores por tipo:**
```
INGRESOS TOTALES    → ring-blue-200    icon-blue-600
ITEMS VENDIDOS      → ring-emerald-200 icon-emerald-600
ÓRDENES ACTIVAS     → ring-amber-200   icon-amber-600
SATISFACCIÓN        → ring-purple-200  icon-purple-600
```

---

## 9. Admin — Gestión de Mesas: Actualizaciones

**Nota del botón [QR]:** genera y muestra modal con QR de la URL de esa mesa.

**Conteo inferior:**
```
│  5 mesas registradas                                       │
```

**Badges — ahora incluyen `border` color y estado renombrado:**
```
● Disponible    → bg-emerald-50  text-emerald-700  border-emerald-200
● Ocupada       → bg-red-50      text-red-600      border-red-200
○ Limpieza      → bg-gray-100    text-slate-500    border-gray-200
● Reservada     → bg-amber-50    text-amber-600    border-amber-200
```
*"Mantenimiento" renombrado a "Limpieza"*

---

## 10. Admin — Gestión de Productos: Actualizaciones

**Nuevo pie de tabla:**
```
│  Mostrando 5 de 34 productos.   [ Ver todos ]              │
```

**Columnas adicionales visibles en fila:**
- Imagen: `rounded-[8px]` 40×40px
- Rating: `★★★★☆ (4.2)`
- Badge categoría: `bg-blue-50 text-blue-700`
- Toggle disponibilidad: verde/gris
- Favorito: toggle ámbar

---

## 11. Admin — Modal Mesa: Opciones de estado

```
  Disponible
  Ocupada
  En limpieza
  Reservada
```

---

## 12. Admin — Modal Producto: Categorías

```
  Breakfast · Lunch · Dinner · Combos · Drinks · Postres
```

---

## 13. Admin — Modal Logo: Nota técnica

El nombre de archivo incluye timestamp para evitar cache del navegador.

---

## 14. Waiter — Panel: Actualizaciones

**Header — estado cargando:**
```
│  ■  ScanEat — Panel del Mesero        [ ↻ ] Actualizando... │
```

**Estilos de tabs:**
- Tab activo: fondo accent, texto blanco
- Tab inactivo: fondo surface, texto muted
- Badge de notificaciones: visible solo cuando `pending > 0`, `bg-red-500 text-white rounded-full`

---

## 15. Waiter — Notificaciones: Actualizaciones

**Ordenamiento nuevo:**
```
│  Ordenar: [FCFS ▼]  [ Por mesa ▼ ]   [ Por tiempo ▼ ]     │
```

**Nuevo tipo de notificación:**
```
🍶  refill         → border-green-200   bg-green-50
```

**Estados de notificación:**
```
pending       → card visible con botones
acknowledged  → card visible, sin botones, indicador gris
completed     → card oculta (filtrada)
```

**Vista sin notificaciones:**
```
│           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
│           🔔                                               │
│           No hay notificaciones pendientes                 │
│           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░               │
```

**Botones de acción renombrados:**
- `[ Marcar vista ]` → `[ ✓ Recibido ]` + `[ ✓✓ Completado ]`
- `[ Marcar todas como vistas ]` → `[ ✓✓ Marcar todas como completadas ]`

---

## 16. Waiter — Mesas: Actualizaciones

**Nuevas líneas en header:**
```
│  Cuentas por Mesa                  Total general: $126.00  │
│  3 mesas activas                                           │
```

**Flujo de estados de item en TableCard:**
```
  [ ✓ Preparando ]  →  al hacer click → estado = "preparing"
  [ ✓ Listo      ]  →  al hacer click → estado = "ready" (pulsa en verde)
  [ ✓ Entregado  ]  →  al hacer click → estado = "served"
  [ ✕ Cancelar   ]  →  abre Modal de Contraseña antes de cancelar
```

**Badge de tiempo por colores:**
```
< 15 min  → text-green-600
15-30 min → text-amber-600
> 30 min  → text-red-600  (urgente)
```

---

## 17. Waiter — Productos: Actualizaciones

**Toggle de disponibilidad — colores:**
```
▲ Disponible  → bg-green-100  text-green-700   click → agota
▼ Agotado     → bg-red-100    text-red-600     click → restaura
```

**Pie de lista:**
```
│  6 productos · 1 agotado                                   │
```

---

## 18. Waiter — Modal: Calculadora de Pago

Se abre al presionar **[Cobrar Mesa Completa]** en una TableCard.

```
╔══════════════════════════════════════════════════════════╗
║  Cobrar Mesa 3                                  [ ✕ ]   ║
║  María G.                                                ║
║  ────────────────────────────────────────────────────── ║
║                                                          ║
║  Resumen:                                                ║
║  Burger Classic × 1                          $15.00      ║
║  Café Latte × 2                               $9.00      ║
║  ────────────────────────────────────────────────────── ║
║  Total a cobrar:                             $24.00      ║
║                                                          ║
║  ── Métodos de pago ──────────────────────────────────── ║
║                                                          ║
║  Efectivo (MXN)                                          ║
║  [________________________________]  [ Completar ↑ ]    ║
║                                                          ║
║  Terminal (MXN)                                          ║
║  [________________________________]                      ║
║                                                          ║
║  USD  × [ 18.50 ▼ ] = MXN                               ║
║  [________________________________]                      ║
║                                                          ║
║  ────────────────────────────────────────────────────── ║
║  Total ingresado:                            $24.00      ║
║  Cambio:                                      $0.00      ║
║                                                          ║
║  [ Cancelar ]·              [ Confirmar Pago  ✓ ]       ║
╚══════════════════════════════════════════════════════════╝
```

**Botón [Completar ↑]:** rellena el campo de efectivo con el monto exacto restante.
**Tipo de cambio:** guardado en `localStorage`, editable per sesión.
**Validación:** botón confirmar deshabilitado si total ingresado < total a cobrar.

---

## 19. Waiter — Modal: Pago por Separado

Se abre al presionar **[Pagar por Separado]**. Divide la cuenta entre los comensales.

```
╔══════════════════════════════════════════════════════════════════╗
║  Pago por Separado — Mesa 3                           [ ✕ ]     ║
║  ────────────────────────────────────────────────────────────── ║
║                                                                  ║
║  ┌─────────────────────────┐  ┌────────────────────────────┐   ║
║  │  Selecciona comensal    │  │  Detalle de pago            │   ║
║  │                         │  │                             │   ║
║  │  ◉ María G.    $24.00   │  │  María G.                   │   ║
║  │  ○ Juan P.     $28.50   │  │  ─────────────────────────  │   ║
║  │  ○ Carlos R.    $0.00   │  │  Burger Classic × 1  $15.00 │   ║
║  │     (ya pagó)           │  │  Café Latte × 2       $9.00 │   ║
║  │                         │  │  ─────────────────────────  │   ║
║  │                         │  │  Total:              $24.00 │   ║
║  │                         │  │                             │   ║
║  │                         │  │  [ Cobrar a María G. ]      │   ║
║  └─────────────────────────┘  └────────────────────────────┘   ║
║                                                                  ║
║  ────────────────────────────────────────────────────────────── ║
║  [ Cancelar ]·                    [ Finalizar y Cobrar Todo ]   ║
╚══════════════════════════════════════════════════════════════════╝
```

**Sub-modal: Pago individual (al presionar [Cobrar a María G.]):**
```
╔══════════════════════════════════════════════╗
║  Cobrar a María G.               [ ✕ ]      ║
║  Total: $24.00                               ║
║  ────────────────────────────────────────── ║
║                                              ║
║  Efectivo (MXN)                              ║
║  [_____________________________]  [ ↑ ]     ║
║                                              ║
║  Terminal (MXN)                              ║
║  [_____________________________]             ║
║                                              ║
║  USD ×[ 18.50 ▼ ]                            ║
║  [_____________________________]             ║
║                                              ║
║  Cambio: $0.00                               ║
║                                              ║
║  [ Cancelar ]·      [ Confirmar  ✓ ]        ║
╚══════════════════════════════════════════════╝
```

**Indicadores visuales:**
- Comensal pagado: texto tachado + badge `✓ Pagó`
- Comensal pendiente: texto normal + monto en accent
- Botón "Finalizar y Cobrar Todo": activo solo cuando todos pagaron

---

## 20. Waiter — Modal: Confirmación de Contraseña

Se activa al intentar **cancelar un item** en una TableCard. Protege operaciones destructivas.

```
╔══════════════════════════════════════════════╗
║  Confirmar cancelación              [ ✕ ]   ║
║                                              ║
║  Ingresa la contraseña para continuar        ║
║                                              ║
║  Contraseña                                  ║
║  [_____________________________] 👁          ║
║                                              ║
║  ⚠  Contraseña incorrecta                   ║  ← visible solo si falla
║                                              ║
║  [ Cancelar ]·        [ Confirmar  →  ]     ║
╚══════════════════════════════════════════════╝
```

**Contraseña correcta:** `"restaurant"` (hardcoded)
**Al confirmar correctamente:** cierra modal y ejecuta la cancelación del item
**Icono 👁:** toggle para mostrar/ocultar contraseña

---

## 21. Flujo de navegación — Flujo QR completo

```
  Admin genera QR por mesa → QR codifica URL (/customer?table=N)
  → Cliente escanea → Ingresa nombre → Accede al menú
  → Ordena → Waiter ve notificación → Prepara → Sirve
  → Cliente solicita cuenta → Admin/Waiter procesa pago
  → Mesa se libera → Ciclo reinicia
```

---

## 22. Flujo de estados de orden

### Estado de una mesa

```
  Disponible  →  Ocupada  →  En limpieza  →  Disponible
      ↑___________________Reservada_______________↑
```

### Estado de un order_item

```
  ordered  →  preparing  →  ready  →  served
      └──────────────────────────────→ cancelled
```

**Transiciones posibles desde el panel del mesero:**
```
  ordered    [ → ] preparing
  preparing  [ → ] ready
  ready      [ → ] served
  any        [ ✕ ] cancelled  (requiere contraseña)
```

### Estado de una orden (order)

```
  active  →  completed  →  paid
     └──────────────────→ cancelled
```

### Estados de notificación

```
  pending  →  acknowledged  →  completed
```

---

## 23. Breakpoints — Tabla ampliada

| Sección | Mobile (< 768px) | Tablet (768–1023px) | Desktop (≥ 1024px) |
|---|---|---|---|
| Landing | Stack vertical, CTA full-width | Igual, max-w-xl | Max-w-3xl centrado |
| Admin Sidebar | Colapsado por defecto, toggle | Expandido | Expandido, fijo |
| Dashboard stats | 1 columna | 2 columnas | 4 columnas |
| Tabla productos/mesas | Scroll horizontal | Scroll | Full width |
| Customer menú | 2 col cards | 3 col cards | 4 col cards + scale 1.15 |
| Carrito | Panel full-screen | Panel 380px right | Panel 380px right |
| Waiter mesas | 1 columna | 2 columnas | `auto-fill 300px` |
| Modales | Full width, p-4 | max-w-md centrado | max-w según tipo |
| Pago separado | Stack vertical | Side-by-side | Side-by-side |

**Variable CSS de escala en menú desktop:**
```css
@media (min-width: 1024px) {
  --scale: 1.15;
}
```

---

## 24. Jerarquía de componentes

```
app/
├── layout.tsx                  ← SessionProvider + OrderProvider + ToastProvider + ConfirmProvider
│
├── page.tsx                    ← Landing
│
├── admin/
│   └── page.tsx                ← LoginForm | AdminDashboard (con sidebar)
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   ├── Dashboard.tsx
│       │   ├── TablesManagement.tsx
│       │   │   └── TableForm.tsx (modal)
│       │   ├── ProductsManagement.tsx
│       │   │   └── ProductForm.tsx (modal)
│       │   └── StarRating.tsx
│
├── customer/
│   ├── page.tsx                ← CustomerPage (Welcome)
│   │   └── components/CustomerPage.tsx
│   ├── menu/
│   │   └── page.tsx            ← Menu + carrito
│   │       └── components/Menu.tsx
│   ├── history/
│   │   └── page.tsx
│   │       └── components/History.tsx
│   ├── payment/
│   │   └── page.tsx
│   │       └── components/Payment.tsx
│   └── qr/
│       └── page.tsx
│           └── components/QRShare.tsx
│
└── waiter/
    └── page.tsx                ← Waiter Panel
        └── components/
            ├── Header.tsx
            ├── Tabs.tsx
            ├── NotificationsTab.tsx
            │   └── NotificationCard.tsx
            │       └── NotificationIcon.tsx
            ├── TablesTab.tsx
            │   └── TableCard.tsx
            │       ├── TableHeader.tsx
            │       ├── CustomerOrderSection.tsx
            │       │   └── OrderItem.tsx
            │       └── TableSummary.tsx
            ├── ProductsManagement.tsx
            └── LoadingScreen.tsx

Modales globales (renderizados por Context):
├── ToastContext.tsx             ← Toast en esquina inferior derecha
└── ConfirmContext.tsx           ← Modal de confirmación genérico
```

**Contextos disponibles en toda la app:**
```
SessionContext  → { tableId, tableName, customerName, customerId, orderId }
OrderContext    → { items, currentOrder, history, tableUsers, addItem, removeItem, ... }
ToastContext    → { showToast(message, type) }
ConfirmContext  → { confirm(message) → Promise<boolean> }
```

---

*Wireframes v2 — ScanEat · Última actualización: 2026-05-15*
