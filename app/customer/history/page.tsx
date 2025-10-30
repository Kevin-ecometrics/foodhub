"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/app/context/OrderContext";
import { historyService, OrderWithItems } from "@/app/lib/supabase/history";
import {
  FaHistory,
  FaUtensils,
  FaBell,
  FaReceipt,
  FaSpinner,
  FaExclamationTriangle,
  FaSync,
  FaQrcode,
  FaCheck,
  FaClock,
  FaUtensilSpoon,
} from "react-icons/fa";
import { supabase } from "@/app/lib/supabase/client";

// Definir tipo para cálculos de impuestos
interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  total: number;
}

// Tipo para estado de orden
type OrderStatus = "active" | "sent" | "completed" | "paid";

export default function HistoryPage() {
  const router = useRouter();
  const [tableId, setTableId] = useState<string | null>(null);
  const { currentOrder, orderItems, currentTableId, refreshOrder } = useOrder();

  const [orderHistory, setOrderHistory] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [error, setError] = useState("");

  // Refs para prevenir loops infinitos
  const isSubscribedRef = useRef(false);
  const lastUpdateRef = useRef<number>(0);

  // Leer query params del cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setTableId(params.get("table"));
    }
  }, []);

  // Calcular impuestos y totales
  const calculateTaxes = (items: typeof orderItems): TaxCalculation => {
    const subtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxRate = 0.16;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      total,
    };
  };

  const currentOrderCalculations = calculateTaxes(orderItems);

  // Calcular totales para órdenes del historial
  const calculateOrderTotal = (order: OrderWithItems): number => {
    return order.order_items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

  // Obtener texto del estado de la orden
  const getStatusText = (status: OrderStatus): string => {
    const statusMap = {
      active: "En preparación",
      sent: "Enviada a cocina",
      completed: "Completada",
      paid: "Pagada",
    };
    return statusMap[status] || status;
  };

  // Obtener color del estado
  const getStatusColor = (status: OrderStatus): string => {
    const colorMap = {
      active: "bg-yellow-100 text-yellow-800",
      sent: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      paid: "bg-purple-100 text-purple-800",
    };
    return colorMap[status] || "bg-gray-100 text-gray-800";
  };

  // Obtener ícono del estado
  const getStatusIcon = (status: OrderStatus) => {
    const iconMap = {
      active: FaUtensilSpoon,
      sent: FaClock,
      completed: FaCheck,
      paid: FaCheck,
    };
    return iconMap[status] || FaHistory;
  };

  const loadHistory = async (tableId: number) => {
    try {
      setLoading(true);
      setError("");

      const history = await historyService.getCustomerOrderHistory(tableId);
      console.log("📊 Historial cargado:", history.length, "órdenes");

      setOrderHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
      setError("Error cargando el historial");
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const targetTableId = tableId || currentTableId;

    if (targetTableId) {
      await loadHistory(parseInt(targetTableId.toString()));
      // También refrescar la orden actual para obtener los últimos items
      if (currentTableId) {
        await refreshOrder(currentTableId);
      }
    } else {
      setError("No se encontró el número de mesa");
      setTimeout(() => {
        router.push("/customer");
      }, 3000);
    }
  };

  useEffect(() => {
    if (tableId === null) return; // Esperar a que tableId esté disponible
    loadData();
  }, [tableId, currentTableId, router]);

  // SUSCRIPCIÓN EN TIEMPO REAL MEJORADA
  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId || isSubscribedRef.current) return;

    console.log("🔔 History: Iniciando suscripción para cambios en órdenes");
    isSubscribedRef.current = true;

    // Función debounced para prevenir actualizaciones rápidas
    const debouncedUpdate = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > 2000) {
        lastUpdateRef.current = now;
        loadData();
      }
    };

    // Suscripción para cambios en órdenes
    const orderSubscription = supabase
      .channel(`history-orders-${targetTableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `table_id=eq.${targetTableId}`,
        },
        async (payload) => {
          console.log(
            "📦 History: Cambio en orden detectado:",
            payload.eventType
          );
          debouncedUpdate();
        }
      )
      .subscribe((status) => {
        console.log("History: Estado de suscripción a órdenes:", status);
      });

    // Suscripción para cambios en items de orden
    const orderItemsSubscription = supabase
      .channel(`history-order-items-${targetTableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        async (payload) => {
          console.log("📦 History: Cambio en items detectado");
          debouncedUpdate();
        }
      )
      .subscribe((status) => {
        console.log("History: Estado de suscripción a items:", status);
      });

    // Suscripción para notificaciones del mesero (mesa liberada)
    const notificationSubscription = supabase
      .channel(`customer-history-table-${targetTableId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waiter_notifications",
          filter: `table_id=eq.${targetTableId}`,
        },
        (payload) => {
          console.log("📨 History: Notificación recibida:", payload.new.type);

          if (payload.new.type === "table_freed") {
            console.log("🚨 History: Mesa liberada - Redirigiendo...");
            alert("✅ La cuenta ha sido cerrada. Gracias por su visita!");
            window.location.href = "/customer";
          }
        }
      )
      .subscribe((status) => {
        console.log("History: Estado de suscripción a notificaciones:", status);
      });

    return () => {
      console.log("🧹 History: Limpiando suscripciones");
      orderSubscription.unsubscribe();
      orderItemsSubscription.unsubscribe();
      notificationSubscription.unsubscribe();
      isSubscribedRef.current = false;
    };
  }, [tableId, currentTableId]);

  const handleAssistanceRequest = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    setAssistanceLoading(true);
    try {
      await historyService.requestAssistance(
        parseInt(targetTableId.toString())
      );
      alert("✅ El mesero ha sido notificado. Pronto te atenderá.");
    } catch (error) {
      console.error("Error requesting assistance:", error);
      alert("❌ Error al solicitar asistencia");
    } finally {
      setAssistanceLoading(false);
    }
  };

  const handleBillRequest = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    setBillLoading(true);
    try {
      await historyService.requestBill(
        parseInt(targetTableId.toString()),
        currentOrder?.id
      );
      alert("✅ Se ha solicitado la cuenta. El mesero te traerá tu factura.");

      setTimeout(() => {
        router.push(`/customer/payment?table=${targetTableId}`);
      }, 2000);
    } catch (error) {
      console.error("Error requesting bill:", error);
      alert("❌ Error al solicitar la cuenta");
    } finally {
      setBillLoading(false);
    }
  };

  const handleRefresh = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    await loadHistory(parseInt(targetTableId.toString()));
    if (currentTableId) {
      await refreshOrder(currentTableId);
    }
  };

  // Mostrar loading mientras se obtiene tableId
  if (tableId === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">
            Redirigiendo al inicio...
          </p>
        </div>
      </div>
    );
  }

  const targetTableId = tableId || currentTableId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
          {/* Título y mesa */}
          <div className="text-center md:text-left mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">
              Historial de Pedidos
            </h1>
            <p className="text-sm text-gray-500">Mesa {targetTableId}</p>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex-1 md:flex-none bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>

            <button
              onClick={handleAssistanceRequest}
              disabled={assistanceLoading}
              className="flex-1 md:flex-none bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaBell />
              {assistanceLoading ? "Enviando..." : "Ayuda"}
            </button>

            <button
              onClick={handleBillRequest}
              disabled={billLoading}
              className="flex-1 md:flex-none bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaReceipt />
              {billLoading ? "Solicitando..." : "Cuenta"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Orden Actual */}
        {currentOrder && orderItems.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaUtensils />
              Orden Actual
              <span className="text-sm font-normal bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                En preparación
              </span>
            </h2>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Header del Ticket */}
              <div className="bg-gray-800 text-white p-6 text-center">
                <h3 className="text-xl font-bold">RESTAURANTE</h3>
                <p className="text-gray-300 text-sm">Mesa {targetTableId}</p>
                <p className="text-gray-300 text-sm">
                  Orden #: {currentOrder.id.slice(-8)}
                </p>
                <p className="text-gray-300 text-sm">
                  {new Date(currentOrder.created_at).toLocaleString()}
                </p>
              </div>

              {/* Items de la Orden */}
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start py-3 border-b border-gray-100"
                    >
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-semibold text-gray-800">
                              {item.product_name}
                            </span>
                            {item.notes && (
                              <p className="text-sm text-gray-500 mt-1">
                                Nota: {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-800">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              ${item.price.toFixed(2)} × {item.quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen de Pagos */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>${currentOrderCalculations.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Impuestos (16%):</span>
                    <span>
                      ${currentOrderCalculations.taxAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-800 border-t border-gray-200 pt-2">
                    <span>Total:</span>
                    <span>${currentOrderCalculations.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer del Ticket */}
              <div className="bg-gray-50 p-4 text-center text-sm text-gray-500">
                <p>¡Gracias por su preferencia!</p>
                <p>Para solicitar la cuenta, presione el botón Cuenta</p>
              </div>
            </div>
          </div>
        )}

        {/* Historial de Órdenes Enviadas */}
        {orderHistory.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaHistory />
              Órdenes Anteriores
            </h2>

            <div className="space-y-4">
              {orderHistory.map((order) => {
                const StatusIcon = getStatusIcon(order.status as OrderStatus);
                const orderTotal = calculateOrderTotal(order);
                const orderCalculations = {
                  subtotal: orderTotal,
                  taxAmount: orderTotal * 0.16,
                  total: orderTotal * 1.16,
                };

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Header de la Orden Histórica */}
                    <div className="bg-blue-800 text-white p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold">
                          Orden #{order.id.slice(-8)}
                        </h3>
                        <p className="text-blue-200 text-sm">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          order.status as OrderStatus
                        )}`}
                      >
                        <StatusIcon className="inline mr-1" size={12} />
                        {getStatusText(order.status as OrderStatus)}
                      </div>
                    </div>

                    {/* Items de la Orden Histórica */}
                    <div className="p-4">
                      <div className="space-y-3 mb-4">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start py-2 border-b border-gray-100"
                          >
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="font-semibold text-gray-800">
                                    {item.product_name}
                                  </span>
                                  {item.notes && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Nota: {item.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-800">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ${item.price.toFixed(2)} × {item.quantity}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Resumen de la Orden Histórica */}
                      <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal:</span>
                          <span>${orderCalculations.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Impuestos (16%):</span>
                          <span>${orderCalculations.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-800 border-t border-gray-200 pt-2">
                          <span>Total:</span>
                          <span>${orderCalculations.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!currentOrder && orderHistory.length === 0 && (
          <div className="text-center py-12">
            <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay órdenes
            </h3>
            <p className="text-gray-500">
              Aún no has realizado ningún pedido en esta mesa
            </p>
            <button
              onClick={() =>
                router.push(`/customer/menu?table=${targetTableId}`)
              }
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
            >
              Hacer mi primer pedido
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="max-w-7xl mx-auto flex justify-around py-3">
          <button
            onClick={() => router.push(`/customer/menu?table=${targetTableId}`)}
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaUtensils className="text-2xl mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
          <button className="flex flex-col items-center text-blue-600">
            <FaHistory className="text-2xl mb-1" />
            <span className="text-xs font-medium">Historial</span>
          </button>
          <button
            onClick={() => router.push(`/customer/qr?table=${targetTableId}`)}
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaQrcode className="text-2xl mb-1" />
            <span className="text-xs font-medium">Mi QR</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
