import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
// 1. Importamos la nueva función especializada
import { getAppointmentsForAgenda } from "@/lib/actions/appointment.actions";
import { AppointmentViewContainer } from "@/components/dashboard/citas/appointment-agenda";

function AppointmentLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-12 bg-custom-bg-secondary rounded-lg w-full" />
      <div className="h-96 bg-custom-bg-secondary rounded-lg w-full" />
    </div>
  );
}

export default async function AgendaPage() {
  const user = await getUserWithPermissions();

  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canReadAppointments = permissions.includes("read:appointments");

  let appointments: any[] = [];

  if (canReadAppointments) {
    // 2. Definimos un rango de fechas amplio para la carga inicial
    // Esto asegura que traigamos las citas de Marzo 2026 que vimos en tu JSON
    const start = "2026-02-01T00:00:00Z"; 
    const end = "2026-03-31T23:59:59Z";

    // 3. Usamos la nueva función con filtros de fecha
    try {
      appointments = await getAppointmentsForAgenda({
        start_date: start,
        end_date: end,
        // Si quieres filtrar solo las del dueño actual, descomenta la siguiente línea:
        // space_owner_user_id: user.id 
      });
    } catch (error) {
    }
  }
  

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/citas"
            className="p-2 bg-custom-bg-secondary hover:bg-custom-accent-primary/10 text-custom-text-tertiary rounded-full border border-custom-border-secondary transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-custom-text-primary">
              Agenda Semanal
            </h1>
            <p className="text-custom-text-tertiary text-sm">
              Organización de citas y disponibilidad
            </p>
          </div>
        </div>

        <Suspense fallback={<AppointmentLoadingSkeleton />}>
          {/* 4. Pasamos las citas ya filtradas al contenedor */}
          <AppointmentViewContainer
            userPermissions={permissions}
            initialAppointments={appointments}
            currentUserId={user.id}
          />
        </Suspense>
      </div>
    </div>
  );
}