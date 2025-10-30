// app/admin/components/Dashboard.tsx
"use client";
import { useState, useEffect } from "react";
import {
  FaUtensils,
  FaTable,
  FaFilter,
  FaCalendarAlt,
  FaDollarSign,
  FaShoppingCart,
} from "react-icons/fa";
import {
  DailyStats,
  OrderSummary,
  PopularProduct,
  SalesSummary,
  SalesHistory,
} from "../types";

interface DashboardProps {
  dailyStats: DailyStats | null;
  todayOrders: OrderSummary[];
  popularProducts: PopularProduct[];
  dataLoading: boolean;
  onDateChange: (date: Date) => void;
  selectedDate: Date;
  salesSummary: SalesSummary | null;
  salesHistory: SalesHistory[];
}

export default function Dashboard({
  dailyStats,
  todayOrders,
  dataLoading,
  onDateChange,
  selectedDate,
  salesSummary,
  salesHistory,
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

  const formatLongDate = (date: Date): string => {
    return date.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatLongDateNextDay = (date: Date): string => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return formatLongDate(nextDay);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateValue = e.target.value;
    setDateInput(newDateValue);
    if (newDateValue) {
      const [year, month, day] = newDateValue.split("-").map(Number);
      const newDate = new Date(year, month - 1, day);
      onDateChange(newDate);
    }
    setShowDateFilter(false);
  };

  const generateSalesCSVReport = () => {
    // CSV para ventas históricas
    let csvContent = "Fecha Cierre,Mesa,Cliente,Total,Órdenes,Items\n";
    salesHistory.forEach((sale) => {
      csvContent += `"${sale.closed_at}","Mesa ${sale.table_number}","${
        sale.customer_name || "Invitado"
      }","${sale.total_amount}","${sale.order_count}","${sale.item_count}"\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ventas-historicas-${
      selectedDate.toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  if (dataLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Cargando datos...</p>
      </div>
    );
  }

  // Calcular estadísticas combinadas
  const combinedStats = {
    // Usar ventas históricas como datos principales (son los que ya se cobraron)
    totalRevenue: salesSummary?.totalSales || dailyStats?.totalRevenue || 0,
    totalItems: salesSummary?.totalItems || dailyStats?.totalItemsSold || 0,
    totalOrders: salesSummary?.totalOrders || dailyStats?.totalOrders || 0,
    // Para órdenes activas (pendientes de cobrar)
    activeOrders: todayOrders.length,
    activeTables: dailyStats?.activeTables || 0,
  };

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
                {isToday ? "Hoy" : formatLongDateNextDay(selectedDate)}
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
                onClick={generateSalesCSVReport}
                disabled={salesHistory.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  salesHistory.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                <FaDollarSign />
                Ventas CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(combinedStats.totalRevenue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {salesSummary?.saleCount || 0} ventas procesadas
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaShoppingCart className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Items Vendidos</p>
              <p className="text-2xl font-bold text-gray-800">
                {combinedStats.totalItems}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                En {combinedStats.totalOrders} órdenes
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaUtensils className="text-orange-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Órdenes Activas</p>
              <p className="text-2xl font-bold text-gray-800">
                {combinedStats.activeOrders}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                En {combinedStats.activeTables} mesas
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
                {formatCurrency(
                  combinedStats.totalOrders > 0
                    ? combinedStats.totalRevenue / combinedStats.totalOrders
                    : 0
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">Por orden procesada</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detalle de Ventas Históricas */}
      {salesSummary && salesSummary.saleCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaDollarSign className="text-green-600" />
            Ventas Procesadas (Cobradas)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-800">Total Cobrado</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(salesSummary.totalSales)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800">Transacciones</p>
              <p className="text-2xl font-bold text-blue-600">
                {salesSummary.saleCount}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="font-semibold text-orange-800">Items Vendidos</p>
              <p className="text-2xl font-bold text-orange-600">
                {salesSummary.totalItems}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="font-semibold text-purple-800">
                Órdenes Procesadas
              </p>
              <p className="text-2xl font-bold text-purple-600">
                {salesSummary.totalOrders}
              </p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="font-semibold text-indigo-800">Ticket Promedio</p>
              <p className="text-2xl font-bold text-indigo-600">
                {formatCurrency(salesSummary.averageSale)}
              </p>
            </div>
          </div>

          {/* Lista de ventas históricas */}
          <div className="mt-6">
            <h4 className="font-semibold text-gray-700 mb-3">
              Detalle de Ventas:
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {salesHistory.map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-3 border border-gray-100 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">
                      Mesa {sale.table_number}
                    </p>
                    <p className="text-sm text-gray-500">
                      {sale.customer_name || "Invitado"} • {sale.order_count}{" "}
                      órdenes • {sale.item_count} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(sale.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.closed_at).toLocaleTimeString("es-MX")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
