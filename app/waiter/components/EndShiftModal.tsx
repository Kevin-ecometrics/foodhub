"use client"

interface EndShiftModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  session: {
    waiterName: string
    startedAt: string
    totalSales: number
    totalTips: number
  }
  distribution: Record<string, number>
}

export default function EndShiftModal({
  isOpen,
  onClose,
  onConfirm,
  session,
  distribution,
}: EndShiftModalProps) {
  if (!isOpen) return null

  const formatCurrency = (n: number) =>
    n.toLocaleString("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 })

  const totalPct = Object.values(distribution).reduce((s, v) => s + v, 0)
  const now = new Date()
  const fecha = now.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const hora = now.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  const start = session.startedAt
    ? new Date(session.startedAt).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—"

  const entries = Object.entries(distribution).filter(([, pct]) => pct > 0)

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 900,
        padding: 16,
        animation: "wr-fadein 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 18,
          width: "100%",
          maxWidth: 420,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
          animation: "wr-scalein 0.22s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "22px 22px 16px",
            borderBottom: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", margin: 0 }}>
            Cierre de Turno
          </p>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
            {fecha} — {hora}
          </p>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "16px 22px" }}>
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Mesero</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                {session.waiterName}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Inicio de turno</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {start}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--muted)" }}>Total ventas</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--green)" }}>
                {formatCurrency(session.totalSales)}
              </span>
            </div>
          </div>

          <div
            style={{
              background: "var(--accent-light)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 14,
              border: "1.5px solid var(--accent)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--accent)" }}>
                Propinas recolectadas
              </span>
              <span style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>
                {formatCurrency(session.totalTips)}
              </span>
            </div>
          </div>

          {entries.length > 0 && (
            <div
              style={{
                border: "1.5px solid var(--border)",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: "var(--surface)",
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  Distribución de propinas
                </p>
              </div>
              <div style={{ padding: "8px 18px" }}>
                {entries.map(([role, pct]) => {
                  const amount = session.totalTips * (pct / 100)
                  return (
                    <div
                      key={role}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: "1px solid var(--border)",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--text)" }}>
                        {role}
                      </span>
                      <span style={{ color: "var(--muted)" }}>
                        {pct}%
                      </span>
                      <span style={{ fontWeight: 700, color: "var(--green)" }}>
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  )
                })}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 0 6px",
                    fontSize: 13,
                    fontWeight: 800,
                    color: "var(--text)",
                  }}
                >
                  <span>Total %</span>
                  <span>{totalPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "14px 22px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "1.5px solid var(--border)",
              background: "var(--surface)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--muted)",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 10,
              border: "none",
              background: "var(--accent)",
              fontSize: 13,
              fontWeight: 700,
              color: "white",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
