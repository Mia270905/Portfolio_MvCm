"use client";

import { useState } from "react";
import type { AttendanceTransaction } from "@/lib/actions/attendance.actions";
import { LogIn, LogOut, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AttendanceHistoryItemProps {
  transaction: AttendanceTransaction;
}

export default function AttendanceHistoryItem({
  transaction,
}: AttendanceHistoryItemProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  const getUserName = () => {
    if (transaction.user) {
      return transaction.user.full_name || 
             transaction.user.email?.split('@')[0] || 
             "Usuario";
    }
    return "Usuario";
  };

  const getUserAvatar = () => {
    // La foto del usuario está en auth.user_metadata.avatar_url
    // pero solo tenemos acceso a ella desde el componente principal
    // Aquí podemos mostrar las iniciales
    return null;
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name.charAt(0).toUpperCase();
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "PP", { locale: es });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "p", { locale: es });
    } catch (error) {
      return "";
    }
  };

  const getEventTypeLabel = () => {
    return transaction.event_type === "check-in" ? "Entrada" : "Salida";
  };

  const getEventTypeColor = () => {
    return transaction.event_type === "check-in" 
      ? "bg-green-900/30 text-green-300 border-green-700" 
      : "bg-red-900/30 text-red-300 border-red-700";
  };

  const getEventTypeIcon = () => {
    return transaction.event_type === "check-in" ? LogIn : LogOut;
  };

  const EventIcon = getEventTypeIcon();

  return (
    <div className="group">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-all duration-300">
        <div className="p-5">
          {/* Encabezado con fecha y tipo de evento */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center border ${getEventTypeColor()} group-hover:border-yellow-400/20 transition-colors`}>
                <EventIcon className="w-5 h-5 mb-1" />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  {transaction.ocurred_at && (
                    <>
                      <div className="text-white font-semibold">
                        {formatDateTime(transaction.ocurred_at)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatTime(transaction.ocurred_at)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor()}`}>
                {getEventTypeLabel()}
              </span>
            </div>
          </div>

          {/* Información del usuario */}
          <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-yellow-500 text-gray-900 font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-medium text-white truncate">
                  {getUserName()}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {transaction.user?.email || "Sin email"}
                </p>
              </div>
            </div>
          </div>

          {/* Motivo */}
          {transaction.reason && (
            <div className="mb-4 p-3 bg-gray-900/30 rounded-lg border border-gray-800">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xs text-blue-300">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-300 mb-1">
                    Motivo
                  </div>
                  <p className="text-sm text-gray-400">
                    {transaction.reason.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}