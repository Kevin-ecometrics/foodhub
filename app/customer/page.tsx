"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tablesService, Table } from "@/app/lib/supabase/tables";
import { Order, ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import {
  FaChair,
  FaSpinner,
  FaCheck,
  FaQrcode,
  FaExclamationTriangle,
  FaUserPlus,
  FaUser,
  FaTimes,
} from "react-icons/fa";

interface Guest {
  id: string;
  name: string;
}

export default function HomePage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFromQR, setIsFromQR] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [nameError, setNameError] = useState("");
  const [withGuests, setWithGuests] = useState<boolean>(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuestName, setNewGuestName] = useState("");

  // Cargar mesas al iniciar y verificar parámetros de URL
  useEffect(() => {
    loadAllTables();
    checkURLParams();
  }, []);

  const loadAllTables = async () => {
    setLoadingTables(true);
    try {
      const tablesData = await tablesService.getTablesByBranch();
      setTables(tablesData);
    } catch (err) {
      setError("Error cargando mesas");
      console.error(err);
    } finally {
      setLoadingTables(false);
    }
  };

  const checkURLParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromQR = urlParams.get("table");
    const redirected = urlParams.get("redirected");

    if (tableFromQR) {
      const tableNumber = parseInt(tableFromQR);
      if (!isNaN(tableNumber)) {
        setIsFromQR(true);
        setSelectedTable(tableNumber);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }

    if (redirected) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      setTimeout(() => {
        alert("👋 ¡Gracias por su visita! Esperamos verlo pronto.");
      }, 500);
    }
  };

  const addGuest = () => {
    if (!newGuestName.trim()) {
      alert("Por favor ingresa un nombre para el invitado");
      return;
    }

    if (newGuestName.trim().length < 2) {
      alert("El nombre del invitado debe tener al menos 2 caracteres");
      return;
    }

    const newGuest: Guest = {
      id: Date.now().toString(),
      name: newGuestName.trim(),
    };

    setGuests([...guests, newGuest]);
    setNewGuestName("");
  };

  const removeGuest = (id: string) => {
    setGuests(guests.filter((guest) => guest.id !== id));
  };

  const validateForm = () => {
    if (!selectedTable) {
      setError("Por favor selecciona una mesa");
      return false;
    }

    const table = tables.find((t) => t.number === selectedTable);
    if (!table) {
      setError("Mesa no encontrada");
      return false;
    }

    if (table.status !== "available") {
      setError("Esta mesa no está disponible");
      return false;
    }

    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setNameError("El nombre es obligatorio");
      return false;
    }

    if (trimmedName.length < 2) {
      setNameError("El nombre debe tener al menos 2 caracteres");
      return false;
    }

    if (withGuests) {
      if (guests.length === 0) {
        setError("Debes agregar al menos un invitado");
        return false;
      }

      // Validar nombres de invitados
      for (const guest of guests) {
        if (guest.name.length < 2) {
          setError(`El nombre del invitado "${guest.name}" es muy corto`);
          return false;
        }
      }
    }

    setError("");
    setNameError("");
    return true;
  };

  const handleTableSelect = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const table = tables.find((t) => t.number === selectedTable);
      if (!table) {
        setError("Mesa no encontrada");
        return;
      }

      // 1. Crear orden principal para el cliente principal
      const mainOrder = await ordersService.createOrder(
        table.id,
        customerName.trim()
      );

      // 2. Crear órdenes para los invitados si existen
      const guestOrders: Order[] = [];
      if (withGuests && guests.length > 0) {
        for (const guest of guests) {
          const guestOrder = await ordersService.createOrder(
            table.id,
            guest.name
          );
          guestOrders.push(guestOrder);
        }
      }

      // 3. Actualizar estado de la mesa a "occupied"
      await tablesService.updateTableStatus(table.id, "occupied");

      // 4. Notificar al mesero
      await notificationsService.createNotification(
        table.id,
        "new_order",
        `Nuevos clientes en Mesa ${table.number} - ${customerName.trim()}${
          guests.length > 0 ? ` + ${guests.length} invitados` : ""
        }`,
        mainOrder.id
      );

      // 5. Redirigir a selección de usuario
      const usersData = [
        {
          id: "main",
          name: customerName.trim(),
          orderId: mainOrder.id,
        },
        ...guests.map((guest) => ({
          id: guest.id,
          name: guest.name,
          orderId:
            guestOrders.find((g) => g.customer_name === guest.name)?.id || "",
        })),
      ];

      // Guardar en sessionStorage para usar en select-user
      sessionStorage.setItem(
        `table_${table.id}_users`,
        JSON.stringify(usersData)
      );

      router.push(`/customer/select-user?table=${table.id}`);
    } catch (err) {
      setError("Error al crear las órdenes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTableStatusColor = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "occupied":
        return "bg-red-500";
      case "disabled":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTableStatusText = (status: Table["status"]) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Ocupada";
      case "disabled":
        return "Deshabilitado";
      default:
        return status;
    }
  };

  // Encontrar la mesa seleccionada para mostrar su estado
  const selectedTableData = tables.find((t) => t.number === selectedTable);

  // Si es desde QR, mostrar solo el formulario de nombre sin selección de mesa
  if (isFromQR && selectedTable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaQrcode className="text-3xl text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bienvenido a FoodHub
            </h1>
            <p className="text-gray-600">Ingresa tu nombre para comenzar</p>
          </div>

          {/* Información de mesa QR */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800">
                  Mesa {selectedTable}
                </h3>
                <p className="text-sm text-blue-600">
                  Escaneaste el código QR de la mesa {selectedTable}
                </p>
                {selectedTableData && (
                  <p
                    className={`text-sm font-medium mt-1 ${
                      selectedTableData.status === "available"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    Estado: {getTableStatusText(selectedTableData.status)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Mostrar error general */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <FaExclamationTriangle />
              {error}
            </div>
          )}

          {/* Nombre obligatorio del cliente */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tu nombre *
            </label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                if (nameError && e.target.value.trim().length >= 2) {
                  setNameError("");
                }
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                nameError ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
            />
            {nameError && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <FaExclamationTriangle className="text-xs" />
                {nameError}
              </p>
            )}
          </div>

          {/* Opción de invitados */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Vienes con invitados?
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setWithGuests(false)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${
                  !withGuests
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                Solo
              </button>
              <button
                onClick={() => setWithGuests(true)}
                className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${
                  withGuests
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                }`}
              >
                Con Invitados
              </button>
            </div>
          </div>

          {/* Formulario para agregar invitados */}
          {withGuests && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-700">Invitados</h3>
                <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                  {guests.length} agregados
                </span>
              </div>

              {/* Lista de invitados */}
              {guests.length > 0 && (
                <div className="mb-4 space-y-2">
                  {guests.map((guest) => (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between bg-white p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400" />
                        <span>{guest.name}</span>
                      </div>
                      <button
                        onClick={() => removeGuest(guest.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar nuevo invitado */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre del invitado"
                  value={newGuestName}
                  onChange={(e) => setNewGuestName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addGuest();
                    }
                  }}
                />
                <button
                  onClick={addGuest}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <FaUserPlus className="text-sm" />
                  Agregar
                </button>
              </div>
            </div>
          )}

          {/* Botón de continuar */}
          <button
            onClick={handleTableSelect}
            disabled={
              loading ||
              !customerName.trim() ||
              (selectedTableData && selectedTableData.status !== "available") ||
              (withGuests && guests.length === 0)
            }
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
              ${
                customerName.trim() &&
                !loading &&
                selectedTableData?.status === "available" &&
                (!withGuests || guests.length > 0)
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Creando órdenes...
              </>
            ) : customerName.trim() ? (
              selectedTableData?.status === "available" ? (
                withGuests && guests.length === 0 ? (
                  "Agrega al menos un invitado"
                ) : (
                  <>
                    <FaCheck />
                    {withGuests
                      ? `Continuar con ${guests.length + 1} personas`
                      : "Continuar al Menú"}
                  </>
                )
              ) : (
                `Mesa ${selectedTable} no disponible`
              )
            ) : (
              "Ingresa tu nombre"
            )}
          </button>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-700 text-center">
              💡{" "}
              {withGuests
                ? "Cada persona tendrá su propio menú y orden"
                : "Podrás agregar más personas después"}
            </p>
            <p className="text-xs text-blue-600 text-center mt-2">
              * Campo obligatorio: Nombre
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Vista normal (no desde QR)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaChair className="text-3xl text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido a FoodHub
          </h1>
          <p className="text-gray-600">Selecciona tu mesa para comenzar</p>
        </div>

        {/* Mostrar error general */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <FaExclamationTriangle />
            {error}
          </div>
        )}

        {/* Selección de mesa */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Número de Mesa *
            </label>
            {loadingTables && (
              <span className="text-sm text-blue-600 flex items-center gap-1">
                <FaSpinner className="animate-spin" />
                Cargando mesas...
              </span>
            )}
          </div>

          {tables.length === 0 && !loadingTables ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
              <FaChair className="text-4xl text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No hay mesas disponibles</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-3">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => {
                      setSelectedTable(table.number);
                      setError("");
                    }}
                    disabled={table.status !== "available"}
                    className={`
                      relative w-12 h-12 rounded-xl border-2 font-semibold transition-all
                      ${
                        selectedTable === table.number
                          ? "border-blue-600 bg-blue-600 text-white scale-110"
                          : table.status === "available"
                          ? "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                          : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      }
                    `}
                  >
                    {table.number}
                    <div
                      className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getTableStatusColor(
                        table.status
                      )}`}
                      title={getTableStatusText(table.status)}
                    />
                  </button>
                ))}
              </div>

              {/* Leyenda de estados */}
              <div className="flex justify-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Ocupada</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span>Deshabilitado</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Nombre obligatorio del cliente */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu nombre *
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (nameError && e.target.value.trim().length >= 2) {
                setNameError("");
              }
            }}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
              nameError ? "border-red-500 bg-red-50" : "border-gray-300"
            }`}
          />
          {nameError && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <FaExclamationTriangle className="text-xs" />
              {nameError}
            </p>
          )}
        </div>

        {/* Opción de invitados */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ¿Vienes con invitados?
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setWithGuests(false)}
              className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${
                !withGuests
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              Solo
            </button>
            <button
              onClick={() => setWithGuests(true)}
              className={`flex-1 py-3 rounded-xl border-2 font-medium transition ${
                withGuests
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
              }`}
            >
              Con Invitados
            </button>
          </div>
        </div>

        {/* Formulario para agregar invitados */}
        {withGuests && (
          <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Invitados</h3>
              <span className="text-sm text-gray-500 bg-white px-2 py-1 rounded">
                {guests.length} agregados
              </span>
            </div>

            {/* Lista de invitados */}
            {guests.length > 0 && (
              <div className="mb-4 space-y-2">
                {guests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      <FaUser className="text-gray-400" />
                      <span>{guest.name}</span>
                    </div>
                    <button
                      onClick={() => removeGuest(guest.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Agregar nuevo invitado */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre del invitado"
                value={newGuestName}
                onChange={(e) => setNewGuestName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    addGuest();
                  }
                }}
              />
              <button
                onClick={addGuest}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <FaUserPlus className="text-sm" />
                Agregar
              </button>
            </div>
          </div>
        )}

        {/* Botón de continuar */}
        <button
          onClick={handleTableSelect}
          disabled={
            !selectedTable ||
            loading ||
            !customerName.trim() ||
            (selectedTableData && selectedTableData.status !== "available") ||
            (withGuests && guests.length === 0)
          }
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
            ${
              selectedTable &&
              customerName.trim() &&
              !loading &&
              selectedTableData?.status === "available" &&
              (!withGuests || guests.length > 0)
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Creando órdenes...
            </>
          ) : selectedTable && customerName.trim() ? (
            selectedTableData?.status === "available" ? (
              withGuests && guests.length === 0 ? (
                "Agrega al menos un invitado"
              ) : (
                <>
                  <FaCheck />
                  {withGuests
                    ? `Continuar con ${guests.length + 1} personas`
                    : "Continuar al Menú"}
                </>
              )
            ) : (
              `Mesa ${selectedTable} no disponible`
            )
          ) : (
            "Completa los datos requeridos"
          )}
        </button>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡{" "}
            {withGuests
              ? "Cada persona tendrá su propio menú y orden"
              : "Podrás agregar más personas después"}
          </p>
          <p className="text-xs text-blue-600 text-center mt-2">
            * Campo obligatorio: Nombre
          </p>
        </div>
      </div>
    </div>
  );
}
