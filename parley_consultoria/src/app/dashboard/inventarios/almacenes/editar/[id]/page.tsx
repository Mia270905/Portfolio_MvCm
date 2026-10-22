"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Warehouse } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  getOneInventoryLocation,
  updateInventoryLocation,
} from "@/lib/actions/warehouse.actions";

export default function EditInventoryLocationPage() {
  const router = useRouter();
  const params = useParams();
  const warehouseId = params.id as string;

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    sucursal_id: "",
    is_write_protected: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cargar datos del almacén
  useEffect(() => {
    const loadWarehouseData = async () => {
      try {
        setLoading(true);
        const warehouse = await getOneInventoryLocation(warehouseId);

        if (warehouse && warehouse.id) {
          setFormData({
            code: warehouse.code || "",
            name: warehouse.name || "",
            description: warehouse.description || "",
            sucursal_id: warehouse.sucursal_id || "",
            is_write_protected: warehouse.is_write_protected || false,
          });
        } else {
          toast.error("No se encontró el almacén");
          router.push("/dashboard/inventarios/almacenes");
        }
      } catch (error) {
        toast.error("Error al cargar los datos del almacén");
        console.error(error);
        router.push("/dashboard/inventarios/almacenes");
      } finally {
        setLoading(false);
      }
    };

    loadWarehouseData();
  }, [warehouseId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Preparar datos para enviar
      const submitData = {
        ...formData,
        description: formData.description.trim() || undefined,
        sucursal_id: formData.sucursal_id.trim() || undefined,
      };

      const result = await updateInventoryLocation(warehouseId, submitData);

      if (result.success) {
        toast.success("¡Almacén actualizado exitosamente!");
        router.push("/dashboard/inventarios/almacenes");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Error al actualizar el almacén");
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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-64 mb-6"></div>
          <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6 space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-800 rounded w-32 mb-2"></div>
                <div className="h-10 bg-gray-800 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            Editar Almacén
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
              {submitting ? "Actualizando..." : "Actualizar Almacén"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
