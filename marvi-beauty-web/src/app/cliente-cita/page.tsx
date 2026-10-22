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
    <div className="min-h-screen bg-custom-bg-primary flex items-center justify-center p-4">
      {/* Modal de selección de profesional */}
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent 
          className="w-full sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh] overflow-y-auto p-6 bg-custom-bg-secondary border-custom-border-secondary"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-custom-text-primary mb-2">
              Selecciona un profesional para continuar
            </DialogTitle>
            <p className="text-sm text-custom-text-secondary text-center">
              Debes seleccionar un profesional para ver sus horarios disponibles
            </p>
          </DialogHeader>

          <div className="absolute top-4 left-4 z-10">
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              size="sm"
              className="text-custom-text-tertiary hover:text-custom-accent-primary hover:bg-custom-accent-primary/10 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Regresar</span>
            </Button>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative mt-4 mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-text-muted w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar profesional por nombre, email o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-custom-bg-tertiary border-custom-border-primary text-custom-text-primary placeholder-custom-text-muted focus:border-custom-accent-primary focus:ring-custom-accent-primary/20"
            />
          </div>

          {/* Lista de profesionales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {loadingProfessionals ? (
              // Skeleton loading
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center border border-custom-border-secondary rounded-lg p-4 bg-custom-bg-tertiary animate-pulse">
                  <div className="w-16 h-16 rounded-full bg-custom-bg-hover"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-custom-bg-hover rounded w-3/4"></div>
                    <div className="h-3 bg-custom-bg-hover rounded w-full"></div>
                    <div className="h-3 bg-custom-bg-hover rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : filteredProfessionals.length === 0 ? (
              <div className="col-span-1 md:col-span-2 text-center py-8">
                <div className="w-16 h-16 rounded-full bg-custom-bg-tertiary border-2 border-custom-border-secondary flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-custom-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-custom-text-primary mb-2">
                  No hay profesionales con horarios disponibles
                </h3>
                <p className="text-custom-text-secondary mb-4">
                  {searchTerm 
                    ? `No hay resultados para "${searchTerm}" con espacios disponibles`
                    : "En este momento no hay profesionales con horarios disponibles"}
                </p>
                <div className="mt-4 p-4 bg-custom-bg-tertiary rounded-lg border border-custom-border-secondary max-w-md mx-auto">
                  <p className="text-sm text-custom-text-muted">
                    💡 Los profesionales aparecerán aquí cuando tengan horarios libres en su agenda
                  </p>
                </div>
              </div>
            ) : (
              filteredProfessionals.map((professional) => (
                <div
                  key={professional.id}
                  onClick={() => handleSelectProfessional(professional)}
                  className="flex gap-4 items-center border border-custom-border-secondary rounded-lg p-4 hover:bg-custom-bg-tertiary cursor-pointer transition-all duration-200 bg-custom-bg-secondary hover:border-custom-accent-primary group"
                >
                  {/* Avatar del profesional */}
                  <div className="w-16 h-16 rounded-full bg-custom-accent-primary flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-custom-bg-secondary" />
                  </div>

                  {/* Información del profesional */}
                  <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                      <h3 className="font-semibold text-custom-text-primary truncate group-hover:text-custom-accent-primary text-base">
                        {professional.full_name || "Profesional sin nombre"}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-custom-text-secondary mb-3">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate text-sm">{professional.email}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        Disponible
                      </span>
                      <button className="ml-auto text-sm text-custom-accent-primary hover:text-custom-accent-secondary font-medium flex items-center gap-1 whitespace-nowrap">
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