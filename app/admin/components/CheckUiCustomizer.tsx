"use client";
import { useState, useRef } from "react";
import { DEFAULT_CONFIG, CheckUiConfig, ModeConfig } from "@/app/lib/checkUiTypes";
import { configToStyles } from "@/app/lib/checkUiRenderer";
import CheckUiCustomizerColor from "./CheckUiCustomizerColor";
import { FaSearch, FaSpinner, FaCheck } from "react-icons/fa";

const MODE_LABELS: Record<string, string> = {
  modern: "Moderno",
  classic: "Clásico",
  compact: "Compacto",
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

const ITEM_FORMATS = [
  { label: "Detallado", value: "detailed" as const },
  { label: "Con puntos", value: "dots" as const },
  { label: "Compacto", value: "inline" as const },
];

interface Props {
  initialConfig?: CheckUiConfig;
  initialMode?: string;
  onSave: (config: CheckUiConfig, activeMode: string) => Promise<void>;
  onClose: () => void;
}

export default function CheckUiCustomizer({ initialConfig, initialMode, onSave, onClose }: Props) {
  const [config, setConfig] = useState<CheckUiConfig>(
    initialConfig ? structuredClone(initialConfig) : structuredClone(DEFAULT_CONFIG)
  );
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

  const updateContainer = (partial: Partial<ModeConfig["container"]>) => {
    setSaved(false);
    setConfig((prev) => {
      const m = prev[activeModeRef.current];
      return { ...prev, [activeModeRef.current]: { ...m, container: { ...m.container, ...partial } } };
    });
  };
  const updateHeader = (partial: Partial<ModeConfig["header"]>) => {
    setSaved(false);
    setConfig((prev) => {
      const m = prev[activeModeRef.current];
      return { ...prev, [activeModeRef.current]: { ...m, header: { ...m.header, ...partial } } };
    });
  };
  const updateCustomers = (partial: Partial<ModeConfig["customers"]>) => {
    setSaved(false);
    setConfig((prev) => {
      const m = prev[activeModeRef.current];
      return { ...prev, [activeModeRef.current]: { ...m, customers: { ...m.customers, ...partial } } };
    });
  };
  const updateItems = (partial: Partial<ModeConfig["items"]>) => {
    setSaved(false);
    setConfig((prev) => {
      const m = prev[activeModeRef.current];
      return { ...prev, [activeModeRef.current]: { ...m, items: { ...m.items, ...partial } } };
    });
  };
  const updateTotals = (partial: Partial<ModeConfig["totals"]>) => {
    setSaved(false);
    setConfig((prev) => {
      const m = prev[activeModeRef.current];
      return { ...prev, [activeModeRef.current]: { ...m, totals: { ...m.totals, ...partial } } };
    });
  };
  const updateFooter = (partial: Partial<ModeConfig["footer"]>) => {
    setSaved(false);
    setConfig((prev) => {
      const m = prev[activeModeRef.current];
      return { ...prev, [activeModeRef.current]: { ...m, footer: { ...m.footer, ...partial } } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(config, activeMode);
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(structuredClone(DEFAULT_CONFIG));
    setSaved(false);
  };

  const previewStyles = configToStyles(mode);
  const modes = ["modern", "classic", "compact"] as const;

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      {/* Left side: form */}
      <div style={{ flex: 1, minWidth: 320, maxWidth: 480 }}>
        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 20,
            background: "var(--check-surface, oklch(98.5% 0.005 80))",
            padding: 4,
            borderRadius: 12,
          }}
        >
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setActiveMode(m)}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 9,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                background: activeMode === m ? "oklch(62% 0.18 32)" : "transparent",
                color: activeMode === m ? "white" : "var(--check-muted, oklch(55% 0.02 260))",
                boxShadow: activeMode === m ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
                transition: "all 0.15s",
              }}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* ═══ Container ═══ */}
        <Section title="FONDO Y BORDE">
          <CheckUiCustomizerColor label="Fondo del ticket" value={mode.container.background} onChange={(v) => updateContainer({ background: v })} />
          <FieldRow>
            <SelectField label="Borde" value={mode.container.borderStyle} options={BORDER_STYLES} onChange={(v) => updateContainer({ borderStyle: v })} />
            <SelectField label="Radio" value={mode.container.borderRadius} options={RADIUS_OPTIONS} onChange={(v) => updateContainer({ borderRadius: v })} />
          </FieldRow>
          <FieldRow>
            <SelectField label="Espaciado" value={mode.container.spacing} options={SPACING_OPTIONS} onChange={(v) => updateContainer({ spacing: v })} />
            <ToggleField label="Barra lateral" checked={mode.container.sidebarWidth > 0} onChange={(v) => updateContainer({ sidebarWidth: v ? 4 : 0 })} />
          </FieldRow>
          {mode.container.sidebarWidth > 0 && (
            <CheckUiCustomizerColor label="Color barra" value={mode.container.sidebarColor} onChange={(v) => updateContainer({ sidebarColor: v })} />
          )}
        </Section>

        {/* ═══ Header ═══ */}
        <Section title="ENCABEZADO">
          <CheckUiCustomizerColor label="Fondo" value={mode.header.background} onChange={(v) => updateHeader({ background: v })} />
          <CheckUiCustomizerColor label="Color texto" value={mode.header.textColor} onChange={(v) => updateHeader({ textColor: v })} />
          <FieldRow>
            <SelectField label="Tipografía" value={mode.header.fontFamily} options={FONT_OPTIONS} onChange={(v) => updateHeader({ fontFamily: v })} />
            <ToggleField label="Decoración" checked={mode.header.showDecoration} onChange={(v) => updateHeader({ showDecoration: v })} />
          </FieldRow>
          <FieldRow>
            <ToggleField label="Mostrar nombre" checked={mode.header.showName} onChange={(v) => updateHeader({ showName: v })} />
            <ToggleField label="Mostrar mesa" checked={mode.header.showTable} onChange={(v) => updateHeader({ showTable: v })} />
          </FieldRow>
        </Section>

        {/* ═══ Customers ═══ */}
        <Section title="CLIENTES">
          <FieldRow>
            <ToggleField label="Mostrar iconos" checked={mode.customers.showIcons} onChange={(v) => updateCustomers({ showIcons: v })} />
            <SelectField label="Tipografía" value={mode.customers.fontFamily} options={FONT_OPTIONS} onChange={(v) => updateCustomers({ fontFamily: v })} />
          </FieldRow>
          <CheckUiCustomizerColor label="Color acento" value={mode.customers.accentColor} onChange={(v) => updateCustomers({ accentColor: v })} />
        </Section>

        {/* ═══ Items ═══ */}
        <Section title="ITEMS">
          <FieldRow>
            <SelectField label="Formato" value={mode.items.format} options={ITEM_FORMATS} onChange={(v) => updateItems({ format: v })} />
            <SelectField label="Tipografía" value={mode.items.fontFamily} options={FONT_OPTIONS} onChange={(v) => updateItems({ fontFamily: v })} />
          </FieldRow>
        </Section>

        {/* ═══ Totals ═══ */}
        <Section title="TOTALES">
          <CheckUiCustomizerColor label="Color totales" value={mode.totals.accentColor} onChange={(v) => updateTotals({ accentColor: v })} />
          <SelectField label="Tipografía" value={mode.totals.fontFamily} options={FONT_OPTIONS} onChange={(v) => updateTotals({ fontFamily: v })} />
        </Section>

        {/* ═══ Footer ═══ */}
        <Section title="FOOTER">
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--check-text, oklch(20% 0.02 260))", margin: "0 0 6px" }}>Texto del footer</p>
            <input
              type="text"
              value={mode.footer.text}
              onChange={(e) => updateFooter({ text: e.target.value })}
              style={{
                width: "100%",
                padding: "9px 12px",
                border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
                borderRadius: 10,
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--color-accent, oklch(62% 0.18 32))"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--check-border, oklch(88% 0.01 260))"; }}
            />
          </div>
          <FieldRow>
            <CheckUiCustomizerColor label="Color texto" value={mode.footer.color} onChange={(v) => updateFooter({ color: v })} />
            <ToggleField label="Decoración" checked={mode.footer.showDecoration} onChange={(v) => updateFooter({ showDecoration: v })} />
          </FieldRow>
        </Section>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
              background: "white",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--check-muted, oklch(55% 0.02 260))",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Restablecer
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: saved ? "var(--check-green, oklch(52% 0.16 145))" : "var(--color-accent, oklch(62% 0.18 32))",
              fontSize: 13,
              fontWeight: 700,
              color: "white",
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: saving ? 0.7 : 1,
              transition: "all 0.2s",
            }}
          >
            {saving ? (
              <><FaSpinner className="animate-spin" /> Guardando...</>
            ) : saved ? (
              <><FaCheck /> Guardado</>
            ) : (
              "Guardar cambios"
            )}
          </button>
        </div>
      </div>

      {/* Right side: preview */}
      <div style={{ flex: 1, minWidth: 300, maxWidth: 420 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--check-text, oklch(20% 0.02 260))", margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
          <FaSearch /> Vista previa — {MODE_LABELS[activeMode]}
        </p>
        <MiniPreview mode={mode} previewStyles={previewStyles} />
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
        borderRadius: 12,
        padding: 16,
        marginBottom: 14,
        background: "white",
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 700, color: "var(--check-muted, oklch(55% 0.02 260))", letterSpacing: "0.08em", margin: "0 0 14px", textTransform: "uppercase" }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>{children}</div>;
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: any) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--check-text, oklch(20% 0.02 260))", margin: "0 0 6px" }}>{label}</p>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            appearance: "none",
            padding: "8px 28px 8px 10px",
            border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 600,
            color: "var(--check-text, oklch(20% 0.02 260))",
            background: "white",
            cursor: "pointer",
            fontFamily: "inherit",
            outline: "none",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--check-muted, oklch(55% 0.02 260))"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--check-text, oklch(20% 0.02 260))", margin: "0 0 6px" }}>{label}</p>
      <button
        onClick={() => onChange(!checked)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          border: "1.5px solid var(--check-border, oklch(88% 0.01 260))",
          borderRadius: 9,
          background: "white",
          cursor: "pointer",
          width: "100%",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            width: 32,
            height: 18,
            borderRadius: 99,
            background: checked ? "oklch(62% 0.18 32)" : "var(--check-border, oklch(88% 0.01 260))",
            padding: 2,
            display: "flex",
            justifyContent: checked ? "flex-end" : "flex-start",
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: checked ? "var(--check-text, oklch(20% 0.02 260))" : "var(--check-muted, oklch(55% 0.02 260))" }}>
          {checked ? "Sí" : "No"}
        </span>
      </button>
    </div>
  );
}

// ─── Mini Preview ──────────────────────────────────────────────────────────────

const MOCK_CUSTOMERS = [
  { name: "Juan Pérez", items: [{ n: "Tacos al Pastor", q: 3, p: 45 }, { n: "Refresco", q: 2, p: 25 }] },
  { name: "María García", items: [{ n: "Ensalada Caesar", q: 1, p: 98 }, { n: "Agua Natural", q: 1, p: 18 }] },
];

const fm = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

function MiniPreview({ mode, previewStyles }: { mode: ModeConfig; previewStyles: ReturnType<typeof configToStyles> }) {
  const s = {
    border: mode.container.borderStyle === "none" ? "none" : `${mode.container.borderStyle === "dotted" ? "2px dotted" : "1.5px solid"} oklch(88% 0.01 260)`,
    borderRadius: mode.container.borderRadius === "none" ? 0 : mode.container.borderRadius === "small" ? 8 : mode.container.borderRadius === "medium" ? 12 : 16,
    overflow: "hidden" as const,
    background: mode.container.background,
    fontSize: mode.container.spacing === "compact" ? 11 : 13,
  };

  const headerFont = mode.header.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
  const custFont = mode.customers.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
  const itemsFont = mode.items.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
  const totalsFont = mode.totals.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";

  let total = 0;
  MOCK_CUSTOMERS.forEach((c) => c.items.forEach((i) => { total += i.p * i.q; }));
  const subtotal = total / 1.08;
  const tax = total - subtotal;

  return (
    <div style={s}>
      {/* Header */}
      <div
        style={{
          background: mode.header.background,
          padding: mode.container.spacing === "compact" ? "10px 14px" : "16px 20px",
          textAlign: "center",
          ...(mode.header.fontFamily === "serif" ? {} : {}),
        }}
      >
        {mode.header.showDecoration && (
          <div style={{ borderTop: `1px solid ${mode.header.textColor}`, width: "50%", margin: "0 auto 8px", opacity: 0.5 }} />
        )}
        {mode.header.showName && (
          <p style={{ fontSize: mode.container.spacing === "compact" ? 8 : 10, letterSpacing: "0.12em", textTransform: "uppercase", color: mode.header.textColor, margin: 0, fontFamily: headerFont }}>
            Restaurante
          </p>
        )}
        {mode.header.showTable && (
          <p style={{ fontSize: mode.container.spacing === "compact" ? 10 : 12, color: mode.header.textColor, margin: "2px 0 0", fontFamily: headerFont }}>
            Mesa 5
          </p>
        )}
        {mode.header.showDecoration && (
          <div style={{ borderTop: `1px solid ${mode.header.textColor}`, width: "50%", margin: "8px auto 0", opacity: 0.5 }} />
        )}
      </div>

      {/* Customers */}
      {MOCK_CUSTOMERS.map((c, ci) => {
        const cTotal = c.items.reduce((s, i) => s + i.p * i.q, 0);
        return (
          <div key={c.name}>
            <div
              style={{
                padding: mode.container.spacing === "compact" ? "8px 14px" : "12px 20px 10px",
                borderBottom: mode.container.borderStyle === "dotted" ? "1px dotted oklch(88% 0.01 260)" : "1px solid oklch(88% 0.01 260)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: mode.customers.showIcons ? 8 : 0 }}>
                {mode.customers.showIcons && (
                  <div style={{ width: mode.container.spacing === "compact" ? 20 : 24, height: mode.container.spacing === "compact" ? 20 : 24, borderRadius: 6, background: "oklch(96% 0.01 260)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width={mode.container.spacing === "compact" ? 10 : 12} height={mode.container.spacing === "compact" ? 10 : 12} viewBox="0 0 24 24" fill="none" stroke="oklch(22% 0.04 260)" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                )}
                <div>
                  <p style={{ fontSize: mode.container.spacing === "compact" ? 11 : 13, fontWeight: 700, color: mode.customers.accentColor, margin: 0, fontFamily: custFont }}>
                    {c.name}
                  </p>
                </div>
              </div>
              <span style={{ fontSize: mode.container.spacing === "compact" ? 11 : 13, fontWeight: 700, color: mode.customers.accentColor, flexShrink: 0, fontFamily: custFont }}>
                {fm(cTotal)}
              </span>
            </div>

            {c.items.map((item, ii) => (
              mode.items.format === "dots" ? (
                <div key={ii} style={{ padding: mode.container.spacing === "compact" ? "5px 14px" : "7px 20px", borderBottom: mode.container.borderStyle === "dotted" ? "1px dotted oklch(88% 0.01 260)" : "1px solid oklch(88% 0.01 260)" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                    <span style={{ fontSize: mode.container.spacing === "compact" ? 11 : 12, color: "oklch(20% 0.02 260)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontFamily: itemsFont }}>
                      {item.q}x {item.n}
                    </span>
                    <span style={{ flex: 1, height: 1, borderBottom: "1px dotted oklch(88% 0.01 260)" }} />
                    <span style={{ fontSize: mode.container.spacing === "compact" ? 11 : 12, fontWeight: 600, color: "oklch(20% 0.02 260)", whiteSpace: "nowrap", fontFamily: itemsFont }}>
                      {fm(item.p * item.q)}
                    </span>
                  </div>
                </div>
              ) : mode.items.format === "inline" ? (
                <div key={ii} style={{ padding: mode.container.spacing === "compact" ? "5px 14px" : "7px 20px", borderBottom: mode.container.borderStyle === "dotted" ? "1px dotted oklch(88% 0.01 260)" : "1px solid oklch(88% 0.01 260)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: mode.container.spacing === "compact" ? 11 : 12, fontWeight: 600, color: "oklch(20% 0.02 260)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0, fontFamily: itemsFont }}>
                      {item.n}
                    </span>
                    <span style={{ fontSize: mode.container.spacing === "compact" ? 10 : 11, fontWeight: 700, color: "oklch(20% 0.02 260)", flexShrink: 0, marginLeft: 8, fontFamily: itemsFont }}>
                      {item.q} × {fm(item.p)}
                    </span>
                  </div>
                </div>
              ) : (
                <div key={ii} style={{ padding: mode.container.spacing === "compact" ? "7px 14px" : "10px 20px", borderBottom: mode.container.borderStyle === "dotted" ? "1px dotted oklch(88% 0.01 260)" : "1px solid oklch(88% 0.01 260)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <p style={{ fontSize: mode.container.spacing === "compact" ? 12 : 13, fontWeight: 600, color: "oklch(20% 0.02 260)", margin: 0, fontFamily: itemsFont }}>
                        {item.n}
                      </p>
                      <p style={{ fontSize: mode.container.spacing === "compact" ? 10 : 11, color: "oklch(55% 0.02 260)", margin: "2px 0 0", fontFamily: itemsFont }}>
                        Cantidad: {item.q} &bull; {fm(item.p)} c/u
                      </p>
                    </div>
                    <p style={{ fontSize: mode.container.spacing === "compact" ? 12 : 13, fontWeight: 700, color: "oklch(20% 0.02 260)", margin: 0, fontFamily: itemsFont }}>
                      {fm(item.p * item.q)}
                    </p>
                  </div>
                </div>
              )
            ))}

            {ci < MOCK_CUSTOMERS.length - 1 && (
              <div style={{ height: 1, background: "oklch(88% 0.01 260)", margin: mode.container.spacing === "compact" ? "0 14px" : "0 20px" }} />
            )}
          </div>
        );
      })}

      {/* Totals */}
      <div style={{ padding: mode.container.spacing === "compact" ? "0 14px 10px" : "0 20px 14px", borderTop: mode.container.borderStyle === "dotted" ? "1px dotted oklch(88% 0.01 260)" : "1px solid oklch(88% 0.01 260)" }}>
        <div style={{ padding: "8px 0", borderBottom: "1px dashed oklch(88% 0.01 260)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: mode.container.spacing === "compact" ? 10 : 11, color: "oklch(55% 0.02 260)", fontFamily: totalsFont }}>Subtotal:</span>
          <span style={{ fontSize: mode.container.spacing === "compact" ? 10 : 11, color: "oklch(55% 0.02 260)", fontFamily: totalsFont }}>{fm(subtotal)}</span>
        </div>
        <div style={{ padding: "6px 0", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: mode.container.spacing === "compact" ? 10 : 11, color: "oklch(55% 0.02 260)", fontFamily: totalsFont }}>Impuestos (8%):</span>
          <span style={{ fontSize: mode.container.spacing === "compact" ? 10 : 11, color: "oklch(55% 0.02 260)", fontFamily: totalsFont }}>{fm(tax)}</span>
        </div>
        <div style={{ padding: "8px 0 0", borderTop: "2px solid oklch(20% 0.02 260)", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: mode.container.spacing === "compact" ? 11 : 13, fontWeight: 800, color: mode.totals.accentColor, fontFamily: totalsFont }}>TOTAL</span>
          <span style={{ fontSize: mode.container.spacing === "compact" ? 11 : 13, fontWeight: 800, color: mode.totals.accentColor, fontFamily: totalsFont }}>{fm(total)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: mode.container.spacing === "compact" ? "8px 14px 10px" : "12px 20px 14px", borderTop: mode.container.borderStyle === "dotted" ? "1px dotted oklch(88% 0.01 260)" : "1px solid oklch(88% 0.01 260)", textAlign: "center" }}>
        {mode.footer.showDecoration && <div style={{ borderTop: `1px solid ${mode.footer.color}`, width: "50%", margin: "0 auto 8px" }} />}
        <p style={{ fontSize: mode.container.spacing === "compact" ? 10 : 12, fontWeight: 600, color: mode.footer.color, margin: 0, fontFamily: mode.footer.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif" }}>
          {mode.footer.text.split(" — ")[0]}
        </p>
      </div>
    </div>
  );
}
