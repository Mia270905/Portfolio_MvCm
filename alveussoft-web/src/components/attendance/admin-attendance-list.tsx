"use client";

import { useEffect, useState, useRef } from "react";
import {
  getAttendanceHistoryAll,
  getAttendanceReasons,
  getUsersWithAttendanceRecords,
} from "@/lib/actions/attendance.actions";
import type {
  AttendanceTransactionsResponse,
  AttendanceReason,
  AttendanceTransaction,
} from "@/lib/actions/attendance.actions";
import AttendanceHistoryItem from "./attendance-history-item";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  Check,
  Clock,
  Calendar,
  CalendarDays,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const reasonTranslations: Record<string, string> = {
  meal: "Comida",
  work_schedule: "Horario laboral",
  permission: "Permiso",
};

// Función para formatear hora en AM/PM
const formatTimeToAMPM = (dateString: string) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12;
  
  return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

// Función para formatear fecha para visualización
const formatDateForDisplay = (dateString: string | null) => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

export default function AdminAttendanceHistory() {
  const [data, setData] = useState<AttendanceTransactionsResponse>({
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "entries" | "exits">("all");
  const [reasons, setReasons] = useState<AttendanceReason[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [searchReasonQuery, setSearchReasonQuery] = useState("");

  // Referencias para los dropdowns
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const reasonDropdownRef = useRef<HTMLDivElement>(null);
  const reasonButtonRef = useRef<HTMLButtonElement>(null);

  const hasActiveFilters =
    !!reasonFilter ||
    !!userFilter ||
    !!dateFrom ||
    !!dateTo ||
    activeTab !== "all";

  // Efecto para cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node) &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }

      if (
        reasonButtonRef.current &&
        !reasonButtonRef.current.contains(event.target as Node) &&
        reasonDropdownRef.current &&
        !reasonDropdownRef.current.contains(event.target as Node)
      ) {
        setShowReasonDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cargar motivos y usuarios con registros
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [reasonsData, usersData] = await Promise.all([
          getAttendanceReasons(),
          getUsersWithAttendanceRecords()
        ]);
        setReasons(reasonsData);
        setUsers(usersData);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filters: any = {};

        if (activeTab === "entries") {
          filters.event_types = ["check-in"];
        } else if (activeTab === "exits") {
          filters.event_types = ["check-out"];
        }

        if (reasonFilter) {
          filters.reason_ids = [reasonFilter];
        }

        if (userFilter) {
          filters.user_id = userFilter;
        }

        if (dateFrom) {
          const startDate = new Date(dateFrom + 'T00:00:00');
          filters.start_date = startDate.toISOString();
        }
        
        if (dateTo) {
          const endDate = new Date(dateTo + 'T23:59:59.999');
          filters.end_date = endDate.toISOString();
        }

        const res = await getAttendanceHistoryAll(
          data.page,
          data.pageSize,
          filters
        );

        setData(res);
      } catch (error) {
        console.error("Error loading attendance history:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [
     data.page,
  data.pageSize,
  reasonFilter,
  userFilter,
  dateFrom,
  dateTo,
  activeTab,
  ]);

  // Filtrar usuarios basado en la búsqueda
    const filteredUsers = users.filter((user) => {
    const searchLower = searchUserQuery.toLowerCase();
    const userName = user.full_name?.toLowerCase() || "";
    const userCode = user.user_code?.toLowerCase() || "";
    const userEmail = user.email?.toLowerCase() || "";

    return (
      userName.includes(searchLower) ||
      userCode.includes(searchLower) ||
      userEmail.includes(searchLower)
    );
  });

  // Filtrar motivos basado en la búsqueda
  const filteredReasons = reasons.filter((reason) => {
    const searchLower = searchReasonQuery.toLowerCase();
    const reasonName = reason.name.toLowerCase();
    const translatedName = reasonTranslations[reasonName] || reasonName;
    const reasonDescription = reason.description?.toLowerCase() || "";

    return (
      reasonName.includes(searchLower) ||
      translatedName.includes(searchLower) ||
      reasonDescription.includes(searchLower)
    );
  });

  // Obtener usuario seleccionado
  const selectedUser = users.find((user) => user.id === userFilter);
  
  // Obtener motivo seleccionado
  const selectedReason = reasons.find((reason) => reason.id === reasonFilter);

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= data.totalPages) {
      setData((prev) => ({ ...prev, page: newPage }));
    }
  };
  //recargar historial
      const loadAttendanceHistory = async (page = data.page) => {
      setLoading(true);

      try {
        const filters: any = {};

        if (activeTab === "entries") {
          filters.event_types = ["check-in"];
        } else if (activeTab === "exits") {
          filters.event_types = ["check-out"];
        }

        if (reasonFilter) {
          filters.reason_ids = [reasonFilter];
        }

        if (userFilter) {
          filters.user_id = userFilter;
        }

        if (dateFrom) {
          const startDate = new Date(dateFrom + "T00:00:00");
          filters.start_date = startDate.toISOString();
        }

        if (dateTo) {
          const endDate = new Date(dateTo + "T23:59:59.999");
          filters.end_date = endDate.toISOString();
        }

        const res = await getAttendanceHistoryAll(
          page,
          data.pageSize,
          filters
        );

        setData(res);
      } catch (error) {
        console.error("Error loading attendance history:", error);
      } finally {
        setLoading(false);
      }
    };
  // CORREGIDO: Ahora limpia completamente las fechas
  const clearFilters = () => {
    setReasonFilter("");
    setUserFilter("");
    setDateFrom(null); // <-- Esto limpia completamente
    setDateTo(null);
    setSearchUserQuery("");
    setSearchReasonQuery("");
    setActiveTab("all");
    setData((prev) => ({ ...prev, page: 1 }));
  };

  const handleUserSelect = (userId: string) => {
    setUserFilter(userId);
    setShowUserDropdown(false);
    setSearchUserQuery("");
    setData((prev) => ({ ...prev, page: 1 }));
  };

  const handleReasonSelect = (reasonId: string) => {
    setReasonFilter(reasonId);
    setShowReasonDropdown(false);
    setSearchReasonQuery("");
    setData((prev) => ({ ...prev, page: 1 }));
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
    if (!showUserDropdown) {
      setTimeout(() => {
        const searchInput = document.querySelector('.user-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  const toggleReasonDropdown = () => {
    setShowReasonDropdown(!showReasonDropdown);
    if (!showReasonDropdown) {
      setTimeout(() => {
        const searchInput = document.querySelector('.reason-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  // Agrupar transacciones por fecha
  const groupTransactionsByDate = (transactions: AttendanceTransaction[]) => {
    const groups: Record<string, { transactions: AttendanceTransaction[], firstDate: Date }> = {};
    
    for (const transaction of transactions) {
      if (!transaction.ocurred_at) continue;
      
      const date = new Date(transaction.ocurred_at);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = { transactions: [], firstDate: date };
      }
      groups[dateKey].transactions.push(transaction);
    }
    
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, { transactions, firstDate }]) => ({
        dateKey,
        date: firstDate,
        transactions,
      }));
  };

  const groupedTransactions = groupTransactionsByDate(data.transactions);

  // Formatear fecha del encabezado del grupo
  const formatGroupDate = (date: Date) => {
    const dayName = format(date, "EEEE", { locale: es });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dateStr = format(date, "d MMM yyyy", { locale: es });
    return { dayName: capitalizedDay, dateStr };
  };

  // Contar entradas y salidas del día
  const countEntriesAndExits = (transactions: AttendanceTransaction[]) => {
    const entries = transactions.filter(t => t.event_type === "check-in").length;
    const exits = transactions.filter(t => t.event_type === "check-out").length;
    return { entries, exits, total: transactions.length };
  };

  return (
    <div className="space-y-6">
      {/* FILTROS PARA MÓVIL */}
      <div className="lg:hidden space-y-4">
        {/* FILTROS EN FILAS SEPARADAS */}
        <div className="space-y-3">
          {/* Fecha Desde */}
          <div className="space-y-1">
            <Label className="text-xs text-custom-text-tertiary">Desde</Label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-custom-text-tertiary absolute left-3" />
                <Input
                  type="date"
                  value={dateFrom ?? ""}
                  onChange={(e) => {
                    setDateFrom(e.target.value || null);
                    setData((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="h-9 pl-10 bg-custom-bg-primary border-custom-border-secondary text-custom-text-primary text-sm w-full"
                />
              </div>
              {dateFrom && (
                <button
                  onClick={() => setDateFrom(null)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-custom-text-tertiary hover:text-custom-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Fecha Hasta */}
          <div className="space-y-1">
            <Label className="text-xs text-custom-text-tertiary">Hasta</Label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-custom-text-tertiary absolute left-3" />
                <Input
                  type="date"
                  value={dateTo ?? ""}
                  min={dateFrom || undefined}
                  onChange={(e) => {
                    setDateTo(e.target.value || null);
                    setData((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="h-9 pl-10 bg-custom-bg-primary border-custom-border-secondary text-custom-text-primary text-sm w-full"
                />
              </div>
              {dateTo && (
                <button
                  onClick={() => setDateTo(null)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-custom-text-tertiary hover:text-custom-text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Fila 2: Usuario */}
          <div className="space-y-1">
            <Label className="text-xs text-custom-text-tertiary">Usuario</Label>
            <div className="relative">
              <button
                type="button"
                onClick={toggleUserDropdown}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium
                           text-custom-text-primary bg-custom-bg-primary border border-custom-border-secondary rounded-lg
                           hover:bg-custom-bg-hover transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <User className="w-4 h-4 text-custom-text-tertiary flex-shrink-0" />
                  <span className="truncate text-left">
                    {selectedUser ? (selectedUser.full_name || selectedUser.email) : "Todos los usuarios"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showUserDropdown && (
                <div
                  ref={userDropdownRef}
                  className="absolute z-50 w-full mt-1 bg-custom-bg-primary border border-custom-border-secondary rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  <div className="sticky top-0 p-2 border-b border-custom-border-secondary bg-custom-bg-primary">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-custom-text-tertiary" />
                      <Input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={searchUserQuery}
                        onChange={(e) => setSearchUserQuery(e.target.value)}
                        className="pl-8 h-8 bg-custom-bg-secondary border-custom-border-secondary text-sm user-search-input w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setUserFilter("");
                        setSearchUserQuery("");
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors ${
                        !userFilter ? "bg-custom-accent-primary/20 text-custom-text-primary" : "text-custom-text-secondary"
                      }`}
                    >
                      <span>Todos los usuarios</span>
                      {!userFilter && <Check className="w-4 h-4 text-custom-accent-primary" />}
                    </button>
                    {filteredUsers.slice(0, 5).map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors truncate ${
                          userFilter === user.id ? "bg-custom-accent-primary/20 text-custom-text-primary" : "text-custom-text-secondary"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{user.full_name || user.email}</span>
                        </div>
                        {userFilter === user.id && <Check className="w-4 h-4 text-custom-accent-primary flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fila 3: Motivo */}
          <div className="space-y-1">
            <Label className="text-xs text-custom-text-tertiary">Motivo</Label>
            <div className="relative">
              <button
                type="button"
                onClick={toggleReasonDropdown}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium
                           text-custom-text-primary bg-custom-bg-primary border border-custom-border-secondary rounded-lg
                           hover:bg-custom-bg-hover transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Clock className="w-4 h-4 text-custom-text-tertiary flex-shrink-0" />
                  <span className="truncate text-left">
                    {selectedReason ? 
                      (reasonTranslations[selectedReason.name.toLowerCase()] || selectedReason.name) 
                      : "Todos los motivos"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showReasonDropdown && (
                <div
                  ref={reasonDropdownRef}
                  className="absolute z-50 w-full mt-1 bg-custom-bg-primary border border-custom-border-secondary rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  <div className="sticky top-0 p-2 border-b border-custom-border-secondary bg-custom-bg-primary">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-custom-text-tertiary" />
                      <Input
                        type="text"
                        placeholder="Buscar motivo..."
                        value={searchReasonQuery}
                        onChange={(e) => setSearchReasonQuery(e.target.value)}
                        className="pl-8 h-8 bg-custom-bg-secondary border-custom-border-secondary text-sm reason-search-input w-full"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setReasonFilter("");
                        setSearchReasonQuery("");
                        setShowReasonDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors ${
                        !reasonFilter ? "bg-custom-accent-primary/20 text-custom-text-primary" : "text-custom-text-secondary"
                      }`}
                    >
                      <span>Todos los motivos</span>
                      {!reasonFilter && <Check className="w-4 h-4 text-custom-accent-primary" />}
                    </button>
                    {filteredReasons.slice(0, 5).map((reason) => {
                      const translatedName = reasonTranslations[reason.name.toLowerCase()] || reason.name;
                      return (
                        <button
                          key={reason.id}
                          onClick={() => handleReasonSelect(reason.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors truncate ${
                            reasonFilter === reason.id ? "bg-custom-accent-primary/20 text-custom-text-primary" : "text-custom-text-secondary"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{translatedName}</span>
                          </div>
                          {reasonFilter === reason.id && <Check className="w-4 h-4 text-custom-accent-primary flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TABS Y CONTADOR DEBAJO DE LOS FILTROS MÓVIL */}
        <div className="space-y-3 pt-2 border-t border-custom-border-secondary">
          {/* TABS CENTRADOS */}
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center bg-custom-bg-secondary border border-custom-border-secondary rounded-lg p-1">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "all"
                    ? "bg-custom-bg-primary text-custom-text-primary shadow-sm"
                    : "text-custom-text-tertiary hover:text-custom-text-primary"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveTab("entries")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "entries"
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-custom-text-tertiary hover:text-custom-text-primary"
                }`}
              >
                Entradas
              </button>
              <button
                onClick={() => setActiveTab("exits")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "exits"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-custom-text-tertiary hover:text-custom-text-primary"
                }`}
              >
                Salidas
              </button>
            </div>
            
            {/* CONTADOR DE REGISTROS MOVIL */}
            <div className="text-sm text-custom-text-tertiary">
              {data.total} registros
              {activeTab === "entries" && " (entradas)"}
              {activeTab === "exits" && " (salidas)"}
            </div>
          </div>

          {/* Botones para móvil */}
          <div className="w-full flex flex-col items-center gap-2">
            {/* Botón refrescar */}
            <button
              onClick={() => loadAttendanceHistory()}
              disabled={loading}
              className="w-full relative inline-flex items-center justify-center gap-2
                px-5 py-2.5
                text-sm font-semibold
                rounded-xl
                border border-custom-border-secondary/60
                bg-custom-bg-secondary
                text-custom-text-primary
                shadow-[0_1px_2px_rgba(0,0,0,0.05)]
                hover:bg-custom-bg-hover
                hover:border-custom-border-primary
                hover:shadow-lg
                active:scale-[0.98]
                transition-all duration-300
                disabled:opacity-60
                disabled:cursor-not-allowed
                group"
            >
              <span className={`transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
              </span>
              <span>{loading ? "Actualizando..." : "Refrescar"}</span>
            </button>
            
            {/* Botón limpiar filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full inline-flex items-center justify-center gap-1 px-4 py-2.5 text-sm
                         font-medium text-custom-text-tertiary hover:text-custom-text-primary 
                         hover:bg-custom-bg-hover rounded-lg transition-colors border border-custom-border-secondary"
              >
                <X className="w-4 h-4" />
                Limpiar todos los filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTROS EN ESCRITORIO */}
      <div className="hidden lg:flex w-full flex-wrap justify-start gap-6">
        {/* Fechas */}
        <div className="space-y-1 w-40">
              <Label className="text-xs text-custom-text-tertiary">Desde</Label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-custom-text-tertiary absolute left-3" />
                  <Input
                    type="date"
                    value={dateFrom ?? ""}
                    onChange={(e) => {
                      setDateFrom(e.target.value || null);
                      setData((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="h-9 pl-10 w-40 bg-custom-bg-secondary border-custom-border-secondary text-custom-text-primary"
                  />
                </div>
                {dateFrom && (
                  <button
                    onClick={() => setDateFrom(null)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-custom-text-tertiary hover:text-custom-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
        </div>

        <div className="space-y-1 w-40">
              <Label className="text-xs text-custom-text-tertiary">Hasta</Label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-custom-text-tertiary absolute left-3" />
                  <Input
                    type="date"
                    value={dateTo ?? ""}
                    min={dateFrom || undefined}
                    onChange={(e) => {
                      setDateTo(e.target.value || null);
                      setData((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="h-9 pl-10 w-40 bg-custom-bg-secondary border-custom-border-secondary text-custom-text-primary"
                  />
                </div>
                {dateTo && (
                  <button
                    onClick={() => setDateTo(null)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-custom-text-tertiary hover:text-custom-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
        </div>

        {/* Usuario */}
          <div className="space-y-1 w-80">
            <Label className="text-xs text-custom-text-tertiary">Usuario</Label>
            <button
              ref={userButtonRef}
              type="button"
              onClick={toggleUserDropdown}
              className="inline-flex items-center justify-between px-3 py-2 text-sm font-medium w-80
                          text-custom-text-primary bg-custom-bg-secondary border border-custom-border-secondary rounded-lg
                          hover:bg-custom-bg-hover transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <User className="w-4 h-4 text-custom-text-tertiary flex-shrink-0" />
                <span className="truncate">
                  {selectedUser ? (selectedUser.full_name || selectedUser.email) : "Todos"}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 flex-shrink-0" />
            </button>
            {showUserDropdown && (
              <div
                ref={userDropdownRef}
                className="absolute w-80 z-50 bg-custom-bg-primary border border-custom-border-secondary rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                <div className="sticky top-0 p-2 border-b border-custom-border-secondary bg-custom-bg-primary">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-custom-text-tertiary" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={searchUserQuery}
                      onChange={(e) => setSearchUserQuery(e.target.value)}
                      className="pl-8 h-8 bg-custom-bg-secondary border-custom-border-secondary text-sm user-search-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserFilter("");
                      setSearchUserQuery("");
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors ${
                      !userFilter ? "bg-custom-accent-primary/20 text-custom-text-primary" : "text-custom-text-secondary"
                    }`}
                  >
                    <span>Todos</span>
                    {!userFilter && <Check className="w-4 h-4 text-custom-accent-primary" />}
                  </button>
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors truncate ${
                        userFilter === user.id ? "bg-custom-accent-primary/20 text-custom-text-primary" : "text-custom-text-secondary"
                      }`}
                    >
                      <span className="truncate">{user.full_name || user.email}</span>
                      {userFilter === user.id && <Check className="w-4 h-4 text-custom-accent-primary flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

            


          {/* Motivo */}
            <div className="space-y-1 w-48">
              <Label className="text-xs text-custom-text-tertiary">Motivo</Label>
              <button
                ref={reasonButtonRef}
                type="button"
                onClick={toggleReasonDropdown}
                className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium w-48
                           text-custom-text-primary bg-custom-bg-secondary border border-custom-border-secondary rounded-lg
                           hover:bg-custom-bg-hover transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Clock className="w-4 h-4 text-custom-text-tertiary flex-shrink-0" />
                  <span className="truncate">
                    {selectedReason ? 
                      (reasonTranslations[selectedReason.name.toLowerCase()] || selectedReason.name) 
                      : "Todos"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>
              {showReasonDropdown && (
              <div
                ref={reasonDropdownRef}
                className="absolute z-50 w-48 mt-1 bg-custom-bg-primary border border-custom-border-secondary rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                <div className="sticky top-0 p-2 border-b border-custom-border-secondary bg-custom-bg-primary">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-custom-text-tertiary" />
                    <Input
                      type="text"
                      placeholder="Buscar..."
                      value={searchReasonQuery}
                      onChange={(e) => setSearchReasonQuery(e.target.value)}
                      className="pl-8 h-8 bg-custom-bg-secondary border-custom-border-secondary text-sm reason-search-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => {
                      setReasonFilter("");
                      setSearchReasonQuery("");
                      setShowReasonDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors ${
                      !reasonFilter ? "bg-custom-accent-primary/20 text-custom-text-primary" : "text-custom-text-secondary"
                    }`}
                  >
                    <span>Todos</span>
                    {!reasonFilter && <Check className="w-4 h-4 text-custom-accent-primary" />}
                  </button>
                  {filteredReasons.map((reason) => {
                    const translatedName = reasonTranslations[reason.name.toLowerCase()] || reason.name;
                    return (
                      <button
                        key={reason.id}
                        onClick={() => handleReasonSelect(reason.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors truncate ${
                          reasonFilter === reason.id ? "bg-custom-accent-primary/20 text-custom-text-primary" : "text-custom-text-secondary"
                        }`}
                      >
                        <span className="truncate">{translatedName}</span>
                        {reasonFilter === reason.id && <Check className="w-4 h-4 text-custom-accent-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            </div>

            
          

          {/* Botones refrescar y limpiar */}
          <div className="self-end flex items-center gap-2">
            {/* Botón refrescar */}
            <button
              onClick={() => loadAttendanceHistory()}
              disabled={loading}
              className="relative inline-flex items-center justify-center gap-2
                px-5 py-2
                text-sm font-semibold
                rounded-xl
                border border-custom-border-secondary/60
                bg-custom-bg-secondary
                text-custom-text-primary
                shadow-[0_1px_2px_rgba(0,0,0,0.05)]
                hover:bg-custom-bg-hover
                hover:border-custom-border-primary
                hover:shadow-lg
                active:scale-[0.98]
                transition-all duration-300
                disabled:opacity-60
                disabled:cursor-not-allowed
                group"
            >
              <span className={`transition-transform duration-500 ${loading ? "animate-spin" : "group-hover:rotate-180"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                </svg>
              </span>
              <span>{loading ? "Actualizando..." : "Refrescar"}</span>
            </button>

            {/* Botón limpiar filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm
                           font-medium text-custom-text-tertiary hover:text-custom-text-primary 
                           hover:bg-custom-bg-hover rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Limpiar
              </button>
            )}
          </div>
           
      </div>
      {/* Segunda fila en escritorio */}
        <div className="hidden lg:flex items-center justify-between pt-3 border-t border-custom-border-secondary">
          <div className="inline-flex items-center bg-custom-bg-secondary border border-custom-border-secondary rounded-lg p-1">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "all"
                  ? "bg-custom-bg-primary text-custom-text-primary shadow-sm"
                  : "text-custom-text-tertiary hover:text-custom-text-primary"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab("entries")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "entries"
                  ? "bg-green-600 text-white shadow-sm"
                  : "text-custom-text-tertiary hover:text-custom-text-primary"
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setActiveTab("exits")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === "exits"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-custom-text-tertiary hover:text-custom-text-primary"
              }`}
            >
              Salidas
            </button>
          </div>

          {/* Contador de registros en escritorio */}
          <div className="text-sm text-custom-text-tertiary">
            {data.total} registros
            {activeTab === "entries" && " (entradas)"}
            {activeTab === "exits" && " (salidas)"}
          </div>
        </div>

      {/* CONTENIDO */}
      {/* Estado de Carga */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 px-4 border-2 border-dashed border-custom-border-secondary/50 rounded-2xl bg-custom-bg-secondary/20">
          <div className="relative flex items-center justify-center mb-4">
            {/* Círculo de fondo animado */}
            <div className="absolute inset-0 rounded-full border-2 border-custom-border-secondary animate-ping opacity-25"></div>
            <div className="relative p-3 bg-custom-bg-secondary rounded-xl shadow-sm border border-custom-border-secondary text-custom-text-primary animate-spin">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>
          </div>
          <p className="text-custom-text-secondary font-medium animate-pulse">
             Cargando registros…
          </p>
        </div>
      )}

      {/* Estado Vacío / Sin resultados */}
      {!loading && data.transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-2 border-dashed border-custom-border-secondary/60 rounded-2xl bg-custom-bg-secondary/10">
          <div className="p-4 bg-custom-bg-secondary rounded-full mb-4 shadow-sm border border-custom-border-secondary text-custom-text-tertiary">
            {hasActiveFilters ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M8 11h6"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M9 16h6"/>
              </svg>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-custom-text-primary mb-1">
            {hasActiveFilters ? "Sin coincidencias" : "Historial vacío"}
          </h3>
          
          <p className="max-w-[280px] text-sm text-custom-text-tertiary">
            {hasActiveFilters
              ? "Prueba ajustando los filtros para encontrar lo que buscas."
              : "Aún no hay registros de asistencia en esta sección."}
          </p>

          {hasActiveFilters && (
            <button 
              onClick={() => /* Función para limpiar filtros */ {}}
              className="mt-6 text-sm font-medium text-custom-text-primary underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!loading && data.transactions.length > 0 && (
        <>
          {/* REGISTROS AGRUPADOS POR FECHA */}
          <div className="space-y-6">
            {groupedTransactions.map((group) => {
              const { dayName, dateStr } = formatGroupDate(group.date);
              const { entries, exits, total } = countEntriesAndExits(group.transactions);
              
              return (
                <div key={group.dateKey} className="space-y-3">
                  <div className="sticky top-[4.5rem]   z-[5]  bg-custom-bg-primary flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pb-2 pt-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-custom-text-tertiary flex-shrink-0" />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-custom-text-primary font-semibold text-sm sm:text-base">
                          {dayName}
                        </span>
                        <span className="text-custom-text-tertiary text-xs sm:text-sm">
                          {dateStr}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:block flex-1 h-px bg-custom-border-secondary" />
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs">
                      <span className="text-custom-text-tertiary">
                        {total} registros
                      </span>
                      <span className="text-custom-text-muted hidden sm:inline">•</span>
                      <span className="text-green-400">{entries} entradas</span>
                      <span className="text-custom-text-muted hidden sm:inline">•</span>
                      <span className="text-red-400">{exits} salidas</span>
                    </div>
                  </div>

                  {/* Items del grupo */}
                  <div className="space-y-2">
                    {group.transactions.map((transaction) => (
                      <div key={transaction.id} className="relative">
                        <AttendanceHistoryItem
                          transaction={transaction}
                          formatTimeFn={formatTimeToAMPM}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINACIÓN */}
          {data.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-custom-border-secondary">
              <div className="text-sm text-custom-text-tertiary text-center sm:text-left">
                Mostrando {(data.page - 1) * data.pageSize + 1} -{" "}
                {Math.min(data.page * data.pageSize, data.total)} de{" "}
                {data.total} registros
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(data.page - 1)}
                  disabled={data.page === 1}
                  className="p-2 rounded-lg border border-custom-border-secondary text-custom-text-tertiary 
                           hover:text-custom-text-primary hover:bg-custom-bg-hover 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    let pageNum;
                    if (data.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (data.page <= 3) {
                      pageNum = i + 1;
                    } else if (data.page >= data.totalPages - 2) {
                      pageNum = data.totalPages - 4 + i;
                    } else {
                      pageNum = data.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-md text-sm ${
                          data.page === pageNum
                            ? "bg-custom-accent-primary text-gray-900 font-semibold"
                            : "text-custom-text-tertiary hover:text-custom-text-primary hover:bg-custom-bg-hover"
                        } transition-colors`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(data.page + 1)}
                  disabled={data.page === data.totalPages}
                  className="p-2 rounded-lg border border-custom-border-secondary text-custom-text-tertiary 
                           hover:text-custom-text-primary hover:bg-custom-bg-hover 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}