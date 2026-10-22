"use client";

import { useEffect, useState } from "react";
import { getAttendanceHistory, getAttendanceReasons, type AttendanceFilters } from "@/lib/actions/attendance.actions";
import type { AttendanceTransactionsResponse, AttendanceReason } from "@/lib/actions/attendance.actions";
import AttendanceHistoryItem from "./attendance-history-item";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react";

// Opciones de tipos de eventos
const EVENT_TYPE_OPTIONS = [
  { value: "check-in", label: "Entrada" },
  { value: "check-out", label: "Salida" },
];

const reasonTranslations: Record<string, string> = {
  "meal": "Comida",
  "work_schedule": "Horario laboral",
  "permission": "Permiso",
};

// Agrega la interface de props
interface AttendanceHistoryListProps {
  refreshTrigger?: number;
}

// Recibe las props en la función
export default function AttendanceHistoryList({ refreshTrigger = 0 }: AttendanceHistoryListProps) {
  const [data, setData] = useState<AttendanceTransactionsResponse>({
    transactions: [],
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState<string[]>([]);
  const [reasonFilter, setReasonFilter] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [reasons, setReasons] = useState<AttendanceReason[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = eventTypeFilter.length > 0 || reasonFilter.length > 0 || !!dateFrom || !!dateTo;

  // Cargar motivos disponibles
  useEffect(() => {
    const loadReasons = async () => {
      try {
        const reasonsData = await getAttendanceReasons();
        setReasons(reasonsData);
      } catch (error) {
        console.error("Error loading reasons:", error);
      }
    };
    loadReasons();
  }, []);

  // FETCH data 
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const filters: AttendanceFilters = {};

        if (eventTypeFilter.length > 0) {
          filters.event_types = eventTypeFilter;
        }

        if (reasonFilter.length > 0) {
          filters.reason_ids = reasonFilter;
        }

        if (dateFrom) filters.start_date = dateFrom;
        if (dateTo) filters.end_date = dateTo;

        const res = await getAttendanceHistory(
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
  }, [data.page, data.pageSize, eventTypeFilter, reasonFilter, dateFrom, dateTo, refreshTrigger]); 

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= data.totalPages) {
      setData((prev) => ({ ...prev, page: newPage }));
    }
  };

  const clearFilters = () => {
    setEventTypeFilter([]);
    setReasonFilter([]);
    setDateFrom(null);
    setDateTo(null);
    setData((prev) => ({ ...prev, page: 1 }));
  };

  const toggleEventType = (value: string) => {
    setEventTypeFilter((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
    setData((prev) => ({ ...prev, page: 1 }));
  };

  const toggleReason = (reasonId: string) => {
    setReasonFilter((prev) =>
      prev.includes(reasonId) ? prev.filter((r) => r !== reasonId) : [...prev, reasonId]
    );
    setData((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* FILTROS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium
                       text-gray-200 bg-gray-800 border border-gray-700 rounded-lg
                       hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5
                               text-xs font-semibold text-white bg-blue-600 rounded-full">
                {[eventTypeFilter.length > 0, reasonFilter.length > 0, dateFrom, dateTo].filter(Boolean).length}
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
                         font-medium text-gray-300 hover:bg-gray-700 rounded-md"
            >
              <X className="w-3 h-3" />
              Limpiar todo
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800
                          border border-gray-700 rounded-lg p-4 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* TIPOS DE EVENTO */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Tipo de Registro
                </Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPE_OPTIONS.map((type) => {
                    const active = eventTypeFilter.includes(type.value);
                    return (
                      <button
                        key={type.value}
                        onClick={() => toggleEventType(type.value)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? type.value === "check-in"
                              ? "bg-green-600 border-green-500 text-white"
                              : "bg-red-600 border-red-500 text-white"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MOTIVOS */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Motivo
                </Label>
                <div className="flex flex-wrap gap-2">
                  {reasons.map((reason) => {
                    const active = reasonFilter.includes(reason.id);
                    const translatedName = reasonTranslations[reason.name.toLowerCase()] || reason.name;
                    
                    return (
                      <button
                        key={reason.id}
                        onClick={() => toggleReason(reason.id)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          active
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                        }`}
                        title={reason.description || translatedName}
                      >
                        {translatedName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* FECHAS */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Fechas
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Desde</span>
                    <Input
                      type="date"
                      value={dateFrom ?? ""}
                      onChange={(e) => {
                        setDateFrom(e.target.value || null);
                        setData((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="h-9 bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400">Hasta</span>
                    <Input
                      type="date"
                      value={dateTo ?? ""}
                      min={dateFrom ?? undefined}
                      onChange={(e) => {
                        setDateTo(e.target.value || null);
                        setData((prev) => ({ ...prev, page: 1 }));
                      }}
                      className="h-9 bg-gray-800 border-gray-700 text-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONTENIDO */}
      {loading && <div className="text-gray-400 py-8 text-center">Cargando registros…</div>}

      {!loading && data.transactions.length === 0 && (
        <div className="text-gray-400 py-8 text-center border border-gray-800 rounded-lg">
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
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                Mostrando {((data.page - 1) * data.pageSize) + 1} - {Math.min(data.page * data.pageSize, data.total)} de {data.total} registros
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(data.page - 1)}
                  disabled={data.page === 1}
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    if (currentPage !== 1 && currentPage !== totalPages) pages.push(currentPage);
                    if (currentPage < totalPages - 1) pages.push(currentPage + 1);
                    
                    if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages);
                    
                    const uniquePages = [...new Set(pages)].sort((a, b) => a - b);
                    
                    return uniquePages.map((pageNum, index) => (
                      <div key={pageNum} className="flex items-center">
                        {index > 0 && pageNum - uniquePages[index - 1] > 1 && (
                          <span className="text-gray-600 px-1">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-md text-sm ${
                            data.page === pageNum
                              ? "bg-yellow-500 text-gray-900 font-semibold"
                              : "text-gray-400 hover:text-white hover:bg-gray-800"
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
                  className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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