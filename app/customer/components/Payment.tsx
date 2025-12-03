/* eslint-disable @typescript-eslint/no-explicit-any */
// app/customer/payment/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import { useOrder } from "@/app/context/OrderContext";
import { historyService, OrderWithItems } from "@/app/lib/supabase/history";
import { supabase } from "@/app/lib/supabase/client";
import axios from "axios";
import {
  FaArrowLeft,
  FaCheck,
  FaReceipt,
  FaClock,
  FaSpinner,
  FaExclamationTriangle,
  FaUser,
  FaFilePdf,
  FaFileInvoiceDollar,
  FaEnvelope,
  FaTimes,
  FaStickyNote,
  FaPlus,
  FaStar,
  FaBan,
} from "react-icons/fa";

interface PaymentSummary {
  subtotal: number;
  taxAmount: number;
  total: number;
  taxRate: number;
  cancelledAmount: number;
  cancelledUnitsCount: number;
}

interface CustomerOrderSummary {
  customerName: string;
  orders: OrderWithItems[];
  subtotal: number;
  taxAmount: number;
  total: number;
  itemsCount: number;
  cancelledItemsCount: number;
  cancelledUnitsCount: number;
  cancelledAmount: number;
}

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  isLoading: boolean;
}

const SatisfactionSurvey = ({
  onSubmit,
  onSkip,
  customerName,
}: {
  onSubmit: (rating: number, comment: string) => void;
  onSkip: () => void;
  customerName: string;
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-xl mx-auto w-full mx-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaStar className="text-yellow-500 text-2xl" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Cuéntanos tu experiencia!
        </h3>
        <p className="text-gray-600">¿Cómo calificarías tu experiencia hoy?</p>
      </div>

      <div className="mb-6">
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-4xl transition-transform hover:scale-110"
            >
              <FaStar
                className={
                  star <= (hoveredRating || rating)
                    ? "text-yellow-500 fill-current"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>
        <div className="text-center text-sm text-gray-500">
          {rating === 0 && "Selecciona una calificación"}
          {rating === 1 && "Muy mala"}
          {rating === 2 && "Mala"}
          {rating === 3 && "Regular"}
          {rating === 4 && "Buena"}
          {rating === 5 && "Excelente"}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comentario (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Algo que nos quieras contar sobre tu experiencia?"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          Omitir
        </button>
        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Enviar Encuesta
        </button>
      </div>
    </div>
  );
};

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("El correo electrónico es requerido");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Por favor ingresa un correo electrónico válido");
      return;
    }

    setEmailError("");
    onConfirm(email);
  };

  const handleClose = () => {
    setEmail("");
    setEmailError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <FaFileInvoiceDollar className="text-purple-600 text-lg" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Solicitar Factura
              </h3>
              <p className="text-sm text-gray-500">
                Ingresa tu correo electrónico
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            disabled={isLoading}
          >
            <FaTimes className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                placeholder="tu@correo.com"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  emailError
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-purple-200 focus:border-purple-300"
                }`}
                disabled={isLoading}
              />
            </div>
            {emailError && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <FaExclamationTriangle className="text-red-500" />
                {emailError}
              </p>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-700">
              📧 Te enviaremos un correo con los pasos para completar tu
              facturación y los datos fiscales requeridos.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <FaFileInvoiceDollar />
                  Solicitar Factura
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const renderOrderItem = (item: any) => {
  const cancelledQty = item.cancelled_quantity || 0;
  const activeQuantity = item.quantity - cancelledQty;
  const isCancelled = activeQuantity === 0;
  const isPartiallyCancelled = cancelledQty > 0 && activeQuantity > 0;

  return (
    <div
      key={item.id}
      className={`flex justify-between items-start py-3 border-b border-gray-100 ${
        isCancelled
          ? "bg-red-50 border-l-4 border-l-red-400 pl-3 opacity-75"
          : isPartiallyCancelled
          ? "bg-orange-50 border-l-4 border-l-orange-400 pl-3"
          : ""
      }`}
    >
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`font-medium text-base ${
                  isCancelled ? "text-red-700 line-through" : "text-gray-800"
                }`}
              >
                {item.product_name}
              </span>
              {isCancelled && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <FaBan className="text-xs" />
                  Completamente Cancelado
                </span>
              )}
              {isPartiallyCancelled && (
                <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <FaBan className="text-xs" />
                  Parcialmente Cancelado
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-2">
                <span>
                  Cantidad activa: <strong>{activeQuantity}</strong>
                  {cancelledQty > 0 && (
                    <span className="text-red-500 line-through ml-1">
                      (de {item.quantity})
                    </span>
                  )}
                </span>
                <span>•</span>
                <span>{formatCurrency(item.price)} c/u</span>
              </div>
              {cancelledQty > 0 && (
                <div className="text-xs text-red-600 mt-1">
                  {cancelledQty} unidad(es) cancelada(s)
                </div>
              )}
            </div>

            {formatItemNotes(item.notes)}
          </div>
          <div className="text-right ml-4">
            <div
              className={`font-semibold text-lg ${
                isCancelled ? "text-red-700 line-through" : "text-gray-800"
              }`}
            >
              {formatCurrency(item.price * activeQuantity)}
            </div>
            {cancelledQty > 0 && (
              <div className="text-xs text-red-600 font-medium mt-1">
                Cancelado: {formatCurrency(item.price * cancelledQty)}
              </div>
            )}
            {(isCancelled || isPartiallyCancelled) && (
              <div className="text-xs text-red-600 font-medium mt-1 bg-red-100 px-2 py-1 rounded">
                No se cobrará
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatItemNotes = (notes: string | null) => {
  if (!notes) return null;

  const hasPricedExtras = notes.includes("(+$");

  if (hasPricedExtras) {
    const parts = notes.split(" | ");
    const mainNotes = parts.find(
      (part) => !part.includes("Extras:") && !part.includes("Total:")
    );
    const extrasPart = parts.find((part) => part.includes("Extras:"));
    const totalPart = parts.find((part) => part.includes("Total:"));

    return (
      <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {mainNotes && (
          <div className="flex items-start gap-2">
            <FaStickyNote className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              <span className="font-medium">Instrucciones:</span> {mainNotes}
            </span>
          </div>
        )}

        {extrasPart && (
          <div className="flex items-start gap-2">
            <FaPlus className="text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-green-700">
                Extras agregados:
              </span>
              <div className="mt-1 ml-2 space-y-1">
                {extrasPart
                  .replace("Extras: ", "")
                  .split(", ")
                  .map((extra, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-green-600">
                        • {extra.split(" (+$")[0]}
                      </span>
                      <span className="text-green-700 font-medium">
                        {extra.match(/\(\+\$([^)]+)\)/)?.[1] || ""}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {totalPart && (
          <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
            <FaReceipt className="text-blue-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-700">
              {totalPart}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (notes.includes("Extras:")) {
    const parts = notes.split(" | ");
    let mainNotes = "";
    let extrasText = "";

    parts.forEach((part) => {
      if (part.startsWith("Extras:")) {
        extrasText = part.replace("Extras: ", "");
      } else {
        mainNotes = part;
      }
    });

    return (
      <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg">
        {mainNotes && (
          <p className="text-sm text-gray-700">
            <span className="font-medium">Nota:</span> {mainNotes}
          </p>
        )}
        {extrasText && (
          <p className="text-sm text-green-700">
            <span className="font-medium">Extras:</span> {extrasText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
      <p className="text-sm text-yellow-800 flex items-center gap-1">
        <FaStickyNote className="text-yellow-600" />
        <span className="font-medium">Nota:</span> {notes}
      </p>
    </div>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const formatNotesForPDF = (notes: string) => {
  if (!notes) return "";

  const hasPricedExtras = notes.includes("(+$");

  if (hasPricedExtras) {
    const parts = notes.split(" | ");
    const mainNotes = parts.find(
      (part) => !part.includes("Extras:") && !part.includes("Total:")
    );
    const extrasPart = parts.find((part) => part.includes("Extras:"));
    const totalPart = parts.find((part) => part.includes("Total:"));

    let result = "";

    if (mainNotes) {
      result += `<div class="notes-main"><strong>Instrucciones:</strong> ${mainNotes}</div>`;
    }

    if (extrasPart) {
      result += `<div class="extras-section"><strong>Extras:</strong>`;
      extrasPart
        .replace("Extras: ", "")
        .split(", ")
        .forEach((extra) => {
          const extraName = extra.split(" (+$")[0];
          const extraPrice = extra.match(/\(\+\$([^)]+)\)/)?.[1] || "";
          result += `<div class="extra-item">• ${extraName} +${extraPrice}</div>`;
        });
      result += `</div>`;
    }

    if (totalPart) {
      result += `<div style="margin-top: 5px; font-weight: bold; color: #1e40af;">${totalPart}</div>`;
    }

    return result;
  }

  if (notes.includes("Extras:")) {
    const parts = notes.split(" | ");
    let mainNotes = "";
    let extrasText = "";

    parts.forEach((part) => {
      if (part.startsWith("Extras:")) {
        extrasText = part.replace("Extras: ", "");
      } else {
        mainNotes = part;
      }
    });

    let result = "";
    if (mainNotes) {
      result += `<div class="notes-main"><strong>Nota:</strong> ${mainNotes}</div>`;
    }
    if (extrasText) {
      result += `<div class="extras-section"><strong>Extras:</strong> ${extrasText}</div>`;
    }

    return result;
  }

  return `<div class="notes-main"><strong>Nota:</strong> ${notes}</div>`;
};

export default function PaymentPage() {
  const router = useRouter();
  const { session, isLoading: sessionLoading } = useSession();
  const {
    currentTableId,
    notificationState,
    createBillNotification,
    refreshOrder,
  } = useOrder();

  // Obtener datos de la sesión
  const tableNumber = session?.tableNumber;
  const tableId = session?.tableId;
  const userId = session?.userId;
  const orderId = session?.orderId;

  useEffect(() => {
    if (tableId && !currentTableId) {
      refreshOrder(parseInt(tableId));
    }
  }, [tableId, currentTableId, refreshOrder]);

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<OrderWithItems[]>([]);
  const [error, setError] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ status: "pending" });

  const loadOrders = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    try {
      setLoading(true);
      setError("");

      const orders = await historyService.getCustomerOrderHistory(
        parseInt(targetTableId.toString())
      );

      const pendingOrders = orders.filter(
        (order) => order.status === "active" || order.status === "sent"
      );

      const processedOrders = pendingOrders.map((order) => ({
        ...order,
        order_items: order.order_items.map((item) => ({
          ...item,
          cancelled_quantity: item.cancelled_quantity || 0,
          ...(item.status === "cancelled" &&
            !item.cancelled_quantity && {
              cancelled_quantity: item.quantity,
            }),
        })),
      }));

      setAllOrders(processedOrders);

      if (processedOrders.length === 0) {
        setError("No hay órdenes pendientes de pago");
      }
    } catch (error) {
      console.error("Error loading orders for payment:", error);
      setError("Error cargando las órdenes para pago");
    } finally {
      setLoading(false);
    }
  };

  const saveSurveyToDatabase = async (rating: number, comment: string) => {
    try {
      const { data, error } = await supabase.from("customer_feedback").insert([
        {
          table_id: tableId || currentTableId,
          customer_name: customerSummaries[0]?.customerName || "Cliente",
          rating: rating,
          comment: comment || null,
          order_count: allOrders.length,
          total_amount: paymentSummary.total,
          created_at: new Date().toISOString(),
        },
      ] as never);

      if (error) {
        console.error("Error guardando encuesta:", error);
        throw error;
      }

      console.log("✅ Encuesta guardada exitosamente");
      return true;
    } catch (error) {
      console.error("Error al guardar la encuesta:", error);
      return false;
    }
  };

  useEffect(() => {
    const loadAllOrders = async () => {
      const targetTableId = tableId || currentTableId;
      if (!targetTableId) return;

      try {
        setLoading(true);
        setError("");

        const orders = await historyService.getCustomerOrderHistory(
          parseInt(targetTableId.toString())
        );

        const pendingOrders = orders.filter(
          (order) => order.status === "active" || order.status === "sent"
        );

        const processedOrders = pendingOrders.map((order) => ({
          ...order,
          order_items: order.order_items.map((item) => ({
            ...item,
            cancelled_quantity: item.cancelled_quantity || 0,
            ...(item.status === "cancelled" &&
              !item.cancelled_quantity && {
                cancelled_quantity: item.quantity,
              }),
          })),
        }));

        setAllOrders(processedOrders);

        if (processedOrders.length === 0) {
          setError("No hay órdenes pendientes de pago");
        }
      } catch (error) {
        console.error("Error loading orders for payment:", error);
        setError("Error cargando las órdenes para pago");
      } finally {
        setLoading(false);
      }
    };

    if (tableId !== null || currentTableId) {
      loadAllOrders();
    }
  }, [tableId, currentTableId]);

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
          cancelledItemsCount: 0,
          cancelledUnitsCount: 0,
          cancelledAmount: 0,
        });
      }

      const customerSummary = customerMap.get(customerName)!;
      customerSummary.orders.push(order);

      const orderCalculations = order.order_items.reduce(
        (acc, item) => {
          const cancelledQty = item.cancelled_quantity || 0;
          const activeQuantity = item.quantity - cancelledQty;

          if (activeQuantity === 0) {
            acc.cancelledItemsCount++;
          }

          acc.cancelledUnitsCount += cancelledQty;

          const itemTotal = item.price * activeQuantity;
          acc.totalAmount += itemTotal;
          acc.cancelledAmount += item.price * cancelledQty;

          return acc;
        },
        {
          cancelledItemsCount: 0,
          cancelledUnitsCount: 0,
          totalAmount: 0,
          cancelledAmount: 0,
        }
      );

      const taxRate = 0.08;
      customerSummary.total += orderCalculations.totalAmount;
      customerSummary.subtotal = customerSummary.total / (1 + taxRate);
      customerSummary.taxAmount =
        customerSummary.total - customerSummary.subtotal;

      customerSummary.cancelledItemsCount +=
        orderCalculations.cancelledItemsCount;
      customerSummary.cancelledUnitsCount +=
        orderCalculations.cancelledUnitsCount;
      customerSummary.cancelledAmount += orderCalculations.cancelledAmount;

      customerSummary.itemsCount += order.order_items.filter(
        (item) => item.quantity - (item.cancelled_quantity || 0) > 0
      ).length;
    });

    return Array.from(customerMap.values());
  };

  const calculateTotalPaymentSummary = (): PaymentSummary => {
    let total = 0;
    let cancelledAmount = 0;
    let cancelledUnitsCount = 0;

    allOrders.forEach((order) => {
      order.order_items.forEach((item) => {
        const cancelledQty = item.cancelled_quantity || 0;
        const activeQuantity = item.quantity - cancelledQty;

        total += item.price * activeQuantity;
        cancelledAmount += item.price * cancelledQty;
        cancelledUnitsCount += cancelledQty;
      });
    });

    const taxRate = 0.08;
    const subtotal = total / (1 + taxRate);
    const taxAmount = total - subtotal;

    return {
      subtotal,
      taxAmount,
      total,
      taxRate,
      cancelledAmount,
      cancelledUnitsCount,
    };
  };

  const customerSummaries = groupOrdersByCustomer();
  const paymentSummary = calculateTotalPaymentSummary();

  const mesaCancelledAmount = customerSummaries.reduce(
    (total, customer) => total + customer.cancelledAmount,
    0
  );
  const mesaCancelledUnits = customerSummaries.reduce(
    (total, customer) => total + customer.cancelledUnitsCount,
    0
  );

  // 1. SUSCRIPCIÓN EN TIEMPO REAL PARA ÓRDENES
  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    console.log("🔄 Iniciando suscripción en tiempo real para órdenes");

    const ordersSubscription = supabase
      .channel(`table-${targetTableId}-orders`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `table_id=eq.${targetTableId}`,
        },
        (payload) => {
          console.log("📦 Cambio en órdenes recibido:", payload);
          loadOrders();
        }
      )
      .subscribe((status) => {
        console.log("Estado de suscripción a órdenes:", status);
      });

    return () => {
      console.log("🔕 Limpiando suscripción a órdenes");
      ordersSubscription.unsubscribe();
    };
  }, [tableId, currentTableId]);

  // 2. SUSCRIPCIÓN EN TIEMPO REAL PARA NOTIFICACIONES DE PAGO
  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    console.log("💰 Iniciando suscripción en tiempo real para pagos");

    const paymentsSubscription = supabase
      .channel(`table-${targetTableId}-payments`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_notifications",
          filter: `table_id=eq.${targetTableId}`,
        },
        (payload) => {
          console.log("💳 Cambio en notificaciones de pago:", payload);

          if (payload.eventType === "UPDATE") {
            const newStatus = payload.new.status;
            const notificationType = payload.new.type;

            if (notificationType === "bill_request") {
              if (newStatus === "completed") {
                console.log("✅ Pago completado en tiempo real");
                setPaymentStatus({ status: "verified" });
                setPaymentConfirmed(true);
                setShowSurvey(true);
              } else if (newStatus === "cancelled") {
                console.log("❌ Pago cancelado en tiempo real");
                setPaymentStatus({ status: "pending" });
              }
            }
          }

          if (payload.eventType === "INSERT") {
            const newNotification = payload.new;
            if (
              newNotification.type === "bill_request" &&
              newNotification.status === "pending"
            ) {
              console.log("🔄 Nueva solicitud de pago recibida");
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Estado de suscripción a pagos:", status);
      });

    return () => {
      console.log("🔕 Limpiando suscripción a pagos");
      paymentsSubscription.unsubscribe();
    };
  }, [tableId, currentTableId]);

  // 3. POLLING COMO FALLBACK
  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    const interval = setInterval(async () => {
      try {
        if (notificationState.hasPendingBill) {
          const { data: notifications, error } = await supabase
            .from("waiter_notifications")
            .select("*")
            .eq("table_id", targetTableId)
            .eq("type", "bill_request")
            .in("status", ["completed", "cancelled"])
            .order("created_at", { ascending: false })
            .limit(1);

          if (!error && notifications && notifications.length > 0) {
            const latestNotification = notifications[0] as any;

            if (
              latestNotification.status === "completed" &&
              !paymentConfirmed
            ) {
              console.log("✅ Pago completado vía polling");
              setPaymentStatus({ status: "verified" });
              setPaymentConfirmed(true);
              setShowSurvey(true);
            } else if (latestNotification.status === "cancelled") {
              console.log("❌ Pago cancelado vía polling");
              setPaymentStatus({ status: "pending" });
            }
          }
        }
      } catch (error) {
        console.error("Error en polling:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    tableId,
    currentTableId,
    notificationState.hasPendingBill,
    paymentConfirmed,
  ]);

  const handleSurveySubmit = async (rating: number, comment: string) => {
    try {
      await saveSurveyToDatabase(rating, comment);
      setSurveyCompleted(true);
      setShowSurvey(false);
    } catch (error) {
      console.error("Error al enviar encuesta:", error);
      setSurveyCompleted(true);
      setShowSurvey(false);
    }
  };

  const handleSurveySkip = () => {
    setSurveyCompleted(true);
    setShowSurvey(false);
  };

  const handleGeneratePDF = async () => {
    try {
      setGeneratingPdf(true);

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket de Pago - Mesa ${
            tableNumber || tableId || currentTableId
          }</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              background: #1f2937; 
              color: white; 
              padding: 20px; 
              margin-bottom: 20px;
            }
            .restaurant-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .table-info { 
              font-size: 14px; 
              color: #d1d5db;
            }
            .customer-section { 
              margin-bottom: 25px; 
              border-bottom: 1px solid #e5e7eb; 
              padding-bottom: 15px;
            }
            .customer-header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 15px;
            }
            .customer-name { 
              font-size: 18px; 
              font-weight: bold; 
              color: #1f2937;
            }
            .customer-total { 
              font-size: 16px; 
              font-weight: bold; 
              color: #1f2937;
            }
            .item-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 8px; 
              padding-bottom: 8px; 
              border-bottom: 1px solid #f3f4f6;
            }
            .item-name { 
              font-weight: 500;
            }
            .item-details { 
              font-size: 12px; 
              color: #6b7280; 
              margin-top: 2px;
            }
            .item-price { 
              text-align: right;
            }
            .notes-section { 
              background: #f9fafb; 
              padding: 8px; 
              border-radius: 4px; 
              margin-top: 5px; 
              font-size: 11px;
            }
            .notes-main { 
              color: #92400e; 
              margin-bottom: 4px;
            }
            .extras-section { 
              color: #065f46; 
              margin-top: 4px;
            }
            .extra-item { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 2px;
            }
            .order-separator { 
              border-top: 1px solid #e5e7eb; 
              margin: 15px 0;
            }
            .customer-summary { 
              background: #dbeafe; 
              padding: 15px; 
              border-radius: 8px; 
              margin-top: 15px;
            }
            .summary-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 5px;
            }
            .final-total { 
              border-top: 2px solid #1f2937; 
              padding-top: 15px; 
              margin-top: 20px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              font-size: 18px; 
              font-weight: bold;
            }
            .footer { 
              text-align: center; 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb; 
              color: #6b7280; 
              font-size: 12px;
            }
            .timestamp { 
              font-size: 12px; 
              color: #6b7280; 
              text-align: center; 
              margin-bottom: 10px;
            }
            .cancelled-info {
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 6px;
              padding: 10px;
              margin: 10px 0;
              font-size: 12px;
              color: #dc2626;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">RESTAURANTE</div>
            <div class="table-info">Mesa ${
              tableNumber || tableId || currentTableId
            }</div>
            <div class="table-info">${new Date().toLocaleString("es-MX")}</div>
          </div>

          <div class="timestamp">
            Generado el ${new Date().toLocaleString("es-MX")}
          </div>

          ${
            mesaCancelledUnits > 0
              ? `
            <div class="cancelled-info">
              <strong>Nota:</strong> Se excluyen ${mesaCancelledUnits} unidad(es) cancelada(s) 
              por un total de ${formatCurrency(mesaCancelledAmount)}
            </div>
          `
              : ""
          }

          ${customerSummaries
            .map(
              (customerSummary) => `
            <div class="customer-section">
              <div class="customer-header">
                <div class="customer-name">${customerSummary.customerName}</div>
                <div class="customer-total">${formatCurrency(
                  customerSummary.total
                )}</div>
              </div>

              ${
                customerSummary.cancelledUnitsCount > 0
                  ? `
                <div style="background: #fef2f2; padding: 8px; border-radius: 4px; margin-bottom: 10px; font-size: 11px; color: #dc2626;">
                  <strong>Cancelados:</strong> ${
                    customerSummary.cancelledUnitsCount
                  } unidad(es) - ${formatCurrency(
                      customerSummary.cancelledAmount
                    )} excluido(s)
                </div>
              `
                  : ""
              }

              ${customerSummary.orders
                .map(
                  (order) => `
                ${
                  customerSummary.orders.length > 1
                    ? `
                  <div style="background: #f9fafb; padding: 10px; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-size: 12px; color: #6b7280;">
                      Orden #${order.id.slice(-8)}
                    </div>
                  </div>
                `
                    : ""
                }

                ${order.order_items
                  .map((item) => {
                    const cancelledQty = item.cancelled_quantity || 0;
                    const activeQuantity = item.quantity - cancelledQty;
                    const isCancelled = activeQuantity === 0;

                    if (isCancelled) {
                      return `
                        <div class="item-row" style="opacity: 0.6; background: #fef2f2;">
                          <div>
                            <div class="item-name" style="text-decoration: line-through; color: #dc2626;">
                              ${item.product_name} (CANCELADO)
                            </div>
                            <div class="item-details">
                              Cantidad: ${item.quantity} • ${formatCurrency(
                        item.price
                      )} c/u
                              ${
                                item.notes
                                  ? `
                                <div class="notes-section">
                                  ${formatNotesForPDF(item.notes)}
                                </div>
                              `
                                  : ""
                              }
                            </div>
                          </div>
                          <div class="item-price" style="text-decoration: line-through; color: #dc2626;">
                            ${formatCurrency(item.price * item.quantity)}
                          </div>
                        </div>
                      `;
                    }

                    return `
                      <div class="item-row">
                        <div>
                          <div class="item-name">${item.product_name}</div>
                          <div class="item-details">
                            Cantidad: ${activeQuantity}${
                      cancelledQty > 0
                        ? ` (de ${item.quantity}, ${cancelledQty} cancelada(s))`
                        : ""
                    } • ${formatCurrency(item.price)} c/u
                            ${
                              item.notes
                                ? `
                              <div class="notes-section">
                                ${formatNotesForPDF(item.notes)}
                              </div>
                            `
                                : ""
                            }
                          </div>
                        </div>
                        <div class="item-price">
                          ${formatCurrency(item.price * activeQuantity)}
                        </div>
                      </div>
                    `;
                  })
                  .join("")}

                ${
                  order !==
                  customerSummary.orders[customerSummary.orders.length - 1]
                    ? `
                  <div class="order-separator"></div>
                `
                    : ""
                }
              `
                )
                .join("")}

              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; margin-top: 10px;">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>${formatCurrency(customerSummary.subtotal)}</span>
                </div>
                <div class="summary-row">
                  <span>IVA (8%):</span>
                  <span>${formatCurrency(customerSummary.taxAmount)}</span>
                </div>
                <div class="summary-row" style="font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 5px;">
                  <span>Total:</span>
                  <span>${formatCurrency(customerSummary.total)}</span>
                </div>
              </div>
            </div>
          `
            )
            .join("")}

          <div class="final-total">
            <div class="summary-row">
              <span>Subtotal total:</span>
              <span>${formatCurrency(paymentSummary.subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>Impuestos (8%):</span>
              <span>${formatCurrency(paymentSummary.taxAmount)}</span>
            </div>
            <div class="total-row">
              <span>TOTAL GENERAL:</span>
              <span>${formatCurrency(paymentSummary.total)}</span>
            </div>
          </div>

          <div class="footer">
            <p style="font-weight: bold; margin-bottom: 5px;">¡Gracias por su preferencia!</p>
            <p>Ticket generado para proceso de pago</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(pdfContent);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error al generar el PDF. Intente nuevamente.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleOpenInvoiceModal = () => {
    setIsInvoiceModalOpen(true);
  };

  const handleCloseInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
  };

  const handleInvoiceRequest = async (email: string) => {
    try {
      setGeneratingInvoice(true);

      const invoiceData = {
        tableId: tableId || currentTableId,
        tableNumber: tableNumber,
        customerEmail: email,
        customerSummaries: customerSummaries.map((summary) => ({
          customerName: summary.customerName,
          subtotal: summary.subtotal,
          taxAmount: summary.taxAmount,
          total: summary.total,
          itemsCount: summary.itemsCount,
          cancelledItemsCount: summary.cancelledItemsCount,
          cancelledUnitsCount: summary.cancelledUnitsCount,
          cancelledAmount: summary.cancelledAmount,
        })),
        paymentSummary: {
          subtotal: paymentSummary.subtotal,
          taxAmount: paymentSummary.taxAmount,
          total: paymentSummary.total,
          cancelledAmount: paymentSummary.cancelledAmount,
          cancelledUnitsCount: paymentSummary.cancelledUnitsCount,
        },
        orders: allOrders.map((order) => ({
          id: order.id,
          customerName: order.customer_name,
          items: order.order_items.map((item) => ({
            productName: item.product_name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            cancelled_quantity: item.cancelled_quantity || 0,
            activeQuantity: item.quantity - (item.cancelled_quantity || 0),
          })),
        })),
        timestamp: new Date().toISOString(),
      };

      const response = await axios.post(
        "https://e-commetrics.com/api/invoice",
        invoiceData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      if (response.data.success) {
        alert(
          "✅ Solicitud de factura enviada correctamente. Recibirá un correo con los pasos para completar la facturación."
        );
        handleCloseInvoiceModal();
      } else {
        throw new Error(
          response.data.message || "Error al procesar la factura"
        );
      }
    } catch (error) {
      console.error("Error solicitando factura:", error);
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const errorMessage =
            error.response.data?.message || "Error del servidor";
          alert(`❌ Error al solicitar la factura: ${errorMessage}`);
        } else if (error.request) {
          alert("❌ Error de conexión. No se pudo contactar al servidor.");
        } else {
          alert("❌ Error en la solicitud de factura.");
        }
      } else {
        alert(
          "❌ Error al solicitar la factura. Por favor, intente nuevamente o contacte al personal."
        );
      }
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const handlePaymentConfirmation = async () => {
    try {
      setPaymentConfirmed(true);
      setShowSurvey(true);

      // Limpiar TODAS las claves relacionadas con el restaurante
      const keysToRemove = [
        // Claves específicas de tu imagen
        "GDPR_REMOVAL_FLAG",
        "app_session",
        "currentOrder",
        "currentOrderId",
        "currentTableId",
        "currentUserId",
        "currentUserName",
        "customerSession",
        "historyUserData",
        "orderItems",
        "photoSphereViewer_touchSupport",
        "restaurant_tableId",
        "restaurant_userId",
        "restaurant_userName",

        // Claves con patrones dinámicos (buscamos por prefijo)
        ...Object.keys(localStorage).filter(
          (key) =>
            key.startsWith("paymentState_") ||
            key.startsWith("paymentStatus_") ||
            key.startsWith("pendingItems_") ||
            key.startsWith("currentOrder-table-") ||
            key.startsWith("currentUser-table-")
        ),

        // Claves de mi solución anterior (por si acaso)
        "session",
        "session-tableId",
        "session-userId",
        "session-orderId",
        "session-customerName",
        "session-tableNumber",
        "sessionCleanupTimer",
        "sessionExpiryTime",
      ];

      // Eliminar cada key (sin duplicados)
      const uniqueKeys = [...new Set(keysToRemove)];
      uniqueKeys.forEach((key) => {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          console.log(`🗑️ Eliminada: ${key}`);
        }
      });

      console.log("✅ Pago confirmado y localStorage limpiado:", {
        tableId: tableId || currentTableId,
        tableNumber: tableNumber,
        total: paymentSummary.total,
        cancelledAmount: paymentSummary.cancelledAmount,
        customers: customerSummaries.map((c) => c.customerName),
      });
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert("❌ Error al confirmar el pago. Intenta nuevamente.");
    }
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

  const renderPaymentButton = () => {
    const { checkingNotification, hasPendingBill } = notificationState;

    if (checkingNotification) {
      return (
        <button
          disabled
          className="flex-1 bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <FaSpinner className="text-xl animate-spin" />
          Verificando...
        </button>
      );
    }

    if (hasPendingBill) {
      return (
        <button
          disabled
          className="flex-1 bg-yellow-500 text-white px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 cursor-not-allowed"
        >
          <FaClock className="text-xl" />
          Tu ticket está en proceso
        </button>
      );
    }

    return (
      <button
        onClick={handlePaymentConfirmation}
        className="flex-1 bg-green-500 text-white px-8 py-4 rounded-xl hover:bg-green-600 transition font-semibold flex items-center justify-center gap-3"
      >
        <FaCheck className="text-xl" />
        Ya Pagué
      </button>
    );
  };

  // Loading mientras verifica sesión
  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando información de la mesa...</p>
        </div>
      </div>
    );
  }

  // Si no hay sesión válida
  if (!session || !tableNumber) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Sesión no encontrada
          </h2>
          <p className="text-gray-600 mb-4">
            No se pudo identificar la mesa. Por favor, regresa al menú
            principal.
          </p>
          <button
            onClick={() => router.push("/customer")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Volver al Inicio
          </button>
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
            onClick={() => router.push("/customer/")}
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
            onClick={() => router.push("/customer/menu")}
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheck className="text-4xl text-green-500" />
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              ¡Pago Confirmado!
            </h2>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Comensales</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {customerSummaries.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Órdenes pagadas</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {allOrders.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total pagado</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(paymentSummary.total)}
                  </p>
                </div>
              </div>
              {mesaCancelledUnits > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">
                    Se excluyeron {mesaCancelledUnits} unidad(es) cancelada(s)
                  </p>
                </div>
              )}
            </div>

            <p className="text-gray-600 mb-6">
              Gracias por su preferencia. ¡Esperamos verle pronto!
            </p>

            {surveyCompleted && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                  <FaCheck />
                  <span className="font-semibold">
                    ¡Gracias por tu feedback!
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  Tu opinión ha sido registrada exitosamente
                </p>
              </div>
            )}
          </div>

          {showSurvey && (
            <SatisfactionSurvey
              onSubmit={handleSurveySubmit}
              onSkip={handleSurveySkip}
              customerName={customerSummaries[0]?.customerName || "Cliente"}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Ticket de Pago
                  </h1>
                  <p className="text-sm text-gray-500">
                    Mesa {tableNumber} • {session.customerName}
                  </p>
                  <p className="text-sm text-blue-600 font-medium">
                    {customerSummaries.length} comensal
                    {customerSummaries.length > 1 ? "es" : ""} •{" "}
                    {allOrders.length} orden{allOrders.length > 1 ? "es" : ""}
                  </p>
                  {mesaCancelledUnits > 0 && (
                    <p className="text-sm text-red-600 font-medium">
                      {mesaCancelledUnits} unidad(es) cancelada(s) -{" "}
                      {formatCurrency(mesaCancelledAmount)} excluido(s)
                    </p>
                  )}
                </div>
              </div>

              {/* Botón de recargar */}
              <button
                onClick={() => {
                  setLoading(true);
                  loadOrders();
                }}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                {loading ? "Actualizando..." : "Actualizar"}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <div className="bg-gray-800 text-white p-6 text-center">
              <h3 className="text-2xl font-bold">RESTAURANTE</h3>
              <p className="text-gray-300 text-sm">Mesa {tableNumber}</p>
              {mesaCancelledUnits > 0 && (
                <p className="text-red-300 text-sm mt-2">
                  {mesaCancelledUnits} unidad(es) cancelada(s) excluida(s)
                </p>
              )}
            </div>

            <div className="p-6">
              {customerSummaries.map((customerSummary, customerIndex) => (
                <div
                  key={customerSummary.customerName}
                  className="mb-8 last:mb-0"
                >
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
                          <p className="text-sm text-gray-500">
                            {customerSummary.itemsCount} item
                            {customerSummary.itemsCount > 1 ? "s" : ""} activo
                            {customerSummary.itemsCount > 1 ? "s" : ""}
                          </p>
                          {customerSummary.cancelledUnitsCount > 0 && (
                            <p className="text-sm text-red-500">
                              {customerSummary.cancelledUnitsCount} unidad(es)
                              cancelada(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-800">
                        {formatCurrency(customerSummary.total)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-4">
                    {customerSummary.orders.map((order, orderIndex) => (
                      <div key={order.id}>
                        <div className="space-y-3">
                          {order.order_items.map((item) =>
                            renderOrderItem(item)
                          )}
                        </div>

                        {orderIndex < customerSummary.orders.length - 1 && (
                          <div className="border-t border-gray-200 my-4"></div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-300 pt-2">
                      <span>Total de {customerSummary.customerName}:</span>
                      <span>{formatCurrency(customerSummary.total)}</span>
                    </div>

                    {customerSummary.cancelledUnitsCount > 0 && (
                      <div className="text-xs text-red-600 mt-2 space-y-1">
                        <div>
                          • {customerSummary.cancelledUnitsCount} unidad(es)
                          cancelada(s)
                        </div>
                        <div>
                          • {formatCurrency(customerSummary.cancelledAmount)}{" "}
                          excluido(s) del total
                        </div>
                      </div>
                    )}
                  </div>

                  {customerIndex < customerSummaries.length - 1 && (
                    <div className="border-t border-gray-300 my-6"></div>
                  )}
                </div>
              ))}

              <div className="border-t border-gray-200 pt-6 space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Subtotal total:</span>
                  <span>{formatCurrency(paymentSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Impuestos (8%):</span>
                  <span>{formatCurrency(paymentSummary.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-2xl font-bold text-gray-800 border-t border-gray-200 pt-4">
                  <span>TOTAL GENERAL:</span>
                  <span>{formatCurrency(paymentSummary.total)}</span>
                </div>

                {paymentSummary.cancelledUnitsCount > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg mt-4">
                    <div className="text-sm text-red-700">
                      <strong>Nota:</strong> Se excluyen{" "}
                      {paymentSummary.cancelledUnitsCount} unidad(es)
                      cancelada(s) por un total de{" "}
                      {formatCurrency(paymentSummary.cancelledAmount)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-6 text-center text-sm text-gray-500 border-t">
              <div className="bg-gray-50 p-6 text-center text-sm text-gray-500 border-t">
                <p className="font-medium mb-2">¡Gracias por su preferencia!</p>
                <p>Presione Ya Pagué cuando haya completado el pago</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGeneratePDF}
                disabled={generatingPdf}
                className="flex-1 bg-blue-500 text-white px-6 py-4 rounded-xl hover:bg-blue-600 transition font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPdf ? (
                  <FaSpinner className="text-xl animate-spin" />
                ) : (
                  <FaFilePdf className="text-xl" />
                )}
                {generatingPdf ? "Generando PDF..." : "Guardar Ticket PDF"}
              </button>
              <button
                onClick={handleOpenInvoiceModal}
                disabled={generatingInvoice}
                className="flex-1 max-w-2xl bg-purple-500 text-white px-6 py-4 rounded-xl hover:bg-purple-600 transition font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingInvoice ? (
                  <FaSpinner className="text-xl animate-spin" />
                ) : (
                  <FaFileInvoiceDollar className="text-xl" />
                )}
                {generatingInvoice
                  ? "Procesando Factura..."
                  : "Facturar Compra"}
              </button>
              {renderPaymentButton()}
            </div>
          </div>

          {notificationState.hasPendingBill && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <FaClock className="text-yellow-600" />
                <p className="text-sm font-medium">
                  Hemos recibido tu solicitud de pago. El mesero está en camino
                  con tu ticket.
                </p>
              </div>
            </div>
          )}

          <p className="text-gray-500 text-sm mt-4 text-center">
            Puede guardar el ticket en PDF o solicitar factura antes de
            confirmar el pago
          </p>
        </main>
      </div>

      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={handleCloseInvoiceModal}
        onConfirm={handleInvoiceRequest}
        isLoading={generatingInvoice}
      />
    </>
  );
}
