"use client";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const CFG = {
  success: { bg: "oklch(52% 0.16 145)", border: "oklch(85% 0.08 145)", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  )},
  error: { bg: "oklch(56% 0.18 20)", border: "oklch(85% 0.08 20)", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  )},
  warning: { bg: "oklch(72% 0.16 70)", border: "oklch(88% 0.08 70)", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  )},
  info: { bg: "oklch(52% 0.18 260)", border: "oklch(85% 0.08 260)", icon: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>
  )},
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    const clean = message.replace(/^[✅❌👋⚠️ℹ️💬🔄\s]+/, "").trim();
    setToasts(prev => [...prev, { id, message: clean, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {toasts.length > 0 && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 99999,
          display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end",
          pointerEvents: "none",
        }}>
          {toasts.map(t => {
            const c = CFG[t.type];
            return (
              <div key={t.id} style={{
                display: "flex", alignItems: "flex-start", gap: 12,
                background: "white", borderRadius: 14, padding: "13px 16px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)",
                border: `1.5px solid ${c.border}`,
                maxWidth: 360, minWidth: 260,
                animation: "toastSlideIn 0.28s ease",
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                pointerEvents: "all",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 8, background: c.bg,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {c.icon}
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "oklch(20% 0.02 260)", margin: 0, lineHeight: 1.5, flex: 1 }}>
                  {t.message}
                </p>
                <button onClick={() => remove(t.id)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "oklch(65% 0.02 260)", fontSize: 15, padding: "0 0 0 4px",
                  lineHeight: 1, flexShrink: 0, marginTop: 1,
                }}>✕</button>
              </div>
            );
          })}
        </div>
      )}
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(16px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
