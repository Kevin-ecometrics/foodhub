"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/app/context/ToastContext";
import { settingsService } from "@/app/lib/supabase/settings";
import { FaCog, FaSpinner, FaImage, FaClock, FaChevronDown, FaEye, FaEyeSlash, FaSearch, FaPalette, FaDollarSign, FaBuilding, FaList, FaPercentage } from "react-icons/fa";
import CheckUiPreview from "./CheckUiPreview";
import CheckUiCustomizer from "./CheckUiCustomizer";
import CheckUiCustomizerColor from "./CheckUiCustomizerColor";
import { CheckUiConfig } from "@/app/lib/checkUiTypes";
import { parseOrderSteps, getStepKeys, DEFAULT_ORDER_STEPS, OrderStep } from "@/app/lib/orderSteps";

interface SettingsManagementProps {
  onError: (error: string) => void;
  coverImageUrl: string | null;
  onOpenCoverUpload?: () => void;
  logoImageUrl: string | null;
  onOpenLogoUpload?: () => void;
}

interface SettingDef {
  key: string;
  label: string;
  description: string;
  type: "toggle" | "time" | "select" | "cover" | "password" | "action" | "text" | "number";
  options?: { label: string; value: string }[];
  actionLabel?: string;
  actionIcon?: React.ReactNode;
  placeholder?: string;
}

const SETTINGS: SettingDef[] = [
  {
    key: "product_notes_enabled",
    label: "Notas especiales en productos",
    description:
      "Permite al cliente escribir una instrucción especial al agregar un producto al carrito (ej: sin cebolla, extra queso, bien cocido).",
    type: "toggle",
  },
  {
    key: "product_ratings_enabled",
    label: "Calificación de productos en el menú",
    description:
      "Muestra el promedio de estrellas y número de reseñas de cada producto (calculado de las encuestas post-pago) al abrir sus detalles en el menú.",
    type: "toggle",
  },
  {
    key: "breakfast_end_hour",
    label: "Cambio de Desayuno a Comida",
    description:
      "Define la hora en la que el menú cambia automáticamente de desayuno a comida.",
    type: "time",
  },
  {
    key: "printing_enabled",
    label: "Impresión",
    description:
      "Habilita o deshabilita la impresión de tickets y comandas en la cocina.",
    type: "toggle",
  },
  {
    key: "default_check_ui",
    label: "Diseño de cuenta por defecto",
    description:
      "Selecciona el diseño visual que se usará al generar la cuenta del cliente.",
    type: "select",
    options: [
      { label: "Moderno", value: "modern" },
      { label: "Clásico", value: "classic" },
      { label: "Compacto", value: "compact" },
    ],
  },
  {
    key: "cover",
    label: "Cover del menú",
    description:
      "Imagen de portada que se muestra en la parte superior del menú digital del cliente.",
    type: "cover",
  },
  {
    key: "logo",
    label: "Logo del negocio",
    description:
      "Logo que se muestra en la barra lateral del panel administrativo.",
    type: "cover",
  },
  {
    key: "close_table_pin",
    label: "PIN para cerrar mesa",
    description:
      "PIN que el mesero debe ingresar para autorizar el cierre de una mesa. Déjalo vacío para no requerir PIN.",
    type: "password",
  },
  {
    key: "business_data",
    label: "Datos del negocio",
    description: "Nombre, propietario, RFC, dirección y sucursal que aparecen en el encabezado del ticket.",
    type: "action",
    actionLabel: "Editar",
    actionIcon: <FaBuilding className="text-[10px]" />,
  },
  {
    key: "iva_usd_rates",
    label: "IVA y tipo de cambio",
    description: "Tasa de IVA (%) y tipo de cambio USD/MXN para el cálculo de totales en el ticket.",
    type: "action",
    actionLabel: "Editar",
    actionIcon: <FaDollarSign className="text-[10px]" />,
  },
  {
    key: "order_steps",
    label: "Pasos del pedido",
    description:
      "Personaliza las etiquetas, íconos y colores de cada estado del pedido (Ordenado → Preparación → Listo → Servido).",
    type: "action",
    actionLabel: "Personalizar",
    actionIcon: <FaPalette className="text-[10px]" />,
  },
  {
    key: "tip_distribution",
    label: "Distribución de propinas",
    description:
      "Porcentaje que recibe cada rol del total de propinas recolectadas al cierre del turno del mesero.",
    type: "action",
    actionLabel: "Editar",
    actionIcon: <FaPercentage className="text-[10px]" />,
  },
];

export default function SettingsManagement({
  onError,
  coverImageUrl,
  onOpenCoverUpload,
  logoImageUrl,
  onOpenLogoUpload,
}: SettingsManagementProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showCheckUiPreview, setShowCheckUiPreview] = useState(false);
  const [showCheckUiCustomizer, setShowCheckUiCustomizer] = useState(false);
  const [checkUiCustomConfig, setCheckUiCustomConfig] = useState<CheckUiConfig | null>(null);
  const [showPrintPaymentModal, setShowPrintPaymentModal] = useState(false);
  const [printPaymentLoading, setPrintPaymentLoading] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [showOrderStepsEditor, setShowOrderStepsEditor] = useState(false);
  const [orderStepsRaw, setOrderStepsRaw] = useState<string | null>(null);
  const [orderStepsForm, setOrderStepsForm] = useState<Record<string, OrderStep>>({});
  const [showTipDistributionEditor, setShowTipDistributionEditor] = useState(false);
  const [tipDistributionForm, setTipDistributionForm] = useState<Record<string, string>>({});
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [businessForm, setBusinessForm] = useState<Record<string, string>>({});
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [ratesForm, setRatesForm] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsService.getAllSettings();
      setValues(data);
      if (data["check_ui_customization"]) {
        try {
          setCheckUiCustomConfig(JSON.parse(data["check_ui_customization"]));
        } catch { /* keep null = use defaults */ }
      }
      const stepsRaw = data["order_steps"] || null;
      setOrderStepsRaw(stepsRaw);
      setOrderStepsForm(structuredClone(parseOrderSteps(stepsRaw)));
      const tipRaw = data["tip_distribution"];
      if (tipRaw) {
        try {
          const parsed = JSON.parse(tipRaw) as Record<string, number>;
          const strMap: Record<string, string> = {};
          for (const [k, v] of Object.entries(parsed)) {
            strMap[k] = String(v);
          }
          setTipDistributionForm(strMap);
        } catch { /* ignore */ }
      }
    } catch {
      onError("Error cargando la configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, current: string) => {
    if (key === "printing_enabled" && current === 'false') {
      setCardName(""); setCardNumber(""); setCardExpiry(""); setCardCvc("");
      setShowPrintPaymentModal(true);
      return;
    }
    setSavingKey(key);
    const now = current === 'true';
    const next = !now;
    const nextStr = next ? 'true' : 'false';
    setValues((prev) => ({ ...prev, [key]: nextStr }));
    try {
      await settingsService.updateSetting(key, nextStr);
      toast(next ? "Activado" : "Desactivado", "success");
    } catch {
      setValues((prev) => ({ ...prev, [key]: current }));
      onError("Error guardando la configuración");
    } finally {
      setSavingKey(null);
    }
  };

  const handleConfirmPrintPayment = async () => {
    setPrintPaymentLoading(true);
    try {
      await settingsService.updateSetting("printing_enabled", "true");
      setValues((prev) => ({ ...prev, printing_enabled: 'true' }));
      toast("Impresión activada — Pago registrado", "success");
      setShowPrintPaymentModal(false);
    } catch {
      onError("Error activando la impresión");
    } finally {
      setPrintPaymentLoading(false);
    }
  };

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + " / " + digits.slice(2);
    return digits;
  };

  const formatCvc = (val: string) => val.replace(/\D/g, "").slice(0, 4);

  const isCardValid =
    cardName.trim().length > 0 &&
    cardNumber.replace(/\s/g, "").length === 16 &&
    cardExpiry.replace(/\s/g, "").length === 4 &&
    cardCvc.length >= 3;

  const handleTimeChange = async (key: string, value: string) => {
    setSavingKey(key);
    setValues((prev) => ({ ...prev, [key]: value }));
    try {
      await settingsService.updateSetting(key, value);
      toast("Hora actualizada", "success");
    } catch {
      onError("Error guardando la configuración");
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelectChange = async (key: string, value: string) => {
    setSavingKey(key);
    setValues((prev) => ({ ...prev, [key]: value }));
    try {
      await settingsService.updateSetting(key, value);
      toast("Opción actualizada", "success");
    } catch {
      onError("Error guardando la configuración");
    } finally {
      setSavingKey(null);
    }
  };

  const handlePasswordChange = async (key: string, value: string) => {
    setSavingKey(key);
    setValues((prev) => ({ ...prev, [key]: value }));
    try {
      await settingsService.updateSetting(key, value);
      toast("PIN actualizado", "success");
    } catch {
      onError("Error guardando la configuración");
    } finally {
      setSavingKey(null);
    }
  };

  const getIcon = (type: string, key: string) => {
    if (key === "business_data")
      return <FaBuilding className="text-[oklch(62%_0.18_32)] text-sm" />;
    if (key === "iva_usd_rates")
      return <FaDollarSign className="text-[oklch(62%_0.18_32)] text-sm" />;
    switch (type) {
      case "time":
        return <FaClock className="text-[oklch(62%_0.18_32)] text-sm" />;
      case "select":
        return <FaChevronDown className="text-[oklch(62%_0.18_32)] text-sm" />;
      case "cover":
        return <FaImage className="text-[oklch(62%_0.18_32)] text-sm" />;
      case "action":
        return <FaPalette className="text-[oklch(62%_0.18_32)] text-sm" />;
      default:
        return <FaCog className="text-[oklch(62%_0.18_32)] text-sm" />;
    }
  };

  const renderControl = (setting: SettingDef) => {
    if (setting.type === "toggle") {
      const raw = values[setting.key] ?? 'false';
      const enabled = raw === 'true';
      const isSaving = savingKey === setting.key;
      return (
        <button
          onClick={() => handleToggle(setting.key, raw)}
          disabled={isSaving}
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 disabled:opacity-60"
        >
          <div
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${enabled ? "bg-emerald-500" : "bg-[oklch(82%_0.01_260)]"}`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${enabled ? "translate-x-4" : "translate-x-0"}`}
            />
          </div>
          <span
            className={`text-xs font-bold w-16 text-left ${enabled ? "text-emerald-700" : "text-[oklch(50%_0.02_260)]"}`}
          >
            {enabled ? "Activado" : "Desactivado"}
          </span>
        </button>
      );
    }

    if (setting.type === "time") {
      const val = (values[setting.key] as string) ?? "11:00";
      return (
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="time"
            value={val}
            onChange={(e) => handleTimeChange(setting.key, e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-[9px] text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />
        </div>
      );
    }

    if (setting.type === "select") {
      const val = (values[setting.key] as string) ?? (setting.options?.[0]?.value ?? "");
      const isCheckUi = setting.key === "default_check_ui";
      return (
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <select
              value={val}
              onChange={(e) => handleSelectChange(setting.key, e.target.value)}
              className="appearance-none px-3 py-1.5 pr-8 border border-slate-200 rounded-[9px] text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] cursor-pointer"
            >
              {setting.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none" />
          </div>
          {isCheckUi && (
            <>
              <button
                onClick={() => setShowCheckUiPreview(true)}
                className="px-3 py-1.5 rounded-[9px] border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1.5"
              >
                <FaSearch className="text-[10px]" />
                Vista Previa
              </button>
              <button
                onClick={() => setShowCheckUiCustomizer(true)}
                className="px-3 py-1.5 rounded-[9px] bg-[oklch(62%_0.18_32)] text-xs font-bold text-white hover:brightness-110 transition cursor-pointer flex items-center gap-1.5"
              >
                <FaPalette className="text-[10px]" />
                Personalizar
              </button>
            </>
          )}
        </div>
      );
    }

    if (setting.type === "password") {
      const val = (values[setting.key] as string) ?? '';
      const visible = visiblePasswords[setting.key];
      const isSaving = savingKey === setting.key;
      return (
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <input
              type={visible ? "text" : "password"}
              value={val}
              onChange={(e) => handlePasswordChange(setting.key, e.target.value)}
              placeholder="••••"
              className="w-28 px-3 py-1.5 pr-9 border border-slate-200 rounded-[9px] text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
              maxLength={10}
            />
            <button
              type="button"
              onClick={() =>
                setVisiblePasswords((prev) => ({
                  ...prev,
                  [setting.key]: !prev[setting.key],
                }))
              }
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {visible ? <FaEyeSlash className="text-[11px]" /> : <FaEye className="text-[11px]" />}
            </button>
          </div>
          {isSaving && <FaSpinner className="animate-spin text-[11px] text-slate-400" />}
        </div>
      );
    }

    if (setting.type === "action") {
      return (
        <button
          onClick={() => {
            if (setting.key === "order_steps") {
              setOrderStepsForm(structuredClone(parseOrderSteps(orderStepsRaw)));
              setShowOrderStepsEditor(true);
            } else if (setting.key === "tip_distribution") {
              setShowTipDistributionEditor(true);
            } else if (setting.key === "business_data") {
              setBusinessForm({
                business_name: values["business_name"] ?? "",
                business_owner: values["business_owner"] ?? "",
                business_rfc: values["business_rfc"] ?? "",
                business_address: values["business_address"] ?? "",
                business_sucursal: values["business_sucursal"] ?? "",
              });
              setShowBusinessModal(true);
            } else if (setting.key === "iva_usd_rates") {
              setRatesForm({
                iva_rate: values["iva_rate"] ?? "16",
                usd_rate: values["usd_rate"] ?? "20.50",
              });
              setShowRatesModal(true);
            }
          }}
          className="px-4 py-2 rounded-[9px] bg-[oklch(62%_0.18_32)] text-xs font-bold text-white hover:brightness-110 transition cursor-pointer flex items-center gap-1.5 flex-shrink-0"
        >
          {setting.actionIcon}
          {setting.actionLabel}
        </button>
      );
    }

    if (setting.type === "text" || setting.type === "number") {
      const val = (values[setting.key] as string) ?? "";
      const isSaving = savingKey === setting.key;
      return (
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type={setting.type === "number" ? "number" : "text"}
            value={val}
            onChange={(e) => {
              const v = e.target.value;
              setValues((prev) => ({ ...prev, [setting.key]: v }));
            }}
            onBlur={async (e) => {
              const v = e.target.value;
              if (v === (values[setting.key] ?? "")) return;
              setSavingKey(setting.key);
              try {
                await settingsService.updateSetting(setting.key, v);
                toast("Guardado", "success");
              } catch {
                onError("Error guardando");
              } finally {
                setSavingKey(null);
              }
            }}
            placeholder={setting.placeholder ?? ""}
            className="w-48 px-3 py-1.5 border border-slate-200 rounded-[9px] text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
          />
          {isSaving && <FaSpinner className="animate-spin text-[11px] text-slate-400" />}
        </div>
      );
    }

    if (setting.type === "cover") {
      const isLogo = setting.key === "logo";
      const imageUrl = isLogo ? logoImageUrl : coverImageUrl;
      const onUpload = isLogo ? onOpenLogoUpload : onOpenCoverUpload;
      const previewBg = isLogo
        ? "bg-gradient-to-br from-purple-500 to-blue-500"
        : "bg-gradient-to-br from-purple-500 to-blue-500";
      return (
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className={`w-10 h-10 rounded-[9px] ${previewBg} flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200`}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={isLogo ? "Logo" : "Cover"}
                className="w-full h-full object-cover"
              />
            ) : (
              <FaImage className="text-white text-sm" />
            )}
          </div>
          <button
            onClick={onUpload}
            className="px-3 py-1.5 rounded-[9px] border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {imageUrl ? "Cambiar" : "Subir"}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-5" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <div className="flex items-center gap-2.5">
        <h2 className="text-[18px] font-extrabold text-slate-900">
          Configuración
        </h2>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-2xl text-[var(--color-accent)] mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">
            Cargando configuración...
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[14px] divide-y divide-slate-100">
          {SETTINGS.map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between gap-4 p-5"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {getIcon(setting.type, setting.key)}
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">
                    {setting.label}
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5 max-w-xl">
                    {setting.description}
                  </p>
                </div>
              </div>
              {renderControl(setting)}
            </div>
          ))}
        </div>
      )}

      {showCheckUiPreview && (
        <div
          onClick={() => setShowCheckUiPreview(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] overflow-hidden shadow-2xl animate-[wr-scalein_0.22s_ease]"
            style={{ width: "min(94vw, 480px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
                  <FaSearch className="text-[oklch(62%_0.18_32)] text-sm" />
                </div>
                <p className="text-[17px] font-extrabold text-slate-900">
                  Vista Previa — Diseño {values["default_check_ui"] === "compact" ? "Compacto" : values["default_check_ui"] === "classic" ? "Clásico" : "Moderno"}
                </p>
              </div>
              <button
                onClick={() => setShowCheckUiPreview(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer bg-white flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <CheckUiPreview mode={values["default_check_ui"] || "modern"} customConfig={checkUiCustomConfig ?? undefined} />
            </div>
            <div className="p-5 pt-0">
              <button
                onClick={() => setShowCheckUiPreview(false)}
                className="w-full py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckUiCustomizer && (
        <div
          onClick={() => setShowCheckUiCustomizer(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] overflow-hidden shadow-2xl animate-[wr-scalein_0.22s_ease]"
            style={{ width: "min(96vw, 960px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
                  <FaPalette className="text-[oklch(62%_0.18_32)] text-sm" />
                </div>
                <p className="text-[17px] font-extrabold text-slate-900">
                  Personalizar diseños de cuenta
                </p>
              </div>
              <button
                onClick={() => setShowCheckUiCustomizer(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer bg-white flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto" style={{ flex: 1 }}>
              <CheckUiCustomizer
                initialConfig={checkUiCustomConfig ?? undefined}
                initialMode={values["default_check_ui"] || "modern"}
                onSave={async (config, activeMode) => {
                  await settingsService.updateSetting("check_ui_customization", JSON.stringify(config));
                  await settingsService.updateSetting("default_check_ui", activeMode);
                  setCheckUiCustomConfig(config);
                  setValues((prev) => ({ ...prev, default_check_ui: activeMode }));
                  toast("Configuración guardada", "success");
                }}
                onClose={() => setShowCheckUiCustomizer(false)}
              />
            </div>
          </div>
        </div>
      )}

      {showOrderStepsEditor && (
        <div
          onClick={() => setShowOrderStepsEditor(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] overflow-hidden shadow-2xl animate-[wr-scalein_0.22s_ease]"
            style={{ width: "min(96vw, 600px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
                  <FaList className="text-[oklch(62%_0.18_32)] text-sm" />
                </div>
                <p className="text-[17px] font-extrabold text-slate-900">
                  Pasos del pedido
                </p>
              </div>
              <button
                onClick={() => setShowOrderStepsEditor(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer bg-white flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto" style={{ flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {getStepKeys().map((key) => {
                  const s = orderStepsForm[key];
                  if (!s) return null;
                  return (
                    <div key={key} style={{ border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: s.bg, border: "1.5px solid oklch(88% 0.01 260)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: s.color, flexShrink: 0 }}>{s.icon}</div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", margin: 0, textTransform: "capitalize" }}>{key}</p>
                        <span style={{ fontSize: 11, color: s.color, fontWeight: 600, background: s.bg, padding: "2px 8px", borderRadius: 4 }}>{s.icon} {s.label}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", margin: "0 0 4px" }}>Etiqueta</p>
                          <input
                            value={s.label}
                            onChange={(e) => setOrderStepsForm((prev) => ({ ...prev, [key]: { ...prev[key], label: e.target.value } }))}
                            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", margin: "0 0 4px" }}>Etiqueta corta</p>
                          <input
                            value={s.shortLabel}
                            onChange={(e) => setOrderStepsForm((prev) => ({ ...prev, [key]: { ...prev[key], shortLabel: e.target.value } }))}
                            style={{ width: "100%", padding: "8px 10px", border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                          />
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <CheckUiCustomizerColor
                            label="Fondo"
                            value={s.bg}
                            onChange={(v) => setOrderStepsForm((prev) => ({ ...prev, [key]: { ...prev[key], bg: v } }))}
                          />
                        </div>
                        <div>
                          <CheckUiCustomizerColor
                            label="Texto"
                            value={s.color}
                            onChange={(v) => setOrderStepsForm((prev) => ({ ...prev, [key]: { ...prev[key], color: v } }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowOrderStepsEditor(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const merged = parseOrderSteps(orderStepsRaw);
                  for (const key of getStepKeys()) {
                    merged[key] = { ...merged[key], ...orderStepsForm[key] };
                  }
                  await settingsService.updateSetting("order_steps", JSON.stringify(merged));
                  setOrderStepsRaw(JSON.stringify(merged));
                  toast("Pasos guardados", "success");
                  setShowOrderStepsEditor(false);
                }}
                className="flex-1 py-3 rounded-xl border-none text-sm font-bold text-white bg-[oklch(62%_0.18_32)] cursor-pointer hover:brightness-110 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showTipDistributionEditor && (
        <div
          onClick={() => setShowTipDistributionEditor(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] overflow-hidden shadow-2xl animate-[wr-scalein_0.22s_ease]"
            style={{ width: "min(94vw, 420px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
                  <FaPercentage className="text-[oklch(62%_0.18_32)] text-sm" />
                </div>
                <p className="text-[17px] font-extrabold text-slate-900">
                  Distribución de propinas
                </p>
              </div>
              <button
                onClick={() => setShowTipDistributionEditor(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer bg-white flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto" style={{ flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(tipDistributionForm).map(([role, pct]) => (
                  <div
                    key={role}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "1.5px solid oklch(88% 0.01 260)",
                      borderRadius: 10,
                      padding: "12px 14px",
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                      {role}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={pct}
                        onChange={(e) =>
                          setTipDistributionForm((prev) => ({
                            ...prev,
                            [role]: e.target.value,
                          }))
                        }
                        style={{
                          width: 70,
                          padding: "8px 10px",
                          border: "1.5px solid oklch(88% 0.01 260)",
                          borderRadius: 8,
                          fontSize: 14,
                          fontWeight: 700,
                          textAlign: "right",
                          fontFamily: "inherit",
                          outline: "none",
                        }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>%</span>
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "var(--text)",
                    borderTop: "1px solid oklch(88% 0.01 260)",
                  }}
                >
                  <span>Total</span>
                  <span>
                    {Object.values(tipDistributionForm).reduce((s, v) => s + (parseFloat(v) || 0), 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowTipDistributionEditor(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const numericMap: Record<string, number> = {};
                  for (const [k, v] of Object.entries(tipDistributionForm)) {
                    numericMap[k] = parseFloat(v) || 0;
                  }
                  await settingsService.updateSetting("tip_distribution", JSON.stringify(numericMap));
                  toast("Distribución de propinas guardada", "success");
                  setShowTipDistributionEditor(false);
                }}
                className="flex-1 py-3 rounded-xl border-none text-sm font-bold text-white bg-[oklch(62%_0.18_32)] cursor-pointer hover:brightness-110 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showBusinessModal && (
        <div
          onClick={() => setShowBusinessModal(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] overflow-hidden shadow-2xl animate-[wr-scalein_0.22s_ease]"
            style={{ width: "min(94vw, 480px)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
                  <FaBuilding className="text-[oklch(62%_0.18_32)] text-sm" />
                </div>
                <p className="text-[17px] font-extrabold text-slate-900">Datos del negocio</p>
              </div>
              <button
                onClick={() => setShowBusinessModal(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer bg-white flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5 overflow-y-auto" style={{ flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { key: "business_name", label: "Nombre del negocio" },
                  { key: "business_owner", label: "Propietario" },
                  { key: "business_rfc", label: "RFC" },
                  { key: "business_address", label: "Dirección" },
                  { key: "business_sucursal", label: "Sucursal" },
                ].map((field) => (
                  <div key={field.key}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "0 0 4px" }}>{field.label}</p>
                    <input
                      value={businessForm[field.key] ?? ""}
                      onChange={(e) => setBusinessForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowBusinessModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  for (const [k, v] of Object.entries(businessForm)) {
                    await settingsService.updateSetting(k, v);
                  }
                  setValues((prev) => ({ ...prev, ...businessForm }));
                  toast("Datos del negocio guardados", "success");
                  setShowBusinessModal(false);
                }}
                className="flex-1 py-3 rounded-xl border-none text-sm font-bold text-white bg-[oklch(62%_0.18_32)] cursor-pointer hover:brightness-110 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showRatesModal && (
        <div
          onClick={() => setShowRatesModal(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] overflow-hidden shadow-2xl animate-[wr-scalein_0.22s_ease]"
            style={{ width: "min(94vw, 420px)" }}
          >
            <div className="flex items-center justify-between p-5 pb-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
                  <FaDollarSign className="text-[oklch(62%_0.18_32)] text-sm" />
                </div>
                <p className="text-[17px] font-extrabold text-slate-900">IVA y tipo de cambio</p>
              </div>
              <button
                onClick={() => setShowRatesModal(false)}
                className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition cursor-pointer bg-white flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="p-5" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "0 0 4px" }}>Tasa de IVA (%)</p>
                <input
                  type="number"
                  value={ratesForm["iva_rate"] ?? ""}
                  onChange={(e) => setRatesForm((prev) => ({ ...prev, iva_rate: e.target.value }))}
                  placeholder="16"
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", margin: "0 0 4px" }}>Tipo de cambio USD/MXN</p>
                <input
                  type="number"
                  value={ratesForm["usd_rate"] ?? ""}
                  onChange={(e) => setRatesForm((prev) => ({ ...prev, usd_rate: e.target.value }))}
                  placeholder="20.50"
                  style={{ width: "100%", padding: "9px 12px", border: "1.5px solid oklch(88% 0.01 260)", borderRadius: 10, fontSize: 13, fontFamily: "inherit", outline: "none" }}
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={() => setShowRatesModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  for (const [k, v] of Object.entries(ratesForm)) {
                    await settingsService.updateSetting(k, v);
                  }
                  setValues((prev) => ({ ...prev, ...ratesForm }));
                  toast("Tasas guardadas", "success");
                  setShowRatesModal(false);
                }}
                className="flex-1 py-3 rounded-xl border-none text-sm font-bold text-white bg-[oklch(62%_0.18_32)] cursor-pointer hover:brightness-110 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrintPaymentModal && (
        <div
          onClick={() => setShowPrintPaymentModal(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[18px] overflow-hidden shadow-2xl animate-[wr-scalein_0.22s_ease]"
            style={{ width: "min(94vw, 420px)" }}
          >
            {/* Header */}
            <div className="p-6 pb-0">
              <div className="w-12 h-12 rounded-[14px] bg-[oklch(96%_0.05_32)] flex items-center justify-center mb-3.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="oklch(62%_0.18_32)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 9 12 4 7 9"/>
                </svg>
              </div>
              <p className="text-[17px] font-extrabold text-slate-900 m-0">Activar Impresión</p>
              <p className="text-[13px] text-slate-500 mt-1 leading-relaxed m-0">
                Pago único de <strong className="text-slate-900">$35.00 USD</strong> para habilitar la impresión de tickets y comandas.
              </p>
            </div>

            {/* Order summary */}
            <div className="mx-6 mt-5 p-3.5 bg-slate-50 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-[13px] font-bold text-slate-900 m-0">Impresión</p>
                <p className="text-[11px] text-slate-500 mt-0.5 m-0">Licencia única</p>
              </div>
              <p className="text-[15px] font-extrabold text-slate-900 m-0">$35.00 USD</p>
            </div>

            {/* Card form */}
            <div className="px-6 pt-5">
              <p className="text-[11px] font-bold text-slate-600 mb-2.5 tracking-wide uppercase m-0">
                Datos de la tarjeta
              </p>

              <div className="mb-3.5">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Titular de la tarjeta</label>
                <input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Nombre del titular"
                  className="w-full px-3.5 py-[11px] border border-slate-200 rounded-[10px] text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                />
              </div>

              <div className="mb-3.5">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Número de tarjeta</label>
                <div className="relative">
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full pl-[38px] pr-3.5 py-[11px] border border-slate-200 rounded-[10px] text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                    style={{ letterSpacing: 0.5 }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                    💳
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mb-5">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">Vencimiento</label>
                  <input
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM / AA"
                    className="w-full px-3.5 py-[11px] border border-slate-200 rounded-[10px] text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1.5">CVC</label>
                  <input
                    value={cardCvc}
                    onChange={(e) => setCardCvc(formatCvc(e.target.value))}
                    placeholder="⚫⚫⚫"
                    className="w-full px-3.5 py-[11px] border border-slate-200 rounded-[10px] text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)]"
                  />
                </div>
              </div>
            </div>

            {/* Pay button */}
            <div className="px-6 pb-5">
              <button
                onClick={handleConfirmPrintPayment}
                disabled={!isCardValid || printPaymentLoading}
                className={`w-full py-[13px] rounded-xl border-none text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-150 ${
                  !isCardValid || printPaymentLoading
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-[var(--color-accent)] hover:brightness-110 cursor-pointer"
                }`}
              >
                {printPaymentLoading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>💳 Pagar $35.00 USD</>
                )}
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-3 flex items-center justify-center gap-1.5 m-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Pago seguro · Solo simulación
              </p>
            </div>

            {/* Cancel */}
            <button
              onClick={() => setShowPrintPaymentModal(false)}
              className="w-full py-3 border-none border-t border-slate-100 bg-transparent text-[13px] font-semibold text-slate-500 cursor-pointer font-sans hover:text-slate-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
