import { WaiterNotification } from "@/app/lib/supabase/waiter";
import NotificationCard from "./NotificationCard";
import {
  FaCheckCircle,
  FaSortAmountDown,
  FaSortAmountUp,
  FaEye,
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
  const [sortOrder, setSortOrder] = useState<"oldest" | "newest">(() => {
    const savedOrder = localStorage.getItem("notificationsSortOrder");
    return savedOrder === "oldest" || savedOrder === "newest"
      ? savedOrder
      : "oldest";
  });

  useEffect(() => {
    localStorage.setItem("notificationsSortOrder", sortOrder);
  }, [sortOrder]);

  // ✅ CORREGIDO: Calcular correctamente los contadores
  const totalNotifications = notifications.length;
  const attendedCount = attendedNotifications.size;
  const pendingCount = totalNotifications - attendedCount;

  // ✅ Mostrar TODAS las notificaciones, pero marcar las atendidas
  const allNotifications = [...notifications];

  // Ordenar notificaciones
  const sortedNotifications = useMemo(() => {
    const filtered = [...allNotifications];

    return filtered.sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();

      if (sortOrder === "oldest") {
        return timeA - timeB;
      } else {
        return timeB - timeA;
      }
    });
  }, [allNotifications, sortOrder]);

  return (
    <div className="space-y-4">
      {/* Encabezado con contadores mejorados */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Notificaciones</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                {pendingCount} pendientes
              </span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {attendedCount} vistas
              </span>
              <span className="text-sm bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
                {totalNotifications} total
              </span>
            </div>
          </div>

          {/* Filtro de orden */}
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

          {/* Resumen de notificaciones */}
          <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaEye className="text-blue-500" />
                <span>
                  <strong>{attendedCount}</strong> notificación(es) vista(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-green-500" />
                <span>
                  <strong>{pendingCount}</strong> pendiente(s) por completar
                </span>
              </div>
            </div>
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
