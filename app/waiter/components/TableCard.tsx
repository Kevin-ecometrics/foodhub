import { TableWithOrder, TableOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import type { OrderItem } from "@/app/lib/supabase/order-items";
import CustomerOrderSection from "./CustomerOrderSection";
import TableHeader from "./TableHeader";
import TableSummary from "./TableSummary";

interface CustomerGroupSummary {
  customerName: string;
  orders: TableOrder[];
  subtotal: number;
  taxAmount: number;
  total: number;
  itemsCount: number;
}

interface TableCardProps {
  table: TableWithOrder;
  processing: string | null;
  onUpdateItemStatus: (itemId: string, newStatus: string) => void;
  onCancelItem: (itemId: string) => void;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  onPagarPorSeparado: (tableId: number, tableNumber: number) => void;
  calculateTableTotal: (table: TableWithOrder) => number;
  notifications: WaiterNotification[];
  occupationTime?: string;
  hasNotifications?: boolean;
  isHighlighted?: boolean;
  onAddModalChange?: (isOpen: boolean) => void;
}

export default function TableCard({
  table, processing, onUpdateItemStatus, onCancelItem,
  onCobrarMesa, onPagarPorSeparado, calculateTableTotal,
  notifications, occupationTime, hasNotifications, isHighlighted = false,
  onAddModalChange,
}: TableCardProps) {
  const tableTotal = calculateTableTotal(table);
  const isOccupied = table.status === "occupied";

  const groupOrdersByCustomer = (t: TableWithOrder): CustomerGroupSummary[] => {
    const map = new Map<string, CustomerGroupSummary>();
    t.orders.forEach(order => {
      const name = order.customer_name || "Cliente";
      if (!map.has(name)) map.set(name, { customerName: name, orders: [], subtotal: 0, taxAmount: 0, total: 0, itemsCount: 0 });
      const g = map.get(name)!;
      g.orders.push(order);
      const sub = order.order_items.reduce((s: number, i: OrderItem) => s + i.price * i.quantity, 0);
      g.subtotal += sub;
      g.itemsCount += order.order_items.length;
    });
    const taxRate = 0.16;
    map.forEach(g => { g.taxAmount = g.subtotal * taxRate; g.total = g.subtotal + g.taxAmount; });
    return Array.from(map.values());
  };

  const customerSummaries = groupOrdersByCustomer(table);

  return (
    <div style={{ border:`2px solid ${isHighlighted?"var(--red)":isOccupied?"var(--red)":"var(--border)"}`,borderRadius:14,overflow:"hidden",background:"white",position:"relative",minWidth:0 }}>
      <TableHeader
        table={table}
        tableTotal={tableTotal}
        processing={processing}
        onCobrarMesa={onCobrarMesa}
        onPagarPorSeparado={onPagarPorSeparado}
        notifications={notifications}
        hasNotifications={hasNotifications}
        isHighlighted={isHighlighted}
        occupationTime={occupationTime}
        onAddModalChange={onAddModalChange}
      />

      {customerSummaries.map(cs => (
        <CustomerOrderSection
          key={cs.customerName}
          customerSummary={cs}
          processing={processing}
          onUpdateItemStatus={onUpdateItemStatus}
          onCancelItem={onCancelItem}
          onCancelModalChange={onAddModalChange}
        />
      ))}

      {tableTotal > 0 && (
        <TableSummary
          tableTotal={tableTotal}
          customerCount={customerSummaries.length}
          orderCount={table.orders.length}
          isHighlighted={isHighlighted}
        />
      )}

      {table.orders.length === 0 && isOccupied && (
        <div style={{ textAlign:"center",padding:"24px 0",color:"var(--muted)",fontSize:13 }}>
          🍽️ No hay pedidos enviados
        </div>
      )}

      {!isOccupied && (
        <div style={{ padding:"14px 14px 16px" }}>
          <p style={{ fontSize:12,color:"var(--green)",margin:0,marginBottom:2 }}>● Sin pedidos <span style={{ color:"var(--muted)" }}>• Desde: Sin registro</span></p>
          <p style={{ fontSize:11,color:"var(--muted)",margin:0 }}>Disponible</p>
        </div>
      )}
    </div>
  );
}
