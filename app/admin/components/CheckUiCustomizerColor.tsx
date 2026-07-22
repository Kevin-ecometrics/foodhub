"use client";
import { useState, useRef, useEffect } from "react";

const WEBAPP_PALETTE = [
  { label: "Navy", value: "oklch(22% 0.04 260)" },
  { label: "Accent", value: "oklch(62% 0.18 32)" },
  { label: "Amber", value: "oklch(72% 0.16 70)" },
  { label: "Green", value: "oklch(52% 0.16 145)" },
  { label: "Red", value: "oklch(56% 0.18 20)" },
  { label: "Blue", value: "oklch(52% 0.18 260)" },
  { label: "Blanco", value: "#ffffff" },
  { label: "Surface", value: "oklch(98.5% 0.005 80)" },
  { label: "Muted", value: "oklch(55% 0.02 260)" },
  { label: "Texto", value: "oklch(20% 0.02 260)" },
  { label: "Borde", value: "oklch(88% 0.01 260)" },
  { label: "Transparente", value: "transparent" },
];

export default function CheckUiCustomizerColor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [customHex, setCustomHex] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const v = value ?? "";
  const isOklch = v.startsWith("oklch");

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {label && (
        <p style={{ fontSize: 12, fontWeight: 600, color: "var(--check-text, oklch(20% 0.02 260))", margin: "0 0 6px" }}>
          {label}
        </p>
      )}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
          borderRadius: 10,
          background: "white",
          cursor: "pointer",
          width: "100%",
          fontFamily: "inherit",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent, oklch(62% 0.18 32))"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--check-border, oklch(88% 0.01 260))"; }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: v,
            border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--check-text, oklch(20% 0.02 260))", flex: 1, textAlign: "left" }}>
          {v.length > 28 ? v.slice(0, 26) + "…" : v}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--check-muted, oklch(55% 0.02 260))" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
            borderRadius: 12,
            padding: 12,
            zIndex: 50,
            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
            {WEBAPP_PALETTE.map((swatch) => (
              <button
                key={swatch.value}
                onClick={() => { onChange(swatch.value); setOpen(false); }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 4px",
                  border: value === swatch.value ? "2px solid var(--color-accent, oklch(62% 0.18 32))" : "1.5px solid transparent",
                  borderRadius: 8,
                  background: value === swatch.value ? "var(--check-accent-light, oklch(96% 0.05 32))" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: swatch.value,
                    border: "1px solid var(--check-border, oklch(88% 0.01 260))",
                  }}
                />
                <span style={{ fontSize: 9, fontWeight: 600, color: "var(--check-muted, oklch(55% 0.02 260))", textAlign: "center" }}>
                  {swatch.label}
                </span>
              </button>
            ))}
          </div>

          <div style={{ borderTop: "1px solid var(--check-border, oklch(88% 0.01 260))", paddingTop: 10 }}>
            <button
              onClick={() => setShowCustom(!showCustom)}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-accent, oklch(62% 0.18 32))",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                fontFamily: "inherit",
              }}
            >
              {showCustom ? "▲ Ocultar personalizado" : "▼ Color personalizado"}
            </button>
            {showCustom && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  type="color"
                  value={isOklch ? "#e8634a" : customHex || v}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    onChange(e.target.value);
                  }}
                  style={{
                    width: 40,
                    height: 40,
                    padding: 0,
                    border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
                    borderRadius: 8,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <input
                  type="text"
                  value={isOklch ? v : customHex || v}
                  onChange={(e) => {
                    setCustomHex(e.target.value);
                    onChange(e.target.value);
                  }}
                  placeholder="#ffffff  o  oklch(...)"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "monospace",
                    outline: "none",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "var(--color-accent, oklch(62% 0.18 32))"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--check-border, oklch(88% 0.01 260))"; }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
