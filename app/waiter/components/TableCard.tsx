import { TableWithOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import CustomerOrderSection from "./CustomerOrderSection";
import TableHeader from "./TableHeader";
import TableSummary from "./TableSummary";

interface TableCardProps {
  table: TableWithOrder;
  processing: string | null;
  onUpdateItemStatus: (itemId: string, newStatus: string) => void;
  onCancelItem: (itemId: string) => void;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  calculateTableTotal: (table: TableWithOrder) => number;
  notifications: WaiterNotification[];
  // Nuevas props opcionales
  occupationTime?: string;
  hasNotifications?: boolean;
  isHighlighted?: boolean;
}

export default function TableCard({
  table,
  processing,
  onUpdateItemStatus,
  onCancelItem,
  onCobrarMesa,
  calculateTableTotal,
  notifications,
  occupationTime,
  hasNotifications,
  isHighlighted = false,
}: TableCardProps) {
  const tableTotal = calculateTableTotal(table);

  // Agrupar órdenes por cliente
  const groupOrdersByCustomer = (table: TableWithOrder) => {
    const customerMap = new Map();

    table.orders.forEach((order) => {
      const customerName = order.customer_name || "Cliente";

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          customerName,
          orders: [],
          subtotal: 0,
          taxAmount: 0,
          total: 0,
          itemsCount: 0,
        });
      }

      const customerSummary = customerMap.get(customerName)!;
      customerSummary.orders.push(order);

      const orderSubtotal = order.order_items.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      customerSummary.subtotal += orderSubtotal;
      customerSummary.itemsCount += order.order_items.length;
    });

    const taxRate = 0.16;
    customerMap.forEach((customerSummary) => {
      customerSummary.taxAmount = customerSummary.subtotal * taxRate;
      customerSummary.total =
        customerSummary.subtotal + customerSummary.taxAmount;
    });

    return Array.from(customerMap.values());
  };

  const customerSummaries = groupOrdersByCustomer(table);

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
        isHighlighted
          ? "border-2 border-red-500"
          : table.status === "occupied"
          ? "border-l-4 border-l-green-500"
          : table.status === "reserved"
          ? "border-l-4 border-l-yellow-500"
          : "border-l-4 border-l-gray-300"
      }`}
    >
      {/* Información adicional de tiempo de ocupación */}
      {occupationTime && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800 font-medium">
              Tiempo de ocupación:
            </span>
            <span
              className={`font-bold ${
                occupationTime.includes("h")
                  ? "text-red-600"
                  : occupationTime.includes("min") &&
                    parseInt(occupationTime) > 30
                  ? "text-orange-600"
                  : "text-green-600"
              }`}
            >
              {occupationTime}
            </span>
          </div>
        </div>
      )}

      <TableHeader
        table={table}
        tableTotal={tableTotal}
        processing={processing}
        onCobrarMesa={onCobrarMesa}
        notifications={notifications}
        hasNotifications={hasNotifications}
        isHighlighted={isHighlighted}
      />

      {customerSummaries.map((customerSummary) => (
        <CustomerOrderSection
          key={customerSummary.customerName}
          customerSummary={customerSummary}
          processing={processing}
          onUpdateItemStatus={onUpdateItemStatus}
          onCancelItem={onCancelItem}
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

      {table.orders.length === 0 && table.status === "occupied" && (
        <EmptyTableState />
      )}
    </div>
  );
}

function EmptyTableState() {
  return (
    <div className="text-center py-6 text-gray-500 text-sm">
      <FaUtensils className="text-2xl text-gray-300 mx-auto mb-2" />
      No hay pedidos enviados
    </div>
  );
}

// Import necesario para el componente EmptyTableState
import { FaUtensils } from "react-icons/fa";
