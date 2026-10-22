"use client";

import { useEffect, useState } from "react";
import { getMyAppointmentHistory } from "@/lib/actions/appointment.actions";
import type { AppointmentsResponse } from "@/lib/actions/appointment.actions";
import AppointmentHistoryItem from "./appointment-history-item";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AppointmentPagination } from "./appointment-history-pagination";

// IDs de estatus
const STATUS_OPTIONS = [
  { id: "aa68683c-9977-4b6d-8c9c-aad1d3f0500f", label: "Reservada" },
  { id: "7cccd43a-1998-41e9-b70a-61a778106338", label: "Confirmada" },
  { id: "6aa423c3-db95-4633-9e31-a1bb92e16f2c", label: "Cancelada" },
  { id: "6eb8a4c9-d793-411a-a333-7c9c806c25df", label: "Finalizada" },
  { id: "fcd4937a-6f80-4134-87c2-f990dd910139", label: "Perdida" },
];

// helper para fecha default
const nowLocal = () => new Date().toISOString().slice(0, 16);


export function AppointmentHistoryList() {
  const [data, setData] = useState<AppointmentsResponse>({
    appointments: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // array vacío = Todos
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [dateFrom, setDateFrom] = useState<string | null>(nowLocal());
  const [dateTo, setDateTo] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    statusFilter.length > 0 || !!searchQuery || !!dateFrom || !!dateTo;

  // DEBOUNCE BÚSQUEDA
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setData((prev) => ({ ...prev, page: 1 })); // Reset a página 1 al buscar
    }, 300);

    return () => clearTimeout(t);
  }, [searchInput]);

  //FETCH
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filters: any = {};

        if (statusFilter.length > 0) {
          filters.status_ids = statusFilter;
        }
        if (dateFrom) filters.start_date = dateFrom;
        if (dateTo) filters.end_date = dateTo;

        const res = await getMyAppointmentHistory(
          data.page,
          data.pageSize,
          searchQuery,
          filters
        );

        setData(res);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [data.page, data.pageSize, searchQuery, statusFilter, dateFrom, dateTo]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= data.totalPages) {
      setData((prev) => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setDateFrom(null);
    setDateTo(null);
    setSearchInput("");
    setSearchQuery("");
    setData((prev) => ({ ...prev, page: 1 }));
  };

  const toggleStatus = (id: string) => {
    setStatusFilter((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setData((prev) => ({ ...prev, page: 1 })); // Reset a página 1 al cambiar filtros
  };

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                       text-neutral-700 bg-white border border-[#f5efe6] rounded-lg
                       hover:bg-[#f5efe6] transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5
                               text-xs font-semibold text-white bg-[#c6a365] rounded-full">
                {[statusFilter.length > 0, dateFrom, dateTo].filter(Boolean).length}
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
                         font-medium text-neutral-600 hover:bg-[#f5efe6] rounded-md"
            >
              <X className="w-3 h-3" />
              Limpiar todo
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-white border border-[#f5efe6] rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* ESTADOS */}
              <div className="space-y-2 lg:col-span-3">
                <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Estado
                </Label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => {
                    const active = statusFilter.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleStatus(s.id)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? "bg-[#c6a365] border-[#b59555] text-white"
                            : "bg-white border-[#f5efe6] text-neutral-700 hover:bg-[#f5efe6]"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DESDE */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Desde
                </Label>
                <Input
                  type="datetime-local"
                  value={dateFrom ?? ""}
                  onChange={(e) => {
                    setDateFrom(e.target.value || null);
                    setData((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="h-10 bg-white border-[#f5efe6] text-neutral-900"
                />
              </div>

              {/* HASTA */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                  Hasta
                </Label>
                <Input
                  type="datetime-local"
                  value={dateTo ?? ""}
                  min={dateFrom ?? undefined}
                  onChange={(e) => {
                    setDateTo(e.target.value || null);
                    setData((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="h-10 bg-white border-[#f5efe6] text-neutral-900"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BÚSQUEDA */}
      {/* <div className="relative">
        <Input
          type="search"
          placeholder="Buscar en notas de citas..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10 h-11 bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div> */}

      {/* CONTENIDO */}
      {loading && <div className="text-neutral-600 py-8 text-center">Cargando citas…</div>}

      {!loading && data.appointments.length === 0 && (
        <div className="text-neutral-600 py-8 text-center border border-[#f5efe6] rounded-lg bg-white">
          {hasActiveFilters
            ? "No se encontraron citas con los filtros actuales"
            : "No has realizado ninguna cita"}
        </div>
      )}

      {!loading && data.appointments.length > 0 && (
        <>
          <div className="space-y-3">
            {data.appointments.map((appointment) => (
              <AppointmentHistoryItem
                key={appointment.id}
                appointment={appointment}
              />
            ))}
          </div>

          {/* PAGINACIÓN */}
          <AppointmentPagination
            currentPage={data.page}
            totalPages={data.totalPages}
            totalItems={data.total}
            pageSize={data.pageSize}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}