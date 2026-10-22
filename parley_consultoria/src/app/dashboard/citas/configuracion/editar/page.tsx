"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  getCancellationTimeConfig, 
  createCancellationTimeConfig, 
  updateCancellationTimeConfig,
  getMinReservationTimeConfig,
  createMinReservationTimeConfig,
  updateMinReservationTimeConfig
} from "@/lib/actions/configuration.actions";
import { toast } from "sonner";

export default function EditAppointmentConfigPage() {
  const [formData, setFormData] = useState({
    cancellation_minutes: "60",
    min_reservation_minutes: "120",
    cancellation_active: true,
    min_reservation_active: true,
  });
  const [cancellationConfigId, setCancellationConfigId] = useState<string>("");
  const [minReservationConfigId, setMinReservationConfigId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      // Obtener configuración de cancelación
      const cancellationData = await getCancellationTimeConfig();
      if (cancellationData.success && cancellationData.data) {
        setCancellationConfigId(cancellationData.data.id);
        setFormData(prev => ({
          ...prev,
          cancellation_minutes: cancellationData.data?.value || "60",
          cancellation_active: cancellationData.data?.active !== false,
        }));
      }

      // Obtener configuración de tiempo mínimo para reservar
      const minReservationData = await getMinReservationTimeConfig();
      if (minReservationData.success && minReservationData.data) {
        setMinReservationConfigId(minReservationData.data.id);
        setFormData(prev => ({
          ...prev,
          min_reservation_minutes: minReservationData.data?.value || "120",
          min_reservation_active: minReservationData.data?.active !== false,
        }));
      }
    } catch (error) {
      console.error("Error al cargar configuraciones:", error);
      toast.error("Error al cargar las configuraciones");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === "cancellation_minutes" || name === "min_reservation_minutes") {
      // Permitir solo números
      const numbersOnly = value.replace(/\D/g, "");
      
      // Limitar a un máximo razonable (30 días = 43,200 minutos)
      let finalValue = numbersOnly;
      if (numbersOnly) {
        const numValue = parseInt(numbersOnly, 10);
        if (numValue > 43200) {
          finalValue = "43200";
        }
      }

      setFormData((prev) => ({
        ...prev,
        [name]: finalValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validar tiempo de cancelación
    if (!formData.cancellation_minutes.trim()) {
      newErrors.cancellation_minutes = "El tiempo de cancelación es obligatorio";
    } else {
      const minutes = parseInt(formData.cancellation_minutes, 10);
      if (isNaN(minutes) || minutes < 15) {
        newErrors.cancellation_minutes = "El tiempo mínimo de cancelación es 15 minutos";
      } else if (minutes > 43200) {
        newErrors.cancellation_minutes = "El tiempo máximo de cancelación es 30 días (43,200 minutos)";
      }
    }

    // Validar tiempo mínimo para reservar
    if (!formData.min_reservation_minutes.trim()) {
      newErrors.min_reservation_minutes = "El tiempo mínimo para reservar es obligatorio";
    } else {
      const minutes = parseInt(formData.min_reservation_minutes, 10);
      if (isNaN(minutes) || minutes < 15) {
        newErrors.min_reservation_minutes = "El tiempo mínimo para reservar es 15 minutos";
      } else if (minutes > 43200) {
        newErrors.min_reservation_minutes = "El tiempo máximo para reservar es 30 días (43,200 minutos)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getTimeDescription = (minutes: string) => {
    const mins = parseInt(minutes || "0", 10);
    
    if (mins >= 1440) {
      const days = Math.floor(mins / 1440);
      return `${days} ${days === 1 ? 'día' : 'días'}`;
    } else if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      if (remaining === 0) {
        return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      }
      return `${hours}h ${remaining}m`;
    } else {
      return `${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Guardar configuración de cancelación
      if (cancellationConfigId) {
        const result = await updateCancellationTimeConfig({
          id: cancellationConfigId,
          cancellation_minutes: formData.cancellation_minutes,
          active: formData.cancellation_active,
          userId: user.id,
        });

        if (!result.success) {
          throw new Error(result.message);
        }
      } else {
        const result = await createCancellationTimeConfig({
          cancellation_minutes: formData.cancellation_minutes,
          active: formData.cancellation_active,
          userId: user.id,
        });

        if (!result.success) {
          throw new Error(result.message);
        }
      }

      // Guardar configuración de tiempo mínimo para reservar
      if (minReservationConfigId) {
        const result = await updateMinReservationTimeConfig({
          id: minReservationConfigId,
          min_reservation_minutes: formData.min_reservation_minutes,
          active: formData.min_reservation_active,
          userId: user.id,
        });

        if (!result.success) {
          throw new Error(result.message);
        }
      } else {
        const result = await createMinReservationTimeConfig({
          min_reservation_minutes: formData.min_reservation_minutes,
          active: formData.min_reservation_active,
          userId: user.id,
        });

        if (!result.success) {
          throw new Error(result.message);
        }
      }

      toast.success("Configuraciones guardadas correctamente");
      router.push("/dashboard/citas/configuracion");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error("Error al guardar configuraciones: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSelect = (field: string, minutes: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: minutes
    }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mb-6 p-4 lg:p-6">
          <Link
            href="/dashboard/citas/configuracion"
            className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#f5efe6] rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-xl border border-[#f5efe6] p-6 space-y-6">
              <div>
                <div className="h-4 bg-[#faf8f3] rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-[#faf8f3] rounded w-full"></div>
              </div>
              <div>
                <div className="h-4 bg-[#faf8f3] rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-[#faf8f3] rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      <div className="mb-6 p-4 lg:p-6">
        <Link
          href="/dashboard/citas/configuracion"
          className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#c6a365]" />
            Editar Configuraciones de Citas
          </h1>
          <p className="text-neutral-600 mt-2">
            Configura los tiempos para cancelación y reserva de citas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configuración de Cancelación */}
          <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#f5efe6] rounded-lg">
                <Clock className="w-6 h-6 text-[#c6a365]" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-semibold text-neutral-900">
                  Tiempo Máximo para Cancelar
                </h2>
                <p className="text-sm text-neutral-600">
                  Establece el tiempo límite para que los clientes puedan cancelar sus citas
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Campo principal */}
              <div>
                <label htmlFor="cancellation_minutes" className="block text-sm font-medium text-neutral-700 mb-2">
                  Tiempo en minutos *
                </label>
                <input
                  type="text"
                  id="cancellation_minutes"
                  name="cancellation_minutes"
                  value={formData.cancellation_minutes}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-[#faf8f3] border ${
                    errors.cancellation_minutes ? 'border-[#c62828]' : 'border-[#f5efe6]'
                  } rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50`}
                  placeholder="Ej: 60 (para 1 hora)"
                />
                {errors.cancellation_minutes && (
                  <p className="mt-1 text-sm text-[#c62828]">{errors.cancellation_minutes}</p>
                )}
                
                {/* Valor equivalente */}
                <div className="mt-3 p-3 bg-[#f5efe6] border border-[#e6dcc9] rounded-lg">
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium text-[#c6a365]">Equivalente a:</span>{" "}
                    {getTimeDescription(formData.cancellation_minutes)}
                  </p>
                </div>
              </div>

              {/* Botones rápidos */}
              <div>
                <p className="text-sm text-neutral-600 mb-2">Selección rápida:</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: "30 min", value: "30" },
                    { label: "1 hora", value: "60" },
                    { label: "2 horas", value: "120" },
                    { label: "1 día", value: "1440" },
                    { label: "2 días", value: "2880" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleQuickSelect("cancellation_minutes", item.value)}
                      className={`px-3 py-2 text-xs rounded-lg transition-colors border ${
                        formData.cancellation_minutes === item.value
                          ? "bg-[#c6a365] text-white font-medium border-[#c6a365]"
                          : "bg-white text-neutral-700 border border-[#f5efe6] hover:bg-[#faf8f3]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Información de ayuda */}
              <div className="bg-[#e8f4fd] border border-[#bbdefb] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#1565c0] mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ¿Cómo funciona?
                </h3>
                <ul className="text-sm text-[#1565c0] space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Los clientes podrán cancelar citas hasta este tiempo antes de la cita</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Pasado este tiempo, el botón de cancelar se deshabilitará</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Los administradores siempre pueden cancelar manualmente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Valor mínimo recomendado: 15 minutos</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Configuración de Tiempo Mínimo para Reservar */}
          <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="p-2 bg-[#f5efe6] rounded-lg">
                <Calendar className="w-6 h-6 text-[#c6a365]" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-semibold text-neutral-900">
                  Tiempo Mínimo para Reservar
                </h2>
                <p className="text-sm text-neutral-600">
                  Establece el tiempo mínimo de anticipación para reservar una cita
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Campo principal */}
              <div>
                <label htmlFor="min_reservation_minutes" className="block text-sm font-medium text-neutral-700 mb-2">
                  Tiempo en minutos *
                </label>
                <input
                  type="text"
                  id="min_reservation_minutes"
                  name="min_reservation_minutes"
                  value={formData.min_reservation_minutes}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-[#faf8f3] border ${
                    errors.min_reservation_minutes ? 'border-[#c62828]' : 'border-[#f5efe6]'
                  } rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50`}
                  placeholder="Ej: 120 (para 2 horas)"
                />
                {errors.min_reservation_minutes && (
                  <p className="mt-1 text-sm text-[#c62828]">{errors.min_reservation_minutes}</p>
                )}
                
                {/* Valor equivalente */}
                <div className="mt-3 p-3 bg-[#f5efe6] border border-[#e6dcc9] rounded-lg">
                  <p className="text-sm text-neutral-700">
                    <span className="font-medium text-[#c6a365]">Equivalente a:</span>{" "}
                    {getTimeDescription(formData.min_reservation_minutes)}
                  </p>
                </div>
              </div>

              {/* Botones rápidos */}
              <div>
                <p className="text-sm text-neutral-600 mb-2">Selección rápida:</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: "30 min", value: "30" },
                    { label: "1 hora", value: "60" },
                    { label: "2 horas", value: "120" },
                    { label: "3 horas", value: "180" },
                    { label: "1 día", value: "1440" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => handleQuickSelect("min_reservation_minutes", item.value)}
                      className={`px-3 py-2 text-xs rounded-lg transition-colors border ${
                        formData.min_reservation_minutes === item.value
                          ? "bg-[#c6a365] text-white font-medium border-[#c6a365]"
                          : "bg-white text-neutral-700 border border-[#f5efe6] hover:bg-[#faf8f3]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Información de ayuda */}
              <div className="bg-[#e8f4fd] border border-[#bbdefb] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#1565c0] mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ¿Cómo funciona?
                </h3>
                <ul className="text-sm text-[#1565c0] space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Los clientes no podrán reservar citas que empiecen en menos de este tiempo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Las citas que ya están muy cerca no aparecerán disponibles para reserva</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Valor mínimo recomendado: 15 minutos</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#f5efe6]">
            <Link
              href="/dashboard/citas/configuracion"
              className="px-6 py-3 text-sm font-medium text-neutral-700 bg-white border border-[#f5efe6] rounded-lg hover:bg-[#faf8f3] transition-colors text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-sm font-medium bg-[#c6a365] hover:bg-[#b59555] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                "Guardar Configuraciones"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}