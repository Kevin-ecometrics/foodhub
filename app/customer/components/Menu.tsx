/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import { useOrder } from "@/app/context/OrderContext";
import { productsService, Product } from "@/app/lib/supabase/products";
import { ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import { historyService, OrderWithItems } from "@/app/lib/supabase/history";
import { supabase } from "@/app/lib/supabase/client";
import { OrderItem } from "@/app/lib/supabase/order-items";

// ─── Design Tokens & Animations ─────────────────────────────────────────────
const DESIGN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  .menu-root *, .menu-root *::before, .menu-root *::after { box-sizing: border-box; }
  .menu-root {
    --accent:       oklch(62% 0.18 32);
    --accent-dark:  oklch(50% 0.18 32);
    --accent-light: oklch(96% 0.05 32);
    --navy:         oklch(22% 0.04 260);
    --navy-light:   oklch(96% 0.01 260);
    --text:         oklch(20% 0.02 260);
    --muted:        oklch(55% 0.02 260);
    --border:       oklch(88% 0.01 260);
    --surface:      oklch(98.5% 0.005 80);
    --green:        oklch(52% 0.16 145);
    --green-light:  oklch(95% 0.06 145);
    --amber:        oklch(72% 0.16 70);
    --amber-light:  oklch(96% 0.06 70);
    --red:          oklch(56% 0.18 20);
    --red-light:    oklch(96% 0.05 20);
    --scale:        1;
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: white;
    height: 100dvh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  @media (min-width: 1024px) {
    .menu-root {
      --scale: 1.15;
    }
  }
  @keyframes menuFadeUp   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes menuFadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes menuSlideIn  { from{transform:translateX(100%)} to{transform:translateX(0)} }
  @keyframes menuScaleIn  { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  @keyframes menuBounce   { 0%,100%{transform:scale(1)} 40%{transform:scale(1.3)} 70%{transform:scale(0.9)} }
  @keyframes menuSpin     { to{transform:rotate(360deg)} }
  .menu-root .anim-fadeup   { animation: menuFadeUp  0.35s ease both; }
  .menu-root .anim-fadein   { animation: menuFadeIn  0.2s  ease both; }
  .menu-root .anim-slidein  { animation: menuSlideIn 0.25s ease both; }
  .menu-root .anim-scalein  { animation: menuScaleIn 0.22s ease both; }
  .menu-root .anim-bounce   { animation: menuBounce  0.4s  ease; }
  .menu-root .anim-spin     { animation: menuSpin    0.9s  linear infinite; }
  .menu-root ::-webkit-scrollbar { width:4px; }
  .menu-root ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
  .menu-root .card-hover { transition:box-shadow 0.2s,transform 0.2s; }
  .menu-root .card-hover:hover { box-shadow:0 8px 28px rgba(0,0,0,0.10); transform:translateY(-2px); }
  .menu-root .btn-add { transition:background 0.15s,transform 0.12s; }
  .menu-root .btn-add:hover { background: var(--accent-dark) !important; transform:translateY(-1px); }
  .menu-root .menu-cat-tabs::-webkit-scrollbar { display: none; }
  @media (min-width: 768px) {
    .menu-root .product-grid-section { padding-top: 8px; padding-bottom: 8px; }
  }
`;

// ─── Icons ───────────────────────────────────────────────────────────────────
const ICart = ({ s = 18 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);
const IHelp = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IPlus = ({ s = 14 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IMinus = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const ITrash = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4h6v2" />
  </svg>
);
const IClock = ({ s = 12 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IClose = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const ICheck = ({ s = 15 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IQR = ({ s = 18 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
    <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
    <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
    <path d="M14 14h3v3" />
    <path d="M21 14v.01" />
    <path d="M21 21v-4" />
    <path d="M14 21h7" />
  </svg>
);
const IMenu = ({ s = 20 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);
const IUser = ({ s = 16 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IRefresh = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const IReceipt = ({ s = 24 }: { s?: number }) => (
  <svg
    width={s}
    height={s}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IShare = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const ICopy = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const IStar = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IHeart = () => (
  <svg
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const IFire = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1.5C8.5 5 6 8 7.5 12c.5 1.5-.5 3-2 3.5C7 18 9.5 20 12 22.5c2.5-2.5 5-4.5 6.5-7-.5-.5-1.5-2-2-3.5C18 8 15.5 5 12 1.5z" />
  </svg>
);
const INote = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

// ─── Categories ──────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "favorites",
    name: "Favoritos",
    icon: "❤️",
    description: "Los productos más populares",
  },
  {
    id: "repite-item",
    name: "Repite Item",
    icon: "🔄",
    description: "Tus items recientes de esta orden",
  },
  {
    id: "drinks",
    name: "Drinks",
    icon: "🥤",
    description: "Refill de bebidas",
  },
  {
    id: "combos",
    name: "Combos",
    icon: "🍔",
    description: "Combos especiales",
  },
  { id: "breakfast", name: "Breakfast", icon: "🍳", description: "Desayunos" },
  { id: "lunch", name: "Lunch", icon: "🍱", description: "Almuerzos" },
  { id: "dinner", name: "Dinner", icon: "🍕", description: "Cenas" },
  {
    id: "refill",
    name: "Refill",
    icon: "🥤",
    description: "Refill de bebidas",
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────
interface TableUser {
  id: string;
  name: string;
  orderId: string;
}

// ─── Custom Alert ────────────────────────────────────────────────────────────
const CustomAlert = ({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) => (
  <div
    className="anim-fadein"
    onClick={onClose}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.35)",
    }}
  >
    <div
      className="anim-scalein"
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "white",
        borderRadius: 16,
        padding: "28px 32px",
        maxWidth: 340,
        width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "var(--green-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--green)",
            flexShrink: 0,
          }}
        >
          <ICheck />
        </div>
        <div>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>
            ScanEat
          </p>
          <p
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text)",
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          width: "100%",
          padding: 11,
          borderRadius: 10,
          border: "1.5px solid var(--border)",
          background: "white",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text)",
          fontFamily: "inherit",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--surface)")
        }
        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
      >
        Aceptar
      </button>
    </div>
  </div>
);

// ─── Cuenta (Bill) Modal ─────────────────────────────────────────────────────
const CuentaModal = ({
  onClose,
  onConfirm,
  loading,
}: {
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) => (
  <div
    className="anim-fadein"
    onClick={onClose}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 600,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.45)",
    }}
  >
    <div
      className="anim-scalein"
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "white",
        borderRadius: 20,
        padding: "32px 28px",
        maxWidth: 380,
        width: "90%",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "oklch(94% 0.04 250)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          color: "var(--navy)",
        }}
      >
        <IReceipt s={26} />
      </div>
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "var(--text)",
          marginBottom: 10,
        }}
      >
        Solicitar Cuenta
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "var(--muted)",
          lineHeight: 1.6,
          marginBottom: 28,
        }}
      >
        ¿Deseas solicitar el fin de tu cuenta? El mesero te la traerá a la mesa.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1,
            padding: 13,
            borderRadius: 11,
            border: "1.5px solid var(--border)",
            background: "var(--surface)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--muted)",
            fontFamily: "inherit",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            flex: 1,
            padding: 13,
            borderRadius: 11,
            border: "none",
            background: "var(--green)",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            color: "white",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <span className="anim-spin" style={{ display: "inline-block" }}>
              <IRefresh />
            </span>
          ) : (
            <ICheck />
          )}{" "}
          Pedir Cuenta
        </button>
      </div>
    </div>
  </div>
);

// ─── Cart Drawer ─────────────────────────────────────────────────────────────
const CartDrawer = ({
  items,
  customerName,
  orderId,
  onClose,
  onQty,
  onRemove,
  onSend,
  sending,
}: {
  items: OrderItem[];
  customerName: string;
  orderId?: string;
  onClose: () => void;
  onQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onSend: () => void;
  sending: boolean;
}) => {
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div
      className="anim-fadein"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 400,
        display: "flex",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.45)",
      }}
    >
      <div
        className="anim-slidein"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 340,
          background: "white",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>
              Orden de {customerName}
            </p>
            {orderId && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                #{orderId.slice(0, 8)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              padding: 4,
            }}
          >
            <IClose />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {items.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 24px",
                color: "var(--muted)",
              }}
            >
              <ICart s={32} />
              <p style={{ marginTop: 12, fontSize: 14 }}>
                Tu carrito está vacío
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "var(--accent-light)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {item.product_name?.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.product_name}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--accent)",
                      fontWeight: 700,
                    }}
                  >
                    ${item.price.toFixed(2)}
                  </p>
                  {item.notes && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--muted)",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.notes}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button
                    onClick={() => onQty(item.id, item.quantity - 1)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: "1.5px solid var(--border)",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IMinus />
                  </button>
                  <span
                    style={{
                      width: 22,
                      textAlign: "center",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQty(item.id, item.quantity + 1)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: "1.5px solid var(--border)",
                      background: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IPlus />
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      border: "1.5px solid oklch(90% 0.06 20)",
                      background: "oklch(98% 0.03 20)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--red)",
                      marginLeft: 2,
                    }}
                  >
                    <ITrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div
            style={{
              padding: "16px 20px 20px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span
                style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}
              >
                Total:
              </span>
              <span
                style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}
              >
                ${total.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 16,
              }}
            >
              <IClock />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                Tiempo estimado: ~10 minutos
              </span>
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--muted)",
                  fontFamily: "inherit",
                }}
              >
                Seguir Pidiendo
              </button>
              <button
                onClick={onSend}
                disabled={sending}
                style={{
                  flex: 2,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: "var(--green)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.15s",
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? (
                  <span
                    className="anim-spin"
                    style={{ display: "inline-block" }}
                  >
                    <IRefresh />
                  </span>
                ) : (
                  <ICheck />
                )}
                {sending ? "Enviando…" : "Enviar a Cocina"}
              </button>
            </div>
            <p
              style={{
                fontSize: 11,
                color: "var(--muted)",
                textAlign: "center",
              }}
            >
              💡 Los nuevos ítems se agregarán a una nueva orden
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Product Modal (new design, preserves all extras/notes logic) ─────────────
const ProductModal = ({
  product,
  onClose,
  onAdd,
  adding,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (notes: string, qty: number, extras: { [k: string]: boolean }) => void;
  adding: boolean;
}) => {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<{
    [k: string]: boolean;
  }>({});

  const extrasTotal = Object.entries(selectedExtras)
    .filter(([, v]) => v)
    .reduce((s, [name]) => {
      const extra = product.extras?.find((e) => e.name === name);
      return s + (extra?.price || 0);
    }, 0);
  const total = (product.price + extrasTotal) * qty;

  return (
    <div
      className="anim-fadein"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        padding: 16,
      }}
    >
      <div
        className="anim-scalein"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 18,
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
          overflow: "hidden",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "var(--accent-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent)",
              }}
            >
              <ICart s={15} />
            </div>
            <span
              style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}
            >
              Personalizar Pedido
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--muted)",
              padding: 4,
            }}
          >
            <IClose />
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Product info */}
          <div
            style={{
              padding: "16px 24px",
              display: "flex",
              gap: 14,
              alignItems: "flex-start",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 10,
                background: "var(--accent-light)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontSize: 28 }}>🍽️</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 3,
                }}
              >
                {product.name}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  marginBottom: 8,
                  lineHeight: 1.5,
                }}
              >
                {product.description}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 800,
                    color: "var(--navy)",
                  }}
                >
                  ${product.price.toFixed(2)}
                </span>
                {product.preparation_time && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <IClock />
                    {product.preparation_time} min
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Extras */}
          {product.extras &&
            product.extras.filter((e) => e.is_available).length > 0 && (
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <IPlus s={12} /> Extras opcionales
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {product.extras
                    .filter((e) => e.is_available)
                    .map((extra, i) => (
                      <label
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 12px",
                          border: `1.5px solid ${selectedExtras[extra.name] ? "var(--green)" : "var(--border)"}`,
                          borderRadius: 10,
                          cursor: "pointer",
                          background: selectedExtras[extra.name]
                            ? "var(--green-light)"
                            : "white",
                          transition: "all 0.15s",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!selectedExtras[extra.name]}
                            onChange={() =>
                              setSelectedExtras((prev) => ({
                                ...prev,
                                [extra.name]: !prev[extra.name],
                              }))
                            }
                            style={{
                              accentColor: "var(--green)",
                              width: 16,
                              height: 16,
                            }}
                          />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "var(--text)",
                            }}
                          >
                            {extra.name}
                          </span>
                        </div>
                        {extra.price > 0 && (
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--green)",
                            }}
                          >
                            +${extra.price.toFixed(2)}
                          </span>
                        )}
                      </label>
                    ))}
                </div>
              </div>
            )}

          {/* Quantity + Notes */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span
                style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}
              >
                Cantidad
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  style={{
                    width: 36,
                    height: 36,
                    background: qty === 1 ? "var(--surface)" : "white",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text)",
                  }}
                >
                  <IMinus />
                </button>
                <span
                  style={{
                    width: 36,
                    textAlign: "center",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  style={{
                    width: 36,
                    height: 36,
                    background: "white",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text)",
                  }}
                >
                  <IPlus />
                </button>
              </div>
            </div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
              }}
            >
              <INote /> Instrucciones especiales (opcional):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              placeholder="Ej: Sin tomate, extra queso, bien cocido…"
              style={{
                width: "100%",
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 13,
                color: "var(--text)",
                resize: "none",
                height: 80,
                fontFamily: "inherit",
                lineHeight: 1.6,
                background: "var(--surface)",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              {notes.length}/200 caracteres
            </p>
          </div>

          {/* Total + CTA */}
          <div style={{ padding: "16px 24px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <span
                style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}
              >
                Total:
              </span>
              <span
                style={{ fontSize: 18, fontWeight: 800, color: "var(--green)" }}
              >
                ${total.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: 13,
                  borderRadius: 11,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--muted)",
                  fontFamily: "inherit",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => onAdd(notes, qty, selectedExtras)}
                disabled={adding}
                style={{
                  flex: 2,
                  padding: 13,
                  borderRadius: 11,
                  border: "none",
                  background: "var(--navy)",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "white",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.15s",
                  opacity: adding ? 0.7 : 1,
                }}
              >
                {adding ? (
                  <span
                    className="anim-spin"
                    style={{ display: "inline-block" }}
                  >
                    <IRefresh />
                  </span>
                ) : (
                  <IPlus />
                )}
                {adding ? "Agregando…" : "Agregar al Carrito"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MenuPage() {
  const router = useRouter();
  const { session, clearSession, updateSession } = useSession();

  // ── Session state ──
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const tableId = session?.tableId;
  const userId = session?.userId;
  const orderId = session?.orderId;
  const customerName = session?.customerName;
  const tableNumber = session?.tableNumber;

  const {
    currentOrder,
    orderItems,
    cartTotal,
    cartItemsCount,
    loading,
    currentTableId,
    currentUserId,
    setCurrentUserOrder,
    refreshOrder,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    createNewOrder,
    getRecentOrdersItems,
    getTableUsers,
    switchUserOrder,
  } = useOrder();

  // ── Menu state ──
  const [selectedCategory, setSelectedCategory] = useState("favorites");
  const [products, setProducts] = useState<Product[]>([]);
  const [recentItems, setRecentItems] = useState<Product[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);
  const [recentOrderItems, setRecentOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [lastOrderSent, setLastOrderSent] = useState(false);
  const [tableUsers, setTableUsers] = useState<TableUser[]>([]);
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [tableStatus, setTableStatus] = useState<string | null>(null);
  const [checkingTableStatus, setCheckingTableStatus] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notes, setNotes] = useState("");
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<{
    [k: string]: boolean;
  }>({});
  const [cartBounce, setCartBounce] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const menuScrollRef = useRef<HTMLDivElement>(null);
  const catTabsRef = useRef<HTMLDivElement>(null);
  const catTabBtnRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const stickyHeaderRef = useRef<HTMLDivElement>(null);

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<"menu" | "cuenta" | "qr">("menu");

  // ── History / Cuenta state ──
  const [orderHistory, setOrderHistory] = useState<OrderWithItems[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRefreshed, setHistoryRefreshed] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);

  // ── QR state ──
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────
  const clearLocalStorage = () => {
    const keysToRemove = [
      "GDPR_REMOVAL_FLAG",
      "app_session",
      "currentOrder",
      "currentOrderId",
      "currentTableId",
      "currentUserId",
      "currentUserName",
      "customerSession",
      "historyUserData",
      "orderItems",
      "photoSphereViewer_touchSupport",
      "restaurant_tableId",
      "restaurant_userId",
      "restaurant_userName",
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    Object.keys(localStorage).forEach((k) => {
      if (
        k.startsWith("paymentState_") ||
        k.startsWith("paymentStatus_") ||
        k.startsWith("pendingItems_")
      )
        localStorage.removeItem(k);
    });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(n);

  // ─────────────────────────────────────────────────────────────────────────
  // Table status check & realtime subscription
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkTableStatus = async () => {
      const tid = tableId || currentTableId;
      if (!tid || !hasCheckedSession) return;
      setCheckingTableStatus(true);
      try {
        const { data } = await supabase
          .from("tables")
          .select("status")
          .eq("id", tid)
          .single();
        const typed = data as { status: string } | null;
        if (typed?.status) {
          setTableStatus(typed.status);
          if (typed.status === "available") {
            clearLocalStorage();
            clearSession();
            setTimeout(() => router.push("/customer"), 500);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCheckingTableStatus(false);
      }
    };
    if (hasCheckedSession && (tableId || currentTableId)) checkTableStatus();
  }, [hasCheckedSession, tableId, currentTableId]);

  useEffect(() => {
    const tid = tableId || currentTableId;
    if (!tid || !hasCheckedSession) return;
    const sub = supabase
      .channel(`table-status-${tid}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tables",
          filter: `id=eq.${tid}`,
        },
        (payload) => {
          setTableStatus(payload.new.status);
          if (payload.new.status === "available") {
            clearLocalStorage();
            clearSession();
            setTimeout(() => {
              alert("👋 La mesa ha sido liberada. Gracias por su visita!");
              router.push("/customer");
            }, 300);
          }
        },
      )
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, [tableId, currentTableId, hasCheckedSession]);

  useEffect(() => {
    const tid = tableId || currentTableId;
    if (!tid || !hasCheckedSession) return;
    const sub = supabase
      .channel(`customer-menu-table-${tid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waiter_notifications",
          filter: `table_id=eq.${tid}`,
        },
        (payload) => {
          if (payload.new.type === "table_freed") {
            alert("✅ La cuenta ha sido cerrada. Gracias por su visita!");
            clearSession();
            window.location.href = "/customer";
          }
        },
      )
      .subscribe();
    return () => {
      sub.unsubscribe();
    };
  }, [tableId, currentTableId, hasCheckedSession]);

  // ─────────────────────────────────────────────────────────────────────────
  // Session initialization
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAndLoadSession = async () => {
      if (hasCheckedSession) return;
      if (!session && !tableId && !orderId && !userId) {
        try {
          const stored = localStorage.getItem("customerSession");
          if (stored) {
            updateSession(JSON.parse(stored));
            setTimeout(() => {
              setHasCheckedSession(true);
              setIsInitialLoad(false);
            }, 100);
            return;
          }
        } catch (e) {
          console.error(e);
        }
      }
      if (tableId && orderId && userId) {
        setHasCheckedSession(true);
        setIsInitialLoad(false);
      } else if (session) {
        setHasCheckedSession(true);
        setIsInitialLoad(false);
      }
    };
    checkAndLoadSession();
  }, [session, tableId, orderId, userId, hasCheckedSession]);

  useEffect(() => {
    if (!hasCheckedSession || isInitialLoad) return;
    const loadData = async () => {
      if (!tableId || !orderId || !userId) {
        router.push("/customer");
        return;
      }
      try {
        await loadInitialData(parseInt(tableId), orderId, userId);
      } catch (e) {
        console.error(e);
        router.push("/customer");
      }
    };
    loadData();
  }, [hasCheckedSession, isInitialLoad, tableId, orderId, userId]);

  useEffect(() => {
    if (tableId && hasCheckedSession) loadTableUsers(parseInt(tableId));
  }, [tableId, hasCheckedSession]);

  // ─────────────────────────────────────────────────────────────────────────
  // Scroll tracking for category tabs
  // ─────────────────────────────────────────────────────────────────────────
  const selectedCategoryRef = useRef(selectedCategory);
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  useEffect(() => {
    if (products.length === 0 || !hasCheckedSession) return;
    const container = menuScrollRef.current;
    if (!container) return;

    const getAvailable = () =>
      CATEGORIES.filter((cat) => getProductsByCategory(cat.id).length > 0);

    const onScroll = () => {
      const available = getAvailable();
      if (!available.length) return;

      const headerHeight = stickyHeaderRef.current?.offsetHeight ?? 100;
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        8;

      if (atBottom) {
        const lastId = available[available.length - 1].id;
        if (lastId !== selectedCategoryRef.current) setSelectedCategory(lastId);
        return;
      }

      // Range-based: cat is active while scrollTop is in [catTop, nextCatTop)
      let active = available[0].id;
      for (let i = 0; i < available.length; i++) {
        const el = categoryRefs.current[available[i].id];
        if (!el) continue;
        const sectionTop = el.offsetTop - headerHeight;
        const nextEl = available[i + 1]
          ? categoryRefs.current[available[i + 1].id]
          : null;
        const sectionBottom = nextEl
          ? nextEl.offsetTop - headerHeight
          : Infinity;
        if (
          container.scrollTop >= sectionTop &&
          container.scrollTop < sectionBottom
        ) {
          active = available[i].id;
          break;
        }
      }

      if (active !== selectedCategoryRef.current) setSelectedCategory(active);
    };

    let ticking = false;
    const throttled = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          onScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", throttled, { passive: true });
    onScroll(); // run once on mount
    return () => container.removeEventListener("scroll", throttled);
  }, [products, hasCheckedSession]);

  // Auto-scroll the category tab bar to keep the active tab visible
  useEffect(() => {
    const tabBar = catTabsRef.current;
    const btn = catTabBtnRefs.current[selectedCategory];
    if (!tabBar || !btn) return;
    const barLeft = tabBar.scrollLeft;
    const barRight = barLeft + tabBar.clientWidth;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    if (btnLeft < barLeft + 20) {
      tabBar.scrollTo({ left: btnLeft - 20, behavior: "smooth" });
    } else if (btnRight > barRight - 20) {
      tabBar.scrollTo({
        left: btnRight - tabBar.clientWidth + 20,
        behavior: "smooth",
      });
    }
  }, [selectedCategory]);

  // ─────────────────────────────────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────────────────────────────────
  const loadTableUsers = async (tid: number) => {
    try {
      const users = await getTableUsers(tid);
      setTableUsers(users);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInitialData = async (tid: number, oid: string, uid: string) => {
    setIsLoading(true);
    try {
      await setCurrentUserOrder(oid, uid);
      if (currentTableId) await refreshOrder(currentTableId);
      const [allProducts, recent] = await Promise.all([
        productsService.getProducts(),
        getRecentOrdersItems(tid),
      ]);
      setProducts(allProducts);
      setRecentOrderItems(recent);
      const favs = allProducts.filter((p) => p.is_favorite);
      setFavoriteItems(favs);
      const recentProds = recent
        .map((ri) => allProducts.find((p) => p.id === ri.product_id))
        .filter((p): p is Product => !!p)
        .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
      setRecentItems(recentProds);
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Product helpers
  // ─────────────────────────────────────────────────────────────────────────
  const getProductsByCategory = (catId: string) => {
    switch (catId) {
      case "favorites":
        return favoriteItems;
      case "repite-item":
        return recentItems;
      case "popular":
        return products.filter((p) => p.rating && p.rating >= 4.5).slice(0, 6);
      default: {
        const map: { [k: string]: string } = {
          drinks: "Drinks",
          combos: "Combos",
          breakfast: "Breakfast",
          lunch: "Lunch",
          dinner: "Dinner",
          refill: "Refill",
        };
        return products.filter((p) => p.category === map[catId]);
      }
    }
  };

  const isProductInCart = (pid: number) =>
    orderItems.some((i) => i.product_id === pid);
  const getProductQtyInCart = (pid: number) =>
    orderItems.find((i) => i.product_id === pid)?.quantity || 0;
  const getProductNotesInCart = (pid: number) =>
    orderItems.find((i) => i.product_id === pid)?.notes || null;
  const getProductTotalRecentQty = (pid: number) =>
    recentOrderItems
      .filter((i) => i.product_id === pid)
      .reduce((s, i) => s + i.quantity, 0);

  const getEstimatedTime = () => {
    if (orderItems.length === 0) return 0;
    let maxTime = 0,
      maxQty = 0;
    const seen = new Set<number>();
    orderItems.forEach((item) => {
      const p = products.find((x) => x.id === item.product_id);
      maxTime = Math.max(maxTime, p?.preparation_time || 10);
      maxQty = Math.max(maxQty, item.quantity);
      seen.add(item.product_id);
    });
    const mult = maxQty > 5 ? 1.8 : maxQty > 3 ? 1.5 : maxQty > 1 ? 1.2 : 1;
    let t = maxTime * mult;
    if (seen.size > 4) t += 8;
    else if (seen.size > 2) t += 5;
    return Math.min(Math.max(t, 2), 45);
  };

  const scrollToCategory = (catId: string) => {
    setSelectedCategory(catId);
    setTimeout(() => {
      const el = categoryRefs.current[catId];
      if (el && menuScrollRef.current) {
        const offset = stickyHeaderRef.current?.offsetHeight ?? 100;
        menuScrollRef.current.scrollTo({
          top: el.offsetTop - offset,
          behavior: "smooth",
        });
      }
    }, 10);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Cart handlers
  // ─────────────────────────────────────────────────────────────────────────
  const resetExtras = () => {
    setSelectedExtras({});
    setNotes("");
    setEditingItem(null);
  };

  const handleAddToCartWithNotes = (product: Product) => {
    setSelectedProduct(product);
    setNotes("");
    setEditingItem(null);
    setSelectedExtras({});
    setShowNotesModal(true);
  };

  const handleConfirmAdd = async (
    noteText: string,
    qty: number,
    extras: { [k: string]: boolean },
  ) => {
    if (!selectedProduct) return;
    setAddingProduct(selectedProduct.id);
    try {
      const extrasTotal = Object.entries(extras)
        .filter(([, v]) => v)
        .reduce((s, [name]) => {
          const e = selectedProduct.extras?.find((x) => x.name === name);
          return s + (e?.price || 0);
        }, 0);
      const totalPrice = selectedProduct.price + extrasTotal;
      const trimmed = noteText.trim();
      const extrasList = Object.entries(extras)
        .filter(([, v]) => v)
        .map(([name]) => {
          const e = selectedProduct.extras?.find((x) => x.name === name);
          return { name, price: e?.price || 0 };
        });
      let finalNotes = trimmed;
      if (extrasList.length > 0) {
        const extrasText = `Extras: ${extrasList.map((e) => `${e.name} (+$${e.price.toFixed(2)})`).join(", ")}`;
        finalNotes = trimmed ? `${trimmed} | ${extrasText}` : extrasText;
        if (extrasTotal > 0)
          finalNotes += ` | Total: $${totalPrice.toFixed(2)}`;
      }
      const existing = orderItems.find(
        (i) =>
          i.product_id === selectedProduct.id &&
          i.notes === finalNotes &&
          i.price === totalPrice,
      );
      if (existing) {
        await updateCartItem(existing.id, existing.quantity + qty);
      } else if (editingItem) {
        await updateCartItem(
          editingItem.id,
          editingItem.quantity,
          finalNotes,
          totalPrice,
        );
      } else {
        for (let i = 0; i < qty; i++)
          await addToCart(selectedProduct, 1, finalNotes, totalPrice);
      }
      setShowNotesModal(false);
      resetExtras();
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingProduct(null);
    }
  };

  const handleSendOrder = async () => {
    if (!currentOrder || orderItems.length === 0) return;
    setSendingOrder(true);
    try {
      await ordersService.updateOrderStatus(currentOrder.id, "sent");
      await notificationsService.createNotification(
        currentOrder.table_id,
        "new_order",
        `Nueva orden de ${currentOrder.customer_name} desde Mesa ${currentOrder.table_id}`,
        currentOrder.id,
      );
      const newOrderId = await createNewOrder(currentOrder.customer_name);
      updateSession({ userId: newOrderId, orderId: newOrderId });
      await loadTableUsers(currentOrder.table_id);
      setLastOrderSent(true);
      setShowCart(false);
      setAlertMessage(
        `¡Orden enviada a cocina, ${currentOrder.customer_name}! Tu carrito está listo para nuevos pedidos.`,
      );
    } catch (e) {
      console.error(e);
      setAlertMessage("❌ Error al enviar la orden. Intenta nuevamente.");
    } finally {
      setSendingOrder(false);
    }
  };

  const handleAssistanceRequest = async () => {
    const tid = tableId || currentTableId;
    if (!tid) return;
    setAssistanceLoading(true);
    try {
      await historyService.requestAssistance(parseInt(tid.toString()));
      setAlertMessage("El mesero ha sido notificado. Pronto te atenderá.");
    } catch (e) {
      console.error(e);
      setAlertMessage("❌ Error al solicitar asistencia");
    } finally {
      setAssistanceLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // History / Cuenta handlers
  // ─────────────────────────────────────────────────────────────────────────
  const loadHistory = async () => {
    if (!tableId) return;
    setHistoryLoading(true);
    try {
      const history = await historyService.getCustomerOrderHistory(
        parseInt(tableId),
      );
      setOrderHistory(
        history.map((o) => ({
          ...o,
          order_items: o.order_items.map((item: any) => ({
            ...item,
            cancelled_quantity: item.cancelled_quantity || 0,
            ...(item.status === "cancelled" &&
              !item.cancelled_quantity && {
                cancelled_quantity: item.quantity,
              }),
          })),
        })),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleHistoryRefresh = () => {
    setHistoryRefreshed(true);
    setHistoryKey((k) => k + 1);
    loadHistory().finally(() =>
      setTimeout(() => setHistoryRefreshed(false), 1000),
    );
  };

  useEffect(() => {
    if (activeTab === "cuenta" && tableId) loadHistory();
  }, [activeTab, tableId]);

  const handleBillConfirm = async () => {
    if (!tableId) return;
    setBillLoading(true);
    try {
      await historyService.requestBill(
        parseInt(tableId),
        currentOrder?.id,
        "ticket",
      );
      setShowBillModal(false);
      setAlertMessage(
        "Se ha solicitado la cuenta. El mesero te la traerá pronto.",
      );
      setTimeout(() => router.push("/customer/payment"), 1200);
    } catch (e) {
      console.error(e);
      setAlertMessage("❌ Error al solicitar el ticket");
    } finally {
      setBillLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // QR handlers
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "qr" && tableId && tableNumber) {
      const base = window.location.origin;
      setCurrentUrl(`${base}/customer?table=${tableNumber}`);
    }
  }, [activeTab, tableId, tableNumber]);

  useEffect(() => {
    if (activeTab === "qr") {
      supabase.storage
        .from("logo")
        .list("", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        })
        .then(({ data: files }) => {
          if (!files?.length) {
            setLogoUrl(null);
            return;
          }
          const logo = files.find((f) => f.name.startsWith("logo_"));
          if (!logo) {
            setLogoUrl(null);
            return;
          }
          const { data: urlData } = supabase.storage
            .from("logo")
            .getPublicUrl(logo.name);
          setLogoUrl(
            urlData?.publicUrl ? `${urlData.publicUrl}?t=${Date.now()}` : null,
          );
        })
        .catch(() => setLogoUrl(null));
    }
  }, [activeTab]);

  const handleCopyLink = async () => {
    if (!currentUrl) return;
    try {
      await navigator.clipboard.writeText(currentUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = currentUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!currentUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Únete a mi mesa - ScanEat",
          text: `Únete a mi mesa ${tableNumber} en ScanEat`,
          url: currentUrl,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / error screens
  // ─────────────────────────────────────────────────────────────────────────
  const LoadingScreen = ({ label }: { label: string }) => (
    <div
      style={{
        minHeight: "100vh",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans',sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "oklch(62% 0.18 32)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <span
            style={{
              animation: "spin 1s linear infinite",
              display: "flex",
              color: "white",
            }}
          >
            <IRefresh />
          </span>
        </div>
        <p style={{ color: "oklch(55% 0.02 260)", fontSize: 14 }}>{label}</p>
      </div>
    </div>
  );

  if (checkingTableStatus)
    return <LoadingScreen label="Verificando estado de la mesa…" />;
  if (tableStatus === "available")
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "oklch(96% 0.05 32)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              color: "oklch(62% 0.18 32)",
            }}
          >
            <IQR s={28} />
          </div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "oklch(20% 0.02 260)",
              marginBottom: 8,
            }}
          >
            Mesa Liberada
          </h2>
          <p
            style={{
              color: "oklch(55% 0.02 260)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Esta mesa ha sido liberada. Escanea el código QR nuevamente para
            hacer un nuevo pedido.
          </p>
          <button
            onClick={() => {
              clearSession();
              router.push("/customer");
            }}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "oklch(62% 0.18 32)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Volver al escáner QR
          </button>
        </div>
      </div>
    );
  if (!hasCheckedSession || isInitialLoad)
    return <LoadingScreen label="Recuperando sesión…" />;
  if (hasCheckedSession && (!tableId || !orderId || !userId))
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "oklch(20% 0.02 260)",
              marginBottom: 8,
            }}
          >
            Sesión no válida
          </h2>
          <p style={{ color: "oklch(55% 0.02 260)", marginBottom: 24 }}>
            Tu sesión ha expirado. Por favor escanea el código QR nuevamente.
          </p>
          <button
            onClick={() => {
              clearSession();
              router.push("/customer");
            }}
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "none",
              background: "oklch(62% 0.18 32)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Volver al escáner QR
          </button>
        </div>
      </div>
    );
  if (isLoading) return <LoadingScreen label="Cargando menú…" />;

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Menu
  // ─────────────────────────────────────────────────────────────────────────
  const renderMenuTab = () => {
    const availableCats = CATEGORIES.filter(
      (c) => getProductsByCategory(c.id).length > 0,
    );
    return (
      <>
        {/* Sticky header wrapper — measured for scrollspy offset */}
        <div ref={stickyHeaderRef} style={{ flexShrink: 0 }}>
          {/* Header */}
          <header
            style={{
              padding: "12px 20px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "white",
              flexShrink: 0,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--navy)",
                  letterSpacing: "-0.3px",
                }}
              >
                ScanEat
              </p>
              <p style={{ fontSize: 11, color: "var(--muted)" }}>
                Mesa {tableNumber} • {customerName}
                {currentOrder?.id && ` • #${currentOrder.id.slice(0, 8)}`}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                onClick={handleAssistanceRequest}
                disabled={assistanceLoading}
                style={{
                  background: "var(--amber-light)",
                  color: "var(--amber)",
                  border: "1.5px solid oklch(88% 0.1 70)",
                  borderRadius: 9,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "inherit",
                  opacity: assistanceLoading ? 0.7 : 1,
                }}
              >
                <IHelp /> {assistanceLoading ? "Enviando…" : "Ayuda"}
              </button>
              <button
                onClick={() => setShowCart(true)}
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 9,
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "inherit",
                  animation: cartBounce ? "menuBounce 0.4s ease" : "none",
                  position: "relative",
                }}
              >
                <ICart s={16} /> {cartItemsCount} ${cartTotal.toFixed(2)}
                {cartItemsCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "var(--red)",
                      fontSize: 9,
                      fontWeight: 800,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {cartItemsCount > 99 ? "99+" : cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Cart summary bar */}
          {cartItemsCount > 0 && (
            <div
              className="anim-fadeup"
              style={{
                padding: "9px 20px",
                background: "var(--green-light)",
                borderBottom: "1px solid oklch(88% 0.08 145)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--green)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <ICheck s={12} /> {cartItemsCount}{" "}
                {cartItemsCount === 1 ? "ítem" : "ítems"} en carrito de{" "}
                {customerName}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <IClock /> ~{Math.round(getEstimatedTime())} min
              </p>
            </div>
          )}

          {lastOrderSent && cartItemsCount === 0 && (
            <div
              className="anim-fadeup"
              style={{
                padding: "9px 20px",
                background: "var(--green-light)",
                borderBottom: "1px solid oklch(88% 0.08 145)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <ICheck s={14} />
              <span
                style={{ fontSize: 13, fontWeight: 600, color: "var(--green)" }}
              >
                ¡Orden enviada a cocina! Puedes seguir agregando ítems.
              </span>
            </div>
          )}

          {/* Category tabs */}
          <div
            style={{
              position: "relative",
              flexShrink: 0,
              background: "white",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={
                {
                  padding: "12px 20px 0",
                  display: "flex",
                  gap: 4,
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch" as never,
                  scrollbarWidth: "none" as never,
                  msOverflowStyle: "none" as never,
                } as React.CSSProperties
              }
              className="menu-cat-tabs"
              ref={catTabsRef}
            >
              {availableCats.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    ref={(el) => {
                      catTabBtnRefs.current[cat.id] = el;
                    }}
                    onClick={() => scrollToCategory(cat.id)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px 10px 0 0",
                      border: active
                        ? "1.5px solid var(--accent)"
                        : "1.5px solid transparent",
                      background: active ? "var(--accent)" : "transparent",
                      color: active ? "white" : "var(--muted)",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      borderBottom: active
                        ? "1.5px solid white"
                        : "1.5px solid transparent",
                      marginBottom: -1,
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                    }}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
            {/* fade hint — more tabs to the right */}
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 1,
                width: 40,
                background: "linear-gradient(to right, transparent, white)",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
        {/* end stickyHeaderRef */}

        {/* Product grid */}
        <main
          ref={menuScrollRef}
          style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}
        >
          {availableCats.map((cat) => {
            const catProducts = getProductsByCategory(cat.id);
            if (!catProducts.length) return null;
            return (
              <div
                key={cat.id}
                ref={(el) => {
                  categoryRefs.current[cat.id] = el;
                }}
                data-category-id={cat.id}
                className="anim-fadeup product-grid-section"
                style={{ marginBottom: 56 }}
              >
                <div
                  style={{
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        fontSize: 26,
                        fontWeight: 800,
                        color: "var(--text)",
                        letterSpacing: "-0.4px",
                      }}
                    >
                      {cat.name}
                    </h2>
                    <p
                      style={{
                        fontSize: 16,
                        color: "var(--muted)",
                        marginTop: 4,
                      }}
                    >
                      {catProducts.length} producto
                      {catProducts.length !== 1 ? "s" : ""} disponibles
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "var(--muted)",
                      background: "var(--surface)",
                      border: "1.5px solid var(--border)",
                      borderRadius: 20,
                      padding: "6px 14px",
                    }}
                  >
                    {catProducts.length} items
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
                    gap: 20,
                  }}
                >
                  {catProducts.map((product) => {
                    const inCart = isProductInCart(product.id);
                    const qty = getProductQtyInCart(product.id);
                    const curNotes = getProductNotesInCart(product.id);
                    const recentQty = getProductTotalRecentQty(product.id);

                    return (
                      <div
                        key={product.id}
                        className="card-hover"
                        style={{
                          background: "white",
                          borderRadius: 14,
                          border: "1.5px solid var(--border)",
                          overflow: "hidden",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        onClick={() => handleAddToCartWithNotes(product)}
                      >
                        {/* Image */}
                        <div style={{ position: "relative" }}>
                          <div
                            style={{
                              width: "100%",
                              height: 210,
                              background: "var(--surface)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                            }}
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span style={{ fontSize: 36 }}>🍽️</span>
                            )}
                          </div>
                          {/* Badges */}
                          <div
                            style={{
                              position: "absolute",
                              top: 8,
                              left: 8,
                              display: "flex",
                              gap: 4,
                              flexWrap: "wrap",
                            }}
                          >
                            {product.is_favorite && (
                              <span
                                style={{
                                  background: "oklch(52% 0.18 20)",
                                  color: "white",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <IHeart />
                                Favorito
                              </span>
                            )}
                            {product.rating && product.rating >= 4.5 && (
                              <span
                                style={{
                                  background: "var(--accent)",
                                  color: "white",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <IFire />
                                Popular
                              </span>
                            )}
                            {cat.id === "repite-item" && recentQty > 0 && (
                              <span
                                style={{
                                  background: "oklch(55% 0.14 300)",
                                  color: "white",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: "2px 7px",
                                  borderRadius: 10,
                                }}
                              >
                                {recentQty}x antes
                              </span>
                            )}
                          </div>
                          {product.rating && product.rating > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                background: "white",
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 10,
                                color: "var(--text)",
                                boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              <IStar />⭐ {product.rating.toFixed(1)}
                            </span>
                          )}
                          {inCart && (
                            <span
                              style={{
                                position: "absolute",
                                bottom: 8,
                                right: 8,
                                background: "var(--green)",
                                color: "white",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 10,
                              }}
                            >
                              {qty} en carrito
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div
                          style={{
                            padding: "16px 16px 18px",
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "var(--text)",
                              marginBottom: 6,
                            }}
                          >
                            {product.name}
                          </p>
                          <p
                            style={{
                              fontSize: 14,
                              color: "var(--muted)",
                              lineHeight: 1.5,
                              marginBottom: 8,
                              flex: 1,
                            }}
                          >
                            {product.description}
                          </p>
                          {product.extras &&
                            product.extras.filter((e) => e.is_available)
                              .length > 0 && (
                              <p
                                style={{
                                  fontSize: 11,
                                  color: "var(--green)",
                                  fontWeight: 600,
                                  marginBottom: 6,
                                }}
                              >
                                +
                                {
                                  product.extras.filter((e) => e.is_available)
                                    .length
                                }{" "}
                                extras disponibles
                              </p>
                            )}
                          {inCart && curNotes && (
                            <p
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                marginBottom: 6,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              📝 {curNotes}
                            </p>
                          )}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: 10,
                            }}
                          >
                            <div>
                              <p
                                style={{
                                  fontSize: 18,
                                  fontWeight: 800,
                                  color: "var(--navy)",
                                }}
                              >
                                ${product.price.toFixed(2)}
                              </p>
                              {product.preparation_time && (
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: "var(--muted)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                    marginTop: 4,
                                  }}
                                >
                                  <IClock />
                                  {product.preparation_time} min
                                </p>
                              )}
                            </div>
                            {inCart ? (
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  border: "1.5px solid var(--border)",
                                  borderRadius: 9,
                                  overflow: "hidden",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const item = orderItems.find(
                                      (i) => i.product_id === product.id,
                                    );
                                    if (item) {
                                      if (qty > 1)
                                        updateCartItem(item.id, qty - 1);
                                      else removeFromCart(item.id);
                                    }
                                  }}
                                  style={{
                                    width: 30,
                                    height: 30,
                                    background: "var(--red-light)",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--red)",
                                  }}
                                >
                                  <IMinus />
                                </button>
                                <span
                                  style={{
                                    width: 28,
                                    textAlign: "center",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: "var(--text)",
                                  }}
                                >
                                  {qty}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const item = orderItems.find(
                                      (i) => i.product_id === product.id,
                                    );
                                    if (item) updateCartItem(item.id, qty + 1);
                                  }}
                                  style={{
                                    width: 30,
                                    height: 30,
                                    background: "var(--green-light)",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--green)",
                                  }}
                                >
                                  <IPlus />
                                </button>
                              </div>
                            ) : (
                              <button
                                className="btn-add"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCartWithNotes(product);
                                }}
                                disabled={addingProduct === product.id}
                                style={{
                                  background: "var(--accent)",
                                  color: "white",
                                  border: "none",
                                  cursor: "pointer",
                                  borderRadius: 9,
                                  padding: "8px 14px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  fontFamily: "inherit",
                                  opacity:
                                    addingProduct === product.id ? 0.7 : 1,
                                }}
                              >
                                {addingProduct === product.id ? (
                                  <span
                                    className="anim-spin"
                                    style={{ display: "inline-block" }}
                                  >
                                    <IRefresh />
                                  </span>
                                ) : (
                                  <IPlus />
                                )}
                                {addingProduct === product.id ? "…" : "Agregar"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </main>
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: Cuenta (History + Bill)
  // ─────────────────────────────────────────────────────────────────────────
  const renderCuentaTab = () => {
    const groupedByCustomer = () => {
      const map = new Map<
        string,
        {
          name: string;
          orders: OrderWithItems[];
          subtotal: number;
          items: number;
        }
      >();
      orderHistory.forEach((order) => {
        const name = order.customer_name || "Cliente";
        if (!map.has(name))
          map.set(name, { name, orders: [], subtotal: 0, items: 0 });
        const g = map.get(name)!;
        g.orders.push(order);
        order.order_items.forEach((item: any) => {
          const cancelled = item.cancelled_quantity || 0;
          const active = item.quantity - cancelled;
          g.subtotal += item.price * active;
          if (active > 0) g.items++;
        });
      });
      return Array.from(map.values());
    };
    const groups = groupedByCustomer();

    return (
      <>
        <header
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "white",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "var(--navy)",
                letterSpacing: "-0.3px",
              }}
            >
              Historial de Pedidos
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)" }}>
              Mesa {tableNumber} • {customerName} •{" "}
              <span style={{ color: "var(--green)", fontWeight: 600 }}>
                ● Ocupada
              </span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleHistoryRefresh}
              style={{
                background: historyRefreshed
                  ? "var(--green-light)"
                  : "var(--navy-light)",
                color: historyRefreshed ? "var(--green)" : "var(--navy)",
                border: "1.5px solid var(--border)",
                borderRadius: 9,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  animation: historyRefreshed ? "menuSpin 1s linear" : "none",
                }}
              >
                <IRefresh />
              </span>{" "}
              Actualizar
            </button>
            <button
              onClick={handleAssistanceRequest}
              disabled={assistanceLoading}
              style={{
                background: "var(--amber-light)",
                color: "var(--amber)",
                border: "1.5px solid oklch(88% 0.1 70)",
                borderRadius: 9,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              <IHelp /> Ayuda
            </button>
            <button
              onClick={() => setShowBillModal(true)}
              style={{
                background: "var(--red-light)",
                color: "var(--red)",
                border: "1.5px solid oklch(88% 0.08 20)",
                borderRadius: 9,
                padding: "8px 14px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              <IReceipt s={15} /> Cuenta
            </button>
          </div>
        </header>

        <main
          key={historyKey}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 20px",
            animation: "menuFadeUp 0.3s ease",
          }}
        >
          {historyLoading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 12,
                color: "var(--muted)",
              }}
            >
              <span className="anim-spin" style={{ display: "inline-block" }}>
                <IRefresh />
              </span>
              <span style={{ fontSize: 14 }}>Cargando historial…</span>
            </div>
          ) : groups.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: 16,
                color: "var(--muted)",
                paddingBottom: 40,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: "var(--surface)",
                  border: "1.5px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--border)",
                }}
              >
                <IMenu s={28} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 6,
                  }}
                >
                  Aún no has ordenado
                </p>
                <p style={{ fontSize: 13, color: "var(--muted)" }}>
                  Primero ordena tu orden desde el menú
                </p>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 16 }}>
                <h2
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: "var(--muted)" }}>↩</span> Historial de
                  la Mesa
                </h2>
              </div>
              {groups.map((group, gi) => (
                <div
                  key={gi}
                  className="anim-fadeup"
                  style={{
                    border: "1.5px solid var(--border)",
                    borderRadius: 14,
                    overflow: "hidden",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      background: "var(--navy)",
                      padding: "12px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: "oklch(32% 0.04 260)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <IUser />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "white",
                        }}
                      >
                        {group.name}
                      </p>
                      <p style={{ fontSize: 12, color: "oklch(75% 0.01 260)" }}>
                        • {group.items} ítem{group.items !== 1 ? "s" : ""} •
                        Total: ${group.subtotal.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div style={{ background: "white" }}>
                    {group.orders.map((order, oi) => (
                      <div key={oi}>
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            padding: "10px 18px 6px",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {new Date(order.created_at).toLocaleString("es-MX")}
                        </p>
                        {order.order_items.map((item: any, ii: number) => {
                          const cancelled = item.cancelled_quantity || 0;
                          const active = item.quantity - cancelled;
                          const isFullCancelled = active === 0 && cancelled > 0;
                          return (
                            <div
                              key={ii}
                              style={{
                                padding: "12px 18px",
                                borderBottom: "1px solid var(--border)",
                                background: isFullCancelled
                                  ? "oklch(98% 0.03 20)"
                                  : "white",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: 4,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: isFullCancelled
                                        ? "var(--red)"
                                        : "var(--text)",
                                      textDecoration: isFullCancelled
                                        ? "line-through"
                                        : "none",
                                    }}
                                  >
                                    {item.product_name}
                                  </span>
                                  {!isFullCancelled &&
                                    item.status === "ordered" && (
                                      <span
                                        style={{
                                          background: "var(--red-light)",
                                          color: "var(--red)",
                                          fontSize: 10,
                                          fontWeight: 700,
                                          padding: "2px 7px",
                                          borderRadius: 6,
                                        }}
                                      >
                                        ● Ordenado
                                      </span>
                                    )}
                                  {!isFullCancelled &&
                                    item.status === "preparing" && (
                                      <span
                                        style={{
                                          background: "oklch(96% 0.06 70)",
                                          color: "var(--amber)",
                                          fontSize: 10,
                                          fontWeight: 700,
                                          padding: "2px 7px",
                                          borderRadius: 6,
                                        }}
                                      >
                                        ⏳ En preparación
                                      </span>
                                    )}
                                  {!isFullCancelled &&
                                    item.status === "served" && (
                                      <span
                                        style={{
                                          background: "var(--green-light)",
                                          color: "var(--green)",
                                          fontSize: 10,
                                          fontWeight: 700,
                                          padding: "2px 7px",
                                          borderRadius: 6,
                                        }}
                                      >
                                        ✓ Servido
                                      </span>
                                    )}
                                  {isFullCancelled && (
                                    <span
                                      style={{
                                        background: "var(--red-light)",
                                        color: "var(--red)",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: "2px 7px",
                                        borderRadius: 6,
                                      }}
                                    >
                                      Cancelado
                                    </span>
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: isFullCancelled
                                      ? "var(--muted)"
                                      : "var(--text)",
                                  }}
                                >
                                  $
                                  {(
                                    item.price * (isFullCancelled ? 0 : active)
                                  ).toFixed(2)}
                                </span>
                              </div>
                              <p
                                style={{ fontSize: 12, color: "var(--muted)" }}
                              >
                                Cantidad:{" "}
                                {isFullCancelled ? item.quantity : active}
                                {cancelled > 0 &&
                                  !isFullCancelled &&
                                  ` (${cancelled} cancelado${cancelled > 1 ? "s" : ""})`}{" "}
                                • ${item.price.toFixed(2)} c/u
                              </p>
                              {item.notes && (
                                <p
                                  style={{
                                    fontSize: 11,
                                    color: "var(--muted)",
                                    marginTop: 4,
                                  }}
                                >
                                  📝 {item.notes}
                                </p>
                              )}
                            </div>
                          );
                        })}
                        <div
                          style={{
                            padding: "12px 18px",
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--text)",
                            }}
                          >
                            Total de {order.customer_name}:
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "var(--text)",
                            }}
                          >
                            $
                            {order.order_items
                              .reduce((s: number, i: any) => {
                                const c = i.cancelled_quantity || 0;
                                return s + i.price * (i.quantity - c);
                              }, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </main>
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Tab: QR
  // ─────────────────────────────────────────────────────────────────────────
  const renderQRTab = () => {
    const qrUrl = currentUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(currentUrl)}`
      : "";
    return (
      <>
        <header
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "white",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "var(--navy)",
                letterSpacing: "-0.3px",
              }}
            >
              Compartir Mesa
            </p>
            <p style={{ fontSize: 11, color: "var(--muted)" }}>
              Mesa {tableNumber} • {customerName} •{" "}
              <span style={{ color: "var(--green)", fontWeight: 600 }}>
                ● Ocupada
              </span>
            </p>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
          }}
        >
          <div className="anim-fadeup" style={{ width: "100%", maxWidth: 420 }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--text)",
                  letterSpacing: "-0.4px",
                  marginBottom: 8,
                }}
              >
                Invita a tu Mesa
              </h2>
              <p
                style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}
              >
                Comparte este código QR con tus acompañantes para unirse a la
                misma orden
              </p>
            </div>

            <div
              style={{
                border: "1.5px solid var(--border)",
                borderRadius: 16,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  padding: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "white",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 220,
                    height: 220,
                    borderRadius: 8,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                  }}
                >
                  {qrUrl ? (
                    <img
                      src={qrUrl}
                      alt="QR Mesa"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--surface)",
                        color: "var(--muted)",
                        fontSize: 12,
                      }}
                    >
                      Generando QR…
                    </div>
                  )}
                  {/* Center logo overlay */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%,-50%)",
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      background: "white",
                      border: "2px solid white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                      overflow: "hidden",
                    }}
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: 16 }}>🍽️</span>
                    )}
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "var(--surface)",
                  padding: "12px 20px",
                  borderTop: "1px solid var(--border)",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: "var(--navy)",
                  }}
                >
                  Mesa: {tableNumber}
                </p>
                <p
                  style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}
                >
                  Escanea para unirte a la orden
                </p>
              </div>
            </div>

            <button
              onClick={handleShare}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "none",
                background: "var(--accent)",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                marginBottom: 16,
                color: "white",
                transition: "background 0.15s",
              }}
            >
              <IShare /> Compartir Mesa
            </button>

            <div style={{ marginBottom: 8 }}>
              <p
                style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}
              >
                Enlace de la mesa:
              </p>
              <div
                style={{
                  display: "flex",
                  border: "1.5px solid var(--border)",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                <input
                  readOnly
                  value={currentUrl}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    border: "none",
                    background: "var(--surface)",
                    fontSize: 13,
                    color: "var(--text)",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: "10px 16px",
                    background: copied
                      ? "var(--green-light)"
                      : "var(--surface)",
                    border: "none",
                    borderLeft: "1.5px solid var(--border)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                    color: copied ? "var(--green)" : "var(--muted)",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all 0.15s",
                  }}
                >
                  {copied ? (
                    <>
                      <ICheck s={12} /> Copiado
                    </>
                  ) : (
                    <>
                      <ICopy /> Copiar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Notes/Extras Modal (full existing logic, new design)
  // ─────────────────────────────────────────────────────────────────────────
  const renderNotesModal = () => {
    if (!showNotesModal || !selectedProduct) return null;
    return (
      <ProductModal
        product={selectedProduct}
        onClose={() => {
          setShowNotesModal(false);
          resetExtras();
        }}
        onAdd={handleConfirmAdd}
        adding={addingProduct === selectedProduct.id}
      />
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Root render
  // ─────────────────────────────────────────────────────────────────────────
  const navItems = [
    { id: "menu", label: "Menú", icon: <IMenu /> },
    {
      id: "cuenta",
      label: "Cuenta",
      icon: <span style={{ fontSize: 18 }}>↩</span>,
    },
    { id: "qr", label: "Mi QR", icon: <IQR /> },
  ] as const;

  return (
    <div className="menu-root">
      <style>{DESIGN_CSS}</style>

      {/* Tab content */}
      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activeTab === "menu" && renderMenuTab()}
        {activeTab === "cuenta" && renderCuentaTab()}
        {activeTab === "qr" && renderQRTab()}
      </div>

      {/* Bottom nav */}
      <nav
        style={{
          display: "flex",
          borderTop: "1px solid var(--border)",
          background: "white",
          flexShrink: 0,
        }}
      >
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                flex: 1,
                padding: "11px 0 8px",
                border: "none",
                background: "none",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: active ? "var(--navy)" : "var(--muted)",
                fontFamily: "inherit",
                transition: "color 0.15s",
              }}
            >
              {item.icon}
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>
                {item.label}
              </span>
              {active && (
                <div
                  style={{
                    width: 18,
                    height: 2,
                    borderRadius: 1,
                    background: "var(--navy)",
                  }}
                ></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      {renderNotesModal()}

      {showCart && (
        <CartDrawer
          items={orderItems}
          customerName={customerName || ""}
          orderId={currentOrder?.id}
          onClose={() => setShowCart(false)}
          onQty={(id, qty) => {
            if (qty < 1) removeFromCart(id);
            else updateCartItem(id, qty);
          }}
          onRemove={(id) => removeFromCart(id)}
          onSend={handleSendOrder}
          sending={sendingOrder}
        />
      )}

      {showBillModal && (
        <CuentaModal
          onClose={() => setShowBillModal(false)}
          onConfirm={handleBillConfirm}
          loading={billLoading}
        />
      )}

      {alertMessage && (
        <CustomAlert
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
        />
      )}
    </div>
  );
}
