import { TableWithOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import TableCard from "./TableCard";
import { useState } from "react";
import { FaDollarSign, FaSortNumericDown, FaClock } from "react-icons/fa";

interface TablesTabProps {
  tables: TableWithOrder[];
  processing: string | null;
  onUpdateItemStatus: (itemId: string, newStatus: string) => void;
  onCancelItem: (itemId: string) => void;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  calculateTableTotal: (table: TableWithOrder) => number;
  notifications: WaiterNotification[];
  tablesOrder: string; // Nueva prop
}

export default function TablesTab({
  tables,
  processing,
  onUpdateItemStatus,
  onCancelItem,
  onCobrarMesa,
  calculateTableTotal,
  notifications,
  tablesOrder, // Recibir el orden
}: TablesTabProps) {
  const totalGeneral = tables.reduce(
    (sum, table) => sum + calculateTableTotal(table),
    0
  );
  const occupiedTablesCount = tables.filter(
    (t) => t.status === "occupied"
  ).length;

  // Función para obtener hora de ocupación (usando la orden más antigua)
  const getTableOccupationTime = (table: TableWithOrder): Date | null => {
    if (table.orders.length === 0) return null;

    let earliestOrder = table.orders[0];
    for (let i = 1; i < table.orders.length; i++) {
      const currentOrder = table.orders[i];
      const earliestDate = new Date(earliestOrder.created_at);
      const currentDate = new Date(currentOrder.created_at);
      if (currentDate < earliestDate) {
        earliestOrder = currentOrder;
      }
    }

    return new Date(earliestOrder.created_at);
  };

  // Ordenar mesas según tablesOrder
  const sortedTables = [...tables];

  if (tablesOrder === "occupation") {
    sortedTables.sort((a, b) => {
      const timeA = getTableOccupationTime(a);
      const timeB = getTableOccupationTime(b);

      if (!timeA && !timeB) return 0;
      if (!timeA) return 1;
      if (!timeB) return -1;

      return timeA.getTime() - timeB.getTime(); // Más antiguas primero
    });
  } else {
    // Orden por número (default)
    sortedTables.sort((a, b) => a.number - b.number);
  }

  // Calcular tiempo de ocupación para display
  const getOccupationDisplay = (table: TableWithOrder): string => {
    const occupationTime = getTableOccupationTime(table);
    if (!occupationTime) return "Sin pedidos";

    const now = new Date();
    const diffMs = now.getTime() - occupationTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Recién";
    if (diffMinutes < 60) return `${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} h`;
  };

  // Encontrar la mesa más antigua para destacar (solo si ordenamos por ocupación)
  const oldestTableIndex =
    tablesOrder === "occupation"
      ? sortedTables.findIndex(
          (table) =>
            table.status === "occupied" &&
            getTableOccupationTime(table) !== null
        )
      : -1;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Cuentas por Mesa
        </h2>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Estadísticas */}
          <div className="text-sm text-gray-600">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
              {occupiedTablesCount} mesas ocupadas
            </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              <FaDollarSign className="inline mr-1" />
              Total: ${totalGeneral.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTables.map((table, index) => {
          const occupationTime = getOccupationDisplay(table);
          let hasNotifications = false;

          for (const notification of notifications) {
            if (notification.table_id === table.id) {
              hasNotifications = true;
              break;
            }
          }

          const isOldest =
            tablesOrder === "occupation" && index === oldestTableIndex;

          return (
            <div key={table.id} className="relative">
              {/* Badge de posición solo cuando ordenamos por ocupación */}
              {tablesOrder === "occupation" &&
                table.status === "occupied" &&
                index < 3 && (
                  <div className="absolute -top-2 -right-2 z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === oldestTableIndex
                          ? "bg-red-500"
                          : index === oldestTableIndex + 1
                          ? "bg-orange-500"
                          : "bg-blue-500"
                      }`}
                    >
                      #{index + 1}
                    </div>
                  </div>
                )}

              <TableCard
                table={table}
                processing={processing}
                onUpdateItemStatus={onUpdateItemStatus}
                onCancelItem={onCancelItem}
                onCobrarMesa={onCobrarMesa}
                calculateTableTotal={calculateTableTotal}
                notifications={notifications}
                // Props adicionales
                occupationTime={occupationTime}
                hasNotifications={hasNotifications}
                isHighlighted={isOldest}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
