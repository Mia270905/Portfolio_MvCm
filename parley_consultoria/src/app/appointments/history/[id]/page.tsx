import { HeroHeader } from "@/components/header";
import AppointmentDetail from "@/components/historial/appointments/appointment-detail";

export default function AppointmentDetailPage() {
  return (
    <>
      <HeroHeader />

      <main className="pt-8 relative min-h-screen bg-[#faf8f3] text-neutral-700">
        <section className="relative z-10 mx-auto max-w-4xl px-6 py-24">

          {/* Encabezado */}
          <header className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-semibold text-[#c6a365]">
              Detalle de la cita
            </h1>
          </header>

          {/* Contenido */}
          <AppointmentDetail />

        </section>
      </main>
    </>
  );
}