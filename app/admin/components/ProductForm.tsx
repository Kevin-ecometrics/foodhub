"use client";
import { FaPlus, FaEdit, FaStar, FaRegStar, FaTrash } from "react-icons/fa";
import { Product, ProductFormData, ProductExtra } from "../types";
import StarRating from "./StarRating";

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
    value: string | boolean | File | number | ProductExtra[]
  ) => {
    onFormChange({
      ...productForm,
      [field]: value,
    });
  };

  const handleRatingChange = (rating: number) => {
    handleChange("rating", rating.toString());
  };

  // Funciones para manejar extras
  const addExtra = () => {
    const newExtra: ProductExtra = {
      name: "",
      price: 0,
      is_available: true,
    };

    const currentExtras = productForm.extras || [];
    handleChange("extras", [...currentExtras, newExtra]);
  };

  const removeExtra = (index: number) => {
    const currentExtras = productForm.extras || [];
    const newExtras = currentExtras.filter((_, i) => i !== index);
    handleChange("extras", newExtras);
  };

  const updateExtra = (
    index: number,
    field: keyof ProductExtra,
    value: string | number | boolean
  ) => {
    const currentExtras = productForm.extras || [];
    const newExtras = [...currentExtras];
    newExtras[index] = {
      ...newExtras[index],
      [field]: value,
    };
    handleChange("extras", newExtras);
  };

  const toggleExtraAvailability = (index: number) => {
    const currentExtras = productForm.extras || [];
    const newExtras = [...currentExtras];
    newExtras[index] = {
      ...newExtras[index],
      is_available: !newExtras[index].is_available,
    };
    handleChange("extras", newExtras);
  };

  const renderPreview = () => {
    if (!productForm.image_url) return null;
    if (typeof productForm.image_url === "string") {
      return (
        <img
          src={productForm.image_url}
          alt="Vista previa"
          className="mt-3 h-24 rounded-lg object-cover"
        />
      );
    } else {
      const file = productForm.image_url as File;
      return (
        <img
          src={URL.createObjectURL(file)}
          alt="Vista previa"
          className="mt-3 h-24 rounded-lg object-cover"
        />
      );
    }
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
              <option value="Drinks">Drinks</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio ($)
            </label>
            <input
              type="number"
              step="1"
              min="0"
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

          {/* Línea con Calificación, Estado y Favorito */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Calificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calificación Inicial
                </label>
                <div className="border border-gray-300 rounded-lg p-3 h-full">
                  <StarRating
                    rating={parseFloat(productForm.rating || "0")}
                    onRatingChange={handleRatingChange}
                    readonly={false}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Calificación inicial (1-5 estrellas)
                  </p>
                </div>
              </div>

              {/* Estado del Producto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <div className="flex items-center h-full px-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer w-full py-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={productForm.is_available}
                        onChange={(e) =>
                          handleChange("is_available", e.target.checked)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                          productForm.is_available
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            productForm.is_available
                              ? "translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        productForm.is_available
                          ? "text-green-700"
                          : "text-gray-700"
                      }`}
                    >
                      {productForm.is_available
                        ? "Disponible"
                        : "No Disponible"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Producto Favorito */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Favorito
                </label>
                <div className="flex items-center h-full px-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                  <label className="flex items-center gap-3 cursor-pointer w-full py-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={productForm.is_favorite}
                        onChange={(e) =>
                          handleChange("is_favorite", e.target.checked)
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                          productForm.is_favorite
                            ? "bg-yellow-500"
                            : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            productForm.is_favorite
                              ? "translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-sm font-medium flex items-center gap-2 ${
                        productForm.is_favorite
                          ? "text-yellow-700"
                          : "text-gray-700"
                      }`}
                    >
                      {productForm.is_favorite ? (
                        <FaStar className="text-yellow-500" />
                      ) : (
                        <FaRegStar className="text-gray-400" />
                      )}
                      {productForm.is_favorite ? "Favorito" : "Marcar"}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Se muestra destacado
                </p>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 mt-4">
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

          {/* SECCIÓN DE EXTRAS */}
          <div className="md:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Extras del Producto
              </label>
              <button
                type="button"
                onClick={addExtra}
                className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-sm"
              >
                <FaPlus className="text-xs" />
                Agregar Extra
              </button>
            </div>

            <div className="space-y-3">
              {(productForm.extras || []).map((extra, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Nombre del Extra
                      </label>
                      <input
                        type="text"
                        value={extra.name}
                        onChange={(e) =>
                          updateExtra(index, "name", e.target.value)
                        }
                        placeholder="Ej: Queso extra, Tocino, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Precio Extra ($)
                      </label>
                      <input
                        type="text"
                        value={extra.price}
                        onChange={(e) => {
                          // Permitir solo números y punto decimal
                          const value = e.target.value.replace(/[^0-9.]/g, "");
                          // Evitar múltiples puntos decimales
                          const parts = value.split(".");
                          const formattedValue =
                            parts.length > 2
                              ? parts[0] + "." + parts.slice(1).join("")
                              : value;

                          updateExtra(
                            index,
                            "price",
                            formattedValue === ""
                              ? 0
                              : parseFloat(formattedValue) || 0
                          );
                        }}
                        onBlur={(e) => {
                          // Formatear al salir del input
                          const value = parseFloat(e.target.value) || 0;
                          updateExtra(index, "price", value);
                        }}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Disponible
                        </label>
                        <div className="flex items-center h-full px-3 border border-gray-300 rounded-lg bg-white">
                          <label className="flex items-center gap-2 cursor-pointer w-full py-2">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={extra.is_available}
                                onChange={() => toggleExtraAvailability(index)}
                                className="sr-only"
                              />
                              <div
                                className={`w-8 h-4 flex items-center rounded-full p-1 transition-colors ${
                                  extra.is_available
                                    ? "bg-green-500"
                                    : "bg-gray-300"
                                }`}
                              >
                                <div
                                  className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${
                                    extra.is_available
                                      ? "translate-x-4"
                                      : "translate-x-0"
                                  }`}
                                />
                              </div>
                            </div>
                            <span className="text-xs text-gray-700">
                              {extra.is_available ? "Sí" : "No"}
                            </span>
                          </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeExtra(index)}
                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {(productForm.extras || []).length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 text-sm">
                    No hay extras agregados. Haz clic en Agregar Extra para
                    añadir opciones adicionales.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Imagen del Producto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleChange("image_url", e.target.files?.[0] || "")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {renderPreview()}
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
