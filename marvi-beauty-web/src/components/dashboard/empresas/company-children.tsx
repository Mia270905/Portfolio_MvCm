"use client";

import { useState, useEffect } from "react";
import CompanyCard from "./company-card";
import { Plus, Search, Building2 } from "lucide-react";
import { Company, getCompanyById, getAllCompanies } from "@/lib/actions/company.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CompanyPagination } from "./company-pagination";

interface CompanyChildrenProps {
  companyId: string;
  userPermissions?: string[];
}

export function CompanyChildren({ companyId, userPermissions = [] }: CompanyChildrenProps) {
  const [childCompanies, setChildCompanies] = useState<Company[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [parentCompanyName, setParentCompanyName] = useState("");

  const canUpdateCompanies = userPermissions.includes("update:empresas");
  const canDeleteCompanies = userPermissions.includes("delete:empresas");
  const canCreateCompanies = userPermissions.includes("create:empresas");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar empresa padre para obtener su nombre
        const parentCompany = await getCompanyById(companyId);
        if (parentCompany) {
          setParentCompanyName(parentCompany.name);
        }
        
        // Cargar todas las empresas
        const allCompanies = await getAllCompanies();
        
        // Filtrar empresas hijas (donde parent_company === companyId)
        const children = allCompanies.filter(
          (company) => company.parent_company === companyId
        );
        
        setChildCompanies(children);
        setFilteredChildren(children);
      } catch (error) {
        console.error("Error al cargar empresas hijas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      loadData();
    }
  }, [companyId]);

  // Filtrar empresas hijas
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChildren(childCompanies);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = childCompanies.filter(
      (company) =>
        company.name.toLowerCase().includes(query) ||
        (company.rfc && company.rfc.toLowerCase().includes(query)) ||
        (company.city && company.city.toLowerCase().includes(query)) ||
        (company.state && company.state.toLowerCase().includes(query))
    );
    setFilteredChildren(filtered);
    setCurrentPage(1); // Resetear a la primera página al buscar
  }, [searchQuery, childCompanies]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredChildren.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedChildren = filteredChildren.slice(startIndex, endIndex);

  const handleAddChildCompany = () => {
    // Redirigir a crear empresa con este como padre
    window.location.href = `/dashboard/empresas-padre/empresas/crear?parent=${companyId}`;
  };

  const handleEditChild = (company: Company) => {
    window.location.href = `/dashboard/empresas-padre/empresas/editar/${company.id}`;
  };

  const handleDeleteChild = (company: Company) => {
    console.log("Eliminar empresa hija:", company.id);
  };

  const handleChildDeleted = (deletedCompanyId: string) => {
    // Actualizar la lista después de eliminar
    setChildCompanies(prev => prev.filter(company => company.id !== deletedCompanyId));
    setFilteredChildren(prev => prev.filter(company => company.id !== deletedCompanyId));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-800/50 rounded animate-pulse"></div>
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="h-32 bg-gray-800/30 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado y controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Sucursal</h3>
          </div>
          <p className="text-sm text-gray-400">
            {parentCompanyName && (
              <>
                Empresas hijas de <span className="text-green-300 font-medium">{parentCompanyName}</span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {childCompanies.length} empresa(s) hija(s) asociada(s)
          </p>
        </div>

        {canCreateCompanies && (
          <Button
            onClick={handleAddChildCompany}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus size={16} className="mr-2" />
            Agregar Empresa Hija
          </Button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Buscar sucursales por nombre, RFC, ciudad o estado..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-[#0A0F17] text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
        />
        {searchQuery && filteredChildren.length > 0 && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-xs text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
              {filteredChildren.length} resultado(s)
            </span>
          </div>
        )}
      </div>

      {/* Lista de empresas hijas */}
      {paginatedChildren.length === 0 ? (
        <div className="text-center py-12 border border-gray-800 rounded-lg bg-[#0A0F17]/50">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/50 mb-3">
              <Building2 className="h-6 w-6 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">
              {searchQuery ? "No se encontraron resultados" : "No hay sucursales"}
            </h4>
            <p className="text-gray-400 mb-4 max-w-md mx-auto">
              {searchQuery
                ? `No se encontraron empresas que coincidan con "${searchQuery}"`
                : "Esta empresa no tiene sucursales asociadas. Puedes crear una nueva sucursal desde aquí."}
            </p>
            {canCreateCompanies && !searchQuery && (
              <Button
                onClick={handleAddChildCompany}
                variant="outline"
                className="border-green-400 text-green-400 hover:bg-green-400/10"
              >
                <Plus size={16} className="mr-2" />
                Crear primera sucursal
              </Button>
            )}
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                className="border-gray-400 text-gray-400 hover:bg-gray-400/10"
              >
                Limpiar búsqueda
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedChildren.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onEdit={canUpdateCompanies ? handleEditChild : undefined}
                onDelete={canDeleteCompanies ? handleDeleteChild : undefined}
                userPermissions={userPermissions}
              />
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <CompanyPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredChildren.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Información adicional */}
      <div className="pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 flex flex-wrap gap-4">
          <div>
            <span className="font-medium text-gray-400">Total empresas hijas:</span> {childCompanies.length}
          </div>
          {searchQuery && (
            <div>
              <span className="font-medium text-gray-400">Resultados filtrados:</span> {filteredChildren.length}
            </div>
          )}
          {childCompanies.length > 0 && (
            <div>
              <span className="font-medium text-gray-400">Página actual:</span> {currentPage} de {totalPages}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}