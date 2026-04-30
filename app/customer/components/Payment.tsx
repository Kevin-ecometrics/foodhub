/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import { useOrder } from "@/app/context/OrderContext";
import { historyService, OrderWithItems } from "@/app/lib/supabase/history";
import { supabase } from "@/app/lib/supabase/client";
import axios from "axios";

// ─── Design CSS ──────────────────────────────────────────────────────────────
const DESIGN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  .pay-root {
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
    --blue:         oklch(52% 0.18 260);
    --blue-light:   oklch(95% 0.05 260);
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: white;
    min-height: 100vh;
  }
  .pay-root * { box-sizing: border-box; }
  @keyframes pay-fadeup  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pay-fadein  { from{opacity:0} to{opacity:1} }
  @keyframes pay-scalein { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
  @keyframes pay-spin    { to{transform:rotate(360deg)} }
  @keyframes pay-pulse   { 0%,100%{box-shadow:0 0 0 0 oklch(52% 0.16 145 / 0.35)} 60%{box-shadow:0 0 0 12px oklch(52% 0.16 145 / 0)} }
  .pay-root .pay-btn-cta { transition:background 0.18s,transform 0.12s,box-shadow 0.18s; }
  .pay-root .pay-btn-cta:hover { filter:brightness(0.92); transform:translateY(-1px); }
  .pay-root ::-webkit-scrollbar { width:4px; }
  .pay-root ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
`;

// ─── Icons ───────────────────────────────────────────────────────────────────
const IQR = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
    <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
    <path d="M14 14h3v3"/><path d="M21 14v.01"/><path d="M21 21v-4"/><path d="M14 21h7"/>
  </svg>
);
const IUser = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const ICheck = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IRefresh = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IClose = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IStar = ({ filled }: { filled: boolean }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill={filled ? "oklch(72% 0.16 70)" : "none"} stroke={filled ? "oklch(72% 0.16 70)" : "oklch(80% 0.01 260)"} strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const IInvoice = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
);
const IEnvelope = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────
interface PaymentSummary {
  subtotal: number; taxAmount: number; total: number;
  taxRate: number; cancelledAmount: number; cancelledUnitsCount: number;
}
interface CustomerOrderSummary {
  customerName: string; orders: OrderWithItems[];
  subtotal: number; taxAmount: number; total: number; itemsCount: number;
  cancelledItemsCount: number; cancelledUnitsCount: number; cancelledAmount: number;
}
interface InvoiceModalProps {
  isOpen: boolean; onClose: () => void; onConfirm: (email: string) => void; isLoading: boolean;
}

// ─── Helpers (logic unchanged) ────────────────────────────────────────────────
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(amount);

const formatItemNotes = (notes: string | null) => {
  if (!notes) return null;
  const hasPricedExtras = notes.includes("(+$");
  if (hasPricedExtras) {
    const parts = notes.split(" | ");
    const mainNotes = parts.find(p => !p.includes("Extras:") && !p.includes("Total:"));
    const extrasPart = parts.find(p => p.includes("Extras:"));
    const totalPart = parts.find(p => p.includes("Total:"));
    return (
      <div style={{ marginTop:8,padding:"8px 10px",background:"var(--surface)",borderRadius:8,border:"1px solid var(--border)",fontSize:11 }}>
        {mainNotes && <p style={{ color:"var(--text)",margin:0,marginBottom:4 }}>📝 <strong>Instrucciones:</strong> {mainNotes}</p>}
        {extrasPart && (
          <div>
            <p style={{ color:"var(--green)",margin:0,marginBottom:2,fontWeight:600 }}>🟢 Extras:</p>
            {extrasPart.replace("Extras: ","").split(", ").map((extra, i) => (
              <div key={i} style={{ display:"flex",justifyContent:"space-between",color:"var(--green)",marginLeft:8 }}>
                <span>• {extra.split(" (+$")[0]}</span>
                <span>{extra.match(/\(\+\$([^)]+)\)/)?.[1] || ""}</span>
              </div>
            ))}
          </div>
        )}
        {totalPart && <p style={{ color:"var(--blue)",fontWeight:600,margin:0,marginTop:4,borderTop:"1px solid var(--border)",paddingTop:4 }}>{totalPart}</p>}
      </div>
    );
  }
  if (notes.includes("Extras:")) {
    const parts = notes.split(" | ");
    let mainNotes = ""; let extrasText = "";
    parts.forEach(p => { if (p.startsWith("Extras:")) extrasText = p.replace("Extras: ",""); else mainNotes = p; });
    return (
      <div style={{ marginTop:6,padding:"6px 10px",background:"var(--surface)",borderRadius:8,fontSize:11 }}>
        {mainNotes && <p style={{ color:"var(--text)",margin:0 }}>📝 <strong>Nota:</strong> {mainNotes}</p>}
        {extrasText && <p style={{ color:"var(--green)",margin:0,marginTop:4 }}>🟢 <strong>Extras:</strong> {extrasText}</p>}
      </div>
    );
  }
  return (
    <div style={{ marginTop:6,padding:"6px 10px",background:"oklch(98% 0.04 80)",borderRadius:8,fontSize:11,border:"1px solid oklch(88% 0.05 80)" }}>
      <p style={{ color:"oklch(48% 0.10 60)",margin:0 }}>📝 <strong>Nota:</strong> {notes}</p>
    </div>
  );
};

const formatNotesForPDF = (notes: string) => {
  if (!notes) return "";
  const hasPricedExtras = notes.includes("(+$");
  if (hasPricedExtras) {
    const parts = notes.split(" | ");
    const mainNotes = parts.find(p => !p.includes("Extras:") && !p.includes("Total:"));
    const extrasPart = parts.find(p => p.includes("Extras:"));
    const totalPart = parts.find(p => p.includes("Total:"));
    let result = "";
    if (mainNotes) result += `<div class="notes-main"><strong>Instrucciones:</strong> ${mainNotes}</div>`;
    if (extrasPart) {
      result += `<div class="extras-section"><strong>Extras:</strong>`;
      extrasPart.replace("Extras: ","").split(", ").forEach(extra => {
        const extraName = extra.split(" (+$")[0];
        const extraPrice = extra.match(/\(\+\$([^)]+)\)/)?.[1] || "";
        result += `<div class="extra-item">• ${extraName} +${extraPrice}</div>`;
      });
      result += `</div>`;
    }
    if (totalPart) result += `<div style="margin-top:5px;font-weight:bold;color:#1e40af;">${totalPart}</div>`;
    return result;
  }
  if (notes.includes("Extras:")) {
    const parts = notes.split(" | "); let mainNotes = ""; let extrasText = "";
    parts.forEach(p => { if (p.startsWith("Extras:")) extrasText = p.replace("Extras: ",""); else mainNotes = p; });
    let result = "";
    if (mainNotes) result += `<div class="notes-main"><strong>Nota:</strong> ${mainNotes}</div>`;
    if (extrasText) result += `<div class="extras-section"><strong>Extras:</strong> ${extrasText}</div>`;
    return result;
  }
  return `<div class="notes-main"><strong>Nota:</strong> ${notes}</div>`;
};

const renderOrderItem = (item: any) => {
  const cancelledQty = item.cancelled_quantity || 0;
  const activeQuantity = item.quantity - cancelledQty;
  const isCancelled = activeQuantity === 0;
  const isPartiallyCancelled = cancelledQty > 0 && activeQuantity > 0;

  return (
    <div key={item.id} style={{ padding:"12px 18px",borderBottom:"1px solid var(--border)",background:isCancelled?"oklch(98% 0.03 20)":"white" }}>
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:4 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:3 }}>
            <span style={{ fontSize:14,fontWeight:600,color:isCancelled?"var(--red)":"var(--text)",textDecoration:isCancelled?"line-through":"none" }}>
              {item.product_name}
            </span>
            {isCancelled && <span style={{ background:"var(--red-light)",color:"var(--red)",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6 }}>Completamente Cancelado</span>}
            {isPartiallyCancelled && <span style={{ background:"var(--amber-light)",color:"var(--amber)",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6 }}>Parcialmente Cancelado</span>}
          </div>
          <p style={{ fontSize:12,color:"var(--muted)",margin:0 }}>
            Cantidad activa: <strong>{activeQuantity}</strong>
            {cancelledQty > 0 && <span style={{ color:"var(--red)",textDecoration:"line-through",marginLeft:4 }}>(de {item.quantity})</span>}
            {" "}• {formatCurrency(item.price)} c/u
          </p>
          {cancelledQty > 0 && <p style={{ fontSize:11,color:"var(--red)",margin:0,marginTop:2 }}>{cancelledQty} unidad(es) cancelada(s)</p>}
          {formatItemNotes(item.notes)}
        </div>
        <div style={{ textAlign:"right",marginLeft:16,flexShrink:0 }}>
          <p style={{ fontSize:14,fontWeight:700,color:isCancelled?"var(--muted)":"var(--text)",textDecoration:isCancelled?"line-through":"none",margin:0 }}>
            {formatCurrency(item.price * activeQuantity)}
          </p>
          {cancelledQty > 0 && <p style={{ fontSize:11,color:"var(--red)",margin:0,marginTop:2 }}>Cancelado: {formatCurrency(item.price * cancelledQty)}</p>}
          {(isCancelled || isPartiallyCancelled) && <p style={{ fontSize:10,color:"var(--red)",fontWeight:700,margin:0,marginTop:4 }}>No se cobrará</p>}
        </div>
      </div>
    </div>
  );
};

// ─── SatisfactionSurvey ───────────────────────────────────────────────────────
const SatisfactionSurvey = ({ onSubmit, onSkip, customerName }: {
  onSubmit: (rating: number, comment: string) => void;
  onSkip: () => void;
  customerName: string;
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hovered, setHovered] = useState(0);

  const LABELS = ["","Muy mala","Mala","Regular","Buena","Excelente"];

  return (
    <div style={{ border:"1.5px solid var(--border)",borderRadius:18,padding:"28px 24px",maxWidth:480,width:"100%",margin:"0 auto",background:"white",animation:"pay-fadeup 0.4s ease both" }}>
      <div style={{ textAlign:"center",marginBottom:24 }}>
        <div style={{ width:56,height:56,borderRadius:"50%",background:"var(--amber-light)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28 }}>⭐</div>
        <h3 style={{ fontSize:20,fontWeight:800,color:"var(--text)",marginBottom:6 }}>¡Cuéntanos tu experiencia!</h3>
        <p style={{ fontSize:13,color:"var(--muted)" }}>¿Cómo calificarías tu experiencia hoy?</p>
      </div>

      {/* Stars */}
      <div style={{ display:"flex",justifyContent:"center",gap:8,marginBottom:8 }}>
        {[1,2,3,4,5].map(star => (
          <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(0)}
            style={{ background:"none",border:"none",cursor:"pointer",padding:4,transition:"transform 0.12s" }}
            onMouseDown={e => (e.currentTarget.style.transform="scale(0.9)")}
            onMouseUp={e => (e.currentTarget.style.transform="scale(1.1)")}
          >
            <IStar filled={star <= (hovered || rating)} />
          </button>
        ))}
      </div>
      <p style={{ textAlign:"center",fontSize:13,color:"var(--muted)",marginBottom:20,minHeight:20 }}>
        {rating > 0 ? LABELS[rating] : "Selecciona una calificación"}
      </p>

      {/* Comment */}
      <div style={{ marginBottom:20 }}>
        <label style={{ fontSize:13,fontWeight:600,color:"var(--text)",display:"block",marginBottom:8 }}>Comentario (opcional)</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          placeholder="¿Algo que nos quieras contar sobre tu experiencia?"
          rows={3}
          style={{ width:"100%",border:"1.5px solid var(--border)",borderRadius:10,padding:"12px 14px",fontSize:13,fontFamily:"inherit",resize:"none",color:"var(--text)",background:"var(--surface)",outline:"none",transition:"border-color 0.15s" }}
          onFocus={e => e.target.style.borderColor="var(--accent)"}
          onBlur={e => e.target.style.borderColor="var(--border)"}
        />
      </div>

      <div style={{ display:"flex",gap:12 }}>
        <button onClick={onSkip} style={{ flex:1,padding:"12px",borderRadius:11,border:"1.5px solid var(--border)",background:"var(--surface)",fontSize:14,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit" }}>
          Omitir
        </button>
        <button onClick={() => { if (rating > 0) onSubmit(rating, comment); }} disabled={rating === 0}
          style={{ flex:1,padding:"12px",borderRadius:11,border:"none",background:rating===0?"var(--border)":"var(--accent)",fontSize:14,fontWeight:700,color:"white",cursor:rating===0?"not-allowed":"pointer",fontFamily:"inherit",opacity:rating===0?0.6:1,transition:"background 0.15s" }}
        >
          Enviar Encuesta
        </button>
      </div>
    </div>
  );
};

// ─── Invoice Modal ────────────────────────────────────────────────────────────
const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [focused, setFocused] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setEmailError("El correo electrónico es requerido"); return; }
    if (!validateEmail(email)) { setEmailError("Por favor ingresa un correo electrónico válido"); return; }
    setEmailError(""); onConfirm(email);
  };

  const handleClose = () => { setEmail(""); setEmailError(""); onClose(); };

  if (!isOpen) return null;

  return (
    <div onClick={handleClose} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16,animation:"pay-fadein 0.2s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background:"white",borderRadius:18,width:"100%",maxWidth:420,boxShadow:"0 24px 64px rgba(0,0,0,0.18)",animation:"pay-scalein 0.22s ease",overflow:"hidden" }}>
        {/* Header */}
        <div style={{ padding:"18px 22px 14px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12 }}>
            <div style={{ width:36,height:36,borderRadius:10,background:"oklch(94% 0.04 300)",display:"flex",alignItems:"center",justifyContent:"center",color:"oklch(52% 0.18 300)" }}>
              <IInvoice />
            </div>
            <div>
              <p style={{ fontSize:16,fontWeight:800,color:"var(--text)",margin:0 }}>Solicitar Factura</p>
              <p style={{ fontSize:12,color:"var(--muted)",margin:0,marginTop:2 }}>Ingresa tu correo electrónico</p>
            </div>
          </div>
          <button onClick={handleClose} disabled={isLoading} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--muted)",padding:4 }}><IClose /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding:"20px 22px 24px" }}>
          <label style={{ fontSize:13,fontWeight:600,color:"var(--text)",display:"block",marginBottom:8 }}>Correo Electrónico</label>
          <div style={{ display:"flex",alignItems:"center",gap:10,border:`1.5px solid ${emailError?"var(--red)":focused?"var(--accent)":"var(--border)"}`,borderRadius:10,padding:"11px 14px",background:focused?"white":"var(--surface)",transition:"all 0.15s",boxShadow:focused?"0 0 0 4px var(--accent-light)":"none",marginBottom:emailError?6:16 }}>
            <span style={{ color:"var(--muted)",flexShrink:0 }}><IEnvelope /></span>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
              placeholder="tu@correo.com" disabled={isLoading}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,fontFamily:"inherit",color:"var(--text)" }} />
          </div>
          {emailError && <p style={{ fontSize:12,color:"var(--red)",marginBottom:12 }}>⚠ {emailError}</p>}

          <div style={{ background:"var(--blue-light)",borderRadius:10,padding:"12px 14px",marginBottom:20 }}>
            <p style={{ fontSize:12,color:"var(--blue)",margin:0 }}>📧 Te enviaremos un correo con los pasos para completar tu facturación y los datos fiscales requeridos.</p>
          </div>

          <div style={{ display:"flex",gap:12 }}>
            <button type="button" onClick={handleClose} disabled={isLoading} style={{ flex:1,padding:12,borderRadius:10,border:"1.5px solid var(--border)",background:"var(--surface)",fontSize:13,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit",opacity:isLoading?0.5:1 }}>
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} style={{ flex:1,padding:12,borderRadius:10,border:"none",background:"oklch(52% 0.18 300)",fontSize:13,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:isLoading?0.7:1 }}>
              {isLoading ? <span style={{ animation:"pay-spin 0.9s linear infinite",display:"inline-block" }}>↻</span> : <IInvoice />}
              {isLoading ? "Enviando..." : "Solicitar Factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── PaymentPage ──────────────────────────────────────────────────────────────
export default function PaymentPage() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSession();
  const { currentTableId, notificationState, createBillNotification, refreshOrder } = useOrder();

  const tableNumber = session?.tableNumber;
  const tableId = session?.tableId;
  const userId = session?.userId;
  const orderId = session?.orderId;

  useEffect(() => { if (tableId && !currentTableId) refreshOrder(parseInt(tableId)); }, [tableId, currentTableId, refreshOrder]);

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ status: "pending" });
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;
    try {
      setLoading(true); setError("");
      const orders = await historyService.getCustomerOrderHistory(parseInt(targetTableId.toString()));
      const pendingOrders = orders.filter(o => o.status === "active" || o.status === "sent");
      const processedOrders = pendingOrders.map(order => ({
        ...order,
        order_items: order.order_items.map(item => ({
          ...item, cancelled_quantity: item.cancelled_quantity || 0,
          ...(item.status === "cancelled" && !item.cancelled_quantity && { cancelled_quantity: item.quantity }),
        })),
      }));
      setAllOrders(processedOrders);
      if (processedOrders.length === 0) setError("No hay órdenes pendientes de pago");
    } catch (e) { console.error(e); setError("Error cargando las órdenes para pago"); }
    finally { setLoading(false); }
  };

  const saveSurveyToDatabase = async (rating: number, comment: string) => {
    try {
      const { error } = await supabase.from("customer_feedback").insert([{
        table_id: tableId || currentTableId,
        customer_name: customerSummaries[0]?.customerName || "Cliente",
        rating, comment: comment || null,
        order_count: allOrders.length, total_amount: paymentSummary.total,
        created_at: new Date().toISOString(),
      }] as never);
      if (error) throw error;
      return true;
    } catch (e) { console.error(e); return false; }
  };

  useEffect(() => {
    const loadAllOrders = async () => {
      const targetTableId = tableId || currentTableId;
      if (!targetTableId) return;
      try {
        setLoading(true); setError("");
        const orders = await historyService.getCustomerOrderHistory(parseInt(targetTableId.toString()));
        const pendingOrders = orders.filter(o => o.status === "active" || o.status === "sent");
        const processedOrders = pendingOrders.map(order => ({
          ...order,
          order_items: order.order_items.map(item => ({
            ...item, cancelled_quantity: item.cancelled_quantity || 0,
            ...(item.status === "cancelled" && !item.cancelled_quantity && { cancelled_quantity: item.quantity }),
          })),
        }));
        setAllOrders(processedOrders);
        if (processedOrders.length === 0) setError("No hay órdenes pendientes de pago");
      } catch (e) { console.error(e); setError("Error cargando las órdenes para pago"); }
      finally { setLoading(false); }
    };
    if (tableId !== null || currentTableId) loadAllOrders();
  }, [tableId, currentTableId]);

  const groupOrdersByCustomer = (): CustomerOrderSummary[] => {
    const customerMap = new Map<string, CustomerOrderSummary>();
    allOrders.forEach(order => {
      const customerName = order.customer_name || "Cliente";
      if (!customerMap.has(customerName)) customerMap.set(customerName, { customerName, orders: [], subtotal: 0, taxAmount: 0, total: 0, itemsCount: 0, cancelledItemsCount: 0, cancelledUnitsCount: 0, cancelledAmount: 0 });
      const cs = customerMap.get(customerName)!;
      cs.orders.push(order);
      const calc = order.order_items.reduce((acc, item) => {
        const cancelledQty = item.cancelled_quantity || 0;
        const activeQty = item.quantity - cancelledQty;
        if (activeQty === 0) acc.cancelledItemsCount++;
        acc.cancelledUnitsCount += cancelledQty;
        acc.totalAmount += item.price * activeQty;
        acc.cancelledAmount += item.price * cancelledQty;
        return acc;
      }, { cancelledItemsCount: 0, cancelledUnitsCount: 0, totalAmount: 0, cancelledAmount: 0 });
      const taxRate = 0.08;
      cs.total += calc.totalAmount;
      cs.subtotal = cs.total / (1 + taxRate);
      cs.taxAmount = cs.total - cs.subtotal;
      cs.cancelledItemsCount += calc.cancelledItemsCount;
      cs.cancelledUnitsCount += calc.cancelledUnitsCount;
      cs.cancelledAmount += calc.cancelledAmount;
      cs.itemsCount += order.order_items.filter(i => i.quantity - (i.cancelled_quantity || 0) > 0).length;
    });
    return Array.from(customerMap.values());
  };

  const calculateTotalPaymentSummary = (): PaymentSummary => {
    let total = 0; let cancelledAmount = 0; let cancelledUnitsCount = 0;
    allOrders.forEach(order => {
      order.order_items.forEach(item => {
        const cancelledQty = item.cancelled_quantity || 0;
        const activeQty = item.quantity - cancelledQty;
        total += item.price * activeQty;
        cancelledAmount += item.price * cancelledQty;
        cancelledUnitsCount += cancelledQty;
      });
    });
    const taxRate = 0.08;
    const subtotal = total / (1 + taxRate);
    const taxAmount = total - subtotal;
    return { subtotal, taxAmount, total, taxRate, cancelledAmount, cancelledUnitsCount };
  };

  const customerSummaries = groupOrdersByCustomer();
  const paymentSummary = calculateTotalPaymentSummary();
  const mesaCancelledAmount = customerSummaries.reduce((t, c) => t + c.cancelledAmount, 0);
  const mesaCancelledUnits = customerSummaries.reduce((t, c) => t + c.cancelledUnitsCount, 0);

  // Realtime subscriptions (logic unchanged)
  useEffect(() => {
    const tid = tableId || currentTableId;
    if (!tid) return;
    const sub = supabase.channel(`table-${tid}-orders`)
      .on("postgres_changes", { event:"*", schema:"public", table:"orders", filter:`table_id=eq.${tid}` }, () => loadOrders())
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [tableId, currentTableId]);

  useEffect(() => {
    const tid = tableId || currentTableId;
    if (!tid) return;
    const sub = supabase.channel(`table-${tid}-payments`)
      .on("postgres_changes", { event:"*", schema:"public", table:"waiter_notifications", filter:`table_id=eq.${tid}` }, payload => {
        if (payload.eventType === "UPDATE") {
          const { status: newStatus, type: notifType } = payload.new;
          if (notifType === "bill_request") {
            if (newStatus === "completed") { setPaymentStatus({ status:"verified" }); setPaymentConfirmed(true); setShowSurvey(true); }
            else if (newStatus === "cancelled") setPaymentStatus({ status:"pending" });
          }
        }
      }).subscribe();
    return () => { sub.unsubscribe(); };
  }, [tableId, currentTableId]);

  useEffect(() => {
    const tid = tableId || currentTableId;
    if (!tid) return;
    const interval = setInterval(async () => {
      try {
        if (notificationState.hasPendingBill) {
          const { data: notifications, error } = await supabase
            .from("waiter_notifications").select("*")
            .eq("table_id", tid).eq("type","bill_request").in("status",["completed","cancelled"])
            .order("created_at",{ascending:false}).limit(1);
          if (!error && notifications && notifications.length > 0) {
            const latest = notifications[0] as any;
            if (latest.status === "completed" && !paymentConfirmed) { setPaymentStatus({ status:"verified" }); setPaymentConfirmed(true); setShowSurvey(true); }
            else if (latest.status === "cancelled") setPaymentStatus({ status:"pending" });
          }
        }
      } catch (e) { console.error(e); }
    }, 5000);
    return () => clearInterval(interval);
  }, [tableId, currentTableId, notificationState.hasPendingBill, paymentConfirmed]);

  const handleSurveySubmit = async (rating: number, comment: string) => {
    try { await saveSurveyToDatabase(rating, comment); } catch (e) { console.error(e); }
    setSurveyCompleted(true); setShowSurvey(false);
  };
  const handleSurveySkip = () => { setSurveyCompleted(true); setShowSurvey(false); };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPdf(true);
      const pdfContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket - Mesa ${tableNumber||tableId||currentTableId}</title><style>body{font-family:Arial,sans-serif;margin:20px;color:#333}.header{text-align:center;background:#1f2937;color:white;padding:20px;margin-bottom:20px}.restaurant-name{font-size:24px;font-weight:bold;margin-bottom:5px}.table-info{font-size:14px;color:#d1d5db}.customer-section{margin-bottom:25px;border-bottom:1px solid #e5e7eb;padding-bottom:15px}.customer-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:15px}.customer-name{font-size:18px;font-weight:bold;color:#1f2937}.item-row{display:flex;justify-content:space-between;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #f3f4f6}.item-name{font-weight:500}.item-details{font-size:12px;color:#6b7280;margin-top:2px}.notes-section{background:#f9fafb;padding:8px;border-radius:4px;margin-top:5px;font-size:11px}.notes-main{color:#92400e;margin-bottom:4px}.extras-section{color:#065f46;margin-top:4px}.extra-item{display:flex;justify-content:space-between;margin-bottom:2px}.summary-row{display:flex;justify-content:space-between;margin-bottom:5px}.final-total{border-top:2px solid #1f2937;padding-top:15px;margin-top:20px}.total-row{display:flex;justify-content:space-between;font-size:18px;font-weight:bold}.footer{text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px}</style></head><body><div class="header"><div class="restaurant-name">RESTAURANTE</div><div class="table-info">Mesa ${tableNumber||tableId||currentTableId}</div><div class="table-info">${new Date().toLocaleString("es-MX")}</div></div>${mesaCancelledUnits>0?`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:10px;margin:10px 0;font-size:12px;color:#dc2626;"><strong>Nota:</strong> Se excluyen ${mesaCancelledUnits} unidad(es) cancelada(s) por un total de ${formatCurrency(mesaCancelledAmount)}</div>`:``}${customerSummaries.map(cs=>`<div class="customer-section"><div class="customer-header"><div class="customer-name">${cs.customerName}</div><div style="font-size:16px;font-weight:bold;">${formatCurrency(cs.total)}</div></div>${cs.orders.map(order=>`${order.order_items.map(item=>{const cq=item.cancelled_quantity||0;const aq=item.quantity-cq;return`<div class="item-row"><div><div class="item-name">${item.product_name}${aq===0?` (CANCELADO)`:``}</div><div class="item-details">Cant: ${aq}${cq>0?` (de ${item.quantity}, ${cq} cancelada(s))`:``} • ${formatCurrency(item.price)} c/u${item.notes?`<div class="notes-section">${formatNotesForPDF(item.notes)}</div>`:``}</div></div><div>${formatCurrency(item.price*aq)}</div></div>`;}).join("")}`).join("")}<div style="background:#f8fafc;padding:10px;border-radius:6px;margin-top:10px;"><div class="summary-row"><span>Subtotal:</span><span>${formatCurrency(cs.subtotal)}</span></div><div class="summary-row"><span>IVA (8%):</span><span>${formatCurrency(cs.taxAmount)}</span></div><div class="summary-row" style="font-weight:bold;border-top:1px solid #e2e8f0;padding-top:5px;"><span>Total:</span><span>${formatCurrency(cs.total)}</span></div></div></div>`).join("")}<div class="final-total"><div class="summary-row"><span>Subtotal total:</span><span>${formatCurrency(paymentSummary.subtotal)}</span></div><div class="summary-row"><span>Impuestos (8%):</span><span>${formatCurrency(paymentSummary.taxAmount)}</span></div><div class="total-row"><span>TOTAL GENERAL:</span><span>${formatCurrency(paymentSummary.total)}</span></div></div><div class="footer"><p style="font-weight:bold;margin-bottom:5px;">¡Gracias por su preferencia!</p></div></body></html>`;
      const printWindow = window.open("","_blank");
      if (printWindow) { printWindow.document.write(pdfContent); printWindow.document.close(); printWindow.onload = () => printWindow.print(); }
    } catch (e) { console.error(e); alert("Error al generar el PDF. Intente nuevamente."); }
    finally { setGeneratingPdf(false); }
  };

  const handleInvoiceRequest = async (email: string) => {
    try {
      setGeneratingInvoice(true);
      const invoiceData = {
        tableId: tableId || currentTableId, tableNumber, customerEmail: email,
        customerSummaries: customerSummaries.map(s => ({ customerName:s.customerName, subtotal:s.subtotal, taxAmount:s.taxAmount, total:s.total, itemsCount:s.itemsCount, cancelledItemsCount:s.cancelledItemsCount, cancelledUnitsCount:s.cancelledUnitsCount, cancelledAmount:s.cancelledAmount })),
        paymentSummary: { subtotal:paymentSummary.subtotal, taxAmount:paymentSummary.taxAmount, total:paymentSummary.total, cancelledAmount:paymentSummary.cancelledAmount, cancelledUnitsCount:paymentSummary.cancelledUnitsCount },
        orders: allOrders.map(o => ({ id:o.id, customerName:o.customer_name, items:o.order_items.map(i => ({ productName:i.product_name, quantity:i.quantity, price:i.price, notes:i.notes, cancelled_quantity:i.cancelled_quantity||0, activeQuantity:i.quantity-(i.cancelled_quantity||0) })) })),
        timestamp: new Date().toISOString(),
      };
      const response = await axios.post("https://e-commetrics.com/api/invoice", invoiceData, { headers:{"Content-Type":"application/json"}, timeout:10000 });
      if (response.data.success) { alert("✅ Solicitud de factura enviada correctamente. Recibirá un correo con los pasos para completar la facturación."); setIsInvoiceModalOpen(false); }
      else throw new Error(response.data.message || "Error al procesar la factura");
    } catch (e) {
      console.error(e);
      if (axios.isAxiosError(e)) {
        if (e.response) alert(`❌ Error al solicitar la factura: ${e.response.data?.message || "Error del servidor"}`);
        else if (e.request) alert("❌ Error de conexión. No se pudo contactar al servidor.");
        else alert("❌ Error en la solicitud de factura.");
      } else { alert("❌ Error al solicitar la factura. Por favor, intente nuevamente o contacte al personal."); }
    } finally { setGeneratingInvoice(false); }
  };

  const handlePaymentConfirmation = async () => {
    try {
      setPaymentConfirmed(true); setShowSurvey(true);
      const keysToRemove = ["GDPR_REMOVAL_FLAG","app_session","currentOrder","currentOrderId","currentTableId","currentUserId","currentUserName","customerSession","historyUserData","orderItems","photoSphereViewer_touchSupport","restaurant_tableId","restaurant_userId","restaurant_userName",...Object.keys(localStorage).filter(k => k.startsWith("paymentState_")||k.startsWith("paymentStatus_")||k.startsWith("pendingItems_")||k.startsWith("currentOrder-table-")||k.startsWith("currentUser-table-")),"session","session-tableId","session-userId","session-orderId","session-customerName","session-tableNumber","sessionCleanupTimer","sessionExpiryTime"];
      [...new Set(keysToRemove)].forEach(k => { if (localStorage.getItem(k) !== null) localStorage.removeItem(k); });
    } catch (e) { console.error(e); alert("❌ Error al confirmar el pago. Intenta nuevamente."); }
  };

  // ─── Loading screens (new design) ─────────────────────────────────────────
  const LoadingScreen = ({ label }: { label: string }) => (
    <div className="pay-root" style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh" }}>
      <style>{DESIGN_CSS}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:48,height:48,borderRadius:14,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px" }}>
          <span style={{ animation:"pay-spin 0.9s linear infinite",display:"flex" }}><IRefresh /></span>
        </div>
        <p style={{ color:"var(--muted)",fontSize:14 }}>{label}</p>
      </div>
    </div>
  );

  if (sessionLoading) return <LoadingScreen label="Verificando información de la mesa…" />;

  if (!session || !tableNumber) return (
    <div className="pay-root" style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24 }}>
      <style>{DESIGN_CSS}</style>
      <div style={{ textAlign:"center",maxWidth:380 }}>
        <div style={{ width:64,height:64,borderRadius:18,background:"var(--amber-light)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:28 }}>⚠️</div>
        <h2 style={{ fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:8 }}>Sesión no encontrada</h2>
        <p style={{ color:"var(--muted)",marginBottom:24,lineHeight:1.6 }}>No se pudo identificar la mesa. Por favor, regresa al menú principal.</p>
        <button onClick={() => router.push("/customer")} style={{ width:"100%",padding:14,borderRadius:12,border:"none",background:"var(--accent)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Volver al Inicio</button>
      </div>
    </div>
  );

  if (loading) return <LoadingScreen label="Cargando ticket de pago…" />;

  if (error || allOrders.length === 0) return (
    <div className="pay-root" style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24 }}>
      <style>{DESIGN_CSS}</style>
      <div style={{ textAlign:"center",maxWidth:380 }}>
        <div style={{ width:64,height:64,borderRadius:18,background:"var(--amber-light)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:28 }}>🧾</div>
        <h2 style={{ fontSize:22,fontWeight:800,color:"var(--text)",marginBottom:8 }}>{error || "No hay órdenes para pagar"}</h2>
        <p style={{ color:"var(--muted)",marginBottom:24,lineHeight:1.6 }}>No hay órdenes pendientes de pago en esta mesa.</p>
        <button onClick={() => router.push("/customer/menu")} style={{ width:"100%",padding:14,borderRadius:12,border:"none",background:"var(--accent)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Volver al Menú</button>
      </div>
    </div>
  );

  // ─── Payment confirmed + survey ────────────────────────────────────────────
  if (paymentConfirmed) return (
    <div className="pay-root" style={{ display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24,background:"white" }}>
      <style>{DESIGN_CSS}</style>
      <div style={{ maxWidth:480,width:"100%",display:"flex",flexDirection:"column",gap:20 }}>
        {/* Success card */}
        <div style={{ border:"1.5px solid var(--border)",borderRadius:18,padding:"32px 28px",textAlign:"center",animation:"pay-fadeup 0.4s ease both" }}>
          <div style={{ width:64,height:64,borderRadius:"50%",background:"var(--green-light)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"pay-pulse 2.4s ease infinite",color:"var(--green)" }}>
            <ICheck s={28} />
          </div>
          <h2 style={{ fontSize:26,fontWeight:800,color:"var(--text)",marginBottom:8 }}>¡Pago Confirmado!</h2>
          <p style={{ color:"var(--muted)",marginBottom:24,lineHeight:1.6 }}>Gracias por su preferencia. ¡Esperamos verle pronto!</p>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
            {[["Comensales",customerSummaries.length],["Órdenes",allOrders.length],["Total",formatCurrency(paymentSummary.total)]].map(([label,val]) => (
              <div key={label as string} style={{ padding:"12px 8px",background:"var(--surface)",borderRadius:10,border:"1px solid var(--border)" }}>
                <p style={{ fontSize:11,color:"var(--muted)",margin:0,marginBottom:4 }}>{label}</p>
                <p style={{ fontSize:14,fontWeight:700,color:"var(--text)",margin:0 }}>{val}</p>
              </div>
            ))}
          </div>

          {mesaCancelledUnits > 0 && (
            <div style={{ background:"var(--red-light)",borderRadius:10,padding:"10px 14px",marginBottom:16 }}>
              <p style={{ fontSize:12,color:"var(--red)",margin:0 }}>Se excluyeron {mesaCancelledUnits} unidad(es) cancelada(s)</p>
            </div>
          )}

          {surveyCompleted && (
            <div style={{ background:"var(--green-light)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,justifyContent:"center" }}>
              <span style={{ color:"var(--green)" }}><ICheck /></span>
              <div style={{ textAlign:"left" }}>
                <p style={{ fontSize:13,fontWeight:700,color:"var(--green)",margin:0 }}>¡Gracias por tu feedback!</p>
                <p style={{ fontSize:11,color:"var(--green)",margin:0 }}>Tu opinión ha sido registrada exitosamente</p>
              </div>
            </div>
          )}
        </div>

        {showSurvey && <SatisfactionSurvey onSubmit={handleSurveySubmit} onSkip={handleSurveySkip} customerName={customerSummaries[0]?.customerName || "Cliente"} />}
      </div>
    </div>
  );

  // ─── Main ticket view ──────────────────────────────────────────────────────
  const { checkingNotification, hasPendingBill } = notificationState;

  return (
    <>
      <div className="pay-root">
        <style>{DESIGN_CSS}</style>

        {/* Header */}
        <header style={{ padding:"12px 20px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",background:"white",flexShrink:0 }}>
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3 }}>
              <div style={{ width:30,height:30,borderRadius:8,background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",color:"white" }}>
                <IQR s={16} />
              </div>
              <p style={{ fontSize:17,fontWeight:800,color:"var(--navy)",letterSpacing:"-0.3px",margin:0 }}>Ticket de Pago</p>
            </div>
            <p style={{ fontSize:11,color:"var(--muted)",margin:0 }}>
              Mesa {tableNumber} • {session.customerName}
            </p>
            <p style={{ fontSize:11,color:"var(--navy)",margin:0,marginTop:2 }}>
              {customerSummaries.length} comensal{customerSummaries.length>1?"es":""} • {allOrders.length} orden{allOrders.length>1?"es":""}
            </p>
            {mesaCancelledUnits > 0 && <p style={{ fontSize:11,color:"var(--red)",margin:0,marginTop:2 }}>{mesaCancelledUnits} unidad(es) cancelada(s) — {formatCurrency(mesaCancelledAmount)} excluido(s)</p>}
          </div>
          <button onClick={() => { setRefreshing(true); loadOrders().finally(() => setRefreshing(false)); }} disabled={loading}
            style={{ background:refreshing?"var(--green-light)":"var(--navy)",color:refreshing?"var(--green)":"white",border:refreshing?"1.5px solid var(--border)":"none",borderRadius:9,padding:"8px 16px",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",opacity:loading?0.7:1 }}
          >
            <span style={{ display:"inline-block",animation:refreshing?"pay-spin 1s linear infinite":"none" }}><IRefresh /></span>
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
        </header>

        <main style={{ maxWidth:540,margin:"0 auto",padding:"20px 16px 32px" }}>
          {/* Ticket card */}
          <div style={{ border:"1.5px solid var(--border)",borderRadius:14,overflow:"hidden",marginBottom:20,animation:"pay-fadeup 0.35s ease both" }}>
            {/* Navy header */}
            <div style={{ background:"var(--navy)",padding:"20px 24px",textAlign:"center" }}>
              <p style={{ fontSize:11,letterSpacing:"0.12em",textTransform:"uppercase",color:"oklch(65% 0.01 260)",marginBottom:4,margin:0 }}>RESTAURANTE</p>
              <p style={{ fontSize:13,color:"oklch(75% 0.01 260)",margin:0 }}>Mesa {tableNumber}</p>
              {mesaCancelledUnits > 0 && <p style={{ fontSize:11,color:"oklch(75% 0.10 20)",margin:0,marginTop:4 }}>{mesaCancelledUnits} unidad(es) cancelada(s) excluida(s)</p>}
            </div>

            {/* Customer sections */}
            <div style={{ background:"white" }}>
              {customerSummaries.map((cs, ci) => (
                <div key={cs.customerName}>
                  {/* Customer header */}
                  <div style={{ padding:"16px 24px 12px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                      <div style={{ width:32,height:32,borderRadius:9,background:"var(--navy-light)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--navy)" }}><IUser /></div>
                      <div>
                        <p style={{ fontSize:14,fontWeight:700,color:"var(--text)",margin:0 }}>{cs.customerName}</p>
                        <p style={{ fontSize:11,color:"var(--muted)",margin:0 }}>
                          {cs.itemsCount} ítem{cs.itemsCount>1?"s":""} activo{cs.itemsCount>1?"s":""}
                          {cs.cancelledUnitsCount > 0 && ` • ${cs.cancelledUnitsCount} cancelado(s)`}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize:14,fontWeight:700,color:"var(--text)" }}>{formatCurrency(cs.total)}</span>
                  </div>

                  {/* Items */}
                  {cs.orders.map((order, oi) => (
                    <div key={order.id}>
                      {cs.orders.length > 1 && (
                        <p style={{ fontSize:11,color:"var(--muted)",padding:"8px 24px 4px",background:"var(--surface)",margin:0 }}>Orden #{order.id.slice(-8)}</p>
                      )}
                      {order.order_items.map(item => renderOrderItem(item))}
                      {oi < cs.orders.length - 1 && <div style={{ height:1,background:"var(--border)",margin:"0 24px" }} />}
                    </div>
                  ))}

                  {/* Customer total */}
                  <div style={{ padding:"12px 24px",display:"flex",justifyContent:"space-between",borderBottom:ci<customerSummaries.length-1?"1px solid var(--border)":"none" }}>
                    <span style={{ fontSize:14,fontWeight:700,color:"var(--text)" }}>Total de {cs.customerName}:</span>
                    <span style={{ fontSize:14,fontWeight:800,color:"var(--text)" }}>{formatCurrency(cs.total)}</span>
                  </div>
                  {cs.cancelledUnitsCount > 0 && (
                    <div style={{ padding:"0 24px 12px" }}>
                      <p style={{ fontSize:11,color:"var(--red)",margin:0 }}>• {cs.cancelledUnitsCount} unidad(es) cancelada(s)</p>
                      <p style={{ fontSize:11,color:"var(--red)",margin:0 }}>• {formatCurrency(cs.cancelledAmount)} excluido(s) del total</p>
                    </div>
                  )}
                </div>
              ))}

              {/* Grand total */}
              <div style={{ padding:"0 24px 16px",borderTop:"1px solid var(--border)" }}>
                <div style={{ padding:"12px 0",borderBottom:"1px dashed var(--border)",display:"flex",justifyContent:"space-between" }}>
                  <span style={{ fontSize:13,color:"var(--muted)" }}>Subtotal total:</span>
                  <span style={{ fontSize:13,color:"var(--muted)" }}>{formatCurrency(paymentSummary.subtotal)}</span>
                </div>
                <div style={{ padding:"8px 0",display:"flex",justifyContent:"space-between" }}>
                  <span style={{ fontSize:13,color:"var(--muted)" }}>Impuestos (8%):</span>
                  <span style={{ fontSize:13,color:"var(--muted)" }}>{formatCurrency(paymentSummary.taxAmount)}</span>
                </div>
                <div style={{ padding:"12px 0 0",borderTop:"2px solid var(--text)",display:"flex",justifyContent:"space-between" }}>
                  <span style={{ fontSize:16,fontWeight:800,color:"var(--text)" }}>TOTAL GENERAL:</span>
                  <span style={{ fontSize:16,fontWeight:800,color:"var(--text)" }}>{formatCurrency(paymentSummary.total)}</span>
                </div>
              </div>

              {paymentSummary.cancelledUnitsCount > 0 && (
                <div style={{ margin:"0 24px 16px",background:"var(--red-light)",borderRadius:10,padding:"12px 14px" }}>
                  <p style={{ fontSize:12,color:"var(--red)",margin:0 }}><strong>Nota:</strong> Se excluyen {paymentSummary.cancelledUnitsCount} unidad(es) cancelada(s) por un total de {formatCurrency(paymentSummary.cancelledAmount)}</p>
                </div>
              )}

              {/* Footer */}
              <div style={{ padding:"14px 24px 16px",borderTop:"1px solid var(--border)",textAlign:"center" }}>
                <p style={{ fontSize:13,fontWeight:600,color:"var(--green)",margin:0,marginBottom:4 }}>✅ ¡Gracias por su visita!</p>
                <p style={{ fontSize:12,color:"var(--muted)",margin:0 }}>Permanezca en la mesa cuando haya completado el pago</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex",gap:12,flexWrap:"wrap",marginBottom:12 }}>
            <button onClick={handleGeneratePDF} disabled={generatingPdf}
              style={{ flex:1,minWidth:140,padding:"13px 16px",borderRadius:11,border:"none",background:"var(--navy)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:generatingPdf?0.7:1 }}
            >
              {generatingPdf ? <span style={{ animation:"pay-spin 0.9s linear infinite",display:"inline-block" }}>↻</span> : <IDownload />}
              {generatingPdf ? "Generando PDF…" : "Guardar Ticket PDF"}
            </button>
            <button onClick={() => setIsInvoiceModalOpen(true)} disabled={generatingInvoice}
              style={{ flex:1,minWidth:140,padding:"13px 16px",borderRadius:11,border:"none",background:"oklch(55% 0.14 300)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8,opacity:generatingInvoice?0.7:1 }}
            >
              {generatingInvoice ? <span style={{ animation:"pay-spin 0.9s linear infinite",display:"inline-block" }}>↻</span> : <IInvoice />}
              {generatingInvoice ? "Procesando Factura…" : "Facturar Compra"}
            </button>
          </div>

          {/* Payment status button */}
          <div style={{ marginBottom:12 }}>
            {checkingNotification ? (
              <button disabled style={{ width:"100%",padding:"14px",borderRadius:11,border:"none",background:"var(--border)",color:"var(--muted)",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"not-allowed" }}>
                <span style={{ animation:"pay-spin 0.9s linear infinite",display:"inline-block" }}>↻</span> Verificando…
              </button>
            ) : hasPendingBill ? (
              <button disabled style={{ width:"100%",padding:"14px",borderRadius:11,border:"none",background:"var(--amber)",color:"white",fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"not-allowed" }}>
                <IClock /> Tu ticket está en proceso
              </button>
            ) : (
              <button onClick={handlePaymentConfirmation} className="pay-btn-cta"
                style={{ width:"100%",padding:"14px",borderRadius:11,border:"none",background:"var(--green)",color:"white",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}
              >
                <ICheck s={17} /> Ya Pagué
              </button>
            )}
          </div>

          {hasPendingBill && (
            <div style={{ background:"var(--amber-light)",border:"1.5px solid oklch(88% 0.1 70)",borderRadius:12,padding:"12px 16px",display:"flex",alignItems:"center",gap:10,marginBottom:12 }}>
              <span style={{ color:"var(--amber)",flexShrink:0 }}>ⓘ</span>
              <p style={{ fontSize:12,color:"oklch(48% 0.12 70)",fontWeight:500,margin:0 }}>Hemos recibido tu solicitud de pago. El mesero está en camino con tu ticket.</p>
            </div>
          )}

          <p style={{ fontSize:11,color:"var(--muted)",textAlign:"center",margin:0 }}>
            Puede guardar el ticket en PDF o solicitar factura antes de confirmar el pago
          </p>
        </main>
      </div>

      <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} onConfirm={handleInvoiceRequest} isLoading={generatingInvoice} />
    </>
  );
}
