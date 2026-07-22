"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { sessionsService } from "@/app/lib/supabase/sessions";
import { FaSpinner } from "react-icons/fa";

interface SessionRow {
  id: string;
  waiter_id: string;
  waiter_name: string;
  started_at: string;
  ended_at: string | null;
  total_sales: number;
  total_tips: number;
}

export default function SessionsView() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();

    const sub = supabase
      .channel("admin-sessions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "waiter_sessions" },
        loadSessions,
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionsService.getAllSessionsWithTips();
      setSessions(data as SessionRow[]);
    } catch (e) {
      console.error("Error cargando turnos:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (n: number) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalVentas = sessions.reduce((s, r) => s + r.total_sales, 0);
  const totalPropinas = sessions.reduce((s, r) => s + r.total_tips, 0);

  if (loading) {
    return (
      <div className="text-center py-12">
        <FaSpinner className="animate-spin text-2xl text-[var(--color-accent)] mx-auto" />
        <p className="text-slate-500 mt-4 text-sm font-medium">Cargando turnos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-5">
        <h2 className="text-[18px] font-extrabold text-slate-900">Turnos de Meseros</h2>
      </div>

      <div className="flex gap-4 mb-5">
        <div className="bg-white border border-slate-200 rounded-[14px] px-5 py-4 flex-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total ventas</p>
          <p className="text-[22px] font-extrabold text-slate-900 mt-1">{formatCurrency(totalVentas)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-[14px] px-5 py-4 flex-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total propinas</p>
          <p className="text-[22px] font-extrabold text-emerald-600 mt-1">{formatCurrency(totalPropinas)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-[14px] px-5 py-4 flex-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Turnos registrados</p>
          <p className="text-[22px] font-extrabold text-slate-900 mt-1">{sessions.length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Mesero</th>
                <th className="text-left p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Inicio</th>
                <th className="text-left p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Fin</th>
                <th className="text-right p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ventas</th>
                <th className="text-right p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Propinas</th>
                <th className="text-right p-4 text-[11px] font-bold text-slate-500 uppercase tracking-wide">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                    No hay turnos registrados
                  </td>
                </tr>
              )}
              {sessions.map((s) => {
                const start = new Date(s.started_at);
                const end = s.ended_at ? new Date(s.ended_at) : null;
                const duration = end
                  ? Math.round((end.getTime() - start.getTime()) / 60000)
                  : null;
                const durStr = duration !== null
                  ? duration >= 60
                    ? `${Math.floor(duration / 60)}h ${duration % 60}m`
                    : `${duration}m`
                  : "—";

                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">{s.waiter_name}</td>
                    <td className="p-4 text-slate-600">
                      <span className="block">{formatDate(s.started_at)}</span>
                      <span className="text-[11px] text-slate-400">{formatTime(s.started_at)}</span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {end ? (
                        <>
                          <span className="block">{formatDate(s.ended_at!)}</span>
                          <span className="text-[11px] text-slate-400">{formatTime(s.ended_at!)}</span>
                        </>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Activo</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(s.total_sales)}</td>
                    <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(s.total_tips)}</td>
                    <td className="p-4 text-right text-slate-500">{durStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
