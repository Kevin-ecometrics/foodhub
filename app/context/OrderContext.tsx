"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Order } from "@/app/lib/supabase/orders";
import { OrderItem } from "@/app/lib/supabase/order-items";
import { ordersService } from "@/app/lib/supabase/orders";
import { orderItemsService } from "@/app/lib/supabase/order-items";
import { supabase } from "@/app/lib/supabase/client";
import { Product } from "@/app/lib/supabase/products";

interface OrderContextType {
  currentOrder: Order | null;
  orderItems: OrderItem[];
  cartTotal: number;
  cartItemsCount: number;
  loading: boolean;
  currentTableId: number | null;
  refreshOrder: (tableId: number) => Promise<void>;
  addToCart: (
    product: Product,
    quantity?: number,
    notes?: string
  ) => Promise<void>;
  updateCartItem: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => void;
  createNewOrder: () => Promise<void>;
  getRecentOrdersItems: (tableId: number) => Promise<OrderItem[]>; // NUEVA FUNCIÓN
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTableId, setCurrentTableId] = useState<number | null>(null);

  const cartTotal = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartItemsCount = orderItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  // Función para suscribirse a cambios en tiempo real
  const subscribeToOrderUpdates = (orderId: string) => {
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          refreshOrderItems(orderId);
        }
      )
      .subscribe();

    return subscription;
  };

  const refreshOrderItems = async (orderId: string) => {
    try {
      const items = await orderItemsService.getOrderItems(orderId);
      setOrderItems(items);
    } catch (error) {
      console.error("Error refreshing order items:", error);
    }
  };

  // NUEVA FUNCIÓN: Obtener items de órdenes recientes
  const getRecentOrdersItems = async (
    tableId: number
  ): Promise<OrderItem[]> => {
    try {
      // Obtener las últimas 3 órdenes enviadas/completadas
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_items (*)
        `
        )
        .eq("table_id", tableId)
        .in("status", ["sent", "completed", "paid"])
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Error getting recent orders:", error);
        return [];
      }

      // Tipar explícitamente el resultado para evitar el error de 'never'
      type OrderWithItems = {
        id: string;
        order_items: OrderItem[];
      };

      const allItems: OrderItem[] = [];
      (data as OrderWithItems[] | null)?.forEach((order) => {
        if (order.order_items) {
          allItems.push(...order.order_items);
        }
      });

      console.log("📦 Recent orders items:", {
        ordersCount: data?.length,
        totalItems: allItems.length,
        uniqueProducts: new Set(allItems.map((item) => item.product_id)).size,
      });

      return allItems;
    } catch (error) {
      console.error("Error getting recent orders items:", error);
      return [];
    }
  };

  const refreshOrder = async (tableId: number) => {
    setLoading(true);
    try {
      setCurrentTableId(tableId);

      // Buscar orden activa para esta mesa
      const order = await ordersService.getActiveOrderByTable(tableId);
      setCurrentOrder(order);

      if (order) {
        // Cargar items de la orden
        const items = await orderItemsService.getOrderItems(order.id);
        setOrderItems(items);

        // Calcular el total localmente
        const localTotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Solo actualizar en BD si es diferente
        if (localTotal !== order.total_amount) {
          await ordersService.updateOrderTotal(order.id, localTotal);
          setCurrentOrder((prev) =>
            prev ? { ...prev, total_amount: localTotal } : null
          );
        } else {
          // Si ya está actualizado, asegurarse de que el estado local refleje el total correcto
          setCurrentOrder((prev) =>
            prev ? { ...prev, total_amount: localTotal } : null
          );
        }

        // Suscribirse a cambios en tiempo real
        subscribeToOrderUpdates(order.id);
      }
    } catch (error) {
      console.error("Error refreshing order:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    product: Product,
    quantity: number = 1,
    notes?: string
  ) => {
    if (!currentOrder) throw new Error("No active order");

    try {
      const newItem = await orderItemsService.addItemToOrder(
        currentOrder.id,
        product,
        quantity,
        notes
      );

      setOrderItems((prev) => [...prev, newItem]);

      // Calcular total localmente y actualizar estado inmediatamente
      const newTotal = cartTotal + product.price * quantity;
      await ordersService.updateOrderTotal(currentOrder.id, newTotal);

      // ACTUALIZAR el order local con el nuevo total
      setCurrentOrder((prev) =>
        prev ? { ...prev, total_amount: newTotal } : null
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  const updateCartItem = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      await orderItemsService.updateItemQuantity(itemId, quantity);

      // Actualizar estado local inmediatamente
      setOrderItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      );

      if (currentOrder) {
        // Calcular nuevo total y actualizar
        const newTotal = orderItems.reduce((total, item) => {
          if (item.id === itemId) {
            return total + item.price * quantity;
          }
          return total + item.price * item.quantity;
        }, 0);

        await ordersService.updateOrderTotal(currentOrder.id, newTotal);
        setCurrentOrder((prev) =>
          prev ? { ...prev, total_amount: newTotal } : null
        );
      }
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const itemToRemove = orderItems.find((item) => item.id === itemId);

      await orderItemsService.removeItemFromOrder(itemId);

      // Actualizar estado local inmediatamente
      setOrderItems((prev) => prev.filter((item) => item.id !== itemId));

      if (currentOrder && itemToRemove) {
        // Calcular nuevo total y actualizar
        const newTotal = cartTotal - itemToRemove.price * itemToRemove.quantity;
        await ordersService.updateOrderTotal(currentOrder.id, newTotal);
        setCurrentOrder((prev) =>
          prev ? { ...prev, total_amount: newTotal } : null
        );
      }
    } catch (error) {
      console.error("Error removing from cart:", error);
      throw error;
    }
  };

  const clearCart = () => {
    setOrderItems([]);
  };

  const createNewOrder = async () => {
    if (!currentTableId) throw new Error("No table selected");

    try {
      const newOrder = await ordersService.createNewOrderForTable(
        currentTableId,
        currentOrder?.customer_name || `Mesa ${currentTableId}`
      );

      setCurrentOrder(newOrder);
      setOrderItems([]);

      // Suscribirse a cambios en tiempo real de la nueva orden
      subscribeToOrderUpdates(newOrder.id);
    } catch (error) {
      console.error("Error creating new order:", error);
      throw error;
    }
  };

  // Limpiar suscripción cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (currentOrder) {
        // Supabase automáticamente limpia las suscripciones cuando el canal se desmonta
      }
    };
  }, [currentOrder]);

  // Suscripción para detectar cuando la mesa es liberada
  useEffect(() => {
    if (currentTableId) {
      console.log(
        "🔔 OrderContext: Iniciando suscripción para mesa:",
        currentTableId
      );

      const tableFreedSubscription = supabase
        .channel(`table-freed-global-${currentTableId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "waiter_notifications",
            filter: `table_id=eq.${currentTableId}`,
          },
          (payload) => {
            console.log(
              "📨 OrderContext: Notificación recibida:",
              payload.new.type
            );

            if (payload.new.type === "table_freed") {
              console.log("🚨 OrderContext: Mesa liberada - Redirigiendo...");
              // Redirigir a HP
              setTimeout(() => {
                window.location.href = "/customer";
              }, 1000);
            }
          }
        )
        .subscribe((status) => {
          console.log("OrderContext: Estado de suscripción:", status);
        });

      return () => {
        console.log("🧹 OrderContext: Limpiando suscripción");
        tableFreedSubscription.unsubscribe();
      };
    }
  }, [currentTableId]);

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        orderItems,
        cartTotal,
        cartItemsCount,
        loading,
        currentTableId,
        refreshOrder,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        createNewOrder,
        getRecentOrdersItems, // NUEVA FUNCIÓN EXPORTADA
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
}
