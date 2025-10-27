"use client";
import React, { useState, useEffect } from "react";
import {
  FaUtensils,
  FaHistory,
  FaCreditCard,
  FaQrcode,
  FaUser,
  FaShoppingCart,
  FaStar,
  FaPlus,
  FaMinus,
  FaTrash,
  FaWineBottle,
  FaReceipt,
  FaPrint,
  FaClock,
  FaChair,
} from "react-icons/fa";

// Types
interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
  rating: number;
  category: string;
  description?: string;
  isRefill?: boolean;
  refillPrice?: number;
}

interface CartItem extends Product {
  quantity: number;
  selectedRefill?: boolean;
  addedAt: string;
}

interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  date: string;
  status: "pending" | "completed" | "closed";
}

const Hero = () => {
  const [selectedCategory, setSelectedCategory] = useState("Repite Item");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState("hp"); // Cambiado a "hp" como pantalla inicial
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [recentItems, setRecentItems] = useState<Product[]>([]);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");

  // Pantalla de selección de mesa (HP)
  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaChair className="text-3xl text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido a FoodHub
          </h1>
          <p className="text-gray-600">Selecciona tu mesa para comenzar</p>
        </div>

        {/* Selección de mesa */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Número de Mesa
          </label>
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((num) => (
              <button
                key={num}
                onClick={() => setTableNumber(num)}
                className={`w-12 h-12 rounded-xl border-2 font-semibold transition-all ${
                  tableNumber === num
                    ? "bg-blue-600 text-white border-blue-600 scale-110"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Nombre opcional del cliente */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu nombre (opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Botón de continuar */}
        <button
          onClick={() => setActiveTab("menu")}
          disabled={!tableNumber}
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            tableNumber
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {tableNumber
            ? `Continuar a Menú - Mesa ${tableNumber}`
            : "Selecciona una mesa"}
        </button>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡 Si no encuentras tu mesa, pregunta al mesero
          </p>
        </div>
      </div>
    </div>
  );

  // Categories
  const categories = [
    {
      id: 1,
      name: "Repite Item",
      icon: "🔄",
      description: "Your recent items",
    },
    { id: 2, name: "Refill", icon: "🥤", description: "Refill your drinks" },
    { id: 3, name: "Combos", icon: "🍔", description: "Special combos" },
    { id: 4, name: "Breakfast", icon: "🍳", description: "Morning delights" },
    { id: 5, name: "Lunch", icon: "🍱", description: "Lunch specials" },
    { id: 6, name: "Dinner", icon: "🍕", description: "Dinner favorites" },
  ];

  // All products data
  const allProducts: Product[] = [
    {
      id: 1,
      title: "Chicken Bowl",
      price: 12.99,
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      rating: 4.5,
      category: "Lunch",
      description: "Grilled chicken with rice and vegetables",
    },
    {
      id: 2,
      title: "Beef Burger",
      price: 9.5,
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
      rating: 4.8,
      category: "Dinner",
      description: "Juicy beef burger with cheese and veggies",
    },
    {
      id: 3,
      title: "Soda Refill",
      price: 2.5,
      image:
        "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400",
      rating: 4.2,
      category: "Refill",
      description: "Refill your favorite soda",
      isRefill: true,
      refillPrice: 1.0,
    },
    {
      id: 4,
      title: "Coffee Refill",
      price: 3.5,
      image:
        "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
      rating: 4.6,
      category: "Refill",
      description: "Hot coffee refill",
      isRefill: true,
      refillPrice: 1.5,
    },
    {
      id: 5,
      title: "Family Combo",
      price: 24.99,
      image:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
      rating: 4.9,
      category: "Combos",
      description: "Perfect for family dinner",
    },
    {
      id: 6,
      title: "Breakfast Combo",
      price: 8.99,
      image: "https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400",
      rating: 4.4,
      category: "Breakfast",
      description: "Complete breakfast set",
    },
    {
      id: 7,
      title: "Business Lunch",
      price: 15.5,
      image:
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
      rating: 4.7,
      category: "Lunch",
      description: "Professional lunch option",
    },
    {
      id: 8,
      title: "Steak Dinner",
      price: 18.75,
      image:
        "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400",
      rating: 4.8,
      category: "Dinner",
      description: "Premium steak dinner",
    },
    {
      id: 9,
      title: "Veggie Wrap",
      price: 7.99,
      image:
        "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
      rating: 4.3,
      category: "Lunch",
      description: "Fresh vegetable wrap",
    },
    {
      id: 10,
      title: "Pancake Breakfast",
      price: 6.5,
      image:
        "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
      rating: 4.5,
      category: "Breakfast",
      description: "Fluffy pancakes with syrup",
    },
  ];

  // Add to cart function
  const addToCart = (product: Product, selectedRefill: boolean = false) => {
    const existingItem = cart.find(
      (item) => item.id === product.id && item.selectedRefill === selectedRefill
    );

    const finalPrice =
      selectedRefill && product.refillPrice
        ? product.refillPrice
        : product.price;

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id && item.selectedRefill === selectedRefill
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...product,
          quantity: 1,
          selectedRefill,
          price: finalPrice,
          addedAt: new Date().toISOString(),
        },
      ]);
    }

    // Add to recent items if not already there
    if (!recentItems.find((item) => item.id === product.id)) {
      setRecentItems((prev) => [product, ...prev].slice(0, 6)); // Keep only last 6 items
    }
  };

  const removeFromCart = (
    productId: number,
    selectedRefill: boolean = false
  ) => {
    setCart(
      cart.filter(
        (item) =>
          !(item.id === productId && item.selectedRefill === selectedRefill)
      )
    );
  };

  const updateQuantity = (
    productId: number,
    selectedRefill: boolean,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      removeFromCart(productId, selectedRefill);
      return;
    }

    setCart(
      cart.map((item) =>
        item.id === productId && item.selectedRefill === selectedRefill
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Generate order function - Ahora agrega al historial sin limpiar el carrito
  const generateOrder = () => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      items: [...cart],
      subtotal,
      tax,
      total,
      date: new Date().toISOString(),
      status: "completed",
    };

    setOrderHistory((prev) => [newOrder, ...prev]);
    // NO limpiamos el carrito para que puedan seguir pidiendo
    setActiveTab("history");
  };

  // Close command function
  const closeCommand = () => {
    setShowCloseModal(true);
  };

  const confirmCloseCommand = () => {
    // Aquí se procesaría el pago final
    setShowCloseModal(false);
    setActiveTab("history");
  };

  // Filter products based on category
  const getFilteredProducts = () => {
    if (selectedCategory === "Repite Item") {
      return recentItems;
    }
    return allProducts.filter(
      (product) => product.category === selectedCategory
    );
  };

  // Calculate cart totals
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Calculate totals from all orders
  const allOrdersTotal = orderHistory.reduce(
    (sum, order) => sum + order.total,
    0
  );
  const allOrdersItems = orderHistory.reduce(
    (sum, order) => sum + order.items.length,
    0
  );

  // Render different content based on active tab
  const renderContent = () => {
    if (activeTab === "hp") {
      return renderHomePage();
    }

    switch (activeTab) {
      case "menu":
        return renderMenu();
      case "cart":
        return renderCart();
      case "history":
        return renderHistory();
      case "payment":
        return renderPayment();
      case "qr":
        return renderQR();
      case "mypage":
        return renderMyPage();
      default:
        return renderMenu();
    }
  };

  const renderMenu = () => {
    const filteredProducts = getFilteredProducts();

    return (
      <>
        {/* Categories Horizontal Scroll */}
        <div className="bg-white shadow-sm sticky top-16 z-10 overflow-x-auto">
          <div className="flex gap-2 px-4 py-4 max-w-7xl mx-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl font-medium whitespace-nowrap transition min-w-[100px] ${
                  selectedCategory === cat.name
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span className="text-sm">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {selectedCategory}
              </h2>
              <p className="text-sm text-gray-500">
                {
                  categories.find((c) => c.name === selectedCategory)
                    ?.description
                }
              </p>
            </div>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredProducts.length} items
            </span>
          </div>

          {selectedCategory === "Repite Item" &&
            filteredProducts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <div className="text-6xl mb-4">🔄</div>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Recent Items
                </h3>
                <p className="text-gray-500">
                  Items you order will appear here for quick reordering
                </p>
              </div>
            )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>

          {filteredProducts.length === 0 &&
            selectedCategory !== "Repite Item" && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No items in this category yet
                </p>
              </div>
            )}
        </main>

        {/* Floating Cart Button */}
        {cart.length > 0 && (
          <div className="fixed bottom-20 right-4 z-20">
            <button
              onClick={() => setActiveTab("cart")}
              className="bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl font-bold hover:bg-blue-700 transition flex items-center gap-3"
            >
              <FaShoppingCart className="text-xl" />
              <div className="text-left">
                <div className="text-sm opacity-90">{totalItems} items</div>
                <div className="text-lg">${total.toFixed(2)}</div>
              </div>
            </button>
          </div>
        )}
      </>
    );
  };

  const ProductCard = ({
    product,
    onAddToCart,
  }: {
    product: Product;
    onAddToCart: (product: Product, selectedRefill: boolean) => void;
  }) => (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      <div className="relative overflow-hidden h-48">
        <img
          src={product.image}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
          <FaStar className="text-yellow-400 text-sm" />
          <span className="text-sm font-semibold">{product.rating}</span>
        </div>
        {selectedCategory === "Repite Item" && (
          <div className="absolute top-3 left-3 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Recent
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-1">
          {product.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3">{product.description}</p>

        {product.isRefill ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-2xl font-bold text-green-600">
                  ${product.refillPrice?.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through ml-2">
                  ${product.price.toFixed(2)}
                </span>
                <div className="text-xs text-green-600 font-semibold">
                  REFILL PRICE
                </div>
              </div>
              <button
                onClick={() => onAddToCart(product, true)}
                className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition shadow-md font-medium flex items-center gap-2"
              >
                <FaWineBottle />
                Refill +
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-600">
              ${product.price.toFixed(2)}
            </span>
            <button
              onClick={() => onAddToCart(product, false)}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition shadow-md font-medium"
            >
              Add +
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderCart = () => (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Current Order</h2>
          <p className="text-gray-600">{totalItems} items in cart</p>
        </div>

        {cart.length === 0 ? (
          <div className="p-12 text-center">
            <FaShoppingCart className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Your cart is empty
            </h3>
            <p className="text-gray-500">
              Add some delicious items from the menu!
            </p>
            <button
              onClick={() => setActiveTab("menu")}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y max-h-96 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={`${item.id}-${item.selectedRefill}`}
                  className="p-6 flex items-center gap-4"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {item.title}
                    </h3>
                    {item.selectedRefill && (
                      <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Refill
                      </span>
                    )}
                    <p className="text-lg font-bold text-blue-600">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        updateQuantity(
                          item.id,
                          item.selectedRefill || false,
                          item.quantity - 1
                        )
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
                        updateQuantity(
                          item.id,
                          item.selectedRefill || false,
                          item.quantity + 1
                        )
                      }
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition"
                    >
                      <FaPlus className="text-sm" />
                    </button>
                    <button
                      onClick={() =>
                        removeFromCart(item.id, item.selectedRefill)
                      }
                      className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition ml-4"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-blue-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab("menu")}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
                >
                  Add More Items
                </button>
                <button
                  onClick={generateOrder}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition"
                >
                  Send to Kitchen
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Order History</h2>
        {orderHistory.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Consumption</p>
            <p className="text-xl font-bold text-blue-600">
              ${allOrdersTotal.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {orderHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <FaHistory className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No orders yet
            </h3>
            <p className="text-gray-500">
              Your orders will appear here once you send them to the kitchen
            </p>
            <button
              onClick={() => setActiveTab("menu")}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          orderHistory.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{order.id}</h3>
                  <p className="text-gray-600 text-sm">
                    {new Date(order.date).toLocaleString()} •{" "}
                    {order.items.length} items
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    ${order.total.toFixed(2)}
                  </p>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="flex items-center gap-2">
                      {item.selectedRefill && (
                        <FaWineBottle className="text-green-500" />
                      )}
                      {item.title}
                      <span className="text-gray-500">x{item.quantity}</span>
                    </span>
                    <span className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 text-sm mt-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Final Bill</h2>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <FaReceipt />
            Consumption Summary
          </h3>
          <p className="opacity-90">All your orders in one place</p>
        </div>

        <div className="p-6">
          {orderHistory.length === 0 ? (
            <div className="text-center py-8">
              <FaReceipt className="text-4xl text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No consumption yet</p>
              <button
                onClick={() => setActiveTab("menu")}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
              >
                Start Ordering
              </button>
            </div>
          ) : (
            <>
              {/* Total Consumption */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-blue-800">
                      Total Consumption
                    </h4>
                    <p className="text-sm text-blue-600">
                      {allOrdersItems} items across {orderHistory.length} orders
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      ${allOrdersTotal.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Breakdown */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg mb-3">Order Details</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="border-b pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-sm">{order.id}</span>
                        <span className="font-semibold">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between">
                            <span>
                              {item.title} x{item.quantity}
                            </span>
                            <span>
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Command Button */}
              <button
                onClick={closeCommand}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-2"
              >
                <FaPrint />
                Close Command
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderQR = () => (
    <div className="max-w-md mx-auto px-4 py-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Scan QR Code</h2>

      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="w-64 h-64 mx-auto bg-gray-200 rounded-xl flex items-center justify-center mb-6">
          <FaQrcode className="text-8xl text-gray-400" />
        </div>
        <p className="text-gray-600 mb-4">
          Scan this QR code to view our digital menu
        </p>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-blue-700 transition">
          Generate New QR
        </button>
      </div>
    </div>
  );

  const renderMyPage = () => (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUser className="text-3xl text-blue-600" />
          </div>
          <h3 className="text-xl font-bold">
            {customerName || "Guest Customer"}
          </h3>
          <p className="opacity-90">Table {tableNumber} • Currently Dining</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center py-3 border-b">
            <span className="font-semibold">Total Orders Today</span>
            <span className="text-blue-600 font-bold">
              {orderHistory.length}
            </span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="font-semibold">Table Number</span>
            <span className="text-gray-600">{tableNumber}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b">
            <span className="font-semibold">Current Bill</span>
            <span className="text-green-600 font-bold">
              ${allOrdersTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Close Command Modal
  const renderCloseModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white rounded-t-2xl text-center">
          <FaPrint className="text-4xl mx-auto mb-3" />
          <h3 className="text-xl font-bold">Close Command</h3>
          <p className="opacity-90">Requesting final bill</p>
        </div>

        <div className="p-6 text-center">
          <FaClock className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-800 mb-2">
            Waiter Notified
          </h4>
          <p className="text-gray-600 mb-4">
            Your waiter has been notified and will bring your printed bill
            shortly. Please wait at your table.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-yellow-800 font-semibold">
              Total Amount: ${allOrdersTotal.toFixed(2)}
            </p>
            <p className="text-sm text-yellow-700">
              Table {tableNumber} • {customerName || "Guest"}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCloseModal(false)}
              className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={confirmCloseCommand}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Si estamos en la pantalla de selección de mesa, no mostrar el layout normal
  if (activeTab === "hp") {
    return renderHomePage();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              FoodHub Restaurant
            </h1>
            <p className="text-sm text-gray-500">
              Table #{tableNumber} • {customerName || "Guest"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {cart.length > 0 && (
              <button
                onClick={() => setActiveTab("cart")}
                className="relative bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FaShoppingCart />
                <span>{totalItems}</span>
              </button>
            )}
            {orderHistory.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Bill</p>
                <p className="text-lg font-bold text-green-600">
                  ${allOrdersTotal.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {renderContent()}

      {/* Close Command Modal */}
      {showCloseModal && renderCloseModal()}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="max-w-7xl mx-auto flex justify-around py-3">
          {[
            { icon: FaUtensils, label: "Menu", id: "menu" },
            { icon: FaHistory, label: "History", id: "history" },
            { icon: FaCreditCard, label: "Bill", id: "payment" },
            { icon: FaQrcode, label: "QR", id: "qr" },
            { icon: FaUser, label: "MyPage", id: "mypage" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center transition ${
                activeTab === item.id
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <item.icon className="text-2xl mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Hero;
