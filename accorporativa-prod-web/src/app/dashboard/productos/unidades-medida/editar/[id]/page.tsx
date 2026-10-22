"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Measurement, Unspsc } from "@/lib/definitions";
import {
  getMeasurementById,
  updateMeasurement,
  getMeasurementOptions,
} from "@/lib/actions/measurement.actions";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function EditMeasurementPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [measurementOptions, setMeasurementOptions] = useState<
    Array<{ id: string; unit: string; quantity: string }>
  >([]);
  const [unspscOptions, setUnspscOptions] = useState<Unspsc[]>([]);
  const [formData, setFormData] = useState({
    unit: "",
    quantity: "",
    reference: "",
    unspsc: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const measurementId = params.id as string;

  // Cargar opciones para los select
  useEffect(() => {
    const loadOptions = async () => {
      try {
        // Cargar opciones de unidades de medida (excluyendo la actual)
        const measurementOpts = await getMeasurementOptions();
        const filteredOptions = measurementOpts.filter(
          (option) => option.id !== measurementId
        );
        setMeasurementOptions(filteredOptions);

        // Cargar opciones de UNSPSC
        const { data: unspscData, error } = await supabase
          .from("unspsc")
          .select("*") // Cambiar a * para todos los campos
          .order("code", { ascending: true });

        if (error) throw error;
        setUnspscOptions(unspscData || []);
      } catch (error) {
        console.error("Error al cargar opciones:", error);
        toast.error("Error al cargar opciones");
      }
    };

    loadOptions();
  }, [measurementId]);

  // Obtener la unidad de medida al cargar la página
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsFetching(true);

        // Obtener la unidad de medida
        const measurementData = await getMeasurementById(measurementId);

        if (!measurementData) {
          toast.error("Unidad de medida no encontrada");
          return;
        }

        setMeasurement(measurementData);
        setFormData({
          unit: measurementData.unit || "",
          quantity: measurementData.quantity || "",
          reference: measurementData.reference || "",
          unspsc: measurementData.unspsc || "",
        });
      } catch (error) {
        console.error("Error al obtener unidad de medida:", error);
        toast.error("Error al cargar la unidad de medida");
      } finally {
        setIsFetching(false);
      }
    };

    if (measurementId) {
      fetchData();
    }
  }, [measurementId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validaciones básicas
      const newErrors: { [key: string]: string } = {};

      if (!formData.unit.trim()) {
        newErrors.unit = "La unidad es obligatoria";
      }

      if (!formData.quantity.trim()) {
        newErrors.quantity = "La cantidad es obligatoria";
      }

      // Validar que no sea referencia circular (si se está estableciendo referencia)
      if (formData.reference && formData.reference === measurementId) {
        newErrors.reference = "Una unidad no puede referenciarse a sí misma";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      // Preparar payload para actualización
      const updatePayload = {
        unit: formData.unit,
        quantity: formData.quantity,
        reference: formData.reference || null,
        unspsc: formData.unspsc || null,
      };

      // Llamar a la server action
      const result = await updateMeasurement(measurementId, updatePayload);

      if (!result.success) {
        // Manejar errores específicos
        if (result.message?.includes("ya está en uso")) {
          setErrors({ unit: result.message });
        } else if (result.message?.includes("referencia")) {
          setErrors({ reference: result.message });
        } else if (result.message?.includes("UNSPSC")) {
          setErrors({ unspsc: result.message });
        } else {
          toast.error(
            result.message || "Error al actualizar la unidad de medida"
          );
        }
        setLoading(false);
        return;
      }

      // Éxito
      toast.success("¡Unidad de medida actualizada con éxito!");

      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push("/dashboard/productos/unidades-medida");
      }, 1000);
    } catch (err: any) {
      console.error("Error inesperado:", err);
      toast.error("Error inesperado al actualizar la unidad de medida");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Para selects, mantener string vacío como valor (se convertirá a null después)
    const finalValue = value;

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    // Limpiar error específico cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (isFetching) {
    return (
      <div>
        <div className="mb-6">
          <div className="inline-flex items-center text-gray-600 p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-8 bg-gray-800 rounded-sm w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded-sm w-96 animate-pulse"></div>
          </div>

          <div className="bg-[#0A0F17] rounded-lg shadow-xs border border-gray-800 p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-10 bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!measurement) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/productos/unidades-medida")}
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Unidad de medida no encontrada
            </h1>
            <p className="text-gray-500 mb-4">
              La unidad de medida que intentas editar no existe o ha sido
              eliminada.
            </p>
            <button
              onClick={() =>
                router.push("/dashboard/productos/unidades-medida")
              }
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Unidades de Medida
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/productos/unidades-medida")}
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            Editar Unidad de Medida
          </h1>
        </div>

        <div className="bg-[#0A0F17] rounded-lg shadow-xs border border-gray-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Unidad */}
            <div>
              <label
                htmlFor="unit"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Unidad *
              </label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0A0F17] border ${
                  errors.unit ? "border-red-500" : "border-gray-700"
                } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                placeholder="Ej: kilogramos, litros, metros"
                disabled={loading}
              />
              {errors.unit && (
                <p className="mt-1 text-sm text-red-500">{errors.unit}</p>
              )}
            </div>

            {/* Campo Cantidad */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Cantidad *
              </label>
              <input
                type="text"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0A0F17] border ${
                  errors.quantity ? "border-red-500" : "border-gray-700"
                } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                placeholder="Ej: kg, L, m"
                disabled={loading}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            {/* Campo Referencia */}
            <div>
              <label
                htmlFor="reference"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Referencia
              </label>
              <select
                id="reference"
                name="reference"
                value={formData.reference || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0A0F17] border ${
                  errors.reference ? "border-red-500" : "border-gray-700"
                } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                disabled={loading}
              >
                <option value="">Sin referencia</option>
                {measurementOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.unit} ({option.quantity})
                  </option>
                ))}
              </select>
              {errors.reference && (
                <p className="mt-1 text-sm text-red-500">{errors.reference}</p>
              )}
            </div>

            {/* Campo UNSPSC */}
            <div>
              <label
                htmlFor="unspsc"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Código UNSPSC
              </label>
              <select
                id="unspsc"
                name="unspsc"
                value={formData.unspsc || ""}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-[#0A0F17] border ${
                  errors.unspsc ? "border-red-500" : "border-gray-700"
                } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent`}
                disabled={loading}
              >
                <option value="">Sin código UNSPSC</option>
                {unspscOptions.map((unspsc) => (
                  <option key={unspsc.id} value={unspsc.id}>
                    {unspsc.code} - {unspsc.name} ({unspsc.type})
                  </option>
                ))}
              </select>
              {errors.unspsc && (
                <p className="mt-1 text-sm text-red-500">{errors.unspsc}</p>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/productos/unidades-medida")
                }
                className="px-6 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-yellow-500 text-black font-medium rounded-md hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Unidad"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
