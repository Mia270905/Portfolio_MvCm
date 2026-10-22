"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { getMinReservationTimeMinutes } from "@/lib/actions/configuration.actions";

interface AvailableSlot {
  id: string;
  appointment_datetime: string;
  space_owner: {
    id: string;
    email: string;
    full_name?: string;
  } | null;
}

interface DayAvailability {
  date: Date;
  hasSlots: boolean;
  slotCount: number;
  slots: AvailableSlot[];
}

interface DateStepProps {
  selectedSlot: string | null;
  onSelectSlot: (slotId: string | null) => void;
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  user: any;
  spaceOwnerId?: string;
  onConfigLoaded?: () => void; 
}

const AVAILABLE_STATUS_ID = "517e3cc0-0763-4fd0-9195-756fe4617706";

export default function DateStep({
  selectedSlot,
  onSelectSlot,
  onSelectDate,
  selectedDate,
  user,
  spaceOwnerId,
  onConfigLoaded,
}: DateStepProps) {
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [monthSlots, setMonthSlots] = useState<DayAvailability[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [minReservationMinutes, setMinReservationMinutes] = useState<number>(120);
  const [configLoaded, setConfigLoaded] = useState(false); 
  const initialLoadDone = useRef(false); 
  
  const supabase = createClient();

  // Cargar configuración de tiempo mínimo para reservar
  useEffect(() => {
    const loadMinReservationConfig = async () => {
      try {
        const minutes = await getMinReservationTimeMinutes();
        setMinReservationMinutes(minutes);
        setConfigLoaded(true);
        
        // Notificar al padre que la configuración está lista
        if (onConfigLoaded) {
          onConfigLoaded();
        }
      } catch (error) {
        console.error("Error al cargar configuración de reserva:", error);
        setConfigLoaded(true);
        if (onConfigLoaded) {
          onConfigLoaded();
        }
      }
    };

    loadMinReservationConfig();
  }, [onConfigLoaded]);

  // Función para verificar si una cita puede ser reservada
  const canReserveSlot = (slotDatetime: string): boolean => {
    try {
      const appointmentTime = new Date(slotDatetime);
      const now = new Date();
      const minutesUntilAppointment = (appointmentTime.getTime() - now.getTime()) / (1000 * 60);
      return minutesUntilAppointment >= minReservationMinutes;
    } catch (error) {
      return false;
    }
  };

  // Función para formatear slots recibidos de Supabase
  const formatSlots = (data: any[]): AvailableSlot[] => {
    return data.map((slot: any) => ({
      id: slot.id,
      appointment_datetime: slot.appointment_datetime,
      space_owner: Array.isArray(slot.space_owner)
        ? slot.space_owner[0] || null
        : slot.space_owner || null,
    }));
  };

  // Obtener slots disponibles para el mes actual 
  useEffect(() => {
    if (configLoaded) {
      fetchMonthSlots();
    }
  }, [currentMonth, spaceOwnerId, configLoaded]);

  // Obtener slots para el día seleccionado 
  useEffect(() => {
    if (selectedDate && configLoaded) {
      // Solo ejecutar fetch si no es la carga inicial
      if (!initialLoadDone.current) {
        initialLoadDone.current = true;
      }
      fetchDaySlots(selectedDate);
    }
  }, [selectedDate, spaceOwnerId, configLoaded]);

  const fetchMonthSlots = async () => {
    try {
      setLoading(true);

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      let query = supabase
        .from("appointments")
        .select(
          `
            id,
            appointment_datetime,
            space_owner:space_owner_user_id (id, email, full_name)
          `
        )
        .eq("status_id", AVAILABLE_STATUS_ID)
        .is("client_name", null)
        .is("client_email", null)
        .is("client_phone", null)
        .is("deleted_at", null)
        .gte("appointment_datetime", monthStart.toISOString())
        .lte("appointment_datetime", monthEnd.toISOString())
        .order("appointment_datetime", { ascending: true });

      if (spaceOwnerId) {
        query = query.eq("space_owner_user_id", spaceOwnerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const allSlots = formatSlots(data || []);
      const reservableSlots = allSlots.filter(slot => canReserveSlot(slot.appointment_datetime));

      const slotsByDay: Record<string, DayAvailability> = {};
      const daysInMonth = eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
      });

      daysInMonth.forEach((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        slotsByDay[dateStr] = {
          date: day,
          hasSlots: false,
          slotCount: 0,
          slots: [],
        };
      });

      reservableSlots.forEach((slot) => {
        const slotDate = new Date(slot.appointment_datetime);
        const dateStr = format(slotDate, "yyyy-MM-dd");

        if (!slotsByDay[dateStr]) {
          slotsByDay[dateStr] = {
            date: slotDate,
            hasSlots: false,
            slotCount: 0,
            slots: [],
          };
        }

        slotsByDay[dateStr].slots.push(slot);
        slotsByDay[dateStr].slotCount++;
        slotsByDay[dateStr].hasSlots = true;
      });

      const monthAvailability = Object.values(slotsByDay).sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

      setMonthSlots(monthAvailability);
    } catch (error) {
      console.error("Error al obtener horarios del mes:", error);
      toast.error("Error al cargar los horarios del mes");
    } finally {
      setLoading(false);
    }
  };

  const fetchDaySlots = async (date: Date) => {
    try {
      setLoadingSlots(true);

      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      let query = supabase
        .from("appointments")
        .select(
          `
            id,
            appointment_datetime,
            space_owner:space_owner_user_id (id, email, full_name)
          `
        )
        .eq("status_id", AVAILABLE_STATUS_ID)
        .is("client_name", null)
        .is("client_email", null)
        .is("client_phone", null)
        .is("deleted_at", null)
        .gte("appointment_datetime", startDate.toISOString())
        .lte("appointment_datetime", endDate.toISOString())
        .order("appointment_datetime", { ascending: true });

      if (spaceOwnerId) {
        query = query.eq("space_owner_user_id", spaceOwnerId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const allSlots = formatSlots(data || []);
      const reservableSlots = allSlots.filter(slot => canReserveSlot(slot.appointment_datetime));
      
      setAvailableSlots(reservableSlots);
      
      // Solo resetear el slot seleccionado si estamos cambiando de día
      if (selectedSlot) {
        const currentSlot = reservableSlots.find(s => s.id === selectedSlot);
        if (!currentSlot) {
          onSelectSlot(null);
        }
      }
    } catch (error) {
      console.error("Error al obtener horarios del día:", error);
      toast.error("Error al cargar los horarios del día");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onSelectDate(today);
  };


  // Agrupar slots por hora solo para el día seleccionado
  const groupedSlots = availableSlots.reduce((acc, slot) => {
    const time = format(new Date(slot.appointment_datetime), "hh:mm a", { locale: es });
    if (!acc[time]) {
      acc[time] = [];
    }
    acc[time].push(slot);
    return acc;
  }, {} as Record<string, AvailableSlot[]>);

  // Obtener horarios únicos disponibles, ordenados por tiempo real (no alfabéticamente)
  const availableTimes = Object.keys(groupedSlots).sort((a, b) => {
    // Obtener la fecha completa del primer slot de cada grupo para comparar correctamente
    const dateA = new Date(groupedSlots[a][0].appointment_datetime);
    const dateB = new Date(groupedSlots[b][0].appointment_datetime);
    return dateA.getTime() - dateB.getTime();
  });

  const formatDateDisplay = (date: Date) => {
    if (isToday(date)) {
      return "Hoy";
    }
    return format(date, "EEEE d 'de' MMMM", { locale: es });
  };

  // Generar calendario mensual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  return (
    <div className="space-y-6">
      {/* Mostrar loading mientras se carga la configuración */}
      {!configLoaded && (
        <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c6a365]"></div>
            <span className="ml-3 text-neutral-700">Cargando configuración...</span>
          </div>
        </div>
      )}

      {configLoaded && (
        <>
          {/* Calendario mensual */}
          <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-semibold text-neutral-900 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-[#c6a365]" />
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={handlePreviousMonth}
                  variant="outline"
                  size="sm"
                  className="border-[#e6dcc9] text-neutral-700 hover:bg-[#f5efe6]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleToday}
                  variant="outline"
                  size="sm"
                  className="border-[#c6a365] text-[#c6a365] hover:bg-[#f5efe6]"
                >
                  Hoy
                </Button>
                <Button
                  onClick={handleNextMonth}
                  variant="outline"
                  size="sm"
                  className="border-[#e6dcc9] text-neutral-700 hover:bg-[#f5efe6]"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-neutral-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date) => {
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isTodayDate = isToday(date);
                const isDisabled = isPast(date) && !isTodayDate;

                const dayAvailability = monthSlots.find((day) =>
                  isSameDay(day.date, date)
                );

                const hasSlots = dayAvailability?.hasSlots || false;
                const slotCount = dayAvailability?.slotCount || 0;

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => !isDisabled && hasSlots && onSelectDate(date)}
                    disabled={isDisabled || !hasSlots}
                    className={`
                      h-16 rounded-lg flex flex-col items-center justify-center transition-all relative
                      ${!isCurrentMonth ? "opacity-30" : ""}
                      ${
                        isSelected
                          ? "bg-[#c6a365] text-white shadow-lg shadow-[#c6a365]/25"
                          : hasSlots
                          ? "bg-[#faf8f3] hover:bg-[#f5efe6] text-neutral-700 cursor-pointer hover:scale-105"
                          : "bg-white/50 text-neutral-400 cursor-not-allowed"
                      }
                      ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <span
                      className={`text-lg font-semibold ${
                        isSelected ? "text-white" : 
                        isTodayDate ? "text-[#c6a365]" : ""
                      }`}
                    >
                      {format(date, "d")}
                    </span>

                    {hasSlots && !isSelected && (
                      <div className="mt-1">
                        <div className="w-2 h-2 rounded-full bg-[#1565c0]"></div>
                      </div>
                    )}

                    {isTodayDate && !isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 bg-[#c6a365] rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#1565c0]"></div>
                <span className="text-neutral-600">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#c6a365]"></div>
                <span className="text-neutral-600">Dia de hoy</span>
              </div>
            </div>
          </div>

          {/* Horarios disponibles del día seleccionado */}
          <div className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-semibold text-neutral-900 flex items-center gap-2">
                <Clock className="w-6 h-6 text-[#c6a365]" />
                {selectedDate ? (
                  <>
                    Horarios para {formatDateDisplay(selectedDate)}
                    {spaceOwnerId && availableSlots.length > 0 && (
                      <span className="ml-2 px-2 py-1 bg-[#e8f4fd] text-[#1565c0] text-xs font-medium rounded-full">
                        {availableSlots[0]?.space_owner?.full_name || "Profesional específico"}
                      </span>
                    )}
                    {isToday(selectedDate) && (
                      <span className="ml-2 px-2 py-1 bg-[#f5efe6] text-[#c6a365] text-xs font-medium rounded-full">
                        Hoy
                      </span>
                    )}
                  </>
                ) : (
                  "Selecciona una fecha"
                )}
              </h2>
              {availableTimes.length > 0 && (
                <span className="px-3 py-1 bg-[#e8f5e8] text-[#2e7d32] text-sm font-medium rounded-full">
                  {availableTimes.length} horarios disponibles
                </span>
              )}
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-[#faf8f3] rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : availableTimes.length === 0 ? (
              <div className="text-center py-12">
                {selectedDate ? (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#faf8f3] flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-serif font-medium text-neutral-900 mb-2">
                      No hay horarios disponibles
                    </h3>
                    <p className="text-neutral-600 mb-6">
                      {spaceOwnerId 
                        ? `${availableSlots[0]?.space_owner?.full_name || "Este profesional"} no tiene citas disponibles para ${formatDateDisplay(selectedDate)}.`
                        : `No hay citas disponibles para ${formatDateDisplay(selectedDate)}.`
                      }
                    </p>
                    <Button
                      onClick={handleToday}
                      variant="outline"
                      className="border-[#c6a365] text-[#c6a365] hover:bg-[#f5efe6]"
                    >
                      Ver horarios de hoy
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#faf8f3] flex items-center justify-center">
                      <CalendarIcon className="w-8 h-8 text-neutral-400" />
                    </div>
                    <h3 className="text-lg font-serif font-medium text-neutral-900 mb-2">
                      Selecciona una fecha
                    </h3>
                    <p className="text-neutral-600">
                      Elige un día del calendario para ver los horarios disponibles
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availableTimes.map((time) => {
                    const slotsAtThisTime = groupedSlots[time];
                    const hasMultipleSlots = !spaceOwnerId && slotsAtThisTime.length > 1;

                    return (
                      <div key={time} className="space-y-2">
                        <button
                          onClick={() => onSelectSlot(slotsAtThisTime[0].id)}
                          className={`
                            w-full h-14 rounded-lg flex flex-col items-center justify-center transition-all border
                            ${
                              selectedSlot &&
                              slotsAtThisTime.some((s) => s.id === selectedSlot)
                                ? "bg-[#c6a365] text-white ring-2 ring-[#c6a365] ring-offset-2 ring-offset-white border-[#c6a365]"
                                : "bg-white hover:bg-[#faf8f3] text-neutral-900 hover:scale-105 border-2 border-[#a9916e]"
                            }
                          `}
                        >
                          <span className="text-lg font-semibold">{time}</span>
                          {hasMultipleSlots && (
                            <span className="text-xs text-[#2e7d32] mt-0.5">
                              {slotsAtThisTime.length} opciones
                            </span>
                          )}
                        </button>

                        {hasMultipleSlots &&
                          selectedSlot &&
                          slotsAtThisTime.some((s) => s.id === selectedSlot) && (
                            <div className="mt-2 space-y-1">
                              <p className="text-xs text-neutral-600 text-center">
                                Selecciona profesional:
                              </p>
                              <div className="flex flex-col gap-1">
                                {slotsAtThisTime.map((slot) => (
                                  <button
                                    key={slot.id}
                                    onClick={() => onSelectSlot(slot.id)}
                                    className={`text-xs px-2 py-1 rounded transition-colors border ${
                                      selectedSlot === slot.id
                                        ? "bg-[#f5efe6] text-[#c6a365] border-[#e6dcc9]"
                                        : "bg-white text-neutral-700 hover:bg-[#faf8f3] border border-[#f5efe6]"
                                    }`}
                                  >
                                    {slot.space_owner?.full_name ||
                                      slot.space_owner?.email ||
                                      "Profesional"}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>

                {selectedSlot && (
                  <div className="mt-6 p-4 bg-[#faf8f3] rounded-lg border border-[#f5efe6]">
                    <h3 className="text-lg font-serif font-semibold text-neutral-900 mb-3">
                      Horario seleccionado
                    </h3>
                    {(() => {
                      const selectedSlotData = availableSlots.find(
                        (s) => s.id === selectedSlot
                      );
                      if (!selectedSlotData) return null;

                      const date = new Date(selectedSlotData.appointment_datetime);
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-neutral-600">Fecha y hora</p>
                              <p className="text-xl font-semibold text-neutral-900">
                                {format(date, "d 'de' MMMM 'de' yyyy", {
                                  locale: es,
                                })}{" "}
                                a las {format(date, "hh:mm a", { locale: es })}
                              </p>
                            </div>
                            <div className="text-[#c6a365]">
                              <CheckCircle className="w-6 h-6" />
                            </div>
                          </div>

                          {selectedSlotData.space_owner && (
                            <div className="pt-3 border-t border-[#f5efe6]">
                              <p className="text-sm text-neutral-600">
                                Profesional asignado
                              </p>
                              <p className="text-neutral-900 font-medium">
                                {selectedSlotData.space_owner.full_name ||
                                  selectedSlotData.space_owner.email}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}