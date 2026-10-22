"use client";

import type { AttendanceTransaction } from "@/lib/actions/attendance.actions";
import { ArrowRight, ArrowLeft, Info } from "lucide-react";

interface AttendanceHistoryItemProps {
  transaction: AttendanceTransaction;
  formatTimeFn?: (dateString: string) => string;
}

const reasonTranslations: Record<string, string> = {
  meal: "Comida",
  work_schedule: "Por horario laboral",
  permission: "Permiso",
};

// Función por defecto para formatear hora en AM/PM
const defaultFormatTime = (dateString: string) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 se convierte en 12
  
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function AttendanceHistoryItem({
  transaction,
  formatTimeFn = defaultFormatTime,
}: AttendanceHistoryItemProps) {
  const getUserName = () => {
    if (transaction.user) {
      return transaction.user.full_name || 
             transaction.user.email?.split('@')[0] || 
             "Usuario";
    }
    return "Usuario";
  };

  const getEventTypeLabel = () => {
    return transaction.event_type === "check-in" ? "Entrada" : "Salida";
  };

  const isCheckIn = transaction.event_type === "check-in";

  const getReasonText = () => {
    if (!transaction.reason) return null;
    const name = transaction.reason.name?.toLowerCase();
    return reasonTranslations[name] || transaction.reason.description || transaction.reason.name;
  };

  return (
    <div className="bg-custom-bg-secondary/50 rounded-xl p-4 border border-custom-border-secondary">
      <div className="flex items-start gap-3">
        {/* Icono de dirección */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isCheckIn 
            ? "bg-green-500/20 text-green-400" 
            : "bg-red-500/20 text-red-400"
        }`}>
          {isCheckIn ? (
            <ArrowLeft className="w-5 h-5" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          {/* Nombre del usuario */}
          <h3 className="text-custom-text-primary font-semibold text-base truncate">
            {getUserName()}
          </h3>
          
          {/* Hora y tipo */}
          <div className="flex items-center gap-2 text-sm text-custom-text-tertiary mt-0.5">
            <span>{transaction.ocurred_at ? formatTimeFn(transaction.ocurred_at) : "--:--"}</span>
            <span className="text-custom-text-muted">•</span>
            <span>{getEventTypeLabel()}</span>
          </div>

          {/* Motivo si existe */}
          {transaction.reason && (
            <div className="flex items-center gap-1.5 mt-2 text-custom-text-tertiary">
              <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Info className="w-2.5 h-2.5 text-amber-400" />
              </div>
              <span className="text-xs">{getReasonText()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}