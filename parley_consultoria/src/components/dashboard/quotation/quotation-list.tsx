"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import Link from "next/link";

interface QuotationListProps {
  userPermissions?: string[];
}

const supabase = createClient();

export function QuotationList({ userPermissions = [] }: QuotationListProps) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const canCreateQuotations = userPermissions.includes("create:quotation");
  const canUpdateQuotations = userPermissions.includes("update:quotation");
  const canDeleteQuotations = userPermissions.includes("delete:quotation");
  const canReadQuotations = userPermissions.includes("read:quotation");

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Simular carga inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Simular búsqueda
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Si no tiene permiso de lectura
  if (!canReadQuotations && !initialLoading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-red-400">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-custom-text-primary mb-2">Acceso restringido</h3>
          <p className="text-custom-text-tertiary">No tienes permisos para ver las cotizaciones.</p>
        </div>
      </div>
    );
  }

  // Mostrar skeleton solo en carga inicial
  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Skeleton de barra de búsqueda */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <div className="h-10 bg-custom-bg-secondary rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-24 bg-gray-800 rounded animate-pulse"></div>
        </div>

        {/* Skeleton de cotizaciones */}
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4"
          >
            <div className="flex items-start gap-4 flex-1">
              {/* Icono */}
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex-shrink-0" />
              
              {/* Contenido */}
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 bg-gray-800 rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-800 rounded"></div>
                  <div className="h-4 w-40 bg-gray-800 rounded"></div>
                </div>
              </div>
            </div>

            {/* Botón de acciones */}
            <div className="h-8 w-20 bg-gray-800 rounded flex-shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  // Mostrar indicador de búsqueda
  if (isSearching && searchQuery) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 text-custom-text-tertiary">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
          <span className="text-sm">Buscando cotizaciones...</span>
        </div>
      </div>
    );
  }

  // Mensaje cuando hay búsqueda sin resultados
  if (searchQuery && !isSearching) {
    return (
      <div className="text-center py-8">
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 max-w-md mx-auto">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
            <Search className="w-6 h-6 text-custom-text-muted" />
          </div>
          <h3 className="text-lg font-medium text-custom-text-primary mb-2">No se encontraron resultados</h3>
          <p className="text-custom-text-tertiary mb-2">
            No hay cotizaciones que coincidan con `&quot;`{searchQuery}`&quot;`
          </p>
          <p className="text-custom-text-muted text-sm">Intenta con otros términos de búsqueda</p>
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
            <Search className="h-5 w-5 text-custom-text-tertiary" />
          </div>
          <input
            type="text"
            placeholder="Buscar cotizaciones por cliente o número..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-custom-bg-secondary border border-custom-border-secondary rounded-lg text-custom-text-primary placeholder-custom-text-muted focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
          />
        </div>
        <button 
          className="px-4 py-2 bg-custom-bg-tertiary text-custom-text-secondary rounded-lg border border-custom-border-secondary hover:bg-gray-700 transition-colors flex items-center gap-2"
          onClick={() => setSearchInput("")}
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </div>

      {/* Estado vacío */}
      <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
          <FileText className="w-10 h-10 text-custom-text-muted" />
        </div>
        
        <h3 className="text-xl font-medium text-custom-text-primary mb-3">No hay cotizaciones</h3>
        <p className="text-custom-text-tertiary mb-6 max-w-md mx-auto">
          Crea tu primera cotización para empezar a gestionar presupuestos y ofertas.
        </p>
        
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-custom-text-muted text-sm">
            <Search className="w-4 h-4" />
            <span>Página en desarrollo - Funcionalidad básica</span>
          </div>
        </div>
        
        {canCreateQuotations ? (
          <Link href="/dashboard/cotizaciones/crear">
            <Button className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg">
              <Plus className="w-5 h-5" />
              Crear Primera Cotización
            </Button>
          </Link>
        ) : (
          <div className="text-sm text-custom-text-tertiary">
            No tienes permisos para crear cotizaciones
          </div>
        )}
      </div>
    </div>
  );
}