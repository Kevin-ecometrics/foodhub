// app/admin/components/LoginForm.tsx
"use client";
import { useState } from "react";
import { ADMIN_CREDENTIALS } from "../types";

interface LoginFormProps {
  onLogin: () => void;
}

const IconUser = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const IconLock = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const IconEye = ({ off }: { off: boolean }) =>
  off ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

const IconQR = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none" />
    <rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none" />
    <rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none" />
    <path d="M14 14h3v3" />
    <path d="M21 14v.01" />
    <path d="M21 21v-4" />
    <path d="M14 21h7" />
  </svg>
);

const IconArrow = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

interface FloatingInputProps {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  rightEl?: React.ReactNode;
  error?: string;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  autoComplete?: string;
}

const FloatingInput = ({
  label,
  type,
  value,
  onChange,
  icon,
  rightEl,
  error,
  focused,
  onFocus,
  onBlur,
  autoComplete,
}: FloatingInputProps) => {
  const lifted = focused || value.length > 0;
  return (
    <div className="relative mb-2">
      <div
        className={`flex items-center rounded-xl border-[1.5px] transition-all duration-180 ease ${
          error
            ? "border-red-500"
            : focused
              ? "border-[oklch(62%_0.18_32)] bg-white shadow-[0_0_0_4px_oklch(96%_0.05_32)]"
              : "border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)]"
        }`}
      >
        <div
          className={`px-3 py-[18px] pl-4 transition-colors duration-180 ${
            focused ? "text-[oklch(62%_0.18_32)]" : "text-[oklch(55%_0.02_260)]"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 relative pt-2.5">
          <label
            className={`absolute left-0 font-medium text-[15px] leading-none pointer-events-none transition-all duration-180 ${
              error
                ? "text-red-500"
                : focused
                  ? "text-[oklch(62%_0.18_32)]"
                  : "text-[oklch(55%_0.02_260)]"
            }`}
            style={{
              top: lifted ? 6 : "50%",
              transform: lifted
                ? "translateY(0) scale(0.82)"
                : "translateY(-50%)",
              transformOrigin: "left center",
            }}
          >
            {label}
          </label>
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete={autoComplete}
            className="w-full border-none outline-none bg-transparent text-[15px] font-medium text-[oklch(20%_0.02_260)] py-3.5 leading-none"
          />
        </div>
        {rightEl && <div className="px-2 py-[18px]">{rightEl}</div>}
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5 ml-1">{error}</p>}
    </div>
  );
};

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    user?: string;
    pass?: string;
    global?: string;
  }>({});
  const [focusedUser, setFocusedUser] = useState(false);
  const [focusedPass, setFocusedPass] = useState(false);
  const [shake, setShake] = useState(false);

  const fillCreds = () => {
    setUsername(ADMIN_CREDENTIALS.username);
    setPassword(ADMIN_CREDENTIALS.password);
    setErrors({});
  };

  const validate = () => {
    const e: { user?: string; pass?: string } = {};
    if (!username.trim()) e.user = "El usuario es requerido";
    if (!password.trim()) e.pass = "La contraseña es requerida";
    return e;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      setSuccess(true);
      setTimeout(() => onLogin(), 800);
    } else {
      setLoading(false);
      setErrors({ global: "Credenciales incorrectas. Intenta de nuevo." });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div
        className={`w-full max-w-[420px] px-6 py-10 ${
          shake ? "animate-shake" : "animate-fadeUp"
        }`}
      >
        {success ? (
          <div className="text-center animate-fadeUp">
            <div className="w-[72px] h-[72px] rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center animate-scaleIn">
              <svg
                width="34"
                height="34"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-[oklch(20%_0.02_260)] mb-2">
              ¡Bienvenido!
            </h2>
            <p className="text-[15px] text-[oklch(55%_0.02_260)]">
              Redirigiendo al panel…
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-9 h-9 rounded-[10px] bg-accent flex items-center justify-center text-white">
                <IconQR />
              </div>
              <span className="text-[oklch(22%_0.04_260)] font-bold text-4xl tracking-tight">
                ScanEat
              </span>
            </div>

            <div className="mb-8">
              <h2 className="text-[28px] font-extrabold text-accent text-shadow-2xs tracking-tight mb-1.5">
                Iniciar sesión
              </h2>
              <p className="text-sm text-[oklch(55%_0.02_260)]">
                Accede a tu panel de gestión
              </p>
            </div>

            {errors.global && (
              <div className="bg-red-50 border border-red-200 rounded-[10px] p-3.5 mb-5 flex items-center gap-2.5 animate-fadeUp">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="oklch(55%_0.18_20)"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span className="text-[13px] text-red-600 font-medium">
                  {errors.global}
                </span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3.5">
                <FloatingInput
                  label="Usuario"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrors((p) => ({
                      ...p,
                      user: undefined,
                      global: undefined,
                    }));
                  }}
                  icon={<IconUser />}
                  error={errors.user}
                  focused={focusedUser}
                  onFocus={() => setFocusedUser(true)}
                  onBlur={() => setFocusedUser(false)}
                  autoComplete="username"
                />
              </div>
              <div className="mb-6">
                <FloatingInput
                  label="Contraseña"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((p) => ({
                      ...p,
                      pass: undefined,
                      global: undefined,
                    }));
                  }}
                  icon={<IconLock />}
                  error={errors.pass}
                  focused={focusedPass}
                  onFocus={() => setFocusedPass(true)}
                  onBlur={() => setFocusedPass(false)}
                  autoComplete="current-password"
                  rightEl={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="bg-transparent border-none cursor-pointer text-[oklch(55%_0.02_260)] flex items-center p-0 transition-colors duration-150 hover:text-[oklch(62%_0.18_32)]"
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                    >
                      <IconEye off={showPassword} />
                    </button>
                  }
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-[15px] px-6 rounded-xl border-none cursor-pointer bg-[oklch(62%_0.18_32)] text-white text-[15px] font-bold tracking-tight flex items-center justify-center gap-2.5 transition-all duration-180 hover:bg-[oklch(50%_0.18_32)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_oklch(55%_0.18_32_/_0.35)] active:translate-y-0 disabled:cursor-default disabled:hover:bg-[oklch(62%_0.18_32)] disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                    </svg>
                    Verificando…
                  </>
                ) : (
                  <>
                    Iniciar sesión <IconArrow />
                  </>
                )}
              </button>
            </form>

            <div className="mt-9 border-t border-[oklch(88%_0.01_260)] pt-6">
              <p className="text-xs text-[oklch(55%_0.02_260)] text-center mb-3 font-medium tracking-widest uppercase">
                Credenciales de prueba
              </p>
              <button
                onClick={fillCreds}
                className="group w-full bg-[oklch(98.5%_0.005_80)] border border-[1.5px_oklch(88%_0.01_260)] rounded-[10px] py-2.5 px-4 cursor-pointer flex items-center justify-center gap-3 hover:bg-accent hover:border-[1.5px_oklch(62%_0.18_32)] hover:text-white transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span className="text-[13px] text-[oklch(55%_0.02_260)] group-hover:text-white transition-colors duration-150">
                  <span className="font-mono text-[oklch(20%_0.02_260)] font-semibold group-hover:text-white">
                    admin
                  </span>
                  <span className="mx-2 opacity-35">/</span>
                  <span className="font-mono text-[oklch(20%_0.02_260)] font-semibold group-hover:text-white">
                    restaurant
                  </span>
                </span>
                <span className="text-xs bg-accent-light text-accent group-hover:text-black px-2 py-1 rounded-md font-semibold transition-colors duration-150">
                  Usar
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20%,
          60% {
            transform: translateX(-6px);
          }
          40%,
          80% {
            transform: translateX(6px);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.7);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeUp {
          animation: fadeUp 0.4s ease both;
        }
        .animate-shake {
          animation: shake 0.45s ease;
        }
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  );
}
