"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tablesService, Table } from "@/app/lib/supabase/tables";
import { ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import {
  FaChair,
  FaSpinner,
  FaCheck,
  FaQrcode,
  FaExclamationTriangle,
} from "react-icons/fa";

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
    // Leer parámetros de la URL directamente desde window.location
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromQR = urlParams.get("table");
    const redirected = urlParams.get("redirected");

    if (tableFromQR) {
      const tableNumber = parseInt(tableFromQR);
      if (!isNaN(tableNumber)) {
        setIsFromQR(true);
        setSelectedTable(tableNumber);

        // Limpiar la URL sin recargar la página
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }

    if (redirected) {
      // Limpiar la URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Opcional: Mostrar mensaje de despedida
      setTimeout(() => {
        alert("👋 ¡Gracias por su visita! Esperamos verlo pronto.");
      }, 500);
    }
  };

  const validateForm = () => {
    // Validar que se haya seleccionado una mesa
    if (!selectedTable) {
      setError("Por favor selecciona una mesa");
      return false;
    }

    // Validar que la mesa esté disponible
    const table = tables.find((t) => t.number === selectedTable);
    if (!table) {
      setError("Mesa no encontrada");
      return false;
    }

    if (table.status !== "available") {
      setError("Esta mesa no está disponible");
      return false;
    }

    // Validar que el nombre no esté vacío
    const trimmedName = customerName.trim();
    if (!trimmedName) {
      setNameError("El nombre es obligatorio");
      return false;
    }

    if (trimmedName.length < 2) {
      setNameError("El nombre debe tener al menos 2 caracteres");
      return false;
    }

    // Limpiar errores si todo está bien
    setError("");
    setNameError("");
    return true;
  };

  const handleTableSelect = async () => {
    // Validar el formulario antes de continuar
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

      // 2. Crear orden en la base de datos
      const order = await ordersService.createOrder(
        table.id,
        customerName.trim()
      );

      // 3. Actualizar estado de la mesa a "occupied"
      await tablesService.updateTableStatus(table.id, "occupied");

      // 4. Notificar al mesero
      await notificationsService.createNotification(
        table.id,
        "new_order",
        `Nuevo cliente en Mesa ${table.number} - ${customerName.trim()}`,
        order.id
      );

      // 5. Redirigir al menú (CORREGIDO)
      router.push(`/customer/menu?table=${table.number}`);
    } catch (err) {
      setError("Error al crear la orden");
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
                // Limpiar error de nombre cuando el usuario empiece a escribir
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

          {/* Botón de continuar */}
          <button
            onClick={handleTableSelect}
            disabled={
              loading ||
              !customerName.trim() ||
              (selectedTableData && selectedTableData.status !== "available")
            }
            className={`
              w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
              ${
                customerName.trim() &&
                !loading &&
                selectedTableData?.status === "available"
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                Creando orden...
              </>
            ) : customerName.trim() ? (
              selectedTableData?.status === "available" ? (
                <>
                  <FaCheck />
                  Continuar al Menú - Mesa {selectedTable}
                </>
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
              💡 Ingresa tu nombre para continuar al menú de tu mesa.
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
                      setError(""); // Limpiar error al seleccionar mesa
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

                    {/* Indicador de estado */}
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
              // Limpiar error de nombre cuando el usuario empiece a escribir
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

        {/* Botón de continuar */}
        <button
          onClick={handleTableSelect}
          disabled={
            !selectedTable ||
            loading ||
            !customerName.trim() ||
            (selectedTableData && selectedTableData.status !== "available")
          }
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
            ${
              selectedTable &&
              customerName.trim() &&
              !loading &&
              selectedTableData?.status === "available"
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Creando orden...
            </>
          ) : selectedTable && customerName.trim() ? (
            selectedTableData?.status === "available" ? (
              <>
                <FaCheck />
                Continuar al Menú - Mesa {selectedTable}
              </>
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
            💡 Escanea el código QR en tu mesa o selecciona manualmente
          </p>
          <p className="text-xs text-blue-600 text-center mt-2">
            * Campo obligatorio: Nombre
          </p>
        </div>
      </div>
    </div>
  );
}
