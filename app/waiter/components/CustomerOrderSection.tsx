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
}

export default function CustomerOrderSection({ customerSummary, processing, onUpdateItemStatus, onCancelItem, onCancelModalChange }: CustomerOrderSectionProps) {
  return (
    <div style={{ borderBottom:"1px solid var(--border)" }}>
      {/* Customer header */}
      <div style={{ padding:"10px 14px",background:"oklch(97% 0.01 260)",display:"flex",alignItems:"center",gap:8 }}>
        <div style={{ width:28,height:28,borderRadius:8,background:"var(--navy-light)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--navy)",flexShrink:0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
        <div>
          <p style={{ fontSize:13,fontWeight:700,color:"var(--text)",margin:0 }}>{customerSummary.customerName}</p>
          <p style={{ fontSize:11,color:"var(--muted)",margin:0 }}>
            {customerSummary.orders.length} pedido{customerSummary.orders.length>1?"s":""} • {customerSummary.itemsCount} producto{customerSummary.itemsCount>1?"s":""}
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
            />
          ))
        )}
      </div>
    </div>
  );
}
