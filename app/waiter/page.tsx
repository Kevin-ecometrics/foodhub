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
import { getPrintNodeApiService } from "@/app/lib/printing/printnodeApiService";

// Modal de confirmación con contraseña
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

// Modal para calculadora de pago - MODIFICADO para recibir totalItemsCount
function PaymentCalculatorModal({
  isOpen,
  onClose,
  onConfirm,
  tableNumber,
  totalAmount,
  cancelledItemsCount,
  totalItemsCount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: any) => void;
  tableNumber: number;
  totalAmount: number;
  cancelledItemsCount: number;
  totalItemsCount: number;
}) {
  const [cash, setCash] = useState(0);
  const [terminal, setTerminal] = useState(0);
  const [dollars, setDollars] = useState(0);
  const [exchangeRate, setExchangeRate] = useState(17.5);
  const [showExchangeInput, setShowExchangeInput] = useState(false);

  const totalPaid = cash + terminal + dollars * exchangeRate;
  const change = Math.max(0, totalPaid - totalAmount);
  const pendingAmount = Math.max(0, totalAmount - totalPaid);

  const handleConfirm = () => {
    if (totalPaid < totalAmount) {
      alert(`Falta por pagar: $${pendingAmount.toFixed(2)} MXN`);
      return;
    }

    const paymentData = {
      methods: {
        cash,
        terminal,
        dollars,
      },
      exchangeRate,
      totalPaid,
      change,
    };

    onConfirm(paymentData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Calculadora de Pago - Mesa {tableNumber}
        </h3>

        {/* Resumen de la cuenta - MODIFICADO */}
        <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Productos activos:</span>
            <span className="font-semibold">{totalItemsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Productos cancelados:</span>
            <span className="font-semibold text-red-600">
              {cancelledItemsCount}
            </span>
          </div>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Total a pagar</p>
            <p className="text-3xl font-bold text-blue-700">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Incluye productos en todos los estados (ordered, preparing, ready,
              served)
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Efectivo (MXN)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={cash || ""}
                onChange={(e) => setCash(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <button
                type="button"
                onClick={() => setCash(totalAmount)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
              >
                Llenar
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Terminal (MXN)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={terminal || ""}
              onChange={(e) => setTerminal(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Dólares (USD)
              </label>
              <button
                type="button"
                onClick={() => setShowExchangeInput(!showExchangeInput)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showExchangeInput ? "Ocultar tasa" : "Cambiar tasa"}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={dollars || ""}
                onChange={(e) => setDollars(parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
              <div className="flex items-center px-3 bg-gray-100 rounded-md text-sm">
                = {formatCurrency((dollars || 0) * exchangeRate)}
              </div>
            </div>
            {showExchangeInput && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasa de cambio (USD → MXN)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) =>
                    setExchangeRate(parseFloat(e.target.value) || 17.5)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1 USD = {exchangeRate.toFixed(2)} MXN
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Efectivo:</span>
            <span className="font-medium">{formatCurrency(cash)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Terminal:</span>
            <span className="font-medium">{formatCurrency(terminal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Dólares:</span>
            <span className="font-medium">
              ${(dollars || 0).toFixed(2)} USD ={" "}
              {formatCurrency((dollars || 0) * exchangeRate)}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-200 mt-2">
            <div className="flex justify-between font-medium">
              <span>Total pagado:</span>
              <span
                className={
                  totalPaid >= totalAmount ? "text-green-600" : "text-red-600"
                }
              >
                {formatCurrency(totalPaid)}
              </span>
            </div>
            {totalPaid > totalAmount && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Cambio:</span>
                <span className="text-green-600 font-medium">
                  {formatCurrency(change)}
                </span>
              </div>
            )}
            {totalPaid < totalAmount && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Falta por pagar:</span>
                <span className="text-red-600 font-medium">
                  {formatCurrency(pendingAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={totalPaid < totalAmount}
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente para ordenar mesas
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
  const [printing, setPrinting] = useState<string | null>(null);

  const [fcfsFilter, setFcfsFilter] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waiter_fcfs_filter");
      return saved === "true";
    }
    return false;
  });

  const [tablesOrder, setTablesOrder] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waiter_tables_order");
      return saved || "number";
    }
    return "number";
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingCancelAction, setPendingCancelAction] = useState<{
    itemId: string;
    cancelQuantity: number;
  } | null>(null);

  const [showPaymentCalculator, setShowPaymentCalculator] = useState(false);
  const [pendingPaymentAction, setPendingPaymentAction] = useState<{
    tableId: number;
    tableNumber: number;
    totalAmount: number;
    cancelledItemsCount: number;
    totalItemsCount: number; // NUEVO
  } | null>(null);

  const scrollPositionRef = useRef(0);
  const isUpdatingRef = useRef(false);

  const printService = getPrintNodeApiService();

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

      let processedNotifications = [...notifsData];
      if (fcfsFilter) {
        processedNotifications = applyFcfsFilter(processedNotifications);
      }

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

      setNotifications((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedNotifications)
          ? prev
          : processedNotifications,
      );

      setTables((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedTables)
          ? prev
          : processedTables,
      );
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFcfsFilter = (notificationsList: WaiterNotification[]) => {
    return [...notificationsList].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
  };

  const toggleFcfsFilter = () => {
    const newFcfsState = !fcfsFilter;
    setFcfsFilter(newFcfsState);
    if (notifications.length > 0 && newFcfsState) {
      const filteredNotifications = applyFcfsFilter(notifications);
      setNotifications(filteredNotifications);
    } else if (notifications.length > 0 && !newFcfsState) {
      loadData();
    }
  };

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
        },
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
        },
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
        },
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
        },
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
    cancelQuantity: number = 1,
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
        })),
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
                  item.id === itemId ? { ...item, status: newStatus } : item,
                ),
              }) as never,
          ),
        })),
      );
    } catch (error) {
      console.error("Error actualizando estado:", error);
      await loadData();
    } finally {
      setProcessing(null);
    }
  };

  // Preparar datos para productos CON NOMBRES DE COMENSALES
  const prepareOrderForPrinting = async (
    table: TableWithOrder,
    onlyOrdered: boolean = true,
  ) => {
    const orderItems: any[] = [];
    const productIds = new Set<number>();

    table.orders.forEach((order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const cancelledQty = item.cancelled_quantity || 0;
          const activeQuantity = item.quantity - cancelledQty;
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
          },
        );
      }
    } catch (error) {
      console.error("Error obteniendo categorías de productos:", error);
    }

    const isColdBarCategory = (category: string): boolean => {
      const coldBarCategories = [
        "bebidas",
        "cerveza",
        "cerveza artesanal",
        "coquetos",
        "coquetos clásicos",
        "drink",
        "beverage",
        "bar",
        "refresco",
        "agua",
        "vino",
        "licor",
      ];
      const categoryLower = category.toLowerCase();
      return coldBarCategories.some((cat) => categoryLower.includes(cat));
    };

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

            let categoryType = "other";
            if (isColdBarCategory(productCategory)) {
              categoryType = "cold_bar";
            } else {
              categoryType = "kitchen";
            }

            const customerName =
              item.customer_name || order.customer_name || "Cliente";

            orderItems.push({
              name: item.product_name || "Producto",
              quantity: activeQuantity,
              price: item.price || 0,
              category_type: categoryType,
              notes: item.notes || "",
              customerName: customerName,
              _originalItem: {
                ...item,
                category_type: categoryType,
                status: item.status,
              },
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

  // FUNCIÓN PRINCIPAL: Primero imprime, solo si tiene éxito actualiza estados
  const handlePrintOrder = async (
    tableId: number,
    printType:
      | "all"
      | "kitchen"
      | "bar"
      | "ticket"
      | "final-ticket"
      | "comensales",
  ) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) {
      alert("Mesa no encontrada");
      return;
    }

    setPrinting(`print-${tableId}-${printType}`);

    try {
      const orderData = await prepareOrderForPrinting(
        table,
        printType !== "final-ticket",
      );

      let result;
      let printSuccess = false;

      // PASO 1: PRIMERO INTENTAR IMPRIMIR
      switch (printType) {
        case "all":
          try {
            if (
              orderData.items.some((item) => item.category_type === "kitchen")
            ) {
              await printService.printKitchenTicket(orderData);
            }
            if (
              orderData.items.some((item) => item.category_type === "cold_bar")
            ) {
              await printService.printColdBarTicket(orderData);
            }
            const hasCustomerNames = orderData.items.some(
              (item) => item.customerName && item.customerName !== "Cliente",
            );
            await printService.printTicket(orderData, hasCustomerNames, false);
            result = { success: true };
            printSuccess = true;
          } catch (error) {
            console.error("Error en impresión 'all':", error);
            const browserService = (
              await import("@/app/lib/printing/browserPrintService")
            ).browserPrintService;
            result = await browserService.printAllTickets(orderData);
            printSuccess =
              typeof result === "object" &&
              result !== null &&
              (result as any).success === true;
          }
          break;

        case "kitchen":
          const kitchenItems = orderData.items.filter(
            (item) => item.category_type === "kitchen",
          );
          if (kitchenItems.length === 0) {
            alert("No hay productos de cocina para imprimir");
            setPrinting(null);
            return;
          }
          try {
            result = await printService.printKitchenTicket(orderData);
            printSuccess = true;
          } catch (error) {
            console.error("Error en impresión cocina:", error);
            const browserService = (
              await import("@/app/lib/printing/browserPrintService")
            ).browserPrintService;
            result = await browserService.printKitchenTicket(orderData);
            printSuccess =
              typeof result === "object" &&
              result !== null &&
              (result as any).success === true;
          }
          break;

        case "bar":
          const coldBarItems = orderData.items.filter(
            (item) => item.category_type === "cold_bar",
          );
          if (coldBarItems.length === 0) {
            alert("No hay productos de barra fría para imprimir");
            setPrinting(null);
            return;
          }
          try {
            result = await printService.printColdBarTicket(orderData);
            printSuccess = true;
          } catch (error) {
            console.error("Error en impresión barra:", error);
            const browserService = (
              await import("@/app/lib/printing/browserPrintService")
            ).browserPrintService;
            result = await browserService.printColdBarTicket(orderData);
            printSuccess =
              typeof result === "object" &&
              result !== null &&
              (result as any).success === true;
          }
          break;

        case "ticket":
        case "comensales":
          const hasCustomerNames = orderData.items.some(
            (item) => item.customerName && item.customerName !== "Cliente",
          );
          try {
            result = await printService.printTicket(
              orderData,
              hasCustomerNames,
              false,
            );
            printSuccess = true;
          } catch (error) {
            console.error("Error en impresión ticket:", error);
            const browserService = (
              await import("@/app/lib/printing/browserPrintService")
            ).browserPrintService;
            result = await browserService.printTicket(orderData);
            printSuccess =
              typeof result === "object" &&
              result !== null &&
              (result as any).success === true;
          }
          break;

        case "final-ticket":
          if (orderData.items.length === 0) {
            alert("No hay productos activos para generar el ticket final");
            setPrinting(null);
            return;
          }
          const hasCustomerNamesFinal = orderData.items.some(
            (item) => item.customerName && item.customerName !== "Cliente",
          );
          try {
            result = await printService.printTicket(
              orderData,
              hasCustomerNamesFinal,
              true,
            );
            printSuccess = true;
          } catch (error) {
            console.error("Error en impresión ticket final:", error);
            const browserService = (
              await import("@/app/lib/printing/browserPrintService")
            ).browserPrintService;
            result = await browserService.printFinalTicket(orderData);
            printSuccess =
              typeof result === "object" &&
              result !== null &&
              (result as any).success === true;
          }
          break;
      }

      // Verificar si la impresión fue exitosa
      if (typeof result === "object" && !result.success) {
        const errorMessage = result.error ? result.error : "Error desconocido";
        alert(
          `❌ Error al imprimir: ${errorMessage}\n\nLos productos NO han sido enviados a preparación.`,
        );
        setPrinting(null);
        return;
      }

      // PASO 2: SOLO SI LA IMPRESIÓN FUE EXITOSA, ACTUALIZAR ESTADOS
      if (
        printSuccess &&
        (printType === "kitchen" || printType === "bar" || printType === "all")
      ) {
        const itemsToUpdate: any[] = [];

        orderData.items.forEach((item: any) => {
          if (item._originalItem) {
            const originalItem = item._originalItem;
            if (originalItem.status === "ordered") {
              if (printType === "kitchen" && item.category_type === "kitchen") {
                itemsToUpdate.push(originalItem);
              } else if (
                printType === "bar" &&
                item.category_type === "cold_bar"
              ) {
                itemsToUpdate.push(originalItem);
              } else if (printType === "all") {
                itemsToUpdate.push(originalItem);
              }
            }
          }
        });

        if (itemsToUpdate.length > 0) {
          const itemIds = itemsToUpdate.map((item) => item.id);
          console.log(
            `🔄 Actualizando ${itemsToUpdate.length} items a preparing:`,
            itemIds,
          );

          const { error: updateError } = await supabase
            .from("order_items")
            .update({ status: "preparing" } as never)
            .in("id", itemIds);

          if (updateError) {
            console.error("Error actualizando estados:", updateError);
            alert(
              `⚠️ La impresión fue exitosa pero hubo un error al actualizar los estados.\nError: ${updateError.message}`,
            );
          } else {
            console.log(
              `✅ ${itemsToUpdate.length} item(s) actualizados a "preparing"`,
            );

            setTables((prevTables) =>
              prevTables.map((t) => {
                if (t.id === tableId) {
                  return {
                    ...t,
                    orders: t.orders.map((order) => ({
                      ...order,
                      order_items: order.order_items.map((item: any) => {
                        if (itemIds.includes(item.id)) {
                          return { ...item, status: "preparing" };
                        }
                        return item;
                      }),
                    })),
                  };
                }
                return t;
              }),
            );

            let tipoMensaje = "";
            if (printType === "kitchen") tipoMensaje = "cocina";
            else if (printType === "bar") tipoMensaje = "barra";
            else tipoMensaje = "todas las áreas";

            alert(
              `✅ ${itemsToUpdate.length} producto(s) de ${tipoMensaje} enviado(s) a preparación`,
            );
          }
        } else {
          console.log("⚠️ No se encontraron items para actualizar");
          let tipoMensaje = "";
          if (printType === "kitchen") tipoMensaje = "cocina";
          else if (printType === "bar") tipoMensaje = "barra";
          else tipoMensaje = "ninguna categoría";
          alert(
            `❌ No se encontraron productos de ${tipoMensaje} en estado "ordered" para actualizar`,
          );
        }
      }

      if (typeof result === "object" && result.success) {
        let successMessage = `✅ Impresión enviada correctamente\n`;
        if (result.results) {
          result.results.forEach((r: any) => {
            successMessage += `• ${r.printer}: ${r.success ? "✅" : "❌"}\n`;
          });
        }
        console.log(successMessage);
      }
    } catch (error: any) {
      console.error("Error en impresión:", error);
      alert(
        `❌ Error al imprimir: ${error.message || "Error desconocido"}\n\nLos productos NO han sido enviados a preparación.`,
      );
    } finally {
      setPrinting(null);
    }
  };

  // CORREGIDO: Calcular el total de TODOS los productos activos (no solo "ordered")
  const calculateTableTotal = (table: TableWithOrder) => {
    return table.orders.reduce((total, order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        const orderTotal = order.order_items.reduce(
          (orderSum: number, item: any) => {
            const cancelledQty = item.cancelled_quantity || 0;
            const activeQuantity = item.quantity - cancelledQty;

            // ✅ Incluir TODOS los productos con cantidad activa > 0 y que NO estén cancelados
            if (activeQuantity > 0 && item.status !== "cancelled") {
              return orderSum + item.price * activeQuantity;
            }
            return orderSum;
          },
          0,
        );
        return total + orderTotal;
      }
      return total + order.total_amount;
    }, 0);
  };

  // MODIFICADO: Ahora incluye totalItemsCount
  const handleCobrarMesa = (tableId: number, tableNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) {
      alert("Mesa no encontrada");
      return;
    }

    // ✅ Total de TODOS los productos activos
    const tableTotal = calculateTableTotal(table);

    // Contar productos cancelados
    const cancelledItemsCount = table.orders.reduce((count, order) => {
      return (
        count +
        order.order_items.filter((item: any) => item.status === "cancelled")
          .length
      );
    }, 0);

    // ✅ Contar productos activos totales (todos los estados NO cancelados)
    const totalItemsCount = table.orders.reduce((count, order) => {
      return (
        count +
        order.order_items.filter((item: any) => {
          const activeQuantity = item.quantity - (item.cancelled_quantity || 0);
          return activeQuantity > 0 && item.status !== "cancelled";
        }).length
      );
    }, 0);

    // Debug: Mostrar desglose por estado
    const orderedCount = table.orders.reduce((count, order) => {
      return (
        count +
        order.order_items.filter(
          (item: any) =>
            item.status === "ordered" &&
            item.quantity - (item.cancelled_quantity || 0) > 0,
        ).length
      );
    }, 0);

    const preparingCount = table.orders.reduce((count, order) => {
      return (
        count +
        order.order_items.filter(
          (item: any) =>
            item.status === "preparing" &&
            item.quantity - (item.cancelled_quantity || 0) > 0,
        ).length
      );
    }, 0);

    const readyCount = table.orders.reduce((count, order) => {
      return (
        count +
        order.order_items.filter(
          (item: any) =>
            item.status === "ready" &&
            item.quantity - (item.cancelled_quantity || 0) > 0,
        ).length
      );
    }, 0);

    const servedCount = table.orders.reduce((count, order) => {
      return (
        count +
        order.order_items.filter(
          (item: any) =>
            item.status === "served" &&
            item.quantity - (item.cancelled_quantity || 0) > 0,
        ).length
      );
    }, 0);

    console.log(`💰 Mesa ${tableNumber} - Total a cobrar: $${tableTotal}`);
    console.log(`   Productos activos totales: ${totalItemsCount}`);
    console.log(
      `   Desglose: Ordered: ${orderedCount}, Preparing: ${preparingCount}, Ready: ${readyCount}, Served: ${servedCount}`,
    );
    console.log(`   Cancelados: ${cancelledItemsCount}`);

    setPendingPaymentAction({
      tableId,
      tableNumber,
      totalAmount: tableTotal,
      cancelledItemsCount,
      totalItemsCount, // ✅ NUEVO: Pasamos el total de productos activos
    });

    setShowPaymentCalculator(true);
  };

  // MODIFICADO: Ahora recibe totalItemsCount
  const confirmPayment = async (paymentData: any) => {
    if (!pendingPaymentAction) return;
    const {
      tableId,
      tableNumber,
      totalAmount,
      cancelledItemsCount,
      totalItemsCount,
    } = pendingPaymentAction;
    setProcessing(`cobrar-${tableId}`);
    setShowPaymentCalculator(false);

    try {
      const paymentDetails = {
        methods: paymentData.methods,
        exchangeRate: paymentData.exchangeRate,
        totalAmount: totalAmount,
        totalPaid: paymentData.totalPaid,
        change: paymentData.change,
        timestamp: new Date().toISOString(),
        summary: {
          cash: paymentData.methods.cash,
          terminal: paymentData.methods.terminal,
          dollars: {
            amount: paymentData.methods.dollars,
            exchangeRate: paymentData.exchangeRate,
            equivalentMXN:
              paymentData.methods.dollars * paymentData.exchangeRate,
          },
        },
      };

      const paymentMethodString = JSON.stringify(paymentDetails);
      await waiterService.freeTableAndClean(
        tableId,
        tableNumber,
        paymentMethodString,
      );

      const table = tables.find((t) => t.id === tableId);
      if (table) {
        const orderData = await prepareOrderForPrinting(table, false);
        if (orderData.items.length > 0) {
          const hasCustomerNames = orderData.items.some(
            (item) => item.customerName && item.customerName !== "Cliente",
          );
          try {
            const printResult = await printService.printTicket(
              orderData,
              hasCustomerNames,
              true,
            );
            if (!printResult.success) {
              console.warn(
                "Ticket final no se pudo imprimir:",
                printResult.error,
              );
            }
          } catch (error) {
            console.error("Error imprimiendo ticket final:", error);
          }
        }
      }

      // Mensaje de éxito mejorado
      let successMessage = `✅ Mesa ${tableNumber} cobrada exitosamente\n\n`;
      successMessage += `📊 RESUMEN DE LA CUENTA:\n`;
      successMessage += `• Productos activos cobrados: ${totalItemsCount}\n`;
      successMessage += `• Productos cancelados: ${cancelledItemsCount}\n\n`;
      successMessage += `💰 DETALLES DEL PAGO:\n`;

      if (paymentData.methods.cash > 0) {
        successMessage += `• Efectivo: $${paymentData.methods.cash.toFixed(2)} MXN\n`;
      }
      if (paymentData.methods.terminal > 0) {
        successMessage += `• Tarjeta: $${paymentData.methods.terminal.toFixed(2)} MXN\n`;
      }
      if (paymentData.methods.dollars > 0) {
        successMessage += `• Dólares: $${paymentData.methods.dollars.toFixed(2)} USD\n`;
        successMessage += `  Tasa: ${paymentData.exchangeRate} MXN/USD\n`;
        successMessage += `  Equivalente: $${(paymentData.methods.dollars * paymentData.exchangeRate).toFixed(2)} MXN\n`;
      }

      successMessage += `\n💵 TOTALES:\n`;
      successMessage += `• Total a pagar: $${totalAmount.toFixed(2)} MXN\n`;
      successMessage += `• Total pagado: $${paymentData.totalPaid.toFixed(2)} MXN\n`;

      if (paymentData.change > 0) {
        successMessage += `• Cambio: $${paymentData.change.toFixed(2)} MXN\n`;
      }

      alert(successMessage);
      await loadData();
    } catch (error: any) {
      console.error("Error cobrando mesa:", error);
      alert(`Error al cobrar la mesa ${tableNumber}:\n${error.message}`);
    } finally {
      setProcessing(null);
      setPendingPaymentAction(null);
    }
  };

  const handleGoToTables = () => {
    setActiveTab("tables");
  };

  const handleError = (error: string) => {
    alert(error);
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

      {pendingPaymentAction && (
        <PaymentCalculatorModal
          isOpen={showPaymentCalculator}
          onClose={() => {
            setShowPaymentCalculator(false);
            setPendingPaymentAction(null);
          }}
          onConfirm={confirmPayment}
          tableNumber={pendingPaymentAction.tableNumber}
          totalAmount={pendingPaymentAction.totalAmount}
          cancelledItemsCount={pendingPaymentAction.cancelledItemsCount}
          totalItemsCount={pendingPaymentAction.totalItemsCount} // NUEVO
        />
      )}
    </div>
  );
}
