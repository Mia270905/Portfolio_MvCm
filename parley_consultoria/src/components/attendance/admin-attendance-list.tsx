"use client";

import { useEffect, useState, useRef } from "react";
import {
  getAttendanceHistoryAll,
  getAttendanceReasons,
  getUsersWithAttendanceRecords,
  type AttendanceFilters,
} from "@/lib/actions/attendance.actions";
import type {
  AttendanceTransactionsResponse,
  AttendanceReason,
} from "@/lib/actions/attendance.actions";
import AttendanceHistoryItem from "./attendance-history-item";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Search,
  Check,
  ChevronsUpDown,
  Clock,
  Calendar,
} from "lucide-react";

// Opciones de tipos de eventos
const EVENT_TYPE_OPTIONS = [
  { value: "check-in", label: "Entrada" },
  { value: "check-out", label: "Salida" },
];

const reasonTranslations: Record<string, string> = {
  meal: "Comida",
  work_schedule: "Horario laboral",
  permission: "Permiso",
};

export default function AdminAttendanceHistory() {
  const [data, setData] = useState<AttendanceTransactionsResponse>({
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [userNameFilter, setUserNameFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string | null>(() => {
    // Filtrar automáticamente desde hoy por defecto
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [reasons, setReasons] = useState<AttendanceReason[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [searchReasonQuery, setSearchReasonQuery] = useState("");

  // Referencias para los dropdowns
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const reasonDropdownRef = useRef<HTMLDivElement>(null);
  const reasonButtonRef = useRef<HTMLButtonElement>(null);

  const hasActiveFilters =
    eventTypeFilter.length > 0 ||
    !!reasonFilter ||
    !!userFilter ||
    !!userNameFilter ||
    !!dateFrom ||
    !!dateTo;

  // Efecto para cerrar dropdowns al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Para dropdown de usuario
      if (
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node) &&
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }

      // Para dropdown de motivo
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

        if (eventTypeFilter.length > 0) {
          filters.event_types = eventTypeFilter;
        }

        if (reasonFilter) {
          filters.reason_ids = [reasonFilter];
        }

        if (userFilter) {
          filters.user_id = userFilter;
        }

        if (userNameFilter) {
          filters.user_name = userNameFilter;
        }

        // IMPORTANTE: Asegurarse de que las fechas estén en el formato correcto
        if (dateFrom) {
          // Crear fecha al inicio del día
          const fromDate = new Date(dateFrom + 'T00:00:00');
          filters.start_date = fromDate.toISOString().split('T')[0];
        }
        
        if (dateTo) {
          // Crear fecha al final del día
          const toDate = new Date(dateTo + 'T23:59:59');
          filters.end_date = toDate.toISOString().split('T')[0];
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
    eventTypeFilter,
    reasonFilter,
    userFilter,
    userNameFilter,
    dateFrom,
    dateTo,
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= data.totalPages) {
      setData((prev) => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setEventTypeFilter([]);
    setReasonFilter("");
    setUserFilter("");
    setUserNameFilter("");
    // Restaurar fecha desde hoy al limpiar filtros
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDateFrom(today.toISOString().split("T")[0]);
    setDateTo(null);
    setSearchUserQuery("");
    setSearchReasonQuery("");
    setData((prev) => ({ ...prev, page: 1 }));
  };

  const toggleEventType = (value: string) => {
    setEventTypeFilter((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
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

  // Verificar si la fecha desde es hoy
  const isDateFromToday = () => {
    if (!dateFrom) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];
    return dateFrom === todayStr;
  };

  return (
    <div className="space-y-6">
      {/* ESTADÍSTICAS RÁPIDAS - Solo total */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-custom-bg-secondary border border-custom-border-secondary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-custom-text-tertiary text-sm">
                Total de Registros
              </div>
              <div className="text-2xl font-bold text-custom-text-primary">
                {data.total}
              </div>
            </div>
            <div className="text-right">
              <div className="text-custom-text-tertiary text-sm">Página</div>
              <div className="text-lg font-medium text-custom-text-primary">
                {data.page} de {data.totalPages}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                       text-custom-text-primary bg-custom-bg-secondary border border-custom-border-secondary rounded-lg
                       hover:bg-custom-bg-hover transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span
                className="inline-flex items-center justify-center w-5 h-5
                               text-xs font-semibold text-white bg-custom-accent-primary rounded-full"
              >
                {
                  [
                    eventTypeFilter.length > 0,
                    reasonFilter,
                    userFilter,
                    userNameFilter,
                    dateFrom,
                    dateTo,
                  ].filter(Boolean).length
                }
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs
                         font-medium text-custom-text-tertiary hover:bg-custom-bg-hover rounded-md"
            >
              <X className="w-3 h-3" />
              Limpiar todo
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-custom-bg-secondary border border-custom-border-secondary rounded-lg p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* FILTRO POR USUARIO ESPECÍFICO - COMBOBOX */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-custom-text-primary">
                  Usuario específico
                </Label>
                <div className="relative">
                  <button
                    ref={userButtonRef}
                    type="button"
                    onClick={toggleUserDropdown}
                    className="w-full flex items-center justify-between px-3 py-2 bg-custom-bg-primary border border-custom-border-secondary rounded-lg text-custom-text-primary hover:bg-custom-bg-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {selectedUser ? (
                        <>
                          <User className="w-4 h-4 text-custom-text-tertiary" />
                          <span className="truncate">
                            {selectedUser.full_name || selectedUser.email}
                            {selectedUser.user_code && (
                              <span className="text-custom-text-tertiary text-xs ml-1">
                                ({selectedUser.user_code})
                              </span>
                            )}
                          </span>
                        </>
                      ) : (
                        <span className="text-custom-text-tertiary">
                          Seleccionar usuario...
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-custom-text-tertiary" />
                  </button>

                  {/* DROPDOWN DE USUARIO */}
                  {showUserDropdown && (
                    <div
                      ref={userDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-custom-bg-primary border border-custom-border-secondary rounded-lg shadow-lg max-h-60 overflow-auto"
                    >
                      {/* BARRA DE BÚSQUEDA */}
                      <div className="sticky top-0 p-2 border-b border-custom-border-secondary bg-custom-bg-primary">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-custom-text-tertiary" />
                          <Input
                            type="text"
                            placeholder="Buscar usuario..."
                            value={searchUserQuery}
                            onChange={(e) => setSearchUserQuery(e.target.value)}
                            className="pl-10 h-8 bg-custom-bg-secondary border-custom-border-secondary text-sm user-search-input"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* LISTA DE USUARIOS */}
                      <div className="py-1">
                        {filteredUsers.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-custom-text-tertiary">
                            {searchUserQuery
                              ? "No se encontraron usuarios"
                              : "No hay usuarios con registros"}
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => handleUserSelect(user.id)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors ${
                                userFilter === user.id
                                  ? "bg-custom-accent-primary/20 text-custom-text-primary"
                                  : "text-custom-text-secondary"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <User className="w-4 h-4 flex-shrink-0" />
                                <div className="text-left truncate">
                                  <div className="font-medium truncate">
                                    {user.full_name || user.email}
                                  </div>
                                </div>
                              </div>
                              {userFilter === user.id && (
                                <Check className="w-4 h-4 text-custom-accent-primary flex-shrink-0" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTÓN PARA LIMPIAR SELECCIÓN DE USUARIO */}
                {userFilter && (
                  <button
                    onClick={() => {
                      setUserFilter("");
                      setSearchUserQuery("");
                    }}
                    className="mt-2 text-xs text-custom-accent-primary hover:text-custom-accent-secondary flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Limpiar selección
                  </button>
                )}
              </div>

              {/* TIPOS DE EVENTO */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-custom-text-primary">
                  Tipo de Registro
                </Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPE_OPTIONS.map((type) => {
                    const active = eventTypeFilter.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        onClick={() => toggleEventType(type.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          active
                            ? type.value === "check-in"
                              ? "bg-green-600 border-green-500 text-white"
                              : "bg-red-600 border-red-500 text-white"
                            : "bg-custom-bg-primary border-custom-border-secondary text-custom-text-tertiary hover:bg-custom-bg-hover"
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MOTIVO - COMBOBOX */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-custom-text-primary">
                  Motivo
                </Label>
                <div className="relative">
                  <button
                    ref={reasonButtonRef}
                    type="button"
                    onClick={toggleReasonDropdown}
                    className="w-full flex items-center justify-between px-3 py-2 bg-custom-bg-primary border border-custom-border-secondary rounded-lg text-custom-text-primary hover:bg-custom-bg-hover transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {selectedReason ? (
                        <>
                          <Clock className="w-4 h-4 text-custom-text-tertiary" />
                          <span className="truncate">
                            {reasonTranslations[selectedReason.name.toLowerCase()] || selectedReason.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-custom-text-tertiary">
                          Seleccionar motivo...
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-custom-text-tertiary" />
                  </button>

                  {/* DROPDOWN DE MOTIVO */}
                  {showReasonDropdown && (
                    <div
                      ref={reasonDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-custom-bg-primary border border-custom-border-secondary rounded-lg shadow-lg max-h-60 overflow-auto"
                    >
                      {/* BARRA DE BÚSQUEDA */}
                      <div className="sticky top-0 p-2 border-b border-custom-border-secondary bg-custom-bg-primary">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-custom-text-tertiary" />
                          <Input
                            type="text"
                            placeholder="Buscar motivo..."
                            value={searchReasonQuery}
                            onChange={(e) => setSearchReasonQuery(e.target.value)}
                            className="pl-10 h-8 bg-custom-bg-secondary border-custom-border-secondary text-sm reason-search-input"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {/* LISTA DE MOTIVOS */}
                      <div className="py-1">
                        {filteredReasons.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-custom-text-tertiary">
                            {searchReasonQuery
                              ? "No se encontraron motivos"
                              : "No hay motivos disponibles"}
                          </div>
                        ) : (
                          filteredReasons.map((reason) => {
                            const translatedName = reasonTranslations[reason.name.toLowerCase()] || reason.name;
                            return (
                              <button
                                key={reason.id}
                                onClick={() => handleReasonSelect(reason.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-custom-bg-hover transition-colors ${
                                  reasonFilter === reason.id
                                    ? "bg-blue-600/20 text-custom-text-primary border-l-4 border-blue-500"
                                    : "text-custom-text-secondary"
                                }`}
                                title={reason.description || translatedName}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
                                  <div className="text-left truncate">
                                    <div className="font-medium truncate">
                                      {translatedName}
                                    </div>
                                    {reason.description && (
                                      <div className="text-xs text-custom-text-tertiary truncate">
                                        {reason.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {reasonFilter === reason.id && (
                                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                )}
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* BOTÓN PARA LIMPIAR SELECCIÓN DE MOTIVO */}
                {reasonFilter && (
                  <button
                    onClick={() => {
                      setReasonFilter("");
                      setSearchReasonQuery("");
                    }}
                    className="mt-2 text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Limpiar selección
                  </button>
                )}
              </div>

              {/* FECHAS */}
              <div className="space-y-2 lg:col-span-2">
                <Label className="text-sm font-medium text-custom-text-primary">
                  Rango de fechas
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-custom-text-tertiary">
                        Desde
                      </span>
                      {isDateFromToday() && (
                        <span className="text-xs text-custom-accent-primary flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Hoy
                        </span>
                      )}
                    </div>
                    <Input
                      type="date"
                      value={dateFrom ?? ""}
                      onChange={(e) => {
                        setDateFrom(e.target.value || null);
                        setData((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="h-9 bg-custom-bg-primary border-custom-border-secondary text-custom-text-primary"
                    />
                    {isDateFromToday() && (
                      <button
                        onClick={() => {
                          // Quitar filtro de fecha desde (mostrar todas las fechas)
                          setDateFrom(null);
                        }}
                        className="text-xs text-custom-accent-primary hover:text-custom-accent-secondary flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Mostrar todas las fechas
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-custom-text-tertiary">
                      Hasta
                    </span>
                    <Input
                      type="date"
                      value={dateTo ?? ""}
                      min={dateFrom || undefined}
                      onChange={(e) => {
                        setDateTo(e.target.value || null);
                        setData((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="h-9 bg-custom-bg-primary border-custom-border-secondary text-custom-text-primary"
                    />
                    {dateTo && (
                      <button
                        onClick={() => {
                          setDateTo(null);
                        }}
                        className="text-xs text-custom-accent-primary hover:text-custom-accent-secondary flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Limpiar fecha hasta
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Etiquetas de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Filtro de fecha desde */}
            {dateFrom && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 border border-blue-800 rounded-full">
                Desde: {new Date(dateFrom).toLocaleDateString("es-MX")}
                {isDateFromToday() && (
                  <span className="text-blue-200"> (Hoy)</span>
                )}
                <button
                  onClick={() => {
                    // Si es hoy, restaurar filtro de hoy
                    if (isDateFromToday()) {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      setDateFrom(today.toISOString().split("T")[0]);
                    } else {
                      setDateFrom(null);
                    }
                  }}
                  className="hover:bg-blue-800/50 rounded-full p-0.5"
                  title={isDateFromToday() ? "Restaurar filtro de hoy" : "Quitar filtro"}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Filtro de fecha hasta */}
            {dateTo && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-300 bg-purple-900/40 border border-purple-800 rounded-full">
                Hasta: {new Date(dateTo).toLocaleDateString("es-MX")}
                <button
                  onClick={() => setDateTo(null)}
                  className="hover:bg-purple-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Filtro por usuario específico */}
            {userFilter && selectedUser && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-300 bg-green-900/40 border border-green-800 rounded-full">
                <User className="w-3 h-3" />
                {selectedUser.full_name || selectedUser.email}
                <button
                  onClick={() => {
                    setUserFilter("");
                    setSearchUserQuery("");
                  }}
                  className="hover:bg-green-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Filtro por motivo */}
            {reasonFilter && selectedReason && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 border border-blue-800 rounded-full">
                <Clock className="w-3 h-3" />
                {reasonTranslations[selectedReason.name.toLowerCase()] || selectedReason.name}
                <button
                  onClick={() => {
                    setReasonFilter("");
                    setSearchReasonQuery("");
                  }}
                  className="hover:bg-blue-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Filtro por tipo de evento */}
            {eventTypeFilter.map((type) => {
              const typeInfo = EVENT_TYPE_OPTIONS.find(t => t.value === type);
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full border ${
                    type === "check-in"
                      ? "text-green-300 bg-green-900/40 border-green-800"
                      : "text-red-300 bg-red-900/40 border-red-800"
                  }`}
                >
                  {typeInfo?.label}
                  <button
                    onClick={() => toggleEventType(type)}
                    className="hover:opacity-70 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* CONTENIDO */}
      {loading && (
        <div className="text-custom-text-tertiary py-8 text-center">
          Cargando registros…
        </div>
      )}

      {!loading && data.transactions.length === 0 && (
        <div className="text-custom-text-tertiary py-8 text-center border border-custom-border-secondary rounded-lg">
          {hasActiveFilters
            ? "No se encontraron registros con los filtros actuales"
            : "No hay registros de asistencia"}
        </div>
      )}

      {!loading && data.transactions.length > 0 && (
        <>
          <div className="space-y-3">
            {data.transactions.map((transaction) => (
              <AttendanceHistoryItem
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>

          {/* PAGINACIÓN */}
          {data.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-custom-border-secondary">
              <div className="text-sm text-custom-text-tertiary">
                Mostrando {(data.page - 1) * data.pageSize + 1} -{" "}
                {Math.min(data.page * data.pageSize, data.total)} de{" "}
                {data.total} registros
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(data.page - 1)}
                  disabled={data.page === 1}
                  className="p-2 rounded-lg border border-custom-border-secondary text-custom-text-tertiary hover:text-custom-text-primary hover:bg-custom-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1">
                  {(() => {
                    const pages = [];
                    const totalPages = data.totalPages;
                    const currentPage = data.page;

                    pages.push(1);
                    if (currentPage > 2) pages.push(currentPage - 1);
                    if (currentPage !== 1 && currentPage !== totalPages)
                      pages.push(currentPage);
                    if (currentPage < totalPages - 1)
                      pages.push(currentPage + 1);
                    if (totalPages > 1 && !pages.includes(totalPages))
                      pages.push(totalPages);

                    const uniquePages = [...new Set(pages)].sort(
                      (a, b) => a - b
                    );

                    return uniquePages.map((pageNum, index) => (
                      <div key={pageNum} className="flex items-center">
                        {index > 0 && pageNum - uniquePages[index - 1] > 1 && (
                          <span className="text-custom-text-tertiary px-1">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-md text-sm ${
                            data.page === pageNum
                              ? "bg-custom-accent-primary text-gray-900 font-semibold"
                              : "text-custom-text-tertiary hover:text-custom-text-primary hover:bg-custom-bg-hover"
                          } transition-colors`}
                        >
                          {pageNum}
                        </button>
                      </div>
                    ));
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(data.page + 1)}
                  disabled={data.page === data.totalPages}
                  className="p-2 rounded-lg border border-custom-border-secondary text-custom-text-tertiary hover:text-custom-text-primary hover:bg-custom-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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