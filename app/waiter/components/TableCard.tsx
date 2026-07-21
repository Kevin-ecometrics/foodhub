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
  onCerrarMesa: (tableId: number, tableNumber: number) => void;
  calculateTableTotal: (table: TableWithOrder) => number;
  notifications: WaiterNotification[];
  occupationTime?: string;
  hasNotifications?: boolean;
  isHighlighted?: boolean;
  onAddModalChange?: (isOpen: boolean) => void;
  onMoveItem?: (itemId: string, tableId: number, targetCustomerName: string) => void;
}

export default function TableCard({
  table, processing, onUpdateItemStatus, onCancelItem,
  onCobrarMesa, onPagarPorSeparado, onCerrarMesa, calculateTableTotal,
  notifications, occupationTime, hasNotifications, isHighlighted = false,
  onAddModalChange, onMoveItem,
}: TableCardProps) {
  const tableTotal = calculateTableTotal(table);
  const isOccupied = table.status === "occupied";
  const generalName = `Mesero ${table.number}`;

  const groupOrdersByCustomer = (t: TableWithOrder): CustomerGroupSummary[] => {
    const map = new Map<string, CustomerGroupSummary>();
    t.orders.forEach(order => {
      const name = order.customer_name || generalName;
      if (!map.has(name)) map.set(name, { customerName: name, orders: [], subtotal: 0, taxAmount: 0, total: 0, itemsCount: 0 });
      const g = map.get(name)!;
      g.orders.push(order);
      const sub = order.order_items.reduce((s: number, i: OrderItem) => s + i.price * i.quantity, 0);
      g.subtotal += sub;
      g.itemsCount += order.order_items.length;
    });
    // Keep an always-visible general (no-client) drop zone whenever the table has
    // other items, so waiters can drag a misassigned product into it even when
    // it currently has none of its own.
    if (t.status === "occupied" && t.orders.length > 0 && !map.has(generalName)) {
      map.set(generalName, { customerName: generalName, orders: [], subtotal: 0, taxAmount: 0, total: 0, itemsCount: 0 });
    }
    const taxRate = 0.16;
    map.forEach(g => { g.taxAmount = g.subtotal * taxRate; g.total = g.subtotal + g.taxAmount; });
    return Array.from(map.values()).sort((a, b) => {
      if (a.customerName === generalName) return 1;
      if (b.customerName === generalName) return -1;
      return 0;
    });
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
        onCerrarMesa={onCerrarMesa}
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
          isGeneral={cs.customerName === generalName}
          onMoveItem={onMoveItem ? (itemId) => onMoveItem(itemId, table.id, cs.customerName) : undefined}
        />
      ))}

      {tableTotal > 0 && (
        <TableSummary
          tableTotal={tableTotal}
          customerCount={customerSummaries.filter(cs => cs.customerName !== generalName || cs.itemsCount > 0).length}
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
