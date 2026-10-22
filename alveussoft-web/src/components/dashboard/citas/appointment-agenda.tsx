"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { AppointmentAgendaGrid } from "./appointment-agenda-grid";
import { AppointmentMonthGrid } from "./appointment-month-grid";
import AppointmentModal from "./modal-appointment-dialog";

interface Props {
  userPermissions: string[];
  initialAppointments: any[];
  currentUserId: string;
}

export function AppointmentViewContainer({
  userPermissions,
  initialAppointments,
  currentUserId
}: Props) {

  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 🔹 NUEVO ESTADO PARA EL MODAL
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);

  // Obtener creadores únicos
  const uniqueCreators = useMemo(() => {
    if (!initialAppointments) return [];

    const creatorsMap = new Map();

    initialAppointments.forEach((apt) => {
      if (apt.space_owner?.id) {
        creatorsMap.set(apt.space_owner.id, apt.space_owner);
      }
    });

    return Array.from(creatorsMap.values());
  }, [initialAppointments]);

  // Click en día del calendario mensual
  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setViewMode("week");
  }

  useEffect(() => {
    console.log("📅 Citas:", initialAppointments?.length || 0);
    console.log("👥 Creadores:", uniqueCreators.length);
    console.log("👀 Vista:", viewMode);
    console.log("📍 Fecha seleccionada:", selectedDate);
  }, [initialAppointments, uniqueCreators, viewMode, selectedDate]);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between flex-wrap gap-4">

        <div className="flex items-center gap-2 text-custom-accent-primary">
          <CalendarDays className="w-5 h-5" />
          <span className="font-bold uppercase tracking-[0.2em] text-xs">
            Agenda {viewMode === "week" ? "Semanal" : "Mensual"}
          </span>
        </div>

        {/* BOTONES CAMBIO VISTA */}
        <div className="flex gap-2 bg-custom-bg-secondary border border-custom-border-secondary rounded-lg p-1">

          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
              viewMode === "week"
                ? "bg-custom-accent-primary text-black"
                : "text-custom-text-tertiary hover:bg-custom-bg-tertiary"
            }`}
          >
            Semana
          </button>

          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 text-xs font-bold rounded-md transition ${
              viewMode === "month"
                ? "bg-custom-accent-primary text-black"
                : "text-custom-text-tertiary hover:bg-custom-bg-tertiary"
            }`}
          >
            Mes
          </button>

        </div>
      </div>

      {/* CALENDARIO */}
      <div className="min-h-[600px] w-full bg-custom-bg-secondary/30 rounded-2xl border border-custom-border-secondary/50 p-1">

        {viewMode === "week" && (
          <AppointmentAgendaGrid
            userPermissions={userPermissions}
            appointmentsFromDB={initialAppointments}
            currentUserId={currentUserId}
            creators={uniqueCreators}
            selectedDate={selectedDate}

            // 🔹 AQUÍ SE ABRE EL MODAL
            onAppointmentClick={(apt) => setSelectedAppointment(apt)}
          />
        )}

       {viewMode === "month" && (
        <AppointmentMonthGrid
          appointments={initialAppointments}
          onSelectDate={handleSelectDate}

          // 🔹 ABRIR EL MISMO MODAL
          onAppointmentClick={(apt) => setSelectedAppointment(apt)}
        />
      )}

      </div>

      {/* MODAL DE CITA */}
      <AppointmentModal
        selectedAppointment={selectedAppointment}
        setSelectedAppointment={setSelectedAppointment}
      />

      {/* EMPTY STATE */}
      {initialAppointments?.length === 0 && (
        <div className="text-center py-10 bg-custom-bg-tertiary/10 rounded-xl border border-dashed border-custom-border-secondary">
          <p className="text-custom-text-tertiary text-sm">
            No se encontraron citas para los criterios seleccionados.
          </p>
        </div>
      )}

    </div>
  );
}