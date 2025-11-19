// app/admin/components/TablesManagement.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { FaPlus, FaEdit, FaQrcode, FaCog, FaSpinner } from "react-icons/fa";
import { RestaurantTable } from "../types";
import TableForm from "./TableForm";

interface TablesManagementProps {
  onError: (error: string) => void;
}

export default function TablesManagement({ onError }: TablesManagementProps) {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [showTableForm, setShowTableForm] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [showLogoPreview, setShowLogoPreview] = useState(false);

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

  const loadTables = async () => {
    setTablesLoading(true);
    try {
      const { data, error } = await supabase
        .from("tables")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTables(data || []);

      await loadLatestLogo();
    } catch (error) {
      console.error("Error loading tables:", error);
      onError("Error cargando las mesas");
    } finally {
      setTablesLoading(false);
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

  const generateQRCode = (tableNumber: number) => {
    const baseUrl = "https://foodhub-software.vercel.app";
    const url = `${baseUrl}/customer?table=${tableNumber}`;

    // Usar QuickChart.io que es más confiable para logos
    let qrUrl: string;

    if (logoUrl) {
      // Agregar timestamp único al logo URL para evitar cache
      const logoUrlWithTimestamp = `${logoUrl.split("?")[0]}?t=${Date.now()}`;

      // QuickChart.io soporta logos mejor
      qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
        url
      )}&size=300&centerImageUrl=${encodeURIComponent(
        logoUrlWithTimestamp
      )}&centerImageWidth=75&centerImageHeight=75&margin=1`;
    } else {
      // QR normal sin logo
      qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(
        url
      )}&size=300&margin=1`;
    }

    console.log("📱 QR URL generada:", qrUrl);
    window.open(qrUrl, "_blank");
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
                      {/* <p className="text-sm text-gray-600">
                      <strong>ID:</strong> {table.id}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Creada:</strong>{" "}
                      {new Date(table.created_at).toLocaleDateString()}
                    </p> */}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() =>
                          generateQRCode(
                            table.number || parseInt(table.id.toString())
                          )
                        }
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
