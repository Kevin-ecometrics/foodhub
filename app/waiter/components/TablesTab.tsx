import { TableWithOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import TableCard from "./TableCard";
import { useState } from "react";

interface TablesTabProps {
  tables: TableWithOrder[];
  processing: string | null;
  onUpdateItemStatus: (itemId: string, newStatus: string) => void;
  onCancelItem: (itemId: string) => void;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  onPagarPorSeparado: (tableId: number, tableNumber: number) => void;
  calculateTableTotal: (table: TableWithOrder) => number;
  notifications: WaiterNotification[];
  tablesOrder: string;
}

export default function TablesTab({
  tables, processing, onUpdateItemStatus, onCancelItem,
  onCobrarMesa, onPagarPorSeparado, calculateTableTotal,
  notifications, tablesOrder,
}: TablesTabProps) {
  const totalGeneral = tables.reduce((s, t) => s + calculateTableTotal(t), 0);
  const occupiedCount = tables.filter(t => t.status === "occupied").length;

  const getOccupationTime = (table: TableWithOrder): Date | null => {
    if (table.orders.length === 0) return null;
    return table.orders.reduce((earliest, o) => {
      const d = new Date(o.created_at);
      return d < earliest ? d : earliest;
    }, new Date(table.orders[0].created_at));
  };

  const getOccupationDisplay = (table: TableWithOrder): string => {
    const t = getOccupationTime(table);
    if (!t) return "Sin pedidos";
    const mins = Math.floor((Date.now() - t.getTime()) / 60000);
    if (mins < 1) return "Recién";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)} h`;
  };

  const sortedTables = [...tables].sort((a, b) => {
    if (tablesOrder === "occupation") {
      const ta = getOccupationTime(a), tb = getOccupationTime(b);
      if (!ta && !tb) return 0;
      if (!ta) return 1;
      if (!tb) return -1;
      return ta.getTime() - tb.getTime();
    }
    return a.number - b.number;
  });

  const oldestIndex = tablesOrder === "occupation"
    ? sortedTables.findIndex(t => t.status === "occupied" && getOccupationTime(t) !== null)
    : -1;

  return (
    <div style={{ animation:"wr-fadeup 0.3s ease" }}>
      {/* Summary */}
      <div style={{ display:"flex",alignItems:"baseline",justifyContent:"space-between",marginBottom:16 }}>
        <h2 style={{ fontSize:18,fontWeight:800,color:"var(--text)",margin:0 }}>Cuentas por Mesa</h2>
        <div style={{ display:"flex",gap:8 }}>
          <span style={{ fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,background:"var(--green-light)",color:"var(--green)" }}>{occupiedCount} mesas ocupadas</span>
          <span style={{ fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20,background:"var(--amber-light)",color:"var(--amber)" }}>$ Total: ${totalGeneral.toFixed(2)}</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16,alignItems:"start" }}>
        {sortedTables.map((table, index) => {
          const occupationDisplay = getOccupationDisplay(table);
          const hasNotifs = notifications.some(n => n.table_id === table.id);
          const isOldest = tablesOrder === "occupation" && index === oldestIndex;

          return (
            <div key={table.id} style={{ position:"relative" }}>
              {tablesOrder === "occupation" && table.status === "occupied" && index < 3 && (
                <div style={{ position:"absolute",top:-10,right:-10,zIndex:10,width:28,height:28,borderRadius:"50%",background:index===oldestIndex?"var(--red)":index===oldestIndex+1?"var(--amber)":"var(--blue)",color:"white",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center" }}>
                  #{index + 1}
                </div>
              )}
              <TableCard
                table={table}
                processing={processing}
                onUpdateItemStatus={onUpdateItemStatus}
                onCancelItem={onCancelItem}
                onCobrarMesa={onCobrarMesa}
                onPagarPorSeparado={onPagarPorSeparado}
                calculateTableTotal={calculateTableTotal}
                notifications={notifications}
                occupationTime={occupationDisplay}
                hasNotifications={hasNotifs}
                isHighlighted={isOldest}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
