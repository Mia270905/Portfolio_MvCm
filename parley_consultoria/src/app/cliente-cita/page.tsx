"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar,
  Search
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getProfessionalsWithAvailableSlots } from "@/lib/actions/appointment.actions";

// Definir tipo para profesional
interface Professional {
  id: string;
  email: string;
  full_name: string | null;
  user_code: string | null;
  active: boolean;
}

export default function ClientAppointmentPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  // Cargar lista de profesionales activos CON ESPACIOS DISPONIBLES
  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        setLoadingProfessionals(true);
        
        const result = await getProfessionalsWithAvailableSlots();
        
        if (!result.success) {
          toast.error(result.message || "Error al cargar profesionales");
          setProfessionals([]);
          setFilteredProfessionals([]);
          return;
        }

        setProfessionals(result.data || []);
        setFilteredProfessionals(result.data || []);
        
      } catch (error) {
        console.error("Error inesperado:", error);
        toast.error("Error al cargar profesionales");
        setProfessionals([]);
        setFilteredProfessionals([]);
      } finally {
        setLoadingProfessionals(false);
      }
    };

    fetchProfessionals();
  }, []);

  // Filtrar profesionales según búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProfessionals(professionals);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filtered = professionals.filter(prof => 
      prof.full_name?.toLowerCase().includes(term) ||
      prof.email?.toLowerCase().includes(term) ||
      prof.user_code?.toLowerCase().includes(term)
    );
    
    setFilteredProfessionals(filtered);
  }, [searchTerm, professionals]);

  const handleSelectProfessional = (professional: Professional) => {
    if (!professional.user_code) {
      toast.error("Este profesional no tiene código asignado");
      return;
    }
    
    // Redirigir a /[id]
    router.push(`/cliente-cita/${professional.user_code}`);
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center p-4">
      {/* Modal de selección de profesional */}
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent 
          className="w-full sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh] overflow-y-auto p-6 bg-white border border-[#f5efe6] rounded-2xl shadow-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          showCloseButton={false}
        >
        <div className="relative">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-semibold text-center text-[#c6a365] mb-2">
              Selecciona un profesional para continuar
            </DialogTitle>
            <p className="text-sm text-neutral-600 text-center">
              Debes seleccionar un profesional para ver sus horarios disponibles
            </p>
          </DialogHeader>

          <div className="absolute left-0 top-1/2 -translate-y-[95%]">
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              size="sm"
              className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {/* <span className="hidden sm:inline">Regresar</span> */}
            </Button>
          </div>
        </div>

          {/* Barra de búsqueda */}
          <div className="relative mt-4 mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar profesional por nombre, email o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#f5efe6] border border-[#f5efe6] text-neutral-900 placeholder:text-neutral-500 focus:border-[#c6a365]"
            />
          </div>

          {/* Lista de profesionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {loadingProfessionals ? (
              // Skeleton loading
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center border border-[#f5efe6] rounded-lg p-4 bg-[#f5efe6] animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-[#e6dcc9]"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#e6dcc9] rounded w-3/4"></div>
                    <div className="h-3 bg-[#e6dcc9] rounded w-full"></div>
                    <div className="h-3 bg-[#e6dcc9] rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : filteredProfessionals.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#f5efe6] border-2 border-[#f5efe6] flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-[#c6a365]" />
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  No hay profesionales con horarios disponibles
                </h3>
                <p className="text-neutral-600 mb-4">
                  {searchTerm 
                    ? `No hay resultados para "${searchTerm}" con espacios disponibles`
                    : "En este momento no hay profesionales con horarios disponibles"}
                </p>
                <div className="mt-4 p-4 bg-[#f5efe6] rounded-lg border border-[#f5efe6] max-w-md mx-auto">
                  <p className="text-sm text-neutral-600">
                    💡 Los profesionales aparecerán aquí cuando tengan horarios libres en su agenda
                  </p>
                </div>
              </div>
            ) : (
              filteredProfessionals.map((professional) => (
                <div
                  key={professional.id}
                  onClick={() => handleSelectProfessional(professional)}
                  className="flex gap-4 items-center border-2 border-[#a9916e] rounded-lg p-4 hover:bg-white cursor-pointer transition-all duration-200 bg-white hover:border-[#c6a365] hover:shadow-md group"
                >
                  {/* Avatar del profesional */}
                  <div className="w-16 h-16 rounded-full bg-[#f5efe6] flex items-center justify-center flex-shrink-0 group-hover:bg-[#f8f3e9]">
                    <User className="w-8 h-8 text-[#c6a365]" />
                  </div>

                  {/* Información del profesional */}
                  <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                      <h3 className="font-semibold text-neutral-900 truncate group-hover:text-[#b59555] text-base">
                        {professional.full_name || "Profesional sin nombre"}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                      <Mail className="w-3 h-3 flex-shrink-0 text-[#c6a365]" />
                      <span className="truncate text-sm">{professional.email}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#f8f3e9] text-[#c6a365] border border-[#f5efe6]">
                        <div className="w-2 h-2 rounded-full bg-[#c6a365] animate-pulse"></div>
                        Disponible
                      </span>
                      <button className="ml-auto text-sm text-[#c6a365] hover:text-[#b59555] font-medium flex items-center gap-1 whitespace-nowrap">
                        Ver horarios
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}