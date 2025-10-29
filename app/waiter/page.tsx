"use client";
import { useEffect, useState } from "react";
import {
  waiterService,
  WaiterNotification,
  TableWithOrder,
} from "@/app/lib/supabase/waiter";
import { supabase } from "@/app/lib/supabase/client";
import {
  FaBell,
  FaUtensils,
  FaTable,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaEye,
  FaCheckCircle,
  FaReceipt,
  FaSync,
  FaStore,
} from "react-icons/fa";

// Lista de sucursales disponibles
const BRANCHES = [
  "Hermosillo - Plaza Dila",
  "Hermosillo - Plaza Valles",
  "Hermosillo – Gallerías Mall",
  "Hermosillo – Plaza Patio",
  "Hermosillo - Plaza Progreso",
  "Ciudad Obregón - Miguel Alemán",
  "Ciudad Obregón - Plaza Bellavista",
  "San Luis Río Colorado",
  "Guaymas",
  "Guasave",
  "Los Mochis",
  "Mexicali - Plaza San Pedro",
  "Mexicali - Plaza Nuevo Mexicali",
  "Tijuana - Plaza Paseo 2000",
  "Tijuana - Plaza Río",
  "Cabo San Lucas",
  "La Paz",
];

export default function WaiterDashboard() {
  const [notifications, setNotifications] = useState<WaiterNotification[]>([]);
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [filteredTables, setFilteredTables] = useState<TableWithOrder[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"notifications" | "tables">(
    "notifications"
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = setupRealtimeSubscription();

    return () => {
      unsubscribe();
    };
  }, []);

  // Filtrar mesas cuando cambia la sucursal seleccionada
  useEffect(() => {
    if (selectedBranch) {
      const filtered = tables.filter(
        (table) => table.branch === selectedBranch
      );
      setFilteredTables(filtered);
    } else {
      setFilteredTables(tables);
    }
  }, [selectedBranch, tables]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsData, tablesData] = await Promise.all([
        waiterService.getPendingNotifications(),
        waiterService.getTablesWithOrders(),
      ]);
      setNotifications(notifsData);
      setTables(tablesData);

      // Si no hay sucursal seleccionada, seleccionar la primera por defecto
      if (!selectedBranch && tablesData.length > 0) {
        setSelectedBranch(tablesData[0].branch);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Suscripción a nuevas notificaciones
    const notificationsSub = supabase
      .channel("waiter-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waiter_notifications",
        },
        (payload) => {
          // Solo agregar si está pendiente
          if (payload.new.status === "pending") {
            setNotifications((prev) => [
              payload.new as WaiterNotification,
              ...prev,
            ]);
          }
        }
      )
      .subscribe();

    // Suscripción a cambios en mesas
    const tablesSub = supabase
      .channel("waiter-tables")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      notificationsSub.unsubscribe();
      tablesSub.unsubscribe();
    };
  };

  const handleAcknowledgeNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await waiterService.acknowledgeNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error acknowledging notification:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await waiterService.completeNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error("Error completing notification:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    setProcessing(itemId);
    try {
      await waiterService.updateItemStatus(itemId, newStatus as never);
      await loadData();
    } catch (error) {
      console.error("Error updating item status:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleFreeTable = async (tableId: number) => {
    setProcessing(`table-${tableId}`);
    try {
      // 1. Buscar la orden activa de esta mesa
      const table = tables.find((t) => t.id === tableId);
      if (table && table.orders.length > 0) {
        // 2. Completar todas las órdenes activas de esta mesa
        for (const order of table.orders) {
          await waiterService.completeOrder(order.id);
        }
      }

      // 3. Liberar la mesa
      await waiterService.freeTable(tableId);

      // 4. ✅ CREAR NOTIFICACIÓN TABLE_FREED (IMPORTANTE)
      console.log("Creando notificación table_freed para mesa:", tableId);
      await waiterService.notifyTableFreed(tableId);

      // 5. Recargar datos
      await loadData();
    } catch (error) {
      console.error("Error freeing table:", error);
      alert("Error al liberar la mesa: " + error);
    } finally {
      setProcessing(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_order":
        return <FaUtensils className="text-green-500" />;
      case "assistance":
        return <FaBell className="text-yellow-500" />;
      case "bill_request":
        return <FaReceipt className="text-red-500" />;
      case "order_updated":
        return <FaExclamationTriangle className="text-blue-500" />;
      case "table_freed":
        return <FaCheckCircle className="text-purple-500" />;
      default:
        return <FaBell className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "new_order":
        return "border-l-green-500";
      case "assistance":
        return "border-l-yellow-500";
      case "bill_request":
        return "border-l-red-500";
      case "order_updated":
        return "border-l-blue-500";
      case "table_freed":
        return "border-l-purple-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "served":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filtrar notificaciones por sucursal seleccionada
  const filteredNotifications = selectedBranch
    ? notifications.filter(
        (notification) =>
          // Check if branch exists before comparing
          "branch" in (notification.tables ?? {}) &&
          (notification.tables as { branch?: string }).branch === selectedBranch
      )
    : notifications;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando panel del mesero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Panel del Mesero
              </h1>
              <p className="text-gray-600">Gestión de mesas y notificaciones</p>
            </div>

            {/* ✅ BOTÓN REFRESH */}
            <button
              onClick={loadData}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {/* Selector de Sucursal */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaStore className="text-blue-600" />
              <label className="text-sm font-medium text-gray-700">
                Sucursal:
              </label>
            </div>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="">Todas las sucursales</option>
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            {selectedBranch && (
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {filteredTables.length} mesas en {selectedBranch}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "notifications"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaBell className="inline mr-2" />
              Notificaciones ({filteredNotifications.length})
            </button>
            <button
              onClick={() => setActiveTab("tables")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tables"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FaTable className="inline mr-2" />
              Mesas (
              {filteredTables.filter((t) => t.status === "occupied").length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "notifications" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Notificaciones Pendientes
              </h2>
              {selectedBranch && (
                <span className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full">
                  Sucursal: {selectedBranch}
                </span>
              )}
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay notificaciones pendientes
                  {selectedBranch && ` en ${selectedBranch}`}
                </h3>
                <p className="text-gray-500">Todo está bajo control</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-lg shadow border-l-4 ${getNotificationColor(
                      notification.type
                    )} p-4`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">
                              Mesa {notification.tables?.number}
                            </h3>
                            {notification.tables?.number && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {notification.tables.number}
                              </span>
                            )}
                          </div>
                          {notification.orders?.customer_name && (
                            <p className="text-gray-600">
                              Cliente: {notification.orders.customer_name}
                            </p>
                          )}
                          <p className="text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          {notification.orders?.total_amount && (
                            <p className="text-sm font-semibold text-green-600 mt-1">
                              Total: $
                              {notification.orders.total_amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            handleAcknowledgeNotification(notification.id)
                          }
                          disabled={processing === notification.id}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50 flex items-center"
                        >
                          {processing === notification.id ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaEye className="mr-1" />
                          )}
                          Atender
                        </button>

                        <button
                          onClick={() =>
                            handleCompleteNotification(notification.id)
                          }
                          disabled={processing === notification.id}
                          className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50 flex items-center"
                        >
                          {processing === notification.id ? (
                            <FaSpinner className="animate-spin mr-1" />
                          ) : (
                            <FaCheck className="mr-1" />
                          )}
                          Completar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "tables" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Estado de Mesas
              </h2>
              {selectedBranch && (
                <span className="text-sm text-gray-500 bg-blue-100 px-3 py-1 rounded-full">
                  Sucursal: {selectedBranch}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTables.map((table) => (
                <div
                  key={table.id}
                  className={`bg-white rounded-lg shadow p-4 ${
                    table.status === "occupied"
                      ? "border-l-4 border-l-green-500"
                      : table.status === "reserved"
                      ? "border-l-4 border-l-yellow-500"
                      : "border-l-4 border-l-gray-300"
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        Mesa {table.number}
                      </h3>
                      <p className="text-xs text-gray-500 mb-1">
                        {table.branch}
                      </p>
                      <p
                        className={`text-sm ${
                          table.status === "occupied"
                            ? "text-green-600"
                            : table.status === "reserved"
                            ? "text-yellow-600"
                            : "text-gray-500"
                        }`}
                      >
                        {table.status === "occupied"
                          ? "🟢 Ocupada"
                          : table.status === "reserved"
                          ? "🟡 Reservada"
                          : "⚪ Disponible"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {table.location} • {table.capacity} personas
                      </p>
                    </div>

                    {table.status === "occupied" && table.orders.length > 0 && (
                      <button
                        onClick={() => handleFreeTable(table.id)}
                        disabled={processing === `table-${table.id}`}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                      >
                        {processing === `table-${table.id}` ? (
                          <FaSpinner className="animate-spin" />
                        ) : (
                          "Liberar"
                        )}
                      </button>
                    )}
                  </div>

                  {table.orders.map((order) => (
                    <div key={order.id} className="mt-3 pt-3 border-t">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            Orden #{order.id.slice(-8)}
                          </p>
                          {order.customer_name && (
                            <p className="text-sm text-gray-600">
                              Cliente: {order.customer_name}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-green-600">
                            Total: ${order.total_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <span className="flex-1">
                              {item.product_name} × {item.quantity}
                            </span>
                            <div className="flex items-center space-x-2">
                              <select
                                value={item.status}
                                onChange={(e) =>
                                  handleUpdateItemStatus(
                                    item.id,
                                    e.target.value
                                  )
                                }
                                disabled={processing === item.id}
                                className={`text-xs rounded px-2 py-1 ${getStatusColor(
                                  item.status
                                )}`}
                              >
                                <option value="ordered">Ordenado</option>
                                <option value="preparing">Preparando</option>
                                <option value="ready">Listo</option>
                                <option value="served">Servido</option>
                              </select>
                              {processing === item.id && (
                                <FaSpinner className="animate-spin text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
