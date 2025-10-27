// app/admin/page.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import {
  FaLock,
  FaUser,
  FaChartBar,
  FaUtensils,
  FaTable,
  FaMoneyBillWave,
  FaCalendarDay,
  FaSignOutAlt,
} from "react-icons/fa";

// Credenciales fijas del administrador
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "restaurant2024",
};

interface DailyStats {
  totalOrders: number;
  totalRevenue: number;
  totalItemsSold: number;
  activeTables: number;
  averageOrderValue: number;
}

interface OrderSummary {
  id: string;
  table_id: number;
  total_amount: number;
  created_at: string;
  status: string;
  items_count: number;
}

interface PopularProduct {
  product_name: string;
  total_quantity: number;
  total_revenue: number;
}

// Interfaces para las respuestas de Supabase
interface OrderItem {
  quantity: number;
  price: number;
}

interface OrderWithItems {
  id: string;
  total_amount: number;
  created_at: string;
  order_items: OrderItem[];
}

interface OrderTable {
  table_id: number;
}

interface OrderWithItemsCount {
  id: string;
  table_id: number;
  total_amount: number;
  created_at: string;
  status: string;
  order_items: Array<{ id: string }>;
}

interface OrderItemForStats {
  product_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Datos del dashboard
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [todayOrders, setTodayOrders] = useState<OrderSummary[]>([]);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Obtener fecha de hoy - corregido para evitar mutación
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfDayISO = startOfDay.toISOString();
  const endOfDayISO = endOfDay.toISOString();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setIsAuthenticated(true);
    } else {
      setError("Credenciales incorrectas");
    }
    setLoading(false);
  };

  const loadDailyData = async () => {
    setDataLoading(true);
    try {
      await Promise.all([
        loadDailyStats(),
        loadTodayOrders(),
        loadPopularProducts(),
      ]);
    } catch (error) {
      console.error("Error loading daily data:", error);
      setError("Error cargando los datos del día");
    } finally {
      setDataLoading(false);
    }
  };

  const loadDailyStats = async () => {
    try {
      // Estadísticas generales del día
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("id, total_amount, created_at, order_items(quantity, price)")
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO);

      if (ordersError) throw ordersError;

      const ordersData = orders as OrderWithItems[] | null;
      const totalOrders = ordersData?.length || 0;
      const totalRevenue =
        ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

      const totalItemsSold =
        ordersData?.reduce(
          (sum, order) =>
            sum +
            (order.order_items?.reduce(
              (itemSum, item) => itemSum + item.quantity,
              0
            ) || 0),
          0
        ) || 0;

      const averageOrderValue =
        totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Mesas activas hoy
      const { data: activeTables, error: tablesError } = await supabase
        .from("orders")
        .select("table_id")
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO)
        .neq("status", "completed");

      if (tablesError) throw tablesError;

      const activeTablesData = activeTables as OrderTable[] | null;
      const uniqueTables = new Set(
        activeTablesData?.map((order) => order.table_id) || []
      );

      setDailyStats({
        totalOrders,
        totalRevenue,
        totalItemsSold,
        activeTables: uniqueTables.size,
        averageOrderValue,
      });
    } catch (error) {
      console.error("Error in loadDailyStats:", error);
      throw error;
    }
  };

  const loadTodayOrders = async () => {
    try {
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "id, table_id, total_amount, created_at, status, order_items(id)"
        )
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ordersData = orders as OrderWithItemsCount[] | null;

      const ordersWithCount: OrderSummary[] = (ordersData || []).map(
        (order) => ({
          id: order.id,
          table_id: order.table_id,
          total_amount: order.total_amount,
          created_at: order.created_at,
          status: order.status,
          items_count: order.order_items?.length || 0,
        })
      );

      setTodayOrders(ordersWithCount);
    } catch (error) {
      console.error("Error in loadTodayOrders:", error);
      throw error;
    }
  };

  const loadPopularProducts = async () => {
    try {
      const { data: orderItems, error } = await supabase
        .from("order_items")
        .select("product_name, quantity, price, created_at")
        .gte("created_at", startOfDayISO)
        .lte("created_at", endOfDayISO);

      if (error) throw error;

      const orderItemsData = orderItems as OrderItemForStats[] | null;
      const productMap = new Map<
        string,
        { total_quantity: number; total_revenue: number }
      >();

      orderItemsData?.forEach((item) => {
        const existing = productMap.get(item.product_name) || {
          total_quantity: 0,
          total_revenue: 0,
        };
        productMap.set(item.product_name, {
          total_quantity: existing.total_quantity + item.quantity,
          total_revenue: existing.total_revenue + item.price * item.quantity,
        });
      });

      const popular: PopularProduct[] = Array.from(productMap.entries())
        .map(([product_name, stats]) => ({
          product_name,
          total_quantity: stats.total_quantity,
          total_revenue: stats.total_revenue,
        }))
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 10);

      setPopularProducts(popular);
    } catch (error) {
      console.error("Error in loadPopularProducts:", error);
      throw error;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername("");
    setPassword("");
    setDailyStats(null);
    setTodayOrders([]);
    setPopularProducts([]);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Cargar datos cuando se autentique
  useEffect(() => {
    if (isAuthenticated) {
      loadDailyData();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaLock className="text-2xl text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Panel Administrativo
            </h1>
            <p className="text-gray-600 mt-2">Ingrese sus credenciales</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ingrese su contraseña"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              <strong>Demo:</strong> usuario: <code>admin</code> / contraseña:{" "}
              <code>restaurant2024</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaChartBar className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Dashboard Administrativo
                </h1>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString("es-MX", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
            >
              <FaSignOutAlt />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {dataLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Cargando datos del día...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaUtensils className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Órdenes</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {dailyStats?.totalOrders || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaMoneyBillWave className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(dailyStats?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FaCalendarDay className="text-orange-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items Vendidos</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {dailyStats?.totalItemsSold || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <FaTable className="text-purple-600 text-xl" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ticket Promedio</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {formatCurrency(dailyStats?.averageOrderValue || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaUtensils />
                  Órdenes de Hoy
                </h2>
                <div className="space-y-3">
                  {todayOrders.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No hay órdenes hoy
                    </p>
                  ) : (
                    todayOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            Mesa {order.table_id}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.created_at)} • {order.items_count}{" "}
                            items
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(order.total_amount)}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              order.status === "paid"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status === "paid" ? "Pagado" : "Activo"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FaChartBar />
                  Productos Más Vendidos
                </h2>
                <div className="space-y-3">
                  {popularProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No hay datos de ventas hoy
                    </p>
                  ) : (
                    popularProducts.map((product, index) => (
                      <div
                        key={product.product_name}
                        className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">
                              {product.product_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {product.total_quantity} vendidos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">
                            {formatCurrency(product.total_revenue)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
