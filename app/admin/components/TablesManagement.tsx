/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/components/TablesManagement.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import {
  FaPlus,
  FaEdit,
  FaQrcode,
  FaCog,
  FaSpinner,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import { RestaurantTable } from "../types";
import TableForm from "./TableForm";
import QRCode from "qrcode";

interface TablesManagementProps {
  onError: (error: string) => void;
}

export default function TablesManagement({ onError }: TablesManagementProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const [deletingTable, setDeletingTable] = useState<string | null>(null);
  const [tableHasOrders, setTableHasOrders] = useState<{
    [key: string]: boolean;
  }>({});

  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(
    null
  );
  const [tableForm, setTableForm] = useState({
    capacity: "",
    location: "",
  });

  useEffect(() => {
    loadTables();
    loadLatestLogo();
  }, []);

  const loadLatestLogo = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from("logo")
        .list("", {
          limit: 100,
          offset: 0,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;

      if (files && files.length > 0) {
        const latestLogo = files.find((file) => file.name.startsWith("logo_"));
        if (latestLogo) {
          const { data: urlData } = supabase.storage
            .from("logo")
            .getPublicUrl(latestLogo.name);

          if (urlData?.publicUrl) {
            const timestamp = new Date().getTime();
            setLogoUrl(`${urlData.publicUrl}?t=${timestamp}`);
          }
        }
      }
    } catch (error) {
      console.error("Error loading logo:", error);
    }
  };

  const checkTableHasOrderItems = async (tableId: number): Promise<boolean> => {
    try {
      // Buscar órdenes activas para esta mesa
      const { data: orders, error: ordersError } = (await supabase
        .from("orders")
        .select("id")
        .eq("table_id", tableId)
        .in("status", ["active", "pending", "confirmed"])) as {
        data: { id: number }[] | null;
        error: any;
      }; // Solo órdenes activas

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        return false;
      }

      // Verificar si alguna de estas órdenes tiene items
      const orderIds = orders.map((order) => order.id);

      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("id")
        .in("order_id", orderIds)
        .limit(1);

      if (itemsError) throw itemsError;

      return !!orderItems && orderItems.length > 0;
    } catch (error) {
      console.error("Error checking table order items:", error);
      return false;
    }
  };

  const loadTables = async () => {
    setTablesLoading(true);
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTables((data as RestaurantTable[]) || []);

      // Verificar para cada mesa si tiene órdenes con items
      const tableOrdersMap: { [key: string]: boolean } = {};
      if (data) {
        for (const table of data as RestaurantTable[]) {
          const hasOrders = await checkTableHasOrderItems(table.id);
          tableOrdersMap[table.id] = hasOrders;
        }
      }
      setTableHasOrders(tableOrdersMap);

      await loadLatestLogo();
    } catch (error) {
      console.error("Error loading tables:", error);
      onError("Error cargando las mesas");
    } finally {
      setTablesLoading(false);
    }
  };

  const shouldShowDeleteOrderButton = (table: RestaurantTable): boolean => {
    // Mostrar si la mesa está ocupada O si tiene items en order_items
    return table.status === "occupied" || tableHasOrders[table.id] === true;
  };

  const handleDeleteTableOrder = async (tableId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar la orden de esta mesa? Esta acción no se puede deshacer y eliminará todos los pedidos y notificaciones asociadas, y la mesa volverá a estar disponible."
      )
    )
      return;

    setDeletingTable(tableId);
    try {
      const tableIdNum = parseInt(tableId);
      console.log("🔍 Verificando datos para mesa:", tableIdNum);

      // Buscar CUALQUIER orden de esta mesa (sin filtrar por status)
      const { data: allOrders, error: ordersError } = (await supabase
        .from("orders")
        .select("id, status, created_at")
        .eq("table_id", tableIdNum)
        .order("created_at", { ascending: false })) as {
        data: { id: number; status: string; created_at: string }[] | null;
        error: any;
      };

      if (ordersError) {
        console.error("Error buscando órdenes:", ordersError);
        throw ordersError;
      }

      console.log("📋 Todas las órdenes encontradas:", allOrders);

      if (allOrders && allOrders.length > 0) {
        // Eliminar todas las órdenes de esta mesa
        for (const order of allOrders) {
          const orderId = order.id;
          console.log(
            `🗑️ Eliminando orden ${orderId} (status: ${order.status})`
          );

          // 1. Eliminar notificaciones de esta orden
          const { error: notifError } = await supabase
            .from("waiter_notifications")
            .delete()
            .eq("order_id", orderId);

          if (notifError) {
            console.error("Error eliminando notificaciones:", notifError);
            throw notifError;
          }

          // 2. Eliminar items de la orden
          const { error: itemsError } = await supabase
            .from("order_items")
            .delete()
            .eq("order_id", orderId);

          if (itemsError) {
            console.error("Error eliminando items:", itemsError);
            throw itemsError;
          }

          // 3. Eliminar la orden
          const { error: orderError } = await supabase
            .from("orders")
            .delete()
            .eq("id", orderId);

          if (orderError) {
            console.error("Error eliminando orden:", orderError);
            throw orderError;
          }

          console.log(`✅ Orden ${orderId} eliminada`);
        }
      } else {
        console.log("ℹ️ No se encontraron órdenes para esta mesa");
      }

      // Eliminar notificaciones directas de la mesa (por si acaso)
      const { data: tableNotifications, error: tableNotifError } =
        await supabase
          .from("waiter_notifications")
          .select("id, type")
          .eq("table_id", tableIdNum);

      if (tableNotifError) {
        console.error(
          "Error buscando notificaciones de mesa:",
          tableNotifError
        );
        throw tableNotifError;
      }

      console.log("📋 Notificaciones directas de mesa:", tableNotifications);

      if (tableNotifications && tableNotifications.length > 0) {
        const { error: deleteTableNotifError } = await supabase
          .from("waiter_notifications")
          .delete()
          .eq("table_id", tableIdNum);

        if (deleteTableNotifError) {
          console.error(
            "Error eliminando notificaciones de mesa:",
            deleteTableNotifError
          );
          throw deleteTableNotifError;
        }
        console.log(
          `✅ ${tableNotifications.length} notificaciones de mesa eliminadas`
        );
      }

      // 4. Cambiar el status de la mesa a "available"
      console.log("🔄 Cambiando status de la mesa a 'available'");
      const { error: tableUpdateError } = await supabase
        .from("tables")
        .update({ status: "available" } as never)
        .eq("id", tableIdNum);

      if (tableUpdateError) {
        console.error(
          "Error actualizando estado de la mesa:",
          tableUpdateError
        );
        throw tableUpdateError;
      }

      console.log("✅ Status de la mesa actualizado a 'available'");
      console.log("🎉 Proceso de limpieza completado para mesa:", tableIdNum);

      // Mostrar mensaje de éxito
      let successMessage = "✅ Mesa limpiada y puesta como disponible";
      if (allOrders && allOrders.length > 0) {
        successMessage += ` y ordenes eliminadas`;
      } else {
        successMessage += " (no había órdenes activas)";
      }

      onError(successMessage);
      await loadTables();

      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => onError(""), 3000);
    } catch (error: any) {
      console.error("❌ Error:", error);
      onError(
        "Error eliminando la orden: " + (error.message || "Error desconocido")
      );
    } finally {
      setDeletingTable(null);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tableData = {
        capacity: parseInt(tableForm.capacity),
        location: tableForm.location,
        status: "available",
      };

      const { data, error } = await supabase
        .from("tables")
        .insert([tableData] as never)
        .select()
        .single<RestaurantTable>();

      if (error) throw error;

      // Ahora actualizamos el número de mesa para que sea igual al ID
      const { error: updateError } = await supabase
        .from("tables")
        .update({ number: data?.id } as never)
        .eq("id", data?.id);

      if (updateError) throw updateError;

      setShowTableForm(false);
      setTableForm({
        capacity: "",
        location: "",
      });
      await loadTables();
    } catch (error) {
      console.error("Error creating table:", error);
      onError("Error creando la mesa");
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    try {
      const tableData = {
        capacity: parseInt(tableForm.capacity),
        location: tableForm.location,
      };

      const { error } = await supabase
        .from("tables")
        .update(tableData as never)
        .eq("id", editingTable.id);

      if (error) throw error;

      setShowTableForm(false);
      setEditingTable(null);
      setTableForm({
        capacity: "",
        location: "",
      });
      await loadTables();
    } catch (error) {
      console.error("Error updating table:", error);
      onError("Error actualizando la mesa");
    }
  };

  const handleEditTable = (table: RestaurantTable) => {
    setEditingTable(table);
    setTableForm({
      capacity: table.capacity.toString(),
      location: table.location,
    });
    setShowTableForm(true);
  };

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta mesa?")) return;

    try {
      const { error } = await supabase
        .from("tables")
        .delete()
        .eq("id", tableId);

      if (error) throw error;
      await loadTables();
    } catch (error) {
      console.error("Error deleting table:", error);
      onError("Error eliminando la mesa");
    }
  };

  const toggleTableStatus = async (table: RestaurantTable) => {
    try {
      const newStatus =
        table.status === "available" ? "maintenance" : "available";
      const { error } = await supabase
        .from("tables")
        .update({ status: newStatus } as never)
        .eq("id", table.id);

      if (error) throw error;
      await loadTables();
    } catch (error) {
      console.error("Error updating table status:", error);
      onError("Error actualizando el estado de la mesa");
    }
  };

  const generateQRCode = async (tableNumber: number) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/customer?table=${tableNumber}`;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 300;
      canvas.height = 300;

      if (logoUrl) {
        await QRCode.toCanvas(canvas, url, {
          width: 300,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        await integrateLogoIntoQR(canvas, logoUrl);
      } else {
        await QRCode.toCanvas(canvas, url, {
          width: 300,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
      }

      // CONVERTIR A DATA URL
      const qrDataUrl = canvas.toDataURL("image/png");

      // MÉTODO CORREGIDO - SOLO MOSTRAR, NO DESCARGAR
      await openQRInNewTabSafari(qrDataUrl, tableNumber);
    } catch (error) {
      console.error("Error generando QR:", error);
      // Fallback - usar URL directa del servicio externo
      const fallbackUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
        url
      )}&size=300&margin=1`;
      await openQRInNewTabSafari(fallbackUrl, tableNumber);
    }
  };

  // FUNCIÓN ESPECÍFICA PARA SAFARI COMPATIBLE
  const openQRInNewTabSafari = async (
    imageUrl: string,
    tableNumber?: number
  ): Promise<boolean> => {
    // Usar siempre el método de página HTML para máxima compatibilidad
    return openQRWithHTMLPage(imageUrl, tableNumber);
  };

  // MÉTODO PRINCIPAL MEJORADO - SIEMPRE USAR PÁGINA HTML
  const openQRWithHTMLPage = (
    imageUrl: string,
    tableNumber?: number
  ): boolean => {
    try {
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - Mesa ${tableNumber || ""}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center; 
            align-items: center; 
            padding: 20px;
          }
          .qr-container {
            text-align: center;
            background: white;
            padding: 30px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
          }
          .header {
            margin-bottom: 20px;
          }
          .header h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 16px;
          }
          .qr-image {
            width: 100%;
            max-width: 300px;
            height: auto;
            border: 2px solid #f0f0f0;
            border-radius: 10px;
            margin: 0 auto;
          }
          .instruction {
            margin-top: 20px;
            color: #666;
            font-size: 14px;
            line-height: 1.5;
          }
          .table-number {
            background: #4CAF50;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 15px;
          }
          .actions {
            margin-top: 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
          }
          .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
          }
          .btn-download {
            background: #2196F3;
            color: white;
          }
          .btn-download:hover {
            background: #1976D2;
          }
          .btn-close {
            background: #f5f5f5;
            color: #333;
          }
          .btn-close:hover {
            background: #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="header">
            ${
              tableNumber
                ? `<div class="table-number">Mesa ${tableNumber}</div>`
                : ""
            }
            <h1>Código QR</h1>
            <p>Para pedir desde tu mesa</p>
          </div>
          
          <img src="${imageUrl}" alt="QR Code" class="qr-image" />
          
          <div class="instruction">
            <strong>¿Cómo usar?</strong><br>
            1. Abre la cámara de tu teléfono<br>
            2. Escanea el código QR<br>
            3. Realiza tu pedido directamente
          </div>
          
          <div class="actions">
            <button class="btn btn-download" onclick="downloadQR()">Descargar QR</button>
            <button class="btn btn-close" onclick="window.close()">Cerrar</button>
          </div>
        </div>

        <script>
          function downloadQR() {
            const link = document.createElement('a');
            link.href = '${imageUrl}';
            link.download = 'qr-mesa-${tableNumber || "menu"}-${
        new Date().toISOString().split("T")[0]
      }.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        </script>
      </body>
      </html>
    `;

      const newWindow = window.open(
        "",
        "_blank",
        "width=500,height=700,scrollbars=no,resizable=no"
      );
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        return true;
      } else {
        // Si falla window.open, mostrar en la misma ventana
        showQRInCurrentWindow(imageUrl, tableNumber);
        return false;
      }
    } catch (error) {
      console.error("Error abriendo QR:", error);
      showQRInCurrentWindow(imageUrl, tableNumber);
      return false;
    }
  };

  // FALLBACK: Mostrar en la misma ventana si no se puede abrir nueva
  const showQRInCurrentWindow = (imageUrl: string, tableNumber?: number) => {
    const htmlContent = `
    <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;justify-content:center;align-items:center;z-index:10000;">
      <div style="background:white;padding:30px;border-radius:15px;text-align:center;max-width:400px;margin:20px;">
        <h2 style="color:#333;margin-bottom:15px;">QR Code - Mesa ${
          tableNumber || ""
        }</h2>
        <img src="${imageUrl}" style="max-width:100%;height:auto;border:2px solid #ddd;border-radius:10px;" />
        <p style="color:#666;margin:15px 0;">Escanea el código QR con tu cámara</p>
        <button onclick="this.parentElement.parentElement.remove()" style="background:#2196F3;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;">
          Cerrar
        </button>
      </div>
    </div>
  `;

    const overlay = document.createElement("div");
    overlay.innerHTML = htmlContent;
    document.body.appendChild(overlay);
  };

  // Función para integrar el logo en el QR
  const integrateLogoIntoQR = (
    canvas: HTMLCanvasElement,
    logoUrl: string
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No context"));
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        // Tamaño y posición para el logo integrado
        const logoSize = 60;
        const centerX = (canvas.width - logoSize) / 2;
        const centerY = (canvas.height - logoSize) / 2;

        // Crear un área "protegida" en el centro del QR
        // Esto permite que el QR sea legible pero con espacio para el logo
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(centerX - 2, centerY - 2, logoSize + 4, logoSize + 4);

        // Dibujar el logo
        ctx.drawImage(img, centerX, centerY, logoSize, logoSize);

        resolve();
      };

      img.onerror = () => reject(new Error("Error cargando logo"));
      img.src = logoUrl;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-red-100 text-red-800";
      case "reserved":
        return "bg-yellow-100 text-yellow-800";
      case "maintenance":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available":
        return "Disponible";
      case "occupied":
        return "Ocupada";
      case "reserved":
        return "Reservada";
      case "maintenance":
        return "Mantenimiento";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-5" style={{fontFamily:"var(--font-geist-sans)"}}>
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-extrabold text-slate-900">Gestión de Mesas</h2>
        <div className="flex gap-2">
          <button
            onClick={loadTables}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <FaSpinner className="text-[11px]" />
            Actualizar
          </button>
          <button
            onClick={() => {
              setEditingTable(null);
              setTableForm({ capacity: "", location: "" });
              setShowTableForm(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-[var(--color-accent)] text-white text-xs font-bold hover:brightness-90 transition"
          >
            <FaPlus className="text-[11px]" />
            Nueva Mesa
          </button>
        </div>
      </div>

      {showTableForm && (
        <TableForm
          editingTable={editingTable}
          tableForm={tableForm}
          onSubmit={editingTable ? handleUpdateTable : handleCreateTable}
          onCancel={() => {
            setShowTableForm(false);
            setEditingTable(null);
          }}
          onFormChange={setTableForm}
        />
      )}

      {tablesLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-[14px] bg-[var(--color-accent)] flex items-center justify-center mx-auto">
            <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </div>
          <p className="text-slate-500 mt-4 text-sm font-medium">Cargando mesas...</p>
        </div>
      ) : (
        <div>
          <div className="mb-3">
            <p className="text-sm font-bold text-slate-800">Todas las Mesas</p>
            <p className="text-xs text-slate-500">{tables.length} mesa{tables.length !== 1 ? "s" : ""} en total</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...tables]
                .sort((a, b) => (a.number ?? a.id) - (b.number ?? b.id))
                .map((table, idx) => {
                  const occ = table.status === "occupied";
                  const dis = table.status === "maintenance";
                  return (
                    <div
                      key={table.id}
                      className={`border border-slate-200 rounded-[14px] p-3.5 hover:shadow-sm transition ${dis ? "bg-gray-50" : occ ? "bg-white border-red-200" : "bg-white"}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-slate-900">Mesa {table.number || table.id}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] ${getStatusColor(table.status)}`}>
                          {getStatusText(table.status)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-0.5">{table.location}</p>
                      <p className="text-[11px] text-slate-500 mb-3">Capacidad: {table.capacity} personas</p>

                      <div className="flex gap-1.5 flex-wrap">
                        <button
                          onClick={async () => await generateQRCode(table.number || parseInt(table.id.toString()))}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-[var(--color-accent-light)] text-[var(--color-accent-dark)] text-[11px] font-bold hover:bg-[var(--color-accent-light)] transition"
                        >
                          <FaQrcode className="text-[10px]" /> QR
                        </button>
                        <button
                          onClick={() => handleEditTable(table)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-amber-50 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition"
                        >
                          <FaEdit className="text-[10px]" /> Editar
                        </button>
                        <button
                          onClick={() => toggleTableStatus(table)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[11px] font-bold transition ${
                            table.status === "available"
                              ? "bg-red-50 text-red-600 hover:bg-red-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          <FaCog className="text-[10px]" />
                          {table.status === "available" ? "Deshab." : "Habilitar"}
                        </button>
                        {shouldShowDeleteOrderButton(table) && (
                          <button
                            onClick={() => handleDeleteTableOrder(table.id.toString())}
                            disabled={deletingTable === table.id.toString()}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-red-600 text-white text-[11px] font-bold hover:brightness-90 transition disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center mt-1"
                          >
                            {deletingTable === table.id.toString() ? (
                              <FaSpinner className="animate-spin text-[10px]" />
                            ) : (
                              <FaTrash className="text-[10px]" />
                            )}
                            Eliminar Orden
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}
      {showLogoPreview && (
        <div className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4" onClick={() => setShowLogoPreview(false)}>
          <div className="bg-white rounded-[18px] shadow-2xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <p className="text-sm font-extrabold text-slate-900">Vista Previa del Logo</p>
              <button onClick={() => setShowLogoPreview(false)} className="p-1 text-slate-400 hover:text-slate-600"><FaTimes /></button>
            </div>
            <div className="p-5 text-center">
              {logoUrl ? (
                <div>
                  <img src={logoUrl} alt="Logo preview" className="max-w-full h-auto mx-auto rounded-[10px] border border-slate-200" />
                  <p className="text-[11px] text-slate-500 mt-2">{logoUrl.substring(0, 50)}...</p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm">No hay logo cargado</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
