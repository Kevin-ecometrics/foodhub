/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableWithOrder } from "@/app/lib/supabase/waiter";
import { FaDollarSign, FaSpinner } from "react-icons/fa";

interface TableHeaderProps {
  table: TableWithOrder;
  tableTotal: number;
  processing: string | null;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
}

export default function TableHeader({
  table,
  tableTotal,
  processing,
  onCobrarMesa,
}: TableHeaderProps) {
  const calculateTotalItems = (table: TableWithOrder) => {
    return table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ),
      0
    );
  };

  const calculateItemsByStatus = (table: TableWithOrder) => {
    const pending = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter(
          (item: any) =>
            item.status === "ordered" || item.status === "preparing"
        ).length,
      0
    );

    const ready = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter((item: any) => item.status === "ready").length,
      0
    );

    const served = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter((item: any) => item.status === "served")
          .length,
      0
    );

    return { pending, ready, served };
  };

  const totalItems = calculateTotalItems(table);
  const statusCounts = calculateItemsByStatus(table);

  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <h3 className="font-bold text-lg flex items-center gap-2">
          Mesa {table.number}
          {tableTotal > 0 && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              ${tableTotal.toFixed(2)}
            </span>
          )}
        </h3>

        <div className="flex flex-wrap gap-1 mt-2">
          <span
            className={`text-xs px-2 py-1 rounded ${
              table.status === "occupied"
                ? "bg-green-100 text-green-800"
                : table.status === "reserved"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {table.status === "occupied"
              ? "🟢 Ocupada"
              : table.status === "reserved"
              ? "🟡 Reservada"
              : "⚪ Disponible"}
          </span>

          {totalItems > 0 && (
            <>
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {totalItems} productos
              </span>
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                ⏱️ {statusCounts.pending} pendientes
              </span>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                ✅ {statusCounts.ready} listos
              </span>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                🍽️ {statusCounts.served} servidos
              </span>
            </>
          )}
        </div>

        <p className="text-sm text-gray-500 mt-1">
          {table.location} • {table.capacity} personas
        </p>
      </div>

      {table.status === "occupied" && table.orders.length > 0 && (
        <button
          onClick={() => onCobrarMesa(table.id, table.number)}
          disabled={processing === `cobrar-${table.id}`}
          className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:opacity-50 whitespace-nowrap ml-2 flex items-center gap-1"
        >
          {processing === `cobrar-${table.id}` ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <>
              <FaDollarSign />
              Cobrar
            </>
          )}
        </button>
      )}
    </div>
  );
}
