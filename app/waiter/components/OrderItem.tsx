import { FaSpinner, FaTimes, FaBan } from "react-icons/fa";
import { useState } from "react";

interface OrderItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  processing: string | null;
  onUpdateStatus: (itemId: string, newStatus: string) => void;
  onCancelItem: (itemId: string, cancelQuantity: number) => void;
}

export default function OrderItem({
  item,
  processing,
  onUpdateStatus,
  onCancelItem,
}: OrderItemProps) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelQuantity, setCancelQuantity] = useState(1);

  // Función para formatear notas y extras (VERSIÓN COMPACTA)
  const formatItemNotes = (notes: string | null) => {
    if (!notes) return null;

    if (notes.includes("Extras:")) {
      const parts = notes.split(" | ");

      return (
        <div className="mt-2 text-xs space-y-1">
          {parts.map((part, index) => {
            if (part.startsWith("Extras:")) {
              return (
                <p key={index} className="text-green-600">
                  🟢 <span className="font-medium">Extras:</span>{" "}
                  {part.replace("Extras: ", "")}
                </p>
              );
            } else if (part.startsWith("Total:")) {
              return (
                <p key={index} className="text-blue-600 font-medium">
                  {part}
                </p>
              );
            } else if (part) {
              return (
                <p key={index} className="text-gray-600">
                  📝 <span className="font-medium">Nota:</span> {part}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }

    return (
      <p className="text-xs text-gray-600 mt-1">
        📝 <span className="font-medium">Nota:</span> {notes}
      </p>
    );
  };

  // Función para obtener el siguiente estado (FLUJO COMPLETO CON READY)
  const getNextStatus = (currentStatus: string): string => {
    const statusFlow = {
      ordered: "preparing",
      preparing: "ready",
      ready: "served",
      served: "served",
      cancelled: "cancelled",
    };
    return (
      statusFlow[currentStatus as keyof typeof statusFlow] || currentStatus
    );
  };

  // Función para obtener el texto del botón según el estado
  const getButtonText = (status: string): string => {
    const statusText = {
      ordered: "Ordenado",
      preparing: "En Preparación",
      ready: "Listo",
      served: "Servido",
      cancelled: "Cancelado",
    };
    return statusText[status as keyof typeof statusText] || status;
  };

  // Función para obtener los estilos del botón según el estado
  const getButtonStyles = (status: string): string => {
    const baseStyles =
      "text-xs px-3 py-2 rounded font-medium transition-all duration-200";

    const statusStyles = {
      ordered: "bg-red-500 text-white hover:bg-red-600",
      preparing: "bg-yellow-500 text-white hover:bg-yellow-600",
      ready: "bg-blue-500 text-white hover:bg-blue-600",
      served: "bg-green-500 text-white cursor-default",
      cancelled: "bg-gray-400 text-white cursor-default",
    };

    return `${baseStyles} ${
      statusStyles[status as keyof typeof statusStyles] ||
      "bg-gray-500 text-white"
    }`;
  };

  // Función para verificar si se puede cancelar (NO PERMITE READY O SERVED)
  const canCancel = (): boolean => {
    return (
      !isCancelled &&
      remainingQuantity > 0 &&
      item.status !== "ready" &&
      item.status !== "served"
    );
  };

  // Función para manejar el click en el botón de estado
  const handleStatusClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.status === "served" || item.status === "cancelled") return;

    const nextStatus = getNextStatus(item.status);
    onUpdateStatus(item.id, nextStatus);
  };

  // Función para manejar la cancelación del item
  const handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canCancel()) {
      if (item.status === "ready" || item.status === "served") {
        alert("No se puede cancelar un producto que ya está listo o servido");
      } else if (item.status === "cancelled") {
        alert("Este producto ya está cancelado");
      }
      return;
    }

    // Si la cantidad es 1, cancelar directamente
    if (item.quantity === 1) {
      if (
        window.confirm("¿Estás seguro de que quieres cancelar este producto?")
      ) {
        onCancelItem(item.id, 1);
      }
    } else {
      // Si la cantidad es mayor a 1, mostrar modal para seleccionar cuántos cancelar
      setCancelQuantity(1);
      setShowCancelModal(true);
    }
  };

  // Función para confirmar la cancelación con cantidad específica
  const handleConfirmCancel = () => {
    if (cancelQuantity > 0 && cancelQuantity <= availableToCancel) {
      onCancelItem(item.id, cancelQuantity);
      setShowCancelModal(false);
    }
  };

  const isCancelled = item.status === "cancelled";
  const cancelledQty = item.cancelled_quantity || 0;
  const availableToCancel = item.quantity - cancelledQty;
  const remainingQuantity = item.quantity - cancelledQty;

  return (
    <>
      <div
        className={`flex justify-between items-start text-sm p-3 rounded-lg border ${
          isCancelled
            ? "bg-red-50 border-red-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div
                className={`font-medium ${
                  isCancelled ? "text-red-700 line-through" : "text-gray-800"
                }`}
              >
                {item.product_name}
                {isCancelled && (
                  <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                    <FaBan className="inline mr-1" />
                    Cancelado
                  </span>
                )}
                {!isCancelled && cancelledQty > 0 && (
                  <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                    Parcialmente cancelado ({cancelledQty}/{item.quantity})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`${
                    isCancelled ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  × {remainingQuantity}
                  {cancelledQty > 0 && (
                    <span className="text-red-500 line-through ml-1">
                      (de {item.quantity})
                    </span>
                  )}
                </span>
                <span
                  className={`text-xs ${
                    isCancelled ? "text-red-500" : "text-gray-500"
                  }`}
                >
                  ${item.price.toFixed(2)} c/u
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isCancelled ? "text-red-600 line-through" : "text-green-600"
                  }`}
                >
                  Total activo: ${(item.price * remainingQuantity).toFixed(2)}
                  {cancelledQty > 0 && (
                    <span className="text-red-500 ml-1">
                      (Cancelado: ${(item.price * cancelledQty).toFixed(2)})
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex gap-2 flex-col">
              {/* Botón de estado */}
              <button
                onClick={handleStatusClick}
                disabled={
                  processing === item.id ||
                  item.status === "served" ||
                  item.status === "cancelled" ||
                  remainingQuantity === 0
                }
                className={getButtonStyles(item.status)}
              >
                {processing === item.id ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  getButtonText(item.status)
                )}
              </button>

              {/* Botón de cancelar - SOLO SE MUESTRA SI SE PUEDE CANCELAR */}
              {canCancel() && (
                <span
                  onClick={handleCancelClick}
                  className={`text-xs px-3 py-2 font-medium transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                    processing === item.id
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-600 hover:text-gray-800 hover:underline"
                  }`}
                >
                  {processing === item.id ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <>
                      <FaTimes className="text-xs" />
                      Cancelar
                    </>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* NOTAS Y EXTRAS MEJORADOS */}
          {item.notes && (
            <div className={`mt-2 ${isCancelled ? "opacity-70" : ""}`}>
              {formatItemNotes(item.notes)}
            </div>
          )}
        </div>
      </div>

      {/* Modal para seleccionar cantidad a cancelar */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              Cancelar {item.product_name}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Cantidad ordenada: <strong>{item.quantity}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Ya cancelados: <strong>{cancelledQty}</strong>
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                ¿Cuántas unidades quieres cancelar?
              </label>

              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setCancelQuantity(Math.max(1, cancelQuantity - 1))
                  }
                  disabled={cancelQuantity <= 1}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  -
                </button>

                <span className="text-lg font-semibold w-8 text-center">
                  {cancelQuantity}
                </span>

                <button
                  onClick={() =>
                    setCancelQuantity(
                      Math.min(availableToCancel, cancelQuantity + 1)
                    )
                  }
                  disabled={cancelQuantity >= availableToCancel}
                  className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Máximo disponible para cancelar: {availableToCancel}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition"
              >
                Volver
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={
                  cancelQuantity <= 0 || cancelQuantity > availableToCancel
                }
                className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition disabled:opacity-50"
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
