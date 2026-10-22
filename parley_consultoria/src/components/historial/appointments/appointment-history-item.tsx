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

// Mapeo de colores para estados (en español)
const statusColors: Record<string, string> = {
  'reservada': "bg-[#f5efe6] text-[#c6a365] border-[#e6dcc9]",
  'confirmada': "bg-[#f0f7f0] text-[#2e7d32] border-[#c8e6c9]",
  'cancelada': "bg-[#fdeaea] text-[#c62828] border-[#ffcdd2]",
  'finalizada': "bg-[#e8f4fd] text-[#1565c0] border-[#bbdefb]",
  'perdida': "bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]",
  'pendiente': "bg-[#fff8e1] text-[#f57c00] border-[#ffecb3]",
  'disponible': "bg-[#e8f5e8] text-[#388e3c] border-[#c8e6c9]",
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
      return format(date, "p", { locale: es });
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
          className="bg-[#fdeaea] text-[#c62828] border-[#ffcdd2] px-3 py-1"
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
    const colorClass = statusColors[normalizedStatus] || "bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]";

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
        "bg-white border rounded-lg transition-all cursor-pointer overflow-hidden hover:shadow-md",
        isUpcoming 
          ? "border-[#f8d568]/40 hover:border-[#c6a365] hover:shadow-[#f8d568]/10" 
          : isPast
          ? "border-[#f5efe6] hover:border-[#e6dcc9] hover:shadow-[#c6a365]/10"
          : "border-[#f5efe6] hover:border-[#e6dcc9]"
      )}>
        <div className="p-5">
          {/* Encabezado con fecha y estado */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[#f5efe6] flex flex-col items-center justify-center border border-[#e6dcc9] group-hover:border-[#c6a365] transition-colors">
                <Calendar className="w-5 h-5 text-[#c6a365] mb-1" />
                {appointmentDate && (
                  <div className="text-sm font-bold text-[#333333]">
                    {format(appointmentDate, "dd")}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  {appointmentDate && (
                    <>
                      <div className="text-neutral-900 font-semibold">
                        {formatDateTime(appointment.appointment_datetime)}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {formatTime(appointment.appointment_datetime)}
                      </div>
                    </>
                  )}
                  {!appointmentDate && (
                    <div className="text-neutral-600 italic">
                      Sin fecha programada
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-neutral-500" />
                  <span className="text-xs text-neutral-600">
                    {formatRelativeTime(appointment.appointment_datetime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge()}
              
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="p-2 hover:bg-[#f5efe6] rounded-lg transition-colors border border-[#e6dcc9]">
                    <MoreVertical size={18} className="text-neutral-600" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 p-2 bg-white border border-[#e6dcc9] rounded-lg shadow-lg"
                  align="end"
                >
                  <div className="space-y-1">
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365] rounded-md transition-colors"
                      onClick={handleViewDetails}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Ver detalles
                    </button>
                    
                    {appointment.space_owner && (
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365] rounded-md transition-colors"
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
            <div className="mb-4 p-3 bg-[#faf8f3] rounded-lg border border-[#f5efe6]">
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-4 h-4 text-[#c6a365]" />
                <span className="text-sm font-medium text-neutral-900">
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
                ? "bg-[#faf8f3] border-[#e6dcc9]" 
                : "bg-[#faf8f3] border-[#f5efe6]"
            )}>
              <div className="flex items-start gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-neutral-700 mb-1">
                    Notas de la cita
                  </div>
                  <p className={cn(
                    "text-sm text-neutral-600 transition-all",
                    showFullNotes ? "" : "line-clamp-2"
                  )}>
                    {appointment.notes}
                  </p>
                  {appointment.notes.length > 100 && (
                    <button
                      onClick={() => setShowFullNotes(!showFullNotes)}
                      className="mt-2 text-xs text-[#c6a365] hover:text-[#b59555] transition-colors"
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
            <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
              <UserCircle className="w-4 h-4" />
              <span>Reservado por: </span>
              <span className="text-neutral-900">
                {appointment.booked_by.user_metadata?.name || 
                 appointment.booked_by.full_name || 
                 "Tú"}
              </span>
            </div>
          )}

          {/* Fechas de creación y cancelación */}
          <div className="pt-3 border-t border-[#f5efe6]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-600">
                <Calendar className="w-3 h-3" />
                <span>Creada:</span>
                <span className="text-neutral-900">
                  {formatDateTime(appointment.created_at)}
                </span>
              </div>
              
              {appointment.updated_at && appointment.updated_at !== appointment.created_at && (
                <div className="flex items-center gap-2 text-neutral-600">
                  <Calendar className="w-3 h-3" />
                  <span>Actualizada:</span>
                  <span className="text-neutral-900">
                    {formatDateTime(appointment.updated_at)}
                  </span>
                </div>
              )}
              
              {appointment.cancelled_at && (
                <div className="flex items-center gap-2 text-[#c62828]">
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
            <div className="mt-4 pt-3 border-t border-[#f8d568]/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#c6a365] animate-pulse" />
                  <span className="text-xs text-[#c6a365] font-medium">
                    Próxima cita
                  </span>
                </div>
                <span className="text-xs text-neutral-600">
                  Te esperamos {formatRelativeTime(appointment.appointment_datetime)}
                </span>
              </div>
            </div>
          )}

          {/* Cita completada */}
          {showCompleted && (
            <div className="mt-4 pt-3 border-t border-[#1565c0]/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#1565c0]" />
                <span className="text-xs text-[#1565c0] font-medium">
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