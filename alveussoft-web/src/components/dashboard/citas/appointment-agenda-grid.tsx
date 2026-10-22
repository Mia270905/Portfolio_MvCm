"use client";

import { useMemo, useState, useEffect, useRef } from "react"; // Añadido useRef
import {
  Clock,
  Plus,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar as CalendarIcon,
  CheckCircle2,
  X,
  Mail,
  Phone,
  ShieldCheck,
  Loader2,
  Filter,
  MessageSquare,
  FileText,
  Search,
  ChevronDown // Añadido
} from "lucide-react";
import { AppointmentStatus } from "@/lib/actions/appointment_status.actions";
import { AppointmentsResponse } from "@/lib/actions/appointment.actions";

// Mock de Label si no usas una librería de UI
const Label = ({ children, className }: any) => (
  <label className={`block ${className}`}>{children}</label>
);

interface Props {
  userPermissions: string[];
  appointmentsFromDB: any[];
  currentUserId: string;
  creators?: any[];
  selectedDate?: Date | null;
  onAppointmentClick?: (appointment: any) => void;
}

const START_HOUR = 0;
const END_HOUR = 23;
const HOUR_HEIGHT = 70;

export function AppointmentAgendaGrid({
  appointmentsFromDB,
  userPermissions,
  currentUserId, // <--- nuevo
  creators = [], // Por defecto array vacío
  selectedDate = null, // Por defecto null
  onAppointmentClick, // <--- nuevo
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // --- ESTADOS PARA EL FILTRO DE CREADORES ---
    const [statuses, setStatuses] = useState<AppointmentStatus[]>([]);
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([currentUserId]);
  const [creatorSearch, setCreatorSearch] = useState("");
  const [creatorDropdownOpen, setCreatorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const toggleStatus = (statusName: string) => {
  const upperName = statusName.toUpperCase();
  setStatusFilter((prev) =>
    prev.includes(upperName) 
      ? prev.filter((s) => s !== upperName) 
      : [...prev, upperName]
  );
};
   const [appointmentsData, setAppointmentsData] =
      useState<AppointmentsResponse>({
        appointments: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });
  // Esta lógica revisa si el código exacto está en tu lista de permisos
const canViewCreatorsFilter = useMemo(() => {
  return userPermissions?.includes("view_users:appointments");
}, [userPermissions]);
    useEffect(() => {
      if (!selectedDate) return;

      const today = new Date();
      const mondayToday = new Date(today);
      mondayToday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

      const mondaySelected = new Date(selectedDate);
      mondaySelected.setDate(selectedDate.getDate() - ((selectedDate.getDay() + 6) % 7));

      const diffTime = mondaySelected.getTime() - mondayToday.getTime();
      const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

      setWeekOffset(diffWeeks);
    }, [selectedDate]);
    const handleAppointmentClick = (apt: any) => {
  if (onAppointmentClick) {
    onAppointmentClick(apt);
  }
};
  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCreatorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- FILTRADO DE CITAS POR CREADOR ---
// --- FILTRADO DE CITAS POR CREADOR Y ESTADO ---
const filteredAppointments = useMemo(() => {
  return appointmentsFromDB.filter((apt) => {
    // Filtro por Creador
    const matchesCreator = selectedCreators.length === 0 || selectedCreators.includes(apt.space_owner?.id);
    
    // Filtro por Estado (Reparado)
    const statusName = apt.status?.name?.toUpperCase() || "";
    const matchesStatus = statusFilter.length === 0 || statusFilter.includes(statusName);

    return matchesCreator && matchesStatus;
  });
}, [appointmentsFromDB, selectedCreators, statusFilter]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [weekOffset, selectedCreators]); // Recargar si cambia el filtro

  // ... (tus funciones de ayuda: weekDays, getStatusConfig, calculateGroups se mantienen igual)
  const weekDays = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + weekOffset * 7;
    const monday = new Date(now);
    monday.setDate(diff);

    return ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((name, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        name,
        displayDate: String(date.getDate()).padStart(2, "0"),
        fullDate: date.toISOString().split("T")[0],
        isToday: date.toDateString() === new Date().toDateString(),
      };
    });
  }, [weekOffset]);

  const getStatusConfig = (statusName: string) => {
    const s = statusName?.toUpperCase() || "";
    if (s === "CONFIRMED") return { bg: "bg-emerald-500/20", border: "border-emerald-500/50", text: "text-emerald-500", icon: <CheckCircle2 className="w-3 h-3" /> };
    if (s === "BOOKED") return { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-500", icon: <Clock className="w-3 h-3" /> };
    if (s === "AVAILABLE") return { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-400", icon: <Plus className="w-3 h-3" /> };
    return { bg: "bg-custom-accent-primary/20", border: "border-custom-accent-primary/50", text: "text-custom-accent-primary", icon: <CalendarCheck className="w-3 h-3" /> };
  };

  const calculateGroups = (dayApts: any[]) => {
    const sorted = [...dayApts].sort((a, b) => 
      new Date(a.appointment_datetime).getTime() - new Date(b.appointment_datetime).getTime()
    );
    const groups: any[][] = [];
    sorted.forEach(apt => {
      const aptStart = new Date(apt.appointment_datetime).getTime();
      const aptEnd = aptStart + (apt.duration_minutes || 60) * 60000;
      let placed = false;
      for (let group of groups) {
        if (group.some(gApt => {
          const gStart = new Date(gApt.appointment_datetime).getTime();
          const gEnd = gStart + (gApt.duration_minutes || 60) * 60000;
          return aptStart < gEnd && aptEnd > gStart;
        })) {
          group.push(apt);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([apt]);
    });
    return groups.flatMap(group => group.map((apt, index) => ({
      ...apt,
      width: 100 / group.length,
      left: (100 / group.length) * index,
    })));
  };

  if (isLoading) {
      return (
        <div className="space-y-4 animate-pulse">
          <div className="h-16 bg-custom-bg-secondary rounded-xl border border-custom-border-secondary flex items-center px-4 justify-between">
              <div className="h-6 w-32 bg-custom-bg-tertiary rounded" />
              <div className="flex gap-2">
                  <div className="h-10 w-10 bg-custom-bg-tertiary rounded-lg" />
                  <div className="h-10 w-14 bg-custom-bg-tertiary rounded-lg" />
                  <div className="h-10 w-10 bg-custom-bg-tertiary rounded-lg" />
              </div>
          </div>
          <div className="bg-custom-bg-secondary rounded-xl border border-custom-border-secondary h-[650px] flex flex-col overflow-hidden">
              <div className="h-20 border-b border-custom-border-secondary flex ml-12 sm:ml-20">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="flex-1 border-r border-custom-border-secondary/30 flex flex-col items-center justify-center space-y-2">
                          <div className="h-2 w-8 bg-custom-bg-tertiary rounded" />
                          <div className="h-6 w-6 bg-custom-bg-tertiary rounded" />
                      </div>
                  ))}
              </div>
              <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-custom-accent-primary animate-spin opacity-50" />
              </div>
          </div>
        </div>
      );
    }

  return (
    
    <div className="space-y-4">

        <div className="flex flex-col gap-4">
          {/* 1. HEADER PRINCIPAL */}
   <div className="flex flex-col sm:flex-row items-center justify-between bg-[#0F1420] p-4 rounded-xl border border-gray-800 gap-4">
    
    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-custom-accent-primary/10 rounded-lg">
          <CalendarIcon className="w-5 h-5 text-custom-accent-primary" />
        </div>
        <span className="font-bold text-white capitalize text-sm sm:text-base">
          {new Date(weekDays[0].fullDate.replace(/-/g, "/")).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        </span>
      </div>

      {/* ESTE BOTÓN SOLO APARECE EN MÓVIL Y SUSTITUYE AL DE DESKTOP ABAJO */}
      {canViewCreatorsFilter && (
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`sm:hidden p-2.5 rounded-lg border transition-all ${
            showFilters || selectedCreators.length > 0 
            ? "bg-custom-accent-primary text-black border-custom-accent-primary" 
            : "bg-[#1A1F2C] text-gray-400 border-gray-700"
          }`}
        >
          <Filter size={18} />
        </button>
      )}
    </div>

    <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
      {/* BOTÓN DESKTOP: Se oculta en móvil con hidden sm:flex */}
      {canViewCreatorsFilter && (
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
            showFilters || selectedCreators.length > 0
            ? "bg-custom-accent-primary text-black border-custom-accent-primary" 
            : "bg-[#1A1F2C] text-gray-300 border-gray-700 hover:bg-gray-800"
          }`}
        >
          <Filter size={14} />
          Filtros {selectedCreators.length > 0 && `(${selectedCreators.length})`}
        </button>
      )}

      <div className="h-8 w-[1px] bg-gray-800 mx-2 hidden sm:block" />

      {/* NAVEGACIÓN */}
      <div className="flex gap-1 bg-[#1A1F2C] p-1 rounded-xl border border-gray-800">
        <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors">
          <ChevronLeft size={18}/>
        </button>
        <button onClick={() => setWeekOffset(0)} className="px-4 py-1 text-[10px] font-black text-custom-accent-primary hover:bg-gray-700 rounded-lg transition-colors">
          IR A HOY
        </button>
        <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 hover:bg-gray-700 rounded-lg text-white transition-colors">
          <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  </div>

          {/* 2. BARRA DE FILTROS DESPLEGABLE (RESPONSIVE) */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:flex sm:items-center gap-3 bg-[#0F1420] p-3 rounded-xl border border-gray-800 animate-in fade-in slide-in-from-top-2">
              <div className="relative w-full sm:w-72" ref={dropdownRef}>
                <Label className="text-[10px] text-gray-500 font-bold uppercase mb-1.5 ml-1 block">Filtrar por Creador</Label>
                <button
                  type="button"
                  onClick={() => setCreatorDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1A1F2C] border border-gray-700 rounded-lg text-xs text-white hover:border-gray-500 transition-all shadow-inner"
                >
                  <div className="flex items-center gap-2 truncate">
                    <User className="w-3.5 h-3.5 text-custom-accent-primary" />
                    <span className="truncate">
                      {selectedCreators.length === 0 ? "Todos los Creadores" : `${selectedCreators.length} seleccionados`}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${creatorDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {creatorDropdownOpen && (
                  <div className="absolute z-[120] mt-2 w-full bg-[#1A1F2C] border border-gray-700 rounded-xl shadow-2xl p-2 space-y-2 overflow-hidden">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar creador..."
                        value={creatorSearch}
                        onChange={(e) => setCreatorSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs bg-[#0F1420] border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:border-custom-accent-primary outline-none"
                      />
                      <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-600" />
                    </div>

                    <div className="max-h-48 overflow-y-auto custom-scrollbar pr-1 space-y-0.5">
                      {creators.length > 0 ? (
                        creators
                          .filter(c => c.full_name.toLowerCase().includes(creatorSearch.toLowerCase()))
                          .map((creator) => (
                            <label 
                              key={creator.id} 
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                                selectedCreators.includes(creator.id) ? 'bg-custom-accent-primary/10' : 'hover:bg-[#0F1420]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedCreators.includes(creator.id)}
                                onChange={() => {
                                  setSelectedCreators(prev => 
                                    prev.includes(creator.id) ? prev.filter(id => id !== creator.id) : [...prev, creator.id]
                                  );
                                }}
                                className="w-4 h-4 rounded border-gray-700 accent-custom-accent-primary"
                              />
                              <span className={`text-xs ${selectedCreators.includes(creator.id) ? 'text-custom-accent-primary font-bold' : 'text-gray-300'}`}>
                                {creator.full_name}
                              </span>
                            </label>
                          ))
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-600 italic">No hay creadores disponibles</div>
                      )}
                    </div>
                  </div>
                )}

              </div>
                {/* Filtro por Estado */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                    Estado de Cita
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {["CONFIRMED", "BOOKED", "AVAILABLE"].map((status) => {
                      const active = statusFilter.includes(status);
                      const config = getStatusConfig(status); // Reutilizamos tus colores
                      
                      return (
                        <button
                          key={status}
                          onClick={() => toggleStatus(status)}
                          className={`px-4 py-1.5 rounded-lg text-[10px] font-black border transition-all uppercase tracking-tighter ${
                            active
                              ? `${config.bg} ${config.border} ${config.text} ring-1 ring-offset-2 ring-offset-[#0F1420] ring-current`
                              : "bg-[#1A1F2C] border-gray-700 text-gray-500 hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {active && config.icon}
                            {status === "BOOKED" ? "RESERVADO" : status === "CONFIRMED" ? "CONFIRMADO" : "DISPONIBLE"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>  

              {/* LIMPIAR FILTROS RÁPIDO */}
              {selectedCreators.length > 0 && (
                <button 
                  onClick={() => setSelectedCreators([])}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-widest"
                >
                  <X size={12} />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
    {/* CUERPO DE LA AGENDA */}
     <div className="relative w-full bg-custom-bg-secondary rounded-xl border border-custom-border-secondary shadow-2xl flex flex-col h-[75vh] overflow-hidden"> 
            <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="w-max min-w-full relative">
              {/* HEADER DE FECHAS: Sticky Top-0 */}
              <div className="flex sticky top-0 z-30 bg-[#0F1420] border-b border-custom-border-secondary shadow-md">
                    {/* 1. LA ESQUINA: Importante que sea sticky left-0 para que no desaparezca al moverte a los lados */}
                    <div className="w-14 sm:w-20 flex-none sticky left-0 z-30 bg-[#0F1420] border-r border-custom-border-secondary" />
                    {/* 2. LAS FECHAS: Se desplazan horizontalmente pero se quedan pegadas arriba */}
                    {weekDays.map((day) => (
                      <div
                        key={day.fullDate}
                        className="min-w-[120px] flex-1 p-3 sm:p-4 text-center border-r border-custom-border-secondary/50"
                      >
                        <span
                          className={`text-[9px] sm:text-[10px] uppercase tracking-widest font-black block ${
                            day.isToday ? "text-custom-accent-primary" : "text-custom-text-tertiary"
                          }`}
                        >
                          {day.name}
                        </span>

                        <span
                          className={`text-lg sm:text-2xl font-black ${
                            day.isToday ? "text-custom-accent-primary" : "text-white"
                          }`}
                        >
                          {day.displayDate}
                        </span>
                      </div>
                    ))}
                  </div>

                    {/* GRID */}
                    <div className="flex relative">

                      {/* HORAS */}
                      <div className="w-14 sm:w-20 flex-none sticky left-0 z-10 bg-[#0F1420] border-r border-custom-border-secondary">
                          {Array.from({ length: 24 }).map((_, i) => (
                          <div
                            key={i}
                            style={{ height: HOUR_HEIGHT }}
                            className="text-white text-[10px] sm:text-sm flex items-center justify-center font-bold border-b border-white/5"
                          >
                            {i}:00
                          </div>
                        ))}
                      </div>

                      {/* COLUMNAS */}
                      <div className="flex flex-1 relative min-w-[700px]">

                        {weekDays.map((day) => {

                          const dayApts =
                            filteredAppointments?.filter((a) => {
                              const isCorrectDay =
                                a.appointment_datetime?.startsWith(day.fullDate);
                              const status = a.status?.name?.toUpperCase() || "";

                              return (
                                isCorrectDay &&
                                ["CONFIRMED", "BOOKED", "AVAILABLE"].includes(status)
                              );
                            }) || [];

                          const processedApts = calculateGroups(dayApts);

                          return (
                            <div
                              key={day.fullDate}
                              className="relative min-w-[120px] flex-1 border-r border-custom-border-secondary/30"
                              style={{ height: 24 * HOUR_HEIGHT }}
                            >
                              {/* lineas */}
                              {Array.from({ length: 24 }).map((_, i) => (
                                <div
                                  key={i}
                                  style={{ height: HOUR_HEIGHT }}
                                  className="border-b border-custom-border-secondary/5"
                                />
                              ))}

                              {processedApts.map((apt: any, idx) => {

                                const date = new Date(apt.appointment_datetime);
                                const config = getStatusConfig(apt.status?.name);

                                const startMins =
                                  date.getHours() * 60 + date.getMinutes();

                                const top = startMins * (HOUR_HEIGHT / 60);

                                const height =
                                  (apt.duration_minutes || 60) *
                                  (HOUR_HEIGHT / 60);

                                return (
                                  <div
                                    key={apt.id || idx}
                                    onClick={() => handleAppointmentClick(apt)}
                                    style={{
                                      top,
                                      height,
                                      width: `calc(${apt.width}% - 4px)`,
                                      left: `${apt.left}%`,
                                    }}
                                    className={`absolute mx-0.5 rounded-lg border ${config.border} ${config.bg} p-2 cursor-pointer shadow-lg`}
                                  >
                                    <p className="text-[10px] font-bold text-white truncate">
                                      {apt.client_name || "Disponible"}
                                    </p>
                                    <div className="mt-1 flex items-center gap-1 opacity-40">
                                              <ShieldCheck className="w-2 h-2 text-custom-accent-primary shrink-0" />
                                              <span className="text-[6px] text-white/80 truncate">
                                                {apt.space_owner?.full_name?.split(' ')[0] || "Staff"}
                                              </span>
                                            </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}

                      </div>
                    </div>
                  </div>
                </div>
              </div>


    </div>
  );
}