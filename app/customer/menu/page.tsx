"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/app/context/OrderContext";
import { productsService, Product } from "@/app/lib/supabase/products";
import { ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import {
  FaShoppingCart,
  FaUtensils,
  FaHistory,
  FaStar,
  FaPlus,
  FaMinus,
  FaTrash,
  FaSpinner,
  FaCheck,
  FaQrcode,
  FaHeart,
  FaFire,
  FaClock,
} from "react-icons/fa";
import { supabase } from "@/app/lib/supabase/client";
import { OrderItem } from "@/app/lib/supabase/order-items";

const CATEGORIES = [
  {
    id: "favorites",
    name: "Favoritos",
    icon: "❤️",
    description: "Los productos más populares",
  },
  {
    id: "repite-item",
    name: "Repite Item",
    icon: "🔄",
    description: "Tus items recientes de esta orden",
  },
  {
    id: "refill",
    name: "Refill",
    icon: "🥤",
    description: "Refill de bebidas",
  },
  {
    id: "combos",
    name: "Combos",
    icon: "🍔",
    description: "Combos especiales",
  },
  { id: "breakfast", name: "Breakfast", icon: "🍳", description: "Desayunos" },
  { id: "lunch", name: "Lunch", icon: "🍱", description: "Almuerzos" },
  { id: "dinner", name: "Dinner", icon: "🍕", description: "Cenas" },
];

export default function MenuPage() {
  const router = useRouter();
  const [tableId, setTableId] = useState<string | null>(null);

  const {
    currentOrder,
    orderItems,
    cartTotal,
    cartItemsCount,
    loading,
    refreshOrder,
    addToCart,
    updateCartItem,
    removeFromCart,
    currentTableId,
    clearCart,
    createNewOrder,
    getRecentOrdersItems,
  } = useOrder();

  const [selectedCategory, setSelectedCategory] = useState("favorites");
  const [products, setProducts] = useState<Product[]>([]);
  const [recentItems, setRecentItems] = useState<Product[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<Product[]>([]);
  const [recentOrderItems, setRecentOrderItems] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [lastOrderSent, setLastOrderSent] = useState(false);

  // Leer query params del cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setTableId(params.get("table"));
    }
  }, []);

  useEffect(() => {
    if (tableId === null) return;

    if (tableId) {
      loadInitialData(parseInt(tableId));
    } else if (currentTableId) {
      loadInitialData(currentTableId);
    } else {
      router.push("/customer");
    }
  }, [tableId, currentTableId, router]);

  // Resetear lastOrderSent cuando se agregan nuevos items al carrito
  useEffect(() => {
    if (lastOrderSent && orderItems.length > 0) {
      setLastOrderSent(false);
    }
  }, [orderItems.length, lastOrderSent]);

  // Actualizar items recientes y favoritos
  useEffect(() => {
    updateFavoriteItems();
  }, [orderItems, products]);

  // Actualizar items recientes cuando cambia la mesa o productos
  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (targetTableId && products.length > 0) {
      updateRecentItems();
    }
  }, [tableId, currentTableId, products]);

  // Actualizar items recientes cuando se envía una orden
  useEffect(() => {
    if (lastOrderSent) {
      setTimeout(() => {
        updateRecentItems();
      }, 1500);
    }
  }, [lastOrderSent]);

  // Función para actualizar items recientes
  const updateRecentItems = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    try {
      // Obtener items de órdenes recientes
      const recentOrdersItems = await getRecentOrdersItems(
        parseInt(targetTableId.toString())
      );
      setRecentOrderItems(recentOrdersItems);

      // Obtener productos únicos de todas las órdenes recientes
      const uniqueProductIds = new Set(
        recentOrdersItems.map((item) => item.product_id)
      );
      const recentProducts = products.filter((product) =>
        uniqueProductIds.has(product.id)
      );

      setRecentItems(recentProducts);

      console.log("🔄 Repite Item actualizado:", {
        totalItems: recentOrdersItems.length,
        uniqueProducts: recentProducts.length,
        productIds: Array.from(uniqueProductIds),
      });
    } catch (error) {
      console.error("Error updating recent items:", error);
    }
  };

  const updateFavoriteItems = () => {
    const favorites = products.filter((product) => product.is_favorite);
    setFavoriteItems(favorites);
  };

  // Suscripción para detectar liberación de mesa
  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    console.log("🔔 Menu: Iniciando suscripción para mesa:", targetTableId);

    const subscription = supabase
      .channel(`customer-menu-table-${targetTableId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waiter_notifications",
          filter: `table_id=eq.${targetTableId}`,
        },
        (payload) => {
          console.log("📨 Menu: Notificación recibida:", payload.new.type);

          if (payload.new.type === "table_freed") {
            console.log("🚨 Menu: Mesa liberada - Redirigiendo...");
            alert("✅ La cuenta ha sido cerrada. Gracias por su visita!");
            window.location.href = "/customer";
          }
        }
      )
      .subscribe((status) => {
        console.log("Menu: Estado de suscripción:", status);
      });

    return () => {
      console.log("🧹 Menu: Limpiando suscripción");
      subscription.unsubscribe();
    };
  }, [tableId, currentTableId]);

  const loadInitialData = async (tableId: number) => {
    try {
      setIsLoading(true);
      await refreshOrder(tableId);
      const productsData = await productsService.getProducts();
      setProducts(productsData);

      // Cargar items recientes después de cargar productos
      await updateRecentItems();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAddingProduct(product.id);
    try {
      await addToCart(product);

      // Animación de confirmación
      const button = document.getElementById(`product-${product.id}`);
      if (button) {
        button.classList.add("bg-green-500");
        setTimeout(() => {
          button.classList.remove("bg-green-500");
        }, 500);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingProduct(null);
    }
  };

  // FUNCIÓN CORREGIDA: Enviar orden a cocina
  const handleSendOrder = async () => {
    if (!currentOrder || orderItems.length === 0) return;

    setSendingOrder(true);
    try {
      console.log("📤 Enviando orden a cocina...", {
        orderId: currentOrder.id,
        itemsCount: orderItems.length,
        tableId: currentOrder.table_id,
      });

      // 1. Actualizar el estado de la orden a 'sent' en la base de datos
      await ordersService.updateOrderStatus(currentOrder.id, "sent");

      // 2. Enviar notificación a cocina
      await notificationsService.createNotification(
        currentOrder.table_id,
        "new_order",
        `Nueva orden enviada desde Mesa ${currentOrder.table_id}`,
        currentOrder.id
      );

      // 3. Crear NUEVA orden para la mesa (carrito vacío listo para nuevos pedidos)
      await createNewOrder();

      // 4. Marcar que se acaba de enviar una orden
      setLastOrderSent(true);

      // 5. Cerrar el modal del carrito
      setShowCart(false);

      // 6. Mostrar confirmación
      alert(
        "✅ ¡Orden enviada a cocina! Tu carrito está listo para nuevos pedidos."
      );
    } catch (error) {
      console.error("Error sending order:", error);
      alert("❌ Error al enviar la orden. Intenta nuevamente.");
    } finally {
      setSendingOrder(false);
    }
  };

  // Calcular tiempo estimado de preparación
  const getEstimatedTime = () => {
    const totalTime = orderItems.reduce((total, item) => {
      const product = products.find((p) => p.id === item.product_id);
      return total + (product?.preparation_time || 10) * item.quantity;
    }, 0);

    return Math.min(Math.max(totalTime, 15), 45); // Mínimo 15, máximo 45 minutos
  };

  // Obtener items populares
  const getPopularItems = () => {
    return products
      .filter((product) => product.rating && product.rating >= 4.5)
      .slice(0, 6);
  };

  // Obtener cantidad total de un producto en órdenes recientes
  const getProductTotalQuantityInRecentOrders = (productId: number) => {
    return recentOrderItems
      .filter((item) => item.product_id === productId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  const getProductsByCategory = () => {
    switch (selectedCategory) {
      case "favorites":
        return favoriteItems;
      case "repite-item":
        return recentItems;
      case "popular":
        return getPopularItems();
      default:
        const categoryMap: { [key: string]: string } = {
          refill: "Refill",
          combos: "Combos",
          breakfast: "Breakfast",
          lunch: "Lunch",
          dinner: "Dinner",
        };
        return products.filter(
          (product) => product.category === categoryMap[selectedCategory]
        );
    }
  };

  const getCategoryDescription = () => {
    const category = CATEGORIES.find((cat) => cat.id === selectedCategory);

    switch (selectedCategory) {
      case "favorites":
        if (favoriteItems.length === 0) {
          return "No hay productos marcados como favoritos";
        }
        return `${favoriteItems.length} productos destacados`;
      case "repite-item":
        if (recentItems.length === 0) {
          return "Tus pedidos anteriores aparecerán aquí";
        }
        return `${recentItems.length} productos de tus órdenes anteriores`;
      case "popular":
        return "Los productos más pedidos por nuestros clientes";
      default:
        return category?.description || "";
    }
  };

  const isProductInCart = (productId: number) => {
    return orderItems.some((item) => item.product_id === productId);
  };

  const getProductQuantityInCart = (productId: number) => {
    const item = orderItems.find((item) => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  const renderStarRating = (rating: number) => {
    if (rating === 0) {
      return (
        <div className="flex items-center gap-1">
          <FaStar className="text-gray-300 text-xs" />
          <span className="text-xs font-semibold text-gray-400">
            Sin rating
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <FaStar className="text-yellow-400 text-xs" />
        <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Componente para el badge del carrito mejorado
  const CartBadge = () => (
    <button
      onClick={() => setShowCart(true)}
      className="relative bg-blue-600 text-white px-4 py-3 rounded-full hover:bg-blue-700 transition shadow-lg flex items-center gap-2 group"
    >
      <FaShoppingCart className="text-xl" />
      <span className="font-bold">{cartItemsCount}</span>
      <span className="hidden sm:inline">• ${cartTotal.toFixed(2)}</span>

      {/* Badge animado mejorado */}
      {cartItemsCount > 0 && (
        <div className="absolute -top-1 -right-1">
          <div className="relative">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse border-2 border-white">
              {cartItemsCount}
            </div>
            <div className="absolute inset-0 rounded-full bg-red-400 animate-ping"></div>
          </div>
        </div>
      )}

      {/* Indicador de orden recién enviada */}
      {lastOrderSent && cartItemsCount === 0 && (
        <div className="absolute -top-1 -right-1">
          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
        Ver mi orden ({cartItemsCount} items)
      </div>
    </button>
  );

  if (tableId === null || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando menú...</p>
        </div>
      </div>
    );
  }

  const targetTableId = tableId || currentTableId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              FoodHub Restaurant
            </h1>
            <p className="text-sm text-gray-500">
              Mesa {targetTableId} • {currentOrder?.customer_name || "Invitado"}
              {currentOrder?.id && ` • Orden #${currentOrder.id.slice(0, 8)}`}
            </p>
          </div>

          <CartBadge />
        </div>
      </header>

      {/* Banner de confirmación cuando se acaba de enviar una orden */}
      {lastOrderSent && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <FaCheck className="text-green-500" />
              <span className="font-semibold">¡Orden enviada a cocina!</span>
              <span className="text-sm">Puedes seguir agregando más items</span>
            </div>
          </div>
        </div>
      )}

      {/* Sección de estado rápido */}
      {orderItems.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-green-600 font-semibold">
                  <FaShoppingCart className="text-xs" />
                  {orderItems.length} items en carrito
                </span>
              </div>
              <span className="text-gray-600">
                ⏱️ Tiempo estimado: ~{getEstimatedTime()} min
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm sticky top-16 z-20 overflow-x-auto">
        <div className="flex gap-2 px-4 py-4 max-w-7xl mx-auto">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl font-medium whitespace-nowrap transition min-w-[100px] ${
                selectedCategory === category.id
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="text-xl">{category.icon}</span>
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <p className="text-sm text-gray-500">{getCategoryDescription()}</p>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {getProductsByCategory().length} items
          </span>
        </div>

        {selectedCategory === "favorites" && favoriteItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay productos favoritos
            </h3>
            <p className="text-gray-500">
              Los productos marcados como favoritos aparecerán aquí
            </p>
          </div>
        )}

        {selectedCategory === "repite-item" && recentItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Aún no has realizado pedidos
            </h3>
            <p className="text-gray-500">
              Tus pedidos anteriores aparecerán aquí para que puedas repetirlos
              fácilmente
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {getProductsByCategory().map((product) => {
            const isInCart = isProductInCart(product.id);
            const currentQuantity = getProductQuantityInCart(product.id);
            const totalRecentQuantity = getProductTotalQuantityInRecentOrders(
              product.id
            );

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group relative"
              >
                {/* Badge de popularidad */}
                {product.rating && product.rating >= 4.5 && (
                  <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
                    <FaFire className="text-xs" />
                    Popular
                  </div>
                )}

                {product.image_url ? (
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={
                        product.image_url ||
                        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"
                      }
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-white px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                      {renderStarRating(product.rating || 0)}
                    </div>

                    {/* Badge de favorito */}
                    {product.is_favorite && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <FaHeart className="text-xs" />
                        Favorito
                      </div>
                    )}

                    {/* Badge de Repite Item */}
                    {/* {selectedCategory === "repite-item" &&
                      totalRecentQuantity > 0 && (
                        // <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        //   Pedido anterior
                        // </div>
                      )} */}

                    {/* Badge de cantidad en órdenes recientes */}
                    {selectedCategory === "repite-item" &&
                      totalRecentQuantity > 0 && (
                        <div className="absolute bottom-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          {totalRecentQuantity}x en pedidos anteriores
                        </div>
                      )}

                    {/* Badge de en carrito actual */}
                    {isInCart && (
                      <div className="absolute bottom-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {currentQuantity} en carrito
                      </div>
                    )}
                  </div>
                ) : null}

                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {product.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.preparation_time && (
                        <p className="text-xs text-gray-500 mt-1">
                          ⏱️ {product.preparation_time} min
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isInCart && (
                        <button
                          onClick={() => {
                            const item = orderItems.find(
                              (item) => item.product_id === product.id
                            );
                            if (item) {
                              updateCartItem(item.id, currentQuantity - 1);
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                        >
                          <FaMinus className="text-sm" />
                        </button>
                      )}

                      <button
                        id={`product-${product.id}`}
                        onClick={() => handleAddToCart(product)}
                        disabled={addingProduct === product.id}
                        className={`px-4 py-2 rounded-full transition-all duration-300 shadow-md font-medium flex items-center gap-2 disabled:opacity-50 ${
                          isInCart
                            ? "bg-green-600 text-white hover:bg-green-700 scale-105"
                            : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105"
                        }`}
                      >
                        {addingProduct === product.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : isInCart ? (
                          <>
                            <FaPlus />
                            <span className="hidden sm:inline">
                              Agregar más
                            </span>
                            <span className="sm:hidden">
                              +{currentQuantity}
                            </span>
                          </>
                        ) : (
                          <>
                            <FaPlus />
                            Agregar
                          </>
                        )}
                      </button>

                      {isInCart && (
                        <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {currentQuantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {getProductsByCategory().length === 0 &&
          selectedCategory !== "favorites" &&
          selectedCategory !== "repite-item" && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay items en esta categoría
              </p>
            </div>
          )}
      </main>

      {/* MODAL DEL CARRITO MEJORADO */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end animate-in slide-in-from-right">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Tu Orden Actual
                  </h2>
                  {currentOrder?.id && (
                    <p className="text-sm text-gray-500">
                      Orden #{currentOrder.id.slice(0, 8)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Resumen rápido */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {cartItemsCount}
                  </div>
                  <div className="text-xs text-gray-600">Items en carrito</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${cartTotal.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">Subtotal</div>
                </div>
              </div>
            </div>

            {orderItems.length === 0 ? (
              <div className="p-12 text-center">
                <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {lastOrderSent ? "¡Orden enviada! 🎉" : "Tu orden está vacía"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {lastOrderSent
                    ? "Tu pedido está en camino. ¿Quieres agregar algo más?"
                    : "Agrega algunos items deliciosos del menú"}
                </p>
                <button
                  onClick={() => setShowCart(false)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
                >
                  {lastOrderSent ? "Seguir Pidiendo" : "Explorar Menú"}
                </button>

                {lastOrderSent && (
                  <button
                    onClick={() =>
                      router.push(`/customer/history?table=${targetTableId}`)
                    }
                    className="block w-full mt-4 bg-gray-100 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-200 transition"
                  >
                    Ver Estado de mi Orden
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Items actuales en carrito */}
                <div className="divide-y max-h-96 overflow-y-auto">
                  {orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-6 flex items-center gap-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">
                          {item.product_name}
                        </h3>
                        <p className="text-lg font-bold text-blue-600">
                          ${item.price.toFixed(2)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            updateCartItem(item.id, item.quantity - 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                        >
                          <FaMinus className="text-sm" />
                        </button>
                        <span className="font-semibold text-lg w-8 text-center bg-blue-100 text-blue-600 rounded">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartItem(item.id, item.quantity + 1)
                          }
                          className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                        >
                          <FaPlus className="text-sm" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition ml-2"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumen y acciones */}
                <div className="p-6 bg-gray-50 border-t sticky bottom-0">
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span>Items en carrito:</span>
                      <span>{cartItemsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (8%):</span>
                      <span>${(cartTotal * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">
                        ${(cartTotal * 1.08).toFixed(2)}
                      </span>
                    </div>

                    {/* Tiempo estimado */}
                    <div className="flex justify-between items-center text-sm text-gray-600 bg-white p-3 rounded-lg mt-3">
                      <span>⏱️ Tiempo estimado:</span>
                      <span className="font-semibold">
                        ~{getEstimatedTime()} minutos
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCart(false)}
                      className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
                    >
                      Seguir Pidiendo
                    </button>
                    <button
                      onClick={handleSendOrder}
                      disabled={sendingOrder}
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingOrder ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaCheck />
                      )}
                      {sendingOrder ? "Enviando..." : "Enviar a Cocina"}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 text-center mt-3">
                    💡 Los nuevos items se agregarán a una nueva orden
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="max-w-7xl mx-auto flex justify-around py-3">
          <button className="flex flex-col items-center text-blue-600">
            <FaUtensils className="text-2xl mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
          <button
            onClick={() =>
              router.push(`/customer/history?table=${targetTableId}`)
            }
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaHistory className="text-2xl mb-1" />
            <span className="text-xs font-medium">Historial</span>
          </button>
          <button
            onClick={() => router.push(`/customer/qr?table=${targetTableId}`)}
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaQrcode className="text-2xl mb-1" />
            <span className="text-xs font-medium">Mi QR</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
