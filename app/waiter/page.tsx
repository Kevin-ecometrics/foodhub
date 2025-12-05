/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef } from "react";
import {
  waiterService,
  WaiterNotification,
  TableWithOrder,
} from "@/app/lib/supabase/waiter";
import { supabase } from "@/app/lib/supabase/client";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import NotificationsTab from "./components/NotificationsTab";
import TablesTab from "./components/TablesTab";
import ProductsManagement from "./components/ProductsManagement";
import LoadingScreen from "./components/LoadingScreen";

// Modal de confirmación con contraseña
function PasswordModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (password === "lamaquila2025") {
      setError("");
      setPassword("");
      onConfirm();
      onClose();
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña de confirmación:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ingresa la contraseña"
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleConfirm();
              }
            }}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            disabled={!password}
          >
            Confirmar Cancelación
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WaiterDashboard() {
  const [notifications, setNotifications] = useState<WaiterNotification[]>([]);
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [activeTab, setActiveTab] = useState<
    "notifications" | "tables" | "products"
  >("notifications");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [attendedNotifications, setAttendedNotifications] = useState<
    Set<string>
  >(new Set());

  // Estados para el modal de contraseña
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingCancelAction, setPendingCancelAction] = useState<{
    itemId: string;
    cancelQuantity: number;
  } | null>(null);

  // Referencia para guardar la posición del scroll
  const scrollPositionRef = useRef(0);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    loadData();
    const unsubscribe = setupRealtimeSubscription();

    const interval = setInterval(() => {
      if (isUpdatingRef.current) return; // Evitar múltiples actualizaciones simultáneas

      isUpdatingRef.current = true;
      // Guardar posición actual del scroll antes de actualizar
      scrollPositionRef.current =
        window.scrollY || document.documentElement.scrollTop;

      console.log(
        "🔄 Auto-actualizando, posición guardada:",
        scrollPositionRef.current
      );

      loadData().finally(() => {
        // Pequeño delay para asegurar que el DOM se haya actualizado
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
          console.log("📍 Scroll restaurado a:", scrollPositionRef.current);
          isUpdatingRef.current = false;
        }, 100);
      });
    }, 120000);

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

      // PROCESAR LOS DATOS PARA ASEGURAR QUE CANCELLED_QUANTITY ESTÉ CORRECTO
      const processedTables = tablesData.map((table) => ({
        ...table,
        orders: table.orders.map((order) => ({
          ...order,
          order_items: order.order_items.map((item) => {
            // Asegurar que cancelled_quantity siempre tenga un valor
            const cancelledQty = item.cancelled_quantity || 0;

            // Si el item está marcado como 'cancelled' pero no tiene cancelled_quantity,
            // asumimos que toda la cantidad está cancelada
            const finalCancelledQty =
              item.status === "cancelled" && cancelledQty === 0
                ? item.quantity
                : cancelledQty;

            return {
              ...item,
              cancelled_quantity: finalCancelledQty,
            };
          }),
        })),
      }));

      // Actualizar estados solo si los datos realmente cambiaron
      setNotifications((prev) =>
        JSON.stringify(prev) === JSON.stringify(notifsData) ? prev : notifsData
      );

      setTables((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedTables)
          ? prev
          : processedTables
      );

      console.log("🔄 Datos actualizados - Items procesados:", {
        totalMesas: processedTables.length,
        itemsConCancelados: processedTables.flatMap((t) =>
          t.orders.flatMap((o) =>
            o.order_items.filter((i) => i.cancelled_quantity > 0)
          )
        ).length,
      });
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
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;

          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
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
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;

          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
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
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;

          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
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
          if (isUpdatingRef.current) return;

          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;

          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
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

  const handleCancelItem = async (
    itemId: string,
    cancelQuantity: number = 1
  ) => {
    // Mostrar modal de confirmación con contraseña
    setPendingCancelAction({ itemId, cancelQuantity });
    setShowPasswordModal(true);
  };

  // Función que se ejecuta después de confirmar la contraseña
  const executeCancelItem = async () => {
    if (!pendingCancelAction) return;

    const { itemId, cancelQuantity } = pendingCancelAction;
    setProcessing(itemId);

    try {
      // Cancelar la cantidad específica
      await waiterService.cancelOrderItem(itemId, cancelQuantity);

      // Actualizar el estado local
      setTables((prevTables) =>
        prevTables.map((table) => ({
          ...table,
          orders: table.orders.map((order) => ({
            ...order,
            order_items: order.order_items.map((item) => {
              if (item.id === itemId) {
                const newCancelledQty =
                  (item.cancelled_quantity || 0) + cancelQuantity;
                const newStatus =
                  item.quantity - newCancelledQty === 0
                    ? "cancelled"
                    : item.status;

                return {
                  ...item,
                  cancelled_quantity: newCancelledQty,
                  status: newStatus,
                };
              }
              return item;
            }),
          })),
        }))
      );

      console.log(`✅ ${cancelQuantity} producto(s) cancelado(s) exitosamente`);
    } catch (error: any) {
      console.error("Error cancelando producto:", error);
      alert(`❌ Error al cancelar el producto:\n${error.message}`);
      await loadData();
    } finally {
      setProcessing(null);
      setPendingCancelAction(null);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    setProcessing(itemId);
    try {
      // Actualizar solo el item específico en lugar de recargar todo
      await waiterService.updateItemStatus(itemId, newStatus as never);

      // En lugar de loadData(), actualizar solo el estado local
      setTables((prevTables) =>
        prevTables.map((table) => ({
          ...table,
          orders: table.orders.map(
            (order) =>
              ({
                ...order,
                order_items: order.order_items.map((item) =>
                  item.id === itemId ? { ...item, status: newStatus } : item
                ),
              } as never)
          ),
        }))
      );
    } catch (error) {
      console.error("Error updating item status:", error);
      // Si hay error, entonces sí recargar todo
      await loadData();
    } finally {
      setProcessing(null);
    }
  };

  const handleCobrarMesa = async (tableId: number, tableNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    const tableTotal = table ? calculateTableTotal(table) : 0;

    // Calcular cantidad de items cancelados
    const cancelledItemsCount = table
      ? table.orders.reduce((count, order) => {
          return (
            count +
            order.order_items.filter((item: any) => item.status === "cancelled")
              .length
          );
        }, 0)
      : 0;

    // Buscar notificación de cuenta para esta mesa
    const billNotification = notifications.find(
      (notification) =>
        notification.table_id === tableId &&
        notification.type === "bill_request"
    );

    // Obtener el método de pago de la notificación (si existe)
    const paymentMethod = billNotification?.payment_method || null;

    let paymentMethodText = "";
    if (paymentMethod === "cash") {
      paymentMethodText = "💰 Pago en EFECTIVO";
    } else if (paymentMethod === "terminal") {
      paymentMethodText = "💳 Pago con TERMINAL";
    } else {
      paymentMethodText = "❓ Método de pago no especificado";
    }

    let confirmationMessage = `¿Estás seguro de que quieres COBRAR la Mesa ${tableNumber}?\n\n${paymentMethodText}\n💰 Total: $${tableTotal.toFixed(
      2
    )}`;

    // Agregar información sobre cancelados si existen
    if (cancelledItemsCount > 0) {
      confirmationMessage += `\n\n📝 Nota: ${cancelledItemsCount} producto(s) cancelado(s) no se incluirán en la cuenta.`;
    }

    confirmationMessage += `\n\n📊 Se guardará el historial de venta y se liberará la mesa.`;

    if (!confirm(confirmationMessage)) {
      return;
    }

    setProcessing(`cobrar-${tableId}`);
    try {
      console.log(
        `💵 Iniciando cobro para mesa ${tableNumber}, método: ${paymentMethod}`
      );

      await waiterService.freeTableAndClean(
        tableId,
        tableNumber,
        paymentMethod
      );

      let successMessage = `✅ Mesa ${tableNumber} cobrada exitosamente!\n\n`;
      if (paymentMethod === "cash") {
        successMessage += `💰 Pago en EFECTIVO\n`;
      } else if (paymentMethod === "terminal") {
        successMessage += `💳 Pago con TERMINAL\n`;
      }
      successMessage += `💵 Total: $${tableTotal.toFixed(2)}\n`;

      // Agregar info sobre cancelados en el mensaje de éxito
      if (cancelledItemsCount > 0) {
        successMessage += `📝 ${cancelledItemsCount} producto(s) cancelado(s) excluidos\n`;
      }

      successMessage += `📈 Historial guardado correctamente`;

      alert(successMessage);

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

  const handleError = (error: string) => {
    alert(error);
  };

  // FUNCIÓN CORREGIDA: Calcular el total REAL excluyendo cancelados
  const calculateTableTotal = (table: TableWithOrder) => {
    return table.orders.reduce((total, order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        const orderTotal = order.order_items.reduce(
          (orderSum: number, item: any) => {
            // Calcular cantidad activa (excluyendo cancelados)
            const cancelledQty = item.cancelled_quantity || 0;
            const activeQuantity = item.quantity - cancelledQty;

            // Solo sumar si hay cantidad activa
            if (activeQuantity > 0) {
              return orderSum + item.price * activeQuantity;
            }
            return orderSum;
          },
          0
        );
        return total + orderTotal;
      }
      return total + order.total_amount;
    }, 0);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header loading={loading} onRefresh={loadData} />

      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationsCount={notifications.length}
        occupiedTablesCount={
          tables.filter((t) => t.status === "occupied").length
        }
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={notifications}
            processing={processing}
            attendedNotifications={attendedNotifications}
            onAcknowledgeNotification={handleAcknowledgeNotification}
            onCompleteNotification={handleCompleteNotification}
            onGoToTables={handleGoToTables}
          />
        )}

        {activeTab === "tables" && (
          <TablesTab
            tables={tables}
            processing={processing}
            onUpdateItemStatus={handleUpdateItemStatus}
            onCobrarMesa={handleCobrarMesa}
            calculateTableTotal={calculateTableTotal}
            notifications={notifications}
            onCancelItem={handleCancelItem}
          />
        )}

        {activeTab === "products" && (
          <ProductsManagement onError={handleError} />
        )}
      </main>

      {/* Modal de confirmación con contraseña */}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={executeCancelItem}
        title="Confirmar Cancelación de Producto"
        message="Para cancelar este producto, ingresa la contraseña de autorización:"
      />
    </div>
  );
}
