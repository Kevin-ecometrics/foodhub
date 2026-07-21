export interface ContainerConfig {
  background: string;
  borderStyle: "solid" | "dotted" | "none";
  borderRadius: "none" | "small" | "medium" | "large";
  spacing: "compact" | "normal" | "spacious";
  sidebarWidth: number;
  sidebarColor: string;
}

export interface HeaderConfig {
  background: string;
  textColor: string;
  fontFamily: "sans" | "serif";
  showDecoration: boolean;
  showName: boolean;
  showTable: boolean;
}

export interface CustomersConfig {
  showIcons: boolean;
  accentColor: string;
  fontFamily: "sans" | "serif";
}

export interface ItemsConfig {
  format: "detailed" | "dots" | "inline";
  fontFamily: "sans" | "serif";
}

export interface TotalsConfig {
  accentColor: string;
  fontFamily: "sans" | "serif";
}

export interface FooterConfig {
  text: string;
  color: string;
  fontFamily: "sans" | "serif";
  showDecoration: boolean;
}

export interface ModeConfig {
  container: ContainerConfig;
  header: HeaderConfig;
  customers: CustomersConfig;
  items: ItemsConfig;
  totals: TotalsConfig;
  footer: FooterConfig;
}

export interface CheckUiConfig {
  modern: ModeConfig;
  classic: ModeConfig;
  compact: ModeConfig;
}

const NAVY = "oklch(22% 0.04 260)";
const ACCENT = "oklch(62% 0.18 32)";
const WHITE = "#ffffff";
const SURFACE = "oklch(98.5% 0.005 80)";
const MUTED = "oklch(55% 0.02 260)";
const TEXT = "oklch(20% 0.02 260)";
const BORDER = "oklch(88% 0.01 260)";
const GREEN = "oklch(52% 0.16 145)";
const NAVY_75 = "oklch(65% 0.01 260)";

export const DEFAULT_CONFIG: CheckUiConfig = {
  modern: {
    container: {
      background: WHITE,
      borderStyle: "solid",
      borderRadius: "large",
      spacing: "normal",
      sidebarWidth: 0,
      sidebarColor: NAVY,
    },
    header: {
      background: NAVY,
      textColor: NAVY_75,
      fontFamily: "sans",
      showDecoration: false,
      showName: true,
      showTable: true,
    },
    customers: {
      showIcons: true,
      accentColor: TEXT,
      fontFamily: "sans",
    },
    items: {
      format: "detailed",
      fontFamily: "sans",
    },
    totals: {
      accentColor: TEXT,
      fontFamily: "sans",
    },
    footer: {
      text: "✅ ¡Gracias por su visita!",
      color: GREEN,
      fontFamily: "sans",
      showDecoration: false,
    },
  },
  classic: {
    container: {
      background: SURFACE,
      borderStyle: "dotted",
      borderRadius: "small",
      spacing: "normal",
      sidebarWidth: 0,
      sidebarColor: ACCENT,
    },
    header: {
      background: "transparent",
      textColor: ACCENT,
      fontFamily: "serif",
      showDecoration: true,
      showName: true,
      showTable: true,
    },
    customers: {
      showIcons: false,
      accentColor: ACCENT,
      fontFamily: "serif",
    },
    items: {
      format: "dots",
      fontFamily: "serif",
    },
    totals: {
      accentColor: ACCENT,
      fontFamily: "serif",
    },
    footer: {
      text: "¡Gracias por su preferencia! — Vuelva pronto",
      color: ACCENT,
      fontFamily: "serif",
      showDecoration: true,
    },
  },
  compact: {
    container: {
      background: WHITE,
      borderStyle: "solid",
      borderRadius: "medium",
      spacing: "compact",
      sidebarWidth: 0,
      sidebarColor: NAVY,
    },
    header: {
      background: "transparent",
      textColor: NAVY,
      fontFamily: "sans",
      showDecoration: false,
      showName: true,
      showTable: true,
    },
    customers: {
      showIcons: true,
      accentColor: TEXT,
      fontFamily: "sans",
    },
    items: {
      format: "inline",
      fontFamily: "sans",
    },
    totals: {
      accentColor: TEXT,
      fontFamily: "sans",
    },
    footer: {
      text: "✅ Gracias por su visita",
      color: MUTED,
      fontFamily: "sans",
      showDecoration: false,
    },
  },
};

export function getDefaultConfig(mode: string): ModeConfig {
  switch (mode) {
    case "classic":
      return structuredClone(DEFAULT_CONFIG.classic);
    case "compact":
      return structuredClone(DEFAULT_CONFIG.compact);
    default:
      return structuredClone(DEFAULT_CONFIG.modern);
  }
}

export const SPACING_MAP = {
  compact: { containerPadding: "12px", customerPadding: "10px 16px", itemPadding: "6px 16px", sectionGap: "8px" },
  normal: { containerPadding: "24px", customerPadding: "16px 24px 12px", itemPadding: "12px 18px", sectionGap: "16px" },
  spacious: { containerPadding: "32px", customerPadding: "20px 32px 16px", itemPadding: "16px 24px", sectionGap: "24px" },
} as const;

export const BORDER_RADIUS_MAP = {
  none: "0px",
  small: "8px",
  medium: "12px",
  large: "16px",
} as const;

export const FONT_MAP = {
  sans: "'Plus Jakarta Sans', sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
} as const;
