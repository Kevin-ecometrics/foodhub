"use client";
import { useEffect, useState } from "react";
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
} from "react-icons/fa";
import { supabase } from "@/app/lib/supabase/client";

// Definir tipo para cálculos de impuestos
interface TaxCalculation {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const [tableId, setTableId] = useState<string | null>(null);
  const { currentOrder, orderItems, currentTableId } = useOrder();

  const [orderHistory, setOrderHistory] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (tableId === null) return; // Esperar a que tableId esté disponible

    const loadData = async () => {
      const targetTableId = tableId || currentTableId;

      if (targetTableId) {
        await loadHistory(parseInt(targetTableId.toString()));
      } else {
        setError("No se encontró el número de mesa");
        setTimeout(() => {
          router.push("/customer");
        }, 3000);
      }
    };

    loadData();
  }, [tableId, currentTableId, router]);

  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    console.log("🔔 History: Iniciando suscripción para mesa:", targetTableId);

    const subscription = supabase
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
        console.log("History: Estado de suscripción:", status);
      });

    return () => {
      console.log("🧹 History: Limpiando suscripción");
      subscription.unsubscribe();
    };
  }, [tableId, currentTableId]);

  const loadHistory = async (tableId: number) => {
    try {
      setLoading(true);
      setError("");

      const history = await historyService.getCustomerOrderHistory(
        tableId,
        currentOrder?.id
      );

      setOrderHistory(history);
    } catch (error) {
      console.error("Error loading history:", error);
      setError("Error cargando el historial");
    } finally {
      setLoading(false);
    }
  };

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
      router.push(`/customer/payment?table=${targetTableId}`);
    } catch (error) {
      console.error("Error requesting bill:", error);
      alert("❌ Error al solicitar la cuenta");
    } finally {
      setBillLoading(false);
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Historial de Pedidos
            </h1>
            <p className="text-sm text-gray-500">Mesa {targetTableId}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!targetTableId) return;
                loadHistory(parseInt(targetTableId.toString()));
              }}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>

            <button
              onClick={handleAssistanceRequest}
              disabled={assistanceLoading}
              className="bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaBell />
              {assistanceLoading ? "Enviando..." : "Ayuda"}
            </button>

            <button
              onClick={handleBillRequest}
              disabled={billLoading}
              className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <FaReceipt />
              {billLoading ? "Solicitando..." : "Cuenta"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Orden Actual */}
        {currentOrder && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaUtensils />
              Orden Actual - Ticket
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
        </div>
      </nav>
    </div>
  );
}
