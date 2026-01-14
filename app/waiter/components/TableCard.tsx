/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableWithOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import CustomerOrderSection from "./CustomerOrderSection";
import TableHeader from "./TableHeader";
import TableSummary from "./TableSummary";
import { useState, useEffect } from "react";
import { FaUtensils } from "react-icons/fa";
import { supabase } from "@/app/lib/supabase/client";

interface TableCardProps {
  table: TableWithOrder;
  processing: string | null;
  printing: string | null;
  onUpdateItemStatus: (itemId: string, newStatus: string) => void;
  onCancelItem: (itemId: string) => void;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  onPrintOrder: (
    tableId: number,
    printType: "all" | "kitchen" | "bar" | "ticket" | "final-ticket" // AGREGADO "final-ticket"
  ) => void;
  calculateTableTotal: (table: TableWithOrder) => number;
  notifications: WaiterNotification[];
  occupationTime?: string;
  hasNotifications?: boolean;
  isHighlighted?: boolean;
}

export default function TableCard({
  table,
  processing,
  printing,
  onUpdateItemStatus,
  onCancelItem,
  onCobrarMesa,
  onPrintOrder,
  calculateTableTotal,
  notifications,
  occupationTime,
  hasNotifications,
  isHighlighted = false,
}: TableCardProps) {
  const tableTotal = calculateTableTotal(table);
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [productCategories, setProductCategories] = useState<{
    // Para productos ORDENADOS (solo status "ordered")
    hasKitchenItems: boolean;
    hasColdBarItems: boolean;
    hasAnyItems: boolean;
    orderedItemsCount: number;
    orderedItemsTotal: number;

    // Para productos ACTIVOS (todos los no cancelados)
    hasAnyActiveItems: boolean;
    activeItemsCount: number;
    activeItemsTotal: number;
  }>({
    hasKitchenItems: false,
    hasColdBarItems: false,
    hasAnyItems: false,
    orderedItemsCount: 0,
    orderedItemsTotal: 0,

    hasAnyActiveItems: false,
    activeItemsCount: 0,
    activeItemsTotal: 0,
  });

  // Analizar los productos para determinar qué botones mostrar
  useEffect(() => {
    let hasKitchen = false;
    let hasColdBar = false;
    let hasAny = false;
    let orderedItemsCount = 0;
    let orderedItemsTotal = 0;

    // Nuevas variables para productos activos (todos los status excepto cancelled)
    let hasAnyActive = false;
    let activeItemsCount = 0;
    let activeItemsTotal = 0;

    // Función para determinar si una categoría es de cocina o barra
    const isColdBarCategory = (category: string): boolean => {
      const coldBarCategories = [
        "bebidas",
        "cerveza",
        "cerveza artesanal",
        "coquetos",
        "coquetos clásicos",
      ];
      return coldBarCategories.includes(category.trim().toLowerCase());
    };

    // Recolectar todos los product_ids únicos
    const productIdsForOrdered = new Set<number>(); // Solo "ordered"
    const productIdsForActive = new Set<number>(); // Todos los activos (excepto cancelled)

    table.orders.forEach((order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach((item: any) => {
          const cancelledQty = item.cancelled_quantity || 0;
          const activeQuantity = item.quantity - cancelledQty;
          const itemTotal = (item.price || 0) * activeQuantity;

          // PARA PRODUCTOS ACTIVOS (todos los status excepto cancelled)
          if (
            activeQuantity > 0 &&
            item.status !== "cancelled" && // <- Cualquier status excepto cancelled
            item.product_id
          ) {
            productIdsForActive.add(item.product_id);
            hasAnyActive = true;
            activeItemsCount += activeQuantity;
            activeItemsTotal += itemTotal;
          }

          // PARA PRODUCTOS ORDENADOS (solo status "ordered")
          if (
            activeQuantity > 0 &&
            item.status === "ordered" && // <- SOLO "ordered"
            item.product_id
          ) {
            productIdsForOrdered.add(item.product_id);
            hasAny = true;
            orderedItemsCount += activeQuantity;
            orderedItemsTotal += itemTotal;
          }
        });
      }
    });

    // Función para consultar categorías de productos
    const checkProductCategories = async (
      productIds: Set<number>,
      isForOrdered: boolean
    ) => {
      if (productIds.size === 0) return;

      try {
        const { data: products, error } = (await supabase
          .from("products")
          .select("id, category")
          .in("id", Array.from(productIds))) as {
          data: Array<{ id: number; category: string }> | null;
          error: any;
        };

        if (!error && products) {
          products.forEach((product) => {
            const isColdBar = isColdBarCategory(product.category || "");

            if (isForOrdered) {
              // Solo para productos "ordered"
              if (isColdBar) {
                hasColdBar = true;
              } else {
                hasKitchen = true;
              }
            }
            // Para productos activos no necesitamos diferenciar cocina/barra
          });
        }
      } catch (error) {
        console.error("Error verificando categorías:", error);
        // Si hay error, asumimos que hay ambos tipos para seguridad
        if (isForOrdered) {
          hasKitchen = true;
          hasColdBar = true;
        }
      }
    };

    // Consultar categorías para ambos conjuntos de productos
    const promises = [
      checkProductCategories(productIdsForOrdered, true), // Para ordered
      checkProductCategories(productIdsForActive, false), // Para active (sin diferenciar)
    ];

    Promise.all(promises).then(() => {
      setProductCategories({
        hasKitchenItems: hasKitchen,
        hasColdBarItems: hasColdBar,
        hasAnyItems: hasAny,
        orderedItemsCount,
        orderedItemsTotal,

        hasAnyActiveItems: hasAnyActive,
        activeItemsCount,
        activeItemsTotal,
      });
    });
  }, [table]);

  // Agrupar órdenes por cliente
  const groupOrdersByCustomer = (table: TableWithOrder) => {
    const customerMap = new Map();

    table.orders.forEach((order) => {
      const customerName = order.customer_name || "Cliente";

      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          customerName,
          orders: [],
          subtotal: 0,
          taxAmount: 0,
          total: 0,
          itemsCount: 0,
        });
      }

      const customerSummary = customerMap.get(customerName)!;
      customerSummary.orders.push(order);

      const orderSubtotal = order.order_items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      customerSummary.subtotal += orderSubtotal;
      customerSummary.itemsCount += order.order_items.length;
    });

    const taxRate = 0.16;
    customerMap.forEach((customerSummary) => {
      customerSummary.taxAmount = customerSummary.subtotal * taxRate;
      customerSummary.total =
        customerSummary.subtotal + customerSummary.taxAmount;
    });

    return Array.from(customerMap.values());
  };

  const customerSummaries = groupOrdersByCustomer(table);

  // Función para manejar impresión
  const handlePrint = (
    printType: "all" | "kitchen" | "bar" | "ticket" | "final-ticket"
  ) => {
    // Para ticket final (todos los productos activos)
    if (printType === "final-ticket") {
      if (!productCategories.hasAnyActiveItems) {
        alert("No hay productos activos para generar el ticket final");
        return;
      }
      onPrintOrder(table.id, "final-ticket");
      setShowPrintOptions(false);
      return;
    }

    // Para los otros tipos (solo productos "ordered")
    if (!productCategories.hasAnyItems) {
      alert("No hay productos ordenados para imprimir en esta mesa");
      return;
    }

    // Validar si hay productos del tipo solicitado
    if (printType === "kitchen" && !productCategories.hasKitchenItems) {
      alert("No hay productos de cocina ordenados para imprimir");
      return;
    }

    if (printType === "bar" && !productCategories.hasColdBarItems) {
      alert("No hay productos de barra fría ordenados para imprimir");
      return;
    }

    if (printType === "ticket" && !productCategories.hasAnyItems) {
      alert("No hay productos ordenados para generar el ticket");
      return;
    }

    onPrintOrder(table.id, printType);
    setShowPrintOptions(false);
  };

  // Función para verificar si se está imprimiendo
  const isPrinting = (printType: string) => {
    return printing === `print-${table.id}-${printType}`;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-4 transition-all duration-300 hover:shadow-xl ${
        isHighlighted
          ? "border-2 border-red-500"
          : table.status === "occupied"
          ? "border-l-4 border-l-green-500"
          : table.status === "reserved"
          ? "border-l-4 border-l-yellow-500"
          : "border-l-4 border-l-gray-300"
      }`}
    >
      {/* Información adicional de tiempo de ocupación */}
      {occupationTime && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800 font-medium">
              Tiempo de ocupación:
            </span>
            <span
              className={`font-bold ${
                occupationTime.includes("h")
                  ? "text-red-600"
                  : occupationTime.includes("min") &&
                    parseInt(occupationTime) > 30
                  ? "text-orange-600"
                  : "text-green-600"
              }`}
            >
              {occupationTime}
            </span>
          </div>
        </div>
      )}

      <TableHeader
        table={table}
        tableTotal={tableTotal}
        processing={processing}
        onCobrarMesa={onCobrarMesa}
        notifications={notifications}
        hasNotifications={hasNotifications}
        isHighlighted={isHighlighted}
      />

      {customerSummaries.map((customerSummary) => (
        <CustomerOrderSection
          key={customerSummary.customerName}
          customerSummary={customerSummary}
          processing={processing}
          onUpdateItemStatus={onUpdateItemStatus}
          onCancelItem={onCancelItem}
        />
      ))}

      {/* SECCIÓN DE IMPRESIÓN PRINCIPAL */}
      {table.status === "occupied" && (
        <div className="mt-4 pt-4">
          <div className="flex flex-col gap-3">
            {/* SECCIÓN 1: IMPRIMIR PRODUCTOS ORDENADOS (STATUS "ordered") */}
            {productCategories.hasAnyItems && (
              <>
                <div className="mb-1">
                  {/* <h4 className="text-xs font-semibold text-gray-700 mb-2">
                    📋 Productos Ordenados (para cocina/barra)
                  </h4> */}

                  {/* Indicadores de productos ordenados listos para imprimir */}
                  {/* <div className="text-xs text-gray-600 mb-2 flex flex-wrap gap-2">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {productCategories.orderedItemsCount} producto(s)
                      ordenado(s)
                    </span>

                    {productCategories.hasKitchenItems && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        🍽️ Comida para cocina
                      </span>
                    )}
                    {productCategories.hasColdBarItems && (
                      <span className="bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                        🥤 Bebidas para barra
                      </span>
                    )}
                  </div> */}

                  {/* Botones de impresión para productos ordenados */}
                  <div className="flex gap-2">
                    {/* Botón Cocina */}
                    {productCategories.hasKitchenItems && (
                      <button
                        onClick={() => handlePrint("kitchen")}
                        disabled={isPrinting("kitchen")}
                        className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                        title="Imprimir solo cocina (productos ordenados)"
                      >
                        {isPrinting("kitchen") ? (
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <>
                            <span>👨‍🍳</span>
                            <span className="hidden sm:inline">Cocina</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Botón Barra Fría */}
                    {productCategories.hasColdBarItems && (
                      <button
                        onClick={() => handlePrint("bar")}
                        disabled={isPrinting("bar")}
                        className="flex-1 px-3 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                        title="Imprimir solo barra fría (productos ordenados)"
                      >
                        {isPrinting("bar") ? (
                          <svg
                            className="animate-spin h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <>
                            <span>🥤</span>
                            <span className="hidden sm:inline">Barra</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Botón Ticket (productos ordenados) */}
                    {/* <button
                      onClick={() => handlePrint("ticket")}
                      disabled={isPrinting("ticket")}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 text-sm flex items-center justify-center gap-1"
                      title="Imprimir ticket (solo productos ordenados)"
                    >
                      {isPrinting("ticket") ? (
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <>
                          <span>🧾</span>
                          <span className="hidden sm:inline">Ticket</span>
                        </>
                      )}
                    </button> */}
                  </div>

                  {/* Botón Imprimir Todo (solo productos ordenados) */}
                  {/* {productCategories.hasKitchenItems &&
                    productCategories.hasColdBarItems && (
                      <button
                        onClick={() => handlePrint("all")}
                        disabled={isPrinting("all")}
                        className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm flex items-center justify-center gap-1 mt-2"
                        title="Imprimir todos los tickets (solo productos ordenados)"
                      >
                        {isPrinting("all") ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span>Generando todos los tickets...</span>
                          </>
                        ) : (
                          <>
                            <span>🖨️</span>
                            <span>Imprimir Todo (Cocina + Barra + Ticket)</span>
                          </>
                        )}
                      </button>
                    )} */}
                </div>
              </>
            )}

            {/* SECCIÓN 2: IMPRIMIR TICKET FINAL COMPLETO (TODOS LOS PRODUCTOS ACTIVOS) */}
            {productCategories.hasAnyActiveItems && (
              <div className="mt-2 pt-3 border-t border-gray-300">
                {/* Botón para imprimir Ticket Final Completo */}
                <button
                  onClick={() => handlePrint("final-ticket")}
                  disabled={isPrinting("final-ticket")}
                  className="w-full px-3 py-3 bg-blue-500 text-white rounded-xl disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 shadow-md"
                  title="Imprimir ticket final completo (todos los productos activos, sin importar status)"
                >
                  {isPrinting("final-ticket") ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Generando Ticket Final...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">🧾</span>
                      <span>Imprimir Ticket</span>
                      {/* <span className="text-xs bg-white/30 px-2 py-1 rounded-full">
                        ${productCategories.activeItemsTotal.toFixed(2)}
                      </span> */}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Mensaje cuando no hay productos activos */}
            {table.status === "occupied" &&
              !productCategories.hasAnyItems &&
              !productCategories.hasAnyActiveItems &&
              table.orders.some(
                (order) => order.order_items && order.order_items.length > 0
              ) && (
                <div className="text-xs text-gray-500 italic text-center py-3 bg-gray-50 rounded">
                  ℹ️ No hay productos activos en esta mesa. Todos los productos
                  pueden estar cancelados o ya cobrados.
                </div>
              )}
          </div>
        </div>
      )}

      {tableTotal > 0 && (
        <TableSummary
          tableTotal={
            productCategories.activeItemsTotal.toFixed(2) as unknown as number
          }
          customerCount={customerSummaries.length}
          orderCount={table.orders.length}
          isHighlighted={isHighlighted}
        />
      )}

      {table.orders.length === 0 && table.status === "occupied" && (
        <EmptyTableState />
      )}
    </div>
  );
}

function EmptyTableState() {
  return (
    <div className="text-center py-6 text-gray-500 text-sm">
      <FaUtensils className="text-2xl text-gray-300 mx-auto mb-2" />
      No hay pedidos enviados
    </div>
  );
}
