"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { useToast } from "@/app/context/ToastContext";
import { useConfirm } from "@/app/context/ConfirmContext";
import {
  cashRegisterService,
  CashReport,
  CashReportPreview,
} from "@/app/lib/supabase/cashRegister";
import {
  FaCashRegister,
  FaLockOpen,
  FaLock,
  FaSpinner,
  FaTrash,
  FaTimes,
} from "react-icons/fa";

interface CashRegisterManagementProps {
  onError: (error: string) => void;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  terminal: "Tarjeta",
  usd: "Dólares",
  mixed: "Mixto",
};

export default function CashRegisterManagement({ onError }: CashRegisterManagementProps) {
  const { toast } = useToast();
  const { confirm } = useConfirm();

  const [reports, setReports] = useState<CashReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [openReport, setOpenReport] = useState<CashReport | null>(null);
  const [checkingOpen, setCheckingOpen] = useState(true);

  const [showOpenForm, setShowOpenForm] = useState(false);
  const [openingCashInput, setOpeningCashInput] = useState("");
  const [opening, setOpening] = useState(false);

  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closePreview, setClosePreview] = useState<CashReportPreview | null>(null);
  const [closePreviewLoading, setClosePreviewLoading] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [closing, setClosing] = useState(false);

  const [selectedReport, setSelectedReport] = useState<CashReport | null>(null);

  useEffect(() => {
    loadReports();
    checkOpenReport();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await cashRegisterService.getAllReports();
      setReports(data);
    } catch {
      onError("Error cargando los reportes de caja");
    } finally {
      setLoading(false);
    }
  };

  const checkOpenReport = async () => {
    setCheckingOpen(true);
    try {
      const data = await cashRegisterService.getOpenReport();
      setOpenReport(data);
    } catch {
      onError("Error verificando si hay una caja abierta");
    } finally {
      setCheckingOpen(false);
    }
  };

  const numOr0 = (s: string) => (s.trim() === "" ? 0 : parseFloat(s)) || 0;

  const handleOpenRegister = async () => {
    if (openingCashInput.trim() === "") {
      toast("Ingresa el efectivo inicial", "warning");
      return;
    }
    setOpening(true);
    try {
      const created = await cashRegisterService.openRegister(numOr0(openingCashInput), currentUserId);
      setOpenReport(created);
      setShowOpenForm(false);
      setOpeningCashInput("");
      toast("Caja abierta", "success");
    } catch (err) {
      console.error(err);
      onError(err instanceof Error ? err.message : "Error abriendo la caja");
    } finally {
      setOpening(false);
    }
  };

  const openCloseForm = async () => {
    if (!openReport) return;
    setShowCloseForm(true);
    setClosePreviewLoading(true);
    try {
      const preview = await cashRegisterService.previewClose(openReport);
      setClosePreview(preview);
    } catch {
      onError("Error calculando el resumen de la caja");
    } finally {
      setClosePreviewLoading(false);
    }
  };

  const expectedCash = openReport && closePreview
    ? openReport.opening_cash + closePreview.cash_sales - closePreview.cash_tips
    : 0;
  const cashDifference = numOr0(countedCash) - expectedCash;

  const handleCloseRegister = async () => {
    if (!openReport) return;
    if (countedCash.trim() === "") {
      toast("Ingresa el efectivo contado", "warning");
      return;
    }
    setClosing(true);
    try {
      await cashRegisterService.closeRegister(
        openReport,
        numOr0(countedCash),
        closeNotes.trim() || null,
        currentUserId,
      );
      toast("Caja cerrada", "success");
      setShowCloseForm(false);
      setOpenReport(null);
      setClosePreview(null);
      setCountedCash("");
      setCloseNotes("");
      await loadReports();
    } catch (err) {
      console.error(err);
      onError("Error cerrando la caja");
    } finally {
      setClosing(false);
    }
  };

  const handleDelete = async (report: CashReport) => {
    const ok = await confirm({
      title: "Eliminar reporte de caja",
      message: `¿Eliminar el corte de caja #${report.report_number}? Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
      type: "danger",
    });
    if (!ok) return;

    try {
      await cashRegisterService.deleteReport(report.id);
      toast("Reporte eliminado", "success");
      if (selectedReport?.id === report.id) setSelectedReport(null);
      await loadReports();
    } catch {
      onError("Error eliminando el reporte");
    }
  };

  const inputBase =
    "w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-sm text-[oklch(20%_0.02_260)] outline-none transition-all duration-150 focus:border-[oklch(62%_0.18_32)] focus:shadow-[0_0_0_4px_oklch(96%_0.05_32)] focus:bg-white placeholder:text-[oklch(72%_0.01_260)]";
  const labelBase =
    "block text-[11px] font-bold text-[oklch(45%_0.02_260)] uppercase tracking-wider mb-2";

  const diffBadge = (diff: number) => {
    if (Math.abs(diff) < 0.01)
      return <span className="px-2.5 py-1 text-[10px] font-bold rounded-[6px] bg-emerald-50 text-emerald-700">Exacto</span>;
    if (diff > 0)
      return <span className="px-2.5 py-1 text-[10px] font-bold rounded-[6px] bg-blue-50 text-blue-700">Sobrante +{formatCurrency(diff)}</span>;
    return <span className="px-2.5 py-1 text-[10px] font-bold rounded-[6px] bg-red-50 text-red-600">Faltante {formatCurrency(diff)}</span>;
  };

  const paymentBreakdown = (preview: CashReportPreview, kind: "sales" | "tips") => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      {(["cash", "terminal", "usd", "mixed"] as const).map((m) => (
        <div key={m}>
          <p className="text-slate-500">
            {PAYMENT_LABELS[m]}
            {m === "mixed" && <span className="text-amber-600"> (no incluido)</span>}
          </p>
          <p className="font-bold text-slate-900">
            {formatCurrency(preview[`${m}_${kind}` as keyof CashReportPreview] as number)}
          </p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-5" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <div>
        <h2 className="text-[18px] font-extrabold text-slate-900">Gestión de Caja</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">Abrir/cerrar caja y reportes anteriores</p>
      </div>

      {checkingOpen ? (
        <div className="bg-white border border-slate-200 rounded-[14px] p-8 text-center">
          <FaSpinner className="animate-spin text-xl text-[var(--color-accent)] mx-auto" />
        </div>
      ) : openReport ? (
        <div className="bg-white rounded-2xl border border-emerald-200 shadow-[0_2px_16px_oklch(0%_0_0_/_0.06)] p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-emerald-50 flex items-center justify-center">
                <FaLockOpen className="text-emerald-600 text-sm" />
              </div>
              <div>
                <p className="text-[15px] font-extrabold text-slate-900">Caja Abierta</p>
                <p className="text-[11px] text-slate-500">
                  Desde {formatDateTime(openReport.opened_at)} · Efectivo inicial: <strong>{formatCurrency(openReport.opening_cash)}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={openCloseForm}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-[var(--color-accent)] text-white text-xs font-bold hover:brightness-90 transition"
            >
              <FaLock className="text-[11px]" />
              Cerrar Caja
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[oklch(92%_0.01_260)] shadow-[0_2px_16px_oklch(0%_0_0_/_0.06)] p-6">
          {!showOpenForm ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
                  <FaCashRegister className="text-[oklch(62%_0.18_32)] text-sm" />
                </div>
                <div>
                  <p className="text-[15px] font-extrabold text-slate-900">No hay caja abierta</p>
                  <p className="text-[11px] text-slate-500">Abre la caja para empezar a registrar el turno</p>
                </div>
              </div>
              <button
                onClick={() => setShowOpenForm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-[var(--color-accent)] text-white text-xs font-bold hover:brightness-90 transition"
              >
                <FaLockOpen className="text-[11px]" />
                Abrir Caja
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-[15px] font-extrabold text-slate-900">Abrir Caja</p>
                <p className="text-[11px] text-slate-500">Ingresa el efectivo con el que arranca la caja</p>
              </div>
              <div>
                <label className={labelBase}>Efectivo inicial *</label>
                <input
                  type="number"
                  step="0.01"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(e.target.value)}
                  className={inputBase}
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={handleOpenRegister}
                  disabled={opening}
                  className="flex-1 py-3 rounded-xl bg-[oklch(62%_0.18_32)] text-white text-sm font-bold tracking-tight transition-all duration-150 hover:bg-[oklch(50%_0.18_32)] disabled:opacity-50"
                >
                  {opening ? "Abriendo..." : "Abrir Caja"}
                </button>
                <button
                  onClick={() => { setShowOpenForm(false); setOpeningCashInput(""); }}
                  className="px-5 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-[oklch(45%_0.02_260)] text-sm font-semibold hover:bg-[oklch(96%_0.005_260)]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showCloseForm && openReport && (
        <div className="bg-white rounded-2xl border border-[oklch(92%_0.01_260)] shadow-[0_2px_16px_oklch(0%_0_0_/_0.06)] p-6 animate-fadeUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
              <FaLock className="text-[oklch(62%_0.18_32)] text-sm" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-[oklch(18%_0.02_260)] leading-tight">Cerrar Caja</p>
              <p className="text-[11px] text-[oklch(55%_0.02_260)]">
                Periodo: {formatDateTime(openReport.opened_at)} → ahora. Tasa de impuesto: 16%.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {closePreviewLoading ? (
              <div className="text-center py-8">
                <FaSpinner className="animate-spin text-xl text-[var(--color-accent)] mx-auto" />
              </div>
            ) : closePreview && (
              <div className="bg-[oklch(98.5%_0.005_80)] rounded-xl border border-[oklch(90%_0.01_260)] p-4 space-y-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ventas del periodo (calculado)</p>
                {paymentBreakdown(closePreview, "sales")}
                <div className="flex justify-between border-t border-[oklch(90%_0.01_260)] pt-3 text-xs">
                  <span className="text-slate-500">Cuentas cobradas: <strong className="text-slate-900">{closePreview.paid_accounts_count}</strong></span>
                  <span className="text-slate-500">Cuenta promedio: <strong className="text-slate-900">{formatCurrency(closePreview.average_ticket)}</strong></span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Subtotal: <strong className="text-slate-900">{formatCurrency(closePreview.subtotal)}</strong></span>
                  <span className="text-slate-500">Impuestos (16%): <strong className="text-slate-900">{formatCurrency(closePreview.tax_amount)}</strong></span>
                  <span className="text-slate-500">Total: <strong className="text-slate-900">{formatCurrency(closePreview.total_sales)}</strong></span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-2">Propinas del periodo (calculado)</p>
                {paymentBreakdown(closePreview, "tips")}
                <div className="text-xs">
                  <span className="text-slate-500">Total propinas: <strong className="text-slate-900">{formatCurrency(closePreview.total_tips)}</strong></span>
                </div>
              </div>
            )}

            <div>
              <label className={labelBase}>Efectivo contado *</label>
              <input
                type="number"
                step="0.01"
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                className={inputBase}
                placeholder="0.00"
              />
              {closePreview && (
                <div className="mt-4 flex flex-wrap items-center gap-3 bg-white border border-[oklch(90%_0.01_260)] rounded-xl px-4 py-3 text-xs">
                  <span className="text-slate-500">Efectivo esperado: <strong className="text-slate-900">{formatCurrency(expectedCash)}</strong></span>
                  {diffBadge(cashDifference)}
                </div>
              )}
            </div>

            <div>
              <label className={labelBase}>Notas</label>
              <textarea
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                rows={2}
                className={`${inputBase} resize-none`}
                placeholder="Notas opcionales sobre este corte de caja"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCloseRegister}
                disabled={closing || closePreviewLoading}
                className="flex-1 py-3 rounded-xl bg-[oklch(62%_0.18_32)] text-white text-sm font-bold tracking-tight transition-all duration-150 hover:bg-[oklch(50%_0.18_32)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {closing ? "Cerrando..." : "Cerrar Caja"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCloseForm(false);
                  setClosePreview(null);
                  setCountedCash("");
                  setCloseNotes("");
                }}
                className="px-5 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-[oklch(45%_0.02_260)] text-sm font-semibold hover:bg-[oklch(96%_0.005_260)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-2xl text-[var(--color-accent)] mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Cargando reportes...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[14px] p-12 text-center">
          <FaCashRegister className="text-3xl text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aún no hay reportes de caja cerrados</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">#</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">PERIODO</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">VENTA TOTAL</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">EFECTIVO</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedReport(r)}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-700">#{r.report_number}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-slate-900">
                    {formatDateTime(r.opened_at)} → {r.closed_at ? formatDateTime(r.closed_at) : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-900">{formatCurrency(r.total_sales)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{diffBadge(r.cash_difference)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(r);
                      }}
                      className="p-1.5 rounded-[7px] text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <FaTrash className="text-[11px]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReport && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white rounded-[18px] shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <p className="text-[15px] font-extrabold text-slate-900">
                  Corte de Caja #{selectedReport.report_number}
                </p>
                <p className="text-[11px] text-slate-500">
                  {formatDateTime(selectedReport.opened_at)} → {selectedReport.closed_at ? formatDateTime(selectedReport.closed_at) : "—"}
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
                <FaTimes />
              </button>
            </div>

            <div className="p-6 space-y-5 text-sm">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Ventas por método de pago</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p className="text-slate-500">Efectivo: <strong className="text-slate-900">{formatCurrency(selectedReport.cash_sales)}</strong></p>
                  <p className="text-slate-500">Tarjeta: <strong className="text-slate-900">{formatCurrency(selectedReport.terminal_sales)}</strong></p>
                  <p className="text-slate-500">Dólares: <strong className="text-slate-900">{formatCurrency(selectedReport.usd_sales)}</strong></p>
                  <p className="text-slate-500">Mixto <span className="text-amber-600">(no incluido)</span>: <strong className="text-slate-900">{formatCurrency(selectedReport.mixed_sales)}</strong></p>
                </div>
                <p className="text-xs mt-2 text-slate-500">Total ventas: <strong className="text-slate-900">{formatCurrency(selectedReport.total_sales)}</strong></p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Propinas por método de pago</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p className="text-slate-500">Efectivo: <strong className="text-slate-900">{formatCurrency(selectedReport.cash_tips)}</strong></p>
                  <p className="text-slate-500">Tarjeta: <strong className="text-slate-900">{formatCurrency(selectedReport.terminal_tips)}</strong></p>
                  <p className="text-slate-500">Dólares: <strong className="text-slate-900">{formatCurrency(selectedReport.usd_tips)}</strong></p>
                  <p className="text-slate-500">Mixto <span className="text-amber-600">(no incluido)</span>: <strong className="text-slate-900">{formatCurrency(selectedReport.mixed_tips)}</strong></p>
                </div>
                <p className="text-xs mt-2 text-slate-500">Total propinas: <strong className="text-slate-900">{formatCurrency(selectedReport.total_tips)}</strong></p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Venta</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p className="text-slate-500">Cuentas cobradas: <strong className="text-slate-900">{selectedReport.paid_accounts_count}</strong></p>
                  <p className="text-slate-500">Cuenta promedio: <strong className="text-slate-900">{formatCurrency(selectedReport.average_ticket)}</strong></p>
                  <p className="text-slate-500">Subtotal: <strong className="text-slate-900">{formatCurrency(selectedReport.subtotal)}</strong></p>
                  <p className="text-slate-500">Impuestos (16%): <strong className="text-slate-900">{formatCurrency(selectedReport.tax_amount)}</strong></p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Reconciliación de efectivo</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p className="text-slate-500">Efectivo inicial: <strong className="text-slate-900">{formatCurrency(selectedReport.opening_cash)}</strong></p>
                  <p className="text-slate-500">Ventas en efectivo: <strong className="text-slate-900">{formatCurrency(selectedReport.cash_sales)}</strong></p>
                  <p className="text-slate-500">Propinas pagadas (efectivo): <strong className="text-slate-900">{formatCurrency(selectedReport.cash_tips)}</strong></p>
                  <p className="text-slate-500">Efectivo esperado: <strong className="text-slate-900">{formatCurrency(selectedReport.expected_cash)}</strong></p>
                  <p className="text-slate-500">Efectivo contado: <strong className="text-slate-900">{formatCurrency(selectedReport.counted_cash ?? 0)}</strong></p>
                </div>
                <div className="mt-2">{diffBadge(selectedReport.cash_difference)}</div>
              </div>

              {selectedReport.notes && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Notas</p>
                  <p className="text-xs text-slate-700">{selectedReport.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
