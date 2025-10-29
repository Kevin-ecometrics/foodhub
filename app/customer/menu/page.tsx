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
} from "react-icons/fa";
import { supabase } from "@/app/lib/supabase/client";
import { tablesService } from "@/app/lib/supabase/tables";

const CATEGORIES = [
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
  } = useOrder();

  const [selectedCategory, setSelectedCategory] = useState("repite-item");
  const [products, setProducts] = useState<Product[]>([]);
  const [recentItems, setRecentItems] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingProduct, setAddingProduct] = useState<number | null>(null);
  const [showCart, setShowCart] = useState(false);

  // Leer query params del cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setTableId(params.get("table"));
    }
  }, []);

  useEffect(() => {
    if (tableId === null) return; // Esperar a que tableId esté disponible

    if (tableId) {
      loadInitialData(parseInt(tableId));
    } else if (currentTableId) {
      loadInitialData(currentTableId);
    } else {
      router.push("/customer");
    }
  }, [tableId, currentTableId, router]);

  // Actualizar items recientes cuando cambien los orderItems
  useEffect(() => {
    updateRecentItems();
  }, [orderItems, products]);

  const updateRecentItems = () => {
    if (orderItems.length === 0) {
      setRecentItems([]);
      return;
    }

    // Obtener productos únicos de la orden actual
    const uniqueProductIds = new Set(orderItems.map((item) => item.product_id));
    const recentProducts = products.filter((product) =>
      uniqueProductIds.has(product.id)
    );

    setRecentItems(recentProducts);
  };

  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    console.log("🔔 Menu: Iniciando suscripción para mesa:", targetTableId);

    // Suscripción para detectar liberación de mesa
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
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingProduct(null);
    }
  };

  const handleSendOrder = async () => {
    if (!currentOrder || orderItems.length === 0) return;

    try {
      await notificationsService.createNotification(
        currentOrder.table_id,
        "order_updated",
        `Nueva orden enviada desde Mesa ${tableId}`,
        currentOrder.id
      );
      setShowCart(false);
    } catch (error) {
      console.error("Error sending order:", error);
    }
  };

  const getProductsByCategory = () => {
    if (selectedCategory === "repite-item") {
      return recentItems;
    }
    return products.filter((product) => {
      const categoryMap: { [key: string]: string } = {
        refill: "Refill",
        combos: "Combos",
        breakfast: "Breakfast",
        lunch: "Lunch",
        dinner: "Dinner",
      };
      return product.category === categoryMap[selectedCategory];
    });
  };

  const getCategoryDescription = () => {
    const category = CATEGORIES.find((cat) => cat.id === selectedCategory);

    if (selectedCategory === "repite-item") {
      if (recentItems.length === 0) {
        return "Agrega items a tu orden para verlos aquí";
      }
      return `Tienes ${recentItems.length} items en tu orden actual`;
    }

    return category?.description || "";
  };

  // Verificar si un producto ya está en el carrito
  const isProductInCart = (productId: number) => {
    return orderItems.some((item) => item.product_id === productId);
  };

  // Obtener la cantidad actual de un producto en el carrito
  const getProductQuantityInCart = (productId: number) => {
    const item = orderItems.find((item) => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  // Mostrar loading mientras se obtiene tableId
  if (tableId === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando menú...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
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
            </p>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="relative bg-blue-600 text-white px-4 py-3 rounded-full hover:bg-blue-700 transition shadow-lg flex items-center gap-2"
          >
            <FaShoppingCart className="text-xl" />
            <span className="font-bold">{cartItemsCount}</span>
            <span className="hidden sm:inline">• ${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      </header>

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

        {selectedCategory === "repite-item" && recentItems.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Tu orden está vacía
            </h3>
            <p className="text-gray-500">
              Agrega items a tu orden para poder repetirlos fácilmente
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {getProductsByCategory().map((product) => {
            const isInCart = isProductInCart(product.id);
            const currentQuantity = getProductQuantityInCart(product.id);

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                <div className="relative overflow-hidden h-48">
                  <img
                    src={
                      product.image_url ||
                      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400"
                    }
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <FaStar className="text-yellow-400 text-sm" />
                    <span className="text-sm font-semibold">4.5</span>
                  </div>
                  {selectedCategory === "repite-item" && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      En tu orden
                    </div>
                  )}
                  {isInCart && (
                    <div className="absolute bottom-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      {currentQuantity} en carrito
                    </div>
                  )}
                </div>

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
                        onClick={() => handleAddToCart(product)}
                        disabled={addingProduct === product.id}
                        className={`px-4 py-2 rounded-full transition shadow-md font-medium flex items-center gap-2 disabled:opacity-50 ${
                          isInCart
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {addingProduct === product.id ? (
                          <FaSpinner className="animate-spin" />
                        ) : isInCart ? (
                          <FaPlus />
                        ) : (
                          <FaPlus />
                        )}
                        {isInCart ? "Agregar más" : "Agregar"}
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
          selectedCategory !== "repite-item" && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay items en esta categoría
              </p>
            </div>
          )}
      </main>

      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Tu Orden</h2>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600">
                {cartItemsCount} items en la orden
              </p>
            </div>

            {orderItems.length === 0 ? (
              <div className="p-12 text-center">
                <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Tu orden está vacía
                </h3>
                <p className="text-gray-500">
                  Agrega algunos items deliciosos del menú
                </p>
              </div>
            ) : (
              <>
                <div className="divide-y max-h-96 overflow-y-auto">
                  {orderItems.map((item) => (
                    <div key={item.id} className="p-6 flex items-center gap-4">
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
                        <span className="font-semibold text-lg w-8 text-center">
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
                          className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition ml-4"
                        >
                          <FaTrash className="text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 bg-gray-50 border-t sticky bottom-0">
                  <div className="space-y-2 mb-6">
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
                      className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <FaCheck />
                      Enviar a Cocina
                    </button>
                  </div>
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
