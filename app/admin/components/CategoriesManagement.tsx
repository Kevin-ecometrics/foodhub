"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/app/context/ToastContext";
import { useConfirm } from "@/app/context/ConfirmContext";
import { categoriesService, Category } from "@/app/lib/supabase/categories";
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaChevronUp, FaChevronDown } from "react-icons/fa";

interface CategoriesManagementProps {
  onError: (error: string) => void;
}

interface CategoryFormState {
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  display_order: 0,
  is_active: true,
};

export default function CategoriesManagement({ onError }: CategoriesManagementProps) {
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoriesService.getAllCategories();
      setCategories(data);
    } catch {
      onError("Error cargando categorías");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúüñ]+/g, "-")
      .replace(/^-|-$/g, "")
      .replace(/á/g, "a")
      .replace(/é/g, "e")
      .replace(/í/g, "i")
      .replace(/ó/g, "o")
      .replace(/ú/g, "u")
      .replace(/ü/g, "u")
      .replace(/ñ/g, "n");
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editing ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("El nombre es obligatorio", "warning");
      return;
    }

    const slug = editing ? form.slug : generateSlug(form.name);
    if (!slug) {
      toast("No se pudo generar un slug válido", "warning");
      return;
    }

    try {
      if (editing) {
        await categoriesService.updateCategory(editing.id, { ...form, slug });
        toast("Categoría actualizada", "success");
      } else {
        await categoriesService.createCategory({ ...form, slug });
        toast("Categoría creada", "success");
      }
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      await loadCategories();
    } catch (err) {
      console.error(err);
      onError("Error guardando la categoría");
    }
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (cat: Category) => {
    const ok = await confirm({
      title: "Eliminar categoría",
      message: `¿Eliminar "${cat.name}"? Los productos con esta categoría no se verán afectados.`,
      confirmLabel: "Sí, eliminar",
      type: "danger",
    });
    if (!ok) return;

    try {
      await categoriesService.deleteCategory(cat.id);
      toast("Categoría eliminada", "success");
      await loadCategories();
    } catch {
      onError("Error eliminando la categoría");
    }
  };

  const moveOrder = async (cat: Category, direction: -1 | 1) => {
    const sorted = [...categories].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((c) => c.id === cat.id);
    const target = sorted[idx + direction];
    if (!target) return;

    try {
      const temp = cat.display_order;
      await categoriesService.updateCategory(cat.id, { display_order: target.display_order });
      await categoriesService.updateCategory(target.id, { display_order: temp });
      await loadCategories();
    } catch {
      onError("Error reordenando");
    }
  };

  const inputBase = "w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-sm text-[oklch(20%_0.02_260)] outline-none transition-all duration-150 focus:border-[oklch(62%_0.18_32)] focus:shadow-[0_0_0_4px_oklch(96%_0.05_32)] focus:bg-white placeholder:text-[oklch(72%_0.01_260)]";
  const labelBase = "block text-[11px] font-bold text-[oklch(45%_0.02_260)] uppercase tracking-wider mb-2";

  return (
    <div className="space-y-5" style={{ fontFamily: "var(--font-geist-sans)" }}>
      <div className="flex justify-between items-center">
        <h2 className="text-[18px] font-extrabold text-slate-900">Gestión de Categorías</h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[9px] bg-[var(--color-accent)] text-white text-xs font-bold hover:brightness-90 transition"
        >
          <FaPlus className="text-[11px]" />
          Nueva Categoría
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-[oklch(92%_0.01_260)] shadow-[0_2px_16px_oklch(0%_0_0_/_0.06)] p-6 animate-fadeUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
              <FaPlus className="text-[oklch(62%_0.18_32)] text-sm" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold text-[oklch(18%_0.02_260)] leading-tight">
                {editing ? "Editar Categoría" : "Nueva Categoría"}
              </p>
              <p className="text-[11px] text-[oklch(55%_0.02_260)]">
                {editing ? editing.name : "Completa los datos de la categoría"}
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
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={inputBase}
                  placeholder="Ej: Desayunos"
                />
              </div>
              <div>
                <label className={labelBase}>Slug</label>
                <input
                  type="text"
                  value={form.slug || generateSlug(form.name)}
                  readOnly
                  className={`${inputBase} opacity-60 cursor-not-allowed`}
                  placeholder="Se genera automáticamente"
                  tabIndex={-1}
                />
              </div>
            </div>

            <div>
              <label className={labelBase}>Orden</label>
              <input
                type="number"
                min={0}
                value={form.display_order}
                onChange={(e) => setForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                className={inputBase}
              />
            </div>

            <div>
              <label className={labelBase}>Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className={`${inputBase} resize-none`}
                placeholder="Descripción opcional de la categoría"
              />
            </div>

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

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[oklch(62%_0.18_32)] text-white text-sm font-bold tracking-tight transition-all duration-150 hover:bg-[oklch(50%_0.18_32)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_oklch(55%_0.18_32_/_0.35)] active:translate-y-0"
              >
                {editing ? "Guardar Cambios" : "Crear Categoría"}
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
          <p className="text-slate-500 mt-4 text-sm font-medium">Cargando categorías...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ORDEN</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">NOMBRE</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">SLUG</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">DESCRIPCIÓN</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ESTADO</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-slate-700 w-4 text-center">{cat.display_order}</span>
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveOrder(cat, -1)} className="text-[9px] text-slate-400 hover:text-slate-600"><FaChevronUp /></button>
                        <button onClick={() => moveOrder(cat, 1)} className="text-[9px] text-slate-400 hover:text-slate-600"><FaChevronDown /></button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-xs text-slate-500">{cat.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500 line-clamp-1">{cat.description || "—"}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-[6px] ${
                      cat.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                    }`}>
                      {cat.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="px-2.5 py-1.5 rounded-[7px] bg-amber-50 text-amber-600 text-[11px] font-bold hover:bg-amber-100 transition flex items-center gap-1"
                      >
                        <FaEdit className="text-[10px]" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-1.5 rounded-[7px] text-red-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <FaTrash className="text-[11px]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
