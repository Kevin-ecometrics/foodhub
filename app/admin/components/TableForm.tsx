// app/admin/components/TableForm.tsx
"use client";
import { FaPlus, FaEdit } from "react-icons/fa";
import { RestaurantTable, TableFormData, BRANCHES } from "../types";

interface TableFormProps {
  editingTable: RestaurantTable | null;
  tableForm: TableFormData;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onFormChange: (data: TableFormData) => void;
}

export default function TableForm({
  editingTable,
  tableForm,
  onSubmit,
  onCancel,
  onFormChange,
}: TableFormProps) {
  const handleChange = (field: keyof TableFormData, value: string) => {
    onFormChange({
      ...tableForm,
      [field]: value,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        {editingTable ? <FaEdit /> : <FaPlus />}
        {editingTable ? "Editar Mesa" : "Nueva Mesa"}
      </h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Mesa
            </label>
            <input
              type="number"
              value={tableForm.number}
              onChange={(e) => handleChange("number", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad
            </label>
            <input
              type="number"
              value={tableForm.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              value={tableForm.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: Terraza, Interior"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sucursal
            </label>
            <select
              value={tableForm.branch}
              onChange={(e) => handleChange("branch", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {BRANCHES.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {editingTable ? "Actualizar" : "Crear"} Mesa
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
