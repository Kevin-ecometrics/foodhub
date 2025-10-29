"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { tablesService, Table } from "@/app/lib/supabase/tables";
import { ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import { FaChair, FaSpinner, FaCheck, FaQrcode, FaStore } from "react-icons/fa";

// Lista de sucursales disponibles
const BRANCHES = [
  "Hermosillo - Plaza Dila",
  "Hermosillo - Plaza Valles",
  "Hermosillo – Gallerías Mall",
  "Hermosillo – Plaza Patio",
  "Hermosillo - Plaza Progreso",
  "Ciudad Obregón - Miguel Alemán",
  "Ciudad Obregón - Plaza Bellavista",
  "San Luis Río Colorado",
  "Guaymas",
  "Guasave",
  "Los Mochis",
  "Mexicali - Plaza San Pedro",
  "Mexicali - Plaza Nuevo Mexicali",
  "Tijuana - Plaza Paseo 2000",
  "Tijuana - Plaza Río",
  "Cabo San Lucas",
  "La Paz",
];

export default function HomePage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFromQR, setIsFromQR] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);

  // Cargar mesas al iniciar y verificar parámetros de URL
  useEffect(() => {
    checkURLParams();
  }, []);

  // Cargar mesas cuando se selecciona una sucursal
  useEffect(() => {
    if (selectedBranch) {
      loadTables(selectedBranch);
    } else {
      setTables([]);
    }
  }, [selectedBranch]);

  const checkURLParams = () => {
    // Leer parámetros de la URL directamente desde window.location
    const urlParams = new URLSearchParams(window.location.search);
    const tableFromQR = urlParams.get("table");
    const branchFromQR = urlParams.get("branch");
    const redirected = urlParams.get("redirected");

    if (tableFromQR && branchFromQR) {
      const tableNumber = parseInt(tableFromQR);
      if (!isNaN(tableNumber) && BRANCHES.includes(branchFromQR)) {
        setIsFromQR(true);
        setSelectedBranch(branchFromQR);
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

  const loadTables = async (branch: string) => {
    setLoadingTables(true);
    try {
      const tablesData = await tablesService.getTablesByBranch(branch);
      setTables(tablesData);
    } catch (err) {
      setError("Error cargando mesas de la sucursal");
      console.error(err);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleTableSelect = async () => {
    if (!selectedTable || !selectedBranch) return;

    setLoading(true);
    setError("");

    try {
      // 1. Verificar que la mesa esté disponible
      const table = tables.find(
        (t) => t.number === selectedTable && t.branch === selectedBranch
      );
      if (!table) {
        setError("Mesa no encontrada en esta sucursal");
        return;
      }

      if (table.status !== "available") {
        setError("Esta mesa no está disponible");
        return;
      }

      // 2. Crear orden en la base de datos
      const order = await ordersService.createOrder(table.id, customerName);

      // 3. Actualizar estado de la mesa a "occupied"
      await tablesService.updateTableStatus(table.id, "occupied");

      // 4. Notificar al mesero
      await notificationsService.createNotification(
        table.id,
        "new_order",
        `Nuevo cliente en Mesa ${table.number} - ${selectedBranch}${
          customerName ? ` - ${customerName}` : ""
        }`,
        order.id
      );

      // 5. Redirigir al menú
      router.push(`/customer/menu?table=${table.id}`);
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
      case "reserved":
        return "bg-yellow-500";
      case "cleaning":
        return "bg-blue-500";
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
      case "reserved":
        return "Reservada";
      case "cleaning":
        return "Limpieza";
      default:
        return status;
    }
  };

  // Encontrar la mesa seleccionada para mostrar su estado
  const selectedTableData = tables.find(
    (t) => t.number === selectedTable && t.branch === selectedBranch
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {isFromQR ? (
              <FaQrcode className="text-3xl text-blue-600" />
            ) : (
              <FaChair className="text-3xl text-blue-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido a FoodHub
          </h1>
          <p className="text-gray-600">
            {isFromQR
              ? "Mesa preseleccionada desde QR"
              : "Selecciona tu sucursal y mesa para comenzar"}
          </p>
        </div>

        {/* Selector de sucursal */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FaStore className="text-blue-600" />
            Sucursal
          </label>
          <select
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedTable(null); // Resetear mesa al cambiar sucursal
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="">Selecciona una sucursal</option>
            {BRANCHES.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        {/* Mostrar información de mesa QR */}
        {isFromQR && selectedTable && selectedBranch && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800">
                  Mesa {selectedTable} - {selectedBranch}
                </h3>
                <p className="text-sm text-blue-600">
                  Escaneaste el código QR de la sucursal {selectedBranch}
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
              <button
                onClick={() => {
                  setIsFromQR(false);
                  setSelectedTable(null);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Cambiar mesa
              </button>
            </div>
          </div>
        )}

        {/* Mostrar error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Selección de mesa (solo mostrar si hay sucursal seleccionada) */}
        {selectedBranch && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Número de Mesa
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
                <p className="text-gray-500">
                  No hay mesas disponibles en esta sucursal
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-3">
                  {tables.map((table) => (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTable(table.number)}
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
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span>Reservada</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Limpieza</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Nombre opcional del cliente */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tu nombre (opcional)
          </label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Botón de continuar */}
        <button
          onClick={handleTableSelect}
          disabled={
            !selectedTable ||
            !selectedBranch ||
            loading ||
            (selectedTableData && selectedTableData.status !== "available")
          }
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
            ${
              selectedTable &&
              selectedBranch &&
              !loading &&
              selectedTableData?.status === "available"
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Creando orden...
            </>
          ) : selectedTable && selectedBranch ? (
            selectedTableData?.status === "available" ? (
              <>
                <FaCheck />
                {isFromQR
                  ? `Continuar a Menú - Mesa ${selectedTable}`
                  : `Continuar a Menú - Mesa ${selectedTable}`}
              </>
            ) : (
              `Mesa ${selectedTable} no disponible`
            )
          ) : (
            "Selecciona sucursal y mesa"
          )}
        </button>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            {isFromQR
              ? "💡 Mesa seleccionada desde QR. Solo ingresa tu nombre y continua al menú."
              : !selectedBranch
              ? "💡 Primero selecciona tu sucursal para ver las mesas disponibles"
              : "💡 Escanea el código QR en tu mesa o selecciona manualmente"}
          </p>
        </div>
      </div>
    </div>
  );
}
