/* eslint-disable @typescript-eslint/no-explicit-any */
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
  FaMoneyBillWave,
  FaCreditCard,
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
    selectedDate.toISOString().split("T")[0],
  );
  const [filterMode, setFilterMode] = useState<FilterMode>("single");
  const [startDateInput, setStartDateInput] = useState(
    selectedDate.toISOString().split("T")[0],
  );
  const [endDateInput, setEndDateInput] = useState(
    selectedDate.toISOString().split("T")[0],
  );
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [loadingTicket, setLoadingTicket] = useState(false);
  const [customerFeedback, setCustomerFeedback] = useState<CustomerFeedback[]>(
    [],
  );
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] =
    useState<CustomerFeedback | null>(null);

  const formatDateRange = (startDate: Date, endDate: Date): string => {
    const adjustForTimezone = (date: Date) => {
      const localDate = new Date(date);
      localDate.setMinutes(
        localDate.getMinutes() + localDate.getTimezoneOffset(),
      );
      return localDate;
    };

    const localStart = adjustForTimezone(startDate);
    const localEnd = adjustForTimezone(endDate);

    if (localStart.toDateString() === localEnd.toDateString()) {
      return formatLongDate(localStart);
    }

    return `${localStart.toLocaleDateString(
      "es-MX",
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
    endDate: Date,
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
        salesHistory.map((sale) => sale.id),
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
    saleIds: string[],
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
    notes: string | null | undefined,
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
        (part) => !part.includes("Extras:") && !part.includes("Total:"),
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
      localDate.getMinutes() + localDate.getTimezoneOffset(),
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
      case "cash":
        return "EFECTIVO";
      case "terminal":
        return "TERMINAL";
      case "usd":
        return "DOLARES";
      case "mixed":
        return "MIXTO";
      default:
        return "TICKET";
    }
  };

  // Función para obtener el icono del método de pago
  const getPaymentMethodIcon = (method: string | null) => {
    switch (method) {
      case "cash":
        return <FaMoneyBillWave className="text-green-600" />;
      case "terminal":
        return <FaCreditCard className="text-[var(--color-accent)]" />;
      case "usd":
        return <FaDollarSign className="text-yellow-600" />;
      case "mixed":
        return <FaReceipt className="text-purple-600" />;
      default:
        return <FaDollarSign className="text-gray-600" />;
    }
  };

  // Función para obtener el color del método de pago
  const getPaymentMethodColor = (method: string | null): string => {
    switch (method) {
      case "cash":
        return "bg-green-100 text-green-800 border-green-300";
      case "terminal":
        return "bg-[var(--color-accent-light)] text-[var(--color-accent-dark)] border-[var(--color-accent-light)]";
      case "usd":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "mixed":
        return "bg-purple-100 text-purple-800 border-purple-300";
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
      0,
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
      (product) => product.activeQuantity > 0,
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
              item.quantity - (item.cancelled_quantity || 0) > 0,
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
                item.quantity - (item.cancelled_quantity || 0) > 0,
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
      (product) => product.activeQuantity > 0,
    );

    if (activeProducts.length === 0) {
      alert("No hay datos de productos vendidos para exportar");
      return;
    }

    // Calcular totales solo de productos activos
    const totalQuantity = activeProducts.reduce(
      (sum, product) => sum + product.activeQuantity,
      0,
    );

    const totalSales = activeProducts.reduce(
      (sum, product) => sum + product.activeSubtotal,
      0,
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
      totalSales,
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
      (product) => product.activeQuantity > 0,
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
              item.quantity - (item.cancelled_quantity || 0) > 0, // Solo items activos
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
                  product.product_name.replace("+ ", ""),
                ) &&
                item.quantity - (item.cancelled_quantity || 0) > 0,
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
      (product) => product.activeQuantity > 0,
    );

    if (activeProducts.length === 0) {
      alert("No hay datos de productos vendidos para generar el reporte");
      return;
    }

    // Calcular totales solo de productos activos
    const totalQuantity = activeProducts.reduce(
      (sum, product) => sum + product.activeQuantity,
      0,
    );

    const totalSales = activeProducts.reduce(
      (sum, product) => sum + product.activeSubtotal,
      0,
    );

    // Obtener fecha para el reporte
    const reportDate =
      filterMode === "single"
        ? formatLongDate(selectedDate)
        : `${formatLongDate(new Date(startDateInput))} a ${formatLongDate(
            new Date(endDateInput),
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
      <div class="restaurant-name">SCAN-EAT</div>
      <div class="report-title">REPORTE DE PRODUCTOS VENDIDOS - ACTIVOS</div>
      <div class="date-info">
        <div><strong>Fecha del Reporte:</strong> ${reportDate}</div>
        <div><strong>Generado:</strong> ${new Date().toLocaleString(
          "es-MX",
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
                product.activeSubtotal,
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
      <div>ScanEat - Sistema de Gestión</div>
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

    // Obtener el texto del método de pago para mostrarlo en el ticket
    const paymentMethodText = getPaymentMethodText(sale.payment_method);
    const paymentMethodColor = getPaymentMethodColor(sale.payment_method);

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
        .payment-cash { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .payment-terminal { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
        .payment-ticket { background: #f3e8ff; color: #6b21a5; border: 1px solid #e9d5ff; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="restaurant-name">SCAN-EAT</div>
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

      <div class="payment-method ${paymentMethodColor.replace(
        /bg-[^ ]+ /g,
        "",
      )}">
        🧾 MÉTODO DE PAGO: ${paymentMethodText}
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
            `,
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
        <div>ScanEat</div>
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
      0,
    ),
    totalCancelledAmount: salesItems.reduce(
      (sum, item) => sum + item.price * (item.cancelled_quantity || 0),
      0,
    ),
    totalActiveQuantity: salesItems.reduce(
      (sum, item) => sum + (item.quantity - (item.cancelled_quantity || 0)),
      0,
    ),
  };

  // Calcular estadísticas de métodos de pago usando el campo payment_method
  const paymentMethodStats = {
    cash: salesHistory.filter((sale) => sale.payment_method === "cash").length,
    terminal: salesHistory.filter((sale) => sale.payment_method === "terminal")
      .length,
    usd: salesHistory.filter((sale) => sale.payment_method === "usd").length,

    mixed: salesHistory.filter((sale) => sale.payment_method === "mixed")
      .length,
    unspecified: salesHistory.filter((sale) => !sale.payment_method).length,
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  if (dataLoading) {
    return (
      <div className="text-center py-12" style={{fontFamily:"var(--font-geist-sans)"}}>
        <div className="w-12 h-12 rounded-[14px] bg-[var(--color-accent)] flex items-center justify-center mx-auto">
          <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </div>
        <p className="text-slate-500 mt-4 text-sm font-medium">Cargando datos...</p>
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

  return (
    <>
      {/* Header con controles de fecha */}
      <div className="bg-white border border-slate-200 rounded-[14px] p-4 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[var(--color-accent-light)] rounded-[10px] flex items-center justify-center text-[var(--color-accent)]">
              <FaCalendarAlt className="text-base" />
            </div>
            <div>
              <p className="text-base font-extrabold text-slate-900">
                {filterMode === "single"
                  ? "Reporte del Día"
                  : "Reporte por Rango"}
              </p>
              <p className="text-xs text-slate-500">
                {filterMode === "single"
                  ? isToday
                    ? "Hoy"
                    : formatLongDate(selectedDate)
                  : formatDateRange(
                      new Date(startDateInput),
                      new Date(endDateInput),
                    )}
              </p>
              {combinedStats.cancelledItems > 0 && (
                <p className="text-xs text-red-600 font-semibold mt-0.5">
                  {combinedStats.cancelledItems} cancelado(s) —{" "}
                  {formatCurrency(combinedStats.cancelledAmount)} excluidos
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Selector de fecha */}
            <div className="relative">
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <FaFilter className="text-[11px]" />
                Filtrar Fecha
              </button>

              {showDateFilter && (
                <div className="absolute top-[calc(100%+6px)] right-0 bg-white border border-slate-200 rounded-[14px] shadow-xl p-4 z-50 w-64">
                  <div className="space-y-3">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleFilterModeChange("single")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-[8px] border text-xs font-bold transition ${
                          filterMode === "single"
                            ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <FaCalendarDay />
                        Un Día
                      </button>
                      <button
                        onClick={() => handleFilterModeChange("range")}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-[8px] border text-xs font-bold transition ${
                          filterMode === "range"
                            ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <FaCalendarWeek />
                        Por Rango
                      </button>
                    </div>

                    {filterMode === "single" ? (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 mb-1.5">Fecha:</p>
                        <input
                          type="date"
                          value={dateInput}
                          onChange={handleDateChange}
                          max={new Date().toISOString().split("T")[0]}
                          className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-sm outline-none focus:border-slate-900"
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Rango de fechas:</p>
                        <div>
                          <p className="text-[11px] text-slate-500 mb-1">Fecha de inicio:</p>
                          <input
                            type="date"
                            value={startDateInput}
                            onChange={(e) => setStartDateInput(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-sm outline-none focus:border-slate-900"
                          />
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-500 mb-1">Fecha final:</p>
                          <input
                            type="date"
                            value={endDateInput}
                            onChange={(e) => setEndDateInput(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-sm outline-none focus:border-slate-900"
                          />
                        </div>
                        <button
                          onClick={handleDateRangeChange}
                          className="w-full bg-emerald-600 text-white py-2.5 rounded-[9px] text-xs font-bold hover:brightness-90 transition"
                        >
                          Aplicar Rango
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => setShowDateFilter(false)}
                      className="w-full py-2 bg-gray-50 border border-slate-200 rounded-[9px] text-xs font-semibold text-slate-500 hover:bg-slate-100 transition"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={generateProductsExcelReport}
              disabled={salesItems.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border text-xs font-bold transition ${
                salesItems.length === 0
                  ? "border-slate-200 bg-gray-50 text-slate-400 cursor-not-allowed"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <FaFileExport className="text-[11px]" />
              Excel
            </button>
            <button
              onClick={generateProductsPDFReport}
              disabled={salesItems.length === 0}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border text-xs font-bold transition ${
                salesItems.length === 0
                  ? "border-slate-200 bg-gray-50 text-slate-400 cursor-not-allowed"
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              <FaReceipt className="text-[11px]" />
              PDF
            </button>
            <button
              onClick={() => onDateChange(selectedDate)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-[var(--color-accent-light)] bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-bold hover:bg-[var(--color-accent-light)] transition"
            >
              <FaFilter className="text-[11px]" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        {[
          {
            label: "Ingresos Totales",
            value: formatCurrency(combinedStats.totalRevenue),
            sub: `${salesSummary?.saleCount || 0} ventas procesadas`,
            note: combinedStats.cancelledAmount > 0 ? `${formatCurrency(combinedStats.cancelledAmount)} excluidos` : null,
            noteColor: "text-red-500",
            iconBg: "bg-[var(--color-accent-light)]",
            iconColor: "text-[var(--color-accent)]",
            icon: <FaDollarSign className="text-[18px]" />,
          },
          {
            label: "Items Vendidos",
            value: String(combinedStats.totalItems),
            sub: `En ${combinedStats.totalOrders} órdenes`,
            note: combinedStats.cancelledItems > 0 ? `${combinedStats.cancelledItems} cancelados` : null,
            noteColor: "text-red-500",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            icon: <FaShoppingCart className="text-[18px]" />,
          },
          {
            label: "Órdenes Activas",
            value: String(combinedStats.activeOrders),
            sub: `En ${combinedStats.activeTables} mesas`,
            note: null,
            noteColor: "",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-500",
            icon: <FaUtensils className="text-[18px]" />,
          },
          {
            label: "Satisfacción Clientes",
            value: `${feedbackStats.averageRating.toFixed(1)}/5`,
            sub: `${feedbackStats.total} encuestas`,
            note: null,
            noteColor: "",
            iconBg: "bg-purple-50",
            iconColor: "text-purple-600",
            icon: <FaStar className="text-[18px]" />,
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-[14px] p-4">
            <p className="text-[11px] text-slate-500 font-semibold mb-2 uppercase tracking-wide">{stat.label}</p>
            <div className="flex items-center gap-2.5">
              <div className={`w-9 h-9 rounded-[9px] ${stat.iconBg} flex items-center justify-center ${stat.iconColor} flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[22px] font-extrabold text-slate-900 leading-none">{stat.value}</p>
                <p className="text-[11px] text-slate-500 mt-1">{stat.sub}</p>
                {stat.note && <p className={`text-[11px] mt-0.5 ${stat.noteColor}`}>{stat.note}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Métodos de Pago */}
      {salesHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[14px] p-4 mb-5">
          <p className="text-[15px] font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <FaDollarSign className="text-emerald-600" />
            Métodos de Pago Utilizados
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Efectivo", count: paymentMethodStats.cash, icon: <FaMoneyBillWave />, bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", val: "text-emerald-600" },
              { label: "Terminal", count: paymentMethodStats.terminal, icon: <FaCreditCard />, bg: "bg-[var(--color-accent-light)] border-[var(--color-accent-light)]", text: "text-[var(--color-accent-dark)]", val: "text-[var(--color-accent)]" },
              { label: "Dólares", count: paymentMethodStats.usd, icon: <FaDollarSign />, bg: "bg-amber-50 border-amber-200", text: "text-amber-700", val: "text-amber-600" },
              { label: "Mixto", count: paymentMethodStats.mixed, icon: <FaDollarSign />, bg: "bg-slate-50 border-slate-200", text: "text-slate-700", val: "text-slate-600" },
            ].map((m, i) => (
              <div key={i} className={`text-center p-3.5 rounded-[10px] border ${m.bg}`}>
                <div className={`flex items-center justify-center gap-1.5 mb-1.5 ${m.text} font-semibold text-sm`}>
                  {m.icon} {m.label}
                </div>
                <p className={`text-[22px] font-extrabold ${m.val}`}>{m.count}</p>
                <p className={`text-xs ${m.text}`}>
                  {salesHistory.length > 0 ? Math.round((m.count / salesHistory.length) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Encuestas de Satisfacción */}
      <div className="bg-white border border-slate-200 rounded-[14px] p-4 mb-5">
        <div className="flex justify-between items-center mb-4">
          <p className="text-[15px] font-extrabold text-slate-900 flex items-center gap-2">
            <FaStar className="text-amber-500" /> Encuestas de Satisfacción
          </p>
          <span className="text-xs text-slate-500">
            {loadingFeedback ? "Cargando..." : `${feedbackStats.total} encuestas`}
          </span>
        </div>

        {customerFeedback.length > 0 ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">Distribución de Calificaciones</p>
              <div className="space-y-2">
                {[5,4,3,2,1].map((star) => {
                  const item = feedbackStats.ratingDistribution.find(r => r.rating === star)!;
                  return (
                    <div key={star} className="flex items-center gap-2.5">
                      <span className="text-amber-500 text-xs w-[60px] flex-shrink-0">{"★".repeat(star)}{"☆".repeat(5-star)}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${item?.percentage || 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 w-[50px] text-right flex-shrink-0">
                        {item?.count || 0} ({(item?.percentage || 0).toFixed(0)}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {customerFeedback.map((feedback) => (
                <button
                  key={feedback.id}
                  onClick={() => showFeedbackDetails(feedback)}
                  className="w-full text-left p-3.5 border border-slate-200 rounded-[12px] hover:bg-[var(--color-accent-light)] hover:border-[var(--color-accent-light)] transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2.5 items-center">
                      <div className="w-8 h-8 rounded-[8px] bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                        <FaUser className="text-xs" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900">{feedback.customer_name}</p>
                        <p className="text-[11px] text-slate-500">Mesa {feedback.table_id} · {feedback.order_count} órden(es) · {formatCurrency(feedback.total_amount)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2.5 py-1 rounded-[6px] text-xs font-bold flex items-center gap-1 ${getRatingColor(feedback.rating)}`}>
                        <FaStar className="text-[10px]" /> {feedback.rating}
                      </span>
                      <span className="text-[11px] text-slate-500">{formatDateTime(feedback.created_at)}</span>
                    </div>
                  </div>
                  {feedback.comment && (
                    <p className="text-xs text-slate-500 mt-2 ml-10 line-clamp-2">{feedback.comment}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <FaStar className="text-4xl text-slate-200 mx-auto" />
            <p className="text-slate-500 text-sm mt-2">No hay encuestas de satisfacción para esta fecha</p>
          </div>
        )}
      </div>

      {/* Productos Vendidos */}
      {salesItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[14px] p-4 mb-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[15px] font-extrabold text-slate-900 flex items-center gap-2">
              <FaShoppingCart className="text-emerald-600" />
              Productos Vendidos ({cancelledStats.totalActiveQuantity} activos)
            </p>
            <span className="text-xs text-slate-500">
              {loadingItems ? "Cargando..." : `${getGroupedProducts().length} productos`}
            </span>
          </div>

          {cancelledStats.totalCancelledQuantity > 0 && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-[10px] flex items-center gap-2 text-red-700 text-xs font-semibold">
              <FaBan />
              {cancelledStats.totalCancelledQuantity} cancelado(s) — {formatCurrency(cancelledStats.totalCancelledAmount)} excluidos
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {["Producto","Precio","Cant. Activa","Cant. Cancelada","Subtotal","Tipo"].map((h,i) => (
                    <th key={i} className={`px-4 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide ${i===0?"text-left":"text-right"} ${i===5?"text-center":""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getGroupedProducts().slice(0, 10).map((product, index) => (
                  <tr
                    key={index}
                    className={`border-b border-slate-100 transition-colors hover:bg-gray-50 ${
                      product.isExtra ? "bg-[var(--color-accent-light)]/60" : product.hasExtras ? "bg-emerald-50/60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-800 font-medium text-xs">{product.product_name}</td>
                    <td className="px-4 py-3 text-right text-slate-700 text-xs">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-3 text-right text-slate-700 text-xs">{product.activeQuantity}</td>
                    <td className="px-4 py-3 text-right text-red-600 text-xs">{product.cancelledQuantity > 0 ? product.cancelledQuantity : "—"}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 text-xs">{formatCurrency(product.activeSubtotal)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-[5px] text-[10px] font-bold ${
                        product.isExtra ? "bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]" : product.hasExtras ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {product.isExtra ? "Extra" : product.hasExtras ? "Con Extras" : "Producto"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getGroupedProducts().length > 10 && (
              <p className="text-xs text-slate-500 mt-3 text-center">
                Mostrando 10 de {getGroupedProducts().length} productos. Exporta Excel o PDF para ver todos.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Ventas Procesadas */}
      {salesSummary && salesSummary.saleCount > 0 && (
        <div className="bg-white border border-slate-200 rounded-[14px] p-4 mb-5">
          <p className="text-[15px] font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <FaDollarSign className="text-emerald-600" />
            Ventas Procesadas (Cobradas)
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
            {[
              { label: "Total Cobrado", value: formatCurrency(calculateTotalCollected()), bg: "bg-emerald-50", text: "text-emerald-700", val: "text-emerald-600" },
              { label: "Transacciones", value: String(salesSummary.saleCount), bg: "bg-[var(--color-accent-light)]", text: "text-[var(--color-accent-dark)]", val: "text-[var(--color-accent)]" },
              { label: "Items Vendidos", value: String(salesSummary.totalItems), bg: "bg-amber-50", text: "text-amber-700", val: "text-amber-600" },
              { label: "Órdenes", value: String(salesSummary.totalOrders), bg: "bg-purple-50", text: "text-purple-700", val: "text-purple-600" },
              { label: "Ticket Promedio", value: formatCurrency(salesSummary.averageSale), bg: "bg-[var(--color-accent-light)]", text: "text-[var(--color-accent-dark)]", val: "text-[var(--color-accent)]" },
            ].map((s, i) => (
              <div key={i} className={`text-center p-3 ${s.bg} rounded-[10px]`}>
                <p className={`text-xs font-semibold ${s.text} mb-1`}>{s.label}</p>
                <p className={`text-lg font-extrabold ${s.val}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-slate-600 mb-2">Detalle de Ventas (click para ver ticket):</p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {salesHistory.map((sale) => (
              <button
                key={sale.id}
                onClick={() => loadTicketItems(sale)}
                disabled={loadingTicket}
                className="w-full text-left flex justify-between items-center p-3 border border-slate-200 rounded-[10px] hover:bg-[var(--color-accent-light)] hover:border-[var(--color-accent-light)] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center border ${getPaymentMethodColor(sale.payment_method)}`}>
                    {getPaymentMethodIcon(sale.payment_method)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Mesa {sale.table_number}</p>
                    <p className="text-[11px] text-slate-500">{sale.customer_name || "Invitado"} · {sale.order_count} órd. · {sale.item_count} items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-600">{formatCurrency(sale.total_amount)}</p>
                  <p className="text-[10px] text-slate-500">{new Date(sale.closed_at).toLocaleTimeString("es-MX")}</p>
                  <p className="text-[10px] font-semibold text-slate-600 mt-0.5">{getPaymentMethodText(sale.payment_method)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal Encuesta */}
      {showFeedbackModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setShowFeedbackModal(false)}>
          <div className="bg-white rounded-[18px] shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <p className="text-base font-extrabold text-slate-900 flex items-center gap-2"><FaStar className="text-amber-500" /> Detalles de Encuesta</p>
              <button onClick={() => setShowFeedbackModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><FaTimes /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-slate-100 rounded-[8px] flex items-center justify-center text-slate-600 flex-shrink-0">
                  <FaUser />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedFeedback.customer_name}</p>
                  <p className="text-xs text-slate-500">Mesa {selectedFeedback.table_id}</p>
                </div>
              </div>
              <div className={`p-3.5 rounded-[10px] border ${getRatingColor(selectedFeedback.rating)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Calificación</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(star => (
                      <FaStar key={star} className={`text-base ${star <= selectedFeedback.rating ? "text-amber-500" : "text-gray-300"}`} />
                    ))}
                  </div>
                </div>
                <p className="text-xs font-semibold">{getRatingText(selectedFeedback.rating)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-[10px]">
                  <p className="text-[11px] text-slate-500">Órdenes</p>
                  <p className="text-sm font-bold text-slate-900">{selectedFeedback.order_count}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-[10px]">
                  <p className="text-[11px] text-slate-500">Total Gastado</p>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(selectedFeedback.total_amount)}</p>
                </div>
              </div>
              {selectedFeedback.comment && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1.5">Comentario:</p>
                  <div className="bg-[var(--color-accent-light)] p-3 rounded-[10px] border border-[var(--color-accent-light)]">
                    <p className="text-xs text-slate-700 italic">{selectedFeedback.comment}</p>
                  </div>
                </div>
              )}
              <p className="text-[11px] text-slate-500">Fecha: {formatDateTime(selectedFeedback.created_at)}</p>
            </div>
            <div className="p-4 border-t border-slate-200 bg-gray-50">
              <button onClick={() => setShowFeedbackModal(false)} className="w-full bg-[var(--color-accent)] text-white py-2.5 rounded-[9px] text-sm font-bold hover:brightness-90 transition">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ticket */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setShowTicketModal(false)}>
          <div className="bg-white rounded-[18px] shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between mb-3">
                <p className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FaReceipt className="text-[var(--color-accent)]" /> Ticket de Venta
                </p>
                <button onClick={() => setShowTicketModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><FaTimes /></button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <p><span className="font-semibold">Mesa:</span> {selectedTicket.sale.table_number}</p>
                  <p><span className="font-semibold">Cliente:</span> {selectedTicket.sale.customer_name || "Invitado"}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Fecha:</span> {formatDateTime(selectedTicket.sale.closed_at)}</p>
                  <p><span className="font-semibold">Total:</span> {formatCurrency(selectedTicket.sale.total_amount)}</p>
                </div>
              </div>
              <div className={`p-2.5 rounded-[9px] border text-xs flex items-center gap-2 font-semibold ${getPaymentMethodColor(selectedTicket.sale.payment_method)}`}>
                {getPaymentMethodIcon(selectedTicket.sale.payment_method)}
                Método de Pago: {getPaymentMethodText(selectedTicket.sale.payment_method)}
              </div>
            </div>

            <div className="p-5">
              <p className="text-xs font-semibold text-slate-700 mb-3">Productos:</p>
              <div className="space-y-2.5">
                {selectedTicket.items.map((item) => {
                  const cancelledQty = item.cancelled_quantity || 0;
                  const activeQuantity = item.quantity - cancelledQty;
                  const processedExtras = processExtrasFromNotes(item.notes);
                  if (activeQuantity === 0) return null;
                  return (
                    <div key={item.id}>
                      <div className="flex justify-between items-center p-3 border border-slate-200 rounded-[10px]">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-900">
                            {item.product_name}
                            {cancelledQty > 0 && (
                              <span className="text-red-600 font-normal ml-2">(de {item.quantity}, {cancelledQty} cancelada(s))</span>
                            )}
                          </p>
                          {item.notes && !processedExtras.hasExtras && (
                            <p className="text-[11px] text-slate-500 mt-0.5"><span className="font-semibold">Nota:</span> {item.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-600">{activeQuantity} × {formatCurrency(item.price)}</p>
                          <p className="text-xs font-bold text-emerald-600">{formatCurrency(item.price * activeQuantity)}</p>
                        </div>
                      </div>
                      {processedExtras.hasExtras && (
                        <div className="ml-3 mt-1.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-accent)] font-semibold">
                            <FaPlus className="text-[10px]" /> Extras incluidos:
                          </div>
                          {processedExtras.extrasList.map((extra, index) => (
                            <div key={index} className="flex justify-between items-center text-[11px] text-slate-500 ml-3">
                              <span>• {extra.name}</span>
                              <span className="text-emerald-600">{activeQuantity} × {formatCurrency(extra.price)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedTicket.sale.total_amount / 1.08)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>IVA (8%):</span>
                  <span>{formatCurrency((selectedTicket.sale.total_amount * 0.08) / 1.08)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 border-t border-slate-200 pt-2">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(selectedTicket.sale.total_amount)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-gray-50 rounded-b-[18px] flex gap-2.5">
              <button onClick={() => setShowTicketModal(false)} className="flex-1 py-2.5 rounded-[9px] border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition">
                Cerrar
              </button>
              <button onClick={() => generateTicketPDF(selectedTicket)} className="flex-1 bg-[var(--color-accent)] text-white py-2.5 rounded-[9px] text-sm font-bold hover:brightness-90 transition flex items-center justify-center gap-2">
                <FaReceipt /> Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
