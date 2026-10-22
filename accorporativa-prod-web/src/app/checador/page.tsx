import { HeroHeader } from "@/components/header";
import AttendanceCheckIn from "@/components/attendance/attendance-checkin";
import AttendanceHistoryList from "@/components/attendance/antendance-history-list";
import { createClient } from "@/lib/supabase/server";
import { getLastAttendanceRecord } from "@/lib/actions/attendance.actions";
import { fetchUserProfile } from "@/lib/actions/user.actions";
import { ChecadorClient } from "@/components/attendance/checador-client";

export default async function ChecadorPage() {
  const supabase = await createClient();
  
  // Obtener datos del usuario en el servidor
  const { user, profile } = await fetchUserProfile();
  
  let lastRecord = null;
  if (user?.id) {
    lastRecord = await getLastAttendanceRecord(user.id);
  }

  const initialData = {
    user: profile ? {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      avatarUrl: user?.user_metadata?.avatar_url
    } : null,
    lastRecord
  };

  return (
    <>
      <HeroHeader />

      <main className="pt-8 relative min-h-screen bg-[#0c0a09] text-gray-200">
        <section className="relative z-10 mx-auto max-w-4xl px-6 py-24">
          
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-medium text-white">
              Sistema de Checador
            </h1>
            <p className="mt-4 text-sm text-gray-400">
              Registra y consulta las entradas y salidas del personal
            </p>
          </header>

          {/* Componente cliente que maneja la lógica de recarga */}
          <ChecadorClient initialData={initialData} />

        </section>
      </main>
    </>
  );
}