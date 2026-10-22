"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Edit, CheckCircle, XCircle, AlertCircle, Calendar } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  getCancellationTimeConfig, 
  getCancellationTimeMessage,
  getMinReservationTimeConfig,
  getMinReservationTimeMessage
} from "@/lib/actions/configuration.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { toast } from "sonner";

export default function AppointmentConfigPage() {
  const [cancellationConfig, setCancellationConfig] = useState<any>(null);
  const [minReservationConfig, setMinReservationConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canEdit, setCanEdit] = useState(false);
  const [cancellationMessage, setCancellationMessage] = useState("");
  const [minReservationMessage, setMinReservationMessage] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Obtener configuración de cancelación
      const cancellationData = await getCancellationTimeConfig();
      
      if (cancellationData.success) {
        setCancellationConfig(cancellationData.data);
      } else {
        setCancellationConfig(null);
        if (cancellationData.message !== "No se encontró configuración de tiempo de cancelación.") {
          toast.warning(cancellationData.message);
        }
      }

      // Obtener configuración de tiempo mínimo para reservar
      const minReservationData = await getMinReservationTimeConfig();
      
      if (minReservationData.success) {
        setMinReservationConfig(minReservationData.data);
      } else {
        setMinReservationConfig(null);
        if (minReservationData.message !== "No se encontró configuración de tiempo mínimo para reservar.") {
          toast.warning(minReservationData.message);
        }
      }

      // Obtener mensajes
      const cancellationMsg = await getCancellationTimeMessage();
      setCancellationMessage(cancellationMsg);

      const minReservationMsg = await getMinReservationTimeMessage();
      setMinReservationMessage(minReservationMsg);

      // Verificar permisos
      const userWithPermissions = await getUserWithPermissions();
      const userPermissions = userWithPermissions?.permissions?.map(
        (p: { code: string }) => p.code
      ) || [];

      setCanEdit(userPermissions.includes("update:appointments-configuration"));
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.warning("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const getCancellationTime = () => {
    if (!cancellationConfig?.value) return "60"; // Valor por defecto
    return cancellationConfig.value;
  };

  const getMinReservationTime = () => {
    if (!minReservationConfig?.value) return "120"; // Valor por defecto (2 horas)
    return minReservationConfig.value;
  };

  const isCancellationActive = () => {
    return cancellationConfig?.active !== false;
  };

  const isMinReservationActive = () => {
    return minReservationConfig?.active !== false;
  };

  const formatTimeDisplay = (minutes: string) => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins)) return "No configurado";

    if (mins >= 1440) {
      const days = Math.floor(mins / 1440);
      return `${days} ${days === 1 ? 'día' : 'días'}`;
    } else if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      if (remainingMins === 0) {
        return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
      }
      return `${hours}h ${remainingMins}m`;
    } else {
      return `${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3]">
        <div className="mb-6">
          <Link
            href="/dashboard/citas"
            className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#f5efe6] rounded w-1/3 mb-6"></div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-[#f5efe6] p-6">
                <div className="h-6 bg-[#faf8f3] rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-[#faf8f3] rounded w-3/4"></div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-[#f5efe6] p-6">
                <div className="h-6 bg-[#faf8f3] rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-[#faf8f3] rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cancellationTime = getCancellationTime();
  const minReservationTime = getMinReservationTime();
  const cancellationActive = isCancellationActive();
  const minReservationActive = isMinReservationActive();

  return (
    <div className="min-h-screen">
      <div className="mb-6 p-4 lg:p-6">
        <Link
          href="/dashboard/citas"
          className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#c6a365]" />
            Configuración de Citas
          </h1>

          {canEdit && (
            <Link href="/dashboard/citas/configuracion/editar">
              <Button className="inline-flex items-center px-3 md:px-6 py-2 bg-[#c6a365] hover:bg-[#b59555] text-white font-medium rounded-lg transition duration-300 hover:shadow-lg hover:shadow-[#c6a365]/20">
                <Edit className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">
                  Editar Configuraciones
                </span>
              </Button>
            </Link>
          )}
        </div>

        <div className="space-y-6">
          {/* Configuración de Cancelación */}
          <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f5efe6]">
              <div>
                <h2 className="text-lg font-serif font-semibold text-neutral-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#c6a365]" />
                  Tiempo Máximo para Cancelar Citas
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Establece el tiempo límite para que los clientes puedan cancelar sus citas
                </p>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  cancellationActive
                    ? "bg-[#e8f5e8] text-[#2e7d32] border-[#c8e6c9]"
                    : "bg-[#fdeaea] text-[#c62828] border-[#ffcdd2]"
                }`}
              >
                {cancellationActive ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Inactivo
                  </>
                )}
              </div>
            </div>

            <div className="py-6 space-y-6">
              {/* Tiempo configurado */}
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium text-neutral-700">
                  Tiempo Máximo para Cancelar
                </label>
                <div className="p-4 bg-[#faf8f3] rounded-lg border border-[#f5efe6]">
                  <p className="text-2xl font-semibold text-neutral-900">
                    {formatTimeDisplay(cancellationTime)}
                  </p>
                  <p className="text-sm text-neutral-600 mt-1">
                    ({cancellationTime} minutos)
                  </p>
                </div>
              </div>

              {/* Mensaje descriptivo */}
              <div className="bg-[#e8f4fd] border border-[#bbdefb] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#1565c0] mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ¿Cómo funciona?
                </h3>
                <p className="text-[#1565c0] text-sm">
                  {cancellationMessage}
                </p>
                <ul className="text-[#1565c0] text-sm mt-3 space-y-1">
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
                </ul>
              </div>
            </div>
          </div>

          {/* Configuración de Tiempo Mínimo para Reservar */}
          <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f5efe6]">
              <div>
                <h2 className="text-lg font-serif font-semibold text-neutral-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#c6a365]" />
                  Tiempo Mínimo para Reservar Citas
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Establece el tiempo mínimo de anticipación para reservar una cita
                </p>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  minReservationActive
                    ? "bg-[#e8f5e8] text-[#2e7d32] border-[#c8e6c9]"
                    : "bg-[#fdeaea] text-[#c62828] border-[#ffcdd2]"
                }`}
              >
                {minReservationActive ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Activo
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Inactivo
                  </>
                )}
              </div>
            </div>

            <div className="py-6 space-y-6">
              {/* Tiempo configurado */}
              <div className="space-y-2 max-w-md">
                <label className="text-sm font-medium text-neutral-700">
                  Tiempo Mínimo para Reservar
                </label>
                <div className="p-4 bg-[#faf8f3] rounded-lg border border-[#f5efe6]">
                  <p className="text-2xl font-semibold text-neutral-900">
                    {formatTimeDisplay(minReservationTime)}
                  </p>
                  <p className="text-sm text-neutral-600 mt-1">
                    ({minReservationTime} minutos)
                  </p>
                </div>
              </div>

              {/* Mensaje descriptivo */}
              <div className="bg-[#e8f4fd] border border-[#bbdefb] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#1565c0] mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ¿Cómo funciona?
                </h3>
                <p className="text-[#1565c0] text-sm">
                  {minReservationMessage}
                </p>
                <ul className="text-[#1565c0] text-sm mt-3 space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Los clientes no podrán reservar citas que empiecen en menos de este tiempo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                    <span>Las citas que ya están muy cerca no aparecerán disponibles para reserva</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}