import { useState } from "react";

interface OrderItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  processing: string | null;
  onUpdateStatus: (itemId: string, newStatus: string) => void;
  onCancelItem: (itemId: string, cancelQuantity: number) => void;
}

const STATUS_LABEL: Record<string, string> = { ordered:"Ordenado", preparing:"En Preparación", ready:"Listo", served:"Servido", cancelled:"Cancelado" };
const STATUS_BG:    Record<string, string> = { ordered:"var(--red-light)", preparing:"var(--amber-light)", ready:"var(--blue-light)", served:"var(--green-light)", cancelled:"var(--surface)" };
const STATUS_COLOR: Record<string, string> = { ordered:"var(--red)", preparing:"var(--amber)", ready:"var(--blue)", served:"var(--green)", cancelled:"var(--muted)" };
const STATUS_NEXT:  Record<string, string> = { ordered:"preparing", preparing:"ready", ready:"served", served:"served", cancelled:"cancelled" };

export default function OrderItem({ item, processing, onUpdateStatus, onCancelItem }: OrderItemProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelQuantity, setCancelQuantity] = useState(1);

  const isCancelled = item.status === "cancelled";
  const cancelledQty = item.cancelled_quantity || 0;
  const remainingQuantity = item.quantity - cancelledQty;
  const availableToCancel = remainingQuantity;

  const canCancel = () => !isCancelled && remainingQuantity > 0 && item.status !== "ready" && item.status !== "served";

  const handleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (item.status === "served" || item.status === "cancelled") return;
    onUpdateStatus(item.id, STATUS_NEXT[item.status] || item.status);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!canCancel()) {
      if (item.status === "ready" || item.status === "served") alert("No se puede cancelar un producto que ya está listo o servido");
      else if (item.status === "cancelled") alert("Este producto ya está cancelado");
      return;
    }
    if (item.quantity === 1) {
      if (window.confirm("¿Estás seguro de que quieres cancelar este producto?")) onCancelItem(item.id, 1);
    } else {
      setCancelQuantity(1); setShowCancelModal(true);
    }
  };

  const handleConfirmCancel = () => {
    if (cancelQuantity > 0 && cancelQuantity <= availableToCancel) { onCancelItem(item.id, cancelQuantity); setShowCancelModal(false); }
  };

  const formatItemNotes = (notes: string | null) => {
    if (!notes) return null;
    if (notes.includes("Extras:")) {
      const parts = notes.split(" | ");
      return (
        <div style={{ marginTop:6,fontSize:11,display:"flex",flexDirection:"column",gap:3 }}>
          {parts.map((part, i) => {
            if (part.startsWith("Extras:")) return <p key={i} style={{ color:"var(--green)",margin:0 }}>🟢 <strong>Extras:</strong> {part.replace("Extras: ","")}</p>;
            if (part.startsWith("Total:"))  return <p key={i} style={{ color:"var(--blue)",fontWeight:600,margin:0 }}>{part}</p>;
            if (part) return <p key={i} style={{ color:"var(--muted)",margin:0 }}>📝 <strong>Nota:</strong> {part}</p>;
            return null;
          })}
        </div>
      );
    }
    return <p style={{ fontSize:11,color:"var(--muted)",margin:0,marginTop:4 }}>📝 <strong>Nota:</strong> {notes}</p>;
  };

  const isProcessing = processing === item.id;

  return (
    <>
      <div style={{ padding:"10px 14px",borderTop:"1px dashed var(--border)",background:isCancelled?"oklch(98% 0.03 20)":"white" }}>
        <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:4 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
              <span style={{ fontSize:13,fontWeight:600,color:isCancelled?"var(--red)":"var(--text)",textDecoration:isCancelled?"line-through":"none" }}>
                {item.product_name}
              </span>
              {isCancelled && (
                <span style={{ background:"var(--red-light)",color:"var(--red)",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6 }}>Cancelado</span>
              )}
              {!isCancelled && cancelledQty > 0 && (
                <span style={{ background:"var(--amber-light)",color:"var(--amber)",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:6 }}>
                  Parcial ({cancelledQty}/{item.quantity})
                </span>
              )}
            </div>
            <div style={{ fontSize:11,color:"var(--muted)",marginTop:2 }}>
              × {remainingQuantity}{cancelledQty>0&&<span style={{ color:"var(--red)",textDecoration:"line-through",marginLeft:4 }}>(de {item.quantity})</span>}
              {" "}• ${item.price.toFixed(2)} c/u
              {" "}• <strong style={{ color:isCancelled?"var(--muted)":"var(--green)" }}>Total: ${(item.price * remainingQuantity).toFixed(2)}</strong>
              {cancelledQty > 0 && <span style={{ color:"var(--red)",marginLeft:4 }}>(Cancelado: ${(item.price * cancelledQty).toFixed(2)})</span>}
            </div>
            {item.notes && <div style={{ opacity:isCancelled?0.7:1 }}>{formatItemNotes(item.notes)}</div>}
          </div>

          <div style={{ display:"flex",flexDirection:"column",gap:6,flexShrink:0,marginLeft:12 }}>
            <button
              onClick={handleStatusClick}
              disabled={isProcessing || item.status==="served" || item.status==="cancelled" || remainingQuantity===0}
              style={{ padding:"5px 12px",borderRadius:7,border:"none",background:STATUS_BG[item.status]||"var(--surface)",color:STATUS_COLOR[item.status]||"var(--muted)",fontSize:11,fontWeight:700,cursor:item.status==="served"||item.status==="cancelled"?"default":"pointer",fontFamily:"inherit",transition:"filter 0.15s",opacity:isProcessing?0.6:1 }}
            >
              {isProcessing ? "↻" : STATUS_LABEL[item.status] || item.status}
            </button>
            {canCancel() && (
              <button
                onClick={handleCancelClick}
                disabled={isProcessing}
                style={{ background:"none",border:"none",fontSize:11,fontWeight:600,color:"var(--muted)",cursor:"pointer",display:"flex",alignItems:"center",gap:3,padding:0,fontFamily:"inherit" }}
              >
                ✕ Cancelar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel quantity modal */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:800,padding:16,animation:"wr-fadein 0.2s ease" }}>
          <div onClick={e => e.stopPropagation()} style={{ background:"white",borderRadius:16,padding:"28px",maxWidth:340,width:"90%",boxShadow:"0 20px 60px rgba(0,0,0,0.2)",animation:"wr-scalein 0.22s ease" }}>
            <p style={{ fontSize:17,fontWeight:800,color:"var(--text)",marginBottom:4 }}>Cancelar {item.product_name}</p>
            <p style={{ fontSize:13,color:"var(--muted)",marginBottom:16 }}>Cantidad ordenada: <strong>{item.quantity}</strong> · Ya cancelados: <strong>{cancelledQty}</strong></p>
            <p style={{ fontSize:12,fontWeight:600,color:"var(--text)",marginBottom:10 }}>¿Cuántas unidades cancelar?</p>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:6 }}>
              <button onClick={() => setCancelQuantity(q => Math.max(1, q-1))} disabled={cancelQuantity<=1} style={{ width:36,height:36,borderRadius:9,border:"1.5px solid var(--border)",background:"white",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text)",opacity:cancelQuantity<=1?0.4:1 }}>−</button>
              <span style={{ fontSize:18,fontWeight:700,color:"var(--text)",width:28,textAlign:"center" }}>{cancelQuantity}</span>
              <button onClick={() => setCancelQuantity(q => Math.min(availableToCancel, q+1))} disabled={cancelQuantity>=availableToCancel} style={{ width:36,height:36,borderRadius:9,border:"1.5px solid var(--border)",background:"white",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center",color:"var(--text)",opacity:cancelQuantity>=availableToCancel?0.4:1 }}>+</button>
            </div>
            <p style={{ fontSize:11,color:"var(--muted)",marginBottom:20 }}>Máximo disponible: {availableToCancel}</p>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={() => setShowCancelModal(false)} style={{ flex:1,padding:12,borderRadius:10,border:"1.5px solid var(--border)",background:"var(--surface)",fontSize:13,fontWeight:600,color:"var(--muted)",cursor:"pointer",fontFamily:"inherit" }}>Volver</button>
              <button onClick={handleConfirmCancel} disabled={cancelQuantity<=0||cancelQuantity>availableToCancel} style={{ flex:1,padding:12,borderRadius:10,border:"none",background:"var(--red)",fontSize:13,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",opacity:cancelQuantity<=0||cancelQuantity>availableToCancel?0.5:1 }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
