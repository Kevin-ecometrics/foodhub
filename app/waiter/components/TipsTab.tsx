"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/app/lib/supabase/client";
import { tipsService } from "@/app/lib/supabase/tips";
import { FaSpinner } from "react-icons/fa";
import type { Tip } from "@/app/lib/supabase/tips";

interface TipsTabProps {
  waiterId: string;
  sessionStartedAt: string;
  waiterName: string;
}

const formatCurrency = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 });

export default function TipsTab({ waiterId, sessionStartedAt, waiterName }: TipsTabProps) {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [distributionLoading, setDistributionLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    loadTips();
    loadDistribution();

    const channelStatus: Record<string, string> = {};
    channelRef.current = supabase
      .channel("waiter-tips")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tips", filter: `waiter_id=eq.${waiterId}` },
        () => loadTips(),
      )
      .subscribe((status) => {
        const prev = channelStatus["tips"];
        channelStatus["tips"] = status;
        if (prev && ["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(prev) && status === "SUBSCRIBED") {
          loadTips();
        }
      });

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [waiterId]);

  const loadTips = async () => {
    try {
      const data = await tipsService.getTipsByWaiterAndSession(waiterId, sessionStartedAt);
      setTips(data);
    } catch (e) {
      console.error("Error cargando propinas:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadDistribution = async () => {
    try {
      const res = await fetch("/api/settings/public");
      const json = await res.json();
      const settings = json.settings || {};
      setDistribution(settings.tip_distribution || {});
    } catch {
      setDistribution({});
    } finally {
      setDistributionLoading(false);
    }
  };

  const totalTips = tips.reduce((s, t) => s + t.amount, 0);
  const entries = Object.entries(distribution).filter(([, pct]) => pct > 0);
  const totalPct = entries.reduce((s, [, pct]) => s + pct, 0);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <FaSpinner className="animate-spin" style={{ fontSize: 22, color: "var(--accent)" }} />
        <p style={{ color: "var(--muted)", marginTop: 12, fontSize: 13 }}>Cargando propinas...</p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          background: "var(--accent-light)",
          borderRadius: 14,
          padding: "18px 20px",
          marginBottom: 16,
          border: "1.5px solid var(--accent)",
        }}
      >
        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", margin: 0, marginBottom: 4 }}>
          {waiterName}
        </p>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, marginBottom: 8 }}>
          Propinas de la sesión activa
        </p>
        <p style={{ fontSize: 28, fontWeight: 800, color: "var(--accent)", margin: 0 }}>
          {formatCurrency(totalTips)}
        </p>
      </div>

      {!distributionLoading && entries.length > 0 && totalTips > 0 && (
        <div
          style={{
            border: "1.5px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              padding: "12px 18px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Distribución
            </p>
          </div>
          <div style={{ padding: "8px 18px" }}>
            {entries.map(([role, pct]) => {
              const amount = totalTips * (pct / 100);
              return (
                <div
                  key={role}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>{role}</span>
                  <span style={{ color: "var(--muted)" }}>{pct}%</span>
                  <span style={{ fontWeight: 700, color: "var(--green)" }}>{formatCurrency(amount)}</span>
                </div>
              );
            })}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0 6px",
                fontSize: 13,
                fontWeight: 800,
                color: "var(--text)",
              }}
            >
              <span>Total %</span>
              <span>{totalPct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {tips.length > 0 && (
        <div style={{ border: "1.5px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
          <div
            style={{
              background: "var(--surface)",
              padding: "12px 18px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Últimas propinas
            </p>
          </div>
          <div style={{ padding: "6px 18px" }}>
            {tips.slice(0, 20).map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>
                    Mesa {t.table_id}
                  </span>
                  {t.customer_name && (
                    <span style={{ color: "var(--muted)", marginLeft: 6 }}>
                      — {t.customer_name}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "var(--muted)", fontSize: 11 }}>{formatTime(t.created_at)}</span>
                  <span style={{ fontWeight: 700, color: "var(--green)" }}>{formatCurrency(t.amount)}</span>
                </div>
              </div>
            ))}
            {tips.length > 20 && (
              <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", padding: "10px 0 6px" }}>
                y {tips.length - 20} más
              </p>
            )}
          </div>
        </div>
      )}

      {tips.length === 0 && (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ fontSize: 13, color: "var(--muted)" }}>No hay propinas registradas en esta sesión</p>
        </div>
      )}
    </div>
  );
}
