"use client"; // Necesario para usar hooks y estados

import { HeroHeader } from "@/components/header";
import { AppointmentHistoryList } from "@/components/historial/appointments/appointment-history-list";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { areReservationsEnabled } from "@/lib/actions/configuration.actions";

export default function AppointmentHistoryPage() {
  // Estado para controlar si las citas están habilitadas
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

      <main className="pt-8 relative min-h-screen bg-custom-bg-primary text-custom-text-primary">
        <section className="relative z-10 mx-auto max-w-4xl px-6 py-24">

          {/* Encabezado */}
          <header className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-medium text-custom-text-primary">
              Historial de citas
            </h1>
            <p className="mt-4 text-sm text-custom-text-secondary">
              Aquí puedes consultar todas las citas que has realizado
            </p>

            {/* Botón Reservar Cita - Solo se muestra si están habilitadas y terminó de cargar */}
            {!loading && reservationsEnabled && (
              <div className="flex justify-end mt-6">
                <Link
                  href="/cliente-cita"
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#987E71] hover:bg-[#40222D] text-white font-bold rounded-full transition-all duration-200 shadow-lg shadow-[#987E71]/20 active:scale-95"
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
