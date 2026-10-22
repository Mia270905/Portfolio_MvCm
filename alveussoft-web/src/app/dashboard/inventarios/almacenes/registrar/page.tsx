"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Warehouse } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createInventoryLocation } from "@/lib/actions/warehouse.actions";

export default function CreateInventoryLocationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    sucursal_id: "",
    is_write_protected: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Preparar datos para enviar
      const submitData = {
        ...formData,
        // Limpiar campos opcionales
        description: formData.description.trim() || undefined,
        sucursal_id: formData.sucursal_id.trim() || undefined,
      };

      const result = await createInventoryLocation(submitData);

      if (result.success) {
        toast.success("¡Almacén creado exitosamente!");
        router.push("/dashboard/inventarios/almacenes");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al crear el almacén");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/inventarios/almacenes"
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors mb-4 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="text-sm font-medium">Volver</span>
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-[#070B14] rounded-lg border border-gray-800">
            <Warehouse className="w-8 h-8 text-yellow-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Crear Nuevo Almacén
          </h1>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-[#0A0F17] rounded-xl border border-gray-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Código del Almacén <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              placeholder="Ej: ALM-001, BOD-01, SUC-01"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent placeholder-gray-500 transition-colors"
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Código único para identificar el almacén
            </p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre del Almacén <span className="text-amber-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Almacén Central, Bodega Principal, Sucursal Norte"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent placeholder-gray-500 transition-colors"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe el propósito o características del almacén..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent placeholder-gray-500 transition-colors"
            />
          </div>

          {/* Sucursal ID */}
          {/*
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID de Sucursal
            </label>
            <input
              type="text"
              name="sucursal_id"
              value={formData.sucursal_id}
              onChange={handleChange}
              placeholder="ID de la sucursal asociada (opcional)"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent placeholder-gray-500 transition-colors"
            />
            <p className="text-sm text-gray-500 mt-2">
              Si este almacén pertenece a una sucursal específica
            </p>
          </div>
          */}

          {/* Protección contra escritura
          <div className="flex items-start space-x-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <input
              type="checkbox"
              name="is_write_protected"
              id="is_write_protected"
              checked={formData.is_write_protected}
              onChange={handleChange}
              className="w-4 h-4 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400 focus:ring-offset-gray-900 mt-1"
            />
            <div>
              <label
                htmlFor="is_write_protected"
                className="block text-sm font-medium text-gray-300"
              >
                Protegido contra escritura
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Si está activado, este almacén no permitirá modificaciones en el
                inventario. Útil para ubicaciones de solo lectura o auditoría.
              </p>
            </div>
          </div>
          */}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-800">
            <Link
              href="/dashboard/inventarios/almacenes"
              className="inline-flex items-center px-6 py-2.5 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={submitting || !formData.code || !formData.name}
              className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-semibold rounded-lg hover:from-yellow-400 hover:to-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? "Creando..." : "Crear Almacén"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
