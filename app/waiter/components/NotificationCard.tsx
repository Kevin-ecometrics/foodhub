import { WaiterNotification } from "@/app/lib/supabase/waiter";
import { FaEye, FaCheck, FaSpinner, FaClock, FaUser } from "react-icons/fa";
import { HiOutlineCheckCircle, HiOutlineExclamation } from "react-icons/hi";
import NotificationIcon from "./NotificationIcon";

interface NotificationCardProps {
  notification: WaiterNotification;
  processing: string | null;
  isAttended: boolean;
  onAcknowledge: () => void;
  onComplete: () => void;
}

// Mapa de colores y etiquetas para tipos de notificación
const NOTIFICATION_TYPES = {
  new_order: {
    color: "border-l-green-500 bg-green-50",
    label: "Nuevo Pedido",
    iconColor: "text-green-600",
  },
  assistance: {
    color: "border-l-yellow-500 bg-yellow-50",
    label: "Asistencia",
    iconColor: "text-yellow-600",
  },
  bill_request: {
    color: "border-l-red-500 bg-red-50",
    label: "Cuenta",
    iconColor: "text-red-600",
  },
  order_updated: {
    color: "border-l-blue-500 bg-blue-50",
    label: "Pedido Actualizado",
    iconColor: "text-blue-600",
  },
  table_freed: {
    color: "border-l-purple-500 bg-purple-50",
    label: "Mesa Libre",
    iconColor: "text-purple-600",
  },
} as const;

// Formatear fecha relativa
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "Ahora mismo";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export default function NotificationCard({
  notification,
  processing,
  isAttended,
  onAcknowledge,
  onComplete,
}: NotificationCardProps) {
  const notificationType = NOTIFICATION_TYPES[
    notification.type as keyof typeof NOTIFICATION_TYPES
  ] || {
    color: "border-l-gray-500 bg-gray-50",
    label: "Notificación",
    iconColor: "text-gray-600",
  };

  const isProcessing = processing === notification.id;
  const isUrgent =
    notification.type === "bill_request" || notification.type === "assistance";
  const timeElapsed = getRelativeTime(notification.created_at);

  return (
    <div
      className={`
        rounded-lg shadow-md border-l-4 transition-all duration-200
        hover:shadow-lg hover:-translate-y-0.5
        ${notificationType.color}
        ${isAttended ? "opacity-80 scale-[0.98]" : ""}
        ${isProcessing ? "animate-pulse" : ""}
        ${isUrgent && !isAttended ? "ring-2 ring-opacity-30 ring-red-300" : ""}
      `}
      role="article"
      aria-labelledby={`notification-${notification.id}`}
      aria-describedby={`notification-desc-${notification.id}`}
    >
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          {/* Información de la notificación */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className={`mt-1 ${notificationType.iconColor}`}>
                <NotificationIcon type={notification.type} />
              </div>

              <div className="flex-1 min-w-0">
                {/* Encabezado */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3
                      id={`notification-${notification.id}`}
                      className="font-bold text-gray-800 truncate"
                    >
                      Mesa {notification.tables?.number || "N/A"}
                    </h3>

                    {/* Badge de tipo */}
                    <span
                      className={`
                      text-xs font-semibold px-2 py-1 rounded-full
                      ${isUrgent ? "animate-pulse" : ""}
                    `}
                    >
                      {notificationType.label}
                    </span>
                  </div>

                  {/* Estado */}
                  <div className="flex items-center gap-2 ml-auto sm:ml-0">
                    {isAttended ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        <HiOutlineCheckCircle />
                        Atendida
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        <HiOutlineExclamation />
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Cliente */}
                {notification.orders?.customer_name && (
                  <div className="flex items-center gap-1 text-gray-700 mb-1">
                    <FaUser className="text-gray-400 text-sm" />
                    <span className="font-medium">
                      {notification.orders.customer_name}
                    </span>
                  </div>
                )}

                {/* Mensaje */}
                <p
                  id={`notification-desc-${notification.id}`}
                  className="text-gray-600 mb-2 line-clamp-2"
                >
                  {notification.message}
                </p>

                {/* Timestamp */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FaClock className="text-gray-400" />
                  <time dateTime={notification.created_at}>
                    {new Date(notification.created_at).toLocaleString()}
                  </time>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {timeElapsed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex sm:flex-col gap-2 sm:gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            {!isAttended && (
              <button
                onClick={onAcknowledge}
                disabled={isProcessing}
                className={`
                  flex-1 sm:flex-none flex items-center justify-center gap-2
                  px-4 py-2 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  ${
                    isProcessing
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                  }
                  text-white shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-60
                `}
                aria-label={`Atender notificación de mesa ${notification.tables?.number}`}
                aria-busy={isProcessing}
              >
                {isProcessing ? (
                  <FaSpinner className="animate-spin" />
                ) : (
                  <FaEye />
                )}
                <span className="hidden sm:inline">Atender</span>
              </button>
            )}

            <button
              onClick={onComplete}
              disabled={isProcessing}
              className={`
                flex-1 sm:flex-none flex items-center justify-center gap-2
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors duration-200
                ${
                  isProcessing
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600 active:bg-green-700"
                }
                text-white shadow-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                disabled:opacity-60
              `}
              aria-label={`Completar notificación de mesa ${notification.tables?.number}`}
              aria-busy={isProcessing}
            >
              {isProcessing ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaCheck />
              )}
              <span className="hidden sm:inline">Completar</span>
            </button>
          </div>
        </div>

        {/* Indicador de urgencia */}
        {isUrgent && !isAttended && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-1 text-sm text-red-600 font-medium">
              <HiOutlineExclamation className="text-red-500" />
              <span>Atención requerida</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
