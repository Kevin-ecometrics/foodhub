// app/customer/menu/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
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
  FaUser,
  FaEdit,
  FaQuestion,
  FaStickyNote,
  FaExclamationTriangle,
} from "react-icons/fa";
import { supabase } from "@/app/lib/supabase/client";
import { OrderItem } from "@/app/lib/supabase/order-items";
import { historyService } from "@/app/lib/supabase/history";

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
    id: "drinks",
    name: "Drinks",
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
  {
    id: "refill",
    name: "Refill",
    icon: "🥤",
    description: "Refill de bebidas",
  },
];

interface TableUser {
  id: string;
  name: string;
  orderId: string;
}

export default function MenuPage() {
  const router = useRouter();
  const { session, clearSession, updateSession } = useSession();

  // Estados para controlar la carga y verificación
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Obtener datos de la sesión en lugar de searchParams
  const tableId = session?.tableId;
  const userId = session?.userId;
  const orderId = session?.orderId;
  const customerName = session?.customerName;
  const tableNumber = session?.tableNumber;

  const {
    currentOrder,
    orderItems,
    cartTotal,
    cartItemsCount,
    loading,
    currentTableId,
    currentUserId,
    setCurrentUserOrder,
    refreshOrder,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    createNewOrder,
    getRecentOrdersItems,
    getTableUsers,
    switchUserOrder,
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
  const [tableUsers, setTableUsers] = useState<TableUser[]>([]);
  const [showUserSwitch, setShowUserSwitch] = useState(false);
  const [assistanceLoading, setAssistanceLoading] = useState(false);

  // Referencias para las secciones de categorías
  const categoryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // ESTADOS PARA NOTAS Y EXTRAS
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [notes, setNotes] = useState("");
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<{
    [key: string]: boolean;
  }>({});

  // Función para formatear notas y extras
  const formatItemNotes = (notes: string | null) => {
    if (!notes) return null;

    const hasPricedExtras = notes.includes("(+$");

    if (hasPricedExtras) {
      const parts = notes.split(" | ");
      const mainNotes = parts.find(
        (part) => !part.includes("Extras:") && !part.includes("Total:")
      );
      const extrasPart = parts.find((part) => part.includes("Extras:"));
      const totalPart = parts.find((part) => part.includes("Total:"));

      return (
        <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {mainNotes && (
            <div className="flex items-start gap-2">
              <FaStickyNote className="text-yellow-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">Instrucciones:</span> {mainNotes}
              </span>
            </div>
          )}

          {extrasPart && (
            <div className="flex items-start gap-2">
              <FaPlus className="text-green-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-medium text-green-700">
                  Extras agregados:
                </span>
                <div className="mt-1 ml-2 space-y-1">
                  {extrasPart
                    .replace("Extras: ", "")
                    .split(", ")
                    .map((extra, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <span className="text-green-600">
                          • {extra.split(" (+$")[0]}
                        </span>
                        <span className="text-green-700 font-medium">
                          {extra.match(/\(\+\$([^)]+)\)/)?.[1] || ""}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {totalPart && (
            <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
              <FaStickyNote className="text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm font-medium text-blue-700">
                {totalPart}
              </span>
            </div>
          )}
        </div>
      );
    }

    if (notes.includes("Extras:")) {
      const parts = notes.split(" | ");
      let mainNotes = "";
      let extrasText = "";

      parts.forEach((part) => {
        if (part.startsWith("Extras:")) {
          extrasText = part.replace("Extras: ", "");
        } else {
          mainNotes = part;
        }
      });

      return (
        <div className="mt-2 space-y-2 p-3 bg-gray-50 rounded-lg">
          {mainNotes && (
            <p className="text-sm text-gray-700">
              <span className="font-medium">Nota:</span> {mainNotes}
            </p>
          )}
          {extrasText && (
            <p className="text-sm text-green-700">
              <span className="font-medium">Extras:</span> {extrasText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800 flex items-center gap-1">
          <FaStickyNote className="text-yellow-600" />
          <span className="font-medium">Nota:</span> {notes}
        </p>
      </div>
    );
  };

  // Cargar datos iniciales - MEJORADO PARA MANEJAR REFRESH
  useEffect(() => {
    // Primer efecto: verificar y cargar sesión
    const checkAndLoadSession = async () => {
      // Si ya verificamos, no hacer nada
      if (hasCheckedSession) return;

      // Intentar recuperar sesión del localStorage como fallback
      if (!session && !tableId && !orderId && !userId) {
        try {
          const storedSession = localStorage.getItem("customerSession");
          if (storedSession) {
            const parsedSession = JSON.parse(storedSession);
            console.log("Recuperando sesión de localStorage:", parsedSession);
            updateSession(parsedSession);

            // Dar tiempo para que la sesión se actualice
            setTimeout(() => {
              setHasCheckedSession(true);
              setIsInitialLoad(false);
            }, 100);
            return;
          }
        } catch (error) {
          console.error("Error parsing stored session:", error);
        }
      }

      // Si tenemos datos de sesión, marcar como verificados
      if (tableId && orderId && userId) {
        console.log("Sesión válida encontrada:", { tableId, orderId, userId });
        setHasCheckedSession(true);
        setIsInitialLoad(false);
      } else if (session) {
        // Si hay sesión pero faltan datos, intentar recuperar
        console.log("Sesión parcial, intentando recuperar datos...");
        setHasCheckedSession(true);
        setIsInitialLoad(false);
      }
    };

    checkAndLoadSession();
  }, [session, tableId, orderId, userId, hasCheckedSession, updateSession]);

  // Segundo efecto: cargar datos una vez verificada la sesión
  useEffect(() => {
    if (!hasCheckedSession || isInitialLoad) return;

    const loadData = async () => {
      // Si no tenemos los datos mínimos, redirigir
      if (!tableId || !orderId || !userId) {
        console.log("Faltan datos esenciales, redirigiendo...");
        router.push("/customer");
        return;
      }

      try {
        await loadInitialData(parseInt(tableId), orderId, userId);
      } catch (error) {
        console.error("Error fatal al cargar datos:", error);
        router.push("/customer");
      }
    };

    loadData();
  }, [hasCheckedSession, isInitialLoad, tableId, orderId, userId, router]);

  // Cargar usuarios de la mesa
  useEffect(() => {
    if (tableId && hasCheckedSession) {
      loadTableUsers(parseInt(tableId));
    }
  }, [tableId, hasCheckedSession]);

  // Scroll handling (mantener igual)
  useEffect(() => {
    if (products.length === 0 || !hasCheckedSession) return;

    const handleScroll = () => {
      // Calcular la altura real del navbar (incluyendo todos los elementos fijos)
      const navbarHeight = 220; // Ajusta este valor según la altura real de tu navbar

      const scrollPosition = window.scrollY + navbarHeight;
      const availableCategories = CATEGORIES.filter(
        (category) => getProductsByCategory(category.id).length > 0
      );

      let currentActiveCategory = availableCategories[0]?.id || "favorites";

      for (const category of availableCategories) {
        const element = categoryRefs.current[category.id];
        if (element) {
          const elementTop = element.offsetTop;
          const elementBottom = elementTop + element.offsetHeight;

          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            currentActiveCategory = category.id;
            break;
          }
        }
      }

      if (currentActiveCategory !== selectedCategory) {
        setSelectedCategory(currentActiveCategory);
      }
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, [products, selectedCategory, hasCheckedSession]);

  const loadTableUsers = async (tableId: number) => {
    try {
      const users = await getTableUsers(tableId);
      setTableUsers(users);
    } catch (error) {
      console.error("Error loading table users:", error);
    }
  };

  const loadInitialData = async (
    tableId: number,
    orderId: string,
    userId: string
  ) => {
    try {
      setIsLoading(true);

      // Verificar que la orden exista
      try {
        const orderExists = await ordersService.getOrder(orderId);
        if (!orderExists) {
          console.log("La orden no existe, creando nueva...");
          // Crear nueva orden
          const newOrderId = await createNewOrder(customerName || "Cliente");
          // Actualizar sesión con la nueva orden
          updateSession({
            userId: newOrderId,
            orderId: newOrderId,
          });
          await setCurrentUserOrder(newOrderId, newOrderId);
        } else {
          await setCurrentUserOrder(orderId, userId);
        }
      } catch (orderError) {
        console.error("Error verificando orden:", orderError);
        // Continuar intentando cargar productos
      }

      const productsData = await productsService.getProducts();
      setProducts(productsData);
      await updateRecentItems();
    } catch (error) {
      console.error("Error loading data:", error);
      // NO redirigir inmediatamente, intentar recuperar
      try {
        // Cargar productos como mínimo
        const productsData = await productsService.getProducts();
        setProducts(productsData);

        // Mostrar mensaje al usuario
        alert(
          "⚠️ Hubo un problema al cargar tu orden anterior, pero puedes hacer un nuevo pedido."
        );
      } catch (recoveryError) {
        console.error("Error en recuperación:", recoveryError);
        // Solo redirigir si falla todo
        router.push("/customer");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (lastOrderSent && orderItems.length > 0) {
      setLastOrderSent(false);
    }
  }, [orderItems.length, lastOrderSent]);

  useEffect(() => {
    updateFavoriteItems();
  }, [orderItems, products]);

  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (targetTableId && products.length > 0 && hasCheckedSession) {
      updateRecentItems();
    }
  }, [tableId, currentTableId, products, hasCheckedSession]);

  useEffect(() => {
    if (lastOrderSent) {
      setTimeout(() => {
        updateRecentItems();
      }, 1500);
    }
  }, [lastOrderSent]);

  const updateRecentItems = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    try {
      const recentOrdersItems = await getRecentOrdersItems(
        parseInt(targetTableId.toString())
      );
      setRecentOrderItems(recentOrdersItems);

      const uniqueProductIds = new Set(
        recentOrdersItems.map((item) => item.product_id)
      );
      const recentProducts = products.filter((product) =>
        uniqueProductIds.has(product.id)
      );
      setRecentItems(recentProducts);
    } catch (error) {
      console.error("Error updating recent items:", error);
    }
  };

  const updateFavoriteItems = () => {
    const favorites = products.filter((product) => product.is_favorite);
    setFavoriteItems(favorites);
  };

  // FUNCIONES PARA MANEJAR EXTRAS (mantener igual)
  const handleExtraToggle = (extraName: string) => {
    setSelectedExtras((prev) => ({
      ...prev,
      [extraName]: !prev[extraName],
    }));
  };

  const calculateTotalWithExtras = () => {
    if (!selectedProduct) return 0;
    const basePrice = selectedProduct.price;
    const extrasTotal = Object.entries(selectedExtras)
      .filter(([_, isSelected]) => isSelected)
      .reduce((total, [extraName]) => {
        const extra = selectedProduct.extras?.find((e) => e.name === extraName);
        return total + (extra?.price || 0);
      }, 0);
    return basePrice + extrasTotal;
  };

  const resetExtras = () => {
    setSelectedExtras({});
    setNotes("");
    setSelectedProduct(null);
    setEditingItem(null);
  };

  const handleAddToCartWithNotes = (product: Product) => {
    setSelectedProduct(product);
    setNotes("");
    setSelectedExtras({});
    setEditingItem(null);
    setShowNotesModal(true);
  };

  const handleEditNotes = (item: OrderItem) => {
    const product = products.find((p) => p.id === item.product_id);
    if (product) {
      setSelectedProduct(product);
      setNotes(item.notes || "");
      setSelectedExtras({});
      setEditingItem(item);
      setShowNotesModal(true);
    }
  };

  const handleConfirmAddWithNotes = async () => {
    if (!selectedProduct) return;

    const trimmedNotes = notes.trim();
    const hasValidNotes = trimmedNotes.length > 0;
    const hasOnlySpaces = notes.length > 0 && trimmedNotes.length === 0;

    if (hasOnlySpaces) {
      alert(
        "❌ Las instrucciones especiales no pueden contener solo espacios en blanco."
      );
      return;
    }

    if (hasValidNotes && trimmedNotes.length < 2) {
      alert(
        "❌ Las instrucciones especiales deben tener al menos 2 caracteres válidos."
      );
      return;
    }

    const hasExtras = Object.values(selectedExtras).some((value) => value);
    if (!hasExtras && !hasValidNotes) {
      setAddingProduct(selectedProduct.id);
      try {
        await addToCart(selectedProduct);
        setShowNotesModal(false);
        resetExtras();
      } catch (error) {
        console.error("Error adding to cart:", error);
      } finally {
        setAddingProduct(null);
      }
      return;
    }

    setAddingProduct(selectedProduct.id);
    try {
      const basePrice = selectedProduct.price;
      const extrasTotal = Object.entries(selectedExtras)
        .filter(([_, isSelected]) => isSelected)
        .reduce((total, [extraName]) => {
          const extra = selectedProduct.extras?.find(
            (e) => e.name === extraName
          );
          return total + (extra?.price || 0);
        }, 0);

      const totalPrice = basePrice + extrasTotal;

      const selectedExtrasList = Object.entries(selectedExtras)
        .filter(([_, isSelected]) => isSelected)
        .map(([extraName]) => {
          const extra = selectedProduct.extras?.find(
            (e) => e.name === extraName
          );
          return {
            name: extraName,
            price: extra?.price || 0,
          };
        });

      let finalNotes = hasValidNotes ? trimmedNotes : "";
      if (selectedExtrasList.length > 0) {
        const extrasDetails = selectedExtrasList
          .map((extra) => `${extra.name} (+$${extra.price.toFixed(2)})`)
          .join(", ");

        const extrasText = `Extras: ${extrasDetails}`;
        finalNotes = hasValidNotes
          ? `${trimmedNotes} | ${extrasText}`
          : extrasText;

        if (extrasTotal > 0) {
          finalNotes += ` | Total: $${totalPrice.toFixed(2)}`;
        }
      }

      const existingItem = orderItems.find(
        (item) =>
          item.product_id === selectedProduct.id &&
          item.notes === finalNotes &&
          item.price === totalPrice
      );

      if (existingItem) {
        await updateCartItem(existingItem.id, existingItem.quantity + 1);
      } else if (editingItem) {
        await updateCartItem(
          editingItem.id,
          editingItem.quantity,
          finalNotes,
          totalPrice
        );
      } else {
        await addToCart(selectedProduct, 1, finalNotes, totalPrice);
      }

      setShowNotesModal(false);
      resetExtras();
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddingProduct(null);
    }
  };

  // Suscripción para detectar liberación de mesa
  useEffect(() => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId || !hasCheckedSession) return;

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
          if (payload.new.type === "table_freed") {
            alert("✅ La cuenta ha sido cerrada. Gracias por su visita!");
            clearSession();
            window.location.href = "/customer";
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableId, currentTableId, clearSession, hasCheckedSession]);

  const handleAddToCart = async (product: Product) => {
    setAddingProduct(product.id);
    try {
      await addToCart(product);
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

  // FUNCIÓN MODIFICADA: Enviar orden a cocina
  const handleSendOrder = async () => {
    if (!currentOrder || orderItems.length === 0) return;

    setSendingOrder(true);
    try {
      console.log("📤 Enviando orden a cocina...", {
        orderId: currentOrder.id,
        itemsCount: orderItems.length,
        tableId: currentOrder.table_id,
      });

      await ordersService.updateOrderStatus(currentOrder.id, "sent");

      await notificationsService.createNotification(
        currentOrder.table_id,
        "new_order",
        `Nueva orden de ${currentOrder.customer_name} desde Mesa ${currentOrder.table_id}`,
        currentOrder.id
      );

      // Crear NUEVA orden para el MISMO usuario
      const newOrderId = await createNewOrder(currentOrder.customer_name);

      // ACTUALIZAR SESIÓN con la nueva orden
      updateSession({
        userId: newOrderId,
        orderId: newOrderId,
      });

      // Actualizar lista de usuarios
      await loadTableUsers(currentOrder.table_id);

      setLastOrderSent(true);
      setShowCart(false);

      alert(
        `✅ ¡Orden enviada a cocina, ${currentOrder.customer_name}! Tu carrito está listo para nuevos pedidos.`
      );
    } catch (error) {
      console.error("Error sending order:", error);
      alert("❌ Error al enviar la orden. Intenta nuevamente.");
    } finally {
      setSendingOrder(false);
    }
  };

  // MODIFICADA: Cambiar de usuario
  const handleSwitchUser = async (user: TableUser) => {
    try {
      await switchUserOrder(user.orderId, user.id);
      setShowUserSwitch(false);

      // ACTUALIZAR SESIÓN
      updateSession({
        userId: user.id,
        orderId: user.orderId,
      });
    } catch (error) {
      console.error("Error switching user:", error);
      alert("Error al cambiar de usuario");
    }
  };

  // MODIFICADA: Agregar nuevo usuario
  const handleAddNewUser = async () => {
    const userName = prompt("Ingresa el nombre del nuevo comensal:");
    if (!userName?.trim()) return;

    if (!tableId) {
      alert("No se encontró la mesa");
      return;
    }

    try {
      const newOrder = await ordersService.createOrder(
        parseInt(tableId),
        userName.trim()
      );

      await loadTableUsers(parseInt(tableId));

      // ACTUALIZAR SESIÓN para el nuevo usuario
      updateSession({
        userId: newOrder.id,
        orderId: newOrder.id,
        customerName: userName.trim(),
      });

      alert(`✅ Bienvenido/a, ${userName.trim()}!`);
    } catch (error) {
      console.error("Error adding new user:", error);
      alert("Error al agregar nuevo comensal");
    }
  };

  const getEstimatedTime = () => {
    if (orderItems.length === 0) return 0;
    const productCache = new Map();
    let maxPreparationTime = 0;
    let maxQuantity = 0;
    let uniqueProducts = 0;
    const seenProducts = new Set();

    orderItems.forEach((item) => {
      let product = productCache.get(item.product_id);
      if (!product) {
        product = products.find((p) => p.id === item.product_id);
        productCache.set(item.product_id, product);
      }

      const prepTime = product?.preparation_time || 10;
      maxPreparationTime = Math.max(maxPreparationTime, prepTime);
      maxQuantity = Math.max(maxQuantity, item.quantity);

      if (!seenProducts.has(item.product_id)) {
        seenProducts.add(item.product_id);
        uniqueProducts++;
      }
    });

    const quantityMultiplier =
      maxQuantity > 5 ? 1.8 : maxQuantity > 3 ? 1.5 : maxQuantity > 1 ? 1.2 : 1;

    let estimatedTime = maxPreparationTime * quantityMultiplier;

    if (uniqueProducts > 4) estimatedTime += 8;
    else if (uniqueProducts > 2) estimatedTime += 5;

    return Math.min(Math.max(estimatedTime, 5), 45);
  };

  const getPopularItems = () => {
    return products
      .filter((product) => product.rating && product.rating >= 4.5)
      .slice(0, 6);
  };

  const getProductTotalQuantityInRecentOrders = (productId: number) => {
    return recentOrderItems
      .filter((item) => item.product_id === productId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  const getProductsByCategory = (categoryId: string) => {
    switch (categoryId) {
      case "favorites":
        return favoriteItems;
      case "repite-item":
        return recentItems;
      case "popular":
        return getPopularItems();
      default:
        const categoryMap: { [key: string]: string } = {
          drinks: "Drinks",
          combos: "Combos",
          breakfast: "Breakfast",
          lunch: "Lunch",
          dinner: "Dinner",
          refill: "Refill",
        };
        return products.filter(
          (product) => product.category === categoryMap[categoryId]
        );
    }
  };

  const getCategoryDescription = (categoryId: string) => {
    const category = CATEGORIES.find((cat) => cat.id === categoryId);

    switch (categoryId) {
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

  const handleAssistanceRequest = async () => {
    const targetTableId = tableId || currentTableId;
    if (!targetTableId) return;

    setAssistanceLoading(true);
    try {
      await historyService.requestAssistance(
        parseInt(targetTableId.toString())
      );
      alert("✅ El mesero ha sido notificado. Pronto te atenderá.");
    } catch (error) {
      console.error("Error requesting assistance:", error);
      alert("❌ Error al solicitar asistencia");
    } finally {
      setAssistanceLoading(false);
    }
  };

  const isProductInCart = (productId: number) => {
    return orderItems.some((item) => item.product_id === productId);
  };

  const getProductQuantityInCart = (productId: number) => {
    const item = orderItems.find((item) => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  const getProductNotesInCart = (productId: number) => {
    const item = orderItems.find((item) => item.product_id === productId);
    return item ? item.notes : null;
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

  const CartBadge = () => {
    const formatBadgeCount = (count: number): string => {
      if (count <= 99) {
        return count.toString();
      } else {
        return "99+";
      }
    };

    const getBadgeSize = (count: number): string => {
      if (count < 10) {
        return "w-5 h-5 text-xs";
      } else if (count < 100) {
        return "w-6 h-6 text-xs";
      } else {
        return "w-7 h-7 text-[10px]";
      }
    };

    return (
      <button
        onClick={() => setShowCart(true)}
        className="relative bg-blue-600 text-white px-4 py-3 rounded-full hover:bg-blue-700 transition shadow-lg flex items-center gap-2 group"
      >
        <FaShoppingCart className="text-xl" />
        <span className="font-bold">{cartItemsCount}</span>
        <span className="hidden sm:inline">{formatCurrency(cartTotal)}</span>

        {cartItemsCount > 0 && (
          <div className="absolute -top-2 -right-2">
            <div className="relative">
              <div
                className={`${getBadgeSize(
                  cartItemsCount
                )} bg-red-500 rounded-full flex items-center justify-center font-bold text-white animate-pulse border-2 border-white`}
              >
                {formatBadgeCount(cartItemsCount)}
              </div>
              <div className="absolute inset-0 rounded-full bg-red-400 animate-ping"></div>
            </div>
          </div>
        )}

        {lastOrderSent && cartItemsCount === 0 && (
          <div className="absolute -top-1 -right-1">
            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
        )}
      </button>
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setTimeout(() => {
      const element = categoryRefs.current[categoryId];
      if (element) {
        const offset = 200;
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
          top: elementPosition,
          behavior: "smooth",
        });
      }
    }, 10);
  };

  // Loading mientras verifica sesión
  if (!hasCheckedSession || isInitialLoad) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Recuperando sesión...</p>
          <p className="text-sm text-gray-500 mt-2">
            Si el problema persiste, regresa a la página principal
          </p>
          <button
            onClick={() => router.push("/customer")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // Si ya verificamos pero no hay sesión válida
  if (hasCheckedSession && (!tableId || !orderId || !userId)) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Sesión no válida
          </h2>
          <p className="text-gray-600 mb-6">
            Tu sesión ha expirado o no es válida. Por favor, escanea el código
            QR nuevamente.
          </p>
          <button
            onClick={() => {
              clearSession();
              router.push("/customer");
            }}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Volver al escáner QR
          </button>
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
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">FoodHub</h1>
              <p className="text-sm text-gray-500">
                Mesa {tableNumber} • {customerName}
                {currentOrder?.id && ` • Orden #${currentOrder.id.slice(0, 8)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAssistanceRequest}
              disabled={assistanceLoading}
              className="bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
              title="Solicitar ayuda del mesero"
            >
              <FaQuestion />
              {assistanceLoading ? "Enviando..." : "Ayuda"}
            </button>

            <CartBadge />
          </div>
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
                  {orderItems.length} items en carrito de {customerName}
                </span>
              </div>
              <span className="text-gray-600">
                ⏱️ Tiempo estimado: ~{getEstimatedTime()} min
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Navegación de categorías */}
      <div className="bg-white shadow-sm sticky top-16 z-20 overflow-x-auto">
        <div className="flex gap-2 px-4 py-4 max-w-7xl mx-auto mt-4">
          {CATEGORIES.filter((category) => {
            const productsCount = getProductsByCategory(category.id).length;
            return productsCount > 0;
          }).map((category) => (
            <button
              key={category.id}
              onClick={() => scrollToCategory(category.id)}
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

      {/* Contenedor principal con todas las categorías */}
      <main className="max-w-7xl mx-auto px-4 py-6" ref={containerRef}>
        {/* Renderizar todas las categorías con productos */}
        {CATEGORIES.filter(
          (category) => getProductsByCategory(category.id).length > 0
        ).map((category) => {
          const categoryProducts = getProductsByCategory(category.id);

          return (
            <div
              key={category.id}
              ref={(el) => {
                categoryRefs.current[category.id] = el;
              }}
              data-category={category.id}
              className="mb-12 scroll-mt-48"
            >
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {category.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {getCategoryDescription(category.id)}
                  </p>
                </div>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {categoryProducts.length} items
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryProducts.map((product) => {
                  const isInCart = isProductInCart(product.id);
                  const currentQuantity = getProductQuantityInCart(product.id);
                  const currentNotes = getProductNotesInCart(product.id);
                  const totalRecentQuantity =
                    getProductTotalQuantityInRecentOrders(product.id);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group relative"
                    >
                      {/* Badge de popularidad */}
                      {product.rating !== null &&
                        product.rating !== undefined &&
                        product.rating >= 4.5 && (
                          <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
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

                          {/* Badge de cantidad en órdenes recientes */}
                          {category.id === "repite-item" &&
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

                        {/* Mostrar extras disponibles */}
                        {product.extras && product.extras.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-green-600 font-medium">
                              +
                              {
                                product.extras.filter((e) => e.is_available)
                                  .length
                              }{" "}
                              extras disponibles
                            </p>
                          </div>
                        )}

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
                            {isInCart ? (
                              <>
                                <button
                                  onClick={() => {
                                    const item = orderItems.find(
                                      (item) => item.product_id === product.id
                                    );
                                    if (item) {
                                      if (currentQuantity > 1) {
                                        updateCartItem(
                                          item.id,
                                          currentQuantity - 1
                                        );
                                      } else {
                                        removeFromCart(item.id);
                                      }
                                    }
                                  }}
                                  className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                                >
                                  <FaMinus className="text-sm" />
                                </button>

                                <span className="font-bold text-lg w-8 text-center bg-blue-100 text-blue-600 rounded py-1">
                                  {currentQuantity}
                                </span>

                                <button
                                  onClick={() => {
                                    const item = orderItems.find(
                                      (item) => item.product_id === product.id
                                    );
                                    if (item) {
                                      updateCartItem(
                                        item.id,
                                        currentQuantity + 1
                                      );
                                    }
                                  }}
                                  className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition"
                                >
                                  <FaPlus className="text-sm" />
                                </button>
                              </>
                            ) : (
                              <button
                                id={`product-${product.id}`}
                                onClick={() =>
                                  handleAddToCartWithNotes(product)
                                }
                                disabled={addingProduct === product.id}
                                className="px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-md font-medium flex items-center gap-2 disabled:opacity-50 hover:scale-105"
                              >
                                {addingProduct === product.id ? (
                                  <FaSpinner className="animate-spin" />
                                ) : (
                                  <>
                                    <FaPlus />
                                    Agregar
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Mostrar notas si existen */}
                        {isInCart && currentNotes && (
                          <div className="mt-2">
                            {formatItemNotes(currentNotes)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL DE NOTAS MEJORADO CON EXTRAS */}
      {showNotesModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaStickyNote className="text-blue-600" />
                  {editingItem ? "Editar Pedido" : "Personalizar Pedido"}
                </h2>
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    resetExtras();
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Información del producto */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  {selectedProduct.image_url && (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {selectedProduct.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {selectedProduct.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-blue-600">
                        ${selectedProduct.price.toFixed(2)}
                      </span>
                      {selectedProduct.preparation_time && (
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <FaClock className="text-xs" />
                          {selectedProduct.preparation_time} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* SECCIÓN DE EXTRAS */}
              {selectedProduct.extras && selectedProduct.extras.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <FaPlus className="text-green-600" />
                    Agregar Extras
                  </h3>
                  <div className="space-y-2">
                    {selectedProduct.extras
                      .filter((extra) => extra.is_available)
                      .map((extra, index) => (
                        <label
                          key={index}
                          className={`flex items-center justify-between p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedExtras[extra.name]
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={!!selectedExtras[extra.name]}
                              onChange={() => handleExtraToggle(extra.name)}
                              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <div>
                              <span className="font-medium text-gray-800">
                                {extra.name}
                              </span>
                              <p className="text-sm text-gray-600">
                                +${extra.price.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          {selectedExtras[extra.name] && (
                            <FaCheck className="text-green-600" />
                          )}
                        </label>
                      ))}
                  </div>

                  {/* Resumen de extras seleccionados */}
                  {Object.keys(selectedExtras).filter(
                    (key) => selectedExtras[key]
                  ).length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        Extras seleccionados:
                      </p>
                      <ul className="text-sm text-blue-700 mt-1">
                        {Object.entries(selectedExtras)
                          .filter(([_, isSelected]) => isSelected)
                          .map(([extraName]) => {
                            const extra = selectedProduct.extras?.find(
                              (e) => e.name === extraName
                            );
                            return (
                              <li
                                key={extraName}
                                className="flex justify-between"
                              >
                                <span>• {extraName}</span>
                                <span>+${extra?.price.toFixed(2)}</span>
                              </li>
                            );
                          })}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN DE NOTAS - MEJORADA */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <FaStickyNote className="inline mr-2 text-yellow-600" />
                  Instrucciones especiales (opcional):
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Sin tomate, extra queso, bien cocido, sin picante, sin sal, etc."
                  className={`w-full h-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                    (notes.trim().length > 0 && notes.trim().length < 2) ||
                    (notes.length > 0 && notes.trim().length === 0)
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                  maxLength={200}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {notes.length}/200 caracteres
                  </p>
                  {notes.length > 0 && notes.trim().length === 0 && (
                    <p className="text-xs text-red-500 font-medium">
                      No se permiten solo espacios
                    </p>
                  )}
                  {notes.trim().length > 0 && notes.trim().length < 2 && (
                    <p className="text-xs text-red-500 font-medium">
                      Mínimo 2 caracteres válidos
                    </p>
                  )}
                </div>
              </div>

              {/* RESUMEN FINAL Y PRECIO */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${calculateTotalWithExtras().toFixed(2)}
                  </span>
                </div>
                {calculateTotalWithExtras() > selectedProduct.price && (
                  <p className="text-sm text-gray-600 mt-1 text-right">
                    (Base: ${selectedProduct.price.toFixed(2)} + Extras: $
                    {(
                      calculateTotalWithExtras() - selectedProduct.price
                    ).toFixed(2)}
                    )
                  </p>
                )}
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNotesModal(false);
                    resetExtras();
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAddWithNotes}
                  disabled={
                    addingProduct === selectedProduct.id ||
                    (notes.trim().length > 0 && notes.trim().length < 2) ||
                    (notes.length > 0 && notes.trim().length === 0)
                  }
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingProduct === selectedProduct.id ? (
                    <FaSpinner className="animate-spin" />
                  ) : editingItem ? (
                    <>
                      <FaEdit />
                      Actualizar
                    </>
                  ) : (
                    <>
                      <FaPlus />
                      Agregar al Carrito
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SELECCIÓN DE USUARIO */}
      {showUserSwitch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Cambiar de comensal
                </h2>
                <button
                  onClick={() => setShowUserSwitch(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600">Mesa {tableNumber}</p>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                {tableUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSwitchUser(user)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition ${
                      currentUserId === user.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            currentUserId === user.id
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <FaUser
                            className={
                              currentUserId === user.id
                                ? "text-blue-600"
                                : "text-gray-600"
                            }
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {user.orderId === currentOrder?.id
                              ? "Tú"
                              : "Otro comensal"}
                          </p>
                        </div>
                      </div>
                      {currentUserId === user.id && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddNewUser}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition flex items-center justify-center gap-3"
              >
                <FaUser className="text-green-600" />
                <span className="font-semibold text-green-600">
                  Agregar nuevo comensal
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL CARRITO - MEJORADO */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-end animate-in slide-in-from-right">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    Orden de {customerName}
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
                    onClick={() => router.push("/customer/history")}
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
                      className="p-6 flex items-center gap-4 hover:bg-gray-50 transition group"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-gray-800">
                            {item.product_name}
                          </h3>
                          <button
                            onClick={() => handleEditNotes(item)}
                            className="text-gray-400 hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                            title="Editar notas"
                          >
                            <FaEdit className="text-sm" />
                          </button>
                        </div>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(item.price)}
                        </p>

                        {/* NOTAS Y EXTRAS MEJORADOS EN EL CARRITO */}
                        {item.notes && (
                          <div className="mt-2">
                            {formatItemNotes(item.notes)}
                          </div>
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
                <div className="p-6 bg-gray-50 sticky bottom-0">
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(cartTotal)}</span>
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
                    💡 Los nuevos items se agregarán a una nueva orden para{" "}
                    {customerName}
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
            onClick={() => router.push("/customer/history")}
            className="flex flex-col items-center text-gray-400 hover:text-gray-600"
          >
            <FaHistory className="text-2xl mb-1" />
            <span className="text-xs font-medium">Cuenta</span>
          </button>
          <button
            onClick={() => router.push("/customer/qr")}
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
