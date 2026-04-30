// app/admin/components/TableForm.tsx
"use client";
import { useState } from "react";
import { RestaurantTable } from "../types";

interface TableFormProps {
  editingTable: RestaurantTable | null;
  tableForm: { capacity: string; location: string };
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onFormChange: (form: { capacity: string; location: string }) => void;
}

const inputBase =
  "w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-sm text-[oklch(20%_0.02_260)] outline-none transition-all duration-150 focus:border-[oklch(62%_0.18_32)] focus:shadow-[0_0_0_4px_oklch(96%_0.05_32)] focus:bg-white placeholder:text-[oklch(72%_0.01_260)]";
const inputError =
  "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_4px_oklch(96%_0.08_20)]";
const labelBase = "block text-[11px] font-bold text-[oklch(45%_0.02_260)] uppercase tracking-wider mb-2";

export default function TableForm({
  editingTable,
  tableForm,
  onSubmit,
  onCancel,
  onFormChange,
}: TableFormProps) {
  const [errors, setErrors] = useState<{ capacity?: string; location?: string }>({});

  const handleChange = (field: "capacity" | "location", value: string) => {
    setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
    onFormChange({ ...tableForm, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!tableForm.capacity || Number(tableForm.capacity) < 1) errs.capacity = "Ingresa una capacidad válida (mín. 1)";
    if (!tableForm.location.trim()) errs.location = "La ubicación es obligatoria";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(e);
  };

  return (
    <div
      className="bg-white rounded-2xl border border-[oklch(92%_0.01_260)] shadow-[0_2px_16px_oklch(0%_0_0_/_0.06)] p-6 animate-fadeUp"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="oklch(62%_0.18_32)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-extrabold text-[oklch(18%_0.02_260)] leading-tight">
            {editingTable ? "Editar Mesa" : "Nueva Mesa"}
          </p>
          <p className="text-[11px] text-[oklch(55%_0.02_260)]">
            {editingTable ? `Mesa #${editingTable.number}` : "Completa los datos de la mesa"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Capacidad</label>
            <input
              type="number"
              min="1"
              max="20"
              value={tableForm.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              className={`${inputBase} ${errors.capacity ? inputError : ""}`}
              placeholder="Número de personas"
            />
            {errors.capacity && <p className="text-xs text-red-500 mt-1.5 ml-0.5">{errors.capacity}</p>}
          </div>
          <div>
            <label className={labelBase}>Ubicación</label>
            <input
              type="text"
              value={tableForm.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className={`${inputBase} ${errors.location ? inputError : ""}`}
              placeholder="Ej: Terraza, Interior, Bar"
            />
            {errors.location && <p className="text-xs text-red-500 mt-1.5 ml-0.5">{errors.location}</p>}
          </div>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl bg-[oklch(62%_0.18_32)] text-white text-sm font-bold tracking-tight transition-all duration-150 hover:bg-[oklch(50%_0.18_32)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_oklch(55%_0.18_32_/_0.35)] active:translate-y-0"
          >
            {editingTable ? "Guardar Cambios" : "Crear Mesa"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-[oklch(45%_0.02_260)] text-sm font-semibold transition-all duration-150 hover:bg-[oklch(96%_0.005_260)] hover:border-[oklch(78%_0.01_260)]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
