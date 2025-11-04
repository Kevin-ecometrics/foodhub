"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { Order } from "@/app/lib/supabase/orders";
import { OrderItem } from "@/app/lib/supabase/order-items";
import { ordersService } from "@/app/lib/supabase/orders";
import { orderItemsService } from "@/app/lib/supabase/order-items";
import { supabase } from "@/app/lib/supabase/client";
import { Product } from "@/app/lib/supabase/products";

interface OrderContextType {
  // Estado actual
  currentOrder: Order | null;
  orderItems: OrderItem[];
  cartTotal: number;
  cartItemsCount: number;
  loading: boolean;
  currentTableId: number | null;
  currentUserId: string | null;

  // Métodos principales
  refreshOrder: (tableId: number, orderId?: string) => Promise<void>;
  setCurrentUserOrder: (orderId: string, userId: string) => Promise<void>;
  addToCart: (
    product: Product,
    quantity?: number,
    notes?: string
  ) => Promise<void>;
  updateCartItem: (
    itemId: string,
    quantity: number,
    notes?: string
  ) => Promise<void>; // ACTUALIZADO
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => void;
  createNewOrder: (customerName?: string) => Promise<string>; // Retorna orderId

  // Métodos para múltiples usuarios
  getRecentOrdersItems: (tableId: number) => Promise<OrderItem[]>;
  getTableUsers: (
    tableId: number
  ) => Promise<{ id: string; name: string; orderId: string }[]>;
  switchUserOrder: (orderId: string, userId: string) => Promise<void>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTableId, setCurrentTableId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const cartTotal = orderItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const cartItemsCount = orderItems.reduce(
    (count, item) => count + item.quantity,
    0
  );

  // Suscripción a cambios en tiempo real de la orden actual
  const subscribeToOrderUpdates = (orderId: string) => {
    console.log("🔔 Suscribiendo a orden:", orderId);

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
          console.log("📦 Cambio en order_items:", payload);
          refreshOrderItems(orderId);
        }
      )
      .subscribe((status) => {
        console.log("Estado suscripción orden:", status);
      });

    return subscription;
  };

  const refreshOrderItems = async (orderId: string) => {
    try {
      const items = await orderItemsService.getOrderItems(orderId);
      setOrderItems(items);

      // Actualizar total de la orden
      if (currentOrder) {
        const newTotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        if (newTotal !== currentOrder.total_amount) {
          await ordersService.updateOrderTotal(orderId, newTotal);
          setCurrentOrder((prev) =>
            prev ? { ...prev, total_amount: newTotal } : null
          );
        }
      }
    } catch (error) {
      console.error("Error refreshing order items:", error);
    }
  };

  // NUEVO: Cambiar a una orden de usuario específico
  const setCurrentUserOrder = async (orderId: string, userId: string) => {
    setLoading(true);
    try {
      const order = await ordersService.getOrder(orderId);
      if (!order) {
        throw new Error("Orden no encontrada");
      }

      setCurrentOrder(order);
      setCurrentUserId(userId);
      setCurrentTableId(order.table_id);

      // Cargar items de la orden
      const items = await orderItemsService.getOrderItems(orderId);
      setOrderItems(items);

      // Suscribirse a cambios
      subscribeToOrderUpdates(orderId);

      console.log("✅ Orden de usuario cargada:", {
        userId,
        orderId,
        itemsCount: items.length,
      });
    } catch (error) {
      console.error("Error setting user order:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ACTUALIZADO: Refresh order con soporte para orden específica
  const refreshOrder = async (tableId: number, orderId?: string) => {
    setLoading(true);
    try {
      setCurrentTableId(tableId);

      let order: Order | null = null;

      if (orderId) {
        // Cargar orden específica
        order = await ordersService.getOrder(orderId);
      } else {
        // Buscar primera orden activa (compatibilidad hacia atrás)
        order = await ordersService.getActiveOrderByTable(tableId);
      }

      if (order) {
        setCurrentOrder(order);

        // Cargar items de la orden
        const items = await orderItemsService.getOrderItems(order.id);
        setOrderItems(items);

        // Calcular el total localmente
        const localTotal = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        // Actualizar en BD si es diferente
        if (localTotal !== order.total_amount) {
          await ordersService.updateOrderTotal(order.id, localTotal);
          setCurrentOrder((prev) =>
            prev ? { ...prev, total_amount: localTotal } : null
          );
        }

        // Suscribirse a cambios
        subscribeToOrderUpdates(order.id);
      } else {
        setCurrentOrder(null);
        setOrderItems([]);
      }
    } catch (error) {
      console.error("Error refreshing order:", error);
    } finally {
      setLoading(false);
    }
  };

  // NUEVO: Cambiar entre órdenes de usuarios
  const switchUserOrder = async (orderId: string, userId: string) => {
    await setCurrentUserOrder(orderId, userId);
  };

  // Métodos del carrito - ACTUALIZADO para soportar notas
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

      // Calcular total localmente y actualizar
      const newTotal = cartTotal + product.price * quantity;
      await ordersService.updateOrderTotal(currentOrder.id, newTotal);

      setCurrentOrder((prev) =>
        prev ? { ...prev, total_amount: newTotal } : null
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  };

  // ACTUALIZADO: Ahora acepta parámetro de notas
  const updateCartItem = async (
    itemId: string,
    quantity: number,
    notes?: string
  ) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    try {
      await orderItemsService.updateItemQuantity(itemId, quantity, notes);

      // Actualizar estado local
      setOrderItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                notes: notes !== undefined ? notes : item.notes, // Mantener notas existentes si no se proporcionan nuevas
              }
            : item
        )
      );

      if (currentOrder) {
        // Calcular nuevo total
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

      setOrderItems((prev) => prev.filter((item) => item.id !== itemId));

      if (currentOrder && itemToRemove) {
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

  // ACTUALIZADO: Crear nueva orden con nombre de cliente
  const createNewOrder = async (customerName?: string): Promise<string> => {
    if (!currentTableId) throw new Error("No table selected");

    try {
      const name = customerName || `Usuario ${Date.now().toString().slice(-4)}`;
      const newOrder = await ordersService.createOrder(currentTableId, name);

      setCurrentOrder(newOrder);
      setOrderItems([]);

      // Suscribirse a cambios
      subscribeToOrderUpdates(newOrder.id);

      return newOrder.id;
    } catch (error) {
      console.error("Error creating new order:", error);
      throw error;
    }
  };

  // NUEVO: Obtener usuarios de la mesa
  const getTableUsers = async (tableId: number) => {
    try {
      const orders = await ordersService.getActiveOrdersByTable(tableId);
      return orders.map((order) => ({
        id: order.id, // Usamos orderId como userId temporal
        name: order.customer_name,
        orderId: order.id,
      }));
    } catch (error) {
      console.error("Error getting table users:", error);
      return [];
    }
  };

  // Función existente para items recientes
  const getRecentOrdersItems = async (
    tableId: number
  ): Promise<OrderItem[]> => {
    try {
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

      return allItems;
    } catch (error) {
      console.error("Error getting recent orders items:", error);
      return [];
    }
  };

  // Suscripción para liberación de mesa (sin cambios)
  useEffect(() => {
    if (currentTableId) {
      console.log("🔔 OrderContext: Suscribiendo a mesa:", currentTableId);

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
            console.log("📨 OrderContext: Notificación:", payload.new.type);

            if (payload.new.type === "table_freed") {
              console.log("🚨 OrderContext: Mesa liberada - Redirigiendo...");
              setTimeout(() => {
                window.location.href = "/customer";
              }, 1000);
            }
          }
        )
        .subscribe((status) => {
          console.log("OrderContext: Estado suscripción mesa:", status);
        });

      return () => {
        console.log("🧹 OrderContext: Limpiando suscripción mesa");
        tableFreedSubscription.unsubscribe();
      };
    }
  }, [currentTableId]);

  // Limpiar suscripciones
  useEffect(() => {
    return () => {
      // Las suscripciones de Supabase se limpian automáticamente
    };
  }, []);

  return (
    <OrderContext.Provider
      value={{
        currentOrder,
        orderItems,
        cartTotal,
        cartItemsCount,
        loading,
        currentTableId,
        currentUserId,
        refreshOrder,
        setCurrentUserOrder,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        createNewOrder,
        getRecentOrdersItems,
        getTableUsers,
        switchUserOrder,
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
