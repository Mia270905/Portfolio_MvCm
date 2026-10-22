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
    <div className="min-h-screen bg-[#faf8f3]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="mb-6 p-4 lg:p-6">
          <Link
            href="/dashboard/citas/gestion"
            className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900">
            Crear Espacios Disponibles
          </h1>
          <p className="text-neutral-600 mt-2">
            Agrega múltiples horarios para que los clientes puedan reservar citas en un mismo día
          </p>
        </div>

        <AppointmentForm
          onSubmit={handleCreate}
          onCheckAvailability={handleCheckAvailability}
          loading={loading}
          serverError={serverError}
        />
      </div>
    </div>
  );
}