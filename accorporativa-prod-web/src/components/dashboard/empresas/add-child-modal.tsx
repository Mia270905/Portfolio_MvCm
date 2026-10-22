"use client";

import { useState, useEffect } from "react";
import {
  X,
  Check,
  Search,
  AlertCircle,
  Building,
  Users,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  Company,
  getAllCompanies,
  updateCompany,
} from "@/lib/actions/company.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddChildrenModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentCompanyId: string;
  parentCompanyName?: string;
  onSuccess?: () => void;
}

export function AddChildrenModal({
  isOpen,
  onClose,
  parentCompanyId,
  parentCompanyName = "esta empresa",
  onSuccess,
}: AddChildrenModalProps) {
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(0); // 0: principal, 1: advertencias, 2: resumen

  // Cargar todas las empresas disponibles
  useEffect(() => {
    const loadAvailableCompanies = async () => {
      if (!isOpen) return;

      try {
        setLoading(true);
        const allCompanies = await getAllCompanies();

        // Filtrar empresas que pueden ser hijas:
        const available = allCompanies.filter(
          (company) =>
            company.id !== parentCompanyId &&
            company.parent_company !== parentCompanyId
        );

        // Ordenar por nombre
        available.sort((a, b) => a.name.localeCompare(b.name));

        setAvailableCompanies(available);
        setFilteredCompanies(available);

        // Inicializar selecciones vacías
        setSelectedCompanyIds([]);
        setSelectedCompanies([]);
        setConfirmationStep(0);
      } catch (error) {
        console.error("Error al cargar empresas disponibles:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailableCompanies();
  }, [isOpen, parentCompanyId]);

  // Actualizar lista de empresas seleccionadas cuando cambian los IDs
  useEffect(() => {
    const selected = availableCompanies.filter((company) =>
      selectedCompanyIds.includes(company.id)
    );
    setSelectedCompanies(selected);
  }, [selectedCompanyIds, availableCompanies]);

  // Filtrar empresas por búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCompanies(availableCompanies);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availableCompanies.filter(
      (company) =>
        company.name.toLowerCase().includes(query) ||
        (company.rfc && company.rfc.toLowerCase().includes(query)) ||
        (company.city && company.city.toLowerCase().includes(query)) ||
        (company.state && company.state.toLowerCase().includes(query))
    );
    setFilteredCompanies(filtered);
  }, [searchQuery, availableCompanies]);

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanyIds((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter((id) => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredCompanies.map((company) => company.id);

    // Verificar si ya están todos seleccionados
    const allSelected = allFilteredIds.every((id) =>
      selectedCompanyIds.includes(id)
    );

    if (allSelected) {
      // Deseleccionar solo los que están en la lista filtrada
      setSelectedCompanyIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      // Agregar todos los filtrados que no estén ya seleccionados
      const newSelections = allFilteredIds.filter(
        (id) => !selectedCompanyIds.includes(id)
      );
      setSelectedCompanyIds((prev) => [...prev, ...newSelections]);
    }
  };

  const handleProceedToConfirmation = () => {
    if (selectedCompanyIds.length === 0) {
      toast.info("No has seleccionado ninguna empresa");
      return;
    }

    // Verificar si hay empresas con padre actual
    const companiesWithParent = selectedCompanies.filter(
      (company) => company.parent_company !== null
    );

    // Verificar si hay empresas que son padres de otras
    const companiesWithChildren = selectedCompanies.filter(
      (company) => company.child_companies && company.child_companies.length > 0
    );

    if (companiesWithParent.length > 0 || companiesWithChildren.length > 0) {
      // Mostrar advertencias primero
      setConfirmationStep(1);
    } else {
      // Ir directo al resumen
      setConfirmationStep(2);
    }
  };

  const handleSave = async () => {
    if (selectedCompanyIds.length === 0) {
      toast.info("No has seleccionado ninguna empresa");
      return;
    }

    try {
      setSaving(true);

      // Verificar que ninguna empresa seleccionada sea ancestro de esta empresa
      const allCompanies = await getAllCompanies();

      for (const companyId of selectedCompanyIds) {
        // Verificar referencia circular
        let currentCompanyId = companyId;
        let depth = 0;
        const maxDepth = 10;

        while (currentCompanyId && depth < maxDepth) {
          const company = allCompanies.find((c) => c.id === currentCompanyId);
          if (!company || !company.parent_company) break;

          if (company.parent_company === parentCompanyId) {
            // Referencia circular detectada
            toast.error(
              `No se puede agregar porque crearía una referencia circular`
            );
            throw new Error("Referencia circular detectada");
          }

          currentCompanyId = company.parent_company;
          depth++;
        }
      }

      // Actualizar cada empresa seleccionada para asignarle este padre
      const updates = selectedCompanyIds.map(async (companyId) => {
        return await updateCompany(companyId, {
          parent_company: parentCompanyId,
        });
      });

      const results = await Promise.all(updates);
      const successful = results.filter((result) => result.success);
      const failed = results.filter((result) => !result.success);

      if (failed.length > 0) {
        console.error("Algunas empresas no pudieron ser asignadas:", failed);
        const failedNames = failed
          .map(
            (f) =>
              allCompanies.find((c) => c.id === f.company?.id)?.name ||
              "Desconocida"
          )
          .join(", ");

        if (successful.length === 0) {
          toast.error("No se pudieron agregar las empresas seleccionadas");
        } else {
          toast.warning(
            `Se agregaron ${successful.length} empresas, pero ${failed.length} fallaron: ${failedNames}`
          );
        }
      }

      if (successful.length > 0) {
        toast.success(
          `Se agregaron ${successful.length} empresa(s) como sucursales`
        );
        if (onSuccess) onSuccess();
        handleClose();
      }
    } catch (error: any) {
      console.error("Error al asignar empresas:", error);
      if (error.message !== "Referencia circular detectada") {
        toast.error("Error al agregar las empresas");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedCompanyIds([]);
    setSelectedCompanies([]);
    setShowConfirmation(false);
    setConfirmationStep(0);
    onClose();
  };

  const getCompanyTypeBadge = (company: Company) => {
    if (company.parent_company) {
      return (
        <span className="text-xs bg-custom-accent-primary/20 text-custom-accent-primary px-2 py-1 rounded">
          Empresa Hija
        </span>
      );
    }

    const hasChildren =
      company.child_companies && company.child_companies.length > 0;
    if (hasChildren) {
      return (
        <span className="text-xs bg-custom-accent-secondary/20 text-custom-accent-secondary px-2 py-1 rounded">
          Empresa Padre
        </span>
      );
    }

    return (
      <span className="text-xs bg-custom-text-muted/20 text-custom-text-muted px-2 py-1 rounded">
        Independiente
      </span>
    );
  };

  // Verificar si todos los filtrados están seleccionados
  const allFilteredSelected =
    filteredCompanies.length > 0 &&
    filteredCompanies.every((company) =>
      selectedCompanyIds.includes(company.id)
    );

  // Empresas con padre actual
  const companiesWithParent = selectedCompanies.filter(
    (company) => company.parent_company !== null
  );

  // Empresas que son padres de otras
  const companiesWithChildren = selectedCompanies.filter(
    (company) => company.child_companies && company.child_companies.length > 0
  );

  if (!isOpen) return null;

  // Renderizar paso de confirmación/advertencias
  if (confirmationStep > 0) {
    return (
      <ConfirmationStep
        parentCompanyName={parentCompanyName}
        selectedCompanies={selectedCompanies}
        companiesWithParent={companiesWithParent}
        companiesWithChildren={companiesWithChildren}
        confirmationStep={confirmationStep}
        saving={saving}
        onBack={() => setConfirmationStep(confirmationStep - 1)}
        onConfirm={() => {
          if (confirmationStep === 1) {
            setConfirmationStep(2);
          } else {
            handleSave();
          }
        }}
        onCancel={handleClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-custom-bg-primary border border-custom-border-primary rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-custom-border-secondary">
          <div>
            <h3 className="text-xl font-semibold text-custom-text-primary flex items-center gap-2">
              <Users className="h-5 w-5 text-custom-accent-primary" />
              Agregar sucursal
            </h3>
            <p className="text-sm text-custom-text-tertiary mt-1">
              Selecciona las empresas que quieres agregar como sucursal de{" "}
              <span className="text-custom-accent-primary font-medium">
                {parentCompanyName}
              </span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-custom-text-muted hover:text-custom-text-primary p-1 hover:bg-custom-bg-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Búsqueda y controles */}
          <div className="p-4 border-b border-custom-border-secondary space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-custom-text-muted" />
              </div>
              <Input
                type="text"
                placeholder="Buscar empresas por nombre, RFC, ciudad o estado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-custom-border-primary rounded-lg bg-custom-bg-secondary text-custom-text-primary placeholder-custom-text-muted"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-custom-text-tertiary">
                <span
                  className={
                    selectedCompanyIds.length > 0
                      ? "text-custom-accent-primary"
                      : "text-custom-accent-secondary"
                  }
                >
                  {selectedCompanyIds.length} empresa(s) seleccionada(s)
                </span>
                <span className="text-custom-text-muted ml-2">
                  de {filteredCompanies.length} mostradas
                </span>
              </div>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover"
                disabled={filteredCompanies.length === 0}
              >
                {allFilteredSelected && filteredCompanies.length > 0
                  ? "Deseleccionar todas"
                  : "Seleccionar todas"}
              </Button>
            </div>
          </div>

          {/* Lista de empresas */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-16 bg-custom-bg-tertiary/30 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-custom-bg-tertiary/50 mb-3">
                  <AlertCircle className="h-6 w-6 text-custom-text-muted" />
                </div>
                <h4 className="text-lg font-medium text-custom-text-primary mb-2">
                  {searchQuery
                    ? "No se encontraron resultados"
                    : "No hay empresas disponibles"}
                </h4>
                <p className="text-custom-text-tertiary max-w-md mx-auto">
                  {searchQuery
                    ? `No hay empresas que coincidan con "${searchQuery}"`
                    : "Todas las empresas ya son sucursales de esta empresa."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCompanies.map((company) => {
                  const isSelected = selectedCompanyIds.includes(company.id);
                  return (
                    <div
                      key={company.id}
                      onClick={() => toggleCompanySelection(company.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-custom-accent-primary/10 border-custom-accent-primary/50"
                          : "bg-custom-bg-secondary border-custom-border-primary hover:border-custom-border-secondary hover:bg-custom-bg-hover/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-5 h-5 flex items-center justify-center rounded border ${
                                isSelected
                                  ? "bg-custom-accent-primary border-custom-accent-primary"
                                  : "bg-custom-bg-primary border-custom-border-secondary"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <h4
                              className={`text-custom-text-primary font-medium truncate ${
                                isSelected ? "text-custom-accent-primary" : ""
                              }`}
                            >
                              {company.name}
                            </h4>
                            {getCompanyTypeBadge(company)}
                            {company.rfc && (
                              <span
                                className={`text-xs px-2 py-1 rounded truncate ${
                                  isSelected
                                    ? "bg-custom-accent-primary/20 text-custom-accent-primary"
                                    : "bg-custom-accent-primary/20 text-custom-accent-primary"
                                }`}
                              >
                                {company.rfc}
                              </span>
                            )}
                          </div>
                          <div className="pl-7 space-y-1">
                            {company.parent_company_data && (
                              <div className="text-xs text-custom-text-tertiary flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                <span>
                                  Padre: {company.parent_company_data.name}
                                </span>
                                {company.parent_company_data.rfc && (
                                  <span className="text-custom-text-muted">
                                    ({company.parent_company_data.rfc})
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="text-sm text-custom-text-secondary">
                              {(company.phone || company.cellphone) && (
                                <div className="flex items-center gap-1">
                                  <span className="text-custom-text-muted">Tel:</span>
                                  <span>
                                    {company.phone || company.cellphone}
                                  </span>
                                  {company.phone && company.cellphone && (
                                    <span className="text-custom-text-muted">
                                      {" "}
                                      / {company.cellphone}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {(company.city || company.state) && (
                              <div className="text-sm text-custom-text-tertiary">
                                <span className="text-custom-text-muted">
                                  Ubicación:
                                </span>{" "}
                                {company.city}
                                {company.city && company.state && ", "}
                                {company.state}
                              </div>
                            )}

                            {company.child_companies &&
                              company.child_companies.length > 0 && (
                                <div className="text-xs text-custom-accent-primary flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {company.child_companies.length} empresa(s)
                                    hija(s)
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-custom-border-secondary">
          <div className="flex items-center justify-between">
            {/* Estado de selección - Móvil compacto */}
            <div className="flex-1 min-w-0">
              {selectedCompanyIds.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="hidden xs:block w-2 h-2 rounded-full bg-custom-accent-primary animate-pulse"></div>
                  <span className="text-custom-accent-primary font-medium text-sm truncate">
                    {selectedCompanyIds.length} seleccionadas
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="hidden xs:block w-2 h-2 rounded-full bg-custom-accent-secondary"></div>
                  <span className="text-custom-accent-secondary text-sm truncate">
                    Selecciona empresas
                  </span>
                </div>
              )}
            </div>

            {/* Botones - Iconos en móvil, texto en desktop */}
            <div className="flex gap-2">
              {/* Botón Cancelar */}
              <Button
                onClick={handleClose}
                variant="outline"
                size="sm"
                className="p-2 sm:px-4 sm:py-2 border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover"
                disabled={saving}
              >
                <span className="hidden sm:inline">Cancelar</span>
                <X className="h-4 w-4 sm:hidden" />
              </Button>

              <Button
                onClick={handleProceedToConfirmation}
                size="sm"
                className={`p-2 sm:px-4 sm:py-2 ${
                  selectedCompanyIds.length === 0
                    ? "bg-custom-bg-tertiary cursor-not-allowed text-custom-text-muted"
                    : "bg-button-primary hover:bg-button-hover text-white"
                }`}
                disabled={saving || selectedCompanyIds.length === 0}
              >
                {selectedCompanyIds.length > 0 ? (
                  <>
                    <span className="hidden sm:inline">Continuar</span>
                    <span className="sm:hidden">Continuar</span>
                    <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      {selectedCompanyIds.length}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Continuar</span>
                    <span className="sm:hidden">→</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para los pasos de confirmación
interface ConfirmationStepProps {
  parentCompanyName: string;
  selectedCompanies: Company[];
  companiesWithParent: Company[];
  companiesWithChildren: Company[];
  confirmationStep: number;
  saving: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationStep({
  parentCompanyName,
  selectedCompanies,
  companiesWithParent,
  companiesWithChildren,
  confirmationStep,
  saving,
  onBack,
  onConfirm,
  onCancel,
}: ConfirmationStepProps) {
  const isWarningStep = confirmationStep === 1;
  const isSummaryStep = confirmationStep === 2;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-custom-bg-primary border border-custom-border-primary rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-custom-border-secondary">
          <div>
            <h3 className="text-xl font-semibold text-custom-text-primary flex items-center gap-2">
              {isWarningStep ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-custom-warning-text" />
                  Advertencias
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 text-custom-accent-primary" />
                  Confirmar Agregar Sucursales
                </>
              )}
            </h3>
            <p className="text-sm text-custom-text-tertiary mt-1">
              {isWarningStep
                ? "Revisa las siguientes advertencias antes de continuar"
                : `Vas a agregar ${selectedCompanies.length} empresa(s) como sucursales de ${parentCompanyName}`}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-custom-text-muted hover:text-custom-text-primary p-1 hover:bg-custom-bg-hover rounded-lg transition-colors"
            disabled={saving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-6 space-y-6 overflow-y-auto">
            {isWarningStep ? (
              <>
                {/* Advertencia: Empresas con padre actual */}
                {companiesWithParent.length > 0 && (
                  <div className="bg-custom-warning-bg/10 border border-custom-warning-text/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-custom-warning-text mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-custom-warning-text mb-2">
                          {companiesWithParent.length} empresa(s) ya tienen un
                          padre asignado
                        </h4>
                        <p className="text-custom-warning-text/80 text-sm mb-3">
                          Estas empresas dejarán de ser sucursales de su empresa
                          padre actual y pasarán a ser sucursales de{" "}
                          {parentCompanyName}.
                        </p>
                        <div className="space-y-2">
                          {companiesWithParent.slice(0, 3).map((company) => (
                            <div key={company.id} className="text-sm">
                              <div className="font-medium text-custom-text-primary">
                                {company.name}
                              </div>
                              <div className="text-custom-warning-text/70">
                                Padre actual:{" "}
                                {company.parent_company_data?.name ||
                                  "Desconocido"}
                              </div>
                            </div>
                          ))}
                          {companiesWithParent.length > 3 && (
                            <div className="text-sm text-custom-warning-text/70">
                              + {companiesWithParent.length - 3} empresa(s) más
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advertencia: Empresas que son padres */}
                {companiesWithChildren.length > 0 && (
                  <div className="bg-custom-info-bg/10 border border-custom-info-text/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-custom-info-text mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-custom-info-text mb-2">
                          {companiesWithChildren.length} empresa(s) tienen
                          sucursales propias
                        </h4>
                        <p className="text-custom-info-text/80 text-sm mb-3">
                          Estas empresas tienen sucursales asignadas. Al
                          convertirse en sucursales de {parentCompanyName},
                          mantendrán sus propias sucursales, creando una
                          estructura jerárquica.
                        </p>
                        <div className="space-y-2">
                          {companiesWithChildren.slice(0, 3).map((company) => (
                            <div key={company.id} className="text-sm">
                              <div className="font-medium text-custom-text-primary">
                                {company.name}
                              </div>
                              <div className="text-custom-info-text/70">
                                Tiene {company.child_companies?.length || 0}{" "}
                                sucursal(es)
                              </div>
                            </div>
                          ))}
                          {companiesWithChildren.length > 3 && (
                            <div className="text-sm text-custom-info-text/70">
                              + {companiesWithChildren.length - 3} empresa(s)
                              más
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resumen general */}
                <div className="bg-custom-bg-secondary/30 border border-custom-border-secondary rounded-lg p-4">
                  <h4 className="font-medium text-custom-text-primary mb-3">
                    Resumen de cambios
                  </h4>
                  <ul className="space-y-2 text-sm text-custom-text-secondary">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-custom-accent-primary" />
                      <span>
                        {selectedCompanies.length} empresa(s) serán agregadas
                        como sucursales
                      </span>
                    </li>
                    {companiesWithParent.length > 0 && (
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-custom-warning-text" />
                        <span>
                          {companiesWithParent.length} cambiarán de empresa
                          padre
                        </span>
                      </li>
                    )}
                    {companiesWithChildren.length > 0 && (
                      <li className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-custom-info-text" />
                        <span>
                          {companiesWithChildren.length} mantendrán sus propias
                          sucursales
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </>
            ) : (
              // Paso de resumen/confirmación final
              <>
                <div className="bg-custom-accent-primary/10 border border-custom-accent-primary/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-custom-accent-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-custom-accent-primary mb-2">
                        Confirmar agregar sucursales
                      </h4>
                      <p className="text-custom-accent-primary/80 text-sm">
                        Estás a punto de agregar {selectedCompanies.length}{" "}
                        empresa(s) como sucursales de {parentCompanyName}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de empresas seleccionadas */}
                <div>
                  <h4 className="font-medium text-custom-text-primary mb-3">
                    Empresas seleccionadas:
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="bg-custom-bg-secondary/30 border border-custom-border-secondary rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-custom-text-primary">
                              {company.name}
                            </div>
                            {company.rfc && (
                              <div className="text-sm text-custom-text-tertiary">
                                RFC: {company.rfc}
                              </div>
                            )}
                            {company.parent_company_data && (
                              <div className="text-sm text-custom-warning-text">
                                <Building className="h-3 w-3 inline mr-1" />
                                Padre actual: {company.parent_company_data.name}
                              </div>
                            )}
                            {company.child_companies &&
                              company.child_companies.length > 0 && (
                                <div className="text-sm text-custom-info-text">
                                  <Users className="h-3 w-3 inline mr-1" />
                                  {company.child_companies.length} sucursal(es)
                                </div>
                              )}
                          </div>
                          <Check className="h-5 w-5 text-custom-accent-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Información importante */}
                <div className="bg-custom-bg-secondary/30 border border-custom-border-secondary rounded-lg p-4">
                  <h4 className="font-medium text-custom-text-primary mb-2">
                    ⚠️ Información importante
                  </h4>
                  <ul className="space-y-2 text-sm text-custom-text-secondary">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-custom-text-muted rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>
                        Esta acción no se puede deshacer automáticamente
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-custom-text-muted rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>
                        Las empresas dejarán de ser sucursales de sus padres
                        actuales (si tenían)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-custom-text-muted rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>
                        Podrás remover las sucursales posteriormente si es
                        necesario
                      </span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-custom-border-secondary flex justify-between items-center">
          <div className="text-sm text-custom-text-tertiary">
            {selectedCompanies.length} empresa(s) seleccionada(s)
          </div>
          <div className="flex gap-3">
            {isWarningStep ? (
              <>
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover"
                  disabled={saving}
                >
                  Regresar
                </Button>
                <Button
                  onClick={onConfirm}
                  className="bg-custom-warning-text hover:bg-custom-warning-text/80 text-white"
                  disabled={saving}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Entiendo, confirmar</span>
                  <span className="sm:hidden">Confirmar</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover"
                  disabled={saving}
                >
                  Regresar
                </Button>
                <Button
                  onClick={onConfirm}
                  className="bg-button-primary hover:bg-button-hover text-white"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                    <span className="hidden sm:inline">Confirmar y agregar</span>
                    <span className="sm:hidden">Confirmar</span>
                  </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}