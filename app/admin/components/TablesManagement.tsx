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
      const currentDate = new Date().toISOString().split("T")[0];

      // Preparar variables para el script
      const qrImageUrl = imageUrl;
      const mesaNumero = tableNumber || "";
      const fechaActual = currentDate;

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - Mesa ${mesaNumero}</title>
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
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 450px;
            width: 100%;
          }
          .header {
            margin-bottom: 25px;
          }
          .header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 8px;
          }
          .header p {
            color: #666;
            font-size: 16px;
            margin-bottom: 5px;
          }
          .qr-image {
            width: 100%;
            max-width: 300px;
            height: auto;
            border: 2px solid #f0f0f0;
            border-radius: 10px;
            margin: 0 auto 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          }
          .instruction {
            margin-top: 20px;
            color: #666;
            font-size: 14px;
            line-height: 1.5;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            text-align: left;
          }
          .table-number {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .actions {
            margin-top: 25px;
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            min-width: 140px;
          }
          .btn-download {
            background: #2196F3;
            color: white;
          }
          .btn-download:hover {
            background: #1976D2;
            transform: translateY(-2px);
          }
          .btn-download-complete {
            background: #4CAF50;
            color: white;
          }
          .btn-download-complete:hover {
            background: #388E3C;
            transform: translateY(-2px);
          }
          .btn-close {
            background: #f5f5f5;
            color: #333;
          }
          .btn-close:hover {
            background: #e0e0e0;
            transform: translateY(-2px);
          }
          .divider {
            height: 1px;
            background: #e0e0e0;
            margin: 20px 0;
          }
          .instructions-title {
            color: #333;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="header">
            ${
              mesaNumero
                ? `<div class="table-number">Mesa ${mesaNumero}</div>`
                : ""
            }
            <h1>Código QR</h1>
            <p>Para pedir desde tu mesa</p>
          </div>
          
          <div class="divider"></div>
          
          <img src="${qrImageUrl}" alt="QR Code" class="qr-image" />
          
          <div class="instruction">
            <div class="instructions-title">¿Cómo usar?</div>
            1. Abre la cámara de tu teléfono<br>
            2. Escanea el código QR<br>
            3. Realiza tu pedido directamente
          </div>
          
          <div class="actions">
            <button class="btn btn-download" onclick="downloadQR()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 5px;">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              Solo QR
            </button>
            <button class="btn btn-download-complete" onclick="generate46Design()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 5px;">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              4x6 Design
            </button>
            <button class="btn btn-close" onclick="window.close()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 5px;">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
              Cerrar
            </button>
          </div>
        </div>

        <script>
          // Variables disponibles para las funciones
          const qrImageUrl = "${qrImageUrl}";
          const mesaNumero = "${mesaNumero}";
          const fechaActual = "${fechaActual}";
          
          function downloadQR() {
            try {
              console.log('Descargando QR:', qrImageUrl);
              const link = document.createElement('a');
              link.href = qrImageUrl;
              link.download = 'qr-mesa-' + (mesaNumero || 'menu') + '-' + fechaActual + '.png';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (error) {
              console.error('Error descargando QR:', error);
              alert('Error al descargar. Intenta nuevamente.');
            }
          }
          
          function generate46Design() {
            try {
              console.log('Generando diseño 4x6 para mesa:', mesaNumero);
              
              // Crear el HTML del diseño 4x6
              const designHTML = \`<!DOCTYPE html>
              <html>
              <head>
                <title>QR 4x6 - Mesa \${mesaNumero}</title>
                <style>
                  @page {
                    size: 6in 5in;
                    margin: 0.1in;
                  }
                  
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  
                  body {
                    font-family: 'Arial', sans-serif;
                    width: 5.8in;
                    height: 3.8in;
                    margin: 0;
                    padding: 0.05in;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-between;
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    color-adjust: exact;
                  }
                  
                  .container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: space-around;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .header {
                    text-align: center;
                    width: 100%;
                  }
                  
                  .restaurant-name {
                    color: #000000;
                    font-size: 20px;
                    font-weight: bold;
                    margin-bottom: 2px;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .table-number {
                    color: white;
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 16px;
                    font-weight: bold;
                    display: inline-block;
                    margin: 3px 0;
                    background-color: #000000;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    border: 2px solid #000000;
                  }
                  
                  .qr-section {
                    text-align: center;
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                  }
                  
                  .qr-image {
                    width: 3.1in;
                    height: 3.1in;
                    margin: 5px auto;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 3px;
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .instructions {
                    text-align: center;
                    width: 100%;
                    margin-top: 5px;
                  }
                  
                  .instructions-title {
                    color: #000000;
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 3px;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .instructions-list {
                    color: #000000;
                    font-size: 14px;
                    line-height: 1.2;
                    list-style: none;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  
                  .instructions-list li {
                    margin: 1px 0;
                  }

                  
                  @media print {
                    html, body {
                      height: 100%;
                      overflow: hidden;
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                    
                    body {
                      page-break-before: avoid;
                      page-break-after: avoid;
                      page-break-inside: avoid;
                    }
                    
                    .table-number {
                      background-color: #74AD4E !important;
                      color: white !important;
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                    }
                  }
                  
                  @media screen {
                    body {
                      border: 1px solid #ccc;
                      box-shadow: 0 0 10px rgba(0,0,0,0.1);
                      margin: 20px auto;
                    }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="table-number">MESA \${mesaNumero}</div>
                  </div>
                  
                  <div class="qr-section">
                    <img src="\${qrImageUrl}" alt="QR Code" class="qr-image" />
                  </div>
                  
                  <div class="instructions">
                    <div class="instructions-title">INSTRUCCIONES</div>
                    <ul class="instructions-list">
                      <li>1. Abre la cámara del teléfono</li>
                      <li>2. Escanea el código QR</li>
                      <li>3. Navega por el menú digital</li>
                      <li>4. Selecciona y ordena</li>
                      <li>5. Tu pedido llegará pronto</li>
                    </ul>
                  </div>
                  

                </div>
                
                <script>
                  setTimeout(() => {
                    window.print();
                  }, 300);
                  
                  window.onafterprint = function() {
                    setTimeout(() => {
                      window.close();
                    }, 800);
                  };
                <\\/script>
              </body>
              </html>\`;
              
              // Abrir nueva ventana
              const designWindow = window.open('', '_blank', 'width=700,height=500');
              
              if (designWindow) {
                designWindow.document.write(designHTML);
                designWindow.document.close();
                
                // Enfocar la ventana
                setTimeout(() => {
                  designWindow.focus();
                }, 100);
              } else {
                alert('Por favor permite ventanas emergentes');
              }
              
            } catch (error) {
              console.error('Error en generate46Design:', error);
              alert('Error al generar diseño 4x6');
            }
          }
          
          // Verificar que las funciones estén disponibles
          console.log('Script cargado correctamente');
          console.log('qrImageUrl:', qrImageUrl);
          console.log('mesaNumero:', mesaNumero);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Mesas</h2>
        <div className="flex gap-4">
          <button
            onClick={loadTables}
            className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            <FaSpinner className="text-sm" />
            Actualizar
          </button>
          <button
            onClick={() => {
              setEditingTable(null);
              setTableForm({
                capacity: "",
                location: "",
              });
              setShowTableForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <FaPlus />
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
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando mesas...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">
                Todas las Mesas
              </h3>
              <p className="text-sm text-gray-600">
                {tables.length} mesa{tables.length !== 1 ? "s" : ""} en total
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
              {[...tables]
                .sort((a, b) => (a.number ?? a.id) - (b.number ?? b.id))
                .map((table) => (
                  <div
                    key={table.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">
                          Mesa {table.number || table.id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {table.location}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          table.status
                        )}`}
                      >
                        {getStatusText(table.status)}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Capacidad:</strong> {table.capacity} personas
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={async () => {
                          await generateQRCode(
                            table.number || parseInt(table.id.toString())
                          );
                        }}
                        className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition"
                      >
                        <FaQrcode />
                        QR
                      </button>
                      <button
                        onClick={() => handleEditTable(table)}
                        className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-3 py-1 rounded text-sm hover:bg-yellow-200 transition"
                      >
                        <FaEdit />
                        Editar
                      </button>
                      <button
                        onClick={() => toggleTableStatus(table)}
                        className={`flex items-center gap-1 px-3 py-1 rounded text-sm transition ${
                          table.status === "available"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        <FaCog />
                        {table.status === "available" ? "Deshab." : "Habilitar"}
                      </button>

                      {/* Botón de Eliminar Orden Completa - Solo visible cuando la mesa está ocupada o tiene órdenes */}
                      {shouldShowDeleteOrderButton(table) && (
                        <button
                          onClick={() =>
                            handleDeleteTableOrder(table.id.toString())
                          }
                          disabled={deletingTable === table.id.toString()}
                          className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingTable === table.id.toString() ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaTrash />
                          )}
                          Eliminar Orden Completa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      {showLogoPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Vista Previa del Logo
                </h2>
                <button
                  onClick={() => setShowLogoPreview(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="text-center">
                {logoUrl ? (
                  <div>
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="max-w-full h-auto mx-auto rounded-lg border"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      URL: {logoUrl.substring(0, 50)}...
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">No hay logo cargado</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
