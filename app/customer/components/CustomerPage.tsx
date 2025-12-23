// app/customer/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import { tablesService, Table } from "@/app/lib/supabase/tables";
import { ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import {
  FaSpinner,
  FaCheck,
  FaQrcode,
  FaExclamationTriangle,
  FaArrowLeft,
} from "react-icons/fa";

export default function CustomerPage() {
  const router = useRouter();
  const { setSession } = useSession();
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingTables, setLoadingTables] = useState(false);
  const [nameError, setNameError] = useState("");
  const [tableFromParams, setTableFromParams] = useState<string | null>(null);
  const [redirected, setRedirected] = useState(false);
  const [paramsChecked, setParamsChecked] = useState(false); // Nuevo estado para controlar

  // Obtener parámetros de URL solo en el cliente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get("table");
    const redirectedParam = urlParams.get("redirected");

    setTableFromParams(tableParam);
    setRedirected(!!redirectedParam);
    setParamsChecked(true); // ¡IMPORTANTE! Marcamos que ya verificamos los parámetros

    // Limpiar URL si hay parámetro redirected
    if (redirectedParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      setTimeout(() => {
        alert("👋 ¡Gracias por su visita! Esperamos verlo pronto.");
      }, 500);
    }
  }, []);

  // Cargar mesas solo si hay parámetro de mesa
  useEffect(() => {
    if (tableFromParams !== null && paramsChecked) {
      loadAllTables();
      checkURLParams();
    }
  }, [tableFromParams, paramsChecked]);

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
    if (tableFromParams) {
      const tableNumber = parseInt(tableFromParams);
      if (!isNaN(tableNumber)) {
        setSelectedTable(tableNumber);
      }
    }
  };

  const validateForm = () => {
    if (!selectedTable) {
      setError("No se ha especificado una mesa");
      return false;
    }

    const table = tables.find((t) => t.number === selectedTable);
    if (!table) {
      setError("Mesa no encontrada");
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

    setError("");
    setNameError("");
    return true;
  };

  const handleRegisterAndRedirect = async () => {
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

      // 1. Crear orden para el cliente
      const order = await ordersService.createOrder(
        table.id,
        customerName.trim()
      );

      // 2. Si la mesa está disponible, actualizar estado a "occupied"
      if (table.status === "available") {
        await tablesService.updateTableStatus(table.id, "occupied");
      }

      // 3. Notificar al mesero sobre nuevo cliente
      await notificationsService.createNotification(
        table.id,
        "new_order",
        `Nuevo cliente en Mesa ${table.number} - ${customerName.trim()}`,
        order.id
      );

      // 4. Guardar sesión en el contexto
      setSession({
        tableId: table.id.toString(),
        userId: order.id,
        orderId: order.id,
        customerName: customerName.trim(),
        tableNumber: table.number,
      });

      // 5. Redirigir a ruta limpia
      router.push("/customer/menu");
    } catch (err) {
      setError("Error al crear la orden");
      console.error(err);
    } finally {
      setLoading(false);
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

  // Mostrar loading mientras se verifican los parámetros
  if (!paramsChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaSpinner className="text-3xl text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cargando...</h1>
          <p className="text-gray-600">Verificando información de la mesa</p>
        </div>
      </div>
    );
  }

  // VERIFICACIÓN CORREGIDA: Si NO hay parámetro de mesa, mostrar página de bienvenida
  if (!tableFromParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaQrcode className="text-4xl text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bienvenido a Casa Jardin Burgers
            </h1>
            <p className="text-gray-600 mb-6">
              Escanea el código QR de tu mesa para comenzar
            </p>
          </div>

          {/* Card informativa */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 mb-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaQrcode className="text-xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-blue-800 mb-2">
                ¿Cómo ingresar?
              </h3>
              <ul className="text-left text-gray-700 space-y-3 mb-4">
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <span>Busca el código QR en tu mesa</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <span>Escanea el código con tu cámara</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <span>Ingresa tu nombre y comienza a ordenar</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-center text-gray-600">
              💡 Cada mesa tiene un código QR único para identificar tu orden
            </p>
            <p className="text-xs text-center text-gray-500 mt-2">
              Pregunta al personal si necesitas ayuda
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si hay mesa pero aún estamos cargando los datos de la mesa
  if (loadingTables) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaSpinner className="text-3xl text-blue-600 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Cargando...</h1>
          <p className="text-gray-600">Verificando mesa {tableFromParams}</p>
        </div>
      </div>
    );
  }

  // Página normal cuando hay mesa en los parámetros
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

        {/* Información de mesa */}
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
                      : selectedTableData.status === "occupied"
                      ? "text-orange-600"
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

        {/* Botón de continuar */}
        <button
          onClick={handleRegisterAndRedirect}
          disabled={loading || !customerName.trim() || !selectedTableData}
          className={`
            w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
            ${
              customerName.trim() && !loading && selectedTableData
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" />
              Creando tu orden...
            </>
          ) : customerName.trim() ? (
            <>
              <FaCheck />
              Continuar al Menú
            </>
          ) : (
            "Ingresa tu nombre"
          )}
        </button>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-700 text-center">
            💡 Podrás agregar más personas después desde el menú
          </p>
          <p className="text-xs text-blue-600 text-center mt-2">
            * Campo obligatorio: Nombre
          </p>
          <button
            onClick={() => {
              // Limpiar y volver a escanear
              localStorage.clear();
              window.location.href = "/customer";
            }}
            className="text-xs text-gray-500 hover:text-gray-700 text-center w-full mt-2"
          >
            ¿Escaneaste el código QR incorrecto? Haz clic aquí
          </button>
        </div>
      </div>
    </div>
  );
}
