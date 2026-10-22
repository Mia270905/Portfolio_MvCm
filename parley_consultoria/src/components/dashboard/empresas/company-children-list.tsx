"use client";

import { useState, useEffect } from "react";
import { Plus, Search, X, Phone, Building2, MapPin } from "lucide-react";
import { Company, getAllCompanies } from "@/lib/actions/company.actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddChildrenModal } from "./add-child-modal";
import { RemoveAffiliationDialog } from "./remove-affilation-dialog";

interface CompanyChildrenListProps {
  companyId: string;
  parentCompanyName?: string;
  userPermissions?: string[];
  onRemoveAffiliation?: (childCompanyId: string) => Promise<void>;
  onChildrenAdded?: () => void;
}

export function CompanyChildrenList({
  companyId,
  parentCompanyName,
  userPermissions = [],
  onRemoveAffiliation,
  onChildrenAdded,
}: CompanyChildrenListProps) {
  const [childCompanies, setChildCompanies] = useState<Company[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [companyToRemove, setCompanyToRemove] = useState<Company | null>(null);

  const canCreateCompanies = userPermissions.includes("create:empresas");
  const canUpdateCompanies = userPermissions.includes("update:empresas");

  const loadChildCompanies = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    if (companyId) {
      loadChildCompanies();
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
        (company.phone && company.phone.toLowerCase().includes(query)) ||
        (company.cellphone && company.cellphone.toLowerCase().includes(query))
    );
    setFilteredChildren(filtered);
  }, [searchQuery, childCompanies]);

  const handleAddChildCompany = () => {
    setShowAddModal(true);
  };

  const handleCreateNewCompany = () => {
    window.location.href = `/dashboard/empresas-padre/empresas/crear?parent=${companyId}`;
  };

  const handleRemoveClick = (company: Company) => {
    setCompanyToRemove(company);
    setRemoveDialogOpen(true);
  };

  const handleRemoveAffiliation = async (childCompanyId: string) => {
    if (!onRemoveAffiliation) return;

    try {
      await onRemoveAffiliation(childCompanyId);

      // Actualizar la lista localmente
      setChildCompanies((prev) =>
        prev.filter((company) => company.id !== childCompanyId)
      );
      setFilteredChildren((prev) =>
        prev.filter((company) => company.id !== childCompanyId)
      );

      // Cerrar el diálogo
      setRemoveDialogOpen(false);
      setCompanyToRemove(null);
    } catch (error) {
      console.error("Error al eliminar afiliación:", error);
      throw error; // Propagar el error para que lo maneje el diálogo
    }
  };

  const handleEditCompany = (companyId: string) => {
    window.location.href = `/dashboard/empresas-padre/empresas/editar/${companyId}`;
  };

  const handleChildrenAdded = () => {
    loadChildCompanies();
    if (onChildrenAdded) onChildrenAdded();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-[#f5efe6] rounded animate-pulse"></div>
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="h-20 bg-[#f5efe6] rounded animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Encabezado y controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-[#c6a365]" />
              <h3 className="text-lg font-semibold text-neutral-900">
                Empresas Filiales
              </h3>
            </div>
            <p className="text-sm text-neutral-600">
              {childCompanies.length} empresa(s) asociada(s)
            </p>
          </div>

          {canCreateCompanies && (
            <div className="flex gap-2">
              <Button
                onClick={handleAddChildCompany}
                className="bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] text-white shadow-sm"
              >
                <Plus size={16} className="mr-2" />
                Agregar Empresas
              </Button>
              {/* <Button
                onClick={handleCreateNewCompany}
                variant="outline"
                className="border-yellow-400 text-yellow-400 hover:bg-yellow-400/10"
              >
                <Plus size={16} className="mr-2" />
                Crear Nueva
              </Button> */}
            </div>
          )}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar por nombre, RFC o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#CFC7B8] rounded-lg bg-white text-neutral-900 placeholder-neutral-500 focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20"
          />
        </div>

        {/* Lista de empresas hijas */}
        {filteredChildren.length === 0 ? (
          <div className="text-center py-12 border border-[#f5efe6] rounded-lg bg-[#faf8f3]">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#f5efe6] mb-3">
                <Building2 className="h-6 w-6 text-[#c6a365]" />
              </div>

              <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                {searchQuery
                  ? "No se encontraron resultados"
                  : "No hay empresas filiales"}
              </h4>

              <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `No se encontraron empresas que coincidan con "${searchQuery}"`
                  : "No hay empresas asociadas a esta empresa padre."}
              </p>

              {canCreateCompanies && !searchQuery && (
                <div className="flex flex-col px-3.5 sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleAddChildCompany}
                    className="bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] text-white shadow-sm"
                  >
                    <Plus size={16} className="mr-2" />
                    Agregar a empresas existentes
                  </Button>

                  <Button
                    onClick={handleCreateNewCompany}
                    variant="outline"
                    className="border-[#CFC7B8] text-[#c6a365] hover:bg-[#f5efe6] hover:text-[#b59555] transition-colors"
                  >
                    <Plus size={16} className="mr-2" />
                    Crear nueva empresa
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChildren.map((company) => (
              <div
                key={company.id}
                className="group bg-white border border-[#f5efe6] rounded-lg hover:border-[#e6d7a3] hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    {/* Información de la empresa */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() =>
                        canUpdateCompanies && handleEditCompany(company.id)
                      }
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-neutral-900 font-medium line-clamp-1 group-hover:text-[#b59555] transition-colors">
                          {company.name}
                        </h4>
                        {company.rfc && (
                          <span className="text-xs bg-[#f0e9d5] text-[#7a5a00] px-2 py-1 rounded border border-[#e6d7a3]">
                            {company.rfc}
                          </span>
                        )}
                      </div>

                      {/* Información de contacto */}
                      <div className="space-y-1.5">
                        {/* Teléfonos */}
                        <div className="flex items-center gap-3 text-sm">
                          {(company.phone || company.cellphone) && (
                            <div className="flex items-center gap-2 text-neutral-700">
                              <Phone className="h-3.5 w-3.5 text-neutral-500" />
                              <span>
                                {company.phone || company.cellphone}
                                {company.phone && company.cellphone && " / "}
                                {company.cellphone &&
                                  company.phone &&
                                  company.cellphone}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Dirección */}
                        {(company.city || company.state) && (
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                            <span className="line-clamp-1">
                              {company.city}
                              {company.city && company.state && ", "}
                              {company.state}
                              {company.zip_code && ` (${company.zip_code})`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón para eliminar afiliación */}
                    {onRemoveAffiliation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveClick(company);
                        }}
                        className="ml-3 p-2 text-[#c62828] hover:text-[#b71c1c] hover:bg-[#fdeaea] rounded-lg transition-colors"
                        title="Eliminar afiliación"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Información adicional */}
        {filteredChildren.length > 0 && (
          <div className="pt-4 border-t border-[#f5efe6]">
            <div className="text-xs text-neutral-500">
              <span className="font-medium text-neutral-700">
                Mostrando {filteredChildren.length} de {childCompanies.length}{" "}
                empresas
              </span>
              {searchQuery && " (filtradas)"}
            </div>
          </div>
        )}
      </div>

      {/* Modal para agregar empresas */}
      <AddChildrenModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        parentCompanyId={companyId}
        parentCompanyName={parentCompanyName}
        onSuccess={handleChildrenAdded}
      />

      {companyToRemove && (
        <RemoveAffiliationDialog
          companyId={companyToRemove.id}
          companyName={companyToRemove.name}
          parentCompanyName={parentCompanyName || "esta empresa"}
          open={removeDialogOpen}
          onOpenChange={setRemoveDialogOpen}
          onRemove={handleRemoveAffiliation}
        />
      )}
    </>
  );
}