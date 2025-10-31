"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ordersService } from "@/app/lib/supabase/orders";
import {
  FaUser,
  FaArrowLeft,
  FaUtensils,
  FaShoppingCart,
  FaSpinner,
  FaUsers,
} from "react-icons/fa";

interface TableUser {
  id: string;
  name: string;
  orderId: string;
  orderItemsCount?: number;
  orderTotal?: number;
}

export default function SelectUserPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tableId = searchParams.get("table");

  const [users, setUsers] = useState<TableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  useEffect(() => {
    if (tableId) {
      loadTableUsers(parseInt(tableId));
    } else {
      setError("No se encontró la mesa");
      setLoading(false);
    }
  }, [tableId]);

  const loadTableUsers = async (tableId: number) => {
    try {
      setLoading(true);

      // 1. Intentar cargar usuarios desde sessionStorage
      const storedUsers = sessionStorage.getItem(`table_${tableId}_users`);

      if (storedUsers) {
        const usersData: TableUser[] = JSON.parse(storedUsers);

        // 2. Enriquecer con información actual de las órdenes
        const enrichedUsers = await Promise.all(
          usersData.map(async (user) => {
            try {
              const orderItems = await ordersService.getOrderItems(
                user.orderId
              );
              const total = orderItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
              );

              return {
                ...user,
                orderItemsCount: orderItems.reduce(
                  (count, item) => count + item.quantity,
                  0
                ),
                orderTotal: total,
              };
            } catch (error) {
              console.error(
                `Error loading order for user ${user.name}:`,
                error
              );
              return { ...user, orderItemsCount: 0, orderTotal: 0 };
            }
          })
        );

        setUsers(enrichedUsers);
      } else {
        // 3. Si no hay usuarios en sessionStorage, buscar órdenes activas de la mesa
        const activeOrders = await ordersService.getActiveOrdersByTable(
          tableId
        );
        const usersFromOrders: TableUser[] = activeOrders.map((order) => ({
          id: order.id, // Usamos el orderId como ID temporal
          name: order.customer_name,
          orderId: order.id,
          orderItemsCount: 0, // Lo cargaremos después
          orderTotal: order.total_amount,
        }));

        // Enriquecer con items count
        const enrichedUsers = await Promise.all(
          usersFromOrders.map(async (user) => {
            try {
              const orderItems = await ordersService.getOrderItems(
                user.orderId
              );
              return {
                ...user,
                orderItemsCount: orderItems.reduce(
                  (count, item) => count + item.quantity,
                  0
                ),
              };
            } catch (error) {
              return { ...user, orderItemsCount: 0 };
            }
          })
        );

        setUsers(enrichedUsers);

        // Guardar en sessionStorage para futuras visitas
        sessionStorage.setItem(
          `table_${tableId}_users`,
          JSON.stringify(usersFromOrders)
        );
      }
    } catch (err) {
      console.error("Error loading table users:", err);
      setError("Error al cargar los usuarios de la mesa");
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (user: TableUser) => {
    setLoadingUser(user.id);
    try {
      // Verificar que la orden todavía existe
      const order = await ordersService.getOrder(user.orderId);
      if (!order) {
        throw new Error("La orden no existe");
      }

      // Redirigir al menú con los parámetros del usuario
      router.push(
        `/customer/menu?table=${tableId}&user=${user.id}&order=${user.orderId}`
      );
    } catch (error) {
      console.error("Error selecting user:", error);
      setError("Error al acceder al menú del usuario");
      setLoadingUser(null);
    }
  };

  const handleAddNewUser = async () => {
    const userName = prompt("Ingresa el nombre del nuevo comensal:");
    if (!userName?.trim()) return;

    if (!tableId) {
      setError("No se encontró la mesa");
      return;
    }

    try {
      setLoadingUser("new");

      // Crear nueva orden para el nuevo usuario
      const newOrder = await ordersService.createOrder(
        parseInt(tableId),
        userName.trim()
      );

      // Crear nuevo objeto de usuario
      const newUser: TableUser = {
        id: newOrder.id, // Usamos el orderId como ID
        name: userName.trim(),
        orderId: newOrder.id,
        orderItemsCount: 0,
        orderTotal: 0,
      };

      // Actualizar la lista de usuarios
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);

      // Actualizar sessionStorage
      sessionStorage.setItem(
        `table_${tableId}_users`,
        JSON.stringify(
          updatedUsers.map((u) => ({
            id: u.id,
            name: u.name,
            orderId: u.orderId,
          }))
        )
      );

      // Redirigir al menú del nuevo usuario
      router.push(
        `/customer/menu?table=${tableId}&user=${newUser.id}&order=${newUser.orderId}`
      );
    } catch (error) {
      console.error("Error adding new user:", error);
      setError("Error al agregar nuevo comensal");
      setLoadingUser(null);
    }
  };

  const handleBack = () => {
    router.push("/customer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <FaSpinner className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Cargando...
            </h2>
            <p className="text-gray-600">Buscando comensales en la mesa</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Selecciona tu perfil
            </h1>
            <p className="text-gray-600">Mesa {tableId}</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Lista de usuarios */}
        <div className="space-y-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FaUsers className="text-blue-600" />
            Comensales en esta mesa ({users.length})
          </h2>

          {users.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
              <FaUser className="text-4xl text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No hay comensales en esta mesa</p>
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                disabled={loadingUser !== null}
                className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all duration-300 text-left group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                      <FaUser className="text-blue-600 text-xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {user.name}
                      </h3>
                      {/* <div className="flex items-center gap-4 text-sm text-gray-500">
                        {user.orderItemsCount && user.orderItemsCount > 0 ? (
                          <>
                            <span className="flex items-center gap-1">
                              <FaShoppingCart className="text-xs" />
                              {user.orderItemsCount} items
                            </span>
                            <span className="flex items-center gap-1">
                              <FaUtensils className="text-xs" />$
                              {user.orderTotal?.toFixed(2) || "0.00"}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">Sin pedidos aún</span>
                        )}
                      </div> */}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {loadingUser === user.id ? (
                      <FaSpinner className="animate-spin text-blue-600" />
                    ) : (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                    <span className="text-gray-400 group-hover:text-blue-600 transition">
                      →
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Agregar nuevo usuario */}
        {/* <button
          onClick={handleAddNewUser}
          disabled={loadingUser !== null}
          className="w-full p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-center gap-3">
            {loadingUser === "new" ? (
              <FaSpinner className="animate-spin text-green-600" />
            ) : (
              <>
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                  <FaUser className="text-green-600" />
                </div>
                <span className="text-lg font-semibold text-green-600">
                  Agregar nuevo comensal
                </span>
              </>
            )}
          </div>
        </button> */}

        {/* Información */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡 Cada comensal tiene su propio menú y carrito independiente
          </p>
        </div>
      </div>
    </div>
  );
}
