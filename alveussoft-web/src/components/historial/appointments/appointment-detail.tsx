"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarDays,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  AlertCircle,
  Info,
  Ban,
} from "lucide-react";
import { CancelAppointmentDialog } from "./cancel-appointment-dialog";
import { getCancellationTimeMinutes, canCancelAppointment } from "@/lib/actions/configuration.actions";
import { toast } from "sonner";

interface AppointmentDetail {
  id: string;
  appointment_datetime: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  notes: string | null;
  client_notes: string | null;
  created_at: string;
  updated_at: string;
  booked_at: string | null;
  cancelled_at: string | null;
  status_id: string | null;
  status?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  space_owner?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  booked_by?: {
    id: string;
    email: string;
    full_name: string | null;
  } | null;
  booked_by_contact_id?: string | null; // para identificar al contacto propietario
}

// CAMBIO: Mapeo estático de estados para cuando no se puede consultar la BD
// Esto permite mostrar estados correctos sin requerir autenticación
const APPOINTMENT_STATUS_MAP: Record<string, { id: string; name: string; description: string }> = {
  "517e3cc0-0763-4fd0-9195-756fe4617706": { id: "517e3cc0-0763-4fd0-9195-756fe4617706", name: "disponible", description: "Disponible" },
  "aa68683c-9977-4b6d-8c9c-aad1d3f0500f": { id: "aa68683c-9977-4b6d-8c9c-aad1d3f0500f", name: "reservada", description: "Reservada" },
  "7cccd43a-1998-41e9-b70a-61a778106338": { id: "7cccd43a-1998-41e9-b70a-61a778106338", name: "confirmada", description: "Confirmada" },
  "6aa423c3-db95-4633-9e31-a1bb92e16f2c": { id: "6aa423c3-db95-4633-9e31-a1bb92e16f2c", name: "cancelada", description: "Cancelada" },
  "6eb8a4c9-d793-411a-a333-7c9c806c25df": { id: "6eb8a4c9-d793-411a-a333-7c9c806c25df", name: "finalizada", description: "Finalizada" },
  "fcd4937a-6f80-4134-87c2-f990dd910139": { id: "fcd4937a-6f80-4134-87c2-f990dd910139", name: "perdida", description: "Perdida" },
};

// CAMBIO: Funciones de colores actualizadas para usar nombres en español
// Anteriormente: Usaba nombres en inglés ("booked", "confirmed", etc.)
// Ahora: Usa nombres en español ("reservada", "confirmada", etc.) para coincidir con el mapeo
const getStatusColor = (statusName: string | undefined) => {
  switch (statusName?.toLowerCase()) {
    case "reservada":
      return "bg-purple-900/30 text-purple-300 border-purple-700";
    case "confirmada":
      return "bg-green-900/30 text-green-300 border-green-700";
    case "cancelada":
      return "bg-red-900/30 text-red-300 border-red-700";
    case "finalizada":
      return "bg-blue-900/30 text-blue-300 border-blue-700";
    case "perdida":
      return "bg-gray-900/30 text-gray-300 border-gray-700";
    case "disponible":
      return "bg-emerald-900/30 text-emerald-300 border-emerald-700";
    default:
      return "bg-gray-900/30 text-gray-300 border-gray-700";
  }
};

const getStatusIcon = (statusName: string | undefined) => {
  switch (statusName?.toLowerCase()) {
    case "confirmada":
      return <CheckCircle className="w-4 h-4" />;
    case "cancelada":
      return <XCircle className="w-4 h-4" />;
    case "reservada":
      return <ClockIcon className="w-4 h-4" />;
    case "finalizada":
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function AppointmentDetail() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = params.id as string;
  const contactId = searchParams.get('contactId');
  const supabase = createClient();

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [cancellationTimeMessage, setCancellationTimeMessage] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [maxCancellationMinutes, setMaxCancellationMinutes] = useState(60);
  const [checkingCancellation, setCheckingCancellation] = useState(true);
  const [loggedUserId, setLoggedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetail();
      fetchCancellationConfig();
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment || !maxCancellationMinutes) return;

    // Siempre chequear la política de cancelación
    checkCancellationStatus(appointment);
  }, [appointment, maxCancellationMinutes]);


  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔐 CAMBIO: CONTROL DE ACCESO IMPLEMENTADO
      // Anteriormente cualquiera podía ver cualquier cita
      // Ahora verifica permisos antes de mostrar datos
      const { data: { user } } = await supabase.auth.getUser();
      
      // Guardar el ID del usuario logeado para chequeos posteriores
      if (user) {
        setLoggedUserId(user.id);
      }
      
      if (!user && !contactId) {
        setError("Acceso denegado. Debe iniciar sesión o proporcionar un ID de contacto válido.");
        setLoading(false);
        return;
      }

      let accessGranted = false;

      if (user) {
        // CAMBIO: Lógica simplificada para acceso de usuarios autenticados
        // ANTES: Solo permitía acceso si la cita estaba activa (deleted_at = null)
        // AHORA: Permite acceso a cualquier cita que el usuario haya reservado, incluyendo canceladas
        // CAMBIO: Consulta de verificación más robusta
        // ANTES: Usaba .single() que podía fallar si no había resultados
        // AHORA: Usa .maybeSingle() y verifica existencia correctamente
        const { data: userAppointment, error: userCheckError } = await supabase
          .from("appointments")
          .select("id")
          .eq("id", appointmentId)
          .eq("booked_by_user_id", user.id)
          .maybeSingle();

        if (!userCheckError && userAppointment) {
          accessGranted = true;
        } else {
          // Si no es su cita, verificar si es admin/profesional
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (userProfile?.role === 'admin' || userProfile?.role === 'professional') {
            accessGranted = true;
          }
        }
      } else if (contactId) {
        // Usuario no autenticado con contactId: verificar que la cita pertenece a ese contacto
        // CAMBIO: También removida restricción deleted_at para contactos
        // CAMBIO: Usar .maybeSingle() para evitar errores
        const { data: contactAppointment, error: contactCheckError } = await supabase
          .from("appointments")
          .select("id")
          .eq("id", appointmentId)
          .eq("booked_by_contact_id", contactId)
          .maybeSingle();

        if (!contactCheckError && contactAppointment) {
          accessGranted = true;
        }
      }

      if (!accessGranted) {
        setError("No tiene permisos para ver esta cita.");
        setLoading(false);
        return;
      }

      // Si tenemos acceso, cargar los detalles de la cita
      // CAMBIO: Consulta modificada para evitar errores de "single JSON object"
      // ANTES: Usaba .single() con restricción deleted_at que podía causar conflictos
      // AHORA: Usa .maybeSingle() sin restricción deleted_at para mayor compatibilidad
      const { data, error: fetchError } = await supabase
        .from("appointments")
        .select(
          `
          *,
          booked_by_contact_id,
          space_owner:space_owner_user_id (id, email, full_name),
          booked_by:booked_by_user_id (id, email, full_name)
        `
        )
        .eq("id", appointmentId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error cargando cita:", fetchError.message);
        setError("No se pudo cargar la información de la cita");
        return;
      }

      if (!data) {
        setError("La cita no existe o ha sido eliminada");
        return;
      }

      // CAMBIO: Carga del status mejorada para usuarios no autenticados
      // Anteriormente: Consulta a BD con JOIN (no funciona sin auth)
      // Ahora: Primero busca en mapeo estático, luego consulta BD solo si hay usuario
      let statusData = null;
      
      if (data.status_id) {
        // Primero intentar obtener del mapeo estático
        statusData = APPOINTMENT_STATUS_MAP[data.status_id] || null;
        
        // Si no está en el mapeo, intentar consultar la BD (solo si hay usuario autenticado)
        if (!statusData && user) {
          const { data: statusResult, error: statusError } = await supabase
            .from("appointment_status")
            .select("id, name, description")
            .eq("id", data.status_id)
            .single();

          if (!statusError && statusResult) {
            statusData = statusResult;
          }
        }
      }

      // Combinar los datos
      const appointmentWithStatus = {
        ...data,
        status: statusData
      };

      setAppointment(appointmentWithStatus);
    } catch (err) {
      console.error("Error inesperado:", err);
      setError("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  };

  const fetchCancellationConfig = async () => {
    try {
      const minutes = await getCancellationTimeMinutes();
      setMaxCancellationMinutes(minutes);
    } catch (err) {
      console.error("Error obteniendo configuración:", err);
      setMaxCancellationMinutes(60);
    }
  };

  const checkCancellationStatus = async (appointmentData: AppointmentDetail) => {
    setCheckingCancellation(true);
    try {
      if (appointmentData.status?.name?.toLowerCase() === "cancelada") {
        setCanCancel(false);
        setCancellationTimeMessage("Esta cita ya está cancelada");
        return;
      }

      const canCancelResult = await canCancelAppointment(
        appointmentData.appointment_datetime
      );
      
      const appointmentTime = new Date(appointmentData.appointment_datetime);
      const now = new Date();
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const minutesUntilAppointment = Math.max(0, timeDiff / (1000 * 60));
      
      setCanCancel(canCancelResult);
      
      if (canCancelResult) {
        setCancellationTimeMessage(
          `Puede cancelar hasta ${formatTimeMessage(maxCancellationMinutes)} antes de la cita.`
        );
      } else {
        if (minutesUntilAppointment <= 0) {
          setCancellationTimeMessage("La cita ya pasó o está en curso.");
        } else if (minutesUntilAppointment <= maxCancellationMinutes) {
          setCancellationTimeMessage(
            `No se puede cancelar. La cita es en ${Math.ceil(minutesUntilAppointment)} minutos ` +
            `(mínimo ${maxCancellationMinutes} minutos requeridos).`
          );
        } else {
          setCancellationTimeMessage("No se puede cancelar en este momento.");
        }
      }
    } catch (err) {
      console.error("Error verificando tiempo de cancelación:", err);
      const appointmentTime = new Date(appointmentData.appointment_datetime);
      const now = new Date();
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const minutesUntilAppointment = timeDiff / (1000 * 60);
      
      const canCancelNow = minutesUntilAppointment > maxCancellationMinutes;
      setCanCancel(canCancelNow);
      setCancellationTimeMessage(
        canCancelNow 
          ? `Puede cancelar hasta ${formatTimeMessage(maxCancellationMinutes)} antes de la cita.`
          : `No se puede cancelar. La cita es en ${Math.ceil(minutesUntilAppointment)} minutos.`
      );
    } finally {
      setCheckingCancellation(false);
    }
  };

  const formatTimeMessage = (minutes: number): string => {
    if (minutes >= 1440) {
      const days = Math.floor(minutes / 1440);
      return `${days} ${days === 1 ? 'día' : 'días'}`;
    } else if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else {
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return format(date, "hh:mm a", { locale: es });
      } catch (error) {
        return "";
      }
    };

  const handleCancelSuccess = () => {
    toast.success("Cita cancelada correctamente");
    fetchAppointmentDetail();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-800 rounded w-1/4"></div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="h-6 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-4 bg-gray-800 rounded w-1/2"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">
          {error || "Cita no encontrada"}
        </h2>
        <p className="text-gray-400 mb-6">
          La cita que buscas no existe o no tienes permiso para verla.
        </p>
        <Button
          onClick={() => router.push("/appointments/history")}
          className="bg-gray-800 hover:bg-gray-700 text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>
    );
  }

  const canSeeCancelActions = 
    appointment.status?.description?.toLowerCase() !== "cancelada" &&
    appointment.status?.description?.toLowerCase() !== "finalizada" && 
    appointment.status?.description?.toLowerCase() !== "perdida";

  return (
    <div className="space-y-6">
      {/* Navegación */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => {
            // CAMBIO: Botón de regresar actualizado para incluir contactId
            // Anteriormente: Siempre iba a /appointments/history
            // Ahora: Si hay contactId, lo incluye en la URL para mantener el contexto
            const baseUrl = "/appointments/history";
            const backUrl = contactId ? `${baseUrl}?contactId=${contactId}` : baseUrl;
            router.push(backUrl);
          }}
          className="px-0 hover:bg-transparent text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        {/* Header - Fecha y Estado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-800">
          {/* Fecha de la cita */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-800 rounded-lg">
              <CalendarDays className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {formatDate(appointment.appointment_datetime)}
              </h2>
              <div className="flex items-center gap-2 text-gray-400 mt-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(appointment.appointment_datetime)}</span>
              </div>
            </div>
          </div>
          
          {/* Estado */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-500">Estado:</span>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(appointment.status?.name)}`}
            >
              {getStatusIcon(appointment.status?.name)}
              <span className="font-medium">
                {appointment.status?.description || "Sin estado"}
              </span>
            </div>
          </div>
        </div>

        {/* Información del cliente */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-white">
              Información del Cliente
            </h3>
          </div>

          <div className="space-y-4">
            {appointment.client_name && (
              <div className="p-4 border border-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Nombre completo</p>
                <p className="text-white font-medium">
                  {appointment.client_name}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointment.client_email && (
                <div className="p-4 border border-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Email</span>
                  </div>
                  <a
                    href={`mailto:${appointment.client_email}`}
                    className="text-yellow-400 hover:text-yellow-300 transition-colors break-all"
                  >
                    {appointment.client_email}
                  </a>
                </div>
              )}

              {appointment.client_phone && (
                <div className="p-4 border border-gray-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">Teléfono</span>
                  </div>
                  <a
                    href={`tel:${appointment.client_phone}`}
                    className="text-white hover:text-yellow-400 transition-colors"
                  >
                    {appointment.client_phone}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notas del cliente */}
        {appointment.client_notes && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">
                Notas del Cliente
              </h3>
            </div>
            <div className="p-4 border border-gray-800 rounded-lg bg-gray-800/30">
              <p className="text-gray-300 whitespace-pre-wrap">
                {appointment.client_notes}
              </p>
            </div>
          </div>
        )}

        {/* Profesional */}
        {appointment.space_owner && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Profesional Asignado
            </h3>
            <div className="p-4 border border-gray-800 rounded-lg">
              <p className="text-white font-medium mb-1">
                {appointment.space_owner.full_name || "Sin nombre"}
              </p>
              <p className="text-gray-400 text-sm">
                {appointment.space_owner.email}
              </p>
            </div>
          </div>
        )}

        {/* Sección de acciones */}
        {canSeeCancelActions && (
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {/* Botón de cancelar */}
              <Button
                variant={canCancel ? "destructive" : "outline"}
                onClick={() => setShowCancelDialog(true)}
                disabled={!canCancel}
                className={`flex items-center gap-2 px-8 py-6 text-lg ${!canCancel ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <Ban className="w-5 h-5" />
                Cancelar Cita
              </Button>
              
              {/* Mensaje informativo */}
              {cancellationTimeMessage && !checkingCancellation && (
                <div className="max-w-md">
                  <p className={`text-sm ${canCancel ? "text-gray-400" : "text-red-400"} text-center`}>
                    {cancellationTimeMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Si ya está cancelada, mostrar mensaje en lugar del botón */}
        {appointment.status?.description?.toLowerCase() === "cancelada" && (
          <div className="mt-8 pt-8 border-t border-gray-800">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-6 max-w-md">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <XCircle className="w-6 h-6 text-red-400" />
                  <span className="font-medium text-red-300 text-lg">
                    Cita Cancelada
                  </span>
                </div>
                <p className="text-red-200/80 text-sm">
                  Esta cita fue cancelada el {appointment.cancelled_at ? 
                    new Date(appointment.cancelled_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : "fecha desconocida"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Diálogo de cancelación */}
      <CancelAppointmentDialog
        appointmentId={appointment.id}
        appointmentDatetimeLabel={`${formatDate(appointment.appointment_datetime)} a las ${formatTime(appointment.appointment_datetime)}`}
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onSuccess={handleCancelSuccess}
        canCancel={canCancel}
        contactId={contactId || undefined}
      />
    </div>
  );
}