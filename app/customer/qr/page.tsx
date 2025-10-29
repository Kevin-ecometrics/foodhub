"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaQrcode, FaUtensils, FaHistory } from "react-icons/fa";

export default function QRSharePage() {
  const router = useRouter();
  const [tableId, setTableId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // Leer tableId de los query params de manera asíncrona
    const readTableId = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tableFromParams = params.get("table");

        // Usar setTimeout para evitar el setState síncrono
        setTimeout(() => {
          setTableId(tableFromParams);
        }, 0);
      }
    };

    readTableId();
  }, []);

  useEffect(() => {
    // Este efecto se ejecuta cuando tableId cambia
    if (tableId) {
      const baseUrl = "https://foodhub-software.vercel.app";
      const url = `${baseUrl}/customer/menu?table=${tableId}`;

      // Actualizar la URL de manera asíncrona
      setTimeout(() => {
        setCurrentUrl(url);
      }, 0);
    }
  }, [tableId]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Únete a mi mesa - FoodHub",
          text: "Únete a mi mesa en FoodHub Restaurant",
          url: currentUrl,
        });
      } catch (err) {
        console.error("Error al compartir:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  // Generar QR usando un servicio externo
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    currentUrl
  )}`;

  if (!tableId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <FaQrcode className="text-6xl text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Mesa no especificada
          </h1>
          <p className="text-gray-600 mb-6">
            No se pudo identificar la mesa. Por favor, regresa al menú
            principal.
          </p>
          <button
            onClick={() => router.push("/customer")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black pb-20">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm sticky top-0 z-30 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold">Compartir Mesa</h1>
            <p className="text-sm">Mesa {tableId}</p>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl shadow-2xl p-6 text-center">
          {/* Título y Descripción */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Invita a tu Mesa
          </h2>
          <p className="text-gray-600 mb-8">
            Comparte este código QR con tus acompañantes para que puedan unirse
            a la misma orden
          </p>

          {/* Código QR */}
          <div className="bg-gray-50 p-6 rounded-2xl mb-8 border-2 border-dashed border-gray-200">
            <div className="bg-white p-4 rounded-xl inline-block">
              <img
                src={qrCodeUrl}
                alt="Código QR para unirse a la mesa"
                className="w-64 h-64 mx-auto"
                onError={(e) => {
                  // Fallback si la imagen del QR falla
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                Mesa: <span className="font-bold text-lg">{tableId}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Escanea para unirte a la orden
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Navegación Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-30">
        <div className="max-w-7xl mx-auto flex justify-around py-3">
          <button
            onClick={() => router.push(`/customer/menu?table=${tableId}`)}
            className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition"
          >
            <FaUtensils className="text-2xl mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>

          <button
            onClick={() => router.push(`/customer/history?table=${tableId}`)}
            className="flex flex-col items-center text-gray-400 hover:text-gray-600 transition"
          >
            <FaHistory className="text-2xl mb-1" />
            <span className="text-xs font-medium">Historial</span>
          </button>

          <button className="flex flex-col items-center text-blue-600">
            <FaQrcode className="text-2xl mb-1" />
            <span className="text-xs font-medium">Mi QR</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
