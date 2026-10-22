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
  'reservada': "bg-purple-900/30 text-purple-300 border-purple-700",
  'confirmada': "bg-green-900/30 text-green-300 border-green-700",
  'cancelada': "bg-red-900/30 text-red-300 border-red-700",
  'finalizada': "bg-blue-900/30 text-blue-300 border-blue-700",
  'perdida': "bg-gray-900/30 text-gray-300 border-gray-700",
  'pendiente': "bg-yellow-900/30 text-yellow-300 border-yellow-700",
  'disponible': "bg-emerald-900/30 text-emerald-300 border-emerald-700",
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
          className="bg-red-900/30 text-red-300 border-red-700 px-3 py-1"
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
    const colorClass = statusColors[normalizedStatus] || "bg-gray-900/30 text-gray-300 border-gray-700";

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
        "bg-[#0A0F17] border rounded-lg transition-all cursor-pointer overflow-hidden",
        isUpcoming 
          ? "border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-400/5" 
          : isPast
          ? "border-gray-800 hover:border-gray-700 hover:shadow-lg hover:shadow-blue-400/5"
          : "border-gray-800 hover:border-gray-700"
      )}>
        <div className="p-5">
          {/* Encabezado con fecha y estado */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center border border-gray-800 group-hover:border-yellow-400/20 transition-colors">
                <Calendar className="w-5 h-5 text-yellow-400 mb-1" />
                {appointmentDate && (
                  <div className="text-sm font-bold text-white">
                    {format(appointmentDate, "dd")}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  {appointmentDate && (
                    <>
                      <div className="text-white font-semibold">
                        {formatDateTime(appointment.appointment_datetime)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatTime(appointment.appointment_datetime)}
                      </div>
                    </>
                  )}
                  {!appointmentDate && (
                    <div className="text-gray-400 italic">
                      Sin fecha programada
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span className="text-xs text-gray-400">
                    {formatRelativeTime(appointment.appointment_datetime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge()}
              
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="p-2 hover:bg-yellow-400/10 rounded-lg transition-colors border border-gray-800">
                    <MoreVertical size={18} className="text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-48 p-2 bg-[#0A0F17] border border-gray-800 rounded-lg shadow-xl"
                  align="end"
                >
                  <div className="space-y-1">
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-400 rounded-md transition-colors"
                      onClick={handleViewDetails}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Ver detalles
                    </button>
                    
                    {appointment.space_owner && (
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-purple-400/10 hover:text-purple-400 rounded-md transition-colors"
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
            <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="flex items-center gap-3 mb-2">
                <Building className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-white">
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
                ? "bg-gray-900/30 border-gray-700" 
                : "bg-gray-900/20 border-gray-800"
            )}>
              <div className="flex items-start gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-300 mb-1">
                    Notas de la cita
                  </div>
                  <p className={cn(
                    "text-sm text-gray-400 transition-all",
                    showFullNotes ? "" : "line-clamp-2"
                  )}>
                    {appointment.notes}
                  </p>
                  {appointment.notes.length > 100 && (
                    <button
                      onClick={() => setShowFullNotes(!showFullNotes)}
                      className="mt-2 text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
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
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <UserCircle className="w-4 h-4" />
              <span>Reservado por: </span>
              <span className="text-gray-300">
                {appointment.booked_by.user_metadata?.name || 
                 appointment.booked_by.full_name || 
                 "Tú"}
              </span>
            </div>
          )}

          {/* Fechas de creación y cancelación */}
          <div className="pt-3 border-t border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar className="w-3 h-3" />
                <span>Creada:</span>
                <span className="text-gray-300">
                  {formatDateTime(appointment.created_at)}
                </span>
              </div>
              
              {appointment.updated_at && appointment.updated_at !== appointment.created_at && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-3 h-3" />
                  <span>Actualizada:</span>
                  <span className="text-gray-300">
                    {formatDateTime(appointment.updated_at)}
                  </span>
                </div>
              )}
              
              {appointment.cancelled_at && (
                <div className="flex items-center gap-2 text-red-400">
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
            <div className="mt-4 pt-3 border-t border-yellow-400/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-xs text-yellow-400 font-medium">
                    Próxima cita
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  Te esperamos {formatRelativeTime(appointment.appointment_datetime)}
                </span>
              </div>
            </div>
          )}

          {/* Cita completada */}
          {showCompleted && (
            <div className="mt-4 pt-3 border-t border-blue-400/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-blue-400 font-medium">
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