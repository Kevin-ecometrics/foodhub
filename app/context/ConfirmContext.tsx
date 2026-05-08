"use client";
import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue>({ confirm: async () => false });

export function useConfirm() {
  return useContext(ConfirmContext);
}

const TYPE_CFG = {
  danger:  { iconBg: "oklch(96% 0.05 20)",  iconColor: "oklch(56% 0.18 20)",  btnBg: "oklch(56% 0.18 20)",  btnHover: "oklch(46% 0.18 20)" },
  warning: { iconBg: "oklch(96% 0.06 70)",  iconColor: "oklch(62% 0.16 70)",  btnBg: "oklch(62% 0.16 70)",  btnHover: "oklch(52% 0.16 70)" },
  info:    { iconBg: "oklch(95% 0.05 260)", iconColor: "oklch(52% 0.18 260)", btnBg: "oklch(52% 0.18 260)", btnHover: "oklch(42% 0.18 260)" },
};

const TYPE_ICON = {
  danger: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  ),
  warning: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  info: (color: string) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/>
    </svg>
  ),
};

interface ModalState {
  options: ConfirmOptions;
  resolve: (v: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModal({ options, resolve });
    });
  }, []);

  const handleChoice = (value: boolean) => {
    modal?.resolve(value);
    setModal(null);
  };

  const type = modal?.options.type ?? "danger";
  const cfg = TYPE_CFG[type];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {modal && (
        <div
          onClick={() => handleChoice(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 99998,
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16, animation: "confirmFadeIn 0.2s ease",
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: 18, padding: "28px 28px 24px",
              maxWidth: 380, width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
              animation: "confirmScaleIn 0.25s ease",
            }}
          >
            {/* Icon */}
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: cfg.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 18,
            }}>
              {TYPE_ICON[type](cfg.iconColor)}
            </div>

            {/* Title */}
            <p style={{ fontSize: 17, fontWeight: 800, color: "oklch(20% 0.02 260)", marginBottom: 8, lineHeight: 1.3 }}>
              {modal.options.title}
            </p>

            {/* Message */}
            <p style={{ fontSize: 13, color: "oklch(55% 0.02 260)", lineHeight: 1.6, marginBottom: 24 }}>
              {modal.options.message}
            </p>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => handleChoice(false)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  border: "1.5px solid oklch(88% 0.01 260)",
                  background: "oklch(98.5% 0.005 80)",
                  fontSize: 13, fontWeight: 600, color: "oklch(55% 0.02 260)",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(95% 0.005 80)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "oklch(98.5% 0.005 80)")}
              >
                {modal.options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                onClick={() => handleChoice(true)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  border: "none", background: cfg.btnBg,
                  fontSize: 13, fontWeight: 700, color: "white",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = cfg.btnHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = cfg.btnBg)}
              >
                {modal.options.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes confirmFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes confirmScaleIn { from { opacity: 0; transform: scale(0.94) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
      `}</style>
    </ConfirmContext.Provider>
  );
}
