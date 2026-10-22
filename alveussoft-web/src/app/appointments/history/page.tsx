"use client";

import { HeroHeader } from "@/components/header";
import { AppointmentHistoryList } from "@/components/historial/appointments/appointment-history-list";
import Link from "next/link";
import { Calendar, Lock, ShieldCheck, Funnel, X } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { areReservationsEnabled } from "@/lib/actions/configuration.actions";
import { useSearchParams, useRouter } from "next/navigation";
import { validateContactAccess } from "@/lib/actions/appointment.actions";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function HistoryContent() {
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const contactId = searchParams.get("contactId");

  const [reservationsEnabled, setReservationsEnabled] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [authError, setAuthError] = useState("");
  const [credentials, setCredentials] = useState({ email: "", phone: "" });

  const [showFilters, setShowFilters] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsAuthorized(true);
        setUserEmail(session.user.email ?? null);
      } else if (!contactId) {
        router.push("/auth/login");
        return;
      }

      const enabled = await areReservationsEnabled();
      setReservationsEnabled(enabled);
      setLoadingConfig(false);
    };

    initializeAuth();
  }, [contactId, router, supabase.auth]);
    const clearFilters = () => {
      setSelectedStatus(null);
      setDateFrom("");
      setDateTo("");
    };
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return;

    setValidating(true);
    setAuthError("");

    const res = await validateContactAccess(
      contactId,
      credentials.email,
      credentials.phone
    );

    if (res.success) {
      setIsAuthorized(true);
    } else {
      setAuthError("Los datos no coinciden.");
    }

    setValidating(false);
  };

  if (loadingConfig) {
    return (
      <div className="flex justify-center py-32 text-gray-400">
        Cargando...
      </div>
    );
  }

  if (!isAuthorized && contactId) {
    return (
      <section className="relative z-10 mx-auto max-w-md px-6 py-24">
        <div className="bg-[#1c1917] border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 rounded-full mb-6">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          
          <h2 className="text-2xl font-medium text-white mb-2">Confirmar Identidad</h2>
          <p className="text-sm text-gray-400 mb-8">
            Ingresa los datos asociados a tu registro para continuar.
          </p>

          <form onSubmit={handleVerifyIdentity} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Correo Electrónico</label>
              <Input
                type="email"
                required
                placeholder="ejemplo@correo.com"
                className="bg-gray-900 border-gray-700 mt-1 focus-visible:ring-amber-500"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Teléfono (10 dígitos)</label>
              <Input
                type="tel"
                required
                maxLength={10}
                placeholder="3111234567"
                className="bg-gray-900 border-gray-700 mt-1 focus-visible:ring-amber-500"
                value={credentials.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setCredentials({ ...credentials, phone: val });
                }}
              />
            </div>

            {authError && <p className="text-xs text-red-400 mt-2 font-medium bg-red-400/10 p-2 rounded">{authError}</p>}

            <Button 
              type="submit" 
              disabled={validating}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold h-11 mt-4 transition-all active:scale-[0.98]"
            >
              {validating ? "Verificando..." : "Acceder al Historial"}
            </Button>
          </form>
        </div>
      </section>
    );
  }

  return (

  <section className="max-w-4xl mx-auto px-6 py-24">

    {/* HEADER */}
    <header className="text-center mb-10 relative">
      <h1 className="text-4xl text-white font-medium">
        Historial de citas
      </h1>
 
      <p className="text-gray-400 mt-2">
        Aquí puedes consultar todas las citas que has realizado
      </p>

      {reservationsEnabled && (
        <div className="absolute right-0 top-0">
          <Link
            href="/cliente-cita"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-[#0c0a09] font-bold rounded-full transition-all duration-200 shadow-lg shadow-amber-500/20 active:scale-95"
          >
            <Calendar size={18} />
            <span>Reservar Cita</span>
          </Link>
        </div>
      )}
    </header>
    {/* LISTA */}
    <AppointmentHistoryList
      contactId={contactId ?? undefined}
    />
  </section>
);
}
export default function AppointmentHistoryPage() {
  return (
    <>
      <HeroHeader />
      <main className="min-h-screen bg-black text-gray-200">
        <Suspense fallback={<div className="py-20 text-center">Cargando...</div>}>
          <HistoryContent />
        </Suspense>
      </main>
    </>
  );
}