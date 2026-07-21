import { ModeConfig, SPACING_MAP, BORDER_RADIUS_MAP, FONT_MAP } from "./checkUiTypes";
import type { CSSProperties } from "react";

export interface TicketStyles {
  container: CSSProperties;
  header: CSSProperties;
  headerTitle: CSSProperties;
  headerSubtitle: CSSProperties;
  customerSection: CSSProperties;
  customerHeader: CSSProperties;
  customerName: CSSProperties;
  customerSubtitle: CSSProperties;
  customerTotal: CSSProperties;
  customerIconBox: CSSProperties;
  itemRow: CSSProperties;
  itemName: CSSProperties;
  itemPrice: CSSProperties;
  itemDetail: CSSProperties;
  dotLine: CSSProperties;
  sectionDivider: CSSProperties;
  totalSection: CSSProperties;
  totalLabel: CSSProperties;
  totalValue: CSSProperties;
  totalFinalLabel: CSSProperties;
  totalFinalValue: CSSProperties;
  cancelledNotice: CSSProperties;
  footer: CSSProperties;
  footerText: CSSProperties;
  footerDecoration: CSSProperties;
  sidebar: CSSProperties | null;
}

export function configToStyles(config: ModeConfig): TicketStyles {
  const space = SPACING_MAP[config.container.spacing];
  const radius = BORDER_RADIUS_MAP[config.container.borderRadius];
  const headerFont = FONT_MAP[config.header.fontFamily];
  const customerFont = FONT_MAP[config.customers.fontFamily];
  const itemsFont = FONT_MAP[config.items.fontFamily];
  const totalsFont = FONT_MAP[config.totals.fontFamily];

  return {
    container: {
      border: config.container.borderStyle === "none"
        ? "none"
        : `${config.container.borderStyle === "dotted" ? "2px dotted" : "1.5px solid"} var(--border)`,
      borderRadius: radius,
      overflow: "hidden",
      background: config.container.background,
      animation: "pay-fadeup 0.35s ease both",
    },

    header: {
      background: config.header.background,
      padding: config.container.spacing === "compact" ? "12px 16px" : "20px 24px",
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      ...(config.header.fontFamily === "serif" ? { fontFamily: headerFont } : {}),
    },

    headerTitle: {
      fontSize: config.container.spacing === "compact" ? 9 : 11,
      letterSpacing: "0.12em",
      textTransform: "uppercase",
      color: config.header.textColor,
      margin: 0,
      display: config.header.showName ? "block" : "none",
      ...(config.header.fontFamily === "serif" ? { fontFamily: headerFont } : {}),
    },

    headerSubtitle: {
      fontSize: config.container.spacing === "compact" ? 11 : 13,
      color: config.header.textColor,
      margin: config.container.spacing === "compact" ? "1px 0 0" : "4px 0 0",
      display: config.header.showTable ? "block" : "none",
      ...(config.header.fontFamily === "serif" ? { fontFamily: headerFont } : {}),
    },

    customerSection: {
      background: "transparent",
    },

    customerHeader: {
      padding: config.customers.showIcons
        ? (config.container.spacing === "compact" ? "10px 16px" : "16px 24px 12px")
        : (config.container.spacing === "compact" ? "10px 16px" : "14px 24px 10px"),
      borderBottom: config.container.borderStyle === "dotted"
        ? "1px dotted var(--border)"
        : "1px solid var(--border)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },

    customerName: {
      fontSize: config.container.spacing === "compact" ? 13 : 14,
      fontWeight: 700,
      color: config.customers.accentColor,
      margin: 0,
      ...(config.customers.fontFamily === "serif" ? { fontFamily: customerFont } : {}),
    },

    customerSubtitle: {
      fontSize: config.container.spacing === "compact" ? 10 : 11,
      color: "var(--muted)",
      margin: "2px 0 0",
      ...(config.customers.fontFamily === "serif" ? { fontFamily: customerFont, fontStyle: "italic" as const } : {}),
    },

    customerTotal: {
      fontSize: config.container.spacing === "compact" ? 13 : 14,
      fontWeight: 700,
      color: config.customers.accentColor,
      flexShrink: 0,
      ...(config.customers.fontFamily === "serif" ? { fontFamily: customerFont } : {}),
    },

    customerIconBox: {
      width: config.container.spacing === "compact" ? 24 : 32,
      height: config.container.spacing === "compact" ? 24 : 32,
      borderRadius: config.container.spacing === "compact" ? 6 : 9,
      background: "var(--navy-light)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--navy)",
      flexShrink: 0,
    },

    itemRow: {
      padding: config.items.format === "inline"
        ? (config.container.spacing === "compact" ? "6px 16px" : "7px 16px")
        : (config.container.spacing === "compact" ? "7px 16px" : "12px 18px"),
      borderBottom: config.container.borderStyle === "dotted"
        ? "1px dotted var(--border)"
        : "1px solid var(--border)",
      ...(config.items.format === "dots" ? { background: "transparent" } : { background: "white" }),
    },

    itemName: {
      fontSize: config.items.format === "inline" ? 12 : (config.items.format === "dots" ? 13 : 14),
      fontWeight: config.items.format === "detailed" ? 600 : 600,
      color: "var(--text)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      ...(config.items.fontFamily === "serif" ? { fontFamily: itemsFont } : {}),
    },

    itemPrice: {
      fontSize: config.items.format === "inline" ? 11 : (config.items.format === "dots" ? 13 : 14),
      fontWeight: 700,
      color: "var(--text)",
      flexShrink: 0,
      whiteSpace: "nowrap",
      ...(config.items.fontFamily === "serif" ? { fontFamily: itemsFont } : {}),
    },

    itemDetail: {
      fontSize: 12,
      color: "var(--muted)",
      margin: "3px 0 0",
    },

    dotLine: {
      flex: 1,
      minWidth: 16,
      height: 1,
      borderBottom: "1px dotted var(--border)",
      margin: "0 4px",
    },

    sectionDivider: {
      height: 1,
      background: "var(--border)",
      margin: config.container.spacing === "compact" ? "0 16px" : "0 24px",
    },

    totalSection: {
      padding: config.container.spacing === "compact" ? "0 16px 12px" : "0 24px 16px",
      borderTop: config.container.borderStyle === "dotted"
        ? "1px dotted var(--border)"
        : "1px solid var(--border)",
    },

    totalLabel: {
      fontSize: config.container.spacing === "compact" ? 11 : 13,
      color: "var(--muted)",
      ...(config.totals.fontFamily === "serif" ? { fontFamily: totalsFont, fontStyle: "italic" as const } : {}),
    },

    totalValue: {
      fontSize: config.container.spacing === "compact" ? 11 : 13,
      color: "var(--muted)",
      ...(config.totals.fontFamily === "serif" ? { fontFamily: totalsFont } : {}),
    },

    totalFinalLabel: {
      fontSize: config.container.spacing === "compact" ? 13 : 16,
      fontWeight: 800,
      color: config.totals.accentColor,
      ...(config.totals.fontFamily === "serif" ? { fontFamily: totalsFont } : {}),
    },

    totalFinalValue: {
      fontSize: config.container.spacing === "compact" ? 13 : 16,
      fontWeight: 800,
      color: config.totals.accentColor,
      ...(config.totals.fontFamily === "serif" ? { fontFamily: totalsFont } : {}),
    },

    cancelledNotice: {
      margin: config.container.spacing === "compact" ? "0 16px 12px" : "0 24px 16px",
      background: "var(--red-light)",
      borderRadius: config.container.spacing === "compact" ? 8 : 10,
      padding: config.container.spacing === "compact" ? "8px 12px" : "12px 14px",
    },

    footer: {
      padding: config.container.spacing === "compact" ? "10px 16px 12px" : "14px 24px 16px",
      borderTop: config.container.borderStyle === "dotted"
        ? "1px dotted var(--border)"
        : "1px solid var(--border)",
      textAlign: "center",
      ...(config.footer.fontFamily === "serif" ? { fontFamily: FONT_MAP.serif } : {}),
    },

    footerText: {
      fontSize: config.container.spacing === "compact" ? 11 : (config.footer.fontFamily === "serif" ? 12 : 13),
      fontWeight: config.container.spacing === "compact" ? 600 : 600,
      color: config.footer.color,
      margin: 0,
      ...(config.footer.fontFamily === "serif" ? { fontFamily: FONT_MAP.serif } : {}),
    },

    footerDecoration: {
      borderTop: `1px solid ${config.footer.color}`,
      width: "40%",
      margin: "0 auto 12px",
      display: config.footer.showDecoration ? "block" : "none",
    },

    sidebar: config.container.sidebarWidth > 0 ? {
      width: config.container.sidebarWidth,
      background: config.container.sidebarColor,
      flexShrink: 0,
    } : null,
  };
}
