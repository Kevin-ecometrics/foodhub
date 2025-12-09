import { WaiterNotification } from "@/app/lib/supabase/waiter";
import NotificationCard from "./NotificationCard";
import {
  FaCheckCircle,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { useState, useMemo, useEffect } from "react";

interface NotificationsTabProps {
  notifications: WaiterNotification[];
  processing: string | null;
  attendedNotifications: Set<string>;
  onAcknowledgeNotification: (notificationId: string) => void;
  onCompleteNotification: (notificationId: string) => void;
  onGoToTables: () => void;
}

export default function NotificationsTab({
  notifications,
  processing,
  attendedNotifications,
  onAcknowledgeNotification,
  onCompleteNotification,
  onGoToTables,
}: NotificationsTabProps) {
  // Inicializar el estado desde localStorage
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">(() => {
    // Intentar obtener el valor guardado en localStorage
    const savedOrder = localStorage.getItem("notificationsSortOrder");
    // Si existe y es válido, usarlo, sino usar "oldest" por defecto
    return savedOrder === "oldest" || savedOrder === "newest"
      ? savedOrder
      : "oldest";
  });

  // Guardar en localStorage cada vez que cambia el orden
  useEffect(() => {
    localStorage.setItem("notificationsSortOrder", sortOrder);
  }, [sortOrder]);

  // Filtrar solo pendientes
  const pendingNotifications = notifications.filter(
    (n) => !attendedNotifications.has(n.id)
  );

  // Ordenar notificaciones
  const sortedNotifications = useMemo(() => {
    const filtered = [...pendingNotifications];

    return filtered.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();

      if (sortOrder === "oldest") {
        // Más antiguas primero
        return timeA - timeB;
      } else {
        // Más nuevas primero
        return timeB - timeA;
      }
    });
  }, [pendingNotifications, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Encabezado simple con filtro */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Notificaciones</h1>
            <p className="text-sm text-gray-600">
              {pendingNotifications.length} pendientes
            </p>
          </div>

          {/* Filtro simple */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Orden:
            </span>
            <div className="flex bg-gray-100 rounded-lg">
              <button
                onClick={() => setSortOrder("oldest")}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-l-lg text-sm font-medium
                  ${
                    sortOrder === "oldest"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }
                `}
                title="Mostrar más antiguas primero"
              >
                <FaSortAmountDown />
                <span className="hidden sm:inline">Antiguas</span>
              </button>

              <button
                onClick={() => setSortOrder("newest")}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-r-lg text-sm font-medium
                  ${
                    sortOrder === "newest"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }
                `}
                title="Mostrar más nuevas primero"
              >
                <FaSortAmountUp />
                <span className="hidden sm:inline">Nuevas</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      {sortedNotifications.length === 0 ? (
        <EmptyNotificationsState />
      ) : (
        <div className="space-y-3">
          {sortedNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              processing={processing}
              isAttended={attendedNotifications.has(notification.id)}
              onAcknowledge={() => {
                onAcknowledgeNotification(notification.id);
                onGoToTables();
              }}
              onComplete={() => onCompleteNotification(notification.id)}
            />
          ))}

          {/* Contador simple */}
          <div className="text-center text-sm text-gray-500 pt-2">
            {sortedNotifications.length} notificación
            {sortedNotifications.length !== 1 ? "es" : ""} pendiente
            {sortedNotifications.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyNotificationsState() {
  return (
    <div className="text-center py-16 bg-white rounded-lg shadow">
      <FaCheckCircle className="text-5xl text-green-400 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-gray-900 mb-2">¡Todo al día!</h3>
      <p className="text-gray-500">No hay notificaciones pendientes</p>
    </div>
  );
}
