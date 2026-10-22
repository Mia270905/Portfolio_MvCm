"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { createMeasurement } from "@/lib/actions/measurement.actions";
import MeasurementForm from "@/components/dashboard/unidades-medida/measurement-form";
import { createClient } from "@/lib/supabase/client";
import type { NewMeasurementPayload } from "@/lib/definitions";

const supabase = createClient();

type MeasurementFormData = {
  unit: string;
  quantity: string;
  reference?: string | null;
  unspsc?: string | null;
};

export default function CreateMeasurementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<MeasurementFormData>({
    unit: "",
    quantity: "",
    reference: null,
    unspsc: null,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones (solo los campos requeridos)
    const newErrors: { [key: string]: string } = {};
    if (!formData.unit?.trim()) newErrors.unit = "La unidad es requerida.";
    if (!formData.quantity?.trim()) newErrors.quantity = "La cantidad es requerida.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Usuario no autenticado");
      }

      // Preparar payload según la nueva estructura
      const payload: NewMeasurementPayload = {
        unit: formData.unit.trim(),
        quantity: formData.quantity.trim(),
      };

      // Agregar campos opcionales solo si tienen valor
      if (formData.reference && formData.reference !== "") {
        payload.reference = formData.reference;
      }

      if (formData.unspsc && formData.unspsc !== "") {
        payload.unspsc = formData.unspsc;
      }

      const result = await createMeasurement(payload);

      if (!result.success) {
        toast.error("Error al crear la unidad de medida: " + result.message);
        setLoading(false);
        return;
      }

      toast.success("¡Unidad de medida creada con éxito!");
      router.push("/dashboard/productos/unidades-medida");
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al crear la unidad de medida.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Manejar selects - convertir string vacío a null
    const finalValue = value === "" ? null : value;
    
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    
    // Limpiar error si el campo se completa
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div>
      <div className="mb-6">
        <a
          href="/dashboard/productos/unidades-medida"
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Crear Nueva Unidad de Medida</h1>
          <p className="text-gray-500 mt-1">
            Completa los datos para registrar una nueva unidad de medida
          </p>
        </div>

        <MeasurementForm
          handleSubmit={handleSubmit}
          formData={formData}
          handleChange={handleChange}
          errors={errors}
          buttonText="Crear Unidad"
          buttonLoadingText="Creando..."
          loading={loading}
        />
      </div>
    </div>
  );
}