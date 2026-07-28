"use client";

import { DEFAULT_CONFIG, getDefaultConfig, TicketConfig, CheckUiConfig } from "@/app/lib/checkUiTypes";
import { configToStyles } from "@/app/lib/checkUiRenderer";

const MOCK_ITEMS = [
  { qty: 2, name: "Tacos al Pastor", price: 45 },
  { qty: 1, name: "Refresco de Cola", price: 25 },
  { qty: 1, name: "Ensalada Caesar", price: 98 },
];

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

interface Props {
  mode: string;
  customConfig?: CheckUiConfig;
}

export default function CheckUiPreview({ mode, customConfig }: Props) {
  const config: TicketConfig = customConfig
    ? customConfig[mode as keyof CheckUiConfig] ?? getDefaultConfig(mode)
    : getDefaultConfig(mode);

  const s = configToStyles(config);
  const total = MOCK_ITEMS.reduce((t, i) => t + i.price * i.qty, 0);
  const subtotal = Math.round(total / 1.16 * 100) / 100;
  const iva = total - subtotal;

  return (
    <div style={{ fontFamily: config.fontFamily === "serif" ? "Georgia, serif" : "'Plus Jakarta Sans', sans-serif", animation: "pay-fadeup 0.3s ease both" }}>
      <div style={s.container as React.CSSProperties}>
        <div style={s.headerBlock as React.CSSProperties}>
          <div style={s.headerLine as React.CSSProperties}>
            SCANEAT<br />NOMBRE DEL PROPIETARIO<br />RFC: XXXX000000XX0
          </div>
        </div>

        <div style={{ padding: `6px 16px`, fontSize: 9, color: "oklch(55% 0.02 260)", lineHeight: 1.5 }}>
          Independencia Num. 6213, Col. Castillo<br />Tijuana, B.C. México CP 22050
        </div>

        <hr style={s.divider as React.CSSProperties} />

        <div style={s.infoRow as React.CSSProperties}>
          <p style={s.infoLabel as React.CSSProperties}>MESA: 5</p>
          <p style={s.infoValue as React.CSSProperties}>MESERO: Juan</p>
        </div>

        <div style={s.centerText as React.CSSProperties}>
          FOLIO: ABC-123<br />{new Date().toLocaleDateString("es-MX")}
        </div>

        <hr style={s.divider as React.CSSProperties} />

        <div style={s.colHeader as React.CSSProperties}>
          <span style={s.colHeaderCell as React.CSSProperties}>CANT</span>
          <span style={s.colHeaderCell as React.CSSProperties}>DESCRIPCIÓN</span>
          <span style={{ ...s.colHeaderCell as React.CSSProperties, textAlign: "right" }}>IMPORTE</span>
        </div>

        {MOCK_ITEMS.map((i, idx) => (
          <div key={idx} style={s.itemRow as React.CSSProperties}>
            <span style={s.itemCell as React.CSSProperties}>{i.qty}</span>
            <span style={s.itemCell as React.CSSProperties}>{i.name}</span>
            <span style={{ ...s.itemCell as React.CSSProperties, fontWeight: 700, textAlign: "right" }}>{fmt(i.price * i.qty)}</span>
          </div>
        ))}

        <div style={{ padding: `6px 16px` }}>
          <div style={s.totalRow as React.CSSProperties}><p style={s.totalLabel as React.CSSProperties}>SUBTOTAL</p><p style={s.totalValue as React.CSSProperties}>{fmt(subtotal)}</p></div>
          <div style={s.totalRow as React.CSSProperties}><p style={s.totalLabel as React.CSSProperties}>IVA (16%)</p><p style={s.totalValue as React.CSSProperties}>{fmt(iva)}</p></div>
          <div style={{ ...s.totalRow as React.CSSProperties, borderTop: "2px solid oklch(20% 0.02 260)", paddingTop: 4, marginTop: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: config.accentColor, margin: 0 }}>TOTAL</p>
            <p style={{ fontSize: 12, fontWeight: 800, color: config.accentColor, margin: 0 }}>{fmt(total)}</p>
          </div>
        </div>

        <p style={{ fontSize: 8, color: "oklch(55% 0.02 260)", textAlign: "center", padding: "0 16px", lineHeight: 1.5, margin: 0 }}>
          SON: CIENTO SESENTA Y OCHO PESOS 00/100 M.N.
        </p>

        <div style={s.footer as React.CSSProperties}>
          <p style={s.footerText as React.CSSProperties}>{config.footerText}</p>
        </div>
      </div>
    </div>
  );
}
