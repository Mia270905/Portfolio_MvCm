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
        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
          Empresa Hija
        </span>
      );
    }

    const hasChildren =
      company.child_companies && company.child_companies.length > 0;
    if (hasChildren) {
      return (
        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
          Empresa Padre
        </span>
      );
    }

    return (
      <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
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
      <div className="bg-white border border-[#f5efe6] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-[#e6dcc9]">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c6a365]" />
              Agregar sucursal
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Selecciona las empresas que quieres agregar como sucursal de{" "}
              <span className="font-medium text-[#c6a365]">
                {parentCompanyName}
              </span>
            </p>
          </div>

          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-900 p-1 hover:bg-[#faf8f3] rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* Búsqueda y controles */}
          <div className="p-4 border-b border-[#e6dcc9] space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar empresas por nombre, RFC, ciudad o estado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2
                  border border-[#e6dcc9] 
                  rounded-lg
                  bg-white
                  text-neutral-900
                  placeholder:text-neutral-400
                  focus:outline-none
                  focus:border-[#c6a365]
                  focus:ring-2
                  focus:ring-[#c6a365]
                  focus:ring-opacity-50
                "
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-600">
                <span
                  className={
                    selectedCompanyIds.length > 0
                      ? "text-[#c6a365]"
                      : "text-neutral-500"
                  }
                >
                  {selectedCompanyIds.length} empresa(s) seleccionada(s)
                </span>
                <span className="ml-2 text-neutral-500">
                  de {filteredCompanies.length} mostradas
                </span>
              </div>

              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="
                  border border-[#e6dcc9] 
                  text-neutral-700 
                  hover:bg-[#faf8f3] 
                  hover:text-neutral-900 
                  hover:border-[#c6a365]
                "
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
                    className="h-16 bg-neutral-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#faf8f3] mb-3">
                  <AlertCircle className="h-6 w-6 text-neutral-500" />
                </div>
                <h4 className="text-lg font-medium text-neutral-900 mb-2">
                  {searchQuery
                    ? "No se encontraron resultados"
                    : "No hay empresas disponibles"}
                </h4>
                <p className="text-neutral-600 max-w-md mx-auto">
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
                          ? "bg-[#faf8f3] border-[#c6a365]"
                          : "bg-white border-[#e6dcc9] hover:bg-neutral-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-5 h-5 flex items-center justify-center rounded border ${
                            isSelected
                              ? "bg-[#c6a365] border-[#c6a365]"
                              : "bg-white border-neutral-300"
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>

                        <h4
                          className={`font-medium truncate ${
                            isSelected
                              ? "text-[#c6a365]"
                              : "text-neutral-900"
                          }`}
                        >
                          {company.name}
                        </h4>

                        {company.rfc && (
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              isSelected
                                ? "bg-[#c6a365]/20 text-[#c6a365]"
                                : "bg-neutral-100 text-neutral-700"
                            }`}
                          >
                            {company.rfc}
                          </span>
                        )}
                      </div>

                      {(company.city || company.state) && (
                        <div className="text-sm text-neutral-600 pl-7">
                          <span className="text-neutral-500">Ubicación:</span>{" "}
                          {company.city}
                          {company.city && company.state && ", "}
                          {company.state}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#e6dcc9]">
          <div className="flex items-center justify-between">
            <span className="text-[#c6a365] text-sm font-medium">
              {selectedCompanyIds.length > 0
                ? `${selectedCompanyIds.length} seleccionadas`
                : "Selecciona empresas"}
            </span>

            <div className="flex gap-2">
              <Button
                onClick={handleClose}
                size="sm"
                className="
                  border border-[#e6dcc9] 
                  text-neutral-700 
                  hover:bg-[#faf8f3] 
                  hover:text-neutral-900 
                  hover:border-[#c6a365]
                "
              >
                Cancelar
              </Button>

              <Button
                onClick={handleProceedToConfirmation}
                size="sm"
                className={`
                  ${
                    selectedCompanyIds.length === 0
                      ? "bg-neutral-200 cursor-not-allowed text-neutral-500"
                      : "bg-[#c6a365] hover:bg-[#b59454] text-white"
                  }
                `}
                disabled={selectedCompanyIds.length === 0}
              >
                Continuar
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
      <div className="bg-white border border-[#f5efe6] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-[#e6dcc9]">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
              {isWarningStep ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Advertencias
                </>
              ) : (
                <>
                  <Check className="h-5 w-5 text-green-500" />
                  Confirmar Agregar Sucursales
                </>
              )}
            </h3>

            <p className="text-sm text-neutral-600 mt-1">
              {isWarningStep
                ? "Revisa las siguientes advertencias antes de continuar"
                : `Vas a agregar ${selectedCompanies.length} empresa(s) como sucursales de ${parentCompanyName}`}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-neutral-500 hover:text-neutral-900 p-1 hover:bg-[#faf8f3] rounded-lg transition-colors"
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
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-800 mb-2">
                          {companiesWithParent.length} empresa(s) ya tienen un
                          padre asignado
                        </h4>
                        <p className="text-amber-700 text-sm mb-3">
                          Estas empresas dejarán de ser sucursales de su empresa
                          padre actual y pasarán a ser sucursales de{" "}
                          {parentCompanyName}.
                        </p>
                        <div className="space-y-2">
                          {companiesWithParent.slice(0, 3).map((company) => (
                            <div key={company.id} className="text-sm">
                              <div className="font-medium text-neutral-900">
                                {company.name}
                              </div>
                              <div className="text-amber-600">
                                Padre actual:{" "}
                                {company.parent_company_data?.name ||
                                  "Desconocido"}
                              </div>
                            </div>
                          ))}
                          {companiesWithParent.length > 3 && (
                            <div className="text-sm text-amber-600">
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-800 mb-2">
                          {companiesWithChildren.length} empresa(s) tienen
                          sucursales propias
                        </h4>
                        <p className="text-blue-700 text-sm mb-3">
                          Estas empresas tienen sucursales asignadas. Al
                          convertirse en sucursales de {parentCompanyName},
                          mantendrán sus propias sucursales, creando una
                          estructura jerárquica.
                        </p>
                        <div className="space-y-2">
                          {companiesWithChildren.slice(0, 3).map((company) => (
                            <div key={company.id} className="text-sm">
                              <div className="font-medium text-neutral-900">
                                {company.name}
                              </div>
                              <div className="text-blue-600">
                                Tiene {company.child_companies?.length || 0}{" "}
                                sucursal(es)
                              </div>
                            </div>
                          ))}
                          {companiesWithChildren.length > 3 && (
                            <div className="text-sm text-blue-600">
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
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <h4 className="font-medium text-neutral-900 mb-3">
                    Resumen de cambios
                  </h4>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>
                        {selectedCompanies.length} empresa(s) serán agregadas
                        como sucursales
                      </span>
                    </li>
                    {companiesWithParent.length > 0 && (
                      <li className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>
                          {companiesWithParent.length} cambiarán de empresa
                          padre
                        </span>
                      </li>
                    )}
                    {companiesWithChildren.length > 0 && (
                      <li className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-blue-500" />
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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">
                        Confirmar agregar sucursales
                      </h4>
                      <p className="text-green-700 text-sm">
                        Estás a punto de agregar {selectedCompanies.length}{" "}
                        empresa(s) como sucursales de {parentCompanyName}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lista de empresas seleccionadas */}
                <div>
                  <h4 className="font-medium text-neutral-900 mb-3">
                    Empresas seleccionadas:
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="bg-neutral-50 border border-neutral-200 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-neutral-900">
                              {company.name}
                            </div>
                            {company.rfc && (
                              <div className="text-sm text-neutral-600">
                                RFC: {company.rfc}
                              </div>
                            )}
                            {company.parent_company_data && (
                              <div className="text-sm text-amber-600">
                                <Building className="h-3 w-3 inline mr-1" />
                                Padre actual: {company.parent_company_data.name}
                              </div>
                            )}
                            {company.child_companies &&
                              company.child_companies.length > 0 && (
                                <div className="text-sm text-blue-600">
                                  <Users className="h-3 w-3 inline mr-1" />
                                  {company.child_companies.length} sucursal(es)
                                </div>
                              )}
                          </div>
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Información importante */}
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <h4 className="font-medium text-neutral-900 mb-2">
                    ⚠️ Información importante
                  </h4>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-neutral-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>
                        Esta acción no se puede deshacer automáticamente
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-neutral-400 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>
                        Las empresas dejarán de ser sucursales de sus padres
                        actuales (si tenían)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-neutral-400 rounded-full mt-1.5 flex-shrink-0"></div>
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
        <div className="p-4 border-t border-[#e6dcc9] flex justify-between items-center">
          <div className="text-sm text-neutral-600">
            {selectedCompanies.length} empresa(s) seleccionada(s)
          </div>
          <div className="flex gap-3">
            {isWarningStep ? (
              <>
                <Button
                  onClick={onBack}
                  variant="outline"
                  className="
                    border border-[#e6dcc9] 
                    text-neutral-700 
                    hover:bg-[#faf8f3] 
                    hover:text-neutral-900 
                    hover:border-[#c6a365]
                  "
                  disabled={saving}
                >
                  Regresar
                </Button>
                <Button
                  onClick={onConfirm}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
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
                  className="
                    border border-[#e6dcc9] 
                    text-neutral-700 
                    hover:bg-[#faf8f3] 
                    hover:text-neutral-900 
                    hover:border-[#c6a365]
                  "
                  disabled={saving}
                >
                  Regresar
                </Button>
                <Button
                  onClick={onConfirm}
                  className="bg-green-500 hover:bg-green-600 text-white"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
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