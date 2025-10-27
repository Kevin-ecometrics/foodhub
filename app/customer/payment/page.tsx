// app/customer/payment/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/app/context/OrderContext";
import {
  FaArrowLeft,
  FaCheck,
  FaReceipt,
  FaUtensils,
  FaClock,
} from "react-icons/fa";

interface PaymentSummary {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
}

export default function PaymentPage() {
  const router = useRouter();
  const { currentOrder, orderItems, currentTableId } = useOrder();

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [tableId, setTableId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Obtener tableId de la URL usando useEffect de manera asíncrona
  useEffect(() => {
    // Marcar que estamos en el cliente
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);

    // Obtener parámetros de la URL
    const getTableId = () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("table");
      }
      return null;
    };

    // Usar setTimeout para evitar la actualización síncrona
    const timer = setTimeout(() => {
      setTableId(getTableId());
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Calcular resumen de pago
  const calculatePaymentSummary = (): PaymentSummary => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
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

  const paymentSummary = calculatePaymentSummary();

  // Countdown para redirección después del pago
  useEffect(() => {
    if (paymentConfirmed && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (paymentConfirmed && countdown === 0) {
      router.push("/customer");
    }
  }, [paymentConfirmed, countdown, router]);

  const handlePaymentConfirmation = () => {
    setPaymentConfirmed(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  // Mostrar loading mientras se obtiene el tableId
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!currentOrder || orderItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaUtensils className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No hay orden activa
          </h2>
          <p className="text-gray-600 mb-4">
            No hay items para mostrar en el ticket.
          </p>
          <button
            onClick={() =>
              router.push(`/customer/menu?table=${tableId || currentTableId}`)
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
              Orden:{" "}
              <span className="font-semibold">
                #{currentOrder.id.slice(-8)}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Total pagado:{" "}
              <span className="font-semibold text-green-600">
                {formatCurrency(paymentSummary.total)}
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
              <button
                onClick={() =>
                  router.push(
                    `/customer/history?table=${tableId || currentTableId}`
                  )
                }
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <FaArrowLeft className="text-xl text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Ticket de Orden
                </h1>
                <p className="text-sm text-gray-500">
                  Mesa {tableId || currentTableId}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(paymentSummary.total)}
              </p>
              <p className="text-sm text-gray-500">Total a pagar</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Ticket de Orden */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          {/* Header del Ticket */}
          <div className="bg-gray-800 text-white p-6 text-center">
            <h3 className="text-2xl font-bold">RESTAURANTE</h3>
            <p className="text-gray-300 text-sm">
              Mesa {tableId || currentTableId}
            </p>
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
              <h4 className="font-semibold text-gray-800 text-lg border-b pb-2">
                Detalles de la Orden:
              </h4>
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
                        <div className="text-sm text-gray-500 mt-1">
                          Cantidad: {item.quantity}
                        </div>
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

            {/* Resumen de Pagos */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(paymentSummary.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span className="font-medium">Impuestos (16%):</span>
                <span className="font-medium">
                  {formatCurrency(paymentSummary.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold text-gray-800 border-t border-gray-200 pt-3">
                <span>TOTAL:</span>
                <span>{formatCurrency(paymentSummary.total)}</span>
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
