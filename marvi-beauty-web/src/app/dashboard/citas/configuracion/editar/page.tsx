"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Clock, Calendar, AlertCircle } from "lucide-react";
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
      <div className="min-h-screen bg-custom-bg-primary">
        <div className="mb-6 p-4 sm:p-6">
          <Link
            href="/dashboard/citas/configuracion"
            className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-custom-bg-secondary rounded w-1/3 mb-6"></div>
            <div className="bg-custom-bg-secondary rounded-lg shadow-xs border border-custom-border-secondary p-6 space-y-6">
              <div>
                <div className="h-4 bg-custom-bg-tertiary rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-custom-bg-tertiary rounded w-full"></div>
              </div>
              <div>
                <div className="h-4 bg-custom-bg-tertiary rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-custom-bg-tertiary rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      <div className="mb-6 p-4 sm:p-6">
        <Link
          href="/dashboard/citas/configuracion"
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-custom-text-primary flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            Editar Configuraciones de Citas
          </h1>
          <p className="text-custom-text-tertiary mt-2">
            Configura los tiempos para cancelación y reserva de citas
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Configuración de Cancelación */}
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 sm:p-6">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 bg-[#987E71]/20 rounded-lg">
                <Clock className="w-6 h-6 text-[#987E71]" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-custom-text-primary">
                  Tiempo Máximo para Cancelar
                </h2>
                <p className="text-sm text-custom-text-tertiary">
                  Establece el tiempo límite para que los clientes puedan cancelar sus citas
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Campo principal */}
              <div>
                <label htmlFor="cancellation_minutes" className="block text-sm font-medium text-custom-text-secondary mb-2">
                  Tiempo en minutos *
                </label>
                <input
                  type="text"
                  id="cancellation_minutes"
                  name="cancellation_minutes"
                  value={formData.cancellation_minutes}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-custom-bg-tertiary border ${
                    errors.cancellation_minutes ? 'border-red-500' : 'border-custom-border-primary'
                  } rounded-lg text-custom-text-primary placeholder-custom-text-muted focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition-all duration-200`}
                  placeholder="Ej: 60 (para 1 hora)"
                />
                {errors.cancellation_minutes && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.cancellation_minutes}
                  </p>
                )}
                
                {/* Valor equivalente */}
                <div className="mt-3 p-3 bg-custom-accent-hover border border-custom-accent-border rounded-lg">
                  <p className="text-sm text-custom-text-primary">
                    <span className="font-medium text-custom-accent-primary">Equivalente a:</span>{" "}
                    {getTimeDescription(formData.cancellation_minutes)}
                  </p>
                </div>
              </div>

              {/* Botones rápidos */}
              <div>
                <p className="text-sm text-custom-text-secondary mb-2">Selección rápida:</p>
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
                      className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                        formData.cancellation_minutes === item.value
                          ? "bg-[#987E71] text-primary-foreground font-medium shadow-md"
                          : "bg-custom-bg-tertiary text-custom-text-secondary border border-custom-border-primary hover:bg-custom-bg-hover"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Información de ayuda */}
              <div className="bg-custom-accent-hover border border-custom-accent-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-custom-accent-primary mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ¿Cómo funciona?
                </h3>
                <ul className="text-sm text-custom-accent-secondary space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-custom-accent-primary mt-1">•</span>
                    <span>Los clientes podrán cancelar citas hasta este tiempo antes de la cita</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-custom-accent-primary mt-1">•</span>
                    <span>Pasado este tiempo, el botón de cancelar se deshabilitará</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-custom-accent-primary mt=1">•</span>
                    <span>Los administradores siempre pueden cancelar manualmente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-custom-accent-primary mt=1">•</span>
                    <span>Valor mínimo recomendado: 15 minutos</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Configuración de Tiempo Mínimo para Reservar */}
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 sm:p-6">
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-custom-text-primary">
                  Tiempo Mínimo para Reservar
                </h2>
                <p className="text-sm text-custom-text-tertiary">
                  Establece el tiempo mínimo de anticipación para reservar una cita
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Campo principal */}
              <div>
                <label htmlFor="min_reservation_minutes" className="block text-sm font-medium text-custom-text-secondary mb-2">
                  Tiempo en minutos *
                </label>
                <input
                  type="text"
                  id="min_reservation_minutes"
                  name="min_reservation_minutes"
                  value={formData.min_reservation_minutes}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-custom-bg-tertiary border ${
                    errors.min_reservation_minutes ? 'border-red-500' : 'border-custom-border-primary'
                  } rounded-lg text-custom-text-primary placeholder-custom-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200`}
                  placeholder="Ej: 120 (para 2 horas)"
                />
                {errors.min_reservation_minutes && (
                  <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.min_reservation_minutes}
                  </p>
                )}
                
                {/* Valor equivalente */}
                <div className="mt-3 p-3 bg-custom-accent-hover border border-custom-accent-border rounded-lg">
                  <p className="text-sm text-custom-text-primary">
                    <span className="font-medium text-custom-accent-primary">Equivalente a:</span>{" "}
                    {getTimeDescription(formData.min_reservation_minutes)}
                  </p>
                </div>
              </div>

              {/* Botones rápidos */}
              <div>
                <p className="text-sm text-custom-text-secondary mb-2">Selección rápida:</p>
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
                      className={`px-3 py-2 text-xs rounded-lg transition-all duration-200 ${
                        formData.min_reservation_minutes === item.value
                          ? "bg-blue-500 text-white font-medium shadow-md"
                          : "bg-custom-bg-tertiary text-custom-text-secondary border border-custom-border-primary hover:bg-custom-bg-hover"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Información de ayuda */}
              <div className="bg-custom-accent-hover border border-custom-accent-border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-custom-accent-primary mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ¿Cómo funciona?
                </h3>
                <ul className="text-sm text-custom-accent-secondary space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-custom-accent-primary mt-1">•</span>
                    <span>Los clientes no podrán reservar citas que empiecen en menos de este tiempo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-custom-accent-primary mt-1">•</span>
                    <span>Las citas que ya están muy cerca no aparecerán disponibles para reserva</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-custom-accent-primary mt-1">•</span>
                    <span>Valor mínimo recomendado: 15 minutos</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-custom-border-secondary">
            <Link
              href="/dashboard/citas/configuracion"
              className="px-4 py-3 text-sm font-medium text-custom-text-secondary bg-custom-bg-tertiary border border-custom-border-primary rounded-lg hover:bg-custom-bg-hover transition-all duration-200 text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-3 text-sm font-medium bg-[#987E71] hover:bg-[#b19587] text-primary-foreground rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-lg hover:shadow-button-primary/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
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