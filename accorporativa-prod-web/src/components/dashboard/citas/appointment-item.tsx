"use client";

import { useState } from "react";
import type { Appointment } from "@/lib/actions/appointment.actions";
import {
  Calendar,
  MoreVertical,
  User,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  XCircle,
  Trash2,
  CheckCircle,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ConfirmAppointmentDialog } from "./confirm-appointment-dialog";
import { CancelAppointmentDialog } from "./cancel-appointment-dialog";
import { CompleteAppointmentDialog } from "./complete-appointment-dialog";
import { MarkAsLostAppointmentDialog } from "./lost-appointment-dialog";
import { ReenableSlotDialog } from "./reenable-appointment-dialog";

interface AppointmentItemProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onDelete?: (appointmentId: string) => void;
  onConfirm?: (appointmentId: string) => Promise<any>;
  onCancel?: (appointmentId: string, reason?: string) => Promise<any>;
  onComplete?: (appointmentId: string, notes?: string) => Promise<any>;
  onMarkAsLost?: (appointmentId: string, notes?: string) => Promise<any>;
  onReenable?: (appointmentId: string, notes?: string) => Promise<any>;
  userPermissions?: string[];
}

const statusColors: Record<string, string> = {
  pendiente: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  confirmada: "bg-green-900/40 text-green-300 border-green-800",
  cancelada: "bg-red-900/40 text-red-300 border-red-800",
  finalizada: "bg-blue-900/40 text-blue-300 border-blue-800",
  perdida: "bg-gray-900/40 text-gray-300 border-gray-800",
  reservada: "bg-purple-900/40 text-purple-300 border-purple-800",
  disponible: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
};

// IDs de estados
const STATUS_IDS = {
  DISPONIBLE: "517e3cc0-0763-4fd0-9195-756fe4617706",
  RESERVADA: "aa68683c-9977-4b6d-8c9c-aad1d3f0500f",
  CONFIRMADA: "7cccd43a-1998-41e9-b70a-61a778106338",
  FINALIZADA: "6eb8a4c9-d793-411a-a333-7c9c806c25df",
  PERDIDA: "fcd4937a-6f80-4134-87c2-f990dd910139",
  CANCELADA: "6aa423c3-db95-4633-9e31-a1bb92e16f2c",
} as const;

export default function AppointmentItem({
  appointment: initialAppointment,
  onEdit,
  onDelete,
  onConfirm,
  onCancel,
  onComplete,
  onMarkAsLost,
  onReenable,
  userPermissions = [],
}: AppointmentItemProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [lostDialogOpen, setLostDialogOpen] = useState(false);
  const [reEnableDialogOpen, setReEnableDialogOpen] = useState(false);
  const [appointment, setAppointment] = useState(initialAppointment);
  const router = useRouter();

  const canDelete =
    userPermissions.includes("delete:appointments") &&
    appointment.status_id === STATUS_IDS.DISPONIBLE;

  const canUpdate = userPermissions.includes("update:appointments");

  const isReserved = () => {
    if (appointment.cancelled_at) return false;
    return appointment.status_id === STATUS_IDS.RESERVADA;
  };

  const isConfirmed = () => {
    if (appointment.cancelled_at) return false;
    return appointment.status_id === STATUS_IDS.CONFIRMADA;
  };

  const isCompleted = () => {
    if (appointment.cancelled_at) return false;
    return appointment.status_id === STATUS_IDS.FINALIZADA;
  };

  const isLost = () => {
    if (appointment.cancelled_at) return false;
    return appointment.status_id === STATUS_IDS.PERDIDA;
  };

  const canConfirm = canUpdate && isReserved();

  const canComplete = () => {
    if (appointment.cancelled_at) return false;
    return (
      canUpdate &&
      appointment.status_id === STATUS_IDS.CONFIRMADA &&
      !isCompleted()
    );
  };

  const canCancel = () => {
    if (appointment.cancelled_at) return false;
    const RESERVED_STATUS_ID = "aa68683c-9977-4b6d-8c9c-aad1d3f0500f";
    const CONFIRMED_STATUS_ID = "7cccd43a-1998-41e9-b70a-61a778106338";
    return (
      appointment.status_id === RESERVED_STATUS_ID ||
      appointment.status_id === CONFIRMED_STATUS_ID
    );
  };

  const canMarkAsLost = () => {
    if (appointment.cancelled_at) return false;
    return (
      canUpdate && appointment.status_id === STATUS_IDS.CONFIRMADA && !isLost()
    );
  };

  const canReenableSpace = () => {
    if (!appointment.cancelled_at) return false;
    return canUpdate && appointment.status_id === STATUS_IDS.CANCELADA;
  };

  const showCancelOption = canUpdate && canCancel();
  const showCompleteOption = canComplete();
  const showMarkAsLostOption = canMarkAsLost();
  const showReenableSpaceOption = canReenableSpace();

  const handleOpenCancelDialog = () => {
    setCancelDialogOpen(true);
    setPopoverOpen(false);
  };

  const handleOpenCompleteDialog = () => {
    setCompleteDialogOpen(true);
    setPopoverOpen(false);
  };

  const handleOpenLostDialog = () => {
    setLostDialogOpen(true);
    setPopoverOpen(false);
  };

  const handleOpenReEnableDialog = () => {
    setReEnableDialogOpen(true);
    setPopoverOpen(false);
  };

 const handleCancelAppointment = async (
    appointmentId: string,
    reason?: string
  ) => {
    if (!onCancel) {
      console.error("❌ AppointmentItem: onCancel no está definido!");
      throw new Error("Función de cancelación no disponible");
    }

    try {
      const result = await onCancel(appointmentId, reason);

      if (result?.success) {
        // --- ESTE ES EL CAMBIO REAL ---
        // Usamos setAppointment para que React redibuje el componente AHORA
        setAppointment((prev) => ({
          ...prev,
          status_id: STATUS_IDS.CANCELADA,
          cancelled_at: new Date().toISOString(),
        }));
        
        // El refresh se queda de fondo para sincronizar con la base de datos
        router.refresh(); 
      }

      return result;
    } catch (error) {
      console.error("💥 AppointmentItem: Error:", error);
      throw error;
    }
  };

  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(appointment.id);
    }
    setPopoverOpen(false);
  };

  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
    setPopoverOpen(false);
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    if (!onConfirm) {
      console.error("❌ AppointmentItem: onConfirm no está definido!");
      throw new Error("Función de confirmación no disponible");
    }

    try {
      const result = await onConfirm(appointmentId);

      if (result?.success) {
        router.refresh();
      }

      return result;
    } catch (error) {
      console.error(
        "💥 AppointmentItem: Error en handleConfirmAppointment:",
        error
      );
      throw error;
    }
  };

  const handleMarkAsLostAppointment = async (
    appointmentId: string,
    notes?: string
  ) => {
    if (!onMarkAsLost) {
      throw new Error("Función de marcar como perdida no disponible");
    }

    try {
      const result = await onMarkAsLost(appointmentId, notes);

      if (result?.success) {
        router.refresh();
      }

      return result;
    } catch (error) {
      console.error("💥 AppointmentItem: Error en handleMarkAsLost:", error);
      throw error;
    }
  };

 const handleReenableAppointment = async (
  appointmentId: string,
  notes?: string
) => {
  if (!onReenable) {
    throw new Error("Función de rehabilitar espacio de citas no disponible.");
  }

  try {
    const result = await onReenable(appointmentId, notes);

    if (result?.success) {
      // 1. Cerramos el modal inmediatamente para una respuesta rápida
      setReEnableDialogOpen(false);
      
      // 2. Cerramos el popover de opciones si seguía abierto
      setPopoverOpen(false);

      // 3. Forzamos el refresco de los Server Components. 
      // Como ya pusimos 'revalidatePath' en el servidor, 
      // esto traerá la nueva cita verde al instante.
      router.refresh(); 
    }

    return result;
  } catch (error) {
    console.error("💥 Error en handleReenableAppointment:", error);
    throw error;
  }
};

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "No programada";

    try {
      const date = new Date(dateString);
      return format(date, "PP", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return format(date, "hh:mm a", { locale: es });
    } catch (error) {
      return "";
    }
  };

  const getStatusBadge = () => {
    // 1. Primero verificar si está cancelada por cancelled_at
    if (appointment.cancelled_at) {
      return (
        <Badge
          variant="outline"
          className="bg-red-900/40 text-red-300 border-red-800"
        >
          Cancelada
        </Badge>
      );
    }

    // 2. Verificar por ID primero (más confiable)
    if (appointment.status_id === STATUS_IDS.RESERVADA) {
      return (
        <Badge
          variant="outline"
          className="bg-purple-900/40 text-purple-300 border-purple-800"
        >
          Reservada
        </Badge>
      );
    }

    if (appointment.status_id === STATUS_IDS.CONFIRMADA) {
      return (
        <Badge
          variant="outline"
          className="bg-green-900/40 text-green-300 border-green-800"
        >
          Confirmada
        </Badge>
      );
    }

    if (appointment.status_id === STATUS_IDS.DISPONIBLE) {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-900/40 text-emerald-300 border-emerald-800"
        >
          Disponible
        </Badge>
      );
    }

    // 3. Fallback a la lógica anterior por si acaso
    let statusText = "Pendiente";
    let normalizedStatus = "pendiente";

    if (appointment.status) {
      if (typeof appointment.status === "object") {
        statusText =
          appointment.status.description ||
          appointment.status.name ||
          "Pendiente";

        normalizedStatus = statusText
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      } else if (typeof appointment.status === "string") {
        statusText = appointment.status;
        normalizedStatus = statusText.toLowerCase();
      }
    }

    const colorClass =
      statusColors[normalizedStatus] ||
      "bg-gray-900/40 text-gray-300 border-gray-800";

    return (
      <Badge
        variant="outline"
        className={cn("px-2 py-0.5 text-xs", colorClass)}
      >
        {statusText}
      </Badge>
    );
  };

  // Determinar si es un espacio disponible
  const isAvailableSlot =
    !appointment.client_name &&
    !appointment.client_email &&
    !appointment.client_phone &&
    appointment.status_id === STATUS_IDS.DISPONIBLE;

  const hasActions =
    canConfirm ||
    canDelete ||
    showCancelOption ||
    showCompleteOption ||
    showMarkAsLostOption ||
    showReenableSpaceOption;

  // Formatear hora y período (AM/PM) por separado
  const formatTimeDisplay = (dateString: string | null) => {
    if (!dateString) return { time: "", period: "" };

    try {
      const date = new Date(dateString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const time = `${displayHours}:${minutes.toString().padStart(2, "0")}`;
      return { time, period };
    } catch {
      return { time: "", period: "" };
    }
  };

  const timeDisplay = formatTimeDisplay(appointment.appointment_datetime);

  return (
    <div className="group">
      <div className="bg-custom-bg-secondary border border-custom-border-secondary rounded-lg hover:shadow-lg hover:shadow-custom-accent-primary/5 hover:border-custom-accent-primary/30 transition-all cursor-pointer overflow-hidden">
        <div className="p-4 flex gap-4">
          {/* Hora prominente a la izquierda */}
          <div className="flex-shrink-0 w-14 border-r border-custom-border-secondary pr-3 flex items-center justify-center">
            {appointment.appointment_datetime ? (
              <div className="text-center">
                <div className="text-xl font-bold text-custom-text-primary leading-none">
                  {timeDisplay.time}
                </div>
                <div className="text-[10px] font-medium text-custom-text-tertiary mt-0.5">
                  {timeDisplay.period}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Clock className="w-5 h-5 text-custom-text-muted mx-auto" />
                <div className="text-[10px] text-custom-text-tertiary mt-1">N/A</div>
              </div>
            )}
          </div>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Fila 1: Estado y cliente */}
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <h3
                className={cn(
                  "text-sm font-semibold truncate",
                  isAvailableSlot ? "text-custom-text-tertiary italic" : "text-custom-text-primary"
                )}
              >
                {isAvailableSlot
                  ? "Espacio Disponible"
                  : appointment.client_name || "Cliente sin nombre"}
              </h3>
            </div>

            {/* Fila 2: Informacion de contacto */}
            {!isAvailableSlot && (appointment.client_phone || appointment.client_email) && (
              <div className="flex items-center gap-4 flex-wrap">
                {appointment.client_phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-custom-text-muted" />
                    <span className="text-xs text-custom-text-secondary">
                      {appointment.client_phone}
                    </span>
                  </div>
                )}
                {appointment.client_email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-custom-text-muted" />
                    <span className="text-xs text-custom-text-secondary truncate max-w-[200px]">
                      {appointment.client_email}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Fila 3: Espacio y Reservo */}
            {((appointment.space_owner?.full_name || appointment.space_owner?.user_metadata?.name) ||
              (appointment.booked_by?.full_name || appointment.booked_by?.user_metadata?.name)) && (
              <div className="flex items-center gap-4 flex-wrap text-[11px]">
                {(appointment.space_owner?.full_name || appointment.space_owner?.user_metadata?.name) && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-custom-text-muted" />
                    <span className="text-custom-text-tertiary">Espacio:</span>
                    <span className="text-custom-text-secondary">
                      {appointment.space_owner.full_name || appointment.space_owner.user_metadata?.name}
                    </span>
                  </div>
                )}
                {(appointment.booked_by?.full_name || appointment.booked_by?.user_metadata?.name) && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-custom-text-muted" />
                    <span className="text-custom-text-tertiary">Reservo:</span>
                    <span className="text-custom-text-secondary">
                      {appointment.booked_by.full_name || appointment.booked_by.user_metadata?.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Fila 4: Fecha de creacion */}
            {appointment.created_at && (
              <div className="text-[10px] text-custom-text-muted">
                Creado: {format(new Date(appointment.created_at), "d MMM yyyy", { locale: es })}
              </div>
            )}
          </div>

          {/* Acciones - Mostrar menu si hay alguna accion disponible */}
          {hasActions && (
            <div className="flex-shrink-0 self-start">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="p-1.5 hover:bg-custom-accent-primary/10 rounded-lg transition-colors border border-custom-border-primary">
                    <MoreVertical size={16} className="text-custom-text-tertiary" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 p-2 bg-custom-bg-secondary border border-custom-border-primary rounded-lg shadow-lg"
                  align="end"
                >
                  <div className="space-y-1">
                    {canConfirm && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-green-400/10 hover:text-green-300 rounded-md transition-colors"
                        onClick={handleOpenConfirmDialog}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar
                      </button>
                    )}
                    {showCompleteOption && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-blue-400/10 hover:text-blue-300 rounded-md transition-colors"
                        onClick={handleOpenCompleteDialog}
                      >
                        <Check className="w-4 h-4" />
                        Finalizar
                      </button>
                    )}
                    {showCancelOption && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md transition-colors"
                        onClick={handleOpenCancelDialog}
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                    {showReenableSpaceOption && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-400 hover:bg-orange-400/10 hover:text-orange-300 rounded-md transition-colors"
                        onClick={handleOpenReEnableDialog}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Habilitar espacio
                      </button>
                    )}
                    {showMarkAsLostOption && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-400 hover:bg-orange-400/10 hover:text-orange-300 rounded-md transition-colors"
                        onClick={handleOpenLostDialog}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Marcar perdida
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md transition-colors"
                        onClick={handleDeleteClick}
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Notas (si existen) */}
        {appointment.notes && (
          <div className="px-4 pb-3 border-t border-custom-border-secondary">
            <p className="text-xs text-custom-text-tertiary line-clamp-2 pt-2">
              {appointment.notes}
            </p>
          </div>
        )}
      </div>
      {/* Diálogos */}
          <ConfirmAppointmentDialog
            appointmentId={appointment.id}
            clientName={appointment.client_name || "Cliente sin nombre"}
            appointmentDatetime={appointment.appointment_datetime || ""}
            open={confirmDialogOpen}
            onOpenChange={setConfirmDialogOpen}
            onConfirm={() => handleConfirmAppointment(appointment.id)}
          />

          <CancelAppointmentDialog
            appointmentId={appointment.id}
            clientName={appointment.client_name || "Cliente sin nombre"}
            appointmentDatetime={appointment.appointment_datetime || ""}
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            onCancel={(reason) => handleCancelAppointment(appointment.id, reason)}
          />

          <CompleteAppointmentDialog
            appointmentId={appointment.id}
            clientName={appointment.client_name || "Cliente sin nombre"}
            appointmentDatetime={appointment.appointment_datetime || ""}
            open={completeDialogOpen}
            onOpenChange={setCompleteDialogOpen}
            onComplete={(notes) => 
              onComplete ? onComplete(appointment.id, notes) : Promise.resolve()
            }
          />


          <MarkAsLostAppointmentDialog
            appointmentId={appointment.id}
            clientName={appointment.client_name || "Cliente sin nombre"}
            appointmentDatetime={appointment.appointment_datetime || ""}
            open={lostDialogOpen}
            onOpenChange={setLostDialogOpen}
            onMarkAsLost={(notes) => handleMarkAsLostAppointment(appointment.id, notes)}
          />

          <ReenableSlotDialog
            appointmentId={appointment.id}
            clientName={appointment.client_name || "Cliente sin nombre"}
            appointmentDatetime={appointment.appointment_datetime || ""}
            open={reEnableDialogOpen}
            onOpenChange={setReEnableDialogOpen}
            onReenable={(notes) => handleReenableAppointment(appointment.id, notes)}
          />

    </div>
    
  );
}
