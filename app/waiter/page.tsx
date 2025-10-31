/* eslint-disable @typescript-eslint/no-explicit-any */
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
  FaDollarSign,
  FaTrash,
} from "react-icons/fa";

export default function WaiterDashboard() {
  const [notifications, setNotifications] = useState<WaiterNotification[]>([]);
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"notifications" | "tables">(
    "notifications"
  );
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [attendedNotifications, setAttendedNotifications] = useState<
    Set<string>
  >(new Set());

  useEffect(() => {
    loadData();
    const unsubscribe = setupRealtimeSubscription();

    const interval = setInterval(() => {
      loadData();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsData, tablesData] = await Promise.all([
        waiterService.getPendingNotifications(),
        waiterService.getTablesWithOrders(),
      ]);

      setNotifications(notifsData);
      setTables(tablesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const notificationsSub = supabase
      .channel("waiter-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_notifications",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    const ordersSub = supabase
      .channel("waiter-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    const orderItemsSub = supabase
      .channel("waiter-order-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          loadData();
        }
      )
      .subscribe();

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
      ordersSub.unsubscribe();
      orderItemsSub.unsubscribe();
      tablesSub.unsubscribe();
    };
  };

  const handleAcknowledgeNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      setAttendedNotifications((prev) => new Set(prev).add(notificationId));
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
      setAttendedNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
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

  const handleCobrarMesa = async (tableId: number, tableNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    const tableTotal = table ? calculateTableTotal(table) : 0;

    if (
      !confirm(
        `¿Estás seguro de que quieres COBRAR la Mesa ${tableNumber}?\n\n💰 Total: $${tableTotal.toFixed(
          2
        )}\n\n📊 Se guardará el historial de venta y se liberará la mesa.`
      )
    ) {
      return;
    }

    setProcessing(`cobrar-${tableId}`);
    try {
      console.log(`💵 Iniciando cobro para mesa ${tableNumber}`);

      // Usar la función actualizada que guarda el historial primero
      await waiterService.freeTableAndClean(tableId, tableNumber);

      alert(
        `✅ Mesa ${tableNumber} cobrada exitosamente!\n\n💰 Total: $${tableTotal.toFixed(
          2
        )}\n📈 Historial guardado correctamente`
      );

      // Recargar datos
      await loadData();
    } catch (error: any) {
      console.error("Error cobrando mesa:", error);
      alert(`❌ Error al cobrar la mesa ${tableNumber}:\n${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleGoToTables = () => {
    setActiveTab("tables");
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

  // Calcular total acumulado de TODAS las órdenes de la mesa
  const calculateTableTotal = (table: TableWithOrder) => {
    return table.orders.reduce((total, order) => total + order.total_amount, 0);
  };

  // Calcular total de items
  const calculateTotalItems = (table: TableWithOrder) => {
    return table.orders.reduce(
      (total, order) =>
        total + order.order_items.reduce((sum, item) => sum + item.quantity, 0),
      0
    );
  };

  // Calcular items por estado
  const calculateItemsByStatus = (table: TableWithOrder) => {
    const pending = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter(
          (item) => item.status === "ordered" || item.status === "preparing"
        ).length,
      0
    );

    const ready = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter((item) => item.status === "ready").length,
      0
    );

    const served = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter((item) => item.status === "served").length,
      0
    );

    return { pending, ready, served };
  };

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
              <p className="text-gray-600">
                Pedidos enviados y cuentas por mesa
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
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
              Notificaciones ({notifications.length})
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
              Mesas y Cuentas (
              {tables.filter((t) => t.status === "occupied").length})
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
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay notificaciones pendientes
                </h3>
                <p className="text-gray-500">Todo está bajo control</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => {
                  const isAttended = attendedNotifications.has(notification.id);

                  return (
                    <div
                      key={notification.id}
                      className={`bg-white rounded-lg shadow border-l-4 ${getNotificationColor(
                        notification.type
                      )} p-4 ${isAttended ? "opacity-70" : ""}`}
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
                              {isAttended && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Atendida
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
                              {new Date(
                                notification.created_at
                              ).toLocaleString()}
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
                          {!isAttended && (
                            <button
                              onClick={() => {
                                handleAcknowledgeNotification(notification.id);
                                handleGoToTables();
                              }}
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
                          )}

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
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "tables" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Cuentas por Mesa
              </h2>
              <div className="text-sm text-gray-600">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                  {tables.filter((t) => t.status === "occupied").length} mesas
                  ocupadas
                </span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  <FaDollarSign className="inline mr-1" />
                  Total general: $
                  {tables
                    .reduce((sum, table) => sum + calculateTableTotal(table), 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map((table) => {
                const tableTotal = calculateTableTotal(table);
                const totalItems = calculateTotalItems(table);
                const statusCounts = calculateItemsByStatus(table);

                return (
                  <div
                    key={table.id}
                    className={`bg-white rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
                      table.status === "occupied"
                        ? "border-l-4 border-l-green-500"
                        : table.status === "reserved"
                        ? "border-l-4 border-l-yellow-500"
                        : "border-l-4 border-l-gray-300"
                    }`}
                  >
                    {/* ENCABEZADO DE MESA CON TOTAL A PAGAR */}
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

                      {table.status === "occupied" &&
                        table.orders.length > 0 && (
                          <button
                            onClick={() =>
                              handleCobrarMesa(table.id, table.number)
                            }
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

                    {/* DETALLE COMPLETO DE TODOS LOS PRODUCTOS */}
                    {table.orders.map((order) => (
                      <div
                        key={order.id}
                        className="mt-4 pt-4 border-t border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-sm text-gray-700">
                              Orden #{order.id.slice(-8)}
                            </p>
                            {order.customer_name && (
                              <p className="text-xs text-gray-600">
                                Cliente: {order.customer_name}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              order.status === "sent"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {order.status === "sent" ? "Enviada" : "Completada"}
                          </span>
                        </div>

                        {/* LISTA DE TODOS LOS PRODUCTOS DE ESTA ORDEN */}
                        <div className="space-y-2">
                          {order.order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-start text-sm bg-gray-50 p-2 rounded"
                            >
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {item.product_name} × {item.quantity}
                                  </span>
                                  <span className="font-semibold text-green-600">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-gray-500">
                                    ${item.price.toFixed(2)} c/u
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
                                      <option value="preparing">
                                        Preparando
                                      </option>
                                      <option value="ready">Listo</option>
                                      <option value="served">Servido</option>
                                    </select>
                                    {processing === item.id && (
                                      <FaSpinner className="animate-spin text-blue-500" />
                                    )}
                                  </div>
                                </div>
                                {item.notes && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    <strong>Nota:</strong> {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">
                              Subtotal esta orden:
                            </span>
                            <span className="font-bold text-blue-600">
                              ${order.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </div> */}
                      </div>
                    ))}

                    {/* TOTAL FINAL DE LA MESA */}
                    {tableTotal > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg text-gray-800">
                            TOTAL A PAGAR:
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            ${tableTotal.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-center">
                          {table.orders.length} órdenes enviadas
                        </p>
                      </div>
                    )}

                    {/* ESTADO VACÍO */}
                    {table.orders.length === 0 &&
                      table.status === "occupied" && (
                        <div className="text-center py-6 text-gray-500 text-sm">
                          <FaUtensils className="text-2xl text-gray-300 mx-auto mb-2" />
                          No hay pedidos enviados
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
