/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    console.log("🎯 WaiterDashboard: Iniciando con Realtime puro");
    loadData();
    const unsubscribe = setupRealtimeSubscription();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("📥 Cargando datos...");

      const [notifsData, tablesData] = await Promise.all([
        waiterService.getPendingNotifications(),
        waiterService.getTablesWithOrders(),
      ]);

      console.log("✅ Datos cargados:", {
        notificaciones: notifsData.length,
        mesas: tablesData.length,
        ordenes: tablesData.reduce(
          (total, table) => total + table.orders.length,
          0
        ),
      });

      setNotifications(notifsData);
      setTables(tablesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    console.log("🔔 Configurando suscripciones Realtime...");

    // Suscripción para NOTIFICACIONES
    const notificationsSub = supabase
      .channel("waiter-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_notifications",
        },
        (payload) => {
          console.log(
            "🔔 EVENTO Realtime - Notificación:",
            payload.eventType,
            payload.new
          );
          loadData(); // Recargar cuando haya cambios en notificaciones
        }
      )
      .subscribe((status) => {
        console.log("📡 Notificaciones - Estado:", status);
      });

    // Suscripción para ÓRDENES (CRÍTICO)
    const ordersSub = supabase
      .channel("waiter-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log(
            "🔔 EVENTO Realtime - Orden:",
            payload.eventType,
            payload.new
          );
          loadData(); // Recargar cuando haya nuevas órdenes o cambios
        }
      )
      .subscribe((status) => {
        console.log("📡 Órdenes - Estado:", status);
      });

    // Suscripción para ITEMS DE ORDEN
    const orderItemsSub = supabase
      .channel("waiter-order-items-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        (payload) => {
          console.log("🔔 EVENTO Realtime - Order Item:", payload.eventType);
          // Para items, podemos actualizar de forma más granular
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "DELETE"
          ) {
            loadData(); // Recargar si se agregan o eliminan items
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Order Items - Estado:", status);
      });

    // Suscripción para MESAS
    const tablesSub = supabase
      .channel("waiter-tables-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        (payload) => {
          console.log("🔔 EVENTO Realtime - Mesa:", payload.eventType);
          loadData(); // Recargar cuando cambie el estado de las mesas
        }
      )
      .subscribe((status) => {
        console.log("📡 Mesas - Estado:", status);
      });

    return () => {
      console.log("🧹 Limpiando suscripciones Realtime");
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
      // No necesitamos actualizar manualmente - Realtime lo hará
    } catch (error) {
      console.error("Error completing notification:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    setProcessing(itemId);
    try {
      await waiterService.updateItemStatus(itemId, newStatus as never);
      // No necesitamos actualizar manualmente - Realtime lo hará
    } catch (error) {
      console.error("Error updating item status:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCobrarMesa = async (tableId: number, tableNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    const tableTotal = table ? calculateTableTotal(table) : 0;

    const billNotification = notifications.find(
      (notification) =>
        notification.table_id === tableId &&
        notification.type === "bill_request"
    );

    const paymentMethod = billNotification?.payment_method || null;

    let paymentMethodText = "";
    if (paymentMethod === "cash") {
      paymentMethodText = "💰 Pago en EFECTIVO";
    } else if (paymentMethod === "terminal") {
      paymentMethodText = "💳 Pago con TERMINAL";
    } else {
      paymentMethodText = "❓ Método de pago no especificado";
    }

    if (
      !confirm(
        `¿Estás seguro de que quieres COBRAR la Mesa ${tableNumber}?\n\n${paymentMethodText}\n💰 Total: $${tableTotal.toFixed(
          2
        )}\n\n📊 Se guardará el historial de venta y se liberará la mesa.`
      )
    ) {
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
      successMessage += `💵 Total: $${tableTotal.toFixed(
        2
      )}\n📈 Historial guardado correctamente`;

      alert(successMessage);

      // No necesitamos loadData() - Reactualizará automáticamente via Realtime
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

  const calculateTableTotal = (table: TableWithOrder) => {
    return table.orders.reduce((total, order) => total + order.total_amount, 0);
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
          />
        )}

        {activeTab === "products" && (
          <ProductsManagement onError={handleError} />
        )}
      </main>
    </div>
  );
}
