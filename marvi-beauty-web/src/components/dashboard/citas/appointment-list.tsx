"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import AppointmentItem from "./appointment-item";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Calendar,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import type {
  Appointment,
  AppointmentsResponse,
} from "@/lib/actions/appointment.actions";
import {
  getAppointments,
  getAppointmentStatuses,
  confirmAppointment,
  cancelAppointmentAdmin,
  completeAppointment,
  markAppointmentAsLost,
  markReenableSpace,
} from "@/lib/actions/appointment.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteAppointmentAvailableDialog } from "./delete-appointment-available-dialog";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { toast } from "sonner";

// Importaciones para el calendario
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

interface AppointmentListProps {
  userPermissions?: string[];
}

interface AppointmentStatus {
  id: string;
  name: string;
  description: string | null;
}

const supabase = createClient();

export function AppointmentList({
  userPermissions = [],
}: AppointmentListProps) {
  const [appointmentsData, setAppointmentsData] =
    useState<AppointmentsResponse>({
      appointments: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);

  // Estados para filtros
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // array vacío = Todos
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Fecha desde - por defecto hoy
  const [dateFromFilter, setDateFromFilter] = useState<string>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  });

  const [dateToFilter, setDateToFilter] = useState<string>("");
  const [statuses, setStatuses] = useState<AppointmentStatus[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<{
    id: string;
    label: string;
  } | null>(null);

  // Estados para la vista de calendario
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appointmentsByDate, setAppointmentsByDate] = useState<
    Record<string, Appointment[]>
  >({});
  const [calendarLoading, setCalendarLoading] = useState(false);

  const canCreateAppointments = userPermissions.includes("create:appointments");
  const canUpdateAppointments = userPermissions.includes("update:appointments");
  const canDeleteAppointments = userPermissions.includes("delete:appointments");
  const canReadAppointments = userPermissions.includes("read:appointments");

  // Cargar datos de filtros
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const statusesData = await getAppointmentStatuses();
        setStatuses(statusesData);
      } catch (error) {
        console.error("Error al cargar estados de citas:", error);
      }
    };

    loadFilterData();
  }, []);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setAppointmentsData((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Cargar citas cuando cambien los filtros
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!canReadAppointments) {
        setInitialLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const filters: any = {};

        if (statusFilter.length > 0) {
          filters.status_id = statusFilter;
        }

        // Siempre aplicar filtro de fecha desde si existe
        if (!!dateFromFilter) {
          filters.start_date = dateFromFilter;
        }

        if (!!dateToFilter) {
          // Sumar 1 día para incluir todas las citas del día "hasta"
          const endDate = new Date(dateToFilter + 'T00:00:00');
          endDate.setDate(endDate.getDate() + 1);
          filters.end_date = endDate.toISOString().split('T')[0];
        }

        const space_owner_user_id = await getCurrentUser();

        if (space_owner_user_id.data) {
          filters.space_owner_user_id = space_owner_user_id.data.user?.id;
        }

        if (space_owner_user_id.error) {
          toast.error("Error al conseguir el usuario con sesión iniciada");
          setHasErrors(true);
          return;
        }

        const response = await getAppointments(
          appointmentsData.page,
          appointmentsData.pageSize,
          searchQuery,
          filters
        );

        setAppointmentsData(response);
      } catch (error) {
        console.error("Error al obtener citas:", error);
      } finally {
        if (initialLoading) {
          setInitialLoading(false);
        }
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, [
    appointmentsData.page,
    searchQuery,
    statusFilter,
    dateFromFilter,
    dateToFilter,
    initialLoading,
    canReadAppointments,
  ]);

  // Cargar citas para el mes actual cuando cambie la vista a calendario
  useEffect(() => {
    if (viewMode === "calendar" && canReadAppointments) {
      loadAppointmentsForMonth();
    }
  }, [currentMonth, viewMode, canReadAppointments]);

  const loadAppointmentsForMonth = async () => {
    try {
      setCalendarLoading(true);

      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const space_owner_user_id = await getCurrentUser();

      const filters: any = {
        start_date: monthStart.toISOString().split("T")[0],
        end_date: monthEnd.toISOString().split("T")[0],
      };

      if (space_owner_user_id.data) {
        filters.space_owner_user_id = space_owner_user_id.data.user?.id;
      }

      // Obtener todas las citas del mes (sin paginación y sin filtros de búsqueda)
      // El calendario debe mostrar todas las citas del mes visible, independientemente de los filtros de la lista
      const response = await getAppointments(
        1,
        1000, // Número grande para traer todas
        "", // Sin búsqueda en el calendario
        filters
      );

      processAppointmentsForCalendar(response.appointments);
    } catch (error) {
      console.error("Error al cargar citas para calendario:", error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const processAppointmentsForCalendar = (appointments: Appointment[]) => {
    const groupedByDate: Record<string, Appointment[]> = {};

    appointments.forEach((appointment) => {
      if (!appointment.appointment_datetime) return;

      const dateStr = format(
        parseISO(appointment.appointment_datetime),
        "yyyy-MM-dd"
      );

      if (!groupedByDate[dateStr]) {
        groupedByDate[dateStr] = [];
      }

      groupedByDate[dateStr].push(appointment);
    });

    setAppointmentsByDate(groupedByDate);
  };

  const handleEdit = (appointment: any) => {
    if (canUpdateAppointments) {
      // La navegación se maneja en AppointmentItem
    }
  };

  const handleDeleteConfirmed = (appointmentId: string) => {
    setAppointmentsData((prev) => ({
      ...prev,
      appointments: prev.appointments.filter((a) => a.id !== appointmentId),
      total: Math.max(prev.total - 1, 0),
      totalPages: Math.ceil(Math.max(prev.total - 1, 0) / prev.pageSize),
    }));

    // Actualizar calendario también
    if (viewMode === "calendar") {
      loadAppointmentsForMonth();
    }
  };

  const handleDeleteClick = (appointment: Appointment) => {
    if (!canDeleteAppointments) return;
    if (appointment.appointment_datetime === null) return;

    const label = new Date(appointment.appointment_datetime).toLocaleString(
      "es-MX",
      {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    );

    setSelectedAppointment({
      id: appointment.id,
      label,
    });

    setDeleteDialogOpen(true);
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const result = await confirmAppointment(appointmentId);

      if (result.success) {
        // Revalidar datos
        setAppointmentsData((prev) => ({
          ...prev,
          appointments: prev.appointments.map((app) =>
            app.id === appointmentId
              ? { ...app, status_id: "7cccd43a-1998-41e9-b70a-61a778106338" } // ID de confirmada
              : app
          ),
        }));

        if (viewMode === "calendar") {
          loadAppointmentsForMonth();
        }
      }

      return result;
    } catch (error) {
      console.error("AppointmentList: Error:", error);
      throw error;
    }
  };

  const handleCancelAppointment = async (
    appointmentId: string,
    reason?: string
  ) => {
    return await cancelAppointmentAdmin(appointmentId, reason);
  };

  const handleCompleteAppointment = async (
    appointmentId: string,
    notes?: string
  ) => {
    try {
      const result = await completeAppointment(appointmentId, notes);

      if (result.success) {
        // Revalidar datos
        setAppointmentsData((prev) => ({
          ...prev,
          appointments: prev.appointments.map((app) =>
            app.id === appointmentId
              ? { ...app, status_id: "6eb8a4c9-d793-411a-a333-7c9c806c25df" }
              : app
          ),
        }));

        if (viewMode === "calendar") {
          loadAppointmentsForMonth();
        }
      }

      return result;
    } catch (error) {
      console.error("AppointmentList: Error al finalizar:", error);
      throw error;
    }
  };

  const handleMarkAsLostAppointment = async (
    appointmentId: string,
    notes?: string
  ) => {
    try {
      const result = await markAppointmentAsLost(appointmentId, notes);

      if (result.success) {
        // Revalidar datos
        setAppointmentsData((prev) => ({
          ...prev,
          appointments: prev.appointments.map((app) =>
            app.id === appointmentId
              ? { ...app, status_id: "fcd4937a-6f80-4134-87c2-f990dd910139" } // ID de PERDIDA
              : app
          ),
        }));

        if (viewMode === "calendar") {
          loadAppointmentsForMonth();
        }
      }

      return result;
    } catch (error) {
      console.error("AppointmentList: Error al marcar como perdida:", error);
      throw error;
    }
  };

  const handleReenableAppointment = async (
    appointmentId: string,
    notes?: string
  ) => {
    try {
      const result = await markReenableSpace(appointmentId, notes);

      if (result.success) {
        // Revalidar datos
        setAppointmentsData((prev) => ({
          ...prev,
          appointments: prev.appointments.filter(
            (app) => app.id !== appointmentId
          ),
        }));

        if (viewMode === "calendar") {
          loadAppointmentsForMonth();
        }
      }

      return result;
    } catch (error) {
      console.error("AppointmentList: Error al habilitar el espacio:", error);
      throw error;
    }
  };

  const handlePageChange = (page: number) => {
    setAppointmentsData((prev) => ({
      ...prev,
      page,
    }));
  };

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split("T")[0];
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter([]);
    setDateToFilter("");
    setDateFromFilter("");
  };

  // Verifica si hay filtros activos
  const hasActiveFilters =
    searchQuery || statusFilter.length > 0 || dateToFilter || dateFromFilter || (dateFromFilter && dateFromFilter !== "");

  const getStatusDescription = (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    return status?.description || status?.name || "Desconocido";
  };

  const toggleStatus = (id: string) => {
    setStatusFilter((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setAppointmentsData((prev) => ({ ...prev, page: 1 })); // Reset a página 1 al cambiar filtros
  };

  // Funciones para el calendario
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);

    // Convertir a string usando componentes locales para evitar timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Si hay filtro "desde" y la fecha seleccionada es anterior
    if (dateFromFilter && dateStr < dateFromFilter) {
      // Invertir: la fecha seleccionada se convierte en "desde"
      // y el "desde" anterior se convierte en "hasta"
      setDateFromFilter(dateStr);
      setDateToFilter(dateFromFilter);
    } else {
      // Caso normal: actualizar solo "hasta"
      setDateToFilter(dateStr);
    }
  };

  // Generar calendario mensual
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });
    
    // Normalizar fechas a hora local para evitar timezone issues
    return days.map(date => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      return new Date(year, month, day, 12, 0, 0);
    });
  };

  const getAppointmentsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return appointmentsByDate[dateStr] || [];
  };

  // Agrupar citas por fecha para la vista de lista
  const groupAppointmentsByDate = (appointments: Appointment[]) => {
    const groups: Record<string, { appointments: Appointment[], firstDate: Date }> = {};
    
    for (const appointment of appointments) {
      if (!appointment.appointment_datetime) continue;
      
      const date = new Date(appointment.appointment_datetime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = { appointments: [], firstDate: date };
      }
      groups[dateKey].appointments.push(appointment);
    }
    
    // Ordenar por fecha ascendente
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, { appointments, firstDate }]) => ({
        dateKey,
        date: firstDate,
        appointments,
      }));
  };

  // Formatear fecha del encabezado del grupo
  const formatGroupDate = (date: Date) => {
    const dayName = format(date, "EEEE", { locale: es });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const dateStr = format(date, "d 'de' MMMM", { locale: es });
    return { dayName: capitalizedDay, dateStr };
  };

  // Verificar si una fecha es hoy
  const isDateToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const groupedAppointments = groupAppointmentsByDate(appointmentsData.appointments);

  {
    /* Errores de carga */
  }
  if (hasErrors && !initialLoading) {
    return (
      <div className="text-center py-8 px-4">
        <div className="bg-custom-bg-secondary rounded-lg border border-red-800 p-6 text-red-400">
          <h3 className="text-lg font-medium text-custom-text-primary mb-2">
            Error al cargar información
          </h3>
          <p>
            Ocurrió un error al cargar las citas. Recargue la página o intente
            más tarde.
          </p>
        </div>
      </div>
    );
  }

  // Si no tiene permiso de lectura
  if (!canReadAppointments && !initialLoading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-red-400">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-custom-text-primary mb-2">
            Acceso restringido
          </h3>
          <p className="text-custom-text-secondary">
            No tienes permisos para ver las citas.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar skeleton solo en carga inicial
  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Skeleton de header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-custom-bg-hover rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-custom-bg-hover rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-custom-bg-hover rounded animate-pulse"></div>
            <div className="h-10 w-10 bg-custom-bg-hover rounded animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton de barra de búsqueda */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <div className="h-10 bg-custom-bg-secondary rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-24 bg-custom-bg-hover rounded animate-pulse"></div>
        </div>

        {/* Skeleton de varias citas */}
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4"
          >
            <div className="flex items-start gap-4 flex-1">
              {/* Icono */}
              <div className="h-16 w-16 bg-custom-bg-hover rounded-lg flex-shrink-0" />

              {/* Contenido */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <div className="h-6 w-32 bg-custom-bg-hover rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-custom-bg-hover rounded"></div>
                  <div className="h-4 w-36 bg-custom-bg-hover rounded"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-3 w-20 bg-custom-bg-hover rounded"></div>
                  <div className="h-3 w-24 bg-custom-bg-hover rounded"></div>
                </div>
              </div>
            </div>

            {/* Botón de acciones */}
            <div className="h-8 w-8 bg-custom-bg-hover rounded flex-shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  if (
    appointmentsData.appointments.length === 0 &&
    !hasActiveFilters &&
    viewMode === "list"
  ) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
            <Calendar className="w-8 h-8 text-custom-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-custom-text-primary mb-2">No hay citas</h3>
          <p className="text-custom-text-secondary mb-6">
            Crea la primera cita para empezar
          </p>
          {canCreateAppointments && (
            <Link href="/dashboard/citas/gestion/crear">
              <Button className="inline-flex items-center gap-2 px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 font-medium rounded-lg">
                <Plus className="w-5 h-5" />
                Crear Primera Cita
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botones de vista y botón para crear cita */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Botones de vista solo en desktop - Ahora a la derecha */}
        <div className="hidden sm:flex items-center gap-3 ml-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg border transition-colors ${
                viewMode === "list"
                  ? "bg-custom-accent-primary/30 border-custom-accent-primary text-custom-accent-primary"
                  : "bg-custom-bg-hover border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover"
              }`}
              title="Vista de lista"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2 rounded-lg border transition-colors ${
                viewMode === "calendar"
                  ? "bg-custom-accent-primary/30 border-custom-accent-primary text-custom-accent-primary"
                  : "bg-custom-bg-hover border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover"
              }`}
              title="Vista de calendario"
            >
              <CalendarDays className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros - Solo mostrar en vista lista */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-3">
          {/* Barra de búsqueda */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-custom-text-secondary" />
              </div>
              <input
                type="text"
                placeholder="Buscar por cliente, email, teléfono o notas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-custom-bg-tertiary border border-custom-border-primary rounded-lg text-custom-text-primary placeholder-custom-text-muted focus:outline-none focus:border-custom-accent-primary focus:ring-2 focus:ring-custom-accent-primary focus:ring-opacity-50"
              />
            </div>

            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-custom-bg-hover text-custom-text-secondary rounded-lg border border-custom-border-primary hover:bg-custom-bg-hover transition-colors flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-custom-accent-primary rounded-full">
                  {
                    [
                      searchQuery,
                      statusFilter.length > 0,
                      dateToFilter,
                      dateFromFilter,
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
          </div>

          {/* Filtros activos - MEJORADOS con colores más vibrantes */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {/* Búsqueda */}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-custom-accent-primary bg-custom-accent-primary/20 border border-custom-accent-primary/40 rounded-full">
                  Búsqueda: {searchQuery}
                  <button
                    onClick={() => setSearchInput("")}
                    className="hover:bg-custom-accent-primary/30 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Filtro "Desde" - MEJORADO */}
              {dateFromFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-400 bg-blue-500/20 border border-blue-500/40 rounded-full">
                  Desde:{" "}
                  {new Date(dateFromFilter + "T00:00:00").toLocaleDateString(
                    "es-ES",
                    {
                      timeZone: "America/Mexico_City",
                    }
                  )}
                  <button
                    onClick={() => {
                      // Quitar filtro de fecha
                      setDateFromFilter("");
                    }}
                    className="hover:bg-blue-500/30 rounded-full p-0.5"
                    title="Mostrar todas las citas"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Filtro "Hasta" - MEJORADO */}
              {dateToFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-400 bg-purple-500/20 border border-purple-500/40 rounded-full">
                  Hasta:{" "}
                  {new Date(dateToFilter + "T12:00:00").toLocaleDateString(
                    "es-ES"
                  )}
                  <button
                    onClick={() => setDateToFilter("")}
                    className="hover:bg-purple-500/30 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Filtros de estado activos - NUEVO */}
              {statusFilter.length > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-400 bg-green-500/20 border border-green-500/40 rounded-full">
                  Estados: {statusFilter.length} seleccionados
                  <button
                    onClick={() => setStatusFilter([])}
                    className="hover:bg-green-500/30 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {/* Botón "Limpiar todo" - MEJORADO */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-custom-text-secondary hover:text-custom-text-primary hover:bg-custom-bg-hover rounded-md transition-colors"
                >
                  <X className="w-3 h-3" />
                  Limpiar todo
                </button>
              )}
            </div>
          )}

          {/* Panel de filtros expandible - MEJORADO */}
          {showFilters && (
            <div className="bg-gradient-to-br from-custom-bg-tertiary to-custom-bg-hover border border-custom-border-primary rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro por Estado - MEJORADO */}
                <div className="space-y-2 lg:col-span-3">
                  <Label className="text-xs font-semibold text-custom-text-secondary uppercase tracking-wide">
                    Estado
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((s) => {
                      const active = statusFilter.includes(s.id);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleStatus(s.id)}
                          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                            active
                              ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                              : "bg-custom-bg-hover border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-tertiary"
                          }`}
                        >
                          {s.description || s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filtro por Fecha Desde - MEJORADO */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="date-from-filter"
                      className="text-xs font-semibold text-custom-text-secondary uppercase tracking-wide"
                    >
                      Desde
                    </Label>
                    {dateFromFilter === getTodayDate() && (
                      <span className="text-xs text-custom-accent-primary">✓ Hoy</span>
                    )}
                  </div>
                  <Input
                    id="date-from-filter"
                    type="date"
                    value={dateFromFilter}
                    onChange={(e) => setDateFromFilter(e.target.value)}
                    className="h-10 bg-custom-bg-tertiary border-custom-border-primary hover:border-custom-accent-primary transition-colors text-custom-text-primary [color-scheme:dark]"
                  />
                </div>

                {/* Filtro por Fecha Hasta - MEJORADO */}
                <div className="space-y-2">
                  <Label
                    htmlFor="date-to-filter"
                    className="text-xs font-semibold text-custom-text-secondary uppercase tracking-wide"
                  >
                    Hasta
                  </Label>
                  <Input
                    id="date-to-filter"
                    type="date"
                    value={dateToFilter}
                    onChange={(e) => setDateToFilter(e.target.value)}
                    className="h-10 bg-custom-bg-tertiary border-custom-border-primary hover:border-custom-accent-primary transition-colors text-custom-text-primary [color-scheme:dark]"
                    min={dateFromFilter}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vista de Calendario - Solo en desktop */}
      {viewMode === "calendar" && (
        <div className="hidden sm:block space-y-4">
          {/* Controles del calendario */}
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-custom-text-primary flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-custom-accent-primary" />
                {format(currentMonth, "MMMM yyyy", { locale: es })}
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 bg-custom-bg-hover text-custom-text-secondary rounded-lg border border-custom-border-primary hover:bg-custom-bg-hover transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToday}
                  className="px-4 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 font-medium rounded-lg text-sm"
                >
                  Hoy
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 bg-custom-bg-hover text-custom-text-secondary rounded-lg border border-custom-border-primary hover:bg-custom-bg-hover transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-1 mt-4 mb-2">
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-custom-text-secondary py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid del calendario */}
            {calendarLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {[...Array(35)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-24 bg-custom-bg-hover/50 rounded-lg animate-pulse"
                  ></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((date) => {
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  const isSelected =
                    selectedDate && isSameDay(date, selectedDate);
                  const isTodayDate = isToday(date);
                  const dateAppointments = getAppointmentsForDate(date);
                  const appointmentCount = dateAppointments.length;
                  const hasAppointments = appointmentCount > 0;

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateClick(date)}
                      className={`
                      h-24 rounded-lg flex flex-col items-center justify-center p-1.5 transition-all relative
                      ${!isCurrentMonth ? "opacity-30" : ""}
                      ${
                        isSelected
                          ? "bg-custom-accent-primary/20 border-2 border-custom-accent-primary"
                          : "bg-custom-bg-hover hover:bg-custom-bg-hover"
                      }
                      ${isTodayDate ? "ring-1 ring-custom-accent-primary" : ""}
                    `}
                    >
                      {/* Número del día */}
                      <span
                        className={`
                        absolute top-1 left-1 text-sm font-semibold
                        ${isTodayDate ? "text-custom-accent-primary" : "text-custom-text-primary"}
                        ${!isCurrentMonth ? "text-custom-text-disabled" : ""}
                      `}
                      >
                        {format(date, "d")}
                      </span>

                      {/* Punto azul con número cuando hay citas */}
                      {hasAppointments && (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                            <span className="text-white text-xs font-bold">
                              {appointmentCount > 9 ? "9+" : appointmentCount}
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detalles del día seleccionado */}
          {selectedDate && (
            <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4">
              <h3 className="text-lg font-semibold text-custom-text-primary mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-custom-accent-primary" />
                Citas para{" "}
                {format(selectedDate, "EEEE d 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
                {isToday(selectedDate) && (
                  <span className="ml-2 px-2 py-1 bg-custom-accent-primary/20 text-custom-accent-primary text-xs font-medium rounded-full">
                    Hoy
                  </span>
                )}
              </h3>

              {getAppointmentsForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-custom-text-secondary">No hay citas para este día</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {getAppointmentsForDate(selectedDate).map((appointment) => (
                    <AppointmentItem
                      key={appointment.id}
                      appointment={appointment}
                      onEdit={handleEdit}
                      onDelete={() => handleDeleteClick(appointment)}
                      onConfirm={handleConfirmAppointment}
                      onCancel={handleCancelAppointment}
                      onComplete={handleCompleteAppointment}
                      onMarkAsLost={handleMarkAsLostAppointment}
                      onReenable={handleReenableAppointment}
                      userPermissions={userPermissions}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mostrar mensaje cuando se selecciona calendario en móvil */}
      {viewMode === "calendar" && (
        <div className="sm:hidden text-center py-8">
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-custom-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-custom-text-primary mb-2">
              Vista de Calendario
            </h3>
            <p className="text-custom-text-secondary mb-4">
              La vista de calendario solo está disponible en dispositivos de
              escritorio.
            </p>
            <Button
              onClick={() => setViewMode("list")}
              className="bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900"
            >
              Volver a Vista de Lista
            </Button>
          </div>
        </div>
      )}

      {/* Mostrar indicador de carga en vista lista */}
      {viewMode === "list" && isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-custom-text-secondary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-custom-accent-primary"></div>
            <span className="text-sm">Cargando citas...</span>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados en vista lista */}
      {viewMode === "list" &&
        appointmentsData.appointments.length === 0 &&
        hasActiveFilters &&
        !isLoading && (
          <div className="text-center py-8">
            <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 max-w-md mx-auto">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
                <Search className="w-6 h-6 text-custom-text-muted" />
              </div>
              <h3 className="text-lg font-medium text-custom-text-primary mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-custom-text-secondary mb-2">
                No hay citas que coincidan con los filtros aplicados
              </p>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="mt-2 text-sm bg-transparent"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}

      {/* Lista de citas en vista lista - agrupadas por fecha */}
      {viewMode === "list" &&
        !isLoading &&
        appointmentsData.appointments.length > 0 && (
          <div className="space-y-6">
            {groupedAppointments.map((group) => {
              const { dayName, dateStr } = formatGroupDate(group.date);
              const isTodayGroup = isDateToday(group.date);
              
              return (
                <div key={group.dateKey} className="space-y-3">
                  {/* Header del grupo de fecha */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-custom-text-primary">
                        {dayName}
                      </span>
                      <span className="text-sm text-custom-text-secondary">
                        {dateStr}
                      </span>
                      {isTodayGroup && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-custom-accent-primary/20 text-custom-accent-primary rounded-full">
                          Hoy
                        </span>
                      )}
                    </div>
                    <div className="flex-1 h-px bg-custom-border-secondary" />
                    <span className="text-xs text-custom-text-secondary">
                      {group.appointments.length} {group.appointments.length === 1 ? 'cita' : 'citas'}
                    </span>
                  </div>
                  
                  {/* Citas del día */}
                  <div className="space-y-2">
                    {group.appointments.map((appointment) => (
                      <AppointmentItem
                        key={appointment.id}
                        appointment={appointment}
                        onEdit={handleEdit}
                        onDelete={() => handleDeleteClick(appointment)}
                        onConfirm={handleConfirmAppointment}
                        onCancel={handleCancelAppointment}
                        onComplete={handleCompleteAppointment}
                        onMarkAsLost={handleMarkAsLostAppointment}
                        onReenable={handleReenableAppointment}
                        userPermissions={userPermissions}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      
      {/* Paginación solo para vista lista */}
      {viewMode === "list" && appointmentsData.totalPages > 1 && !isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-custom-border-secondary">
          <div className="text-sm text-custom-text-secondary">
            Mostrando {appointmentsData.appointments.length} de{" "}
            {appointmentsData.total} citas
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(appointmentsData.page - 1)}
              disabled={appointmentsData.page === 1}
              className="px-3 py-1 text-sm bg-custom-bg-hover text-custom-text-secondary rounded-lg border border-custom-border-primary hover:bg-custom-bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-custom-text-secondary">
              Página {appointmentsData.page} de {appointmentsData.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(appointmentsData.page + 1)}
              disabled={appointmentsData.page === appointmentsData.totalPages}
              className="px-3 py-1 text-sm bg-custom-bg-hover text-custom-text-secondary rounded-lg border border-custom-border-primary hover:bg-custom-bg-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
      {selectedAppointment && (
        <DeleteAppointmentAvailableDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          appointmentId={selectedAppointment.id}
          appointmentDatetimeLabel={selectedAppointment.label}
          labelToDelete={"eliminar"}
          onDelete={handleDeleteConfirmed}
        />
      )}
    </div>
  );
}