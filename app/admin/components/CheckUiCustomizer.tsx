"use client";
import { useState, useRef } from "react";
import { DEFAULT_CONFIG, CheckUiConfig, TicketConfig } from "@/app/lib/checkUiTypes";
import { configToStyles } from "@/app/lib/checkUiRenderer";
import CheckUiCustomizerColor from "./CheckUiCustomizerColor";
import { FaSearch, FaSpinner, FaCheck } from "react-icons/fa";

const MODE_LABELS: Record<string, string> = {
  modern: "Moderno", classic: "Clásico", compact: "Compacto",
};

const BORDER_STYLES = [
  { label: "Sólido", value: "solid" as const },
  { label: "Punteado", value: "dotted" as const },
  { label: "Ninguno", value: "none" as const },
];
const RADIUS_OPTIONS = [
  { label: "Ninguno", value: "none" as const },
  { label: "Pequeño", value: "small" as const },
  { label: "Mediano", value: "medium" as const },
  { label: "Grande", value: "large" as const },
];
const SPACING_OPTIONS = [
  { label: "Compacto", value: "compact" as const },
  { label: "Normal", value: "normal" as const },
  { label: "Espacioso", value: "spacious" as const },
];
const FONT_OPTIONS = [
  { label: "Sans-serif", value: "sans" as const },
  { label: "Serif", value: "serif" as const },
];

interface Props {
  initialConfig?: CheckUiConfig;
  initialMode?: string;
  onSave: (config: CheckUiConfig, activeMode: string) => Promise<void>;
  onClose: () => void;
}

function normalizeMode(saved: Partial<TicketConfig> | undefined, defaults: TicketConfig): TicketConfig {
  if (!saved) return structuredClone(defaults);
  const result = { ...defaults };
  for (const key of Object.keys(result) as (keyof TicketConfig)[])
    if (saved[key] != null) (result as Record<string, unknown>)[key] = saved[key];
  return result;
}

export default function CheckUiCustomizer({ initialConfig, initialMode, onSave, onClose }: Props) {
  const [config, setConfig] = useState<CheckUiConfig>(() => {
    if (!initialConfig) return structuredClone(DEFAULT_CONFIG);
    const c = {} as CheckUiConfig;
    for (const m of ["modern", "classic", "compact"] as const)
      c[m] = normalizeMode(initialConfig[m], DEFAULT_CONFIG[m]);
    return c;
  });
  const validModes = ["modern", "classic", "compact"] as const;
  const defaultMode = validModes.includes(initialMode as "modern" | "classic" | "compact")
    ? (initialMode as "modern" | "classic" | "compact")
    : "modern";
  const [activeMode, setActiveMode] = useState<"modern" | "classic" | "compact">(defaultMode);
  const activeModeRef = useRef(activeMode);
  activeModeRef.current = activeMode;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const mode = config[activeMode];

  const update = (partial: Partial<TicketConfig>) => {
    setSaved(false);
    setConfig((prev) => {
      const m = prev[activeModeRef.current];
      return { ...prev, [activeModeRef.current]: { ...m, ...partial } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(config, activeMode); onClose(); }
    catch { /* error handled by parent */ }
    finally { setSaving(false); }
  };

  const handleReset = () => { setConfig(structuredClone(DEFAULT_CONFIG)); setSaved(false); };

  const previewStyles = configToStyles(mode);
  const modes = ["modern", "classic", "compact"] as const;

  return (
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontFamily: "var(--font-geist-sans)" }}>
      <div style={{ flex: 1, minWidth: 320, maxWidth: 480 }}>
        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "oklch(98.5% 0.005 80)", padding: 4, borderRadius: 12 }}>
          {modes.map((m) => (
            <button key={m} onClick={() => setActiveMode(m)} style={{
              flex: 1, padding: "9px 12px", borderRadius: 9, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              background: activeMode === m ? "oklch(62% 0.18 32)" : "transparent",
              color: activeMode === m ? "white" : "oklch(55% 0.02 260)",
              boxShadow: activeMode === m ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              transition: "all 0.15s",
            }}>
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        <Section title="CONTENEDOR">
          <CheckUiCustomizerColor label="Fondo" value={mode.containerBg} onChange={(v) => update({ containerBg: v })} />
          <FieldRow>
            <SelectField label="Borde" value={mode.containerBorder} options={BORDER_STYLES} onChange={(v: string) => update({ containerBorder: v as "solid" | "dotted" | "none" })} />
            <SelectField label="Radio" value={mode.containerRadius} options={RADIUS_OPTIONS} onChange={(v: string) => update({ containerRadius: v as "none" | "small" | "medium" | "large" })} />
          </FieldRow>
          <SelectField label="Espaciado" value={mode.spacing} options={SPACING_OPTIONS} onChange={(v: string) => update({ spacing: v as "compact" | "normal" | "spacious" })} />
        </Section>

        <Section title="ENCABEZADO">
          <CheckUiCustomizerColor label="Fondo" value={mode.headerBg} onChange={(v) => update({ headerBg: v })} />
          <CheckUiCustomizerColor label="Color texto" value={mode.headerColor} onChange={(v) => update({ headerColor: v })} />
        </Section>

        <Section title="TOTALES">
          <CheckUiCustomizerColor label="Color acento" value={mode.accentColor} onChange={(v) => update({ accentColor: v })} />
        </Section>

        <Section title="TIPOGRAFÍA">
          <SelectField label="Fuente" value={mode.fontFamily} options={FONT_OPTIONS} onChange={(v: string) => update({ fontFamily: v as "sans" | "serif" })} />
        </Section>

        <Section title="FOOTER">
          <input
            type="text"
            value={mode.footerText}
            onChange={(e) => update({ footerText: e.target.value })}
            style={{ width: "100%", padding: "9px 12px", border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none" }}
          />
          <CheckUiCustomizerColor label="Color" value={mode.footerColor} onChange={(v) => update({ footerColor: v })} />
        </Section>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleReset} style={{
            flex: 1, padding: "12px 16px", borderRadius: 10, border: "1.5px solid oklch(88% 0.01 260)", background: "white",
            fontSize: 13, fontWeight: 700, color: "oklch(55% 0.02 260)", cursor: "pointer", fontFamily: "inherit",
          }}>
            Restablecer
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1, padding: "12px 16px", borderRadius: 10, border: "none",
            background: saved ? "oklch(52% 0.16 145)" : "var(--color-accent, oklch(62% 0.18 32))",
            fontSize: 13, fontWeight: 700, color: "white", cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1, transition: "all 0.2s",
          }}>
            {saving ? <><FaSpinner className="animate-spin" /> Guardando...</> : saved ? <><FaCheck /> Guardado</> : "Guardar cambios"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 300, maxWidth: 420 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "oklch(20% 0.02 260)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <FaSearch /> Vista previa — {MODE_LABELS[activeMode]}
        </p>
        <MiniPreview mode={mode} previewStyles={previewStyles} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 12, padding: 16, marginBottom: 14, background: "white" }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: "oklch(55% 0.02 260)", letterSpacing: "0.08em", margin: "0 0 14px", textTransform: "uppercase" }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>{children}</div>;
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "oklch(20% 0.02 260)", margin: "0 0 6px" }}>{label}</p>
      <div style={{ position: "relative" }}>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={{
          width: "100%", appearance: "none", padding: "8px 28px 8px 10px",
          border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 9, fontSize: 12, fontWeight: 600,
          color: "oklch(20% 0.02 260)", background: "white", cursor: "pointer", fontFamily: "inherit", outline: "none",
        }}>
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="oklch(55% 0.02 260)" strokeWidth="2.5" strokeLinecap="round"
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

// ─── Mini Preview ──────────────────────────────────────────────────────────

const MOCK_ITEMS = [
  { q: 2, n: "Tacos al Pastor", p: 45 },
  { q: 1, n: "Refresco", p: 25 },
  { q: 1, n: "Ensalada Caesar", p: 98 },
];

const fm = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

function MiniPreview({ mode }: { mode: TicketConfig; previewStyles: ReturnType<typeof configToStyles> }) {
  const border = mode.containerBorder === "none" ? "none"
    : mode.containerBorder === "dotted" ? "2px dotted oklch(88% 0.01 260)" : "1.5px solid oklch(88% 0.01 260)";
  const radius = mode.containerRadius === "none" ? 0 : mode.containerRadius === "small" ? 8 : mode.containerRadius === "medium" ? 12 : 16;
  const pad = mode.spacing === "compact" ? 12 : mode.spacing === "normal" ? 20 : 28;
  const f = mode.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
  const total = MOCK_ITEMS.reduce((s, i) => s + i.p * i.q, 0);
  const subtotal = Math.round(total / 1.16 * 100) / 100;
  const iva = total - subtotal;

  return (
    <div style={{ border, borderRadius: radius, overflow: "hidden", background: mode.containerBg, fontFamily: f }}>
      <div style={{ background: mode.headerBg, padding: pad, textAlign: "center" }}>
        <p style={{ fontSize: mode.spacing === "compact" ? 9 : 10, fontWeight: 700, color: mode.headerColor, margin: 0, lineHeight: 1.5 }}>
          SCANEAT<br />NOMBRE DEL PROPIETARIO<br />RFC: XXXX000000XX0
        </p>
      </div>
      <div style={{ padding: `${pad * 0.5}px ${pad}px`, fontSize: mode.spacing === "compact" ? 8 : 9, color: "oklch(55% 0.02 260)" }}>
        Independencia Num. 6213, Col. Castillo<br />Tijuana, B.C. México CP 22050
      </div>
      <hr style={{ border: "none", borderTop: "1px dashed oklch(88% 0.01 260)", margin: `0 ${pad}px` }} />
      <div style={{ display: "flex", justifyContent: "space-between", padding: `${pad * 0.5}px ${pad}px` }}>
        <span style={{ fontSize: mode.spacing === "compact" ? 8 : 9, fontWeight: 700 }}>MESA: 5</span>
        <span style={{ fontSize: mode.spacing === "compact" ? 8 : 9 }}>MESERO: Juan</span>
      </div>
      <div style={{ textAlign: "center", fontSize: mode.spacing === "compact" ? 8 : 9, color: "oklch(55% 0.02 260)" }}>
        FOLIO: ABC-123<br />{new Date().toLocaleDateString("es-MX")}
      </div>
      <hr style={{ border: "none", borderTop: "1px dashed oklch(88% 0.01 260)", margin: `6px ${pad}px` }} />
      <div style={{ display: "grid", gridTemplateColumns: "35px 1fr 70px", gap: 4, padding: `${pad * 0.4}px ${pad}px`, borderBottom: "2px solid oklch(88% 0.01 260)" }}>
        <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.5px" }}>CANT</span>
        <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.5px" }}>DESCRIPCIÓN</span>
        <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: "0.5px", textAlign: "right" }}>IMPORTE</span>
      </div>
      {MOCK_ITEMS.map((i, idx) => (
        <div key={idx} style={{ display: "grid", gridTemplateColumns: "35px 1fr 70px", gap: 4, padding: `${pad * 0.4}px ${pad}px`, borderBottom: "1px solid oklch(88% 0.01 260)", alignItems: "start" }}>
          <span style={{ fontSize: mode.spacing === "compact" ? 9 : 10 }}>{i.q}</span>
          <span style={{ fontSize: mode.spacing === "compact" ? 9 : 10 }}>{i.n}</span>
          <span style={{ fontSize: mode.spacing === "compact" ? 9 : 10, fontWeight: 600, textAlign: "right" }}>{fm(i.p * i.q)}</span>
        </div>
      ))}
      <div style={{ padding: `${pad * 0.4}px ${pad}px` }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: mode.spacing === "compact" ? 9 : 10, color: "oklch(55% 0.02 260)" }}>SUBTOTAL</span><span style={{ fontSize: mode.spacing === "compact" ? 9 : 10, fontWeight: 600 }}>{fm(subtotal)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: mode.spacing === "compact" ? 9 : 10, color: "oklch(55% 0.02 260)" }}>IVA (16%)</span><span style={{ fontSize: mode.spacing === "compact" ? 9 : 10, fontWeight: 600 }}>{fm(iva)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid oklch(20% 0.02 260)", paddingTop: 4, marginTop: 4 }}>
          <span style={{ fontSize: mode.spacing === "compact" ? 10 : 11, fontWeight: 800, color: mode.accentColor }}>TOTAL</span>
          <span style={{ fontSize: mode.spacing === "compact" ? 10 : 11, fontWeight: 800, color: mode.accentColor }}>{fm(total)}</span>
        </div>
      </div>
      <div style={{ textAlign: "center", fontSize: mode.spacing === "compact" ? 7 : 8, color: "oklch(55% 0.02 260)", padding: `0 ${pad}px`, lineHeight: 1.5 }}>
        SON: CIENTO SESENTA Y OCHO PESOS 00/100 M.N.
      </div>
      <div style={{ textAlign: "center", padding: pad, borderTop: border }}>
        <p style={{ fontSize: mode.spacing === "compact" ? 9 : 10, fontWeight: 700, color: mode.footerColor, margin: 0 }}>
          {mode.footerText}
        </p>
      </div>
    </div>
  );
}
