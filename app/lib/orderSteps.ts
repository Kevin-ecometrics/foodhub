export interface OrderStep {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  icon: string;
  next: string;
}

export type OrderStepsConfig = Record<string, OrderStep>;

export const DEFAULT_ORDER_STEPS: OrderStepsConfig = {
  ordered: { label: "Ordenado", shortLabel: "Ord.", color: "var(--red)", bg: "var(--red-light)", icon: "●", next: "preparing" },
  preparing: { label: "En preparación", shortLabel: "Prep.", color: "var(--amber)", bg: "oklch(96% 0.06 70)", icon: "⏳", next: "ready" },
  ready: { label: "Listo", shortLabel: "Listo", color: "var(--blue)", bg: "var(--blue-light)", icon: "✓", next: "served" },
  served: { label: "Servido", shortLabel: "Serv.", color: "var(--green)", bg: "var(--green-light)", icon: "✓", next: "served" },
  cancelled: { label: "Cancelado", shortLabel: "Canc.", color: "var(--muted)", bg: "var(--surface)", icon: "✕", next: "cancelled" },
};

export function parseOrderSteps(raw: string | null | undefined): OrderStepsConfig {
  if (!raw) return DEFAULT_ORDER_STEPS;
  try {
    const parsed = JSON.parse(raw) as Partial<OrderStepsConfig>;
    const merged: OrderStepsConfig = {} as OrderStepsConfig;
    for (const key of Object.keys(DEFAULT_ORDER_STEPS)) {
      merged[key] = { ...DEFAULT_ORDER_STEPS[key], ...(parsed[key] || {}) };
    }
    return merged;
  } catch {
    return DEFAULT_ORDER_STEPS;
  }
}

export function getStepKeys(): string[] {
  return ["ordered", "preparing", "ready", "served", "cancelled"];
}
