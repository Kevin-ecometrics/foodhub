/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { FaPlus, FaStar, FaRegStar, FaTrash } from "react-icons/fa";
import { Product, ProductFormData, ProductExtra } from "../types";
import StarRating from "./StarRating";
import { useState } from "react";

interface ProductFormProps {
  editingProduct: Product | null;
  productForm: ProductFormData;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onFormChange: (data: ProductFormData) => void;
  onDelete?: (productId: string) => void;
}

const inputBase =
  "w-full px-4 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-sm text-[oklch(20%_0.02_260)] outline-none transition-all duration-150 focus:border-[oklch(62%_0.18_32)] focus:shadow-[0_0_0_4px_oklch(96%_0.05_32)] focus:bg-white placeholder:text-[oklch(72%_0.01_260)]";
const inputErr =
  "border-red-400 focus:border-red-400 focus:shadow-[0_0_0_4px_oklch(96%_0.08_20)]";
const labelBase =
  "block text-[11px] font-bold text-[oklch(45%_0.02_260)] uppercase tracking-wider mb-2";

export default function ProductForm({
  editingProduct,
  productForm,
  onSubmit,
  onCancel,
  onFormChange,
  onDelete,
}: ProductFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: any): string => {
    switch (field) {
      case "name":
        if (!value || value.trim() === "") return "El nombre es obligatorio";
        if (value.length > 100) return "Máximo 100 caracteres";
        return "";
      case "price":
        if (value === "" || value === null || value === undefined) return "El precio es obligatorio";
        const price = parseFloat(value);
        if (isNaN(price)) return "Debe ser un número válido";
        if (price < 0) return "No puede ser negativo";
        if (price > 10000) return "Máximo $10,000";
        return "";
      case "preparation_time":
        if (value === "" || value === null || value === undefined) return "El tiempo es obligatorio";
        const time = parseInt(value);
        if (isNaN(time)) return "Debe ser un número válido";
        if (time < 1) return "Mínimo 1 minuto";
        if (time > 480) return "Máximo 480 minutos";
        return "";
      case "category":
        if (!value || value.trim() === "") return "La categoría es obligatoria";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (
    field: keyof ProductFormData,
    value: string | boolean | File | number | ProductExtra[]
  ) => {
    const error = validateField(field, value);
    setErrors((prev) => {
      const n = { ...prev };
      if (error) n[field] = error;
      else delete n[field];
      return n;
    });
    onFormChange({ ...productForm, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    (["name", "price", "preparation_time", "category"] as (keyof ProductFormData)[]).forEach((f) => {
      const err = validateField(f, productForm[f]);
      if (err) newErrors[f] = err;
    });
    (productForm.extras || []).forEach((extra, i) => {
      if (!extra.name || extra.name.trim() === "") newErrors[`extra_name_${i}`] = "Nombre obligatorio";
      else if (extra.name.length > 50) newErrors[`extra_name_${i}`] = "Máximo 50 caracteres";
      if (extra.price < 0) newErrors[`extra_price_${i}`] = "No puede ser negativo";
      else if (extra.price > 1000) newErrors[`extra_price_${i}`] = "Máximo $1,000";
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) onSubmit(e);
  };

  const addExtra = () => {
    handleChange("extras", [...(productForm.extras || []), { name: "", price: 0, is_available: true }]);
  };

  const removeExtra = (index: number) => {
    setErrors((prev) => {
      const n = { ...prev };
      delete n[`extra_name_${index}`];
      delete n[`extra_price_${index}`];
      return n;
    });
    handleChange("extras", (productForm.extras || []).filter((_, i) => i !== index));
  };

  const updateExtra = (index: number, field: keyof ProductExtra, value: string | number | boolean) => {
    const newExtras = [...(productForm.extras || [])];
    newExtras[index] = { ...newExtras[index], [field]: value };
    const errKey = field === "name" ? `extra_name_${index}` : `extra_price_${index}`;
    let error = "";
    if (field === "name") {
      if (!value || (value as string).trim() === "") error = "Nombre obligatorio";
      else if ((value as string).length > 50) error = "Máximo 50 caracteres";
    } else if (field === "price") {
      const v = typeof value === "string" ? parseFloat(value) : (value as number);
      if (v < 0) error = "No puede ser negativo";
      else if (v > 1000) error = "Máximo $1,000";
    }
    setErrors((prev) => { const n = { ...prev }; if (error) n[errKey] = error; else delete n[errKey]; return n; });
    handleChange("extras", newExtras);
  };

  const toggleExtraAvailability = (index: number) => {
    const newExtras = [...(productForm.extras || [])];
    newExtras[index] = { ...newExtras[index], is_available: !newExtras[index].is_available };
    handleChange("extras", newExtras);
  };

  const renderPreview = () => {
    if (!productForm.image_url) return null;
    const src =
      typeof productForm.image_url === "string"
        ? productForm.image_url
        : URL.createObjectURL(productForm.image_url as File);
    return <img src={src} alt="Vista previa" className="mt-3 h-24 w-24 rounded-xl object-cover border border-[oklch(90%_0.01_260)]" />;
  };

  return (
    <div
      className="bg-white rounded-2xl border border-[oklch(92%_0.01_260)] shadow-[0_2px_16px_oklch(0%_0_0_/_0.06)] p-6 animate-fadeUp"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[oklch(96%_0.05_32)] flex items-center justify-center">
            {editingProduct ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="oklch(62%_0.18_32)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            ) : (
              <FaPlus className="text-[oklch(62%_0.18_32)] text-sm" />
            )}
          </div>
          <div>
            <p className="text-[15px] font-extrabold text-[oklch(18%_0.02_260)] leading-tight">
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </p>
            <p className="text-[11px] text-[oklch(55%_0.02_260)]">
              {editingProduct ? editingProduct.name : "Completa los datos del producto"}
            </p>
          </div>
        </div>
        {editingProduct && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(editingProduct.id.toString())}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] text-[11px] font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition"
          >
            <FaTrash className="text-[10px]" /> Eliminar
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Row 1: Nombre + Categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Nombre del Producto *</label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`${inputBase} ${errors.name ? inputErr : ""}`}
              maxLength={100}
              placeholder="Máximo 100 caracteres"
            />
            <div className="flex justify-between mt-1.5">
              {errors.name ? <p className="text-[11px] text-red-500">{errors.name}</p> : <span />}
              <span className="text-[10px] text-[oklch(65%_0.01_260)]">{productForm.name.length}/100</span>
            </div>
          </div>
          <div>
            <label className={labelBase}>Categoría *</label>
            <select
              value={productForm.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className={`${inputBase} ${errors.category ? inputErr : ""}`}
            >
              <option value="">Seleccionar categoría</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Combos">Combos</option>
              <option value="Drinks">Drinks</option>
            </select>
            {errors.category && <p className="text-[11px] text-red-500 mt-1.5">{errors.category}</p>}
          </div>
        </div>

        {/* Row 2: Precio + Tiempo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelBase}>Precio ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10000"
              value={productForm.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className={`${inputBase} ${errors.price ? inputErr : ""}`}
              placeholder="0.00 — 10,000"
            />
            {errors.price && <p className="text-[11px] text-red-500 mt-1.5">{errors.price}</p>}
          </div>
          <div>
            <label className={labelBase}>Tiempo de Preparación (min) *</label>
            <input
              type="number"
              min="1"
              max="480"
              value={productForm.preparation_time}
              onChange={(e) => handleChange("preparation_time", e.target.value)}
              className={`${inputBase} ${errors.preparation_time ? inputErr : ""}`}
              placeholder="1 — 480 minutos"
            />
            {errors.preparation_time && <p className="text-[11px] text-red-500 mt-1.5">{errors.preparation_time}</p>}
          </div>
        </div>

        {/* Row 3: Calificación + Estado + Favorito */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Calificación */}
          <div>
            <label className={labelBase}>Calificación Inicial</label>
            <div className="rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] px-4 py-3">
              <StarRating
                rating={parseFloat(productForm.rating || "0")}
                onRatingChange={(r) => handleChange("rating", r.toString())}
                readonly={false}
              />
              <p className="text-[10px] text-[oklch(65%_0.01_260)] mt-2">1 – 5 estrellas</p>
            </div>
          </div>

          {/* Estado */}
          <div>
            <label className={labelBase}>Estado</label>
            <label className="flex items-center gap-3 cursor-pointer rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] px-4 py-3 hover:bg-white transition">
              <input
                type="checkbox"
                checked={productForm.is_available}
                onChange={(e) => handleChange("is_available", e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${productForm.is_available ? "bg-emerald-500" : "bg-[oklch(82%_0.01_260)]"}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${productForm.is_available ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <span className={`text-sm font-semibold ${productForm.is_available ? "text-emerald-700" : "text-[oklch(50%_0.02_260)]"}`}>
                {productForm.is_available ? "Disponible" : "No Disponible"}
              </span>
            </label>
          </div>

          {/* Favorito */}
          <div>
            <label className={labelBase}>Favorito</label>
            <label className="flex items-center gap-3 cursor-pointer rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] px-4 py-3 hover:bg-white transition">
              <input
                type="checkbox"
                checked={productForm.is_favorite}
                onChange={(e) => handleChange("is_favorite", e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${productForm.is_favorite ? "bg-amber-400" : "bg-[oklch(82%_0.01_260)]"}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${productForm.is_favorite ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <span className={`text-sm font-semibold flex items-center gap-1.5 ${productForm.is_favorite ? "text-amber-600" : "text-[oklch(50%_0.02_260)]"}`}>
                {productForm.is_favorite ? <FaStar className="text-amber-500 text-xs" /> : <FaRegStar className="text-[oklch(65%_0.01_260)] text-xs" />}
                {productForm.is_favorite ? "Favorito" : "Sin destacar"}
              </span>
            </label>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className={labelBase}>Descripción</label>
          <textarea
            value={productForm.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            className={`${inputBase} resize-none`}
            maxLength={500}
            placeholder="Describe el producto... (máximo 500 caracteres)"
          />
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-[oklch(65%_0.01_260)]">{productForm.description.length}/500</span>
          </div>
        </div>

        {/* Imagen */}
        <div>
          <label className={labelBase}>Imagen del Producto</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleChange("image_url", e.target.files?.[0] || "")}
            className={`${inputBase} file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[oklch(96%_0.05_32)] file:text-[oklch(50%_0.18_32)] hover:file:bg-[oklch(93%_0.06_32)]`}
          />
          {renderPreview()}
        </div>

        {/* Extras */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={labelBase + " mb-0"}>Extras del Producto</p>
              <p className="text-[11px] text-[oklch(60%_0.01_260)] mt-0.5">Opciones adicionales que puede seleccionar el cliente</p>
            </div>
            <button
              type="button"
              onClick={addExtra}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[oklch(96%_0.05_32)] text-[oklch(50%_0.18_32)] text-xs font-bold border border-[oklch(90%_0.05_32)] hover:bg-[oklch(93%_0.06_32)] transition"
            >
              <FaPlus className="text-[9px]" /> Agregar Extra
            </button>
          </div>

          <div className="space-y-3">
            {(productForm.extras || []).map((extra, index) => (
              <div key={index} className="rounded-xl border-[1.5px] border-[oklch(90%_0.01_260)] bg-[oklch(98.5%_0.005_80)] p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className={labelBase}>Nombre *</label>
                    <input
                      type="text"
                      value={extra.name}
                      onChange={(e) => updateExtra(index, "name", e.target.value)}
                      placeholder="Ej: Queso extra, Tocino…"
                      className={`${inputBase} ${errors[`extra_name_${index}`] ? inputErr : ""}`}
                      maxLength={50}
                    />
                    <div className="flex justify-between mt-1">
                      {errors[`extra_name_${index}`] ? <p className="text-[11px] text-red-500">{errors[`extra_name_${index}`]}</p> : <span />}
                      <span className="text-[10px] text-[oklch(65%_0.01_260)]">{extra.name.length}/50</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelBase}>Precio Extra ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1000"
                      value={extra.price}
                      onChange={(e) => updateExtra(index, "price", e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                      placeholder="0.00 — 1,000"
                      className={`${inputBase} ${errors[`extra_price_${index}`] ? inputErr : ""}`}
                    />
                    {errors[`extra_price_${index}`] && <p className="text-[11px] text-red-500 mt-1">{errors[`extra_price_${index}`]}</p>}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className={labelBase}>Disponible</label>
                      <label className="flex items-center gap-2.5 cursor-pointer rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-white px-3 py-[11px] hover:bg-[oklch(98.5%_0.005_80)] transition">
                        <input type="checkbox" checked={extra.is_available} onChange={() => toggleExtraAvailability(index)} className="sr-only" />
                        <div className={`w-8 h-4 flex items-center rounded-full p-0.5 transition-colors ${extra.is_available ? "bg-emerald-500" : "bg-[oklch(82%_0.01_260)]"}`}>
                          <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform ${extra.is_available ? "translate-x-4" : "translate-x-0"}`} />
                        </div>
                        <span className="text-xs font-semibold text-[oklch(40%_0.02_260)]">{extra.is_available ? "Sí" : "No"}</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExtra(index)}
                      className="p-[11px] rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition"
                    >
                      <FaTrash className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(productForm.extras || []).length === 0 && (
              <div className="text-center py-6 rounded-xl border-[1.5px] border-dashed border-[oklch(88%_0.01_260)]">
                <p className="text-[12px] text-[oklch(60%_0.01_260)]">Sin extras. Haz clic en <span className="font-semibold text-[oklch(50%_0.18_32)]">Agregar Extra</span> para añadir opciones.</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="submit"
            className="flex-1 py-3 rounded-xl bg-[oklch(62%_0.18_32)] text-white text-sm font-bold tracking-tight transition-all duration-150 hover:bg-[oklch(50%_0.18_32)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_oklch(55%_0.18_32_/_0.35)] active:translate-y-0"
          >
            {editingProduct ? "Guardar Cambios" : "Crear Producto"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-3 rounded-xl border-[1.5px] border-[oklch(88%_0.01_260)] bg-[oklch(98.5%_0.005_80)] text-[oklch(45%_0.02_260)] text-sm font-semibold transition-all duration-150 hover:bg-[oklch(96%_0.005_260)] hover:border-[oklch(78%_0.01_260)]"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
