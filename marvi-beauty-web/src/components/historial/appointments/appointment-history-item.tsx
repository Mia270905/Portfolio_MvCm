"use client";

import { useState } from "react";
import type { Appointment } from "@/lib/actions/appointment.actions";
import {
  Calendar,
  MoreVertical,
  Clock,
  User,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  UserCircle,
  CalendarDays,
  Building,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// Mapeo de colores para estados (actualizados con tu paleta)
const statusColors: Record<string, string> = {
  'reservada': "bg-purple-500/10 text-purple-400 border-purple-500/30",
  'confirmada': "bg-green-500/10 text-green-400 border-green-500/30",
  'cancelada': "bg-red-500/10 text-red-400 border-red-500/30",
  'finalizada': "bg-blue-500/10 text-blue-400 border-blue-500/30",
  'perdida': "bg-gray-500/10 text-gray-400 border-gray-500/30",
  'pendiente': "bg-custom-accent-primary/10 text-custom-accent-primary border-custom-accent-primary/30",
  'disponible': "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

interface AppointmentHistoryItemProps {
  appointment: Appointment;
}

export default function AppointmentHistoryItem({
  appointment,
}: AppointmentHistoryItemProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/appointments/history/${appointment.id}`);
    setPopoverOpen(false);
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

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { 
        locale: es, 
        addSuffix: true 
      });
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
          className="bg-red-500/10 text-red-400 border-red-500/30 px-3 py-1"
        >
          Cancelada
        </Badge>
      );
    }

    // 2. Intentar obtener la descripción en español desde el objeto status
    let statusText = "Pendiente";
    let normalizedStatus = "pendiente";

    if (appointment.status) {
      if (typeof appointment.status === 'object') {
        statusText = appointment.status.description || 
                     appointment.status.name || 
                     "Pendiente";
        
        normalizedStatus = statusText
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      } else if (typeof appointment.status === 'string') {
        statusText = appointment.status;
        normalizedStatus = statusText.toLowerCase();
      }
    }

    // 3. Buscar el color correspondiente
    const colorClass = statusColors[normalizedStatus] || "bg-custom-bg-tertiary text-custom-text-secondary border-custom-border-primary";

    return (
      <Badge
        variant="outline"
        className={cn("px-3 py-1 font-medium", colorClass)}
      >
        {statusText}
      </Badge>
    );
  };

  const appointmentDate = appointment.appointment_datetime 
    ? new Date(appointment.appointment_datetime)
    : null;

  const isUpcoming = appointmentDate && appointmentDate > new Date();
  const isPast = appointmentDate && appointmentDate <= new Date();

  const status = appointment.status?.description;
  const isCancelled = status === 'Cancelada';
  const isLost = status === 'Perdida';
  const isFinished = status === 'Finalizada';

  const showUpcoming = isUpcoming && !isCancelled && !isLost && !isFinished;

  const showCompleted = isFinished || (isPast && !isCancelled && !isLost);


  return (
    <div className="group">
      <div className={cn(
        "bg-custom-bg-secondary border rounded-lg transition-all cursor-pointer overflow-hidden",
        isUpcoming 
          ? "border-custom-accent-primary/20 hover:border-custom-accent-primary/40 hover:shadow-lg hover:shadow-custom-accent-primary/5" 
          : isPast
          ? "border-custom-border-primary hover:border-custom-border-secondary hover:shadow-lg hover:shadow-info-bg/5"
          : "border-custom-border-primary hover:border-custom-border-secondary"
      )}>
        <div className="p-5">
          {/* Encabezado con fecha y estado */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-custom-bg-tertiary to-custom-bg-secondary flex flex-col items-center justify-center border border-custom-border-primary group-hover:border-custom-accent-primary/20 transition-colors">
                <Calendar className="w-5 h-5 text-custom-accent-primary mb-1" />
                {appointmentDate && (
                  <div className="text-sm font-bold text-custom-text-primary">
                    {format(appointmentDate, "dd")}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  {appointmentDate && (
                    <>
                      <div className="text-custom-text-primary font-semibold">
                        {formatDateTime(appointment.appointment_datetime)}
                      </div>
                      <div className="text-sm text-custom-text-muted">
                        {formatTime(appointment.appointment_datetime)}
                      </div>
                    </>
                  )}
                  {!appointmentDate && (
                    <div className="text-custom-text-muted italic">
                      Sin fecha programada
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-custom-text-muted" />
                  <span className="text-xs text-custom-text-muted">
                    {formatRelativeTime(appointment.appointment_datetime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge()}
              
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="p-2 hover:bg-custom-accent-primary/10 rounded-lg transition-colors border border-custom-border-primary">
                    <MoreVertical size={18} className="text-custom-text-muted" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 p-2 bg-custom-bg-tertiary border border-custom-border-primary rounded-lg shadow-xl"
                  align="end"
                >
                  <div className="space-y-1">
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-custom-text-secondary hover:bg-custom-accent-primary/10 hover:text-custom-accent-primary rounded-md transition-colors"
                      onClick={handleViewDetails}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Ver detalles
                    </button>
                    
                    {appointment.space_owner && (
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-custom-text-secondary hover:bg-info-bg hover:text-info-text rounded-md transition-colors"
                        onClick={() => {
                          if (appointment.space_owner?.id) {
                            router.push(`/dashboard/profesionales/${appointment.space_owner.id}`);
                            setPopoverOpen(false);
                          }
                        }}
                      >
                        <Building className="w-4 h-4" />
                        Ver profesional
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Información del espacio/profesional */}
          {appointment.space_owner && (
            <div className="mb-4 p-3 bg-custom-bg-tertiary/50 rounded-lg border border-custom-border-primary">
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-4 h-4 text-custom-accent-primary" />
                <span className="text-sm font-medium text-custom-text-primary">
                  {appointment.space_owner.user_metadata?.name || 
                   appointment.space_owner.full_name || 
                   "Profesional"}
                </span>
              </div>
              
            </div>
          )}

          {/* Notas expandibles */}
          {appointment.notes && (
            <div className={cn(
              "mb-4 p-3 rounded-lg border transition-all",
              showFullNotes 
                ? "bg-custom-bg-tertiary/30 border-custom-border-secondary" 
                : "bg-custom-bg-tertiary/20 border-custom-border-primary"
            )}>
              <div className="flex items-start gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-custom-text-muted mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-custom-text-secondary mb-1">
                    Notas de la cita
                  </div>
                  <p className={cn(
                    "text-sm text-custom-text-secondary transition-all",
                    showFullNotes ? "" : "line-clamp-2"
                  )}>
                    {appointment.notes}
                  </p>
                  {appointment.notes.length > 100 && (
                    <button
                      onClick={() => setShowFullNotes(!showFullNotes)}
                      className="mt-2 text-xs text-custom-accent-primary hover:text-custom-accent-secondary transition-colors"
                    >
                      {showFullNotes ? "Ver menos" : "Ver más"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información del usuario que reservó */}
          {appointment.booked_by && (
            <div className="flex items-center gap-2 text-sm text-custom-text-muted mb-3">
              <UserCircle className="w-4 h-4" />
              <span>Reservado por: </span>
              <span className="text-custom-text-secondary">
                {appointment.booked_by.user_metadata?.name || 
                 appointment.booked_by.full_name || 
                 "Tú"}
              </span>
            </div>
          )}

          {/* Fechas de creación y cancelación */}
          <div className="pt-3 border-t border-custom-border-primary">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-custom-text-muted">
                <Calendar className="w-3 h-3" />
                <span>Creada:</span>
                <span className="text-custom-text-secondary">
                  {formatDateTime(appointment.created_at)}
                </span>
              </div>
              
              {appointment.updated_at && appointment.updated_at !== appointment.created_at && (
                <div className="flex items-center gap-2 text-custom-text-muted">
                  <Calendar className="w-3 h-3" />
                  <span>Actualizada:</span>
                  <span className="text-custom-text-secondary">
                    {formatDateTime(appointment.updated_at)}
                  </span>
                </div>
              )}
              
              {appointment.cancelled_at && (
                <div className="flex items-center gap-2 text-destructive">
                  <Calendar className="w-3 h-3" />
                  <span>Cancelada:</span>
                  <span>{formatDateTime(appointment.cancelled_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Indicador de estado */}
          {/* Próxima cita */}
          {showUpcoming && (
            <div className="mt-4 pt-3 border-t border-custom-accent-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-custom-accent-primary animate-pulse" />
                  <span className="text-xs text-custom-accent-primary font-medium">
                    Próxima cita
                  </span>
                </div>
                <span className="text-xs text-custom-text-muted">
                  Te esperamos {formatRelativeTime(appointment.appointment_datetime)}
                </span>
              </div>
            </div>
          )}

          {/* Cita completada */}
          {showCompleted && (
            <div className="mt-4 pt-3 border-t border-info-bg/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-info-text" />
                <span className="text-xs text-info-text font-medium">
                  Cita completada
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}