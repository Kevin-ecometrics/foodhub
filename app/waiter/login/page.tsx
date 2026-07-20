"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "password" | "pin";

export default function WaiterLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("pin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const body =
      mode === "pin"
        ? { mode: "pin", pin }
        : { mode: "password", email, password };

    if (mode === "pin" && pin.length !== 4) {
      setError("Ingresa un PIN de 4 dígitos");
      return;
    }
    if (mode === "password" && (!email.trim() || !password)) {
      setError("Correo y contraseña son requeridos");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/waiter-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        setLoading(false);
        return;
      }
      router.push("/waiter");
    } catch {
      setError("Error de conexión con el servidor");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "white",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "oklch(22% 0.04 260)",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            Panel del Mesero
          </p>
          <p style={{ fontSize: 13, color: "oklch(55% 0.02 260)", marginTop: 6 }}>
            Ingresa con tu correo o tu PIN
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 6,
            background: "oklch(96% 0.005 260)",
            padding: 4,
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          {(["pin", "password"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
              }}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: 9,
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                background: mode === m ? "oklch(62% 0.18 32)" : "transparent",
                color: mode === m ? "white" : "oklch(45% 0.02 260)",
                transition: "all 0.15s",
              }}
            >
              {m === "pin" ? "PIN" : "Correo / Contraseña"}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              background: "oklch(96% 0.05 20)",
              border: "1px solid oklch(85% 0.08 20)",
              borderRadius: 10,
              padding: "11px 14px",
              marginBottom: 18,
              fontSize: 13,
              fontWeight: 600,
              color: "oklch(45% 0.18 20)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === "pin" ? (
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="• • • •"
              style={{
                width: "100%",
                textAlign: "center",
                fontSize: 32,
                letterSpacing: 12,
                fontWeight: 800,
                padding: "18px 14px",
                borderRadius: 14,
                border: "1.5px solid oklch(88% 0.01 260)",
                background: "oklch(98.5% 0.005 80)",
                outline: "none",
                marginBottom: 20,
                fontFamily: "inherit",
                color: "oklch(20% 0.02 260)",
              }}
            />
          ) : (
            <>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo"
                autoComplete="username"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1.5px solid oklch(88% 0.01 260)",
                  background: "oklch(98.5% 0.005 80)",
                  outline: "none",
                  marginBottom: 12,
                  fontSize: 14,
                  fontFamily: "inherit",
                  color: "oklch(20% 0.02 260)",
                }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1.5px solid oklch(88% 0.01 260)",
                  background: "oklch(98.5% 0.005 80)",
                  outline: "none",
                  marginBottom: 20,
                  fontSize: 14,
                  fontFamily: "inherit",
                  color: "oklch(20% 0.02 260)",
                }}
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              borderRadius: 12,
              border: "none",
              background: "oklch(62% 0.18 32)",
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Verificando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
