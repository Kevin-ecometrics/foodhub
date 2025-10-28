"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { tablesService, Table } from "@/app/lib/supabase/tables";
import { ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import { FaChair, FaSpinner, FaCheck, FaQrcode } from "react-icons/fa";

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isFromQR, setIsFromQR] = useState(false);

  // Cargar mesas al iniciar
  useEffect(() => {
    loadTables();
  }, []);

  // Verificar parámetros de URL para mesa desde QR
  useEffect(() => {
    const tableFromQR = searchParams.get("table");

    if (tableFromQR) {
      const tableNumber = parseInt(tableFromQR);
      if (!isNaN(tableNumber)) {
        setIsFromQR(true);
        setSelectedTable(tableNumber);

        // También verificar si viene de redirección por mesa liberada
        const redirected = searchParams.get("redirected");
        if (redirected) {
          window.history.replaceState({}, "", "/customer");
          setTimeout(() => {
            alert("👋 ¡Gracias por su visita! Esperamos verlo pronto.");
          }, 500);
        }
      }
    }
  }, [searchParams]);

  const loadTables = async () => {
    try {
      const tablesData = await tablesService.getTables();
      setTables(tablesData);
    } catch (err) {
      setError("Error cargando mesas");
      console.error(err);
    }
  };

  const handleTableSelect = async () => {
    if (!selectedTable) return;

    setLoading(true);
    setError("");

    try {
      // 1. Verificar que la mesa esté disponible
      const table = tables.find((t) => t.number === selectedTable);
      if (!table) {
        setError("Mesa no encontrada");
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
        `Nuevo cliente en Mesa ${table.number}${
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
  const selectedTableData = tables.find((t) => t.number === selectedTable);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4">
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
              : "Selecciona tu mesa para comenzar"}
          </p>
        </div>

        {/* Mostrar información de mesa QR */}
        {isFromQR && selectedTable && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-800">
                  Mesa {selectedTable} seleccionada
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

        {/* Selección de mesa (solo mostrar si no viene de QR o si el usuario quiere cambiar) */}
        {!isFromQR && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Número de Mesa
            </label>
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
            loading ||
            (selectedTableData && selectedTableData.status !== "available")
          }
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
            ${
              selectedTable &&
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
          ) : selectedTable ? (
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
            "Selecciona una mesa"
          )}
        </button>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            {isFromQR
              ? "💡 Mesa seleccionada desde QR. Solo ingresa tu nombre y continua al menú."
              : "💡 Escanea el código QR en tu mesa o selecciona manualmente"}
          </p>
        </div>
      </div>
    </div>
  );
}
