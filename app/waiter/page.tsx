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
import { browserPrintService } from "@/app/lib/printing/browserPrintService"; // IMPORTACIÓN NUEVA

// Modal de confirmación con contraseña - SIMPLIFICADO
function PasswordModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Confirmar Cancelación
        </h3>

        <p className="text-gray-600 mb-4">
          Ingrese la contraseña para confirmar la cancelación del producto.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contraseña:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contraseña de autorización"
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
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente simple para ordenar mesas
function TablesOrderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-300">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Ordenar mesas:
        </span>

        <div className="flex bg-gray-100 rounded-lg">
          <button
            onClick={() => onChange("number")}
            className={`
          flex items-center gap-2 px-3 py-2 rounded-l-lg text-sm
          ${
            value === "number"
              ? "bg-blue-500 text-white"
              : "text-gray-600 hover:bg-gray-200"
          }
        `}
            title="Ordenar por número de mesa"
          >
            <span>#</span>
            <span>Número</span>
          </button>
          <button
            onClick={() => onChange("occupation")}
            className={`
          flex items-center gap-2 px-3 py-2 rounded-r-lg text-sm
          ${
            value === "occupation"
              ? "bg-blue-500 text-white"
              : "text-gray-600 hover:bg-gray-200"
          }
        `}
            title="Ordenar por tiempo de ocupación"
          >
            <span>🕐</span>
            <span>Tiempo</span>
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
  const [printing, setPrinting] = useState<string | null>(null); // ESTADO NUEVO para controlar impresión

  // Estado para el filtro FCFS (notificaciones)
  const [fcfsFilter, setFcfsFilter] = useState(() => {
    // Cargar desde localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waiter_fcfs_filter");
      return saved === "true";
    }
    return false;
  });

  // Estado para ordenar mesas
  const [tablesOrder, setTablesOrder] = useState<string>(() => {
    // Cargar desde localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waiter_tables_order");
      return saved || "number";
    }
    return "number";
  });

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
    }, 120000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Guardar estados en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem("waiter_fcfs_filter", fcfsFilter.toString());
  }, [fcfsFilter]);

  useEffect(() => {
    localStorage.setItem("waiter_tables_order", tablesOrder);
  }, [tablesOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsData, tablesData] = await Promise.all([
        waiterService.getPendingNotifications(),
        waiterService.getTablesWithOrders(),
      ]);

      // Aplicar filtro FCFS si está activo
      let processedNotifications = [...notifsData];
      if (fcfsFilter) {
        processedNotifications = applyFcfsFilter(processedNotifications);
      }

      // Procesar los datos
      const processedTables = tablesData.map((table) => ({
        ...table,
        orders: table.orders.map((order) => ({
          ...order,
          order_items: order.order_items.map((item) => {
            const cancelledQty = item.cancelled_quantity || 0;
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

      // Actualizar estados
      setNotifications((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedNotifications)
          ? prev
          : processedNotifications
      );

      setTables((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedTables)
          ? prev
          : processedTables
      );
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar el filtro FCFS
  const applyFcfsFilter = (notificationsList: WaiterNotification[]) => {
    return [...notificationsList].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
  };

  // Función para alternar el filtro FCFS
  const toggleFcfsFilter = () => {
    const newFcfsState = !fcfsFilter;
    setFcfsFilter(newFcfsState);

    // Aplicar/remover filtro inmediatamente
    if (notifications.length > 0 && newFcfsState) {
      const filteredNotifications = applyFcfsFilter(notifications);
      setNotifications(filteredNotifications);
    } else if (notifications.length > 0 && !newFcfsState) {
      loadData();
    }
  };

  // Función para cambiar el orden de mesas
  const handleTablesOrderChange = (order: string) => {
    setTablesOrder(order);
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
      console.error("Error marcando notificación como atendida:", error);
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
      console.error("Error completando notificación:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelItem = async (
    itemId: string,
    cancelQuantity: number = 1
  ) => {
    setPendingCancelAction({ itemId, cancelQuantity });
    setShowPasswordModal(true);
  };

  const executeCancelItem = async () => {
    if (!pendingCancelAction) return;

    const { itemId, cancelQuantity } = pendingCancelAction;
    setProcessing(itemId);

    try {
      await waiterService.cancelOrderItem(itemId, cancelQuantity);

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
    } catch (error: any) {
      console.error("Error cancelando producto:", error);
      alert(`Error al cancelar el producto:\n${error.message}`);
      await loadData();
    } finally {
      setProcessing(null);
      setPendingCancelAction(null);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    setProcessing(itemId);
    try {
      await waiterService.updateItemStatus(itemId, newStatus as never);

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
      console.error("Error actualizando estado:", error);
      await loadData();
    } finally {
      setProcessing(null);
    }
  };

  // FUNCIÓN 1: Preparar datos para productos ORDENADOS (solo status "ordered")
  const prepareOrderForPrinting = async (
    table: TableWithOrder,
    onlyOrdered: boolean = true
  ) => {
    const orderItems: any[] = [];
    const productIds = new Set<number>();

    table.orders.forEach((order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const cancelledQty = item.cancelled_quantity || 0;
          const activeQuantity = item.quantity - cancelledQty;

          // FILTRO: Si onlyOrdered es true, solo procesar items "ordered"
          // Si es false, procesar TODOS los items activos (no cancelled)
          const shouldInclude = onlyOrdered
            ? activeQuantity > 0 && item.status === "ordered" && item.product_id
            : activeQuantity > 0 &&
              item.status !== "cancelled" &&
              item.product_id;

          if (shouldInclude) {
            productIds.add(item.product_id);
          }
        });
      }
    });

    if (productIds.size === 0) {
      return {
        orderId: table.orders[0]?.id || `MESA-${table.number}`,
        tableNumber: table.number,
        customerCount: table.capacity || 1,
        area: table.location || "Interior",
        items: [],
        total: 0,
        createdAt: table.orders[0]?.created_at || new Date().toISOString(),
        waiter: table.orders[0]?.waiter_name || "Sistema",
      };
    }

    const productsMap = new Map<number, { category: string }>();

    try {
      const { data: products, error } = (await supabase
        .from("products")
        .select("id, category")
        .in("id", Array.from(productIds))) as any;

      if (!error && products) {
        (products as Array<{ id: number; category: string }>).forEach(
          (product) => {
            productsMap.set(product.id, {
              category: product.category,
            });
          }
        );
      }
    } catch (error) {
      console.error("Error obteniendo categorías de productos:", error);
    }

    table.orders.forEach((order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const cancelledQty = item.cancelled_quantity || 0;
          const activeQuantity = item.quantity - cancelledQty;

          const shouldInclude = onlyOrdered
            ? activeQuantity > 0 && item.status === "ordered"
            : activeQuantity > 0 && item.status !== "cancelled";

          if (shouldInclude) {
            const productInfo = productsMap.get(item.product_id);
            const productCategory = productInfo?.category || "Entradas";

            const categoryType =
              browserPrintService.determineCategoryType(productCategory);

            orderItems.push({
              name: item.product_name || "Producto",
              quantity: activeQuantity,
              price: item.price || 0,
              category_type: categoryType,
              notes: item.notes || "",
            });
          }
        });
      }
    });

    const calculateTotal = () => {
      let total = 0;
      table.orders.forEach((order) => {
        if (order.order_items && Array.isArray(order.order_items)) {
          order.order_items.forEach((item: any) => {
            const cancelledQty = item.cancelled_quantity || 0;
            const activeQuantity = item.quantity - cancelledQty;

            const shouldInclude = onlyOrdered
              ? activeQuantity > 0 && item.status === "ordered"
              : activeQuantity > 0 && item.status !== "cancelled";

            if (shouldInclude) {
              total += (item.price || 0) * activeQuantity;
            }
          });
        }
      });
      return total;
    };

    const orderData = {
      orderId: table.orders[0]?.id || `MESA-${table.number}`,
      tableNumber: table.number,
      customerCount: table.capacity || 1,
      area: table.location || "Interior",
      items: orderItems,
      total: calculateTotal(),
      createdAt: table.orders[0]?.created_at || new Date().toISOString(),
      waiter: table.orders[0]?.waiter_name || "Sistema",
    };

    return orderData;
  };

  // FUNCIÓN MODIFICADA: Manejar impresión de pedido
  const handlePrintOrder = async (
    tableId: number,
    printType: "all" | "kitchen" | "bar" | "ticket" | "final-ticket"
  ) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) {
      alert("Mesa no encontrada");
      return;
    }

    setPrinting(`print-${tableId}-${printType}`);

    try {
      let orderData;
      let result = false;

      switch (printType) {
        case "all":
          orderData = await prepareOrderForPrinting(table, true); // Solo ordered
          result = await browserPrintService.printAllTickets(orderData);
          break;

        case "kitchen":
          orderData = await prepareOrderForPrinting(table, true); // Solo ordered
          result = await browserPrintService.printKitchenTicket(orderData);
          break;

        case "bar":
          orderData = await prepareOrderForPrinting(table, true); // Solo ordered
          result = await browserPrintService.printColdBarTicket(orderData);
          break;

        case "ticket":
          orderData = await prepareOrderForPrinting(table, true); // Solo ordered
          result = await browserPrintService.printTicket(orderData);
          break;

        case "final-ticket":
          orderData = await prepareOrderForPrinting(table, false); // TODOS activos
          if (orderData.items.length === 0) {
            alert("No hay productos activos para generar el ticket final");
            setPrinting(null);
            return;
          }
          result = await browserPrintService.printFinalTicket(orderData);
          break;
      }

      if (!result) {
        alert(
          "No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes."
        );
      }
    } catch (error) {
      console.error("Error en impresión:", error);
      alert("Error al generar el ticket de impresión");
    } finally {
      setPrinting(null);
    }
  };

  const handleCobrarMesa = async (tableId: number, tableNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    const tableTotal = table ? calculateTableTotal(table) : 0;

    const cancelledItemsCount = table
      ? table.orders.reduce((count, order) => {
          return (
            count +
            order.order_items.filter((item: any) => item.status === "cancelled")
              .length
          );
        }, 0)
      : 0;

    const billNotification = notifications.find(
      (notification) =>
        notification.table_id === tableId &&
        notification.type === "bill_request"
    );

    const paymentMethod = billNotification?.payment_method || null;

    let paymentMethodText = "";
    if (paymentMethod === "cash") {
      paymentMethodText = "Pago en EFECTIVO";
    } else if (paymentMethod === "terminal") {
      paymentMethodText = "Pago con TERMINAL";
    } else {
      paymentMethodText = "Método de pago no especificado";
    }

    let confirmationMessage = `¿Cobrar Mesa ${tableNumber}?\n\n${paymentMethodText}\nTotal: $${tableTotal.toFixed(
      2
    )}`;

    if (cancelledItemsCount > 0) {
      confirmationMessage += `\n\n${cancelledItemsCount} producto(s) cancelado(s) excluidos.`;
    }

    // Agregar opción de imprimir ticket final
    const printTicket = confirm(
      confirmationMessage + `\n\n¿Desea imprimir el ticket final?`
    );

    if (!printTicket) {
      return;
    }

    setProcessing(`cobrar-${tableId}`);
    try {
      // Primero cobrar la mesa
      await waiterService.freeTableAndClean(
        tableId,
        tableNumber,
        paymentMethod
      );

      // Luego imprimir el ticket final si el usuario confirmó
      if (table) {
        const orderData = await prepareOrderForPrinting(table, false); // TODOS los activos para ticket final
        if (orderData.items.length > 0) {
          await browserPrintService.printFinalTicket(orderData);
        }
      }

      let successMessage = `Mesa ${tableNumber} cobrada.\n\n`;
      if (paymentMethod === "cash") {
        successMessage += `Pago en EFECTIVO\n`;
      } else if (paymentMethod === "terminal") {
        successMessage += `Pago con TERMINAL\n`;
      }
      successMessage += `Total: $${tableTotal.toFixed(2)}\n`;

      if (cancelledItemsCount > 0) {
        successMessage += `${cancelledItemsCount} producto(s) cancelado(s) excluidos\n`;
      }

      alert(successMessage);

      await loadData();
    } catch (error: any) {
      console.error("Error cobrando mesa:", error);
      alert(`Error al cobrar la mesa ${tableNumber}:\n${error.message}`);
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

  const calculateTableTotal = (table: TableWithOrder) => {
    return table.orders.reduce((total, order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        const orderTotal = order.order_items.reduce(
          (orderSum: number, item: any) => {
            const cancelledQty = item.cancelled_quantity || 0;
            const activeQuantity = item.quantity - cancelledQty;

            // Solo sumar items con status "ordered" para coincidir con impresión
            if (activeQuantity > 0 && item.status === "ordered") {
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
    <div className="min-h-screen bg-gray-50">
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
          <>
            <NotificationsTab
              notifications={notifications}
              processing={processing}
              attendedNotifications={attendedNotifications}
              onAcknowledgeNotification={handleAcknowledgeNotification}
              onCompleteNotification={handleCompleteNotification}
              onGoToTables={handleGoToTables}
            />
          </>
        )}

        {activeTab === "tables" && (
          <>
            <TablesOrderSelect
              value={tablesOrder}
              onChange={handleTablesOrderChange}
            />

            <TablesTab
              tables={tables}
              processing={processing}
              printing={printing}
              onUpdateItemStatus={handleUpdateItemStatus}
              onCobrarMesa={handleCobrarMesa}
              calculateTableTotal={calculateTableTotal}
              notifications={notifications}
              onCancelItem={handleCancelItem}
              onPrintOrder={handlePrintOrder}
              tablesOrder={tablesOrder}
            />
          </>
        )}

        {activeTab === "products" && (
          <ProductsManagement onError={handleError} />
        )}
      </main>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={executeCancelItem}
      />
    </div>
  );
}
