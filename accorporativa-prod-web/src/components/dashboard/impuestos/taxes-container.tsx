"use client";

import { useState, useEffect } from "react";
import { TaxesTable } from "./taxes-table";
import { TaxPagination } from "./tax-pagination";
import { getAllTaxes, type Tax } from "@/lib/actions/tax.actions";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface TaxesContainerProps {
  userPermissions?: string[];
}

export function TaxesContainer({ userPermissions = [] }: TaxesContainerProps) {
  // Datos completos y filtrados
  const [allTaxes, setAllTaxes] = useState<Tax[]>([]);
  const [filteredTaxes, setFilteredTaxes] = useState<Tax[]>([]);

  // Estados de carga
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Filtros
  const [taxTypeFilter, setTaxTypeFilter] = useState<string>("all");
  const [satTypeFilter, setSatTypeFilter] = useState<string>("all");
  const [generalTypeFilter, setGeneralTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // Cargar todos los impuestos una sola vez al inicio
  useEffect(() => {
    const loadTaxes = async () => {
      try {
        setLoading(true);
        const taxes = await getAllTaxes();
        setAllTaxes(taxes);
        setFilteredTaxes(taxes); // Inicialmente mostrar todos

        // Configurar paginación inicial
        setPagination((prev) => ({
          ...prev,
          total: taxes.length,
          totalPages: Math.ceil(taxes.length / prev.pageSize),
        }));
      } catch (error) {
        console.error("Error al cargar impuestos:", error);
        setAllTaxes([]);
        setFilteredTaxes([]);
      } finally {
        setLoading(false);
      }
    };

    loadTaxes();
  }, []);

  // Función para aplicar todos los filtros
  const applyFilters = () => {
    if (allTaxes.length === 0) {
      setFilteredTaxes([]);
      return;
    }

    let filtered = [...allTaxes];

    // 1. Aplicar búsqueda por texto
    if (searchInput.trim()) {
      const query = searchInput.toLowerCase().trim();
      filtered = filtered.filter(
        (tax) =>
          tax.name.toLowerCase().includes(query) ||
          (tax.description && tax.description.toLowerCase().includes(query)),
      );
    }

    // 2. Aplicar filtro por tipo de cálculo
    if (taxTypeFilter !== "all") {
      filtered = filtered.filter((tax) => tax.tax_type === taxTypeFilter);
    }

    // 3. Aplicar filtro por tipo SAT
    if (satTypeFilter !== "all") {
      filtered = filtered.filter((tax) => tax.sat_tax_type === satTypeFilter);
    }

    // 4. Aplicar filtro por aplicación
    if (generalTypeFilter !== "all") {
      filtered = filtered.filter(
        (tax) => tax.general_type === generalTypeFilter,
      );
    }

    // 5. Aplicar filtro por estado
    if (statusFilter !== "all") {
      const isActiveFilter = statusFilter === "active";
      filtered = filtered.filter((tax) => tax.is_active === isActiveFilter);
    }

    // Actualizar los impuestos filtrados
    setFilteredTaxes(filtered);

    // Actualizar la paginación
    setPagination((prev) => ({
      ...prev,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.pageSize),
      page: 1, // Siempre volver a la primera página al aplicar filtros
    }));
  };

  // Aplicar filtros cuando cambie cualquier criterio
  useEffect(() => {
    applyFilters();
  }, [
    searchInput,
    taxTypeFilter,
    satTypeFilter,
    generalTypeFilter,
    statusFilter,
    allTaxes,
  ]);

  // Obtener los impuestos para la página actual
  const getCurrentPageTaxes = () => {
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredTaxes.slice(startIndex, endIndex);
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setTaxTypeFilter("all");
    setSatTypeFilter("all");
    setGeneralTypeFilter("all");
    setStatusFilter("all");
    setSearchInput("");
  };

  const handleLocalTaxDelete = (taxId: string) => {
    // Actualizar allTaxes
    const updatedAllTaxes = allTaxes.filter((tax) => tax.id !== taxId);
    setAllTaxes(updatedAllTaxes);

    // Actualizar filteredTaxes
    const updatedFilteredTaxes = filteredTaxes.filter(
      (tax) => tax.id !== taxId,
    );
    setFilteredTaxes(updatedFilteredTaxes);

    // Actualizar paginación
    setPagination((prev) => ({
      ...prev,
      total: updatedFilteredTaxes.length,
      totalPages: Math.ceil(updatedFilteredTaxes.length / prev.pageSize),
      page: Math.min(
        prev.page,
        Math.max(1, Math.ceil(updatedFilteredTaxes.length / prev.pageSize)),
      ),
    }));
  };

  const hasActiveFilters =
    taxTypeFilter !== "all" ||
    satTypeFilter !== "all" ||
    generalTypeFilter !== "all" ||
    statusFilter !== "all" ||
    searchInput.trim();

  // Renderizar skeleton loading
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton de la barra de búsqueda */}
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-800 rounded-lg"></div>
            <div className="h-32 bg-gray-800 rounded-lg"></div>
          </div>
        </div>

        {/* Skeleton de la tabla */}
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 overflow-hidden">
          <div className="animate-pulse space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y filtros */}
      <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-4">
        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar impuestos por nombre o descripción..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#0A0F17] border-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Controles de filtros */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-400"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {
                    [
                      taxTypeFilter !== "all",
                      satTypeFilter !== "all",
                      generalTypeFilter !== "all",
                      statusFilter !== "all",
                      searchInput.trim(),
                    ].filter(Boolean).length
                  }
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-1 text-gray-400 hover:text-yellow-400"
              >
                <X className="h-4 w-4" />
                Limpiar todo
              </Button>
            )}
          </div>

          {/* Filtros aplicados */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {searchInput.trim() && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 border border-blue-800 rounded-full">
                  Buscando: "{searchInput}"
                  <button
                    onClick={() => setSearchInput("")}
                    className="hover:bg-blue-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {taxTypeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-300 bg-purple-900/40 border border-purple-800 rounded-full">
                  Tipo:{" "}
                  {taxTypeFilter === "percentage" ? "Porcentaje" : "Monto fijo"}
                  <button
                    onClick={() => setTaxTypeFilter("all")}
                    className="hover:bg-purple-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {satTypeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-300 bg-indigo-900/40 border border-indigo-800 rounded-full">
                  SAT:{" "}
                  {satTypeFilter === "iva"
                    ? "IVA"
                    : satTypeFilter === "isr"
                      ? "ISR"
                      : satTypeFilter === "ieps"
                        ? "IEPS"
                        : "Local"}
                  <button
                    onClick={() => setSatTypeFilter("all")}
                    className="hover:bg-indigo-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {generalTypeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-300 bg-green-900/40 border border-green-800 rounded-full">
                  Aplicación:{" "}
                  {generalTypeFilter === "venta"
                    ? "Venta"
                    : generalTypeFilter === "compras"
                      ? "Compras"
                      : "Ninguno"}
                  <button
                    onClick={() => setGeneralTypeFilter("all")}
                    className="hover:bg-green-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-orange-300 bg-orange-900/40 border border-orange-800 rounded-full">
                  Estado: {statusFilter === "active" ? "Activos" : "Inactivos"}
                  <button
                    onClick={() => setStatusFilter("all")}
                    className="hover:bg-orange-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Panel de filtros expandible */}
          {showFilters && (
            <div className="bg-gray-900 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro por tipo de cálculo */}
                <div className="space-y-2">
                  <Label
                    htmlFor="tax-type-filter"
                    className="text-xs font-semibold text-gray-300"
                  >
                    Tipo de cálculo
                  </Label>
                  <Select
                    value={taxTypeFilter}
                    onValueChange={setTaxTypeFilter}
                  >
                    <SelectTrigger id="tax-type-filter" className="h-10 bg-[#0A0F17] border-gray-800 text-white">
                      <SelectValue placeholder="Todos los tipos" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F17] border-gray-800">
                      <SelectItem value="all" className="text-gray-300">Todos los tipos</SelectItem>
                      <SelectItem value="percentage" className="text-gray-300">Porcentaje</SelectItem>
                      <SelectItem value="fixed_amount" className="text-gray-300">Monto fijo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por tipo SAT */}
                <div className="space-y-2">
                  <Label
                    htmlFor="sat-type-filter"
                    className="text-xs font-semibold text-gray-300"
                  >
                    Tipo SAT
                  </Label>
                  <Select
                    value={satTypeFilter}
                    onValueChange={setSatTypeFilter}
                  >
                    <SelectTrigger id="sat-type-filter" className="h-10 bg-[#0A0F17] border-gray-800 text-white">
                      <SelectValue placeholder="Todos los tipos SAT" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F17] border-gray-800">
                      <SelectItem value="all" className="text-gray-300">Todos los tipos SAT</SelectItem>
                      <SelectItem value="iva" className="text-gray-300">IVA</SelectItem>
                      <SelectItem value="isr" className="text-gray-300">ISR</SelectItem>
                      <SelectItem value="ieps" className="text-gray-300">IEPS</SelectItem>
                      <SelectItem value="local" className="text-gray-300">Local</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por aplicación */}
                <div className="space-y-2">
                  <Label
                    htmlFor="general-type-filter"
                    className="text-xs font-semibold text-gray-300"
                  >
                    Aplicación
                  </Label>
                  <Select
                    value={generalTypeFilter}
                    onValueChange={setGeneralTypeFilter}
                  >
                    <SelectTrigger id="general-type-filter" className="h-10 bg-[#0A0F17] border-gray-800 text-white">
                      <SelectValue placeholder="Todas las aplicaciones" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F17] border-gray-800">
                      <SelectItem value="all" className="text-gray-300">
                        Todas las aplicaciones
                      </SelectItem>
                      <SelectItem value="venta" className="text-gray-300">Venta</SelectItem>
                      <SelectItem value="compras" className="text-gray-300">Compras</SelectItem>
                      <SelectItem value="ninguno" className="text-gray-300">Ninguno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro por estado */}
                <div className="space-y-2">
                  <Label
                    htmlFor="status-filter"
                    className="text-xs font-semibold text-gray-300"
                  >
                    Estado
                  </Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="h-10 bg-[#0A0F17] border-gray-800 text-white">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0A0F17] border-gray-800">
                      <SelectItem value="all" className="text-gray-300">Todos los estados</SelectItem>
                      <SelectItem value="active" className="text-gray-300">Activos</SelectItem>
                      <SelectItem value="inactive" className="text-gray-300">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Información de resultados */}
      {hasActiveFilters && filteredTaxes.length > 0 && (
        <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            Mostrando {filteredTaxes.length} de {allTaxes.length} impuestos
            {searchInput.trim() && ` que coinciden con "${searchInput}"`}
          </p>
        </div>
      )}

      {/* Tabla de impuestos */}
      <div className="bg-[#0A0F17] rounded-lg border border-gray-800 overflow-hidden">
        <TaxesTable
          taxes={getCurrentPageTaxes()}
          onTaxDeleted={handleLocalTaxDelete}
        />
      </div>

      {/* Paginación - Solo mostrar si hay más de una página */}
      {pagination.totalPages > 1 && (
        <TaxPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={filteredTaxes.length}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Contador de resultados */}
      {filteredTaxes.length > 0 && (
        <div className="text-sm text-gray-400 text-center">
          {hasActiveFilters ? (
            <p>
              {filteredTaxes.length === allTaxes.length
                ? "Mostrando todos los impuestos"
                : `Encontrados ${filteredTaxes.length} impuestos${allTaxes.length !== filteredTaxes.length ? ` de ${allTaxes.length} totales` : ""}`}
            </p>
          ) : (
            <p>Total de impuestos: {allTaxes.length}</p>
          )}
        </div>
      )}
    </div>
  );
}
