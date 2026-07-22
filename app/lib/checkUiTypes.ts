export interface TicketConfig {
  containerBg: string;
  containerBorder: "solid" | "dotted" | "none";
  containerRadius: "none" | "small" | "medium" | "large";
  spacing: "compact" | "normal" | "spacious";
  headerColor: string;
  headerBg: string;
  accentColor: string;
  fontFamily: "sans" | "serif";
  footerText: string;
  footerColor: string;
}

export interface CheckUiConfig {
  modern: TicketConfig;
  classic: TicketConfig;
  compact: TicketConfig;
}

const NAVY = "oklch(22% 0.04 260)";
const ACCENT = "oklch(62% 0.18 32)";
const WHITE = "#ffffff";
const SURFACE = "oklch(98.5% 0.005 80)";
const MUTED = "oklch(55% 0.02 260)";
const TEXT = "oklch(20% 0.02 260)";
const BORDER = "oklch(88% 0.01 260)";
const GREEN = "oklch(52% 0.16 145)";

export const DEFAULT_CONFIG: CheckUiConfig = {
  modern: {
    containerBg: WHITE,
    containerBorder: "solid",
    containerRadius: "large",
    spacing: "normal",
    headerColor: WHITE,
    headerBg: NAVY,
    accentColor: TEXT,
    fontFamily: "sans",
    footerText: "GRACIAS POR SU PREFERENCIA",
    footerColor: GREEN,
  },
  classic: {
    containerBg: SURFACE,
    containerBorder: "dotted",
    containerRadius: "small",
    spacing: "normal",
    headerColor: ACCENT,
    headerBg: "transparent",
    accentColor: ACCENT,
    fontFamily: "serif",
    footerText: "GRACIAS POR SU PREFERENCIA",
    footerColor: ACCENT,
  },
  compact: {
    containerBg: WHITE,
    containerBorder: "solid",
    containerRadius: "medium",
    spacing: "compact",
    headerColor: NAVY,
    headerBg: "transparent",
    accentColor: TEXT,
    fontFamily: "sans",
    footerText: "GRACIAS POR SU PREFERENCIA",
    footerColor: MUTED,
  },
};

export function getDefaultConfig(mode: string): TicketConfig {
  switch (mode) {
    case "classic": return structuredClone(DEFAULT_CONFIG.classic);
    case "compact": return structuredClone(DEFAULT_CONFIG.compact);
    default: return structuredClone(DEFAULT_CONFIG.modern);
  }
}

export const SPACING_MAP = {
  compact: { pad: "12px", padSm: "6px 12px", gap: "6px", fs: 9 },
  normal: { pad: "20px", padSm: "10px 20px", gap: "10px", fs: 10 },
  spacious: { pad: "28px", padSm: "14px 28px", gap: "14px", fs: 11 },
} as const;

export const BORDER_RADIUS_MAP = {
  none: "0px", small: "8px", medium: "12px", large: "16px",
} as const;

export const FONT_MAP = {
  sans: "'Plus Jakarta Sans', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
} as const;
