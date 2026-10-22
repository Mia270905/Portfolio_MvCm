"use client";

import { useState, useEffect } from "react";
import CompanyCard from "./company-card";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Search,
  Building,
  Layers,
} from "lucide-react";
import { CompanyPagination } from "./company-pagination";
import {
  getCompanies,
  type Company,
  type CompaniesResponse,
} from "@/lib/actions/company.actions";
import { Input } from "@/components/ui/input";
import { DeleteCompanyDialog } from "./delete-company-dialog";
import { Button } from "@/components/ui/button";

interface CompanyListProps {
  userPermissions?: string[];
}

export function CompanyList({ userPermissions = [] }: CompanyListProps) {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [companiesData, setCompaniesData] = useState<CompaniesResponse>({
    companies: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>("root");
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const canCreateCompanies = userPermissions.includes("create:empresas");
  const canUpdateCompanies = userPermissions.includes("update:empresas");
  const canDeleteCompanies = userPermissions.includes("delete:empresas");
  const canReadCompanies = userPermissions.includes("read:empresas");

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (!canReadCompanies) {
        setInitialLoading(false);
        return;
      }

      try {
        setLoading(true);
        const companiesData = await getCompanies(1, 1000, "");

        setAllCompanies(companiesData.companies);

        // Aplicar filtro inicial
        const filtered = applyFilters(companiesData.companies, "root", "");
        setFilteredCompanies(filtered);

        // Configurar paginación inicial
        updatePagination(filtered, 1, 10);
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, [canReadCompanies]);

  // Función para aplicar filtros
  const applyFilters = (
    companies: Company[],
    filter: string,
    query: string
  ) => {
    let filtered = [...companies];

    // Filtro de búsqueda general
    if (query) {
      const searchQuery = query.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchQuery) ||
          (company.rfc && company.rfc.toLowerCase().includes(searchQuery)) ||
          (company.city && company.city.toLowerCase().includes(searchQuery)) ||
          (company.state &&
            company.state.toLowerCase().includes(searchQuery)) ||
          (company.phone && company.phone.toLowerCase().includes(searchQuery))
      );
    }

    // Filtro por tipo de empresa
    if (filter === "root") {
      filtered = filtered.filter((company) => company.parent_company === null);
    }

    return filtered;
  };

  // Función para actualizar paginación
  const updatePagination = (
    filteredCompanies: Company[],
    page: number,
    pageSize: number
  ) => {
    const totalPages = Math.ceil(filteredCompanies.length / pageSize);

    // Asegurar que la página esté dentro de los límites
    let currentPage = page;
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    } else if (currentPage < 1) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    setCompaniesData({
      companies: filteredCompanies.slice(startIndex, endIndex),
      total: filteredCompanies.length,
      page: currentPage,
      pageSize: pageSize,
      totalPages: totalPages,
    });
  };

  // Efecto para el debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      // Resetear a página 1 cuando se busca
      setCompaniesData((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    if (allCompanies.length === 0) return;

    setIsSearching(true);

    const timer = setTimeout(() => {
      const filtered = applyFilters(
        allCompanies,
        companyTypeFilter,
        searchQuery
      );
      setFilteredCompanies(filtered);

      // siempre empezar en página 1 cuando cambian filtros
      updatePagination(filtered, 1, 10);

      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [allCompanies, searchQuery, companyTypeFilter]);

  // cambios de página
  useEffect(() => {
    if (filteredCompanies.length === 0) return;

    updatePagination(filteredCompanies, companiesData.page, 10);
  }, [filteredCompanies, companiesData.page]);

  const getFilterButtonColor = () => {
    switch (companyTypeFilter) {
      case "root":
        return "bg-green-500 hover:bg-green-600 text-white border-green-600";
      default:
        return "bg-amber-500 hover:bg-amber-600 text-white border-amber-600";
    }
  };

  const getFilterIcon = () => {
    switch (companyTypeFilter) {
      case "root":
        return <Building className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  const getFilterLabel = () => {
    switch (companyTypeFilter) {
      case "root":
        return "Solo Empresas Raíz";
      default:
        return "Todas las Empresas";
    }
  };

  // Función para cambiar el filtro
  const handleFilterChange = (filter: string) => {
    setCompanyTypeFilter(filter);
    // La paginación se reseteará en el useEffect porque cambió companyTypeFilter
    setShowFilterMenu(false);
  };

  const handleEdit = (company: Company) => {
    if (canUpdateCompanies) {
      setSelectedCompany(company);
      setIsDialogOpen(true);
    }
  };

  const handleCreate = () => {
    if (canCreateCompanies) {
      setSelectedCompany(null);
      setIsDialogOpen(true);
    }
  };

  const handleSave = async () => {
    try {
      // Recargar todas las empresas después de guardar
      setLoading(true);
      const data = await getCompanies(1, 1000, "");
      setAllCompanies(data.companies);

      // Reaplicar filtros con los nuevos datos
      const filtered = applyFilters(
        data.companies,
        companyTypeFilter,
        searchQuery
      );
      setFilteredCompanies(filtered);
      updatePagination(filtered, 1, 10); // Resetear a página 1
    } catch (error) {
      console.error("Error al recargar empresas:", error);
    } finally {
      setLoading(false);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteClick = (company: Company) => {
    if (canDeleteCompanies) {
      setCompanyToDelete(company);
      setDeleteDialogOpen(true);
    }
  };

  const handleDelete = async (companyId: string) => {
    try {
      // Actualizar listas
      const newAllCompanies = allCompanies.filter(
        (company) => company.id !== companyId
      );
      setAllCompanies(newAllCompanies);

      const newFilteredCompanies = filteredCompanies.filter(
        (company) => company.id !== companyId
      );
      setFilteredCompanies(newFilteredCompanies);

      // Recalcular paginación manteniendo la página actual si es posible
      updatePagination(newFilteredCompanies, companiesData.page, 10);
    } catch (error) {
      console.error("Error al eliminar empresa visualmente:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setCompaniesData((prev) => ({ ...prev, page }));
  };

          // Mostrar skeleton solo para las empresas cuando está cargando
        const renderCompanyList = () => {
          if (loading && initialLoading) {
            return (
              <div className="space-y-3">
                {[...Array(companiesData.pageSize)].map((_, idx) => (
                  <div
                    key={idx}
                    className="animate-pulse bg-white rounded-lg border border-gray-200 p-4 flex gap-3"
                  >
                    <div className="flex gap-3 w-full">
                      {/* Logo / icono */}
                      <div className="h-16 w-16 bg-gray-200 rounded-md" />

                      {/* Texto */}
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          }

          if (companiesData.companies.length === 0 && searchQuery) {
            return (
              <div className="text-center py-8 sm:py-12 px-4">
                <p className="text-gray-600 mb-2 text-sm sm:text-base">
                  No se encontraron empresas que coincidan con “{searchQuery}”
                </p>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            )
          }

          if (companiesData.companies.length === 0 && !searchQuery && !loading) {
            return (
              <div className="text-center py-8 sm:py-12 px-4">
                <p className="text-gray-600 mb-4 text-sm sm:text-base">
                  {companyTypeFilter === "root"
                    ? "No hay empresas raíz registradas"
                    : "No hay empresas registradas"}
                </p>

                {canCreateCompanies && (
                  <Button
                    onClick={handleCreate}
                    className="bg-amber-400 hover:bg-amber-300 text-white"
                  >
                    <Plus size={16} className="mr-2" />
                    Crear Primera Empresa
                  </Button>
                )}
              </div>
            )
          }

          return (
            <div className="space-y-3 mb-6">
              {companiesData.companies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  userPermissions={userPermissions}
                />
              ))}
            </div>
          )
        }
          return (
            <>
              {/* Controles de búsqueda y filtros */}
              <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>

              <Input
                type="text"
                placeholder="Buscar empresas por nombre, RFC, ciudad, estado o teléfono..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                          bg-white text-gray-800
                          focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Filtro */}
            <div className="relative">
              <Button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                className={`flex items-center gap-2 transition-all duration-200
                  bg-white border border-gray-300 text-gray-700
                  hover:bg-gray-100`}
              >
                {getFilterIcon()}
                <span>{getFilterLabel()}</span>
                {showFilterMenu ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              {/* Menú desplegable */}
              {showFilterMenu && (
                <div className="absolute top-full right-0 mt-2 w-64
                                bg-white border border-gray-200
                                rounded-lg shadow-md z-10
                                animate-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handleFilterChange("all")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors
                        ${
                          companyTypeFilter === "all"
                            ? "bg-amber-100 text-amber-700 border border-amber-200"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                      <Layers className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Todas las Empresas</div>
                        <div className="text-xs text-gray-500">
                          Mostrar todas las empresas sin filtro
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleFilterChange("root")}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors
                        ${
                          companyTypeFilter === "root"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                    >
                      <Building className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Solo Empresas Raíz</div>
                        <div className="text-xs text-gray-500">
                          Empresas principales sin padre
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Indicador de búsqueda */}
        {isSearching && (
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-200 border-t-amber-400"></div>
              <span className="text-sm">Buscando empresas...</span>
            </div>
          </div>
        )}

        {/* Información de resultados */}
        {!loading && companiesData.total > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            <div className="flex flex-wrap items-center gap-2">
              <span>
                Mostrando {companiesData.companies.length} de {companiesData.total} empresas
                {companyTypeFilter === "root" && " (raíz)"}
                {searchQuery && ` para "${searchQuery}"`}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">
                Página {companiesData.page} de {companiesData.totalPages}
              </span>
            </div>
          </div>
        )}
    {/* Lista de empresas */}
      {renderCompanyList()}

      {/* Paginación */}
      {!loading && companiesData.totalPages > 1 && (
        <CompanyPagination
          currentPage={companiesData.page}
          totalPages={companiesData.totalPages}
          totalItems={companiesData.total}
          pageSize={companiesData.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Diálogo de eliminación */}
      <DeleteCompanyDialog
        companyId={companyToDelete?.id || ""}
        companyName={companyToDelete?.name || ""}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setCompanyToDelete(null);
          }
        }}
        onDelete={handleDelete}
      />
    </>
  );
}

export type { Company };
