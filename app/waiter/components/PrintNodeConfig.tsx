"use client";

import { useState, useEffect } from "react";
import { getPrintNodeApiService } from "@/app/lib/printing/printnodeApiService";

interface Printer {
  id: number;
  name: string;
  state: string;
  computer?: string;
}

interface ConfigStatus {
  kitchen: { id: number; exists: boolean; name: string };
  bar: { id: number; exists: boolean; name: string };
  ticket: { id: number; exists: boolean; name: string };
}

export default function PrintNodeConfig() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "disconnected"
  >("checking");

  const printNodeService = getPrintNodeApiService();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setLoading(true);
    setMessage(null);
    setConnectionStatus("checking");

    try {
      const result = await printNodeService.testConnection();

      if (result.success) {
        setConnectionStatus("connected");
        setMessage({
          type: "success",
          text: result.message,
        });

        // Obtener detalles de las impresoras
        const apiResult = await fetch("/api/print");
        if (apiResult.ok) {
          const data = await apiResult.json();
          setPrinters(data.printers || []);
          setConfigStatus(data.configStatus);
        }
      } else {
        setConnectionStatus("disconnected");
        setMessage({
          type: "error",
          text: result.message,
        });
      }
    } catch (error: any) {
      console.error("Error verificando conexión:", error);
      setConnectionStatus("disconnected");
      setMessage({
        type: "error",
        text: `Error: ${error.message || "No se pudo conectar"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const testPrint = async (printerType: "kitchen" | "bar" | "ticket") => {
    setLoading(true);
    setMessage(null);

    try {
      const testData = {
        orderId: "TEST",
        tableNumber: 99,
        customerCount: 1,
        area: "Prueba",
        items: [
          {
            name: "Prueba de Impresión",
            quantity: 1,
            price: 0,
            category_type:
              printerType === "kitchen"
                ? "main"
                : printerType === "bar"
                  ? "drink"
                  : "other",
            customerName: "Sistema",
          },
        ],
        total: 0,
        createdAt: new Date().toISOString(),
        waiter: "Admin",
      };

      let result;
      if (printerType === "kitchen") {
        result = await printNodeService.printKitchenTicket(testData);
      } else if (printerType === "bar") {
        result = await printNodeService.printColdBarTicket(testData);
      } else {
        result = await printNodeService.printTicket(testData, false, false);
      }

      if (result.success) {
        setMessage({
          type: "success",
          text: `✅ Prueba enviada a la impresora de ${printerType}`,
        });
      } else {
        setMessage({
          type: "error",
          text: `❌ Error: ${result.error}`,
        });
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: `❌ Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrinterStatus = (state: string) => {
    switch (state) {
      case "online":
        return { label: "En línea", color: "bg-green-100 text-green-800" };
      case "offline":
        return { label: "Desconectada", color: "bg-red-100 text-red-800" };
      default:
        return { label: state, color: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Estado de Impresión
        </h3>
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === "connected"
                ? "bg-green-100 text-green-800"
                : connectionStatus === "disconnected"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {connectionStatus === "connected"
              ? "Conectado"
              : connectionStatus === "disconnected"
                ? "Desconectado"
                : "Verificando..."}
          </div>
          <button
            onClick={checkConnection}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : message.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de estado de impresoras */}
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">
              Impresoras Configuradas
            </h4>

            {configStatus ? (
              <div className="space-y-3">
                {(["kitchen", "bar", "ticket"] as const).map((type) => {
                  const status = configStatus[type];
                  const printer = printers.find((p) => p.id === status.id);
                  const printerStatus = printer
                    ? getPrinterStatus(printer.state)
                    : null;

                  return (
                    <div key={type} className="p-3 bg-white rounded border">
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-medium">
                          {type === "kitchen" && "🍳 Cocina"}
                          {type === "bar" && "🍹 Barra Fría"}
                          {type === "ticket" && "🧾 Tickets"}
                        </div>
                        {printerStatus && (
                          <span
                            className={`px-2 py-1 rounded text-xs ${printerStatus.color}`}
                          >
                            {printerStatus.label}
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>ID: {status.id}</div>
                        <div>Nombre: {status.name}</div>
                        {printer?.computer && (
                          <div>Computadora: {printer.computer}</div>
                        )}
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={() => testPrint(type)}
                          disabled={loading}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          Probar Impresión
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Cargando configuración...
              </div>
            )}
          </div>
        </div>

        {/* Panel de información */}
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">
              Configuración Requerida
            </h4>
            <div className="text-sm text-blue-700 space-y-2">
              <div className="flex items-start">
                <span className="mr-2">🔑</span>
                <span>
                  <strong>PRINTNODE_API_KEY:</strong> API Key de PrintNode
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">🖨️</span>
                <span>
                  <strong>PRINTER_KITCHEN_ID:</strong> ID impresora cocina
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">🥤</span>
                <span>
                  <strong>PRINTER_BAR_ID:</strong> ID impresora barra
                </span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">🧾</span>
                <span>
                  <strong>PRINTER_TICKET_ID:</strong> ID impresora tickets
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-3">
              Impresoras Disponibles ({printers.length})
            </h4>

            {printers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No se encontraron impresoras
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {printers.map((printer) => {
                  const status = getPrinterStatus(printer.state);
                  const isConfigured =
                    configStatus &&
                    (configStatus.kitchen.id === printer.id ||
                      configStatus.bar.id === printer.id ||
                      configStatus.ticket.id === printer.id);

                  return (
                    <div
                      key={printer.id}
                      className={`p-3 rounded border ${isConfigured ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{printer.name}</div>
                          <div className="text-xs text-gray-600">
                            ID: {printer.id} •{" "}
                            {printer.computer || "Sin computadora"}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
