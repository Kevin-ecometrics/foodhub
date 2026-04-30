// app/waiter/components/Tabs.tsx
interface TabsProps {
  activeTab: "notifications" | "tables" | "products";
  onTabChange: (tab: "notifications" | "tables" | "products") => void;
  notificationsCount: number;
  occupiedTablesCount: number;
}

const TABS = [
  { id: "notifications" as const, label: "Notificaciones", countKey: "notifs" },
  { id: "tables"        as const, label: "Mesas",           countKey: "tables" },
  { id: "products"      as const, label: "Productos",       countKey: null },
];

export default function Tabs({ activeTab, onTabChange, notificationsCount, occupiedTablesCount }: TabsProps) {
  const getCount = (key: string | null) => {
    if (key === "notifs") return notificationsCount;
    if (key === "tables") return occupiedTablesCount;
    return null;
  };
  const getCountColor = (key: string | null) => key === "notifs" ? "var(--red)" : "var(--green)";

  return (
    <div style={{ padding:"0 20px",borderBottom:"1px solid var(--border)",background:"white",display:"flex",gap:0,flexShrink:0 }}>
      {TABS.map(t => {
        const active = activeTab === t.id;
        const count = getCount(t.countKey);
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{ padding:"12px 16px",border:"none",background:"none",fontSize:13,fontWeight:active?700:500,color:active?"var(--navy)":"var(--muted)",borderBottom:active?"2.5px solid var(--navy)":"2.5px solid transparent",marginBottom:-1,display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s" }}
          >
            {t.label}
            {count !== null && count > 0 && (
              <span style={{ fontSize:10,fontWeight:800,padding:"1px 6px",borderRadius:10,background:getCountColor(t.countKey),color:"white" }}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
