// app/customer/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";
import { tablesService, Table } from "@/app/lib/supabase/tables";
import { ordersService } from "@/app/lib/supabase/orders";
import { notificationsService } from "@/app/lib/supabase/notifications";
import { FaExclamationTriangle } from "react-icons/fa";

const PageShell = ({ children, tableInfo }: { children: React.ReactNode; tableInfo?: { number: number; status: string } | null }) => (
  <div className="flex flex-col min-h-screen bg-white font-['Plus_Jakarta_Sans']">
    <header className="px-10 py-5 flex items-center justify-between border-b border-[oklch(88%_0.01_260)] animate-[fadeDown_0.4s_ease_both]">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[oklch(62%_0.18_32)] flex items-center justify-center text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
            <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
            <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
            <path d="M14 14h3v3"/><path d="M21 14v.01"/><path d="M21 21v-4"/><path d="M14 21h7"/>
          </svg>
        </div>
        <span className="text-[oklch(62%_0.18_32)] font-extrabold text-lg tracking-tight">ScanEat</span>
      </div>
      {tableInfo ? (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${tableInfo.status === 'available' ? 'bg-[oklch(96%_0.05_32)]' : 'bg-[oklch(92%_0.06_40)]'}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${tableInfo.status === 'available' ? 'bg-[oklch(62%_0.18_32)]' : 'bg-[oklch(62%_0.18_32)]'}`}></div>
          <span className={`text-xs font-bold tracking-wider uppercase ${tableInfo.status === 'available' ? 'text-[oklch(62%_0.18_32)]' : 'text-[oklch(48%_0.14_37)]'}`}>
            Mesa {tableInfo.number} — {tableInfo.status === 'available' ? 'Disponible' : 'Ocupado'}
          </span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[oklch(92%_0.06_40)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[oklch(62%_0.18_32)]"></div>
          <span className="text-xs font-bold tracking-wider uppercase text-[oklch(62%_0.18_32)]">Sin mesa</span>
        </div>
      )}
    </header>

    <main className="flex-1 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>

    <footer className="px-10 py-4 border-t border-[oklch(88%_0.01_260)] flex items-center justify-center">
      <span className="text-xs text-[oklch(62%_0.18_32)]">© 2026 ScanEat — Todos los derechos reservados.</span>
    </footer>
  </div>
);

const LoadingCard = ({ label }: { label: string }) => (
  <PageShell>
    <div className="text-center animate-[fadeUp_0.4s_ease_both]">
      <div className="flex justify-center mb-5">
        <div className="w-12 h-12 rounded-[14px] flex items-center justify-center" style={{ background:"oklch(62% 0.18 32)" }}>
          <svg className="animate-[spin_0.9s_linear_infinite]" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </div>
      </div>
      <p className="text-sm text-[oklch(55%_0.02_260)]">{label}</p>
    </div>
  </PageShell>
);

const StepsCard = () => {
  const steps = [
    { text: "Busca el código QR en tu mesa" },
    { text: "Escanea el código con tu cámara" },
    { text: "Ingresa tu nombre y comienza a ordenar" },
  ];
  return (
    <div className="bg-[oklch(98.5%_0.005_80)] border border-[oklch(88%_0.01_260)] rounded-xl px-5 py-4 mb-7">
      <div className="flex items-center gap-2 mb-4">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
          <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
          <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
          <path d="M14 14h3v3"/><path d="M21 14v.01"/><path d="M21 21v-4"/><path d="M14 21h7"/>
        </svg>
        <span className="text-sm font-bold text-[oklch(20%_0.02_260)]">¿Cómo ingresar?</span>
      </div>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-[oklch(96%_0.01_80)] transition-colors duration-150">
          <div className="w-6 h-6 rounded-lg bg-[oklch(96%_0.05_32)] flex items-center justify-center text-[oklch(62%_0.18_32)] flex-shrink-0 text-xs font-extrabold">
            {i + 1}
          </div>
          <span className="text-sm font-medium text-[oklch(20%_0.02_260)]">{s.text}</span>
        </div>
      ))}
    </div>
  );
};

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
  const [paramsChecked, setParamsChecked] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const selectedTableData = tables.find((t) => t.number === selectedTable);
  const tableInfo = selectedTableData ? { number: selectedTableData.number, status: selectedTableData.status } : null;

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tableParam = urlParams.get("table");
    const redirectedParam = urlParams.get("redirected");
    setTableFromParams(tableParam);
    setRedirected(!!redirectedParam);
    setParamsChecked(true);
    if (redirectedParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      setTimeout(() => { alert("¡Gracias por su visita! Esperamos verlo pronto."); }, 500);
    }
  }, []);

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
      if (!isNaN(tableNumber)) setSelectedTable(tableNumber);
    }
  };

  const validateForm = () => {
    if (!selectedTable) { setError("No se ha especificado una mesa"); return false; }
    const table = tables.find((t) => t.number === selectedTable);
    if (!table) { setError("Mesa no encontrada"); return false; }
    const trimmedName = customerName.trim();
    if (!trimmedName) { setNameError("El nombre es obligatorio"); return false; }
    if (trimmedName.length < 2) { setNameError("El nombre debe tener al menos 2 caracteres"); return false; }
    setError(""); setNameError(""); return true;
  };

  const handleRegisterAndRedirect = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const table = tables.find((t) => t.number === selectedTable);
      if (!table) { setError("Mesa no encontrada"); return; }
      const order = await ordersService.createOrder(table.id, customerName.trim());
      if (table.status === "available") await tablesService.updateTableStatus(table.id, "occupied");
      await notificationsService.createNotification(table.id, "new_order", `Nuevo cliente en Mesa ${table.number} - ${customerName.trim()}`, order.id);
      setSession({ tableId: table.id.toString(), userId: order.id, orderId: order.id, customerName: customerName.trim(), tableNumber: table.number });
      router.push("/customer/menu");
    } catch (err) {
      setError("Error al crear la orden");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!paramsChecked) return <LoadingCard label="Verificando información de la mesa" />;

  if (!tableFromParams) {
    return (
      <PageShell>
        <div className="animate-[fadeUp_0.4s_ease_both]">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[oklch(62%_0.18_32)] flex items-center justify-center text-white mx-auto mb-5 animate-[pulse_2.4s_ease_infinite]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
                <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/>
                <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
                <path d="M14 14h3v3"/><path d="M21 14v.01"/><path d="M21 21v-4"/><path d="M14 21h7"/>
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-[oklch(20%_0.02_260)] tracking-tight mb-2">
              Bienvenido a <span className="text-[oklch(62%_0.18_32)]">ScanEat</span>
            </h1>
            <p className="text-sm text-[oklch(55%_0.02_260)] leading-relaxed">
              Escanea el código QR de tu mesa para comenzar
            </p>
          </div>
          <StepsCard />
          <div className="flex flex-col gap-1.5 text-center">
            <p className="text-xs text-[oklch(62%_0.18_32)] flex items-center justify-center gap-1.5">            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>
              </svg>
              Cada mesa tiene un código QR único para identificar tu orden.
            </p>
            <p className="text-xs text-[oklch(62%_0.18_32)]">Pregunta al personal si necesitas ayuda.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (loadingTables) return <LoadingCard label={`Verificando mesa ${tableFromParams}`} />;

  return (
    <PageShell tableInfo={tableInfo}>
      <div className="animate-[fadeUp_0.4s_ease_both]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[oklch(62%_0.18_32)] flex items-center justify-center text-white mx-auto mb-5 animate-[pulse_2.4s_ease_infinite]">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-[oklch(20%_0.02_260)] tracking-tight mb-2">
            ¿Cómo te llamas?
          </h2>
          <p className="text-sm text-[oklch(55%_0.02_260)] leading-relaxed">
            Mesa {selectedTable} — Ingresa tu nombre para identificar tu pedido
          </p>
        </div>

        {(error || nameError) && (
          <div className="bg-[oklch(95%_0.02_20)] border border-[oklch(80%_0.06_20)] rounded-lg px-4 py-3 mb-4 flex items-center gap-2.5">
            <FaExclamationTriangle className="text-[oklch(55%_0.18_20)] flex-shrink-0" />
            <span className="text-sm text-[oklch(30%_0.10_20)] font-medium">{error || nameError}</span>
          </div>
        )}

        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${(nameError || error) ? 'border-[oklch(55%_0.18_20)] bg-white' : inputFocused ? 'border-[oklch(62%_0.18_32)] bg-white shadow-[0_0_0_4px_oklch(92%_0.05_32)]' : 'border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)]'}`}>
          <span className={inputFocused ? 'text-[oklch(62%_0.18_32)]' : 'text-[oklch(62%_0.18_32)]'}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Tu nombre"
            value={customerName}
            onChange={(e) => { setCustomerName(e.target.value); setNameError(""); setError(""); }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={(e) => { if (e.key === "Enter") handleRegisterAndRedirect(); }}
            className="flex-1 border-none outline-none bg-transparent text-sm font-medium text-[oklch(20%_0.02_260)] placeholder:text-[oklch(55%_0.02_260)]"
          />
        </div>

        <button
          onClick={handleRegisterAndRedirect}
          disabled={loading || !customerName.trim() || !selectedTableData}
          className="w-full mt-2 px-6 py-3.5 rounded-xl border-none cursor-pointer bg-[oklch(62%_0.18_32)] text-white text-sm font-bold tracking-tight flex items-center justify-center gap-2.5 hover:bg-[oklch(50%_0.18_32)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_oklch(55%_0.18_32_/_0.35)] transition-all duration-180 disabled:bg-[oklch(88%_0.01_260)] disabled:text-[oklch(55%_0.02_260)] disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {loading ? (
            <>
              <svg className="animate-[spin_0.9s_linear_infinite]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
              </svg>
              Creando tu orden…
            </>
          ) : (
            <>
              Continuar al menú
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
              </svg>
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => { localStorage.clear(); window.location.href = "/customer"; }}
            className="text-xs text-[oklch(62%_0.18_32)] bg-transparent border-none cursor-pointer underline hover:text-[oklch(50%_0.18_32)]"
          >
            ¿Escaneaste el código QR incorrecto? Haz clic aquí
          </button>
        </div>
      </div>
    </PageShell>
  );
}