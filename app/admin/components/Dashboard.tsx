/* eslint-disable @typescript-eslint/no-explicit-any */
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
  FaFileExport,
  FaReceipt,
  FaTimes,
  FaPlus,
  FaStar,
  FaUser,
  FaCalendarDay,
  FaCalendarWeek,
  FaBan,
} from "react-icons/fa";
import {
  DailyStats,
  OrderSummary,
  PopularProduct,
  SalesSummary,
  SalesHistory,
} from "../types";
import { supabase } from "@/app/lib/supabase/client";

interface DashboardProps {
  dailyStats: DailyStats | null;
  todayOrders: OrderSummary[];
  popularProducts: PopularProduct[];
  dataLoading: boolean;
  onDateChange: (date: Date) => void;
  onDateRangeChange: (startDate: Date, endDate: Date) => void;
  selectedDate: Date;
  salesSummary: SalesSummary | null;
  salesHistory: SalesHistory[];
}

// Interfaz para items de venta basada en tu tabla sales_items
interface SalesItem {
  id: string;
  sale_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
  cancelled_quantity?: number;
  status?: string;
}

// Interfaz para el ticket
interface TicketData {
  sale: SalesHistory;
  items: SalesItem[];
}

// Interfaz para extras procesados - MEJORADA
interface ProcessedExtras {
  hasExtras: boolean;
  extrasList: Array<{ name: string; price: number }>;
  extrasTotal: number;
  basePrice: number;
  finalPrice: number;
  mainNotes?: string;
}

// Interfaz para las encuestas de satisfacción
interface CustomerFeedback {
  id: string;
  table_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  order_count: number;
  total_amount: number;
  created_at: string;
}

// Interfaz para producto agrupado - ACTUALIZADA CON CANCELADOS
interface GroupedProduct {
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  hasExtras: boolean;
  isExtra?: boolean;
  basePrice?: number;
  extrasTotal?: number;
  cancelledQuantity: number;
  cancelledAmount: number;
  activeQuantity: number;
  activeSubtotal: number;
}

type FilterMode = "single" | "range";

export default function Dashboard({
  dailyStats,
  todayOrders,
  popularProducts,
  dataLoading,
  onDateChange,
  onDateRangeChange,
  selectedDate,
  salesSummary,
  salesHistory,
}: DashboardProps) {
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [dateInput, setDateInput] = useState(
    selectedDate.toISOString().split("T")[0]
  );
  const [filterMode, setFilterMode] = useState<FilterMode>("single");
  const [startDateInput, setStartDateInput] = useState(
    selectedDate.toISOString().split("T")[0]
  );
  const [endDateInput, setEndDateInput] = useState(
    selectedDate.toISOString().split("T")[0]
  );
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [customerFeedback, setCustomerFeedback] = useState<CustomerFeedback[]>(
    []
  );
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] =
    useState<CustomerFeedback | null>(null);

  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const adjustForTimezone = (date: Date) => {
      const localDate = new Date(date);
      localDate.setMinutes(
        localDate.getMinutes() + localDate.getTimezoneOffset()
      );
      return localDate;
    };

    const localStart = adjustForTimezone(startDate);
    const localEnd = adjustForTimezone(endDate);

    if (localStart.toDateString() === localEnd.toDateString()) {
      return formatLongDate(localStart);
    }

    return `${localStart.toLocaleDateString(
      "es-MX"
    )} - ${localEnd.toLocaleDateString("es-MX")}`;
  };

  const handleDateRangeChange = () => {
    if (startDateInput && endDateInput) {
      const [startYear, startMonth, startDay] = startDateInput
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = endDateInput.split("-").map(Number);

      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);

      if (startDate > endDate) {
        alert("La fecha de inicio no puede ser mayor que la fecha final");
        return;
      }

      onDateRangeChange(startDate, endDate);
      setShowDateFilter(false);
    }
  };

  const handleFilterModeChange = (mode: FilterMode) => {
    setFilterMode(mode);
    if (mode === "single") {
      const today = new Date();
      setDateInput(today.toISOString().split("T")[0]);
      onDateChange(today);
    }
  };

  // Actualizar dateInput cuando selectedDate cambie
  useEffect(() => {
    setDateInput(selectedDate.toISOString().split("T")[0]);
  }, [selectedDate]);

  // Cargar items de venta cuando cambie el historial de ventas
  useEffect(() => {
    if (salesHistory.length > 0) {
      loadSalesItems();
    } else {
      setSalesItems([]);
    }
  }, [salesHistory]);

  // Cargar encuestas de satisfacción
  useEffect(() => {
    if (filterMode === "single") {
      loadCustomerFeedback(selectedDate);
    } else {
      const startDate = new Date(startDateInput + "T00:00:00");
      const endDate = new Date(endDateInput + "T23:59:59");
      loadCustomerFeedbackForRange(startDate, endDate);
    }
  }, [selectedDate, filterMode, startDateInput, endDateInput]);

  // Función para cargar las encuestas de satisfacción
  const loadCustomerFeedback = async (date: Date = selectedDate) => {
    setLoadingFeedback(true);
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("customer_feedback")
        .select("*")
        .gte("created_at", startDate.toISOString())
        .lt("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando encuestas:", error);
        throw error;
      }

      setCustomerFeedback(data || []);
    } catch (error) {
      console.error("Error al cargar encuestas:", error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // NUEVA FUNCIÓN: Cargar encuestas por rango de fechas
  const loadCustomerFeedbackForRange = async (
    startDate: Date,
    endDate: Date
  ) => {
    setLoadingFeedback(true);
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from("customer_feedback")
        .select("*")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error cargando encuestas por rango:", error);
        throw error;
      }

      setCustomerFeedback(data || []);
    } catch (error) {
      console.error("Error al cargar encuestas por rango:", error);
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Función REAL para obtener items de venta desde Supabase
  const loadSalesItems = async () => {
    setLoadingItems(true);
    try {
      const items = await fetchSalesItemsFromSupabase(
        salesHistory.map((sale) => sale.id)
      );
      setSalesItems(items);
    } catch (error) {
      console.error("Error loading sales items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  // Función REAL para cargar items desde Supabase
  const fetchSalesItemsFromSupabase = async (
    saleIds: string[]
  ): Promise<SalesItem[]> => {
    if (saleIds.length === 0) return [];

    try {
      const { data, error } = (await supabase
        .from("sales_items")
        .select("*")
        .in("sale_id", saleIds)
        .order("product_name")) as { data: any[] | null; error: any };

      if (error) {
        console.error("Error fetching sales items from Supabase:", error);
        throw error;
      }

      // Procesar items para asegurar consistencia en cancelled_quantity
      const processedItems = (data || []).map((item: any) => ({
        ...item,
        cancelled_quantity: item.cancelled_quantity || 0,
        // Si el item está marcado como 'cancelled' pero no tiene cancelled_quantity,
        // asumimos que toda la cantidad está cancelada
        ...(item.status === "cancelled" &&
          !item.cancelled_quantity && {
            cancelled_quantity: item.quantity,
          }),
      }));

      return processedItems;
    } catch (error) {
      console.error("Error in fetchSalesItemsFromSupabase:", error);
      return [];
    }
  };

  // FUNCIÓN MEJORADA: Procesar extras desde las notas - CORREGIDA
  const processExtrasFromNotes = (
    notes: string | null | undefined
  ): ProcessedExtras => {
    if (!notes) {
      return {
        hasExtras: false,
        extrasList: [],
        extrasTotal: 0,
        basePrice: 0,
        finalPrice: 0,
      };
    }

    const hasPricedExtras = notes.includes("(+$");

    if (hasPricedExtras) {
      const parts = notes.split(" | ");
      const mainNotes = parts.find(
        (part) => !part.includes("Extras:") && !part.includes("Total:")
      );
      const extrasPart = parts.find((part) => part.includes("Extras:"));
      const totalPart = parts.find((part) => part.includes("Total:"));

      let extrasList: Array<{ name: string; price: number }> = [];
      let extrasTotal = 0;

      if (extrasPart) {
        const extrasText = extrasPart.replace("Extras: ", "");
        extrasList = extrasText.split(", ").map((extra) => {
          const priceMatch = extra.match(/\(\+\$([^)]+)\)/);
          const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
          const name = extra.split(" (+$")[0];
          extrasTotal += price;
          return { name, price };
        });
      }

      let basePrice = 0;
      let finalPrice = 0;

      if (totalPart) {
        const totalMatch = totalPart.match(/Total: \$([\d.]+)/);
        finalPrice = totalMatch ? parseFloat(totalMatch[1]) : 0;
        basePrice = finalPrice - extrasTotal;
      }

      return {
        hasExtras: true,
        extrasList,
        extrasTotal,
        basePrice,
        finalPrice,
        mainNotes: mainNotes || undefined,
      };
    }

    if (notes.includes("Extras:")) {
      const parts = notes.split(" | ");
      const extrasPart = parts.find((part) => part.startsWith("Extras:"));

      if (extrasPart) {
        const extrasText = extrasPart.replace("Extras: ", "");
        const extrasList = extrasText
          .split(", ")
          .map((name) => ({ name, price: 0 }));

        return {
          hasExtras: true,
          extrasList,
          extrasTotal: 0,
          basePrice: 0,
          finalPrice: 0,
        };
      }
    }

    return {
      hasExtras: false,
      extrasList: [],
      extrasTotal: 0,
      basePrice: 0,
      finalPrice: 0,
    };
  };

  // Función para cargar los items de una venta específica
  const loadTicketItems = async (sale: SalesHistory) => {
    setLoadingTicket(true);
    try {
      const items = await fetchSalesItemsFromSupabase([sale.id]);
      setSelectedTicket({ sale, items });
      setShowTicketModal(true);
    } catch (error) {
      console.error("Error loading ticket items:", error);
      alert("Error al cargar los detalles del ticket");
    } finally {
      setLoadingTicket(false);
    }
  };

  // Función para mostrar los detalles de una encuesta
  const showFeedbackDetails = (feedback: CustomerFeedback) => {
    setSelectedFeedback(feedback);
    setShowFeedbackModal(true);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatLongDate = (date: Date): string => {
    const localDate = new Date(date);
    localDate.setMinutes(
      localDate.getMinutes() + localDate.getTimezoneOffset()
    );

    return localDate.toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("es-MX", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Función para obtener el texto del método de pago
  const getPaymentMethodText = (method: string | null): string => {
    switch (method) {
      case "ticket":
        return "TICKET";
      default:
        return "NO ESPECIFICADO";
    }
  };

  // Función para obtener el icono del método de pago
  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "ticket":
        return <FaReceipt className="text-blue-600" />;
      default:
        return <FaDollarSign className="text-gray-600" />;
    }
  };

  // Función para obtener el color del método de pago
  const getPaymentMethodColor = (method: string | null): string => {
    switch (method) {
      case "ticket":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Función para obtener el color de la calificación
  const getRatingColor = (rating: number): string => {
    switch (rating) {
      case 1:
        return "bg-red-100 text-red-800 border-red-300";
      case 2:
        return "bg-orange-100 text-orange-800 border-orange-300";
      case 3:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case 4:
        return "bg-lime-100 text-lime-800 border-lime-300";
      case 5:
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // Función para obtener el texto de la calificación
  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1:
        return "Muy mala";
      case 2:
        return "Mala";
      case 3:
        return "Regular";
      case 4:
        return "Buena";
      case 5:
        return "Excelente";
      default:
        return "Sin calificar";
    }
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

  // FUNCIÓN CORREGIDA: Calcular ingresos totales incluyendo extras y excluyendo cancelados
  const calculateTotalRevenue = (): number => {
    const totalFromItems = salesItems.reduce((total, item) => {
      const cancelledQty = item.cancelled_quantity || 0;
      const activeQuantity = item.quantity - cancelledQty;
      return total + item.price * activeQuantity;
    }, 0);

    return totalFromItems;
  };

  // FUNCIÓN CORREGIDA: Calcular total cobrado
  const calculateTotalCollected = (): number => {
    return calculateTotalRevenue();
  };

  // FUNCIÓN CORREGIDA: Calcular ventas totales para reportes
  const calculateTotalSalesForReports = (): number => {
    const products = getGroupedProducts();
    return products.reduce(
      (total, product) => total + product.activeSubtotal,
      0
    );
  };

  // FUNCIÓN CORREGIDA: Agrupar productos para reportes CON CANCELADOS
  const getGroupedProducts = (): GroupedProduct[] => {
    const productMap = new Map<string, GroupedProduct>();

    salesItems.forEach((item) => {
      const cancelledQty = item.cancelled_quantity || 0;
      const activeQuantity = item.quantity - cancelledQty;
      const cancelledAmount = item.price * cancelledQty;
      const activeSubtotal = item.price * activeQuantity;

      const processedExtras = processExtrasFromNotes(item.notes);

      if (processedExtras.hasExtras && processedExtras.basePrice > 0) {
        // Producto con extras
        const baseKey = `${item.product_name}-BASE-${processedExtras.basePrice}`;

        if (productMap.has(baseKey)) {
          const existing = productMap.get(baseKey)!;
          productMap.set(baseKey, {
            ...existing,
            quantity: existing.quantity + item.quantity,
            subtotal:
              existing.subtotal + processedExtras.basePrice * item.quantity,
            cancelledQuantity: existing.cancelledQuantity + cancelledQty,
            cancelledAmount:
              existing.cancelledAmount +
              processedExtras.basePrice * cancelledQty,
            activeQuantity: existing.activeQuantity + activeQuantity,
            activeSubtotal:
              existing.activeSubtotal +
              processedExtras.basePrice * activeQuantity,
          });
        } else {
          productMap.set(baseKey, {
            product_name: item.product_name,
            price: processedExtras.basePrice,
            quantity: item.quantity,
            subtotal: processedExtras.basePrice * item.quantity,
            hasExtras: true,
            cancelledQuantity: cancelledQty,
            cancelledAmount: processedExtras.basePrice * cancelledQty,
            activeQuantity: activeQuantity,
            activeSubtotal: processedExtras.basePrice * activeQuantity,
          });
        }

        // Agregar extras
        processedExtras.extrasList.forEach((extra) => {
          if (extra.price > 0) {
            const extraKey = `EXTRA:${extra.name}-${extra.price}`;
            if (productMap.has(extraKey)) {
              const existing = productMap.get(extraKey)!;
              productMap.set(extraKey, {
                ...existing,
                quantity: existing.quantity + item.quantity,
                subtotal: existing.subtotal + extra.price * item.quantity,
                cancelledQuantity: existing.cancelledQuantity + cancelledQty,
                cancelledAmount:
                  existing.cancelledAmount + extra.price * cancelledQty,
                activeQuantity: existing.activeQuantity + activeQuantity,
                activeSubtotal:
                  existing.activeSubtotal + extra.price * activeQuantity,
              });
            } else {
              productMap.set(extraKey, {
                product_name: `+ ${extra.name}`,
                price: extra.price,
                quantity: item.quantity,
                subtotal: extra.price * item.quantity,
                isExtra: true,
                cancelledQuantity: cancelledQty,
                cancelledAmount: extra.price * cancelledQty,
                activeQuantity: activeQuantity,
                activeSubtotal: extra.price * activeQuantity,
              } as GroupedProduct);
            }
          }
        });
      } else {
        // Producto sin extras
        const key = `${item.product_name}-${item.price}`;
        if (productMap.has(key)) {
          const existing = productMap.get(key)!;
          productMap.set(key, {
            ...existing,
            quantity: existing.quantity + item.quantity,
            subtotal: existing.subtotal + item.subtotal,
            cancelledQuantity: existing.cancelledQuantity + cancelledQty,
            cancelledAmount: existing.cancelledAmount + cancelledAmount,
            activeQuantity: existing.activeQuantity + activeQuantity,
            activeSubtotal: existing.activeSubtotal + activeSubtotal,
          });
        } else {
          productMap.set(key, {
            product_name: item.product_name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.subtotal,
            hasExtras: false,
            cancelledQuantity: cancelledQty,
            cancelledAmount: cancelledAmount,
            activeQuantity: activeQuantity,
            activeSubtotal: activeSubtotal,
          });
        }
      }
    });

    return Array.from(productMap.values());
  };

  // FUNCIÓN MEJORADA: Obtener productos ordenados por fecha Y tipo
  const getProductsWithOrderDatesCorrected = () => {
    const groupedProducts = getGroupedProducts();
    const activeProducts = groupedProducts.filter(
      (product) => product.activeQuantity > 0
    );
    const productsWithDates = [];

    // Mapa para guardar relaciones producto -> extra por venta específica
    const productExtraRelations = new Map();

    // Primero: construir relaciones entre productos y extras POR VENTA
    for (const sale of salesHistory) {
      const saleItems = salesItems.filter((item) => item.sale_id === sale.id);

      for (const item of saleItems) {
        if (item.notes) {
          const processedExtras = processExtrasFromNotes(item.notes);
          if (processedExtras.hasExtras) {
            // Guardar relación: producto principal -> extras en esta venta
            processedExtras.extrasList.forEach((extra) => {
              const extraKey = `+ ${extra.name}`;
              if (!productExtraRelations.has(extraKey)) {
                productExtraRelations.set(extraKey, new Map());
              }
              // Relacionar este extra con el producto principal EN ESTA VENTA
              productExtraRelations
                .get(extraKey)
                .set(item.product_name, sale.closed_at);
            });
          }
        }
      }
    }

    // Procesar productos principales
    for (const product of activeProducts) {
      if (!product.isExtra) {
        let orderDate = "N/A";
        let saleTimestamp = Infinity;

        for (const sale of salesHistory) {
          const hasProduct = salesItems.some(
            (item) =>
              item.sale_id === sale.id &&
              item.product_name === product.product_name &&
              Math.abs(item.price - product.price) < 0.01 &&
              item.quantity - (item.cancelled_quantity || 0) > 0
          );

          if (hasProduct) {
            const saleDate = new Date(sale.closed_at);
            if (saleDate.getTime() < saleTimestamp) {
              saleTimestamp = saleDate.getTime();
              orderDate = sale.closed_at;
            }
          }
        }

        productsWithDates.push({
          product,
          orderDate,
          saleTimestamp,
          // Agregar tipo para ordenamiento
          typeOrder: getTypeOrder(product),
        });
      }
    }

    // Procesar extras con fechas CORRECTAS por venta
    for (const product of activeProducts) {
      if (product.isExtra) {
        let orderDate = "N/A";
        let saleTimestamp = Infinity;

        // Buscar todas las ventas donde aparece este extra
        const extraRelations = productExtraRelations.get(product.product_name);

        if (extraRelations) {
          // Encontrar la fecha más temprana para ESTE extra específico
          for (const [mainProduct, date] of extraRelations.entries()) {
            const dateObj = new Date(date);
            if (dateObj.getTime() < saleTimestamp) {
              saleTimestamp = dateObj.getTime();
              orderDate = date;
            }
          }
        }

        // Si no encontramos relaciones, buscar directamente
        if (orderDate === "N/A") {
          for (const sale of salesHistory) {
            const hasExtra = salesItems.some(
              (item) =>
                item.sale_id === sale.id &&
                item.product_name === product.product_name &&
                item.quantity - (item.cancelled_quantity || 0) > 0
            );

            if (hasExtra) {
              const saleDate = new Date(sale.closed_at);
              if (saleDate.getTime() < saleTimestamp) {
                saleTimestamp = saleDate.getTime();
                orderDate = sale.closed_at;
              }
            }
          }
        }

        productsWithDates.push({
          product,
          orderDate,
          saleTimestamp,
          // Agregar tipo para ordenamiento
          typeOrder: getTypeOrder(product),
        });
      }
    }

    // ORDENAMIENTO MEJORADO: Primero por fecha, luego por tipo
    return productsWithDates.sort((a, b) => {
      // Primero ordenar por fecha (más antiguo primero)
      if (a.saleTimestamp !== b.saleTimestamp) {
        return a.saleTimestamp - b.saleTimestamp;
      }

      // Si misma fecha, ordenar por tipo
      if (a.typeOrder !== b.typeOrder) {
        return a.typeOrder - b.typeOrder;
      }

      // Si mismo tipo, ordenar alfabéticamente por nombre
      return a.product.product_name.localeCompare(b.product.product_name);
    });
  };

  // FUNCIÓN AUXILIAR: Obtener orden numérico para tipos
  const getTypeOrder = (product: GroupedProduct): number => {
    if (product.isExtra) {
      return 2; // Extras van después
    } else if (product.hasExtras) {
      return 1; // Productos con extras van en medio
    } else {
      return 0; // Productos simples van primero
    }
  };

  const generateProductsExcelReport = () => {
    const products = getGroupedProducts();

    // Filtrar solo productos activos (sin cancelados)
    const activeProducts = products.filter(
      (product) => product.activeQuantity > 0
    );

    if (activeProducts.length === 0) {
      alert("No hay datos de productos vendidos para exportar");
      return;
    }

    // Calcular totales solo de productos activos
    const totalQuantity = activeProducts.reduce(
      (sum, product) => sum + product.activeQuantity,
      0
    );

    const totalSales = activeProducts.reduce(
      (sum, product) => sum + product.activeSubtotal,
      0
    );

    // Obtener fecha para el reporte
    const reportDate =
      filterMode === "single"
        ? formatLongDate(selectedDate)
        : formatDateRange(new Date(startDateInput), new Date(endDateInput));

    // Crear CSV con encabezados - SIN COLUMNAS DE CANCELADOS
    let csvContent = "Fecha del Reporte:," + reportDate + "\n";
    csvContent += "Generado:," + new Date().toLocaleString("es-MX") + "\n\n";
    csvContent +=
      "No.,Fecha del Pedido,Producto,Precio Unitario,Cantidad,Total,Tipo\n";

    let rowNumber = 1;

    // Obtener productos con fechas y ordenar por fecha (más reciente primero)
    const productsWithDates = getProductsWithOrderDatesCorrected();

    productsWithDates.forEach((productWithDate) => {
      const { product, orderDate } = productWithDate;
      const tipo = product.isExtra
        ? "Extra"
        : product.hasExtras
        ? "Con Extras"
        : "Producto";

      const formattedDate = orderDate ? formatDateTime(orderDate) : "N/A";

      csvContent += `"${rowNumber}","${formattedDate}","${
        product.product_name
      }","${formatCurrency(product.price)}","${
        product.activeQuantity
      }","${formatCurrency(product.activeSubtotal)}","${tipo}"\n`;
      rowNumber++;
    });

    // Agregar totales al final - SIN CANCELADOS
    csvContent += `\n"","","TOTALES","","${totalQuantity}","${formatCurrency(
      totalSales
    )}",""`;

    // Generar nombre de archivo
    const fileName =
      filterMode === "single"
        ? `productos-vendidos-${selectedDate.toISOString().split("T")[0]}.csv`
        : `productos-vendidos-${startDateInput}-a-${endDateInput}.csv`;

    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // FUNCIÓN MEJORADA: Obtener productos con fechas ordenadas y extras corregidos
  const getProductsWithOrderDatesSorted = () => {
    const groupedProducts = getGroupedProducts();

    // Filtrar solo productos activos
    const activeProducts = groupedProducts.filter(
      (product) => product.activeQuantity > 0
    );
    const productsWithDates = [];

    // Crear mapa para relacionar productos principales con extras
    const mainProductsMap = new Map();

    // Primera pasada: procesar productos principales y guardar sus fechas
    for (const product of activeProducts) {
      if (!product.isExtra) {
        let orderDate = "N/A";
        let saleTimestamp = Infinity; // Para ordenar por fecha

        // Buscar en el historial de ventas la primera ocurrencia de este producto
        for (const sale of salesHistory) {
          const hasProduct = salesItems.some(
            (item) =>
              item.sale_id === sale.id &&
              item.product_name === product.product_name &&
              Math.abs(item.price - product.price) < 0.01 &&
              item.quantity - (item.cancelled_quantity || 0) > 0 // Solo items activos
          );

          if (hasProduct) {
            const saleDate = new Date(sale.closed_at);
            if (saleDate.getTime() < saleTimestamp) {
              saleTimestamp = saleDate.getTime();
              orderDate = sale.closed_at;
            }
          }
        }

        // Guardar en el mapa para los extras
        mainProductsMap.set(product.product_name, { orderDate, saleTimestamp });

        productsWithDates.push({
          product,
          orderDate,
          saleTimestamp,
        });
      }
    }

    // Segunda pasada: procesar extras y asignarles la fecha de su producto principal
    for (const product of activeProducts) {
      if (product.isExtra) {
        let orderDate = "N/A";
        let saleTimestamp = Infinity;

        // Buscar el producto principal para este extra
        const mainProductName = findMainProductForExtra(product.product_name);

        if (mainProductName && mainProductsMap.has(mainProductName)) {
          const mainProductData = mainProductsMap.get(mainProductName);
          orderDate = mainProductData.orderDate;
          saleTimestamp = mainProductData.saleTimestamp;
        } else {
          // Si no encontramos el producto principal, buscar directamente
          for (const sale of salesHistory) {
            const hasExtra = salesItems.some(
              (item) =>
                item.sale_id === sale.id &&
                item.product_name.includes(
                  product.product_name.replace("+ ", "")
                ) &&
                item.quantity - (item.cancelled_quantity || 0) > 0
            );

            if (hasExtra) {
              const saleDate = new Date(sale.closed_at);
              if (saleDate.getTime() < saleTimestamp) {
                saleTimestamp = saleDate.getTime();
                orderDate = sale.closed_at;
              }
            }
          }
        }

        productsWithDates.push({
          product,
          orderDate,
          saleTimestamp,
        });
      }
    }

    // Ordenar por fecha (más reciente primero)
    return productsWithDates.sort((a, b) => a.saleTimestamp - b.saleTimestamp);
  };

  // FUNCIÓN AUXILIAR: Encontrar el producto principal para un extra
  const findMainProductForExtra = (extraName: string): string | null => {
    const cleanExtraName = extraName.replace("+ ", "");

    // Buscar en los items de venta para encontrar qué producto principal tiene este extra
    for (const item of salesItems) {
      if (
        item.notes &&
        item.notes.includes(cleanExtraName) &&
        item.quantity - (item.cancelled_quantity || 0) > 0
      ) {
        return item.product_name;
      }
    }

    return null;
  };

  const generateProductsPDFReport = () => {
    const products = getGroupedProducts();

    // Filtrar solo productos activos
    const activeProducts = products.filter(
      (product) => product.activeQuantity > 0
    );

    if (activeProducts.length === 0) {
      alert("No hay datos de productos vendidos para generar el reporte");
      return;
    }

    // Calcular totales solo de productos activos
    const totalQuantity = activeProducts.reduce(
      (sum, product) => sum + product.activeQuantity,
      0
    );

    const totalSales = activeProducts.reduce(
      (sum, product) => sum + product.activeSubtotal,
      0
    );

    // Obtener fecha para el reporte
    const reportDate =
      filterMode === "single"
        ? formatLongDate(selectedDate)
        : `${formatLongDate(new Date(startDateInput))} a ${formatLongDate(
            new Date(endDateInput)
          )}`;

    // Obtener productos ordenados por fecha
    const productsWithDates = getProductsWithOrderDatesCorrected();

    // Crear contenido HTML para el PDF - SIN COLUMNAS DE CANCELADOS
    const content = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Reporte de Productos Vendidos</title>
    <style>
      body { 
        font-family: 'Arial', sans-serif; 
        font-size: 11px; 
        max-width: 1000px; 
        margin: 0 auto; 
        padding: 20px;
        color: #333;
      }
      .header { 
        text-align: center; 
        margin-bottom: 20px; 
        border-bottom: 3px double #000; 
        padding-bottom: 15px; 
      }
      .restaurant-name { 
        font-size: 24px; 
        font-weight: bold; 
        margin-bottom: 5px; 
        color: #1f2937;
      }
      .report-title { 
        font-size: 18px; 
        margin-bottom: 10px; 
        color: #374151;
      }
      .date-info {
        background: #f8fafc;
        padding: 10px;
        border-radius: 6px;
        margin: 10px 0;
        border-left: 4px solid #3b82f6;
      }
      .summary-section { 
        margin: 20px 0; 
        padding: 15px; 
        background: #f8fafc; 
        border-radius: 8px; 
        border: 1px solid #e2e8f0;
      }
      .summary-grid { 
        display: grid; 
        grid-template-columns: repeat(2, 1fr); 
        gap: 15px; 
        margin: 15px 0; 
      }
      .summary-card { 
        padding: 12px; 
        border-radius: 6px; 
        text-align: center;
        border: 1px solid;
      }
      .summary-total { 
        background: #dcfce7; 
        border-color: #bbf7d0; 
      }
      .summary-items { 
        background: #dbeafe; 
        border-color: #bfdbfe; 
      }
      .summary-number { 
        font-size: 18px; 
        font-weight: bold; 
        margin: 5px 0; 
      }
      .products-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0; 
        font-size: 10px;
      }
      .products-table th { 
        background: #374151; 
        color: white; 
        padding: 8px; 
        text-align: left; 
        border: 1px solid #4b5563;
        font-size: 10px;
      }
      .products-table td { 
        padding: 6px 8px; 
        border: 1px solid #d1d5db; 
        font-size: 9px;
      }
      .products-table tr:nth-child(even) { 
        background: #f9fafb; 
      }
      .extra-row { 
        background: #f0f9ff !important; 
        font-style: italic;
        color: #1e40af;
      }
      .product-with-extras { 
        background: #f0fdf4 !important; 
        font-weight: bold;
      }
      .date-column {
        font-size: 9px;
        white-space: nowrap;
      }
      .totals-section { 
        margin-top: 20px; 
        padding-top: 15px; 
        border-top: 2px solid #000; 
      }
      .total-row { 
        display: flex; 
        justify-content: space-between; 
        margin: 5px 0; 
        padding: 0 10px; 
      }
      .grand-total { 
        font-weight: bold; 
        font-size: 16px; 
        margin-top: 10px; 
        padding-top: 10px; 
        border-top: 1px solid #d1d5db; 
      }
      .footer { 
        text-align: center; 
        margin-top: 30px; 
        padding-top: 15px; 
        border-top: 1px solid #d1d5db; 
        font-size: 10px; 
        color: #6b7280;
      }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="restaurant-name">Casa Jardin Burgers</div>
      <div class="report-title">REPORTE DE PRODUCTOS VENDIDOS - ACTIVOS</div>
      <div class="date-info">
        <div><strong>Fecha del Reporte:</strong> ${reportDate}</div>
        <div><strong>Generado:</strong> ${new Date().toLocaleString(
          "es-MX"
        )}</div>
      </div>
    </div>
    
    <!-- Resumen General -->
    <div class="summary-section">
      <h3 style="margin: 0 0 15px 0; color: #1f2937;">RESUMEN GENERAL</h3>
      <div class="summary-grid">
        <div class="summary-card summary-total">
          <div>VENTAS ACTIVAS</div>
          <div class="summary-number">${formatCurrency(totalSales)}</div>
          <div>${totalQuantity} unidades</div>
        </div>
        <div class="summary-card summary-items">
          <div>ITEMS VENDIDOS</div>
          <div class="summary-number">${totalQuantity}</div>
          <div>unidades activas</div>
        </div>
        <div class="summary-card" style="background: #dbeafe; border-color: #bfdbfe;">
          <div>PRODUCTOS DIFERENTES</div>
          <div class="summary-number">${activeProducts.length}</div>
          <div>incluyendo extras</div>
        </div>
        <div class="summary-card" style="background: #f0fdf4; border-color: #bbf7d0;">
          <div>ÓRDENES PROCESADAS</div>
          <div class="summary-number">${salesHistory.length}</div>
          <div>ventas realizadas</div>
        </div>
      </div>
    </div>

    <!-- Tabla de Productos Vendidos SIN CANCELADOS Y ORDENADO POR FECHA -->
    <h3 style="margin: 25px 0 15px 0; color: #1f2937;">DETALLE DE PRODUCTOS VENDIDOS (Ordenado por Fecha)</h3>
    <table class="products-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Fecha del Pedido</th>
          <th>Producto</th>
          <th class="text-right">Precio Unitario</th>
          <th class="text-center">Cantidad</th>
          <th class="text-right">Total</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        ${productsWithDates
          .map((productWithDate, index) => {
            const { product, orderDate } = productWithDate;
            const formattedDate = orderDate ? formatDateTime(orderDate) : "N/A";

            return `
            <tr class="${
              product.isExtra
                ? "extra-row"
                : product.hasExtras
                ? "product-with-extras"
                : ""
            }">
              <td class="text-center">${index + 1}</td>
              <td class="date-column">${formattedDate}</td>
              <td>${product.product_name}</td>
              <td class="text-right">${formatCurrency(product.price)}</td>
              <td class="text-center">${product.activeQuantity}</td>
              <td class="text-right">${formatCurrency(
                product.activeSubtotal
              )}</td>
              <td>${
                product.isExtra
                  ? "Extra"
                  : product.hasExtras
                  ? "Con Extras"
                  : "Producto"
              }</td>
            </tr>
          `;
          })
          .join("")}
      </tbody>
    </table>

    <!-- Totales -->
    <div class="totals-section">
      <div class="total-row">
        <span><strong>Total Items Vendidos:</strong></span>
        <span><strong>${totalQuantity} unidades</strong></span>
      </div>
      <div class="total-row grand-total">
        <span><strong>VENTA TOTAL:</strong></span>
        <span><strong>${formatCurrency(totalSales)}</strong></span>
      </div>
    </div>

    <div class="footer">
      <div>*** REPORTE DE PRODUCTOS ACTIVOS - GENERADO AUTOMÁTICAMENTE ***</div>
      <div>Casa Jardin Burgers - Sistema de Gestión</div>
      <div>${window.location.hostname}</div>
    </div>
  </body>
  </html>
`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // FUNCIÓN CORREGIDA: Generar PDF del ticket con cálculos correctos Y CANCELADOS
  const generateTicketPDF = (ticketData: TicketData) => {
    const { sale, items } = ticketData;

    const total = sale.total_amount;
    const subtotal = total / 1.08;
    const tax = (total * 0.08) / 1.08;

    const itemsWithExtras: Array<any> = [];

    // Procesar cada item para separar productos base de extras
    items.forEach((item) => {
      const cancelledQty = item.cancelled_quantity || 0;
      const activeQuantity = item.quantity - cancelledQty;

      // Solo mostrar items con cantidad activa
      if (activeQuantity > 0) {
        const processedExtras = processExtrasFromNotes(item.notes);

        if (processedExtras.hasExtras && processedExtras.basePrice > 0) {
          const baseSubtotal = processedExtras.basePrice * activeQuantity;

          itemsWithExtras.push({
            ...item,
            price: processedExtras.basePrice,
            subtotal: baseSubtotal,
            quantity: activeQuantity,
            isBaseProduct: true,
            extras: processedExtras.extrasList,
          });

          processedExtras.extrasList.forEach((extra) => {
            if (extra.price > 0) {
              const extraSubtotal = extra.price * activeQuantity;
              itemsWithExtras.push({
                ...item,
                product_name: `+ ${extra.name}`,
                price: extra.price,
                subtotal: extraSubtotal,
                isExtra: true,
                quantity: activeQuantity,
              });
            }
          });
        } else {
          itemsWithExtras.push({
            ...item,
            isBaseProduct: true,
            quantity: activeQuantity,
            subtotal: item.price * activeQuantity,
          });
        }
      }
    });

    // Crear contenido HTML para el PDF
    const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ticket - Mesa ${sale.table_number}</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          max-width: 300px; 
          margin: 0 auto; 
          padding: 10px;
        }
        .header { text-align: center; margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
        .restaurant-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .ticket-info { margin-bottom: 10px; padding: 5px 0; }
        .payment-method { 
          background-color: #dbeafe; 
          padding: 5px; 
          text-align: center; 
          margin: 5px 0; 
          border-radius: 4px; 
          font-weight: bold;
          color: #1e40af;
        }
        .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .items-table th { border-bottom: 1px dashed #000; padding: 5px 2px; text-align: left; }
        .items-table td { padding: 4px 2px; border-bottom: 1px dotted #ccc; }
        .extra-item { font-style: italic; color: #1e40af; font-size: 11px; padding-left: 15px !important; }
        .base-product { font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals { margin-top: 10px; padding-top: 10px; border-top: 2px dashed #000; }
        .total-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .grand-total { font-weight: bold; font-size: 14px; margin-top: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; padding-top: 10px; border-top: 1px dashed #000; }
        .cancelled-note { 
          background: #fef2f2; 
          border: 1px solid #fecaca; 
          padding: 5px; 
          margin: 5px 0; 
          border-radius: 4px; 
          font-size: 10px; 
          color: #dc2626;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">Casa Jardin Burgers</div>
        <div>*** TICKET DE VENTA ***</div>
      </div>
      
      <div class="ticket-info">
        <div><strong>MESA:</strong> ${sale.table_number}</div>
        <div><strong>CLIENTE:</strong> ${sale.customer_name || "INVITADO"}</div>
        <div><strong>FECHA:</strong> ${formatDateTime(sale.closed_at)}</div>
        <div><strong>TRANSACCIÓN:</strong> ${sale.id
          .slice(0, 8)
          .toUpperCase()}</div>
      </div>

      <div class="payment-method">
        MÉTODO DE PAGO: ${getPaymentMethodText(sale.payment_method)}
      </div>

      ${
        items.some((item) => (item.cancelled_quantity || 0) > 0)
          ? `<div class="cancelled-note">
              <strong>NOTA:</strong> Se excluyen items cancelados del total
             </div>`
          : ""
      }
      
      <table class="items-table">
        <thead>
          <tr>
            <th>PRODUCTO</th>
            <th class="text-right">CANT</th>
            <th class="text-right">PRECIO</th>
            <th class="text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${itemsWithExtras
            .map(
              (item) => `
              <tr class="${
                item.isExtra
                  ? "extra-item"
                  : item.isBaseProduct
                  ? "base-product"
                  : ""
              }">
                <td>${item.product_name}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.price)}</td>
                <td class="text-right">${formatCurrency(item.subtotal)}</td>
              </tr>
            `
            )
            .join("")}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>SUBTOTAL:</span>
          <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="total-row">
          <span>IVA (8%):</span>
          <span>${formatCurrency(tax)}</span>
        </div>
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>${formatCurrency(total)}</span>
        </div>
      </div>
      
      <div class="footer">
        <div>*** GRACIAS POR SU VISITA ***</div>
        <div>Casa Jardin Burgers</div>
        <div>${window.location.hostname}</div>
      </div>
    </body>
    </html>
  `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  // Calcular estadísticas de encuestas
  const feedbackStats = {
    total: customerFeedback.length,
    averageRating:
      customerFeedback.length > 0
        ? customerFeedback.reduce((sum, feedback) => sum + feedback.rating, 0) /
          customerFeedback.length
        : 0,
    ratingDistribution: [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: customerFeedback.filter((f) => f.rating === rating).length,
      percentage:
        customerFeedback.length > 0
          ? (customerFeedback.filter((f) => f.rating === rating).length /
              customerFeedback.length) *
            100
          : 0,
    })),
  };

  // Calcular estadísticas de cancelados
  const cancelledStats = {
    totalCancelledQuantity: salesItems.reduce(
      (sum, item) => sum + (item.cancelled_quantity || 0),
      0
    ),
    totalCancelledAmount: salesItems.reduce(
      (sum, item) => sum + item.price * (item.cancelled_quantity || 0),
      0
    ),
    totalActiveQuantity: salesItems.reduce(
      (sum, item) => sum + (item.quantity - (item.cancelled_quantity || 0)),
      0
    ),
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

  // Calcular estadísticas combinadas CORREGIDAS
  const combinedStats = {
    totalRevenue: calculateTotalRevenue(),
    totalItems: salesSummary?.totalItems || dailyStats?.totalItemsSold || 0,
    totalOrders: salesSummary?.totalOrders || dailyStats?.totalOrders || 0,
    activeOrders: todayOrders.length,
    activeTables: dailyStats?.activeTables || 0,
    cancelledItems: cancelledStats.totalCancelledQuantity,
    cancelledAmount: cancelledStats.totalCancelledAmount,
  };

  // Calcular estadísticas de métodos de pago
  const paymentMethodStats = {
    ticket: salesHistory.filter((sale) => sale.payment_method === "ticket")
      .length,
    unspecified: salesHistory.filter((sale) => !sale.payment_method).length,
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
                {filterMode === "single"
                  ? "Reporte del Día"
                  : "Reporte por Rango"}
              </h1>
              <p className="text-gray-600">
                {filterMode === "single"
                  ? isToday
                    ? "Hoy"
                    : formatLongDate(selectedDate)
                  : formatDateRange(
                      new Date(startDateInput),
                      new Date(endDateInput)
                    )}
              </p>
              {combinedStats.cancelledItems > 0 && (
                <p className="text-sm text-red-600 font-medium">
                  {combinedStats.cancelledItems} unidad(es) cancelada(s) -{" "}
                  {formatCurrency(combinedStats.cancelledAmount)} excluido(s)
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector de fecha */}
            <div className="relative">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                <FaFilter />
                Filtrar Fecha
              </button>

              {showDateFilter && (
                <div className="absolute top-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-80">
                  <div className="space-y-4">
                    {/* Selector de modo de filtro */}
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => handleFilterModeChange("single")}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition ${
                          filterMode === "single"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        <FaCalendarDay />
                        Un Día
                      </button>
                      <button
                        onClick={() => handleFilterModeChange("range")}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition ${
                          filterMode === "range"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                      >
                        <FaCalendarWeek />
                        Por Rango
                      </button>
                    </div>

                    {filterMode === "single" ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rango de fechas:
                          </label>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Fecha de inicio:
                              </label>
                              <input
                                type="date"
                                value={startDateInput}
                                onChange={(e) =>
                                  setStartDateInput(e.target.value)
                                }
                                max={new Date().toISOString().split("T")[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">
                                Fecha final:
                              </label>
                              <input
                                type="date"
                                value={endDateInput}
                                onChange={(e) =>
                                  setEndDateInput(e.target.value)
                                }
                                max={new Date().toISOString().split("T")[0]}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={handleDateRangeChange}
                          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          Aplicar Rango
                        </button>
                      </>
                    )}

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
                onClick={generateProductsExcelReport}
                disabled={salesItems.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  salesItems.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                <FaFileExport />
                Excel
              </button>
              <button
                onClick={generateProductsPDFReport}
                disabled={salesItems.length === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  salesItems.length === 0
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                <FaReceipt />
                PDF
              </button>
            </div>
            <button
              onClick={() => onDateChange(selectedDate)}
              className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              <FaTable />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales CORREGIDAS CON CANCELADOS */}
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
              {combinedStats.cancelledAmount > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {formatCurrency(combinedStats.cancelledAmount)} excluidos
                </p>
              )}
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
              {combinedStats.cancelledItems > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {combinedStats.cancelledItems} cancelados
                </p>
              )}
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
              <FaStar className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Satisfacción Clientes</p>
              <p className="text-2xl font-bold text-gray-800">
                {feedbackStats.averageRating.toFixed(1)}
                <span className="text-sm text-gray-500">/5</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {feedbackStats.total} encuestas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Encuestas de Satisfacción */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaStar className="text-yellow-500" />
            Encuestas de Satisfacción
          </h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {loadingFeedback
              ? "Cargando..."
              : `${feedbackStats.total} encuestas`}
          </span>
        </div>

        {customerFeedback.length > 0 ? (
          <div className="space-y-4">
            {/* Distribución de calificaciones */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-700 mb-3">
                Distribución de Calificaciones
              </h4>
              <div className="space-y-2">
                {feedbackStats.ratingDistribution.map(
                  ({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`text-sm ${
                              star <= rating
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-600 w-16 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Lista de encuestas */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {customerFeedback.map((feedback) => (
                <button
                  key={feedback.id}
                  onClick={() => showFeedbackDetails(feedback)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FaUser className="text-blue-600 text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {feedback.customer_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            Mesa {feedback.table_id} • {feedback.order_count}{" "}
                            órdenes • {formatCurrency(feedback.total_amount)}
                          </p>
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {feedback.comment}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border ${getRatingColor(
                          feedback.rating
                        )}`}
                      >
                        <FaStar className="text-sm" />
                        <span className="font-semibold">{feedback.rating}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(feedback.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FaStar className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              No hay encuestas de satisfacción para esta fecha
            </p>
          </div>
        )}
      </div>

      {/* Estadísticas de Métodos de Pago */}
      {salesSummary && salesSummary.saleCount > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaDollarSign className="text-green-600" />
            Métodos de Pago Utilizados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FaReceipt className="text-blue-600 text-xl" />
                <p className="font-semibold text-blue-800">Ticket</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {paymentMethodStats.ticket}
              </p>
              <p className="text-sm text-blue-700">
                {salesSummary.saleCount > 0
                  ? Math.round(
                      (paymentMethodStats.ticket / salesSummary.saleCount) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vista previa de productos vendidos CORREGIDA CON CANCELADOS */}
      {salesItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaShoppingCart className="text-green-600" />
              Productos Vendidos ({cancelledStats.totalActiveQuantity} items
              activos)
            </h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {loadingItems
                ? "Cargando..."
                : `${getGroupedProducts().length} productos diferentes`}
            </span>
          </div>

          {cancelledStats.totalCancelledQuantity > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <FaBan className="text-red-600" />
                <p className="text-sm font-medium">
                  {cancelledStats.totalCancelledQuantity} unidad(es)
                  cancelada(s) -{" "}
                  {formatCurrency(cancelledStats.totalCancelledAmount)}{" "}
                  excluido(s)
                </p>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">
                    Producto
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Precio
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Cant. Activa
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Cant. Cancelada
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-gray-700">
                    Subtotal
                  </th>
                  <th className="px-4 py-2 text-center font-semibold text-gray-700">
                    Tipo
                  </th>
                </tr>
              </thead>
              <tbody>
                {getGroupedProducts()
                  .slice(0, 10)
                  .map((product, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 ${
                        product.isExtra
                          ? "bg-blue-50"
                          : product.hasExtras
                          ? "bg-green-50"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-800">
                        {product.product_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-800">
                        {product.activeQuantity}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {product.cancelledQuantity > 0
                          ? product.cancelledQuantity
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        {formatCurrency(product.activeSubtotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs ${
                            product.isExtra
                              ? "bg-blue-100 text-blue-800"
                              : product.hasExtras
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.isExtra
                            ? "Extra"
                            : product.hasExtras
                            ? "Con Extras"
                            : "Producto"}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {getGroupedProducts().length > 10 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                Mostrando 10 de {getGroupedProducts().length} productos. Exporta
                el Excel o PDF para ver todos.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Detalle de Ventas Históricas CORREGIDO */}
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
                {formatCurrency(calculateTotalCollected())}
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
              Detalle de Ventas (Click para ver ticket):
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {salesHistory.map((sale) => (
                <button
                  key={sale.id}
                  onClick={() => loadTicketItems(sale)}
                  disabled={loadingTicket}
                  className="w-full text-left flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${getPaymentMethodColor(
                        sale.payment_method
                      )}`}
                    >
                      {getPaymentMethodIcon(sale.payment_method)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        Mesa {sale.table_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.customer_name || "Invitado"} • {sale.order_count}{" "}
                        órdenes • {sale.item_count} items
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(sale.total_amount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.closed_at).toLocaleTimeString("es-MX")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLES DE ENCUESTA */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaStar className="text-yellow-500" />
                  Detalles de Encuesta
                </h2>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <FaUser className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {selectedFeedback.customer_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Mesa {selectedFeedback.table_id}
                    </p>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-lg border ${getRatingColor(
                    selectedFeedback.rating
                  )}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Calificación</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar
                          key={star}
                          className={`text-lg ${
                            star <= selectedFeedback.rating
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm font-medium">
                    {getRatingText(selectedFeedback.rating)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600">Órdenes</p>
                    <p className="font-semibold text-gray-800">
                      {selectedFeedback.order_count}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600">Total Gastado</p>
                    <p className="font-semibold text-green-600">
                      {formatCurrency(selectedFeedback.total_amount)}
                    </p>
                  </div>
                </div>

                {selectedFeedback.comment && (
                  <div>
                    <p className="font-semibold text-gray-700 mb-2">
                      Comentario:
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-gray-700 italic">
                        {selectedFeedback.comment}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-500">
                  <p>Fecha: {formatDateTime(selectedFeedback.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEL TICKET */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <FaReceipt className="text-blue-600" />
                  Ticket de Venta
                </h2>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Mesa:</strong> {selectedTicket.sale.table_number}
                  </p>
                  <p>
                    <strong>Cliente:</strong>{" "}
                    {selectedTicket.sale.customer_name || "Invitado"}
                  </p>
                </div>
                <div>
                  <p>
                    <strong>Fecha:</strong>{" "}
                    {formatDateTime(selectedTicket.sale.closed_at)}
                  </p>
                  <p>
                    <strong>Total:</strong>{" "}
                    {formatCurrency(selectedTicket.sale.total_amount)}
                  </p>
                </div>
              </div>

              {/* MÉTODO DE PAGO EN EL MODAL */}
              <div
                className={`mt-3 p-3 rounded-lg border ${getPaymentMethodColor(
                  selectedTicket.sale.payment_method
                )}`}
              >
                <div className="flex items-center gap-2">
                  {getPaymentMethodIcon(selectedTicket.sale.payment_method)}
                  <span className="font-semibold">Método de Pago:</span>
                  <span>
                    {getPaymentMethodText(selectedTicket.sale.payment_method)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Productos:</h3>
              <div className="space-y-3">
                {selectedTicket.items.map((item) => {
                  const cancelledQty = item.cancelled_quantity || 0;
                  const activeQuantity = item.quantity - cancelledQty;
                  const processedExtras = processExtrasFromNotes(item.notes);

                  // Solo mostrar items con cantidad activa
                  if (activeQuantity === 0) return null;

                  return (
                    <div key={item.id}>
                      {/* Producto principal */}
                      <div className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">
                            {item.product_name}
                            {cancelledQty > 0 && (
                              <span className="text-sm text-red-600 ml-2">
                                (de {item.quantity}, {cancelledQty}{" "}
                                cancelada(s))
                              </span>
                            )}
                          </p>
                          {item.notes && !processedExtras.hasExtras && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Nota:</strong> {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-gray-800">
                            {activeQuantity} × {formatCurrency(item.price)}
                          </p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(item.price * activeQuantity)}
                          </p>
                        </div>
                      </div>

                      {/* Mostrar extras si existen */}
                      {processedExtras.hasExtras && (
                        <div className="ml-4 mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <FaPlus className="text-xs" />
                            <span className="font-medium">
                              Extras incluidos:
                            </span>
                          </div>
                          {processedExtras.extrasList.map((extra, index) => {
                            return (
                              <div
                                key={index}
                                className="flex justify-between items-center text-sm text-gray-600 ml-4"
                              >
                                <span>• {extra.name}</span>
                                <span className="text-green-600">
                                  {activeQuantity} ×{" "}
                                  {formatCurrency(extra.price)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Cálculos de totales en el modal */}
              <div className="mt-6 pt-4 border-t border-gray-300">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      {formatCurrency(selectedTicket.sale.total_amount / 1.08)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (8%):</span>
                    <span>
                      {formatCurrency(
                        (selectedTicket.sale.total_amount * 0.08) / 1.08
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
                    <span>TOTAL:</span>
                    {formatCurrency(selectedTicket.sale.total_amount)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 bg-gray-500 text-white py-3 rounded-xl font-bold hover:bg-gray-600 transition"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => generateTicketPDF(selectedTicket)}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <FaReceipt />
                  Imprimir PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
