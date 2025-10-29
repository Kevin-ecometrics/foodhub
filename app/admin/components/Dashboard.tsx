// app/admin/components/Dashboard.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import {
  FaUtensils,
  FaMoneyBillWave,
  FaCalendarDay,
  FaTable,
  FaChartBar,
  FaFilter,
  FaFileExport,
  FaCalendarAlt,
} from "react-icons/fa";
import { DailyStats, OrderSummary, PopularProduct } from "../types";

interface DashboardProps {
  dailyStats: DailyStats | null;
  todayOrders: OrderSummary[];
  popularProducts: PopularProduct[];
  dataLoading: boolean;
  onDateChange: (date: Date) => void;
  selectedDate: Date;
}

export default function Dashboard({
  dailyStats,
  todayOrders,
  popularProducts,
  dataLoading,
  onDateChange,
  selectedDate,
}: DashboardProps) {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateInput, setDateInput] = useState(
    selectedDate.toISOString().split("T")[0]
  );

  // Actualizar dateInput cuando selectedDate cambie
  useEffect(() => {
    setDateInput(selectedDate.toISOString().split("T")[0]);
  }, [selectedDate]);

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

  const formatLongDate = (date: Date): string => {
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateValue = e.target.value;
    setDateInput(newDateValue);
    if (newDateValue) {
      const newDate = new Date(newDateValue);
      onDateChange(newDate);
    }
    setShowDateFilter(false);
  };

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    // No permitir fechas futuras
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día actual
    if (newDate <= today) {
      onDateChange(newDate);
    }
  };

  const handleToday = () => {
    const today = new Date();
    onDateChange(today);
  };

  const generateCSVReport = () => {
    // CSV para órdenes
    let csvContent = "Fecha,Mesa,Total,Estado,Items\n";
    todayOrders.forEach((order) => {
      csvContent += `"${order.created_at}","Mesa ${order.table_id}","${order.total_amount}","${order.status}","${order.items_count}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ordenes-${selectedDate.toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const day24HoursAgo = new Date(selectedDate);
  day24HoursAgo.setDate(day24HoursAgo.getDate() + 1);

  if (dataLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Cargando datos...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header con controles de fecha */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="text-blue-600 text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                Reporte del Día
              </h1>
              <p className="text-gray-600">
                {isToday ? "Hoy" : formatLongDate(day24HoursAgo)}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector de fecha */}
            <div className="relative">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FaFilter />
                Cambiar Fecha
              </button>

              {showDateFilter && (
                <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-64">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Seleccionar fecha:
                    </label>
                    <input
                      type="date"
                      value={dateInput}
                      onChange={handleDateChange}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setShowDateFilter(false)}
                        className="flex-1 bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600 transition"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de exportación */}
            <div className="flex gap-2">
              <button
                onClick={generateCSVReport}
                disabled={todayOrders.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  todayOrders.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <FaFileExport />
                Exportar CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
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

      {/* Órdenes y Productos Populares */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaUtensils />
              Órdenes del Día
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {todayOrders.length} órdenes
            </span>
          </div>
          <div className="space-y-3">
            {todayOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay órdenes para esta fecha
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
                      {formatDate(order.created_at)} • {order.items_count} items
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaChartBar />
              Productos Más Vendidos
            </h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {popularProducts.length} productos
            </span>
          </div>
          <div className="space-y-3">
            {popularProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No hay datos de ventas para esta fecha
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

      {/* Resumen del Reporte */}
      {dailyStats && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Resumen del Reporte - {formatLongDate(selectedDate)}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800">Órdenes Totales</p>
              <p className="text-2xl font-bold text-blue-600">
                {dailyStats.totalOrders}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-800">Ingresos Totales</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(dailyStats.totalRevenue)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="font-semibold text-orange-800">Items Vendidos</p>
              <p className="text-2xl font-bold text-orange-600">
                {dailyStats.totalItemsSold}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="font-semibold text-purple-800">Ticket Promedio</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(dailyStats.averageOrderValue)}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
