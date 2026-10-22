"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  createPriceList,
  updatePriceList,
} from "@/lib/actions/price_list.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface PriceListFormProps {
  initialData?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    active: boolean;
  };
  isEditing?: boolean;
  isDeleted?: boolean;
}

export default function PriceListForm({
  initialData,
  isEditing = false,
}: PriceListFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing && !initialData);
  const [formData, setFormData] = useState({
    code: initialData?.code || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    active: initialData?.active ?? true,
  });

  // Si estamos en modo edición y no tenemos datos iniciales, cargarlos
  useEffect(() => {
    if (isEditing && !initialData) {
      setLoading(false);
    }
  }, [isEditing, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validaciones
    if (!formData.code.trim()) {
      toast.error("El código de la lista es requerido");
      setSubmitting(false);
      return;
    }

    if (!formData.name.trim()) {
      toast.error("El nombre de la lista es requerido");
      setSubmitting(false);
      return;
    }

    // Validar formato del código
    const codeRegex = /^[A-Z0-9]+$/;
    const normalizedCode = formData.code.toUpperCase().replace(/\s/g, "");

    if (!codeRegex.test(normalizedCode)) {
      toast.error(
        "El código solo puede contener letras mayúsculas y números, sin espacios",
      );
      setSubmitting(false);
      return;
    }

    try {
      let result;

      if (isEditing && initialData) {
        const codeChanged = normalizedCode !== initialData.code;

        if (codeChanged) {
          result = await updatePriceList(initialData.id, {
            code: normalizedCode,
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            active: formData.active,
          });
        } else {
          result = await updatePriceList(initialData.id, {
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            active: formData.active,
          });
        }
      } else {
        result = await createPriceList({
          code: normalizedCode,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          active: formData.active,
        });
      }

      if (!result.success) {
        toast.error(result.error || "Error al guardar la lista de precios");
        setSubmitting(false);
        return;
      }

      toast.success(
        result.message ||
          (isEditing
            ? "✅ Lista de precios actualizada exitosamente"
            : "✅ Lista de precios creada exitosamente"),
      );

      setTimeout(() => {
        router.push("/dashboard/lista_de_precios/gestion");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        isEditing
          ? "❌ Error al actualizar la lista de precios"
          : "❌ Error al crear la lista de precios",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "code") {
      setFormData((prev) => ({
        ...prev,
        [name]: value.toUpperCase().replace(/\s/g, ""),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({
      ...prev,
      active: !prev.active,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          <span className="ml-3 text-gray-400">Cargando datos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard/lista_de_precios/gestion"
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 mb-4 p-2 hover:bg-[#070B14] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>

        <h1 className="text-3xl font-bold text-white">
          {isEditing ? "Editar lista de precios" : "Crear lista de precios"}
        </h1>
      </div>

      <div className="bg-[#070B14] rounded-lg border border-gray-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código */}
          <div>
            <Label className="block text-sm font-medium text-gray-300 mb-2">
              Código *
            </Label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-400"
              placeholder="EJ: LISTA001"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Solo letras mayúsculas y números, sin espacios
            </p>
          </div>

          {/* Nombre */}
          <div>
            <Label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre *
            </Label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-400"
              placeholder="EJ: Lista de Precios Mayorista"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <Label className="block text-sm font-medium text-gray-300 mb-2">
              Descripción
            </Label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-400"
              placeholder="Descripción detallada de la lista de precios..."
              rows={4}
            />
          </div>

          {/* Estado con Toggle - Igual que productos */}
          <div className="space-y-2">
            <Label className="block font-medium text-gray-300 mb-3">
              Estado de la lista
            </Label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={submitting}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full
                  transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600
                  ${formData.active ? "bg-green-600" : "bg-gray-700"}
                  ${submitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white
                    transition-transform duration-200 ease-in-out
                    ${formData.active ? "translate-x-6" : "translate-x-1"}
                  `}
                />
              </button>
              <span
                className={`
                  px-2.5 py-1 text-xs font-semibold rounded-full border
                  ${
                    formData.active
                      ? "bg-green-900/40 text-green-300 border-green-800"
                      : "bg-red-900/40 text-red-300 border-red-800"
                  }
                `}
              >
                {formData.active ? "Activa" : "Inactiva"}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formData.active
                ? "La lista está activa y disponible para su uso"
                : "La lista está inactiva y no estará disponible"}
            </p>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-6 border-t border-gray-800">
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-yellow-500 text-[#04060B] hover:bg-yellow-400"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditing ? "Guardando cambios..." : "Creando lista..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditing ? "Guardar cambios" : "Crear lista"}
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/lista_de_precios/gestion")}
              disabled={submitting}
              className="flex-1 sm:flex-none bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}