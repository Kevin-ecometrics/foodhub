"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { useToast } from "@/app/context/ToastContext";
import {
  tipLedgerService,
  TipBalance,
  TipPayout,
} from "@/app/lib/supabase/tipLedger";
import {
  FaCoins,
  FaSpinner,
  FaHandHoldingUsd,
  FaTimes,
  FaUserFriends,
  FaUsers,
} from "react-icons/fa";

interface PropinasManagementProps {
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

export default function PropinasManagement({ onError }: PropinasManagementProps) {
  const { toast } = useToast();

  const [balances, setBalances] = useState<TipBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [payouts, setPayouts] = useState<TipPayout[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(false);

  const [payingRecipient, setPayingRecipient] = useState<TipBalance | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    loadBalances();
    loadPayouts();
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const loadBalances = async () => {
    setLoading(true);
    try {
      const data = await tipLedgerService.getAllBalances();
      setBalances(data);
    } catch {
      onError("Error cargando los saldos de propinas");
    } finally {
      setLoading(false);
    }
  };

  const loadPayouts = async () => {
    setLoadingPayouts(true);
    try {
      const data = await tipLedgerService.getRecentPayouts();
      setPayouts(data);
    } catch {
      onError("Error cargando el historial de pagos");
    } finally {
      setLoadingPayouts(false);
    }
  };

  const openPayModal = (balance: TipBalance) => {
    setPayingRecipient(balance);
    setPayAmount(balance.balance.toFixed(2));
    setPayNotes("");
  };

  const closePayModal = () => {
    setPayingRecipient(null);
    setPayAmount("");
    setPayNotes("");
  };

  const confirmPay = async () => {
    if (!payingRecipient) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      onError("Ingresa un monto válido");
      return;
    }

    setPaying(true);
    try {
      await tipLedgerService.markAsPaid(
        payingRecipient.recipient_type,
        payingRecipient.recipient_key,
        payingRecipient.recipient_name,
        amount,
        currentUserId,
        payNotes.trim() || null,
      );
      toast("Pago registrado", "success");
      closePayModal();
      await Promise.all([loadBalances(), loadPayouts()]);
    } catch {
      onError("Error registrando el pago");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <div>
        <h2 className="text-[18px] font-extrabold text-slate-900">Propinas</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Saldo acumulado por mesero y por rol de reparto — solo cuenta como &quot;propinas pagadas&quot; en el corte de caja hasta que se marca como pagado aquí
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-2xl text-[var(--color-accent)] mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Cargando saldos...</p>
        </div>
      ) : balances.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[14px] p-12 text-center">
          <FaCoins className="text-3xl text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm font-medium">Aún no hay meseros ni roles configurados</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">NOMBRE</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">TIPO</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ACUMULADO</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">PAGADO</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">SALDO PENDIENTE</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {balances.map((b) => (
                <tr key={`${b.recipient_type}:${b.recipient_key}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-900">{b.recipient_name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold ${
                        b.recipient_type === "waiter" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {b.recipient_type === "waiter" ? <FaUserFriends className="text-[9px]" /> : <FaUsers className="text-[9px]" />}
                      {b.recipient_type === "waiter" ? "Mesero" : "Rol"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{formatCurrency(b.accrued)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{formatCurrency(b.paid)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-bold">
                    <span className={b.balance > 0.01 ? "text-red-600" : "text-emerald-600"}>
                      {formatCurrency(b.balance)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => openPayModal(b)}
                      disabled={b.balance <= 0.01}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[var(--color-accent)] text-white text-[11px] font-bold hover:brightness-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <FaHandHoldingUsd className="text-[11px]" />
                      Marcar como pagado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div>
        <h3 className="text-[13px] font-extrabold text-slate-900 mb-2">Historial de pagos recientes</h3>
        {loadingPayouts ? (
          <div className="text-center py-8">
            <FaSpinner className="animate-spin text-xl text-[var(--color-accent)] mx-auto" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-[14px] p-8 text-center">
            <p className="text-slate-500 text-xs font-medium">Aún no se ha marcado ningún pago</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">FECHA</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">DESTINATARIO</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">MONTO</th>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">NOTAS</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">{formatDateTime(p.paid_at)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-slate-900">{p.recipient_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payingRecipient && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4"
          onClick={closePayModal}
        >
          <div
            className="bg-white rounded-[18px] shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-base font-extrabold text-slate-900">Marcar como pagado</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{payingRecipient.recipient_name}</p>
              </div>
              <button onClick={closePayModal} className="p-1.5 rounded-full hover:bg-slate-100 transition">
                <FaTimes className="text-slate-400 text-sm" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Saldo pendiente: <strong className="text-slate-900">{formatCurrency(payingRecipient.balance)}</strong>
              </p>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Monto a pagar
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 text-sm outline-none focus:border-[var(--color-accent)] focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Notas (opcional)
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Ej. pagado en efectivo el viernes"
                  className="w-full px-4 py-3 rounded-xl border-[1.5px] border-slate-200 bg-slate-50 text-sm outline-none focus:border-[var(--color-accent)] focus:bg-white transition"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-2">
              <button
                onClick={closePayModal}
                className="flex-1 px-4 py-2.5 rounded-[9px] border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmPay}
                disabled={paying}
                className="flex-1 px-4 py-2.5 rounded-[9px] bg-[var(--color-accent)] text-white text-xs font-bold hover:brightness-90 transition disabled:opacity-60"
              >
                {paying ? "Guardando..." : "Confirmar pago"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
