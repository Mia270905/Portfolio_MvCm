"use client";

import { HeroHeader } from "@/components/header";
import AttendanceCheckIn from "@/components/attendance/attendance-checkin";
import AttendanceHistoryList from "@/components/attendance/antendance-history-list";
import { useState } from "react";

export default function ChecadorPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <HeroHeader />

      <main className="pt-8 relative min-h-screen bg-[#0c0a09] text-gray-200">
        <section className="relative z-10 mx-auto max-w-4xl px-6 py-24">
          
          {/* Encabezado */}
          <header className="mb-12">
            <h1 className="text-3xl md:text-4xl font-medium text-white">
              Sistema de Checador
            </h1>
            <p className="mt-4 text-sm text-gray-400">
              Registra y consulta las entradas y salidas del personal
            </p>
          </header>

          {/* Tarjeta de check-in/out */}
          <div className="mb-12">
            <AttendanceCheckIn onCheckInOutSuccess={handleRefresh} />
          </div>

          {/* Historial */}
          <div>
            <h2 className="text-2xl font-medium text-white mb-6">
              Historial de Registros
            </h2>
            <AttendanceHistoryList refreshTrigger={refreshTrigger} />
          </div> 

        </section>
      </main>
    </>
  );
}