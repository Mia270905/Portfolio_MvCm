"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // Opcional: para iconos más limpios

interface Props {
  appointments: any[];
  selectedDate?: Date | null;
  onSelectDate?: (date: Date) => void;
  onAppointmentClick?: (appointment: any) => void;
}

export function AppointmentMonthGrid({
  appointments,
  selectedDate,
  onSelectDate,
  onAppointmentClick
}: Props) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, any[]> = {};
    appointments.forEach((apt) => {
      const key = new Date(apt.appointment_datetime).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    return map;
  }, [appointments]);

  const calendarDays = useMemo(() => {
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [year, month, daysInMonth, firstDayOfMonth]);

  return (
    <div className="w-full rounded-xl border border-[#1e293b] overflow-hidden bg-[#0f172a] shadow-2xl text-slate-200">
      
      {/* HEADER: Siguiendo el estilo de la imagen */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#1e293b]/30 border-b border-[#1e293b]">
        <h2 className="text-lg font-bold text-white tracking-tight">
          {monthNames[month]} <span className="text-[#facc15]">{year}</span>
        </h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] transition-colors border border-[#334155]"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-2 rounded-lg bg-[#1e293b] hover:bg-[#334155] transition-colors border border-[#334155]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* DAYS HEADER: Nombres de los días */}
      <div className="grid grid-cols-7 bg-[#1e293b]/50 border-b border-[#1e293b]">
        {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
          <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
            {day}
          </div>
        ))}
      </div>

      {/* GRID DE DÍAS */}
      <div className="grid grid-cols-7 gap-px bg-[#1e293b]">
        {calendarDays.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} className="min-h-[120px] bg-[#0f172a]/50" />;

          const isToday = date.toDateString() === today.toDateString();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const dayAppointments = appointmentsByDay[date.toDateString()] || [];

          return (
            <div
              key={date.toISOString()}
              onClick={() => onSelectDate?.(new Date(date))}
              className={`min-h-[130px] p-2 flex flex-col gap-1 transition-all cursor-pointer relative group
                ${isSelected ? "bg-[#1e293b]" : "bg-[#0f172a] hover:bg-[#1e293b]/40"}
              `}
            >
              {/* NÚMERO DEL DÍA */}
              <div className="flex justify-between items-start mb-1">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg transition-colors
                  ${isSelected ? "bg-[#facc15] text-[#0f172a]" : 
                    isToday ? "text-[#facc15] border border-[#facc15]/30 bg-[#facc15]/10" : "text-slate-400"}
                `}>
                  {date.getDate()}
                </span>
                {dayAppointments.length > 0 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#facc15] shadow-[0_0_8px_#facc15]" />
                )}
              </div>

              {/* LISTA DE CITAS */}
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[85px] custom-scrollbar">
                {dayAppointments.slice(0, 3).map((apt) => {
                  const status = apt.status || "default";
                  
                  // Colores basados en la imagen (tonos joya oscuros)
                  const statusStyles: Record<string, string> = {
                    confirmed: "bg-emerald-500/10 border-emerald-500 text-emerald-400",
                    pending: "bg-amber-500/10 border-amber-500 text-amber-400",
                    cancelled: "bg-rose-500/10 border-rose-500 text-rose-400",
                    default: "bg-[#facc15]/10 border-[#facc15] text-[#facc15]",
                  };

                  return (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(apt);
                      }}
                      className={`px-2 py-1 rounded border-l-2 text-[10px] font-medium truncate hover:brightness-125 transition-all ${statusStyles[status]}`}
                    >
                      <span className="opacity-70 mr-1">
                        {new Date(apt.appointment_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {apt.client_name || "Cupo Disponible"}
                    </div>
                  );
                })}
                
                {dayAppointments.length > 3 && (
                  <span className="text-[9px] text-slate-500 font-bold pl-1">
                    + {dayAppointments.length - 3} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}