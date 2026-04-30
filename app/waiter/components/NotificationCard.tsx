import { WaiterNotification } from "@/app/lib/supabase/waiter";
import NotificationIcon from "./NotificationIcon";

interface NotificationCardProps {
  notification: WaiterNotification;
  processing: string | null;
  isAttended: boolean;
  onAcknowledge: () => void;
  onComplete: () => void;
}

const NOTIF_TYPES: Record<string, { label: string; color: string; bg: string }> = {
  new_order:     { label: "Nuevo Pedido",       color: "var(--green)", bg: "var(--green-light)"  },
  assistance:    { label: "Asistencia",          color: "var(--amber)", bg: "var(--amber-light)"  },
  bill_request:  { label: "Cuenta",              color: "var(--red)",   bg: "var(--red-light)"    },
  order_updated: { label: "Pedido Actualizado",  color: "var(--blue)",  bg: "var(--blue-light)"   },
  table_freed:   { label: "Mesa Libre",          color: "var(--green)", bg: "var(--green-light)"  },
};

const getRelativeTime = (dateString: string) => {
  const diffMins = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  return new Date(dateString).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
};

export default function NotificationCard({ notification, processing, isAttended, onAcknowledge, onComplete }: NotificationCardProps) {
  const cfg = NOTIF_TYPES[notification.type] || { label:"Notificación", color:"var(--muted)", bg:"var(--surface)" };
  const isProcessing = processing === notification.id;
  const isUrgent = notification.type === "bill_request" || notification.type === "assistance";
  const timeElapsed = getRelativeTime(notification.created_at);

  return (
    <div style={{ border:`1.5px solid ${isUrgent && !isAttended ? "var(--red)" : "var(--border)"}`,borderRadius:14,padding:"14px 18px",background:isAttended?"var(--surface)":"white",display:"flex",alignItems:"center",gap:14,opacity:isAttended?0.85:1,transition:"all 0.2s",boxShadow:isUrgent&&!isAttended?"0 0 0 3px oklch(90% 0.06 20)":"none",animation:"wr-fadeup 0.3s ease" }}>
      <NotificationIcon type={notification.type} />

      <div style={{ flex:1 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
          <span style={{ fontSize:14,fontWeight:700,color:"var(--text)" }}>
            Mesa {notification.tables?.number || "N/A"}
          </span>
          <span style={{ fontSize:11,fontWeight:700,padding:"2px 8px",borderRadius:6,background:cfg.bg,color:cfg.color }}>
            {cfg.label}
          </span>
          {isAttended
            ? <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:"var(--green-light)",color:"var(--green)",marginLeft:"auto" }}>✓ Atendida</span>
            : <span style={{ fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:6,background:"var(--amber-light)",color:"var(--amber)",marginLeft:"auto" }}>Pendiente</span>
          }
        </div>

        {notification.orders?.customer_name && (
          <p style={{ fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:2 }}>
            👤 {notification.orders.customer_name}
          </p>
        )}

        <p style={{ fontSize:12,color:"var(--muted)",marginBottom:4 }}>{notification.message}</p>

        <p style={{ fontSize:11,color:"var(--muted)" }}>
          {new Date(notification.created_at).toLocaleString()} · <span style={{ background:"var(--surface)",padding:"1px 6px",borderRadius:4 }}>{timeElapsed}</span>
        </p>

        {isUrgent && !isAttended && (
          <p style={{ fontSize:12,color:"var(--red)",fontWeight:600,marginTop:6 }}>⚠️ Atención requerida</p>
        )}
      </div>

      <div style={{ display:"flex",flexDirection:"column",gap:8,flexShrink:0 }}>
        {!isAttended && (
          <button
            onClick={onAcknowledge}
            disabled={isProcessing}
            style={{ padding:"8px 14px",borderRadius:9,border:"none",background:"var(--navy)",fontSize:12,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",opacity:isProcessing?0.6:1,display:"flex",alignItems:"center",gap:5 }}
          >
            {isProcessing
              ? <span style={{ animation:"wr-spin 0.8s linear infinite",display:"inline-block" }}>↻</span>
              : "👁 Atender"}
          </button>
        )}
        <button
          onClick={onComplete}
          disabled={isProcessing}
          style={{ padding:"8px 14px",borderRadius:9,border:"1.5px solid var(--border)",background:"var(--green-light)",fontSize:12,fontWeight:700,color:"var(--green)",cursor:"pointer",fontFamily:"inherit",opacity:isProcessing?0.6:1 }}
        >
          Completar
        </button>
      </div>
    </div>
  );
}
