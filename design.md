# ScanEat — Design System

Sistema de diseño oficial del proyecto. Toda contribución visual debe seguir estas especificaciones.

---

## Índice

1. [Tipografía](#1-tipografía)
2. [Colores](#2-colores)
3. [Espaciado y layout](#3-espaciado-y-layout)
4. [Border radius](#4-border-radius)
5. [Cards y contenedores](#5-cards-y-contenedores)
6. [Botones](#6-botones)
7. [Inputs y formularios](#7-inputs-y-formularios)
8. [Badges y estados](#8-badges-y-estados)
9. [Modals](#9-modals)
10. [Tablas](#10-tablas)
11. [Sidebar y navegación](#11-sidebar-y-navegación)
12. [Stat cards](#12-stat-cards)
13. [Toggle switches](#13-toggle-switches)
14. [StarRating](#14-starrating)
15. [Loading y empty states](#15-loading-y-empty-states)
16. [Animaciones y transiciones](#16-animaciones-y-transiciones)
17. [Z-index scale](#17-z-index-scale)
18. [Iconografía](#18-iconografía)
19. [SVGs inline](#19-svgs-inline)
20. [Brand mark](#20-brand-mark)
21. [globals.css](#21-globalscss)
22. [Estructura de archivos](#22-estructura-de-archivos)
23. [Páginas del proyecto](#23-páginas-del-proyecto)
24. [Tipos de datos clave](#24-tipos-de-datos-clave)
25. [Reglas generales](#25-reglas-generales)
26. [Base de datos — Supabase Schema](#26-base-de-datos--supabase-schema)
27. [Realtime Channels](#27-realtime-channels)
28. [Flujo General del Sistema](#28-flujo-general-del-sistema)
29. [Migraciones Aplicadas](#29-migraciones-aplicadas)
30. [Flujo de Propina](#30-flujo-de-propina)
31. [Estado del Proyecto](#31-estado-del-proyecto)
32. [Notas Técnicas](#32-notas-técnicas)

---

## 1. Tipografía

### Fuentes declaradas

Las fuentes se gestionan con `next/font/google` en `app/layout.tsx`.

```ts
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

| Variable CSS | Familia | Uso principal |
|---|---|---|
| `--font-geist-sans` | Geist Sans | UI general, labels, cuerpo de texto |
| `--font-geist-mono` | Geist Mono | Precios, métricas, códigos, valores numéricos |

**Excepción — landing page (`app/page.tsx`):**
Usa `Plus_Jakarta_Sans` cargada localmente en ese archivo.

```ts
import { Plus_Jakarta_Sans } from "next/font/google";
const plusJakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300","400","500","600","700","800"] });
```

### Cómo aplicarlas

```tsx
// Heredada del layout (preferido)
// No necesitas hacer nada en la mayoría de componentes.

// Si el componente no hereda (dialogs, portals):
style={{ fontFamily: "var(--font-geist-sans)" }}
style={{ fontFamily: "var(--font-geist-mono)" }}
```

### Escala tipográfica

| Rol | Clases Tailwind |
|---|---|
| Título de página | `text-[18px] font-extrabold text-slate-900` |
| Título de card / sección | `text-[15px] font-extrabold text-slate-900` |
| Título de modal | `text-base font-extrabold text-slate-900` |
| Subtítulo / descripción | `text-sm font-semibold text-slate-700` |
| Texto cuerpo | `text-sm text-slate-700` |
| Texto secundario | `text-xs text-slate-500` |
| Label de campo | `text-xs font-semibold text-slate-700` |
| Valor numérico / precio | `text-[22px] font-extrabold text-slate-900` |
| Badge / chip | `text-[10px] font-bold` |
| Caption / hint | `text-[11px] text-slate-400` |
| Error de validación | `text-xs text-red-500` |

---

## 2. Colores

### Color accent — marca oficial

```
oklch(62% 0.18 32)   →  naranja-ámbar cálido
```

Registrado en `app/globals.css` bajo `@theme`:

```css
--color-accent:       oklch(62% 0.18 32);
--color-accent-dark:  oklch(50% 0.18 32);
--color-accent-light: oklch(96% 0.05 32);
```

Uso con Tailwind:
```tsx
className="bg-accent"
className="bg-accent-dark"
className="bg-accent-light"
className="text-accent"
className="border-accent"
```

Uso inline (SVGs, `style` prop):
```tsx
style={{ color: "oklch(62% 0.18 32)" }}
style={{ background: "oklch(62% 0.18 32)" }}
stroke="oklch(62% 0.18 32)"
```

### Paleta semántica completa

| Rol | Color Tailwind | Fondo suave | Uso |
|---|---|---|---|
| **Accent / marca** | `bg-accent` | `bg-accent-light` | CTAs de marca, divisores, highlights |
| **Primario** | `bg-blue-600` | `bg-blue-50` | Acciones del sistema: guardar, crear, confirmar |
| **Éxito** | `bg-emerald-600` | `bg-emerald-50` | Disponible, confirmado, pagado |
| **Advertencia** | `bg-amber-500` | `bg-amber-50` | Favoritos, alertas suaves, reservado |
| **Error** | `bg-red-600` | `bg-red-50` | Eliminar, cancelar, ocupado, crítico |
| **Morado** | `bg-purple-600` | `bg-purple-50` | Satisfacción, encuestas, rating |
| **Índigo** | `bg-indigo-600` | `bg-indigo-50` | Ticket promedio, datos adicionales |
| **Neutro** | `bg-slate-900` | `bg-gray-50` | Texto principal / superficies |
| **Borde** | — | `border-slate-200` | Todos los bordes de cards y separadores |
| **Texto principal** | `text-slate-900` | — | Headings, valores importantes |
| **Texto secundario** | `text-slate-500` | — | Descripciones, subtextos |
| **Texto muted** | `text-slate-400` | — | Captions, hints, timestamps |
| **Fondo raíz** | `bg-white` | — | Siempre blanco para el fondo de página |
| **Fondo sección** | `bg-gray-50` | — | Footers de card, headers de tabla |

---

## 3. Espaciado y layout

### Contenedor máximo

```tsx
<div className="max-w-7xl mx-auto px-6">
```

### Padding de secciones

| Contexto | Clase |
|---|---|
| Header admin | `px-6 py-2.5` |
| Contenido principal | `px-6 py-5` |
| Card interna | `p-4` |
| Card amplia | `p-5` — `p-8` |
| Modal header/footer | `p-4` |
| Modal cuerpo | `p-5` |
| Footer de card | `px-8 py-3.5` |
| Tabla: celda | `px-4 py-3` |
| Tabla: header | `px-4 py-2.5` |

### Gap estándar entre elementos

| Contexto | Clase |
|---|---|
| Grids de cards | `gap-3.5` |
| Botones en fila | `gap-2` — `gap-2.5` |
| Elementos dentro de card | `space-y-3` — `space-y-4` |
| Icono + texto | `gap-1.5` — `gap-2` |
| Grid de mesas | `gap-3` |

---

## 4. Border radius

| Elemento | Valor |
|---|---|
| Cards principales | `rounded-[14px]` |
| Modals | `rounded-[18px]` |
| Botones | `rounded-[9px]` |
| Inputs / selects | `rounded-[9px]` |
| Badges / chips / tags | `rounded-[6px]` |
| Íconos / avatares pequeños | `rounded-[8px]` |
| Logo mark | `rounded-[8px]` — `rounded-[10px]` |
| Imagen de producto (tabla) | `rounded-[8px]` |
| Barra de progreso | `rounded-full` |
| Divider accent | `rounded-full` |

---

## 5. Cards y contenedores

```tsx
// Card estándar
<div className="bg-white border border-slate-200 rounded-[14px] p-4" />

// Card con contenido que desborda
<div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden" />

// Card con hover
<div className="bg-white border border-slate-200 rounded-[14px] p-3.5 hover:shadow-sm transition" />

// Sección interior
<div className="bg-gray-50 border-t border-slate-200 px-5 py-3.5" />

// Barra de acento superior
<div className="h-1 bg-accent" />

// Card de formulario
<div className="bg-white border border-slate-200 rounded-[14px] p-5" />
```

> **Regla:** Nunca usar `shadow-sm` o `shadow-md` solos como sustituto del borde. Siempre `border border-slate-200`. La sombra solo se usa en modals (`shadow-2xl`) o en hover de mesas (`hover:shadow-sm`).

---

## 6. Botones

```tsx
// Primario
<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-blue-600 text-white text-xs font-bold hover:brightness-90 transition" />

// Accent
<button className="bg-accent text-white py-2.5 rounded-[9px] text-sm font-bold hover:brightness-90 transition" />

// Secundario
<button className="border border-slate-200 bg-gray-50 text-slate-600 px-4 py-2.5 rounded-[9px] text-sm font-semibold hover:bg-slate-100 transition" />

// Éxito outline
<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition" />

// Peligro sólido
<button className="flex items-center gap-1.5 px-4 py-2.5 rounded-[9px] bg-red-600 text-white text-sm font-bold hover:brightness-90 transition" />

// Peligro outline
<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-red-200 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition" />

// Blue outline
<button className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-blue-200 bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition" />

// Header neutral
<button className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition" />

// Header peligro
<button className="flex items-center gap-1.5 px-3 py-[7px] rounded-lg border border-slate-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition" />

// Deshabilitado
<button disabled className="... cursor-not-allowed opacity-50" />
```

---

## 7. Inputs y formularios

```tsx
// Input estándar
<input className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-sm bg-gray-50 outline-none focus:border-slate-900" />

// Input con error
<input className="w-full px-3 py-2.5 border border-red-500 rounded-[9px] text-sm bg-gray-50 outline-none focus:border-red-600" />

// Select
<select className="w-full px-3 py-2.5 border border-slate-200 rounded-[9px] text-sm bg-gray-50 outline-none focus:border-slate-900" />

// Textarea
<textarea className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-sm bg-gray-50 outline-none focus:border-slate-900 resize-vertical" />

// Input de archivo
<input type="file" className="w-full px-3 py-2 border border-slate-200 rounded-[9px] text-sm bg-gray-50" />

// Label
<p className="text-xs font-semibold text-slate-700 mb-1.5">Nombre *</p>

// Error de validación
<p className="text-red-500 text-xs mt-1">{error}</p>

// Contador de caracteres
<p className="text-xs text-slate-500 mt-1 text-right">{value.length}/100</p>

// Grid 2 columnas
<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
```

---

## 8. Badges y estados

### Estados de mesa

```tsx
<span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-[6px]">Disponible</span>
<span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-[6px]">Ocupada</span>
<span className="bg-gray-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-[6px]">Mantenimiento</span>
<span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-[6px]">Reservada</span>
```

### Estados de producto

```tsx
<button className="px-2.5 py-1 text-[10px] font-bold rounded-[6px] bg-emerald-50 text-emerald-700">Disponible</button>
<button className="px-2.5 py-1 text-[10px] font-bold rounded-[6px] bg-red-50 text-red-600">No Disponible</button>
```

### Badge de categoría

```tsx
<span className="px-2 py-0.5 text-[10px] font-bold rounded-[5px] bg-blue-50 text-blue-700">{category}</span>
```

### Badge de calificación

```tsx
<span className="px-2.5 py-1 rounded-[6px] text-xs font-bold flex items-center gap-1 bg-emerald-50 text-emerald-700">
  <FaStar className="text-[10px]" /> {rating}
</span>
```

---

## 9. Modals

```tsx
<div
  className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4"
  onClick={onClose}
>
  <div
    className="bg-white rounded-[18px] shadow-2xl max-w-md w-full overflow-hidden"
    onClick={e => e.stopPropagation()}
  >
    {/* Header */}
    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
      <div>
        <p className="text-base font-extrabold text-slate-900">Título</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Subtítulo opcional</p>
      </div>
      <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
        <FaTimes />
      </button>
    </div>

    {/* Cuerpo */}
    <div className="p-5">{/* contenido */}</div>

    {/* Footer */}
    <div className="p-4 border-t border-slate-200 bg-gray-50 rounded-b-[18px] flex gap-2.5">
      <button className="flex-1 border border-slate-200 bg-white text-slate-600 py-2.5 rounded-[9px] text-sm font-bold hover:bg-slate-50 transition">
        Cancelar
      </button>
      <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-[9px] text-sm font-bold hover:brightness-90 transition">
        Confirmar
      </button>
    </div>
  </div>
</div>
```

**Anchos de modal:**

| Tamaño | Clase |
|---|---|
| Pequeño (QR, confirmación) | `max-w-sm` |
| Mediano (formularios) | `max-w-md` |
| Grande (ticket, detalle) | `max-w-xl` |
| Extra grande | `max-w-2xl` |

---

## 10. Tablas

```tsx
<div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">
            Columna
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-slate-100">
        <tr className="transition-colors hover:bg-gray-50">
          <td className="px-4 py-3 text-xs font-medium text-slate-900">Valor</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

**Filas con estado especial:**
```tsx
<tr className="bg-amber-50/40 hover:bg-amber-50/70">   // favorito
<tr className="bg-blue-50/60">                          // extra (sub-ítem)
<tr className="bg-emerald-50/60">                       // producto con extras
```

---

## 11. Sidebar y navegación

El admin usa sidebar vertical fijo. Botón colapsar posicionado **fuera del sidebar**.

```tsx
<div className="min-h-screen bg-white flex">

  {/* Botón colapsar */}
  <button
    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
    className={`fixed top-3 z-50 p-3 rounded-md bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-300 shadow-sm ${
      sidebarCollapsed ? "left-[68px]" : "left-[244px]"
    }`}
  >
    <FaChevronLeft className={`text-[10px] transition-transform duration-300 ${sidebarCollapsed ? "rotate-180" : ""}`} />
  </button>

  {/* Sidebar */}
  <aside className={`${sidebarCollapsed ? "w-16" : "w-60"} h-screen sticky top-0 border-r border-slate-200 flex flex-col transition-all duration-300`}>

    {/* Logo */}
    <div className={`${sidebarCollapsed ? "p-3" : "p-4"} border-b border-slate-200`}>
      <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-2.5"}`}>
        <div className="w-[34px] h-[34px] rounded-[8px] bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
          {/* logo */}
        </div>
        {!sidebarCollapsed && (
          <span className="text-[15px] font-extrabold text-slate-900 truncate">Dashboard</span>
        )}
      </div>
      {!sidebarCollapsed && (
        <p className="text-[11px] text-slate-500 mt-0.5 ml-[42px]">Administrativo</p>
      )}
    </div>

    {/* Navegación */}
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {[
        { id: "dashboard", name: "Dashboard", icon: FaChartBar },
        { id: "tables",    name: "Gestión de Mesas", icon: FaTable },
        { id: "products",  name: "Gestión de Productos", icon: FaBox },
      ].map((item) => (
        <button
          key={item.id}
          title={sidebarCollapsed ? item.name : undefined}
          className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-2" : "gap-2 px-3"} py-2.5 text-[13px] border-l-[2.5px] -ml-px transition-all ${
            activeSection === item.id
              ? "border-blue-600 text-blue-600 bg-blue-50 font-bold"
              : "border-transparent text-slate-500 font-medium hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300"
          }`}
        >
          <item.icon className="text-[12px] flex-shrink-0" />
          {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
        </button>
      ))}
    </nav>

    {/* Acciones inferiores */}
    <div className="p-3 border-t border-slate-200 space-y-1.5">
      <button className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-2" : "gap-1.5 px-3"} py-[7px] rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition`}>
        <FaUser className="w-3.5 h-3.5 flex-shrink-0" />
        {!sidebarCollapsed && <span className="truncate">Waiter</span>}
      </button>
      <button className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-2" : "gap-1.5 px-3"} py-[7px] rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition`}>
        <FaUpload className="w-3.5 h-3.5 flex-shrink-0" />
        {!sidebarCollapsed && <span className="truncate">Subir Logo</span>}
      </button>
      <button className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-2" : "gap-1.5 px-3"} py-[7px] rounded-lg border border-slate-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition`}>
        <FaSignOutAlt className="w-3.5 h-3.5 flex-shrink-0" />
        {!sidebarCollapsed && <span className="truncate">Cerrar Sesión</span>}
      </button>
    </div>
  </aside>

  {/* Contenido principal */}
  <main className="flex-1 overflow-auto">
    <div className="max-w-7xl mx-auto px-6 py-5">
      {/* contenido */}
    </div>
  </main>
</div>
```

**Estados del sidebar:**

| Propiedad | Expandido | Colapsado |
|---|---|---|
| Ancho | `w-60` | `w-16` |
| Botón colapsar | `left-[244px]` | `left-[68px]` |
| Texto nav | Visible | Oculto |
| Ícono chevron | Normal | `rotate-180` |

---

## 12. Stat cards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
  <div className="bg-white border border-slate-200 rounded-[14px] p-4">
    <p className="text-[11px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">
      Ingresos Totales
    </p>
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-[9px] bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
        <FaDollarSign className="text-[18px]" />
      </div>
      <div>
        <p className="text-[22px] font-extrabold text-slate-900 leading-none">$325.00</p>
        <p className="text-[11px] text-slate-500 mt-1">5 ventas procesadas</p>
      </div>
    </div>
  </div>
</div>
```

**Colores por stat:**

| Stat | bg | text |
|---|---|---|
| Ingresos | `bg-blue-50` | `text-blue-600` |
| Items vendidos | `bg-emerald-50` | `text-emerald-600` |
| Órdenes activas | `bg-amber-50` | `text-amber-500` |
| Satisfacción | `bg-purple-50` | `text-purple-600` |

---

## 13. Toggle switches

```tsx
// Toggle estándar
<label className="flex items-center gap-3 cursor-pointer w-full py-3">
  <div className="relative">
    <input type="checkbox" checked={value} onChange={...} className="sr-only" />
    <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${value ? "bg-emerald-500" : "bg-gray-300"}`}>
      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
    </div>
  </div>
  <span className={`text-sm font-medium ${value ? "text-emerald-700" : "text-slate-700"}`}>
    {value ? "Disponible" : "No Disponible"}
  </span>
</label>

// Toggle favorito (amber)
<div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${value ? "bg-amber-500" : "bg-gray-300"}`}>
  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
</div>

// Toggle pequeño
<div className={`w-8 h-4 flex items-center rounded-full p-1 transition-colors ${value ? "bg-emerald-500" : "bg-gray-300"}`}>
  <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
</div>
```

---

## 14. StarRating

Componente reutilizable en `app/admin/components/StarRating.tsx`.

```tsx
// Solo lectura
<StarRating rating={4.5} readonly={true} size={13} />

// Editable
<StarRating
  rating={parseFloat(productForm.rating || "0")}
  onRatingChange={(r) => handleChange("rating", r.toString())}
  readonly={false}
  size={16}
/>
```

Muestra `FaStar`, `FaStarHalfAlt`, `FaRegStar` según el valor. Incluye el número `(4.5)` al lado cuando `rating > 0`.

---

## 15. Loading y empty states

```tsx
// Spinner de página
<div className="text-center py-12">
  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
  <p className="text-slate-500 mt-4 text-sm font-medium">Cargando...</p>
</div>

// Empty state con ícono
<div className="text-center py-8">
  <FaStar className="text-4xl text-slate-200 mx-auto" />
  <p className="text-slate-500 text-sm mt-2">No hay datos para esta fecha</p>
</div>

// Empty state inline
<div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-[9px]">
  <p className="text-slate-500 text-sm">Sin elementos. Agrega uno nuevo.</p>
</div>

// Nota datos parciales
<p className="text-xs text-slate-500 mt-3 text-center">
  Mostrando 10 de {total}. Exporta Excel o PDF para ver todos.
</p>
```

---

## 16. Animaciones y transiciones

### Clases de animación (globals.css)

```tsx
className="animate-fadeUp"    // entrada desde abajo (0.45s ease)
className="animate-fadeDown"  // entrada desde arriba (0.4s ease)
className="animate-pulse"     // pulso de sombra verde (2.4s)
```

### Transición estándar

```tsx
className="transition"           // 150ms — botones
className="transition-colors"    // solo color — toggles
className="transition-all"       // nav tabs
className="hover:brightness-90"  // botones con bg sólido
className="hover:bg-slate-50"    // botones con bg transparente
```

### Spinner

```tsx
<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
<FaSpinner className="animate-spin text-[10px]" />  // inline en botón
```

---

## 17. Z-index scale

| Contexto | z-index |
|---|---|
| Dropdown de filtro de fecha | `z-50` |
| Overlay de modal | `z-50` |
| Header sticky de modal | `z-10` |

---

## 18. Iconografía

**Única fuente:** `react-icons/fa`. No usar emojis en UI.

```tsx
import {
  FaChartBar, FaTable, FaBox,          // Navegación admin
  FaPlus, FaEdit, FaTrash, FaTimes,    // CRUD
  FaQrcode, FaCog, FaSpinner,          // Mesas
  FaDollarSign, FaShoppingCart,        // Métricas
  FaUtensils, FaStar, FaStarHalfAlt,  // Métricas
  FaRegStar, FaUser,                   // Usuarios
  FaCalendarAlt, FaCalendarDay,        // Fechas
  FaCalendarWeek, FaFilter,            // Filtros
  FaFileExport, FaReceipt,             // Exportar
  FaSignOutAlt, FaUpload, FaImage,     // Header admin
  FaMoneyBillWave, FaCreditCard, FaBan, // Pagos
  FaChevronLeft,                        // Sidebar
} from "react-icons/fa";
```

**Tamaños:**

| Uso | Tamaño |
|---|---|
| Nav tab | `text-[12px]` |
| Botón pequeño | `text-[10px]` — `text-[11px]` |
| Botón estándar | `text-sm` |
| Stat card | `text-[18px]` |
| Empty state | `text-4xl` |
| Encabezado de sección | `text-base` |

---

## 19. SVGs inline

```tsx
// Patrón estándar
<svg
  width="14" height="14"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2.2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  {/* paths */}
</svg>

// Con color accent fijo
<svg>
  <rect fill="oklch(96% 0.05 32)" />
  <path stroke="oklch(62% 0.18 32)" strokeWidth="2" />
</svg>
```

**Convenciones:**
- `strokeWidth`: `1.8` (ligero) / `2` (estándar) / `2.2` (énfasis)
- Siempre `strokeLinecap="round"` + `strokeLinejoin="round"`
- `fill="none"` salvo elemento de relleno explícito

---

## 20. Brand mark

```tsx
// Con logo subido
<div className="w-[34px] h-[34px] rounded-[8px] bg-accent flex items-center justify-center overflow-hidden">
  <img src={logoUrl} className="w-full h-full object-cover" />
</div>

// Sin logo (fallback)
<div className="w-[34px] h-[34px] rounded-[8px] bg-accent flex items-center justify-center">
  <FaChartBar className="text-white text-sm" />
</div>

// Versión grande
<div className="w-10 h-10 rounded-[10px]" style={{ background: "oklch(62% 0.18 32)" }}>
  {/* ícono SVG blanco 18×18 */}
</div>
```

---

## 21. globals.css

```css
@import "tailwindcss";

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
  50%       { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
}

@theme {
  --animate-fadeUp:   fadeUp 0.45s ease both;
  --animate-fadeDown: fadeDown 0.4s ease both;
  --animate-pulse:    pulse 2.4s ease infinite;

  --color-accent:       oklch(62% 0.18 32);
  --color-accent-dark:  oklch(50% 0.18 32);
  --color-accent-light: oklch(96% 0.05 32);
}

html {
  scroll-behavior: smooth;
  background-color: white;
  color: black;
}
```

---

## 22. Estructura de archivos

```
app/
├── layout.tsx                      # Root layout + providers
├── page.tsx                        # Landing / redirect
├── not-found.tsx
│
├── admin/
│   ├── page.tsx                    # Admin shell + routing
│   └── components/
│       ├── LoginForm.tsx           # ⚠️ no modificar
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

## 23. Páginas del proyecto

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | `app/page.tsx` | Landing pública |
| `/admin` | `app/admin/page.tsx` | Panel administrativo |
| `/customer` | `app/customer/page.tsx` | Bienvenida cliente via QR |
| `/customer/menu` | `Menu.tsx` | Catálogo y carrito |
| `/customer/history` | `History.tsx` | Historial de pedidos |
| `/customer/payment` | `Payment.tsx` | Cuenta a pagar |
| `/customer/qr` | `QRShare.tsx` | QR de la mesa |
| `/waiter` | `app/waiter/page.tsx` | Panel del mesero |
| `*` | `app/not-found.tsx` | Página 404 |

---

## 24. Tipos de datos clave

```ts
// app/admin/types.ts

interface RestaurantTable {
  id: number;
  number: number;
  status: "available" | "occupied" | "reserved" | "maintenance";
  capacity: number;
  location: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: number;
  name: string;           // max 100 chars
  description: string;    // max 500 chars
  price: number;          // 0–10000
  category: "Breakfast" | "Lunch" | "Dinner" | "Combos" | "Drinks";
  image_url: string;
  is_available: boolean;
  is_favorite: boolean;
  preparation_time: number; // minutos, 1–480
  rating: number;           // 0–5
  rating_count: number;
  extras?: ProductExtra[];
}

interface ProductExtra {
  id?: string;
  name: string;    // max 50 chars
  price: number;   // 0–1000
  is_available: boolean;
}

interface SalesHistory {
  id: string;
  table_id: number;
  table_number: number;
  customer_name: string | null;
  total_amount: number;
  order_count: number;
  item_count: number;
  payment_method: "cash" | "terminal" | "usd" | "mixed" | null;
  closed_at: string;
}

type AdminSection = "dashboard" | "tables" | "products";

const ADMIN_CREDENTIALS = { username: "admin", password: "restaurant" };
```

---

## 25. Reglas generales

### Prohibiciones

- **No** emojis en UI — solo `react-icons/fa` o SVG inline.
- **No** `shadow-sm` / `shadow-md` como sustituto de borde — siempre `border border-slate-200`.
- **No** `bg-gray-50` como fondo de página raíz — siempre `bg-white`.
- **No** modificar `app/admin/components/LoginForm.tsx`.
- **No** modificar `app/layout.tsx`.
- **No** `font-bold` en headings principales — siempre `font-extrabold`.

### Obligaciones

- **Siempre** `font-extrabold` en headings de página/card.
- **Siempre** `FaTimes` para cerrar modals.
- **Siempre** `hover:brightness-90` en botones con fondo sólido.
- **Siempre** `transition` o `transition-colors` en elementos interactivos.
- **Siempre** cerrar modal con click en overlay + `stopPropagation` en contenedor.
- **Siempre** `outline-none` + `focus:border-slate-900` en inputs.

### Tipografía

- Heredar del layout (`var(--font-geist-sans)`) — no reintroducir `Plus Jakarta Sans` en componentes admin.
- `var(--font-geist-mono)` para valores numéricos, precios y métricas.

### Colores

- `bg-accent` → CTA de marca, divisores, barra de acento.
- `bg-blue-600` → acciones primarias (guardar, crear, confirmar).
- `bg-red-600` → eliminar definitivo; `bg-red-50 text-red-600` → deshabilitar / cancelar.
- `bg-emerald-600` / `bg-emerald-50` → disponible, éxito, confirmado.

### Nuevos componentes

1. Base: `border border-slate-200 rounded-[14px]`.
2. Consultar escala de border radius antes de elegir valor.
3. Íconos `react-icons/fa`: `text-[11px]` en botones pequeños, `text-[18px]` en stat cards.
4. Estados vacíos: ícono + texto descriptivo centrado.
5. Modals: overlay `bg-black/45`, contenedor `rounded-[18px]`.

---

## 26. Base de datos — Supabase Schema

> Stack: PostgreSQL + Supabase · Todas las tablas tienen **RLS habilitado**.

### `tables`

| Column     | Type         | Constraints / Default          |
|------------|--------------|--------------------------------|
| id         | serial       | PK                             |
| number     | integer      | NULL                           |
| status     | varchar(20)  | DEFAULT `'available'`          |
| capacity   | integer      | NOT NULL                       |
| location   | varchar(100) | NULL                           |
| created_at | timestamptz  | DEFAULT timezone('utc', now()) |
| updated_at | timestamptz  | DEFAULT timezone('utc', now()) |

**Status values:** `available` · `occupied`

---

### `categories`

| Column        | Type         | Constraints / Default          |
|---------------|--------------|--------------------------------|
| id            | serial       | PK                             |
| name          | varchar(100) | NOT NULL                       |
| slug          | varchar(100) | NOT NULL, UNIQUE               |
| description   | text         | DEFAULT `''`                   |
| display_order | integer      | DEFAULT 0                      |
| is_active     | boolean      | DEFAULT true                   |
| created_at    | timestamptz  | DEFAULT timezone('utc', now()) |
| updated_at    | timestamptz  | DEFAULT timezone('utc', now()) |

---

### `products`

| Column           | Type         | Constraints / Default          |
|------------------|--------------|--------------------------------|
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
| extras           | jsonb        | DEFAULT `'[]'`                 |
| created_at       | timestamptz  | DEFAULT timezone('utc', now()) |
| updated_at       | timestamptz  | DEFAULT timezone('utc', now()) |

**`extras` formato:** `[{ "name": "Extra queso", "price": 15 }, ...]`

---

### `orders`

| Column        | Type          | Constraints / Default          |
|---------------|---------------|--------------------------------|
| id            | uuid          | PK, DEFAULT gen_random_uuid()  |
| table_id      | integer       | FK → tables.id NOT NULL        |
| customer_name | varchar(100)  | NULL                           |
| status        | varchar(20)   | DEFAULT `'active'`             |
| total_amount  | numeric(10,2) | DEFAULT 0                      |
| created_at    | timestamptz   | DEFAULT timezone('utc', now()) |
| updated_at    | timestamptz   | DEFAULT timezone('utc', now()) |

**Status values:** `active` · `sent` · `closed`

---

### `order_items`

| Column             | Type          | Constraints / Default          |
|--------------------|---------------|--------------------------------|
| id                 | uuid          | PK, DEFAULT gen_random_uuid()  |
| order_id           | uuid          | FK → orders.id NOT NULL        |
| product_id         | integer       | FK → products.id NOT NULL      |
| product_name       | varchar(100)  | NOT NULL (snapshot)            |
| price              | numeric(10,2) | NOT NULL (snapshot)            |
| quantity           | integer       | DEFAULT 1                      |
| notes              | text          | NULL                           |
| status             | varchar(20)   | DEFAULT `'ordered'`            |
| cancelled_quantity | integer       | DEFAULT 0                      |
| created_at         | timestamptz   | DEFAULT timezone('utc', now()) |
| updated_at         | timestamptz   | DEFAULT timezone('utc', now()) |

**Status lifecycle:** `ordered` → `preparing` → `ready` → `served` / `cancelled`

**`notes` formato:** `"Instrucción | Extras: Extra queso (+$15) | Total extras: $15"`

**Cancelaciones parciales:** `cancelled_quantity` permite cancelar N de M unidades sin eliminar el registro. Cantidad activa = `quantity - cancelled_quantity`.

---

### `waiter_notifications`

| Column         | Type        | Constraints / Default          |
|----------------|-------------|--------------------------------|
| id             | uuid        | PK, DEFAULT gen_random_uuid()  |
| table_id       | integer     | FK → tables.id NOT NULL        |
| order_id       | uuid        | FK → orders.id NULL            |
| type           | varchar(50) | NOT NULL                       |
| message        | text        | NOT NULL                       |
| status         | varchar(20) | DEFAULT `'pending'`            |
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
|----------------|---------------|-------------------------------|
| id             | uuid          | PK, DEFAULT gen_random_uuid() |
| order_id       | uuid          | FK → orders.id NULL           |
| table_id       | integer       | FK → tables.id NOT NULL       |
| customer_name  | text          | NOT NULL (ej. "Mesa 5")       |
| amount         | numeric(10,2) | DEFAULT 0 NOT NULL            |
| payment_method | text          | NULL                          |
| created_at     | timestamptz   | DEFAULT now()                 |

> Registra la propina **final cobrada** por el waiter. Diferente de `waiter_notifications.tip_amount` que es la propina *sugerida* por el cliente.

---

### `sales_history`

| Column         | Type          | Constraints / Default          |
|----------------|---------------|--------------------------------|
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

| Column       | Type          | Constraints / Default          |
|--------------|---------------|--------------------------------|
| id           | uuid          | PK, DEFAULT gen_random_uuid()  |
| sale_id      | uuid          | FK → sales_history.id NOT NULL |
| product_name | varchar(100)  | NOT NULL                       |
| price        | numeric(10,2) | NOT NULL                       |
| quantity     | integer       | DEFAULT 1 NOT NULL             |
| subtotal     | numeric(10,2) | NOT NULL                       |
| notes        | text          | NULL                           |

---

### `customer_feedback`

| Column        | Type          | Constraints / Default             |
|---------------|---------------|-----------------------------------|
| id            | uuid          | PK, DEFAULT gen_random_uuid()     |
| table_id      | text          | NOT NULL                          |
| customer_name | text          | NOT NULL                          |
| rating        | integer       | NOT NULL, CHECK (1 ≤ rating ≤ 5) |
| comment       | text          | NULL                              |
| order_count   | integer       | NOT NULL                          |
| total_amount  | numeric(10,2) | NOT NULL                          |
| created_at    | timestamptz   | DEFAULT now() NULL                |

---

### Foreign Keys

```
orders.table_id               → tables.id
order_items.order_id          → orders.id
order_items.product_id        → products.id
waiter_notifications.table_id → tables.id
waiter_notifications.order_id → orders.id
tips.table_id                 → tables.id
tips.order_id                 → orders.id (nullable)
sales_history.table_id        → tables.id
sales_items.sale_id           → sales_history.id
```

---

## 27. Realtime Channels

| Canal                      | Evento   | Tabla                  | Usado en                |
|----------------------------|----------|------------------------|-------------------------|
| `table-{id}-notifications` | `*`      | `waiter_notifications` | OrderContext (customer)  |
| `table-{id}-orders`        | `*`      | `orders`               | Payment.tsx             |
| `table-{id}-payments`      | `UPDATE` | `waiter_notifications` | Payment.tsx             |
| waiter global              | `*`      | `orders`, `order_items`, `tables`, `waiter_notifications` | waiter/page.tsx |

> Además de Realtime, el cliente hace **polling de respaldo cada 3–5 s** para garantizar entrega de notificaciones.

---

## 28. Flujo General del Sistema

```
Customer (QR scan)
  └─ /customer → ingresa nombre
  └─ /customer/menu → navega categorías, agrega items al carrito
       → confirma pedido → INSERT orders + order_items
       → INSERT waiter_notifications (type: new_order)
  └─ /customer/history → historial de órdenes de la sesión
  └─ /customer/payment → ticket completo
       → selector de propina (10% / 15% / 20% / personalizado)
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
           → badge "Cliente sugirió $X.XX"
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

## 29. Migraciones Aplicadas

| Fecha      | Nombre                                   | SQL                                                                                        |
|------------|------------------------------------------|--------------------------------------------------------------------------------------------|
| 2026-06-15 | `add_tip_amount_to_waiter_notifications` | `ALTER TABLE waiter_notifications ADD COLUMN IF NOT EXISTS tip_amount numeric DEFAULT 0;`  |

---

## 30. Flujo de Propina

**Problema resuelto:** El mesero tenía que adivinar o preguntar verbalmente la propina. Ahora el cliente la elige desde su pantalla y el mesero la recibe pre-cargada.

```
1. Customer solicita cuenta (Menu.tsx → history.requestBill)
   → INSERT waiter_notifications { type: 'bill_request', tip_amount: 0, status: 'pending' }

2. Customer va a /customer/payment
   → Ve selector de propina (Sin propina / 10% / 15% / 20% / Personalizado)
   → Al elegir: UPDATE waiter_notifications SET tip_amount = X WHERE id = notif.id
   → Muestra confirmación: "Propina guardada: $X.XX — el mesero la verá al cobrar"

3. Waiter hace click en "Cobrar" (handleCobrarMesa)
   → SELECT tip_amount FROM waiter_notifications
     WHERE table_id = X AND type = 'bill_request' AND status = 'pending'
   → Abre PaymentCalculator con initialTip pre-llenado
   → Badge azul: "Cliente sugirió $X.XX"
   → Waiter puede aceptar, modificar o borrar la propina

4. Waiter confirma pago (handlePaymentConfirm)
   → freeTableAndClean() → archiva en sales_history + sales_items
   → Si tip > 0: INSERT tips { table_id, amount, payment_method }
   → UPDATE waiter_notifications.status = 'completed'

5. Customer recibe confirmación realtime → encuesta → redirect
```

---

## 31. Estado del Proyecto

### ✅ Completado

**Infrastructure**
- [x] Next.js 16 App Router + TypeScript
- [x] Tailwind CSS 4 con colores OKLCH + fuente Plus Jakarta Sans
- [x] Supabase client con SSR
- [x] Providers: OrderContext, SessionContext, ToastContext, ConfirmContext
- [x] Admin JWT auth (`/api/admin/login` + `/api/admin/verify`)

**Customer Portal**
- [x] Entrada por QR — descubrimiento de mesa
- [x] Menú por categorías con carrito y notas por item
- [x] Extras con precio adicional (JSONB en productos)
- [x] Sesiones multi-comensal por mesa
- [x] Tracking de estado de orden en tiempo real
- [x] Ratings y favoritos de productos
- [x] Historial de órdenes de la sesión
- [x] QR Share — compartir mesa con otros comensales
- [x] Página de pago — ticket completo con totales por comensal
- [x] Selector de propina para el cliente — 10%/15%/20%/personalizado; se guarda en `waiter_notifications.tip_amount`
- [x] Encuesta de satisfacción post-pago (1–5 estrellas + comentario → `customer_feedback`)
- [x] Solicitud de factura por email (`/api/invoice`)
- [x] Generación de ticket PDF

**Waiter Dashboard**
- [x] Tab Notificaciones — feed realtime: new_order, refill, assistance, bill_request
- [x] Tab Mesas — grid con desglose por comensal
  - [x] Controles de estado por item (ordered→preparing→ready→served)
  - [x] Cancelación con contraseña (parcial o total)
  - [x] Ordenado por número o tiempo de ocupación
  - [x] Filtro FCFS
- [x] PaymentCalculator — efectivo + terminal + USD (tasa configurable) + mixto + cambio automático
- [x] Propina en calculadora pre-llenada desde sugerencia del cliente
- [x] Badge "Cliente sugirió $X.XX" cuando hay propina del customer
- [x] Split Payments — pago individual por comensal
- [x] Tab Productos — toggle disponibilidad rápido

**Admin Dashboard**
- [x] Login JWT con sesión en localStorage
- [x] Sidebar colapsable
- [x] Dashboard con stats diarias (órdenes, ingresos, propinas, mesas activas, ticket promedio)
- [x] Filtro por rango de fechas
- [x] Top 10 productos por cantidad vendida
- [x] CRUD Mesas (capacidad, ubicación, estado)
- [x] CRUD Productos (imagen, precio, tiempo prep, disponibilidad, extras)
- [x] CRUD Categorías (orden de display, activo/inactivo)
- [x] Upload de logo (Supabase Storage bucket `logo`)

**Service Layer**
- [x] `tips.ts` — insertTip, getTipsTotal, getTipsByDateRange
- [x] `history.ts` — requestBill (con tip_amount), archival de ventas
- [x] `waiter.ts` — freeTableAndClean
- [x] `notifications.ts` — creación de alertas
- [x] Todos los servicios CRUD de entidades

### ⏳ Pendiente

**1. Kitchen Display System (KDS) — `/kitchen`**
- [ ] Nueva ruta `/kitchen` con vista en tiempo real de pedidos activos
- [ ] Ordenado por mesa y tiempo de entrada (FCFS)
- [ ] Botones para avanzar estado de items: ordered → preparing → ready
- [ ] Suscripción Realtime a `order_items` y `orders`
- [ ] Sin autenticación (pantalla fija en cocina) o PIN simple

**2. "Pedir algo más" en Customer**
- [ ] Permitir al customer añadir items a una orden ya enviada (status `active` o `sent`)
- [ ] Botón en `/customer/menu` o `/customer/history` para reabrir el carrito sobre la orden activa
- [ ] Los nuevos items se agregan como `order_items` adicionales a la misma `order_id`
- [ ] INSERT `waiter_notifications` (type: `new_order`) para alertar al mesero

**3. PWA + Notificaciones Push para Mesero**
- [ ] Agregar `manifest.json` y Service Worker para convertir a PWA
- [ ] Implementar Web Push API — suscripción desde `/waiter`
- [ ] Guardar suscripciones push en Supabase
- [ ] Disparar notificaciones desde Edge Function al recibir INSERT en `waiter_notifications`
- [ ] Funciona con browser en segundo plano o pantalla apagada

**4. Múltiples Meseros / Gestión de Personal**
- [ ] Tabla `staff` en Supabase (id, name, pin, role: waiter/manager)
- [ ] Login por PIN en `/waiter` — sesión en localStorage
- [ ] Asignación de mesas a mesero (`tables.assigned_staff_id`)
- [ ] Tracking en `orders` y `sales_history` de qué mesero atendió
- [ ] Vista en Admin de rendimiento por mesero (órdenes, propinas, ventas)

**5. Sistema de Reservaciones**
- [ ] Tabla `reservations` (id, table_id, customer_name, phone, date, time, party_size, status)
- [ ] Vista en Admin para crear/ver/cancelar reservaciones
- [ ] Vista en Waiter — agenda del día con reservas pendientes
- [ ] Al llegar la hora, cambiar mesa a `occupied` automáticamente
- [ ] Opcional: link público para que el cliente reserve sin QR

---

## 32. Notas Técnicas

- Todos los montos monetarios en **MXN** por defecto.
- **`products.price`** en centavos (integer) para evitar problemas de flotantes.
- Tasa USD/MXN configurable por sesión del waiter (guardada en `localStorage`).
- Colores con **OKLCH** para mejor consistencia en pantallas.
- Polling de respaldo cada 3–5 s en cliente además de Realtime para garantizar entrega.
- **Snapshots** — `order_items.product_name` y `order_items.price` guardan el valor al momento del pedido para que los cambios de precio no afecten órdenes activas.
- `cancelled_quantity` en `order_items` soporta cancelaciones parciales sin eliminar el registro.
- `extras` en `products` es JSONB con formato `[{ name, price }]`.
- Notas de items incluyen extras formateados: `"Nota | Extras: X (+$Y) | Total: $Z"`.
- **Supabase Storage** — bucket `logo` para el logo del restaurante (admin).
