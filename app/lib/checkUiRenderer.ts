import { TicketConfig, SPACING_MAP, BORDER_RADIUS_MAP, FONT_MAP } from "./checkUiTypes";
import type { CSSProperties } from "react";

export interface TicketStyles {
  container: CSSProperties;
  headerBlock: CSSProperties;
  headerLine: CSSProperties;
  infoRow: CSSProperties;
  infoLabel: CSSProperties;
  infoValue: CSSProperties;
  centerText: CSSProperties;
  divider: CSSProperties;
  colHeader: CSSProperties;
  colHeaderCell: CSSProperties;
  itemRow: CSSProperties;
  itemCell: CSSProperties;
  totalRow: CSSProperties;
  totalLabel: CSSProperties;
  totalValue: CSSProperties;
  amountWords: CSSProperties;
  footer: CSSProperties;
  footerText: CSSProperties;
}

export function configToStyles(c: TicketConfig): TicketStyles {
  const s = SPACING_MAP[c.spacing] ?? SPACING_MAP.normal;
  const f = FONT_MAP[c.fontFamily] ?? FONT_MAP.sans;
  const border = c.containerBorder === "none" ? "none"
    : c.containerBorder === "dotted" ? "2px dotted var(--border)" : "1.5px solid var(--border)";

  return {
    container: {
      border,
      borderRadius: BORDER_RADIUS_MAP[c.containerRadius],
      overflow: "hidden",
      background: c.containerBg,
      animation: "pay-fadeup 0.35s ease both",
      fontFamily: f,
    },
    headerBlock: {
      background: c.headerBg,
      padding: s.pad,
      textAlign: "center" as const,
    },
    headerLine: {
      fontSize: c.spacing === "compact" ? 10 : 12,
      fontWeight: 700,
      color: c.headerColor,
      margin: 0,
      lineHeight: 1.5,
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: `${s.gap} ${s.pad}`,
    },
    infoLabel: {
      fontSize: c.spacing === "compact" ? 9 : 10,
      fontWeight: 700,
      color: "var(--text)",
      textTransform: "uppercase" as const,
      margin: 0,
    },
    infoValue: {
      fontSize: c.spacing === "compact" ? 9 : 10,
      fontWeight: 600,
      color: "var(--muted)",
      margin: 0,
    },
    centerText: {
      fontSize: c.spacing === "compact" ? 9 : 10,
      textAlign: "center" as const,
      color: "var(--muted)",
      margin: `0 ${s.pad}`,
    },
    divider: {
      border: "none",
      borderTop: `1px dashed var(--border)`,
      margin: `${s.gap} ${s.pad}`,
    },
    colHeader: {
      display: "grid",
      gridTemplateColumns: "40px 1fr 80px",
      gap: 4,
      padding: s.padSm,
      borderBottom: `2px solid var(--border)`,
    },
    colHeaderCell: {
      fontSize: 8,
      fontWeight: 800,
      color: "var(--text)",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
    },
    itemRow: {
      display: "grid",
      gridTemplateColumns: "40px 1fr 80px",
      gap: 4,
      padding: s.padSm,
      borderBottom: `1px solid var(--border)`,
      alignItems: "start",
    },
    itemCell: {
      fontSize: c.spacing === "compact" ? 10 : 11,
      color: "var(--text)",
    },
    totalRow: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: `2px ${s.pad}`,
    },
    totalLabel: {
      fontSize: c.spacing === "compact" ? 10 : 11,
      color: "var(--muted)",
      fontWeight: 600,
      margin: 0,
    },
    totalValue: {
      fontSize: c.spacing === "compact" ? 10 : 11,
      color: "var(--text)",
      fontWeight: 700,
      margin: 0,
      textAlign: "right" as const,
    },
    amountWords: {
      fontSize: c.spacing === "compact" ? 8 : 9,
      color: "var(--muted)",
      textAlign: "center" as const,
      padding: `0 ${s.pad}`,
      lineHeight: 1.5,
      margin: 0,
    },
    footer: {
      textAlign: "center" as const,
      padding: s.pad,
      borderTop: border,
    },
    footerText: {
      fontSize: c.spacing === "compact" ? 10 : 11,
      fontWeight: 700,
      color: c.footerColor,
      margin: 0,
    },
  };
}
