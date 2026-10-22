"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAvailableAppointment } from "@/lib/actions/appointment.actions";
import { AppointmentForm } from "@/components/dashboard/citas/appointment-form";
import type { AppointmentFormValues } from "@/components/dashboard/citas/appointment-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function CreateAppointmentPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleCheckAvailability(
    datetimes: string[]
  ): Promise<string[]> {
    try {
      const supabase = createClient();
      
      if (datetimes.length === 0) return [];
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Extraer el rango de fechas para buscar eficientemente
      const dates = datetimes.map(dt => dt.split('T')[0]);
      const uniqueDates = [...new Set(dates)];
      
      // Buscar todas las citas en esos días del usuario autenticado
      const allAppointments = [];
      for (const date of uniqueDates) {
        const startOfDay = `${date}T00:00:00`;
        const endOfDay = `${date}T23:59:59`;
        
        const { data, error } = await supabase
          .from("appointments")
          .select("appointment_datetime")
          .gte("appointment_datetime", startOfDay)
          .lte("appointment_datetime", endOfDay)
          .is("deleted_at", null)
          .eq("space_owner_user_id", user.id);
        
        if (error) {
          console.error("Error verificando disponibilidad:", error);
          continue;
        }
        
        if (data) {
          allAppointments.push(...data);
        }
      }

      // Comparar cada datetime que queremos agregar con los existentes
      const occupiedDatetimes: string[] = [];
      
      for (const datetime of datetimes) {
        const isOccupied = allAppointments.some(apt => {
          // Normalizar ambos datetimes para comparar (sin zona horaria)
          const dbDatetime = apt.appointment_datetime.split('+')[0].split('Z')[0];
          return dbDatetime === datetime;
        });
        
        if (isOccupied) {
          occupiedDatetimes.push(datetime);
        }
      }

      return occupiedDatetimes;
    } catch (error) {
      console.error("Error en handleCheckAvailability:", error);
      return [];
    }
  }

  async function handleCreate(
    values: AppointmentFormValues,
    availableSlots: Array<{ datetime: string; display: string; available: boolean }>
  ) {
    setLoading(true);
    setServerError(null);

    if (availableSlots.length === 0) {
      toast.error("No hay espacios disponibles para crear");
      setLoading(false);
      return;
    }

    const appointment_datetimes = availableSlots.map(slot => slot.datetime);

    const result = await createAvailableAppointment({
      appointment_datetimes,
      notes: values.notes || undefined,
    });

    setLoading(false);

    if (!result.success) {
      toast.error(result.message ?? "No se pudieron crear los espacios");
      setServerError(result.message ?? "Error inesperado");
      return;
    }

    toast.success(result.message || "Espacios creados correctamente");
    router.push("/dashboard/citas/gestion");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/dashboard/citas/gestion"
        className="inline-flex items-center text-custom-text-tertiary hover:text-custom-accent-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
      </Link>

      <h1 className="text-2xl font-bold text-custom-text-primary">
        Crear espacios disponibles
      </h1>

      <AppointmentForm
        onSubmit={handleCreate}
        onCheckAvailability={handleCheckAvailability}
        loading={loading}
        serverError={serverError}
      />
    </div>
  );
}