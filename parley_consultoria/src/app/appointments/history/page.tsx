"use client"; // Necesario para usar hooks y estados

import { HeroHeader } from "@/components/header";
import { AppointmentHistoryList } from "@/components/historial/appointments/appointment-history-list";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { areReservationsEnabled } from "@/lib/actions/configuration.actions";

export default function AppointmentHistoryPage() {
  const [reservationsEnabled, setReservationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    const checkConfig = async () => {
      try {
        const enabled = await areReservationsEnabled();
        setReservationsEnabled(enabled);
      } catch (error) {
        console.error("Error al verificar configuración de citas:", error);
      } finally {
        setLoading(false);
      }
    };

    checkConfig();
  }, []);

  return (
    <>
      <HeroHeader />

      <main className="pt-8 relative min-h-screen bg-[#faf8f3] text-neutral-700">
        <section className="relative z-10 mx-auto max-w-4xl px-6 py-24">

          {/* Encabezado */}
          <header className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#c6a365]">
              Historial de citas
            </h1>
            <p className="mt-4 text-sm text-neutral-600">
              Aquí puedes consultar todas las citas que has realizado
            </p>

          {/* Botón Reservar Cita - Solo se muestra si están habilitadas y terminó de cargar */}
            {!loading && reservationsEnabled && (
              <div className="flex justify-end mt-6">
                <Link
                  href="/cliente-cita"
                  className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto"
                >
                  <Calendar size={18} />
                  <span>Reservar Cita</span>
                </Link>
              </div>
          )}
          </header>

          {/* Contenido */}
          <AppointmentHistoryList />

        </section>
      </main>
    </>
  );
}