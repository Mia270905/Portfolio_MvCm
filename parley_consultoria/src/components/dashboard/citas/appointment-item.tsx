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
  appointment,
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
        router.refresh();
      }

      return result;
    } catch (error) {
      console.error(
        "💥 AppointmentItem: Error en handleCancelAppointment:",
        error
      );
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
      throw new Error("Función de re habilidar espacio de citas.");
    }

    try {
      const result = await onReenable(appointmentId, notes);

      if (result?.success) {
        router.refresh();
      }

      return result;
    } catch (error) {
      console.error(
        "💥 AppointmentItem: Error en handleReenableAppointment:",
        error
      );
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
          className="bg-[#fdeaea] text-[#c62828] border-[#ffcdd2]"
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
          className="bg-[#f3e5f5] text-[#7b1fa2] border-[#e1bee7]"
        >
          Reservada
        </Badge>
      );
    }

    if (appointment.status_id === STATUS_IDS.CONFIRMADA) {
      return (
        <Badge
          variant="outline"
          className="bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
        >
          Confirmada
        </Badge>
      );
    }

    if (appointment.status_id === STATUS_IDS.DISPONIBLE) {
      return (
        <Badge
          variant="outline"
          className="bg-[#f5efe6] text-[#c6a365] border-[#e6dcc9]"
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

    return (
      <Badge
        variant="outline"
        className="bg-[#f5efe6] text-neutral-600 border-[#e6dcc9] px-2 py-0.5 text-xs"
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
      <div className="bg-white border border-[#f5efe6] rounded-lg hover:shadow-lg hover:shadow-[#c6a365]/10 hover:border-[#c6a365]/40 transition-all cursor-pointer overflow-hidden">
        <div className="p-4 flex gap-4">
          {/* Hora prominente a la izquierda */}
          <div className="flex-shrink-0 w-14 border-r border-[#f5efe6] pr-3 flex items-center justify-center">
            {appointment.appointment_datetime ? (
              <div className="text-center">
                <div className="text-xl font-bold text-neutral-900 leading-none">
                  {timeDisplay.time}
                </div>
                <div className="text-[10px] font-medium text-neutral-500 mt-0.5">
                  {timeDisplay.period}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Clock className="w-5 h-5 text-neutral-400 mx-auto" />
                <div className="text-[10px] text-neutral-500 mt-1">N/A</div>
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
                  "text-sm font-medium truncate",
                  isAvailableSlot ? "text-neutral-500 italic" : "text-neutral-900"
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
                    <Phone className="w-3 h-3 text-neutral-400" />
                    <span className="text-xs text-neutral-600">
                      {appointment.client_phone}
                    </span>
                  </div>
                )}
                {appointment.client_email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-neutral-400" />
                    <span className="text-xs text-neutral-600 truncate max-w-[200px]">
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
                    <User className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-500">Espacio:</span>
                    <span className="text-neutral-700">
                      {appointment.space_owner.full_name || appointment.space_owner.user_metadata?.name}
                    </span>
                  </div>
                )}
                {(appointment.booked_by?.full_name || appointment.booked_by?.user_metadata?.name) && (
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-neutral-400" />
                    <span className="text-neutral-500">Reservo:</span>
                    <span className="text-neutral-700">
                      {appointment.booked_by.full_name || appointment.booked_by.user_metadata?.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Fila 4: Fecha de creacion */}
            {appointment.created_at && (
              <div className="text-[10px] text-neutral-500">
                Creado: {format(new Date(appointment.created_at), "d MMM yyyy", { locale: es })}
              </div>
            )}
          </div>

          {/* Acciones - Mostrar menu si hay alguna accion disponible */}
          {hasActions && (
            <div className="flex-shrink-0 self-start">
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="p-1.5 hover:bg-[#f5efe6] rounded-lg transition-colors border border-[#e6dcc9]">
                    <MoreVertical size={16} className="text-neutral-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 p-2 bg-white border border-[#e6dcc9] rounded-lg shadow-lg"
                  align="end"
                >
                  <div className="space-y-1">
                    {canConfirm && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#2e7d32] hover:bg-[#e8f5e9] hover:text-[#1b5e20] rounded-md transition-colors"
                        onClick={handleOpenConfirmDialog}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Confirmar
                      </button>
                    )}
                    {showCompleteOption && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#1565c0] hover:bg-[#e3f2fd] hover:text-[#0d47a1] rounded-md transition-colors"
                        onClick={handleOpenCompleteDialog}
                      >
                        <Check className="w-4 h-4" />
                        Finalizar
                      </button>
                    )}
                    {showCancelOption && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#c62828] hover:bg-[#fdeaea] hover:text-[#b71c1c] rounded-md transition-colors"
                        onClick={handleOpenCancelDialog}
                      >
                        <XCircle className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}
                    {showReenableSpaceOption && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef6c00] hover:bg-[#fff3e0] hover:text-[#e65100] rounded-md transition-colors"
                        onClick={handleOpenReEnableDialog}
                      >
                        <RotateCcw className="w-4 h-4" />
                        Habilitar espacio
                      </button>
                    )}
                    {showMarkAsLostOption && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#ef6c00] hover:bg-[#fff3e0] hover:text-[#e65100] rounded-md transition-colors"
                        onClick={handleOpenLostDialog}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Marcar perdida
                      </button>
                    )}
                    {canDelete && (
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#c62828] hover:bg-[#fdeaea] hover:text-[#b71c1c] rounded-md transition-colors"
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
          <div className="px-4 pb-3 border-t border-[#f5efe6]">
            <p className="text-xs text-neutral-600 line-clamp-2 pt-2">
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