"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/app/context/ToastContext";
import { useConfirm } from "@/app/context/ConfirmContext";
import { usersService, AppUser } from "@/app/lib/supabase/users";
import { UserRole } from "@/app/lib/supabase/types";
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaKey } from "react-icons/fa";

interface UsersManagementProps {
  onError: (error: string) => void;
}

interface UserFormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  pin_code: string;
  is_active: boolean;
}

const emptyForm: UserFormState = {
  name: "",
  email: "",
  password: "",
  role: "waiter",
  pin_code: "",
  is_active: true,
};

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  waiter: "Mesero",
};

export default function UsersManagement({ onError }: UsersManagementProps) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await usersService.getAllUsers();
      setUsers(data.filter((u) => u.role !== "super_admin"));
    } catch {
      onError("Error cargando cuentas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("El nombre es obligatorio", "warning");
      return;
    }
    if (form.pin_code && !/^[0-9]{4}$/.test(form.pin_code)) {
      toast("El PIN debe tener 4 dígitos", "warning");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const res = await fetch(`/api/admin/users/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            role: form.role,
            pin_code: form.pin_code || null,
            is_active: form.is_active,
            ...(form.password ? { password: form.password } : {}),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Error actualizando la cuenta");
        toast("Cuenta actualizada", "success");
      } else {
        if (!form.email.trim() || !form.password) {
          toast("Correo y contraseña son obligatorios", "warning");
          setSaving(false);
          return;
        }
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
            pin_code: form.pin_code || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Error creando la cuenta");
        toast("Cuenta creada — ya puede iniciar sesión", "success");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await loadUsers();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error guardando la cuenta");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: AppUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      pin_code: user.pin_code || "",
      is_active: user.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (user: AppUser) => {
    const ok = await confirm({
      title: "Eliminar cuenta",
      message: `¿Eliminar la cuenta de "${user.name}"? Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, eliminar",
      type: "danger",
    });
    if (!ok) return;

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error eliminando la cuenta");
      toast("Cuenta eliminada", "success");
      await loadUsers();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error eliminando la cuenta");
    }
  };

  const inputBase = "w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-sm text-[oklch(20%_0.02_260)] outline-none transition-all duration-150 focus:border-[oklch(62%_0.18_32)] focus:shadow-[0_0_0_4px_oklch(96%_0.05_32)] focus:bg-white placeholder:text-[oklch(72%_0.01_260)]";
  const labelBase = "block text-[11px] font-bold text-[oklch(45%_0.02_260)] uppercase tracking-wider mb-2";

  return (
    <div className="space-y-5" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <div className="flex justify-between items-center">
        <h2 className="text-[18px] font-extrabold text-slate-900">Usuarios</h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-[var(--color-accent)] text-white text-xs font-bold hover:brightness-90 transition"
        >
          <FaPlus className="text-[11px]" />
          Nueva Cuenta
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-[oklch(92%_0.01_260)] shadow-[0_2px_16px_oklch(0%_0_0_/_0.06)] p-6 animate-fadeUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
              <FaKey className="text-[oklch(62%_0.18_32)] text-sm" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-[oklch(18%_0.02_260)] leading-tight">
                {editing ? "Editar Cuenta" : "Nueva Cuenta"}
              </p>
              <p className="text-[11px] text-[oklch(55%_0.02_260)]">
                {editing ? editing.email : "Se crea ya verificada, sin correo de confirmación"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className={inputBase}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div>
                <label className={labelBase}>Correo *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  disabled={!!editing}
                  className={`${inputBase} ${editing ? "opacity-60 cursor-not-allowed" : ""}`}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>
                  {editing ? "Nueva contraseña (opcional)" : "Contraseña *"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputBase}
                  placeholder={editing ? "Dejar en blanco para no cambiarla" : "Mínimo 6 caracteres"}
                />
              </div>
              <div>
                <label className={labelBase}>PIN (4 dígitos, opcional)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.pin_code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, pin_code: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                  }
                  className={inputBase}
                  placeholder="Ej: 1234"
                />
              </div>
            </div>

            <div>
              <label className={labelBase}>Rol</label>
              <div className="flex gap-2">
                {(["admin", "waiter"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role: r }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-[1.5px] transition-all ${
                      form.role === r
                        ? "bg-[oklch(62%_0.18_32)] border-[oklch(62%_0.18_32)] text-white"
                        : "border-[oklch(88%_0.01_260)] text-[oklch(45%_0.02_260)] hover:bg-[oklch(98%_0.005_80)]"
                    }`}
                  >
                    {roleLabels[r]}
                  </button>
                ))}
              </div>
            </div>

            {editing && (
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${form.is_active ? "bg-emerald-500" : "bg-[oklch(82%_0.01_260)]"}`}>
                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0"}`} />
                  </div>
                  <span className={`text-sm font-semibold ${form.is_active ? "text-emerald-700" : "text-[oklch(50%_0.02_260)]"}`}>
                    {form.is_active ? "Activa" : "Inactiva"}
                  </span>
                </label>
              </div>
            )}

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[oklch(62%_0.18_32)] text-white text-sm font-bold tracking-tight transition-all duration-150 hover:bg-[oklch(50%_0.18_32)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_oklch(55%_0.18_32_/_0.35)] active:translate-y-0 disabled:opacity-60"
              >
                {saving ? "Guardando…" : editing ? "Guardar Cambios" : "Crear Cuenta"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setForm(emptyForm);
                }}
                className="px-5 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-[oklch(45%_0.02_260)] text-sm font-semibold transition-all duration-150 hover:bg-[oklch(96%_0.005_260)] hover:border-[oklch(78%_0.01_260)]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <FaSpinner className="animate-spin text-2xl text-[var(--color-accent)] mx-auto" />
          <p className="text-slate-500 mt-4 text-sm font-medium">Cargando cuentas...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">NOMBRE</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">CORREO</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ROL</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">PIN</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ESTADO</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-900">{u.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-slate-500">{u.email}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-[6px] bg-slate-100 text-slate-700">
                      {roleLabels[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-slate-500 font-mono">{u.pin_code || "—"}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-[6px] ${
                      u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}>
                      {u.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(u)}
                        className="px-2.5 py-1.5 rounded-[7px] bg-amber-50 text-amber-600 text-[11px] font-bold hover:bg-amber-100 transition flex items-center gap-1"
                      >
                        <FaEdit className="text-[10px]" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-[7px] text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <FaTrash className="text-[11px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                    No hay cuentas creadas todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
