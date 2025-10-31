// app/customer/payment/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/app/context/OrderContext";
import { historyService, OrderWithItems } from "@/app/lib/supabase/history";
import {
  FaArrowLeft,
  FaCheck,
  FaReceipt,
  FaUtensils,
  FaClock,
  FaSpinner,
  FaExclamationTriangle,
  FaUser,
} from "react-icons/fa";

interface PaymentSummary {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
}

interface CustomerOrderSummary {
  customerName: string;
  orders: OrderWithItems[];
  subtotal: number;
  taxAmount: number;
  total: number;
  itemsCount: number;
}

export default function PaymentPage() {
  const router = useRouter();
  const {
    currentOrder,
    orderItems,
    currentTableId,
    currentUserId,
    refreshOrder,
  } = useOrder();

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");

  // Cargar todas las órdenes pendientes de pago cuando el contexto esté listo
  useEffect(() => {
    const loadAllOrders = async () => {
      if (!currentTableId) {
        console.log("⏳ Payment: Esperando tableId del contexto...");
        return;
      }

      try {
        setLoading(true);
        setError("");

        // Obtener todas las órdenes de la mesa (activas + enviadas)
        const orders = await historyService.getCustomerOrderHistory(
          currentTableId
        );

        // Filtrar solo órdenes pendientes de pago (active + sent)
        const pendingOrders = orders.filter(
          (order) => order.status === "active" || order.status === "sent"
        );

        setAllOrders(pendingOrders);

        console.log("📊 Órdenes para pago:", {
          total: orders.length,
          pending: pendingOrders.length,
          orders: pendingOrders.map((o) => ({
            id: o.id.slice(-8),
            customer: o.customer_name,
            status: o.status,
            items: o.order_items.length,
            total: o.order_items.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ),
          })),
        });

        if (pendingOrders.length === 0) {
          setError("No hay órdenes pendientes de pago");
        }
      } catch (error) {
        console.error("Error loading orders for payment:", error);
        setError("Error cargando las órdenes para pago");
      } finally {
        setLoading(false);
      }
    };

    loadAllOrders();
  }, [currentTableId]);

  // Agrupar órdenes por cliente
  const groupOrdersByCustomer = (): CustomerOrderSummary[] => {
    const customerMap = new Map<string, CustomerOrderSummary>();

    allOrders.forEach((order) => {
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

      // Calcular subtotal de esta orden
      const orderSubtotal = order.order_items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      customerSummary.subtotal += orderSubtotal;
      customerSummary.itemsCount += order.order_items.length;
    });

    // Calcular impuestos y totales para cada cliente
    const taxRate = 0.16;
    customerMap.forEach((customerSummary) => {
      customerSummary.taxAmount = customerSummary.subtotal * taxRate;
      customerSummary.total =
        customerSummary.subtotal + customerSummary.taxAmount;
    });

    return Array.from(customerMap.values());
  };

  // Calcular resumen de TODAS las órdenes pendientes
  const calculateTotalPaymentSummary = (): PaymentSummary => {
    let subtotal = 0;

    // Sumar todos los items de todas las órdenes pendientes
    allOrders.forEach((order) => {
      order.order_items.forEach((item) => {
        subtotal += item.price * item.quantity;
      });
    });

    const taxRate = 0.16; // 16% de impuesto
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      total,
      taxRate,
    };
  };

  const customerSummaries = groupOrdersByCustomer();
  const paymentSummary = calculateTotalPaymentSummary();

  // Countdown para redirección después del pago
  useEffect(() => {
    if (paymentConfirmed && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (paymentConfirmed && countdown === 0) {
      router.push("/");
    }
  }, [paymentConfirmed, countdown, router]);

  // Método de confirmación de pago
  const handlePaymentConfirmation = async () => {
    try {
      // Aquí podrías agregar lógica para marcar las órdenes como pagadas
      // Por ahora solo confirmamos el pago visualmente
      setPaymentConfirmed(true);

      console.log(
        "✅ Pago confirmado para clientes:",
        customerSummaries.map((c) => ({
          customer: c.customerName,
          orders: c.orders.length,
          total: c.total,
        }))
      );
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("❌ Error al confirmar el pago. Intenta nuevamente.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      active: "En preparación",
      sent: "Enviada a cocina",
      completed: "Completada",
      paid: "Pagada",
    };
    return statusMap[status] || status;
  };

  // Mostrar loading mientras se obtienen datos del contexto
  if (!currentTableId || !currentOrder?.id || !currentUserId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de la mesa...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando ticket de pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{error}</h2>
          <p className="text-gray-600 mb-4">
            No hay órdenes pendientes de pago en esta mesa.
          </p>
          <button
            onClick={() =>
              router.push(
                `/customer/menu?table=${currentTableId}&user=${currentUserId}&order=${currentOrder.id}`
              )
            }
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaReceipt className="text-4xl text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No hay órdenes para pagar
          </h2>
          <p className="text-gray-600 mb-4">
            Todas las órdenes de esta mesa ya han sido pagadas o no hay órdenes
            activas.
          </p>
          <button
            onClick={() =>
              router.push(
                `/customer/menu?table=${currentTableId}&user=${currentUserId}&order=${currentOrder.id}`
              )
            }
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheck className="text-4xl text-green-500" />
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Gracias por su visita!
          </h2>

          <p className="text-lg text-gray-600 mb-2">
            Gracias por comer en nuestro restaurante.
          </p>
          <p className="text-gray-600 mb-6">Esperamos volver a verle pronto.</p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Comensales:{" "}
              <span className="font-semibold">{customerSummaries.length}</span>
            </p>
            <p className="text-sm text-gray-600">
              Órdenes pagadas:{" "}
              <span className="font-semibold">{allOrders.length}</span>
            </p>
            <p className="text-sm text-gray-600">
              Total pagado:{" "}
              <span className="font-semibold text-green-600">
                {formatCurrency(paymentSummary.subtotal)}
              </span>
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
              <FaClock />
              <span className="font-semibold">
                Redirigiendo en {countdown} segundos...
              </span>
            </div>
            <p className="text-sm text-blue-600">
              Será dirigido automáticamente a la página principal
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Ticket de Pago
                </h1>
                <p className="text-sm text-gray-500">Mesa {currentTableId}</p>
                <p className="text-sm text-blue-600 font-medium">
                  {customerSummaries.length} comensal
                  {customerSummaries.length > 1 ? "es" : ""} •{" "}
                  {allOrders.length} orden{allOrders.length > 1 ? "es" : ""}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(paymentSummary.subtotal)}
              </p>
              <p className="text-sm text-gray-500">Total a pagar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Resumen de todas las órdenes */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Header del Ticket */}
          <div className="bg-gray-800 text-white p-6 text-center">
            <h3 className="text-2xl font-bold">RESTAURANTE</h3>
            <p className="text-gray-300 text-sm">Mesa {currentTableId}</p>
          </div>

          {/* Lista de órdenes agrupadas por cliente */}
          <div className="p-6">
            {customerSummaries.map((customerSummary, customerIndex) => (
              <div
                key={customerSummary.customerName}
                className="mb-8 last:mb-0"
              >
                {/* Header del cliente */}
                <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FaUser className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">
                          {customerSummary.customerName}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-800">
                      {formatCurrency(customerSummary.subtotal)}
                    </p>
                  </div>
                </div>

                {/* Items de todas las órdenes de este cliente */}
                <div className="space-y-4 mb-4">
                  {customerSummary.orders.map((order, orderIndex) => (
                    <div key={order.id}>
                      {/* Info de la orden individual si hay más de una */}
                      {customerSummary.orders.length > 1 && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg"></div>
                      )}

                      {/* Items de esta orden */}
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start py-2 border-b border-gray-100"
                          >
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <span className="font-medium text-gray-800">
                                    {item.product_name}
                                  </span>
                                  <div className="text-sm text-gray-500 mt-1">
                                    Cantidad: {item.quantity}
                                  </div>
                                  {item.notes && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      Nota: {item.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium text-gray-800">
                                    {formatCurrency(item.price * item.quantity)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatCurrency(item.price)} c/u
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Separador entre órdenes del mismo cliente */}
                      {orderIndex < customerSummary.orders.length - 1 && (
                        <div className="border-t border-gray-200 my-4"></div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Resumen del cliente */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-300 pt-2">
                    <span>Total de {customerSummary.customerName}:</span>
                    <span>{formatCurrency(customerSummary.subtotal)}</span>
                  </div>
                </div>

                {/* Separador entre clientes */}
                {customerIndex < customerSummaries.length - 1 && (
                  <div className="border-t border-gray-300 my-6"></div>
                )}
              </div>
            ))}

            {/* Resumen FINAL de todos los pagos */}
            <div className="border-t border-gray-200 pt-6 space-y-3">
              <div className="flex justify-between text-2xl font-bold text-gray-800 border-t border-gray-200 pt-4">
                <span>TOTAL GENERAL:</span>
                <span>{formatCurrency(paymentSummary.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer del Ticket */}
          <div className="bg-gray-50 p-6 text-center text-sm text-gray-500 border-t">
            <p className="font-medium mb-2">¡Gracias por su preferencia!</p>
            <p>
              Por favor, espere a que el mesero le traiga la terminal de pago
            </p>
          </div>
        </div>

        {/* Botón de Confirmación de Pago */}
        <div className="text-center">
          <button
            onClick={handlePaymentConfirmation}
            className="bg-green-500 text-white px-8 py-4 rounded-xl hover:bg-green-600 transition font-semibold text-lg flex items-center justify-center gap-3 mx-auto"
          >
            <FaCheck className="text-xl" />
            Ya Pagué
          </button>
          <p className="text-gray-500 text-sm mt-3">
            Presione este botón cuando haya completado su pago con el mesero
          </p>
        </div>
      </main>
    </div>
  );
}
