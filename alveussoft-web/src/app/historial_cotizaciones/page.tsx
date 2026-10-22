"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import QuotationCard from "@/components/historial/appointments/histirial_cotizacion";
import { HeroHeader } from "@/components/header"; 
import FooterSection from "@/components/footer";
import { FileSearch, Search, ShieldAlert, Lock, ShieldCheck } from "lucide-react";
import { getPortalQuotations, verifyContact } from "@/lib/actions/quotations.actions";

export default function QuotationsPage() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get("id");

  const [verified, setVerified] = useState(false);
  const [allQuotes, setAllQuotes] = useState<any[]>([]); // Guardamos todas las cotizaciones
  const [quotes, setQuotes] = useState<any[]>([]);         // Cotizaciones filtradas
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || ""); // Input controlado
const formatPhone = (value: string) => {
  // Quitar todo lo que no sea número
  const numbers = value.replace(/\D/g, '').slice(0, 10);

  // Formato 311-348-9468
  const parts = [];
  if (numbers.length > 0) parts.push(numbers.slice(0, 3));
  if (numbers.length > 3) parts.push(numbers.slice(3, 6));
  if (numbers.length > 6) parts.push(numbers.slice(6, 10));

  return parts.join('-');
};

const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  e.target.value = formatPhone(e.target.value);
};
  // 🚫 SIN ID
  if (!contactId) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-6">
        <div className="text-center space-y-4 p-8 bg-[#111622] rounded-[2rem] border border-slate-800">
          <ShieldAlert className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="text-white text-2xl font-black uppercase italic">
            Acceso Denegado
          </h2>
          <p className="text-slate-500 text-sm">
            Identificador de contacto no encontrado.
          </p>
        </div>
      </main>
    );
  }

  // 🔥 CARGAR DATOS SOLO SI ESTÁ VERIFICADO
  useEffect(() => {
    if (!verified) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getPortalQuotations(contactId, "");
        setAllQuotes(data || []);
        setQuotes(data || []);
      } catch (err) {
        console.error("Error cargando cotizaciones:", err);
        setAllQuotes([]);
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [verified, contactId]);

  // 🔒 VERIFICACIÓN
  if (!verified) {
    return (
      <>
        <HeroHeader />
        <main className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111622] border border-slate-800 p-8 rounded-[2.5rem] text-center">
            <div className="bg-amber-500/10 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-amber-500" />
            </div>

            <h2 className="text-white text-3xl font-black italic uppercase mb-2">
              Seguridad
            </h2>

            <p className="text-slate-500 mb-8 text-sm">
              Ingresa tu correo y teléfono para ver tus cotizaciones
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setErrorMessage(null);

                const form = e.currentTarget;
                const email = (form.elements.namedItem("email") as HTMLInputElement).value;
                const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;

                try {
                  const valid = await verifyContact(contactId, email, phone);
                  if (valid) {
                    setVerified(true);
                  } else {
                    setErrorMessage("Correo o teléfono no coinciden con el contacto.");
                  }
                } catch (err) {
                  console.error("Error verificando contacto:", err);
                  setErrorMessage("Ocurrió un error al verificar los datos.");
                }
              }}
              className="space-y-4 text-left"
            >
              {errorMessage && (
                <div className="bg-red-600/20 border border-red-500 text-red-200 px-4 py-3 rounded-xl text-sm flex items-center gap-2 transition-all duration-300 ease-in-out">
                  <ShieldAlert className="h-5 w-5" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <div className="space-y-5">
                {/* Email */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm text-slate-300">
                    Correo electrónico
                  </label>
                  <input id="email"type="email" name="email"placeholder="ejemplo@correo.com"autoComplete="email"className="w-full bg-[#0B0F1A] border border-slate-800 rounded-xl py-4 px-5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" required />
                </div>

                {/* Teléfono */}
                <div className="flex flex-col gap-2">
                  <label htmlFor="phone" className="text-sm text-slate-300">
                    Teléfono
                  </label>
                <input id="phone" type="tel" name="phone" placeholder="311-345-5500" autoComplete="tel" inputMode="numeric" onChange={handlePhoneChange} className="w-full bg-[#0B0F1A] border border-slate-800 rounded-xl py-4 px-5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition" required/>
                </div>
              </div>
              <button className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-4 rounded-xl mt-4 transition-colors duration-200">
                Ver mi historial
              </button>
            </form>
          </div>
        </main>
        <FooterSection />
      </>
    );
  }

  // ✅ CONTENIDO
  return (
    <>
      <HeroHeader />
      <main className="min-h-screen bg-[#0B0F1A] pt-32 pb-20">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* HEADER */}
          <div className="relative mb-8 flex items-center justify-between">
            <div className="flex items-center">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 h-12 w-1.5 bg-amber-500 rounded-full" />
              <h1 className="text-5xl font-black text-white italic uppercase pl-4">
                Mis <span className="text-amber-500">Cotizaciones</span>
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-2 text-emerald-500">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold">Vista temporal</span>
            </div>
          </div>

          {/* BUSCADOR */}
          <div className="mb-10 relative w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              placeholder="Buscar por folio o número..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                const term = e.target.value.toLowerCase();
                setQuotes(
                  allQuotes.filter(
                    (q) =>
                      (q.quotation_number?.toString() || "")
                        .toLowerCase()
                        .includes(term)
                  )
                );
              }}
              className="w-full bg-[#111622] border border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-white"
            />
          </div>

          {/* LISTADO */}
          <div className="grid gap-4">
            {loading ? (
              <p className="text-slate-500 text-center">Cargando...</p>
            ) : quotes.length > 0 ? (
              quotes.map((item: any) => (
                <QuotationCard
                  key={item.id}
                  id={item.id}
                  folio={item.quotation_number?.toString() || "0"} 
                  status={item.status || 'pending'} 
                  total={Number(item.total) || 0}
                  itemsCount={item.items?.length || 0}
                  date={item.created_at}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <FileSearch className="h-12 w-12 mb-4" />
                <p className="text-sm font-bold uppercase">
                  {searchTerm 
                    ? `No hay resultados para "${searchTerm}"` 
                    : "Aún no tienes cotizaciones"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <FooterSection />
    </>
  );
}