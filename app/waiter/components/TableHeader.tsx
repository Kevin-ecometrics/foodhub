/* eslint-disable @typescript-eslint/no-explicit-any */
import { TableWithOrder, WaiterNotification } from "@/app/lib/supabase/waiter";
import { supabase } from "@/app/lib/supabase/client";
import {
  FaDollarSign,
  FaSpinner,
  FaReceipt,
  FaQuestion,
  FaPlus,
  FaUtensils,
  FaClock,
} from "react-icons/fa";
import { useState, useEffect } from "react";

interface TableHeaderProps {
  table: TableWithOrder;
  tableTotal: number;
  processing: string | null;
  onCobrarMesa: (tableId: number, tableNumber: number) => void;
  notifications: WaiterNotification[];
  onOrderAdded?: () => void;
  // Nuevas props para el filtro FCFS
  hasNotifications?: boolean;
  isHighlighted?: boolean;
  occupationTime?: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  preparation_time: number | null;
  is_available: boolean;
  is_favorite: boolean;
  rating: number;
  rating_count: number;
  extras?: never[];
}

export default function TableHeader({
  table,
  tableTotal,
  processing,
  onCobrarMesa,
  notifications = [],
  onOrderAdded,
  hasNotifications = false,
  isHighlighted = false,
  occupationTime,
}: TableHeaderProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: number]: number;
  }>({});
  const [addingOrder, setAddingOrder] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar productos cuando se abre el modal
  useEffect(() => {
    if (showAddModal) {
      loadProducts();
    }
  }, [showAddModal]);

  const loadProducts = async () => {
    setProductsLoading(true);
    setError(null);
    try {
      // Cargar productos directamente desde Supabase
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_available", true)
        .order("name", { ascending: true });

      if (error) {
        throw new Error(`Error cargando productos: ${error.message}`);
      }

      setProducts(data || []);
    } catch (error) {
      console.error("Error loading products:", error);
      setError("Error cargando los productos");
    } finally {
      setProductsLoading(false);
    }
  };

  const calculateTotalItems = (table: TableWithOrder) => {
    return table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.reduce(
          (sum: number, item: any) => sum + item.quantity,
          0
        ),
      0
    );
  };

  const calculateItemsByStatus = (table: TableWithOrder) => {
    const pending = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter(
          (item: any) =>
            item.status === "ordered" || item.status === "preparing"
        ).length,
      0
    );

    const ready = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter((item: any) => item.status === "ready").length,
      0
    );

    const served = table.orders.reduce(
      (total, order) =>
        total +
        order.order_items.filter((item: any) => item.status === "served")
          .length,
      0
    );

    return { pending, ready, served };
  };

  // Obtener notificaciones de "Solicita la cuenta" para esta mesa
  const billRequestNotifications = notifications.filter(
    (notification: any) =>
      notification.table_id === table.id && notification.type === "bill_request"
  );

  // Obtener la notificación más reciente de cuenta
  const latestBillRequest =
    billRequestNotifications.length > 0
      ? billRequestNotifications[billRequestNotifications.length - 1]
      : null;

  const getPaymentMethodInfo = (paymentMethod: string | null) => {
    if (paymentMethod === "cash") {
      return {
        text: "EFECTIVO",
        icon: FaDollarSign,
        bgColor: "bg-green-100",
        textColor: "text-green-800",
        borderColor: "border-green-300",
      };
    } else if (paymentMethod === "terminal") {
      return {
        text: "TARJETA",
        icon: FaReceipt,
        bgColor: "bg-blue-100",
        textColor: "text-blue-800",
        borderColor: "border-blue-300",
      };
    } else {
      return {
        text: "PENDIENTE",
        icon: FaQuestion,
        bgColor: "bg-gray-100",
        textColor: "text-gray-800",
        borderColor: "border-gray-300",
      };
    }
  };

  // Funciones para el modal de agregar productos
  const handleAddClick = () => {
    setShowAddModal(true);
  };

  const handleProductQuantityChange = (productId: number, quantity: number) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleConfirmAddOrder = async () => {
    setAddingOrder(true);
    setError(null);

    try {
      // Preparar los items seleccionados
      const selectedItems = Object.entries(selectedProducts)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = products.find((p) => p.id === parseInt(productId));
          if (!product) {
            throw new Error(`Producto con ID ${productId} no encontrado`);
          }
          return {
            product_id: product.id,
            product_name: product.name,
            price: product.price,
            quantity: quantity,
            notes: "Agregado por el mesero",
          };
        });

      if (selectedItems.length === 0) {
        setError("Por favor selecciona al menos un producto");
        return;
      }

      // CALCULAR EL TOTAL
      const orderTotal = selectedItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // CREAR LA ORDEN EN LA TABLA ORDERS
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            table_id: table.id,
            customer_name: `Mesero ${table.number}`,
            status: "sent",
            total_amount: orderTotal,
          },
        ] as any)
        .select()
        .single();

      if (orderError) {
        console.error("Error creando orden:", orderError);
        throw new Error(`Error creando orden: ${orderError.message}`);
      }

      // PREPARAR LOS ITEMS PARA ORDER_ITEMS
      const orderItemsData = selectedItems.map((item) => ({
        order_id: (order as any).id,
        product_id: item.product_id,
        product_name: item.product_name,
        price: item.price,
        quantity: item.quantity,
        notes: item.notes,
        status: "ordered" as const,
        cancelled_quantity: 0,
      }));

      // CREAR LOS ITEMS EN LA TABLA ORDER_ITEMS
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData as any)
        .select();

      if (itemsError) {
        console.error("Error creando order_items:", itemsError);

        // Si falla la creación de items, eliminar la orden creada
        await supabase
          .from("orders")
          .delete()
          .eq("id", (order as any).id);

        throw new Error(`Error creando items: ${itemsError.message}`);
      }

      // ÉXITO - Cerrar modal y limpiar
      setShowAddModal(false);
      setSelectedProducts({});

      // Notificar al componente padre para refrescar los datos
      if (onOrderAdded) {
        onOrderAdded();
      }

      // Mostrar mensaje de éxito
      alert(
        `✅ ${selectedItems.length} producto(s) agregado(s) a la mesa ${table.number}`
      );
    } catch (error) {
      console.error("Error completo adding order:", error);
      setError(
        `Error: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    } finally {
      setAddingOrder(false);
    }
  };

  const getTotalItems = () => {
    return Object.values(selectedProducts).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalAmount = () => {
    return Object.entries(selectedProducts).reduce(
      (sum, [productId, quantity]) => {
        const product = products.find((p) => p.id === parseInt(productId));
        return sum + (product?.price || 0) * quantity;
      },
      0
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const totalItems = calculateTotalItems(table);
  const statusCounts = calculateItemsByStatus(table);

  // Determinar color según tiempo de ocupación
  const getTimeColor = () => {
    if (!occupationTime) return "text-gray-600";

    if (occupationTime.includes("h")) {
      return "text-red-600";
    } else if (
      occupationTime.includes("min") &&
      parseInt(occupationTime) > 30
    ) {
      return "text-orange-600";
    }
    return "text-green-600";
  };

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {/* Línea superior con información principal */}
          <div className="flex items-center gap-2 mb-2">
            <h3
              className={`text-lg font-bold ${
                isHighlighted ? "text-red-700" : "text-gray-800"
              }`}
            >
              Mesa {table.number}
            </h3>
          </div>

          {/* Información de tiempo de ocupación */}
          {occupationTime && (
            <div className="flex items-center gap-1 mb-2 text-sm">
              <FaClock className={`${getTimeColor()}`} size={12} />
              <span className={`font-medium ${getTimeColor()}`}>
                {occupationTime}
              </span>
              <span className="text-gray-500 mx-1">•</span>
              <span className="text-gray-500 text-xs">
                Ocupada desde:{" "}
                {table.orders.length > 0
                  ? new Date(table.orders[0].created_at).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "Sin registro"}
              </span>
            </div>
          )}

          {/* Badges de estado */}
          <div className="flex flex-wrap gap-1 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded ${
                table.status === "occupied"
                  ? "bg-green-100 text-green-800"
                  : table.status === "reserved"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {table.status === "occupied"
                ? "Ocupada"
                : table.status === "reserved"
                ? "Reservada"
                : "Disponible"}
            </span>

            {/* NOTIFICACIÓN DE CUENTA CON MÉTODO DE PAGO */}
            {latestBillRequest && (
              <span
                className={`text-xs px-2 py-1 rounded border ${
                  getPaymentMethodInfo(latestBillRequest.payment_method).bgColor
                } ${
                  getPaymentMethodInfo(latestBillRequest.payment_method)
                    .textColor
                } ${
                  getPaymentMethodInfo(latestBillRequest.payment_method)
                    .borderColor
                } flex items-center gap-1`}
              >
                {(() => {
                  const IconComponent = getPaymentMethodInfo(
                    latestBillRequest.payment_method
                  ).icon;
                  return <IconComponent className="text-xs" />;
                })()}
                {getPaymentMethodInfo(latestBillRequest.payment_method).text}
              </span>
            )}

            {/* Items servidos */}
            {totalItems > 0 && statusCounts.served > 0 && (
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                {statusCounts.served} servido
                {statusCounts.served > 1 ? "s" : ""}
              </span>
            )}

            {/* Items listos */}
            {statusCounts.ready > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                {statusCounts.ready} listo{statusCounts.ready > 1 ? "s" : ""}
              </span>
            )}

            {/* Items pendientes */}
            {statusCounts.pending > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                {statusCounts.pending} pendiente
                {statusCounts.pending > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Información adicional de ubicación */}
          <p className="text-sm text-gray-500">
            {table.location} • {table.capacity} personas
          </p>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-2 ml-2">
          {/* BOTÓN DE AGREGAR */}
          {(table.status === "occupied" || table.status === "reserved") && (
            <button
              onClick={handleAddClick}
              className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 whitespace-nowrap flex items-center gap-1"
              title="Agregar productos a la mesa"
            >
              <FaPlus className="text-xs" />
              Agregar
            </button>
          )}

          {/* BOTÓN DE COBRAR - SOLO APARECE CUANDO HAY SOLICITUD DE CUENTA */}
          {latestBillRequest && latestBillRequest.type === "bill_request" && (
            <button
              onClick={() => onCobrarMesa(table.id, table.number)}
              disabled={processing === `cobrar-${table.id}`}
              className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600 disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
            >
              {processing === `cobrar-${table.id}` ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <>
                  <FaDollarSign />
                  Cobrar
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MODAL PARA AGREGAR PRODUCTOS (sin cambios) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaUtensils className="text-green-600 text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Agregar Productos - Mesa {table.number}
                </h3>
                <p className="text-sm text-gray-600">
                  Selecciona los productos que deseas agregar a la orden
                </p>
              </div>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Lista de productos */}
            <div className="flex-1 overflow-y-auto pr-2">
              {productsLoading ? (
                <div className="text-center py-8">
                  <FaSpinner className="animate-spin text-2xl text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Cargando productos...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">
                                {product.name}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {product.description}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-green-600 font-semibold">
                                  {formatCurrency(product.price)}
                                </span>
                                {product.preparation_time && (
                                  <span className="text-xs text-gray-500">
                                    • {product.preparation_time} min
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() =>
                              handleProductQuantityChange(
                                product.id,
                                Math.max(
                                  0,
                                  (selectedProducts[product.id] || 0) - 1
                                )
                              )
                            }
                            disabled={(selectedProducts[product.id] || 0) <= 0}
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-gray-300"
                          >
                            -
                          </button>

                          <span className="w-8 text-center font-semibold">
                            {selectedProducts[product.id] || 0}
                          </span>

                          <button
                            onClick={() =>
                              handleProductQuantityChange(
                                product.id,
                                (selectedProducts[product.id] || 0) + 1
                              )
                            }
                            className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Resumen y acciones */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    Total de items: <strong>{getTotalItems()}</strong>
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    Total: {formatCurrency(getTotalAmount())}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedProducts({});
                      setError(null);
                    }}
                    disabled={addingOrder}
                    className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmAddOrder}
                    disabled={addingOrder || getTotalItems() === 0}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {addingOrder ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaPlus />
                    )}
                    {addingOrder
                      ? "Agregando..."
                      : `Agregar a Mesa ${table.number}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
