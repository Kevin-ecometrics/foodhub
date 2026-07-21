"use client";

import { DEFAULT_CONFIG, getDefaultConfig, ModeConfig, CheckUiConfig } from "@/app/lib/checkUiTypes";
import { configToStyles } from "@/app/lib/checkUiRenderer";

const CUSTOMER_MOCK = [
  {
    name: "Juan Pérez",
    items: [
      { name: "Tacos al Pastor", qty: 3, price: 45 },
      { name: "Refresco de Cola", qty: 2, price: 25 },
    ],
  },
  {
    name: "María García",
    items: [
      { name: "Ensalada Caesar", qty: 1, price: 98 },
      { name: "Agua Natural", qty: 1, price: 18 },
    ],
  },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const PREVIEW_CSS = `
  .prev-root {
    --accent: oklch(62% 0.18 32);
    --navy: oklch(22% 0.04 260);
    --navy-light: oklch(96% 0.01 260);
    --text: oklch(20% 0.02 260);
    --muted: oklch(55% 0.02 260);
    --border: oklch(88% 0.01 260);
    --red-light: oklch(96% 0.05 20);
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  @keyframes prev-fadeup { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
`;

interface Props {
  mode: string;
  customConfig?: CheckUiConfig;
}

export default function CheckUiPreview({ mode, customConfig }: Props) {
  const config: ModeConfig = customConfig
    ? customConfig[mode as keyof CheckUiConfig] ?? getDefaultConfig(mode)
    : getDefaultConfig(mode);

  const sty = configToStyles(config);
  const classic = mode === "classic";
  const isCompact = config.container.spacing === "compact";

  let total = 0;
  CUSTOMER_MOCK.forEach((c) => c.items.forEach((i) => { total += i.price * i.qty; }));
  const subtotal = total / 1.08;
  const tax = total - subtotal;

  const headerFont = config.header.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
  const custFont = config.customers.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
  const itemsFont = config.items.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";
  const totalsFont = config.totals.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif";

  return (
    <div className="prev-root">
      <style>{PREVIEW_CSS}</style>
      <div style={{ display: config.container.sidebarWidth > 0 ? "flex" : undefined, borderRadius: sty.container.borderRadius, overflow: "hidden", animation: "prev-fadeup 0.3s ease both" }}>
        {config.container.sidebarWidth > 0 && (
          <div style={sty.sidebar!} />
        )}
        <div style={{ flex: config.container.sidebarWidth > 0 ? 1 : undefined, ...sty.container, borderRadius: config.container.sidebarWidth > 0 ? 0 : sty.container.borderRadius, border: config.container.sidebarWidth > 0 ? sty.container.border : undefined }}>
          {/* Header */}
          <div style={sty.header}>
            {config.header.showDecoration && (
              <div style={{ borderTop: "1px solid " + config.header.textColor, width: "50%", margin: "0 auto 8px", opacity: 0.5 }} />
            )}
            {config.header.showName && <p style={sty.headerTitle}>Restaurante</p>}
            {config.header.showTable && <p style={sty.headerSubtitle}>Mesa 5</p>}
            {config.header.showDecoration && (
              <div style={{ borderTop: "1px solid " + config.header.textColor, width: "50%", margin: "8px auto 0", opacity: 0.5 }} />
            )}
          </div>

          {/* Customer sections */}
          <div style={sty.customerSection}>
            {CUSTOMER_MOCK.map((c, ci) => {
              const cTotal = c.items.reduce((s, i) => s + i.price * i.qty, 0);
              return (
                <div key={c.name}>
                  <div style={sty.customerHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: config.customers.showIcons ? 10 : 0 }}>
                      {config.customers.showIcons && (
                        <div style={sty.customerIconBox}>
                          <svg width={isCompact ? 12 : 16} height={isCompact ? 12 : 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p style={sty.customerName}>{c.name}</p>
                        <p style={sty.customerSubtitle}>{c.items.length} ítem{c.items.length > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <span style={sty.customerTotal}>{fmt(cTotal)}</span>
                  </div>

                  {c.items.map((item, ii) => {
                    if (config.items.format === "dots") {
                      return (
                        <div key={ii} style={sty.itemRow}>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                            <span style={{ ...sty.itemName, fontFamily: itemsFont }}>{item.qty}x {item.name}</span>
                            <span style={sty.dotLine} />
                            <span style={{ ...sty.itemPrice, fontFamily: itemsFont }}>{fmt(item.price * item.qty)}</span>
                          </div>
                        </div>
                      );
                    }
                    if (config.items.format === "inline") {
                      return (
                        <div key={ii} style={sty.itemRow}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ ...sty.itemName, fontFamily: itemsFont, fontSize: isCompact ? 12 : 13 }}>{item.name}</span>
                            <span style={{ ...sty.itemPrice, fontFamily: itemsFont, fontSize: isCompact ? 11 : 12 }}>
                              {item.qty} × {fmt(item.price)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={ii} style={sty.itemRow}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ ...sty.itemName, whiteSpace: "normal", fontFamily: itemsFont }}>{item.name}</p>
                            <p style={{ ...sty.itemDetail, fontFamily: itemsFont }}>
                              Cantidad: <strong>{item.qty}</strong> &bull; {fmt(item.price)} c/u
                            </p>
                          </div>
                          <p style={{ ...sty.itemPrice, fontFamily: itemsFont, textAlign: "right", margin: 0 }}>{fmt(item.price * item.qty)}</p>
                        </div>
                      </div>
                    );
                  })}

                  {ci < CUSTOMER_MOCK.length - 1 && <div style={sty.sectionDivider} />}
                </div>
              );
            })}

            {/* Totals */}
            <div style={sty.totalSection}>
              <div style={{ padding: isCompact ? "8px 0" : "12px 0", borderBottom: "1px dashed oklch(88% 0.01 260)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ ...sty.totalLabel, fontFamily: totalsFont }}>Subtotal total:</span>
                <span style={{ ...sty.totalValue, fontFamily: totalsFont }}>{fmt(subtotal)}</span>
              </div>
              <div style={{ padding: isCompact ? "6px 0" : "8px 0", display: "flex", justifyContent: "space-between" }}>
                <span style={{ ...sty.totalLabel, fontFamily: totalsFont }}>Impuestos (8%):</span>
                <span style={{ ...sty.totalValue, fontFamily: totalsFont }}>{fmt(tax)}</span>
              </div>
              <div style={{ padding: isCompact ? "8px 0 0" : "12px 0 0", borderTop: "2px solid oklch(20% 0.02 260)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ ...sty.totalFinalLabel, fontFamily: totalsFont }}>TOTAL GENERAL:</span>
                <span style={{ ...sty.totalFinalValue, fontFamily: totalsFont }}>{fmt(total)}</span>
              </div>
            </div>

            {/* Footer */}
            <div style={sty.footer}>
              {config.footer.showDecoration && <div style={sty.footerDecoration as any} />}
              <p style={{ ...sty.footerText, fontFamily: config.footer.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif" }}>
                {config.footer.text.split(" — ")[0]}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
