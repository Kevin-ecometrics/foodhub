import { WaiterNotification } from "@/app/lib/supabase/waiter";
import NotificationCard from "./NotificationCard";
import { useState, useMemo, useEffect } from "react";

interface NotificationsTabProps {
  notifications: WaiterNotification[];
  processing: string | null;
  attendedNotifications: Set<string>;
  onAcknowledgeNotification: (notificationId: string) => void;
  onCompleteNotification: (notificationId: string) => void;
  onGoToTables: () => void;
}

export default function NotificationsTab({
  notifications, processing, attendedNotifications,
  onAcknowledgeNotification, onCompleteNotification, onGoToTables,
}: NotificationsTabProps) {
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">(() => {
    const saved = localStorage.getItem("notificationsSortOrder");
    return saved === "oldest" || saved === "newest" ? saved : "oldest";
  });

  useEffect(() => { localStorage.setItem("notificationsSortOrder", sortOrder); }, [sortOrder]);

  const totalNotifications = notifications.length;
  const attendedCount = attendedNotifications.size;
  const pendingCount = totalNotifications - attendedCount;

  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sortOrder === "oldest" ? ta - tb : tb - ta;
    });
  }, [notifications, sortOrder]);

  return (
    <div style={{ flex:1,overflowY:"auto",padding:"24px 20px",animation:"wr-fadeup 0.3s ease" }}>
      {/* Header with counters */}
      <div style={{ border:"1.5px solid var(--border)",borderRadius:14,padding:"14px 18px",background:"white",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
        <div>
          <p style={{ fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:6 }}>Notificaciones</p>
          <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
            <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:10,background:"var(--red-light)",color:"var(--red)" }}>{pendingCount} pendientes</span>
            <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:10,background:"var(--blue-light)",color:"var(--blue)" }}>{attendedCount} vistas</span>
            <span style={{ fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:10,background:"var(--surface)",color:"var(--muted)",border:"1px solid var(--border)" }}>{totalNotifications} total</span>
          </div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6 }}>
          <span style={{ fontSize:12,color:"var(--muted)" }}>Orden:</span>
          <div style={{ display:"flex",border:"1.5px solid var(--border)",borderRadius:9,overflow:"hidden" }}>
            {(["oldest","newest"] as const).map(o => (
              <button key={o} onClick={() => setSortOrder(o)} style={{ padding:"7px 14px",border:"none",background:sortOrder===o?"var(--accent)":"white",color:sortOrder===o?"white":"var(--muted)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}>
                {o === "oldest" ? "↓ Antiguas" : "↑ Nuevas"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {sortedNotifications.length === 0 ? (
        <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"80px 24px",color:"var(--muted)" }}>
          <div style={{ width:64,height:64,borderRadius:18,background:"var(--green-light)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,fontSize:28 }}>✅</div>
          <p style={{ fontSize:16,fontWeight:700,color:"var(--text)",marginBottom:4 }}>¡Todo al día!</p>
          <p style={{ fontSize:13,color:"var(--muted)" }}>No hay notificaciones pendientes</p>
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:10,maxWidth:620 }}>
          {sortedNotifications.map(n => (
            <NotificationCard
              key={n.id}
              notification={n}
              processing={processing}
              isAttended={attendedNotifications.has(n.id)}
              onAcknowledge={() => { onAcknowledgeNotification(n.id); onGoToTables(); }}
              onComplete={() => onCompleteNotification(n.id)}
            />
          ))}
          <div style={{ border:"1.5px solid var(--border)",borderRadius:12,padding:"12px 18px",background:"white",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <span style={{ color:"var(--muted)" }}>👁 <strong style={{ color:"var(--text)" }}>{attendedCount}</strong> notificación(es) vista(s)</span>
            <span style={{ color:"var(--muted)" }}>⏳ <strong style={{ color:"var(--text)" }}>{pendingCount}</strong> pendiente(s)</span>
          </div>
        </div>
      )}
    </div>
  );
}
