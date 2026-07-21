import { useState } from "react";
import OrderItem from "./OrderItem";
import type { TableOrder } from "@/app/lib/supabase/waiter";
import type { OrderItem as OrderItemType } from "@/app/lib/supabase/order-items";

interface CustomerOrderSummary {
  customerName: string;
  orders: TableOrder[];
  subtotal: number;
  taxAmount: number;
  total: number;
  itemsCount: number;
}

interface CustomerOrderSectionProps {
  customerSummary: CustomerOrderSummary;
  processing: string | null;
  onUpdateItemStatus: (itemId: string, newStatus: string) => void;
  onCancelItem: (itemId: string) => void;
  onCancelModalChange?: (isOpen: boolean) => void;
  isGeneral?: boolean;
  onMoveItem?: (itemId: string) => void;
  orderSteps?: string | null;
}

export default function CustomerOrderSection({ customerSummary, processing, onUpdateItemStatus, onCancelItem, onCancelModalChange, isGeneral = false, onMoveItem, orderSteps }: CustomerOrderSectionProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const displayName = customerSummary.customerName;

  const handleDragOver = (e: React.DragEvent) => {
    if (!onMoveItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!onMoveItem) return;
    e.preventDefault();
    setIsDragOver(false);
    const itemId = e.dataTransfer.getData("text/plain");
    if (itemId) onMoveItem(itemId);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      style={{ borderBottom:"1px solid var(--border)", background:isDragOver?"var(--green-light)":undefined, outline:isDragOver?"2px dashed var(--green)":"none", outlineOffset:-2, transition:"background 0.15s" }}
    >
      {/* Customer header */}
      <div style={{ padding:"10px 14px",background:isDragOver?"transparent":"oklch(97% 0.01 260)",display:"flex",alignItems:"center",gap:8 }}>
        <div style={{ width:28,height:28,borderRadius:8,background:isGeneral?"var(--surface)":"var(--navy-light)",display:"flex",alignItems:"center",justifyContent:"center",color:isGeneral?"var(--muted)":"var(--navy)",flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize:13,fontWeight:700,color:isGeneral?"var(--muted)":"var(--text)",margin:0 }}>{displayName}</p>
          <p style={{ fontSize:11,color:"var(--muted)",margin:0 }}>
            {customerSummary.itemsCount} producto{customerSummary.itemsCount>1?"s":""}
          </p>
        </div>
      </div>

      {/* Order items */}
      <div>
        {customerSummary.orders.flatMap(order =>
          order.order_items.map((item: OrderItemType) => (
            <OrderItem
              key={item.id}
              item={item}
              processing={processing}
              onUpdateStatus={onUpdateItemStatus}
              onCancelItem={onCancelItem}
              onCancelModalChange={onCancelModalChange}
              draggable={!!onMoveItem}
              orderSteps={orderSteps}
            />
          ))
        )}
        {isGeneral && customerSummary.itemsCount === 0 && (
          <p style={{ fontSize:11,color:"var(--muted)",margin:0,padding:"8px 14px",fontStyle:"italic" }}>
            Arrastra aquí un producto para asignárselo al mesero
          </p>
        )}
      </div>
    </div>
  );
}
