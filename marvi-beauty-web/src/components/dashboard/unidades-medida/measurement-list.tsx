"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import MeasurementItem from "./measurement-item";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import type { MeasurementsResponse } from "@/lib/definitions"; 
import { getMeasurements } from "@/lib/actions/measurement.actions";

interface MeasurementListProps {
  userPermissions?: string[];
}

const supabase = createClient();

export function MeasurementList({ userPermissions = [] }: MeasurementListProps) {
  const [measurementsData, setMeasurementsData] = useState<MeasurementsResponse>({
    measurements: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const canCreateMeasurements = userPermissions.includes("create:measurement");
  const canUpdateMeasurements = userPermissions.includes("update:measurement");
  const canDeleteMeasurements = userPermissions.includes("delete:measurement");
  const canReadMeasurements = userPermissions.includes("read:measurement");

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setMeasurementsData((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Traer datos de Supabase con paginación y búsqueda
  useEffect(() => {
    const fetchMeasurements = async () => {
      if (!canReadMeasurements) {
        setInitialLoading(false);
        return;
      }

      if (searchQuery) {
        setIsSearching(true);
      }

      try {
        const response = await getMeasurements(
          measurementsData.page,
          measurementsData.pageSize,
          searchQuery
        );

        setMeasurementsData(response);
      } catch (error) {
        console.error("Error al obtener unidades de medida:", error);
      } finally {
        if (initialLoading) {
          setInitialLoading(false);
        }
        setIsSearching(false);
      }
    };

    fetchMeasurements();
  }, [measurementsData.page, searchQuery, initialLoading, canReadMeasurements]);

  const handleEdit = (measurement: any) => {
    if (canUpdateMeasurements) {
      // La navegación se maneja en MeasurementItem
    }
  };

  const handleDelete = (measurementId: string) => {
    if (!canDeleteMeasurements) return;

    setMeasurementsData((prev) => ({
      ...prev,
      measurements: prev.measurements.filter((m) => m.id !== measurementId),
      total: prev.total - 1,
      totalPages: Math.ceil((prev.total - 1) / prev.pageSize),
    }));
  };

  const handlePageChange = (page: number) => {
    setMeasurementsData((prev) => ({
      ...prev,
      page,
    }));
  };

  // Si no tiene permiso de lectura
  if (!canReadMeasurements && !initialLoading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6 text-center text-red-400">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
            <Search className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Acceso restringido</h3>
          <p className="text-gray-400">No tienes permisos para ver las unidades de medida.</p>
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
            <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-800 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
        </div>

        {/* Skeleton de barra de búsqueda */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <div className="h-10 bg-[#0A0F17] rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-24 bg-gray-800 rounded animate-pulse"></div>
        </div>

        {/* Skeleton de varias unidades de medida */}
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A0F17] rounded-lg border border-gray-800 p-4"
          >
            <div className="flex items-start gap-4 flex-1">
              {/* Icono */}
              <div className="h-16 w-16 bg-gray-800 rounded-lg flex-shrink-0" />
              
              {/* Contenido */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <div className="h-6 w-32 bg-gray-800 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-gray-800 rounded"></div>
                  <div className="h-4 w-36 bg-gray-800 rounded"></div>
                </div>
                <div className="flex gap-4">
                  <div className="h-3 w-20 bg-gray-800 rounded"></div>
                  <div className="h-3 w-24 bg-gray-800 rounded"></div>
                </div>
              </div>
            </div>

            {/* Botón de acciones */}
            <div className="h-8 w-8 bg-gray-800 rounded flex-shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  if (measurementsData.measurements.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-8 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No hay unidades de medida</h3>
          <p className="text-gray-400 mb-6">Crea la primera unidad de medida para empezar</p>
          {canCreateMeasurements && (
            <Link href="/dashboard/productos/unidades-medida/crear">
              <Button className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg">
                <Plus className="w-5 h-5" />
                Crear Primera Unidad
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por unidad o cantidad..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#070B14] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
          />
        </div>
        <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors flex items-center gap-2">
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </div>

      {/* Mostrar indicador de búsqueda */}
      {isSearching && searchQuery && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
            <span className="text-sm">Buscando unidades de medida...</span>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados de búsqueda */}
      {measurementsData.measurements.length === 0 &&
        searchQuery &&
        !isSearching && (
          <div className="text-center py-8">
            <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-8 max-w-md mx-auto">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
                <Search className="w-6 h-6 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No se encontraron resultados</h3>
              <p className="text-gray-400 mb-2">
                No hay unidades que coincidan con `&quot;`{searchQuery}`&quot;`
              </p>
              <p className="text-gray-500 text-sm">Intenta con otros términos de búsqueda</p>
            </div>
          </div>
        )}

      {/* Lista de unidades de medida */}
      {(!isSearching || !searchQuery) && (
        <div className="space-y-3">
          {measurementsData.measurements.map((measurement) => (
            <MeasurementItem
              key={measurement.id}
              measurement={measurement}
              onEdit={handleEdit}
              onDelete={handleDelete}
              userPermissions={userPermissions}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {measurementsData.totalPages > 1 && !isSearching && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="text-sm text-gray-500">
            Mostrando {measurementsData.measurements.length} de {measurementsData.total} unidades
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(measurementsData.page - 1)}
              disabled={measurementsData.page === 1}
              className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-1 text-sm text-gray-300">
              Página {measurementsData.page} de {measurementsData.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(measurementsData.page + 1)}
              disabled={measurementsData.page === measurementsData.totalPages}
              className="px-3 py-1 text-sm bg-gray-800 text-gray-300 rounded-lg border border-gray-700 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}