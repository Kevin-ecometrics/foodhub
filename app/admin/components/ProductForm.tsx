// app/admin/components/ProductForm.tsx
"use client";
import { FaPlus, FaEdit } from "react-icons/fa";
import { Product, ProductFormData } from "../types";

interface ProductFormProps {
  editingProduct: Product | null;
  productForm: ProductFormData;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onFormChange: (data: ProductFormData) => void;
}

export default function ProductForm({
  editingProduct,
  productForm,
  onSubmit,
  onCancel,
  onFormChange,
}: ProductFormProps) {
  const handleChange = (
    field: keyof ProductFormData,
    value: string | boolean
  ) => {
    onFormChange({
      ...productForm,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        {editingProduct ? <FaEdit /> : <FaPlus />}
        {editingProduct ? "Editar Producto" : "Nuevo Producto"}
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto
            </label>
            <input
              type="text"
              value={productForm.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <select
              value={productForm.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar categoría</option>
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Combos">Combos</option>
              <option value="Refill">Refill</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Postres">Postres</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio
            </label>
            <input
              type="number"
              step="0.01"
              value={productForm.price}
              onChange={(e) => handleChange("price", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiempo de Preparación (minutos)
            </label>
            <input
              type="number"
              value={productForm.preparation_time}
              onChange={(e) => handleChange("preparation_time", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={productForm.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL de Imagen
            </label>
            <input
              type="url"
              value={productForm.image_url}
              onChange={(e) => handleChange("image_url", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://ejemplo.com/imagen.jpg"
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={productForm.is_available}
                onChange={(e) => handleChange("is_available", e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Disponible
              </span>
            </label>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {editingProduct ? "Actualizar" : "Crear"} Producto
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
