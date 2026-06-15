/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useRef } from "react";
import {
  waiterService,
  WaiterNotification,
  TableWithOrder,
} from "@/app/lib/supabase/waiter";
import { supabase } from "@/app/lib/supabase/client";
import { useToast } from "@/app/context/ToastContext";
import Header from "./components/Header";
import Tabs from "./components/Tabs";
import NotificationsTab from "./components/NotificationsTab";
import TablesTab from "./components/TablesTab";
import ProductsManagement from "./components/ProductsManagement";
import LoadingScreen from "./components/LoadingScreen";
import {
  FaMoneyBillWave,
  FaCreditCard,
  FaDollarSign,
  FaExchangeAlt,
  FaTimes,
  FaUsers,
  FaUserPlus,
  FaTrash,
  FaCheck,
  FaUtensils,
} from "react-icons/fa";

import { tipsService } from "@/app/lib/supabase/tips";

// Clave para localStorage
const USD_RATE_STORAGE_KEY = "usd_exchange_rate";

// Modal de confirmación con contraseña - SIMPLIFICADO
function PasswordModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (password === "restaurant") {
      setError("");
      setPassword("");
      onConfirm();
      onClose();
    } else {
      setError("Contraseña incorrecta");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 900,
        padding: 16,
        animation: "wr-fadein 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 16,
          padding: 28,
          maxWidth: 360,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          animation: "wr-scalein 0.22s ease",
        }}
      >
        <p
          style={{
            fontSize: 17,
            fontWeight: 800,
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          Confirmar Cancelación
        </p>
        <p
          style={{
            fontSize: 13,
            color: "var(--muted)",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Ingrese la contraseña para confirmar la cancelación del producto.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Contraseña:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              border: `1.5px solid ${error ? "var(--red)" : "var(--border)"}`,
              borderRadius: 10,
              padding: "11px 14px",
              fontSize: 14,
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            placeholder="Contraseña de autorización"
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) =>
              (e.target.style.borderColor = error
                ? "var(--red)"
                : "var(--border)")
            }
            onKeyPress={(e) => {
              if (e.key === "Enter") handleConfirm();
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>
              {error}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleClose}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!password}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "var(--red)",
              fontSize: 13,
              fontWeight: 700,
              color: "white",
              opacity: !password ? 0.5 : 1,
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Calculadora de Pago
function PaymentCalculator({
  isOpen,
  onClose,
  onConfirm,
  totalAmount,
  tableNumber,
  initialTip = 0,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentData: {
    cash: number;
    terminal: number;
    usd: number;
    usdAmount: number;
    usdRate: number;
    totalPaid: number;
    change: number;
    tip: number;
  }) => void;
  totalAmount: number;
  tableNumber: number;
  initialTip?: number;
}) {
  const { toast } = useToast();
  // Cargar la tasa de cambio desde localStorage o usar 18.5 por defecto
  const getInitialUsdRate = (): number => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem(USD_RATE_STORAGE_KEY);
      if (savedRate) {
        const parsedRate = parseFloat(savedRate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          return parsedRate;
        }
      }
    }
    return 18.5;
  };

  const [cashAmount, setCashAmount] = useState<number>(0);
  const [terminalAmount, setTerminalAmount] = useState<number>(0);
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [usdRate, setUsdRate] = useState<number>(getInitialUsdRate);
  const [showRateInput, setShowRateInput] = useState<boolean>(false);
  const [tempRate, setTempRate] = useState<string>(usdRate.toString());
  const [tipMode, setTipMode] = useState<"none" | "pct" | "custom">("none");
  const [tipPct, setTipPct] = useState<number>(0);
  const [tipCustom, setTipCustom] = useState<string>("");

  const tipAmount = tipMode === "pct" ? totalAmount * tipPct
    : tipMode === "custom" ? (parseFloat(tipCustom) || 0)
    : 0;
  const usdToMxn = usdAmount * usdRate;
  const totalWithTips = totalAmount + tipAmount;
  const totalPaid = cashAmount + terminalAmount + usdToMxn;
  const remainingAmount = totalWithTips - totalPaid;
  const change = totalPaid > totalWithTips ? totalPaid - totalWithTips : 0;
  const needsChange = totalPaid > totalWithTips;

  useEffect(() => {
    if (typeof window !== "undefined" && usdRate > 0) {
      localStorage.setItem(USD_RATE_STORAGE_KEY, usdRate.toString());
    }
  }, [usdRate]);

  useEffect(() => {
    if (isOpen) {
      setCashAmount(0);
      setTerminalAmount(0);
      setUsdAmount(0);
      const currentRate = getInitialUsdRate();
      setUsdRate(currentRate);
      setTempRate(currentRate.toString());
      setShowRateInput(false);
      if (initialTip > 0) {
        setTipMode("custom");
        setTipCustom(initialTip.toFixed(2));
        setTipPct(0);
      } else {
        setTipMode("none");
        setTipPct(0);
        setTipCustom("");
      }
    }
  }, [isOpen]);

  const handleCashChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setCashAmount(Math.max(0, numValue));
  };

  const handleTerminalChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setTerminalAmount(Math.max(0, numValue));
  };

  const handleUsdChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setUsdAmount(Math.max(0, numValue));
  };

  const handleRateChange = () => {
    const newRate = parseFloat(tempRate);
    if (!isNaN(newRate) && newRate > 0) {
      setUsdRate(newRate);
      setShowRateInput(false);
    } else {
      setTempRate(usdRate.toString());
      toast("Por favor ingrese una tasa de cambio válida", "warning");
    }
  };

  const handleConfirm = () => {
    if (totalPaid === 0) {
      toast("Debe ingresar al menos un monto de pago", "warning"); return;
    }
    if (totalPaid < totalWithTips) {
      toast(`Falta $${(totalWithTips - totalPaid).toFixed(2)} por cubrir`, "warning"); return;
    }

    onConfirm({
      cash: cashAmount,
      terminal: terminalAmount,
      usd: usdAmount,
      usdAmount: usdToMxn,
      usdRate: usdRate,
      totalPaid: totalPaid,
      change: change,
      tip: tipAmount,
    });
    onClose();
  };

  const fillRemaining = () => {
    const remaining = totalWithTips - totalPaid;
    if (remaining > 0) {
      setCashAmount(cashAmount + remaining);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 800,
        padding: 16,
        animation: "wr-fadein 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 18,
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          animation: "wr-scalein 0.22s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            background: "white",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Calculadora de Pago
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--muted)",
                margin: 0,
                marginTop: 2,
              }}
            >
              Mesa {tableNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              padding: 4,
              fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "16px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingBottom: 14,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>
              Total a pagar
            </span>
            <span style={{ fontSize: 17, fontWeight: 800, color: "var(--green)" }}>
              ${totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Efectivo */}
          <div
            style={{
              border: "1.5px solid var(--border)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              💵 Efectivo (MXN)
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="number"
                value={cashAmount === 0 ? "" : cashAmount}
                onChange={(e) => handleCashChange(e.target.value)}
                placeholder="0.00"
                style={{
                  flex: 1,
                  border: "1.5px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 14,
                  outline: "none",
                  background: "var(--surface)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <button
                onClick={() =>
                  setCashAmount(totalAmount - totalPaid + cashAmount)
                }
                style={{
                  padding: "9px 14px",
                  borderRadius: 8,
                  border: "1.5px solid var(--border)",
                  background: "white",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--muted)",
                }}
              >
                Llenar
              </button>
            </div>
          </div>

          {/* Terminal */}
          <div
            style={{
              border: "1.5px solid var(--border)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              💳 Terminal (MXN)
            </p>
            <input
              type="number"
              value={terminalAmount === 0 ? "" : terminalAmount}
              onChange={(e) => handleTerminalChange(e.target.value)}
              placeholder="0.00"
              style={{
                width: "100%",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 14,
                outline: "none",
                background: "var(--surface)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* USD */}
          <div
            style={{
              border: "1.5px solid var(--border)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                $ Dólares (USD)
              </p>
              <button
                onClick={() => setShowRateInput(!showRateInput)}
                style={{
                  fontSize: 11,
                  color: "var(--blue)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ⇄ Cambiar tasa
              </button>
            </div>
            {showRateInput && (
              <div
                style={{
                  marginBottom: 10,
                  padding: "8px 10px",
                  background: "var(--surface)",
                  borderRadius: 8,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginBottom: 6,
                  }}
                >
                  Tasa de cambio (USD a MXN):
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    step="0.01"
                    style={{
                      flex: 1,
                      border: "1.5px solid var(--border)",
                      borderRadius: 7,
                      padding: "7px 10px",
                      fontSize: 13,
                      outline: "none",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "var(--accent)")
                    }
                    onBlur={(e) =>
                      (e.target.style.borderColor = "var(--border)")
                    }
                  />
                  <button
                    onClick={handleRateChange}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 7,
                      border: "none",
                      background: "var(--accent)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Actualizar
                  </button>
                </div>
              </div>
            )}
            {!showRateInput && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  textAlign: "right",
                  marginBottom: 8,
                }}
              >
                Tasa: 1 USD = ${usdRate.toFixed(2)} MXN
              </p>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <input
                type="number"
                value={usdAmount === 0 ? "" : usdAmount}
                onChange={(e) => handleUsdChange(e.target.value)}
                placeholder="0.00"
                style={{
                  flex: 1,
                  border: "1.5px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 14,
                  outline: "none",
                  background: "var(--surface)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>USD</span>
            </div>
            {usdAmount > 0 && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  textAlign: "right",
                }}
              >
                = ${usdToMxn.toFixed(2)} MXN
              </p>
            )}
          </div>

          {/* Propina */}
          <div style={{ border:"1.5px solid var(--border)",borderRadius:10,padding:"12px 14px" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
              <p style={{ fontSize:12,fontWeight:600,color:"var(--text)",margin:0 }}>Propina</p>
              {initialTip > 0 && (
                <span style={{ fontSize:10,fontWeight:700,color:"var(--blue)",background:"var(--blue-light)",padding:"2px 8px",borderRadius:6 }}>
                  💬 Cliente sugirió ${initialTip.toFixed(2)}
                </span>
              )}
            </div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:tipMode==="custom"?10:0 }}>
              {[
                { label:"Sin propina", mode:"none" as const, pct:0 },
                { label:"10%", mode:"pct" as const, pct:0.10 },
                { label:"15%", mode:"pct" as const, pct:0.15 },
                { label:"20%", mode:"pct" as const, pct:0.20 },
                { label:"Otro", mode:"custom" as const, pct:0 },
              ].map((opt) => {
                const isActive = opt.mode === "none"
                  ? tipMode === "none"
                  : opt.mode === "custom"
                    ? tipMode === "custom"
                    : tipMode === "pct" && tipPct === opt.pct;
                return (
                  <button key={opt.label}
                    onClick={() => {
                      if (opt.mode === "none") { setTipMode("none"); setTipPct(0); }
                      else if (opt.mode === "custom") { setTipMode("custom"); setTipPct(0); }
                      else { setTipMode("pct"); setTipPct(opt.pct); }
                    }}
                    style={{
                      padding:"6px 12px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                      border:`1.5px solid ${isActive?"var(--accent)":"var(--border)"}`,
                      background:isActive?"var(--accent-light)":"var(--surface)",
                      color:isActive?"var(--accent)":"var(--muted)",
                      transition:"all 0.12s",
                    }}
                  >
                    {opt.label}
                    {opt.pct > 0 && <span style={{ opacity:0.75,marginLeft:3 }}>(${(totalAmount*opt.pct).toFixed(0)})</span>}
                  </button>
                );
              })}
            </div>
            {tipMode === "custom" && (
              <div style={{ display:"flex",alignItems:"center",border:"1.5px solid var(--accent)",borderRadius:8,padding:"8px 12px",gap:8,background:"var(--accent-light)",marginTop:8 }}>
                <span style={{ fontSize:13,fontWeight:700,color:"var(--accent)" }}>$</span>
                <input type="number" min="0" step="1" value={tipCustom}
                  onChange={e => setTipCustom(e.target.value)}
                  placeholder="0.00"
                  autoFocus
                  style={{ flex:1,border:"none",outline:"none",background:"transparent",fontSize:14,fontWeight:700,color:"var(--accent)",fontFamily:"inherit" }}
                />
              </div>
            )}
            {tipAmount > 0 && (
              <p style={{ fontSize:11,color:"var(--accent)",fontWeight:600,marginTop:8,textAlign:"right" }}>
                Propina: ${tipAmount.toFixed(2)}
              </p>
            )}
          </div>

          {/* Summary */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
            }}
          >
            {[
              ["💵 Efectivo:", `$${cashAmount.toFixed(2)}`, "var(--green)"],
              ["💳 Terminal:", `$${terminalAmount.toFixed(2)}`, "var(--green)"],
              ["$ Dólares:", `$${usdAmount.toFixed(2)} USD = $${usdToMxn.toFixed(2)}`, "var(--green)"],
            ].map(([label, val, col]) => (
              <div key={label as string} style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ color:"var(--muted)" }}>{label}</span>
                <span style={{ color: col as string, fontWeight:600 }}>{val}</span>
              </div>
            ))}
            {tipAmount > 0 && (
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <span style={{ color:"var(--accent)" }}>Propina:</span>
                <span style={{ color:"var(--accent)",fontWeight:700 }}>+${tipAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ borderTop:"1px solid var(--border)",paddingTop:8,marginTop:4 }}>
              {tipAmount > 0 && (
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:11,color:"var(--muted)" }}>Consumo:</span>
                  <span style={{ fontSize:11,color:"var(--muted)" }}>${totalAmount.toFixed(2)}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 700, color: "var(--text)" }}>
                  Total {tipAmount > 0 ? "con propina" : "pagado"}:
                </span>
                <span
                  style={{
                    fontWeight: 700,
                    color: totalPaid >= totalWithTips ? "var(--green)" : "var(--amber)",
                  }}
                >
                  ${tipAmount > 0 ? totalWithTips.toFixed(2) : totalPaid.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>
                  Falta por pagar:
                </span>
                <span style={{ fontWeight: 700, color: "var(--red)" }}>
                  ${Math.max(0, remainingAmount).toFixed(2)}
                </span>
              </div>
              {needsChange && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 4,
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--green)" }}>
                    Cambio a devolver:
                  </span>
                  <span style={{ fontWeight: 700, color: "var(--green)" }}>
                    ${change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={fillRemaining}
            disabled={remainingAmount <= 0}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted)",
              opacity: remainingAmount <= 0 ? 0.5 : 1,
            }}
          >
            Completar con Efectivo
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "none",
              background: "var(--red-light)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--red)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={totalPaid === 0 || totalPaid < totalWithTips}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: (totalPaid === 0 || totalPaid < totalWithTips) ? "var(--border)" : "var(--green)",
              fontSize: 13,
              fontWeight: 700,
              color: "white",
              opacity: (totalPaid === 0 || totalPaid < totalWithTips) ? 0.5 : 1,
            }}
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  );
}

// Componente Pagos Individuales - Usa los comensales existentes
function SeparatePaymentsModal({
  isOpen,
  onClose,
  onConfirm,
  tableOrders,
  tableNumber,
  totalAmount,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    payments: Array<{
      guestName: string;
      items: Array<{
        itemId: string;
        productName: string;
        quantity: number;
        price: number;
        subtotal: number;
      }>;
      cash: number;
      terminal: number;
      usd: number;
      usdRate: number;
      total: number;
    }>,
  ) => void;
  tableOrders: Array<{
    id: string;
    customer_name: string | null;
    order_items: Array<{
      id: string;
      product_name: string;
      quantity: number;
      price: number;
      cancelled_quantity?: number;
    }>;
  }>;
  tableNumber: number;
  totalAmount: number;
}) {
  const { toast } = useToast();
  const getInitialUsdRate = (): number => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem(USD_RATE_STORAGE_KEY);
      if (savedRate) {
        const parsedRate = parseFloat(savedRate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          return parsedRate;
        }
      }
    }
    return 18.5;
  };

  interface Guest {
    id: string;
    name: string;
    items: Array<{
      itemId: string;
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    cashAmount: number;
    terminalAmount: number;
    usdAmount: number;
    usdRate: number;
    orderId: string;
  }

  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedGuestForPayment, setSelectedGuestForPayment] = useState<
    string | null
  >(null);

  // Inicializar comensales desde las órdenes existentes
  useEffect(() => {
    if (isOpen && tableOrders.length > 0) {
      const customersMap = new Map<string, Guest>();

      tableOrders.forEach((order) => {
        const customerName = order.customer_name || "Cliente sin nombre";

        if (!customersMap.has(customerName)) {
          customersMap.set(customerName, {
            id: crypto.randomUUID(),
            name: customerName,
            items: [],
            cashAmount: 0,
            terminalAmount: 0,
            usdAmount: 0,
            usdRate: getInitialUsdRate(),
            orderId: order.id,
          });
        }

        const guest = customersMap.get(customerName)!;

        // Agregar items de esta orden
        order.order_items.forEach((item) => {
          const cancelledQty = item.cancelled_quantity || 0;
          const activeQuantity = item.quantity - cancelledQty;

          if (activeQuantity > 0) {
            const existingItem = guest.items.find((i) => i.itemId === item.id);
            if (existingItem) {
              existingItem.quantity += activeQuantity;
              existingItem.subtotal =
                existingItem.quantity * existingItem.price;
            } else {
              guest.items.push({
                itemId: item.id,
                productName: item.product_name,
                quantity: activeQuantity,
                price: item.price,
                subtotal: activeQuantity * item.price,
              });
            }
          }
        });
      });

      const guestsList = Array.from(customersMap.values());
      setGuests(guestsList);
      if (guestsList.length > 0) {
        setSelectedGuestId(guestsList[0].id);
      }
    }
  }, [isOpen, tableOrders]);

  const updateGuestPayment = (
    guestId: string,
    paymentData: {
      cash: number;
      terminal: number;
      usd: number;
      usdRate: number;
    },
  ) => {
    setGuests(
      guests.map((guest) => {
        if (guest.id !== guestId) return guest;
        return {
          ...guest,
          cashAmount: paymentData.cash,
          terminalAmount: paymentData.terminal,
          usdAmount: paymentData.usd,
          usdRate: paymentData.usdRate,
        };
      }),
    );
    setShowPaymentModal(false);
    setSelectedGuestForPayment(null);
  };

  const getGuestTotal = (guest: Guest) => {
    const itemsTotal = guest.items.reduce(
      (sum, item) => sum + item.subtotal,
      0,
    );
    const usdToMxn = guest.usdAmount * guest.usdRate;
    const paidTotal = guest.cashAmount + guest.terminalAmount + usdToMxn;
    return { itemsTotal, paidTotal, remaining: itemsTotal - paidTotal };
  };

  const getOverallRemaining = () => {
    const totalPaid = guests.reduce((sum, guest) => {
      const usdToMxn = guest.usdAmount * guest.usdRate;
      return sum + guest.cashAmount + guest.terminalAmount + usdToMxn;
    }, 0);
    return totalAmount - totalPaid;
  };

  const handleConfirmAll = () => {
    // Verificar que cada comensal haya pagado lo suyo
    const guestsWithDebt = guests.filter((guest) => {
      const { remaining } = getGuestTotal(guest);
      return remaining > 0;
    });

    if (guestsWithDebt.length > 0) {
      toast(`Faltan pagos de: ${guestsWithDebt.map((g) => g.name).join(", ")}`, "warning"); return;
      return;
    }

    const payments = guests.map((guest) => ({
      guestName: guest.name,
      items: guest.items,
      cash: guest.cashAmount,
      terminal: guest.terminalAmount,
      usd: guest.usdAmount,
      usdRate: guest.usdRate,
      total: guest.items.reduce((sum, item) => sum + item.subtotal, 0),
    }));

    onConfirm(payments);
    onClose();
  };

  if (!isOpen) return null;

  const selectedGuest = guests.find((g) => g.id === selectedGuestId);
  const overallRemaining = getOverallRemaining();

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 700,
          padding: 16,
          animation: "wr-fadein 0.2s ease",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "white",
            borderRadius: 18,
            width: "100%",
            maxWidth: 700,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            animation: "wr-scalein 0.22s ease",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "18px 22px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                👥 Pagos Individuales
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--muted)",
                  margin: 0,
                  marginTop: 2,
                }}
              >
                Mesa {tableNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "var(--muted)",
                padding: 4,
                fontSize: 18,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ overflowY: "auto", flex: 1, padding: "16px 22px" }}>
            {/* Summary */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 12,
                padding: "14px 18px",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  Total de la cuenta:
                </span>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "var(--green)",
                  }}
                >
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>
                  Restante por pagar:
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color:
                      overallRemaining > 0 ? "var(--amber)" : "var(--green)",
                  }}
                >
                  ${overallRemaining.toFixed(2)}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              {/* Guest list */}
              <div style={{ width: 220, flexShrink: 0 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Comensales
                </p>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  {guests.map((guest) => {
                    const { itemsTotal, paidTotal, remaining } =
                      getGuestTotal(guest);
                    const isSelected = selectedGuestId === guest.id;
                    return (
                      <div
                        key={guest.id}
                        onClick={() => setSelectedGuestId(guest.id)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: `1.5px solid ${isSelected ? "var(--blue)" : "transparent"}`,
                          background: isSelected
                            ? "var(--blue-light)"
                            : "var(--surface)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: isSelected ? "var(--blue)" : "var(--text)",
                            margin: 0,
                          }}
                        >
                          {guest.name}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: "var(--muted)",
                            margin: 0,
                            marginTop: 2,
                          }}
                        >
                          {guest.items.length} productos
                        </p>
                        <div style={{ marginTop: 6, fontSize: 12 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ color: "var(--muted)" }}>
                              Total:
                            </span>
                            <span
                              style={{ color: "var(--text)", fontWeight: 600 }}
                            >
                              ${itemsTotal.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ color: "var(--muted)" }}>
                              Pagado:
                            </span>
                            <span
                              style={{ color: "var(--green)", fontWeight: 600 }}
                            >
                              ${paidTotal.toFixed(2)}
                            </span>
                          </div>
                          {remaining > 0 && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <span style={{ color: "var(--red)" }}>
                                Falta:
                              </span>
                              <span
                                style={{ color: "var(--red)", fontWeight: 600 }}
                              >
                                ${remaining.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Guest detail */}
              {selectedGuest && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "var(--text)",
                        margin: 0,
                      }}
                    >
                      {selectedGuest.name} — Productos
                    </p>
                    <button
                      onClick={() => {
                        setSelectedGuestForPayment(selectedGuest.id);
                        setShowPaymentModal(true);
                      }}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 9,
                        border: "none",
                        background: "var(--green)",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      💵 Registrar Pago
                    </button>
                  </div>

                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--muted)",
                      marginBottom: 8,
                    }}
                  >
                    Productos:
                  </p>
                  {selectedGuest.items.length === 0 ? (
                    <p style={{ fontSize: 13, color: "var(--muted)" }}>
                      Sin productos
                    </p>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        maxHeight: 240,
                        overflowY: "auto",
                        marginBottom: 12,
                      }}
                    >
                      {selectedGuest.items.map((item) => (
                        <div
                          key={item.itemId}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "var(--surface)",
                            padding: "8px 12px",
                            borderRadius: 8,
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--text)",
                              }}
                            >
                              {item.productName}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--muted)",
                                marginLeft: 8,
                              }}
                            >
                              {item.quantity} × ${item.price.toFixed(2)}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--text)",
                            }}
                          >
                            ${item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      background: "var(--surface)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ color: "var(--muted)" }}>
                        Total en productos:
                      </span>
                      <span style={{ fontWeight: 700, color: "var(--green)" }}>
                        ${getGuestTotal(selectedGuest).itemsTotal.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ color: "var(--muted)" }}>Pagado:</span>
                      <span style={{ fontWeight: 700, color: "var(--green)" }}>
                        ${getGuestTotal(selectedGuest).paidTotal.toFixed(2)}
                      </span>
                    </div>
                    {getGuestTotal(selectedGuest).remaining > 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "var(--red)", fontWeight: 700 }}>
                          Falta por pagar:
                        </span>
                        <span style={{ color: "var(--red)", fontWeight: 700 }}>
                          ${getGuestTotal(selectedGuest).remaining.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {getGuestTotal(selectedGuest).remaining < 0 && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: "var(--amber)" }}>
                          Sobrante (cambio):
                        </span>
                        <span
                          style={{ color: "var(--amber)", fontWeight: 700 }}
                        >
                          $
                          {Math.abs(
                            getGuestTotal(selectedGuest).remaining,
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "14px 22px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                Total:{" "}
                <strong style={{ color: "var(--green)" }}>
                  ${totalAmount.toFixed(2)}
                </strong>
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
                Restante:{" "}
                <strong style={{ color: "var(--red)" }}>
                  ${overallRemaining.toFixed(2)}
                </strong>
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={onClose}
                style={{
                  padding: "11px 20px",
                  borderRadius: 10,
                  border: "1.5px solid var(--border)",
                  background: "var(--surface)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--muted)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAll}
                style={{
                  padding: "11px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--green)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                ✓ Finalizar y Cobrar Todo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de pago individual */}
      {showPaymentModal && selectedGuestForPayment && (
        <GuestPaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedGuestForPayment(null);
          }}
          onConfirm={updateGuestPayment}
          guest={guests.find((g) => g.id === selectedGuestForPayment)!}
          tableNumber={tableNumber}
        />
      )}
    </>
  );
}

// Modal de pago individual por comensal
function GuestPaymentModal({
  isOpen,
  onClose,
  onConfirm,
  guest,
  tableNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    guestId: string,
    paymentData: {
      cash: number;
      terminal: number;
      usd: number;
      usdRate: number;
    },
  ) => void;
  guest: any;
  tableNumber: number;
}) {
  const { toast } = useToast();
  const getInitialUsdRate = (): number => {
    if (typeof window !== "undefined") {
      const savedRate = localStorage.getItem(USD_RATE_STORAGE_KEY);
      if (savedRate) {
        const parsedRate = parseFloat(savedRate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          return parsedRate;
        }
      }
    }
    return 18.5;
  };

  const [cashAmount, setCashAmount] = useState<number>(0);
  const [terminalAmount, setTerminalAmount] = useState<number>(0);
  const [usdAmount, setUsdAmount] = useState<number>(0);
  const [usdRate, setUsdRate] = useState<number>(getInitialUsdRate);
  const [showRateInput, setShowRateInput] = useState<boolean>(false);
  const [tempRate, setTempRate] = useState<string>(usdRate.toString());

  const itemsTotal =
    guest?.items.reduce((sum: number, item: any) => sum + item.subtotal, 0) ||
    0;
  const usdToMxn = usdAmount * usdRate;
  const totalPaid = cashAmount + terminalAmount + usdToMxn;
  const remaining = itemsTotal - totalPaid;

  useEffect(() => {
    if (isOpen && guest) {
      setCashAmount(0);
      setTerminalAmount(0);
      setUsdAmount(0);
      const currentRate = getInitialUsdRate();
      setUsdRate(currentRate);
      setTempRate(currentRate.toString());
    }
  }, [isOpen, guest]);

  const handleConfirm = () => {
    if (totalPaid === 0) {
      toast("Debe ingresar al menos un monto de pago", "warning"); return;
      return;
    }

    onConfirm(guest.id, {
      cash: cashAmount,
      terminal: terminalAmount,
      usd: usdAmount,
      usdRate: usdRate,
    });
    onClose();
  };

  if (!isOpen || !guest) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 800,
        padding: 16,
        animation: "wr-fadein 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 18,
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          animation: "wr-scalein 0.22s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Pago de {guest.name}
            </p>
            <p
              style={{
                fontSize: 12,
                color: "var(--muted)",
                margin: 0,
                marginTop: 2,
              }}
            >
              Mesa {tableNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--muted)",
              fontSize: 18,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            padding: "16px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 14px",
              background: "var(--surface)",
              borderRadius: 10,
            }}
          >
            <span
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}
            >
              Total a pagar:
            </span>
            <span
              style={{ fontSize: 17, fontWeight: 800, color: "var(--green)" }}
            >
              ${itemsTotal.toFixed(2)}
            </span>
          </div>

          {[
            ["💵 Efectivo (MXN)", cashAmount, setCashAmount],
            ["💳 Terminal (MXN)", terminalAmount, setTerminalAmount],
          ].map(([label, val, setter]) => (
            <div
              key={label as string}
              style={{
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                padding: "12px 14px",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 8,
                }}
              >
                {label as string}
              </p>
              <input
                type="number"
                value={val === 0 ? "" : (val as number)}
                onChange={(e) =>
                  (setter as any)(parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                style={{
                  width: "100%",
                  border: "1.5px solid var(--border)",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 14,
                  outline: "none",
                  background: "var(--surface)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          ))}

          <div
            style={{
              border: "1.5px solid var(--border)",
              borderRadius: 10,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                $ Dólares (USD)
              </p>
              <button
                onClick={() => setShowRateInput(!showRateInput)}
                style={{
                  fontSize: 11,
                  color: "var(--blue)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ⇄ Cambiar tasa
              </button>
            </div>
            {showRateInput && (
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input
                  type="number"
                  value={tempRate}
                  onChange={(e) => setTempRate(e.target.value)}
                  step="0.01"
                  style={{
                    flex: 1,
                    border: "1.5px solid var(--border)",
                    borderRadius: 7,
                    padding: "7px 10px",
                    fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={() => {
                    const r = parseFloat(tempRate);
                    if (!isNaN(r) && r > 0) {
                      setUsdRate(r);
                      setShowRateInput(false);
                    }
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 7,
                    border: "none",
                    background: "var(--accent)",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  OK
                </button>
              </div>
            )}
            <input
              type="number"
              value={usdAmount === 0 ? "" : usdAmount}
              onChange={(e) => setUsdAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              style={{
                width: "100%",
                border: "1.5px solid var(--border)",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 14,
                outline: "none",
                background: "var(--surface)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            {usdAmount > 0 && (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--muted)",
                  textAlign: "right",
                  marginTop: 4,
                }}
              >
                = ${usdToMxn.toFixed(2)} MXN (tasa: {usdRate})
              </p>
            )}
          </div>

          <div
            style={{
              background: "var(--surface)",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 13,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span style={{ color: "var(--muted)" }}>Total pagado:</span>
              <span style={{ fontWeight: 700, color: "var(--text)" }}>
                ${totalPaid.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Restante:</span>
              <span
                style={{
                  fontWeight: 700,
                  color: remaining > 0 ? "var(--red)" : "var(--green)",
                }}
              >
                ${remaining > 0 ? remaining.toFixed(2) : "0.00"}
              </span>
            </div>
            {remaining < 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                }}
              >
                <span style={{ color: "var(--amber)" }}>Cambio:</span>
                <span style={{ color: "var(--amber)", fontWeight: 700 }}>
                  ${Math.abs(remaining).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, paddingBottom: 6 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: "none",
                background: "var(--red-light)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--red)",
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 10,
                border: "none",
                background: "var(--green)",
                fontSize: 13,
                fontWeight: 700,
                color: "white",
              }}
            >
              Registrar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente simple para ordenar mesas
function TablesOrderSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: "10px 16px",
        background: "var(--surface)",
        border: "1.5px solid var(--border)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
        Ordenar mesas:
      </span>
      <div
        style={{
          display: "flex",
          border: "1.5px solid var(--border)",
          borderRadius: 9,
          overflow: "hidden",
        }}
      >
        {[
          { k: "number", label: "# Número" },
          { k: "occupation", label: "⏱ Tiempo" },
        ].map((o) => (
          <button
            key={o.k}
            onClick={() => onChange(o.k)}
            style={{
              padding: "7px 14px",
              border: "none",
              background: value === o.k ? "var(--accent)" : "white",
              color: value === o.k ? "white" : "var(--muted)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function WaiterDashboard() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<WaiterNotification[]>([]);
  const [tables, setTables] = useState<TableWithOrder[]>([]);
  const [activeTab, setActiveTab] = useState<
    "notifications" | "tables" | "products"
  >("notifications");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [attendedNotifications, setAttendedNotifications] = useState<
    Set<string>
  >(new Set());

  const [fcfsFilter, setFcfsFilter] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waiter_fcfs_filter");
      return saved === "true";
    }
    return false;
  });

  const [tablesOrder, setTablesOrder] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("waiter_tables_order");
      return saved || "number";
    }
    return "number";
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingCancelAction, setPendingCancelAction] = useState<{
    itemId: string;
    cancelQuantity: number;
  } | null>(null);

  const [showPaymentCalculator, setShowPaymentCalculator] = useState(false);
  const [selectedTableForPayment, setSelectedTableForPayment] = useState<{
    id: number;
    number: number;
    total: number;
    customerTip?: number;
  } | null>(null);
  const [showSeparatePayments, setShowSeparatePayments] = useState(false);
  const [selectedTableForSeparate, setSelectedTableForSeparate] = useState<{
    id: number;
    number: number;
    total: number;
    orders: any[];
  } | null>(null);

  const scrollPositionRef = useRef(0);
  const isUpdatingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const modalOpenRef = useRef(false);

  useEffect(() => {
    loadData();
    const unsubscribe = setupRealtimeSubscription();

    const interval = setInterval(() => {
      if (isUpdatingRef.current || modalOpenRef.current) return;

      isUpdatingRef.current = true;
      scrollPositionRef.current =
        window.scrollY || document.documentElement.scrollTop;

      loadData().finally(() => {
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
          isUpdatingRef.current = false;
        }, 100);
      });
    }, 120000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("waiter_fcfs_filter", fcfsFilter.toString());
  }, [fcfsFilter]);

  useEffect(() => {
    localStorage.setItem("waiter_tables_order", tablesOrder);
  }, [tablesOrder]);

  useEffect(() => {
    modalOpenRef.current = showPaymentCalculator || showSeparatePayments;
  }, [showPaymentCalculator, showSeparatePayments]);

  const loadData = async () => {
    // Prevenir llamadas simultáneas
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const [notifsData, tablesData] = await Promise.all([
        waiterService.getPendingNotifications(),
        waiterService.getTablesWithOrders(),
      ]);

      let processedNotifications = [...notifsData];
      if (fcfsFilter) {
        processedNotifications = applyFcfsFilter(processedNotifications);
      }

      const processedTables = tablesData.map((table) => ({
        ...table,
        orders: table.orders.map((order) => ({
          ...order,
          order_items: order.order_items.map((item) => {
            const cancelledQty = item.cancelled_quantity || 0;
            const finalCancelledQty =
              item.status === "cancelled" && cancelledQty === 0
                ? item.quantity
                : cancelledQty;

            return {
              ...item,
              cancelled_quantity: finalCancelledQty,
            };
          }),
        })),
      }));

      setNotifications((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedNotifications)
          ? prev
          : processedNotifications,
      );

      setTables((prev) =>
        JSON.stringify(prev) === JSON.stringify(processedTables)
          ? prev
          : processedTables,
      );
    } catch (error) {
      console.error("Error cargando datos:", error);
      setLoading(false);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };

  const applyFcfsFilter = (notificationsList: WaiterNotification[]) => {
    return [...notificationsList].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateA - dateB;
    });
  };

  const setupRealtimeSubscription = () => {
    const notificationsSub = supabase
      .channel("waiter-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "waiter_notifications",
        },
        () => {
          if (isUpdatingRef.current || modalOpenRef.current) return;
          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;
          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        },
      )
      .subscribe();

    const ordersSub = supabase
      .channel("waiter-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          if (isUpdatingRef.current || modalOpenRef.current) return;
          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;
          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        },
      )
      .subscribe();

    const orderItemsSub = supabase
      .channel("waiter-order-items")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        () => {
          if (isUpdatingRef.current || modalOpenRef.current) return;
          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;
          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        },
      )
      .subscribe();

    const tablesSub = supabase
      .channel("waiter-tables")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tables",
        },
        () => {
          if (isUpdatingRef.current || modalOpenRef.current) return;
          isUpdatingRef.current = true;
          scrollPositionRef.current =
            window.scrollY || document.documentElement.scrollTop;
          loadData().finally(() => {
            setTimeout(() => {
              window.scrollTo(0, scrollPositionRef.current);
              isUpdatingRef.current = false;
            }, 100);
          });
        },
      )
      .subscribe();

    return () => {
      notificationsSub.unsubscribe();
      ordersSub.unsubscribe();
      orderItemsSub.unsubscribe();
      tablesSub.unsubscribe();
    };
  };

  const handleAcknowledgeNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      setAttendedNotifications((prev) => new Set(prev).add(notificationId));
    } catch (error) {
      console.error("Error marcando notificación como atendida:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCompleteNotification = async (notificationId: string) => {
    setProcessing(notificationId);
    try {
      await waiterService.completeNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setAttendedNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    } catch (error) {
      console.error("Error completando notificación:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleCancelItem = async (
    itemId: string,
    cancelQuantity: number = 1,
  ) => {
    setPendingCancelAction({ itemId, cancelQuantity });
    setShowPasswordModal(true);
  };

  const executeCancelItem = async () => {
    if (!pendingCancelAction) return;

    const { itemId, cancelQuantity } = pendingCancelAction;
    setProcessing(itemId);

    try {
      await waiterService.cancelOrderItem(itemId, cancelQuantity);

      setTables((prevTables) =>
        prevTables.map((table) => ({
          ...table,
          orders: table.orders.map((order) => ({
            ...order,
            order_items: order.order_items.map((item) => {
              if (item.id === itemId) {
                const newCancelledQty =
                  (item.cancelled_quantity || 0) + cancelQuantity;
                const newStatus =
                  item.quantity - newCancelledQty === 0
                    ? "cancelled"
                    : item.status;

                return {
                  ...item,
                  cancelled_quantity: newCancelledQty,
                  status: newStatus,
                };
              }
              return item;
            }),
          })),
        })),
      );
    } catch (error: any) {
      console.error("Error cancelando producto:", error);
      toast(`Error al cancelar el producto: ${error.message}`, "error");
      await loadData();
    } finally {
      setProcessing(null);
      setPendingCancelAction(null);
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: string) => {
    setProcessing(itemId);
    try {
      await waiterService.updateItemStatus(itemId, newStatus as never);

      setTables((prevTables) =>
        prevTables.map((table) => ({
          ...table,
          orders: table.orders.map(
            (order) =>
              ({
                ...order,
                order_items: order.order_items.map((item) =>
                  item.id === itemId ? { ...item, status: newStatus } : item,
                ),
              }) as never,
          ),
        })),
      );
    } catch (error) {
      console.error("Error actualizando estado:", error);
      await loadData();
    } finally {
      setProcessing(null);
    }
  };

  const calculateTableTotal = (table: TableWithOrder) => {
    return table.orders.reduce((total, order) => {
      if (order.order_items && Array.isArray(order.order_items)) {
        const orderTotal = order.order_items.reduce(
          (orderSum: number, item: any) => {
            const cancelledQty = item.cancelled_quantity || 0;
            const activeQuantity = item.quantity - cancelledQty;

            if (activeQuantity > 0) {
              return orderSum + item.price * activeQuantity;
            }
            return orderSum;
          },
          0,
        );
        return total + orderTotal;
      }
      return total + order.total_amount;
    }, 0);
  };

  const handleCobrarMesa = async (tableId: number, tableNumber: number) => {
    const table = tables.find((t) => t.id === tableId);
    const tableTotal = table ? calculateTableTotal(table) : 0;

    let customerTip = 0;
    try {
      const { data: billNotif } = await supabase
        .from("waiter_notifications")
        .select("tip_amount")
        .eq("table_id", tableId)
        .eq("type", "bill_request")
        .eq("status", "pending")
        .maybeSingle();
      const _notif = billNotif as any;
      if (_notif?.tip_amount != null) {
        customerTip = parseFloat(String(_notif.tip_amount)) || 0;
      }
    } catch (e) { console.error(e); }

    setSelectedTableForPayment({
      id: tableId,
      number: tableNumber,
      total: tableTotal,
      customerTip,
    });
    setShowPaymentCalculator(true);
  };

  const handlePagarPorSeparado = async (
    tableId: number,
    tableNumber: number,
  ) => {
    const table = tables.find((t) => t.id === tableId);
    if (!table) return;

    const tableTotal = calculateTableTotal(table);

    setSelectedTableForSeparate({
      id: tableId,
      number: tableNumber,
      total: tableTotal,
      orders: table.orders,
    });
    setShowSeparatePayments(true);
  };

  const handleSeparatePaymentsConfirm = async (payments: any[]) => {
    if (!selectedTableForSeparate) return;

    setProcessing(`separate-${selectedTableForSeparate.id}`);
    try {
      let totalCash = 0;
      let totalTerminal = 0;
      let totalUsd = 0;
      let usdRateUsed = 18.5;

      payments.forEach((payment) => {
        totalCash += payment.cash;
        totalTerminal += payment.terminal;
        totalUsd += payment.usd;
        if (payment.usdRate) usdRateUsed = payment.usdRate;
      });

      let paymentMethod: "cash" | "terminal" | "mixed" | "usd" | null = null;
      let methodsUsed = 0;
      if (totalCash > 0) methodsUsed++;
      if (totalTerminal > 0) methodsUsed++;
      if (totalUsd > 0) methodsUsed++;

      if (methodsUsed === 1) {
        if (totalCash > 0) paymentMethod = "cash";
        else if (totalTerminal > 0) paymentMethod = "terminal";
        else if (totalUsd > 0) paymentMethod = "usd";
      } else if (methodsUsed > 1) {
        paymentMethod = "mixed";
      }

      await waiterService.freeTableAndClean(
        selectedTableForSeparate.id,
        selectedTableForSeparate.number,
        paymentMethod,
      );

      toast(`Mesa ${selectedTableForSeparate.number} cobrada — $${selectedTableForSeparate.total.toFixed(2)} · ${payments.length} comensales`, "success");
      await loadData();
    } catch (error: any) {
      console.error("Error en pagos individuales:", error);
      toast(`Error al procesar pagos de la mesa ${selectedTableForSeparate.number}: ${error.message}`, "error");
    } finally {
      setProcessing(null);
      setShowSeparatePayments(false);
      setSelectedTableForSeparate(null);
    }
  };

  const handlePaymentConfirm = async (paymentData: any) => {
    if (!selectedTableForPayment) return;

    setProcessing(`cobrar-${selectedTableForPayment.id}`);
    try {
      let paymentMethod: "cash" | "terminal" | "mixed" | "usd" | null = null;

      let methodsUsed = 0;
      if (paymentData.cash > 0) methodsUsed++;
      if (paymentData.terminal > 0) methodsUsed++;
      if (paymentData.usd > 0) methodsUsed++;

      if (methodsUsed === 1) {
        if (paymentData.cash > 0) paymentMethod = "cash";
        else if (paymentData.terminal > 0) paymentMethod = "terminal";
        else if (paymentData.usd > 0) paymentMethod = "usd";
      } else if (methodsUsed > 1) {
        paymentMethod = "mixed";
      }

      await waiterService.freeTableAndClean(
        selectedTableForPayment.id,
        selectedTableForPayment.number,
        paymentMethod,
      );

      if (paymentData.tip > 0) {
        try {
          await tipsService.insertTip({
            table_id: selectedTableForPayment.id,
            customer_name: `Mesa ${selectedTableForPayment.number}`,
            amount: paymentData.tip,
            payment_method: paymentMethod,
          });
        } catch (tipErr) {
          console.error("Error guardando propina:", tipErr);
        }
      }

      const metodoPago = paymentMethod === "cash" ? "Efectivo" : paymentMethod === "terminal" ? "Tarjeta" : paymentMethod === "usd" ? "Dólares" : "Mixto";
      const cambioMsg = paymentData.change > 0 ? ` · Cambio: $${paymentData.change.toFixed(2)}` : "";
      const tipMsg = paymentData.tip > 0 ? ` · Propina: $${paymentData.tip.toFixed(2)}` : "";
      toast(`Mesa ${selectedTableForPayment.number} cobrada — $${selectedTableForPayment.total.toFixed(2)} · ${metodoPago}${tipMsg}${cambioMsg}`, "success");
      await loadData();
    } catch (error: any) {
      console.error("Error cobrando mesa:", error);
      toast(`Error al cobrar la mesa ${selectedTableForPayment.number}: ${error.message}`, "error");
    } finally {
      setProcessing(null);
      setShowPaymentCalculator(false);
      setSelectedTableForPayment(null);
    }
  };

  const handleGoToTables = () => {
    setActiveTab("tables");
  };

  const handleError = (error: string) => {
    toast(error, "error");
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div
      className="waiter-root"
      style={{
        height: "100dvh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        background: "white",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        .waiter-root{
          --accent:oklch(62% 0.18 32);--accent-dark:oklch(50% 0.18 32);--accent-light:oklch(96% 0.05 32);
          --navy:oklch(22% 0.04 260);--navy-light:oklch(96% 0.01 260);
          --text:oklch(20% 0.02 260);--muted:oklch(55% 0.02 260);--border:oklch(88% 0.01 260);--surface:oklch(98.5% 0.005 80);
          --green:oklch(52% 0.16 145);--green-light:oklch(95% 0.06 145);
          --amber:oklch(72% 0.16 70);--amber-light:oklch(96% 0.06 70);
          --red:oklch(56% 0.18 20);--red-light:oklch(96% 0.05 20);
          --blue:oklch(52% 0.18 260);--blue-light:oklch(95% 0.05 260);
        }
        .waiter-root * { box-sizing: border-box; }
        @keyframes wr-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes wr-fadeup  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes wr-scalein { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes wr-spin    { to{transform:rotate(360deg)} }
        .waiter-root ::-webkit-scrollbar { width:4px; }
        .waiter-root ::-webkit-scrollbar-thumb { background:var(--border); border-radius:4px; }
        .waiter-root button { cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif; transition:filter 0.15s,transform 0.1s; }
        .waiter-root button:hover { filter:brightness(0.92); }
        .waiter-root button:active { transform:scale(0.97); }
        .waiter-root input, .waiter-root textarea { font-family:'Plus Jakarta Sans',sans-serif; }
      `}</style>

      <Header loading={loading} onRefresh={loadData} />

      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationsCount={notifications.length}
        occupiedTablesCount={
          tables.filter((t) => t.status === "occupied").length
        }
      />

      <div
        style={{
          flex: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {activeTab === "notifications" && (
            <NotificationsTab
              notifications={notifications}
              processing={processing}
              attendedNotifications={attendedNotifications}
              onAcknowledgeNotification={handleAcknowledgeNotification}
              onCompleteNotification={handleCompleteNotification}
              onGoToTables={handleGoToTables}
            />
          )}

          {activeTab === "tables" && (
            <>
              <TablesOrderSelect
                value={tablesOrder}
                onChange={setTablesOrder}
              />
              <TablesTab
                tables={tables}
                processing={processing}
                onUpdateItemStatus={handleUpdateItemStatus}
                onCancelItem={handleCancelItem}
                onCobrarMesa={handleCobrarMesa}
                onPagarPorSeparado={handlePagarPorSeparado}
                calculateTableTotal={calculateTableTotal}
                notifications={notifications}
                tablesOrder={tablesOrder}
                onAddModalChange={(isOpen) => { modalOpenRef.current = isOpen || showPaymentCalculator || showSeparatePayments; }}
              />
            </>
          )}

          {activeTab === "products" && (
            <ProductsManagement onError={handleError} />
          )}
        </div>
      </div>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onConfirm={executeCancelItem}
      />

      <PaymentCalculator
        isOpen={showPaymentCalculator}
        onClose={() => {
          setShowPaymentCalculator(false);
          setSelectedTableForPayment(null);
        }}
        onConfirm={handlePaymentConfirm}
        totalAmount={selectedTableForPayment?.total || 0}
        tableNumber={selectedTableForPayment?.number || 0}
        initialTip={selectedTableForPayment?.customerTip ?? 0}
      />

      <SeparatePaymentsModal
        isOpen={showSeparatePayments}
        onClose={() => {
          setShowSeparatePayments(false);
          setSelectedTableForSeparate(null);
        }}
        onConfirm={handleSeparatePaymentsConfirm}
        tableOrders={selectedTableForSeparate?.orders || []}
        tableNumber={selectedTableForSeparate?.number || 0}
        totalAmount={selectedTableForSeparate?.total || 0}
      />
    </div>
  );
}
