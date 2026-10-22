"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
}

const getStatusColor = (statusName: string | undefined) => {
  switch (statusName?.toLowerCase()) {
    case "booked":
      return "bg-[#fff8e1] text-[#f57c00] border-[#ffecb3]";
    case "confirmed":
      return "bg-[#f0f7f0] text-[#2e7d32] border-[#c8e6c9]";
    case "cancelled":
      return "bg-[#fdeaea] text-[#c62828] border-[#ffcdd2]";
    case "completed":
      return "bg-[#e8f4fd] text-[#1565c0] border-[#bbdefb]";
    case "no_show":
      return "bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]";
    default:
      return "bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]";
  }
};

const getStatusIcon = (statusName: string | undefined) => {
  switch (statusName?.toLowerCase()) {
    case "confirmed":
      return <CheckCircle className="w-4 h-4" />;
    case "cancelled":
      return <XCircle className="w-4 h-4" />;
    case "booked":
      return <ClockIcon className="w-4 h-4" />;
    default:
      return <AlertCircle className="w-4 h-4" />;
  }
};

export default function AppointmentDetail() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;
  const supabase = createClient();

  const [appointment, setAppointment] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [cancellationTimeMessage, setCancellationTimeMessage] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [maxCancellationMinutes, setMaxCancellationMinutes] = useState(60);
  const [checkingCancellation, setCheckingCancellation] = useState(true);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointmentDetail();
      fetchCancellationConfig();
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!appointment || !maxCancellationMinutes) return;

    checkCancellationStatus(appointment);
  }, [appointment, maxCancellationMinutes]);


  const fetchAppointmentDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("appointments")
        .select(
          `
          *,
          status:status_id (id, name, description),
          space_owner:space_owner_user_id (id, email, full_name),
          booked_by:booked_by_user_id (id, email, full_name)
        `
        )
        .eq("id", appointmentId)
        .is("deleted_at", null)
        .single();

      if (fetchError) {
        console.error("Error cargando cita:", fetchError.message);
        setError("No se pudo cargar la información de la cita");
        return;
      }

      if (data) {
        setAppointment(data);
      }
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
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCancelSuccess = () => {
    toast.success("Cita cancelada correctamente");
    fetchAppointmentDetail();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-[#f5efe6] rounded w-1/4"></div>
        <div className="bg-white border border-[#f5efe6] rounded-xl p-6 space-y-6 shadow-sm">
          <div className="h-6 bg-[#f5efe6] rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-4 bg-[#f5efe6] rounded w-1/2"></div>
              <div className="h-10 bg-[#f5efe6] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="bg-[#fdeaea] border border-[#ffcdd2] rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-[#c62828] mx-auto mb-4" />
        <h2 className="text-xl font-serif font-semibold text-neutral-900 mb-2">
          {error || "Cita no encontrada"}
        </h2>
        <p className="text-neutral-600 mb-6">
          La cita que buscas no existe o no tienes permiso para verla.
        </p>
        <Button
          onClick={() => router.push("/appointments/history")}
          className="bg-[#f5efe6] hover:bg-[#e6dcc9] text-neutral-900"
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
          onClick={() => router.push("/appointments/history")}
          className="px-0 hover:bg-transparent text-neutral-600 hover:text-neutral-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
        </Button>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-white border border-[#f5efe6] rounded-xl p-6 shadow-sm">
        {/* Header - Fecha y Estado */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#f5efe6]">
          {/* Fecha de la cita */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#faf8f3] rounded-lg border border-[#f5efe6]">
              <CalendarDays className="w-6 h-6 text-[#c6a365]" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-semibold text-neutral-900">
                {formatDate(appointment.appointment_datetime)}
              </h2>
              <div className="flex items-center gap-2 text-neutral-600 mt-1">
                <Clock className="w-4 h-4" />
                <span>{formatTime(appointment.appointment_datetime)}</span>
              </div>
            </div>
          </div>
          
          {/* Estado */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-neutral-500" />
              <span className="text-sm text-neutral-600">Estado:</span>
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
            <User className="w-5 h-5 text-neutral-500" />
            <h3 className="text-lg font-serif font-semibold text-neutral-900">
              Información del Cliente
            </h3>
          </div>

          <div className="space-y-4">
            {appointment.client_name && (
              <div className="p-4 border border-[#f5efe6] rounded-lg bg-[#faf8f3]">
                <p className="text-sm text-neutral-600 mb-1">Nombre completo</p>
                <p className="text-neutral-900 font-medium">
                  {appointment.client_name}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointment.client_email && (
                <div className="p-4 border border-[#f5efe6] rounded-lg bg-[#faf8f3]">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-neutral-600" />
                    <span className="text-sm text-neutral-600">Email</span>
                  </div>
                  <a
                    href={`mailto:${appointment.client_email}`}
                    className="text-[#c6a365] hover:text-[#b59555] transition-colors break-all"
                  >
                    {appointment.client_email}
                  </a>
                </div>
              )}

              {appointment.client_phone && (
                <div className="p-4 border border-[#f5efe6] rounded-lg bg-[#faf8f3]">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="w-4 h-4 text-neutral-600" />
                    <span className="text-sm text-neutral-600">Teléfono</span>
                  </div>
                  <a
                    href={`tel:${appointment.client_phone}`}
                    className="text-neutral-900 hover:text-[#c6a365] transition-colors"
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
              <FileText className="w-5 h-5 text-neutral-500" />
              <h3 className="text-lg font-serif font-semibold text-neutral-900">
                Notas del Cliente
              </h3>
            </div>
            <div className="p-4 border border-[#f5efe6] rounded-lg bg-[#faf8f3]">
              <p className="text-neutral-700 whitespace-pre-wrap">
                {appointment.client_notes}
              </p>
            </div>
          </div>
        )}

        {/* Profesional */}
        {appointment.space_owner && (
          <div className="mb-8">
            <h3 className="text-lg font-serif font-semibold text-neutral-900 mb-4">
              Profesional Asignado
            </h3>
            <div className="p-4 border border-[#f5efe6] rounded-lg bg-[#faf8f3]">
              <p className="text-neutral-900 font-medium mb-1">
                {appointment.space_owner.full_name || "Sin nombre"}
              </p>
              <p className="text-neutral-600 text-sm">
                {appointment.space_owner.email}
              </p>
            </div>
          </div>
        )}

        {/* Sección de acciones */}
        {canSeeCancelActions && (
          <div className="mt-8 pt-8 border-t border-[#f5efe6]">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              {/* Botón de cancelar */}
              <Button
                variant={canCancel ? "destructive" : "outline"}
                onClick={() => setShowCancelDialog(true)}
                disabled={!canCancel || checkingCancellation}
                className={`
                  flex items-center gap-2 px-8 py-6 text-lg font-medium
                  ${canCancel ? "!bg-red-600 !hover:bg-red-700 !text-white" : ""}
                  ${!canCancel 
                    ? "opacity-50 cursor-not-allowed border-[#e6dcc9] text-neutral-500" 
                    : ""
                  }
                `}
              >
                <Ban className="w-5 h-5" />
                Cancelar Cita
              </Button>
              
              {/* Mensaje informativo */}
              {cancellationTimeMessage && !checkingCancellation && (
                <div className="max-w-md">
                  <p className={`text-sm ${canCancel ? "text-neutral-600" : "text-[#c62828]"} text-center`}>
                    {cancellationTimeMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Si ya está cancelada, mostrar mensaje en lugar del botón */}
        {appointment.status?.description?.toLowerCase() === "cancelada" && (
          <div className="mt-8 pt-8 border-t border-[#f5efe6]">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-[#fdeaea] border border-[#ffcdd2] rounded-lg p-6 max-w-md">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <XCircle className="w-6 h-6 text-[#c62828]" />
                  <span className="font-serif font-medium text-[#c62828] text-lg">
                    Cita Cancelada
                  </span>
                </div>
                <p className="text-[#c62828]/80 text-sm">
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
      />
    </div>
  );
}