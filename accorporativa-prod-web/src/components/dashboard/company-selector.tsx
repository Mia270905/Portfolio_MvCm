"use client";

import { Building2, ChevronRight, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { getAllCompanies, Company } from "@/lib/actions/company.actions";
import { toast } from "sonner";
import { useCompany } from "@/app/providers/company-provider";

interface CompanyWithChildren extends Company {
  child_companies?: Company[];
}

interface CompanySelectorProps {
  onSelectionChange?: (selectedIds: string[]) => void;
}

export default function CompanySelector({
  onSelectionChange,
}: CompanySelectorProps) {
  const {
    selectedCompanies,
    setSelectedCompanies,
    companyNames,
    clearSelection,
    addCompany,
    removeCompany,
    isCompanySelected,
  } = useCompany();

  const [companies, setCompanies] = useState<CompanyWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set()
  );
  const [pendingSelection, setPendingSelection] = useState<string[]>([]);

  // Obtener empresas al cargar
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Sincronizar pendingSelection con selectedCompanies inicial
  useEffect(() => {
    setPendingSelection(selectedCompanies);
  }, [selectedCompanies]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const companiesData = await getAllCompanies();

      // Organizar empresas por jerarquía
      const parents: CompanyWithChildren[] = [];
      const childrenMap = new Map<string, CompanyWithChildren[]>();

      companiesData.forEach((company) => {
        const companyWithChildren = { ...company } as CompanyWithChildren;

        if (!company.parent_company) {
          companyWithChildren.child_companies = [];
          parents.push(companyWithChildren);
        } else {
          if (!childrenMap.has(company.parent_company)) {
            childrenMap.set(company.parent_company, []);
          }
          childrenMap.get(company.parent_company)?.push(companyWithChildren);
        }
      });

      parents.forEach((parent) => {
        const children = childrenMap.get(parent.id) || [];
        parent.child_companies = children.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

      parents.sort((a, b) => a.name.localeCompare(b.name));
      setCompanies(parents);
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("No se pudieron cargar las empresas");
    } finally {
      setLoading(false);
    }
  };

  // Manejar selección/deselección temporal (no guarda aún)
  const handleCompanyToggle = (companyId: string) => {
    setPendingSelection((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter((id) => id !== companyId);
      } else {
        return [...prev, companyId];
      }
    });
  };

  // Seleccionar todas las empresas al instante
  const handleSelectAll = () => {
    const allCompanyIds: string[] = [];
    const allCompanyNames: Record<string, string> = {};

    companies.forEach((parent) => {
      allCompanyIds.push(parent.id);
      allCompanyNames[parent.id] = parent.name;

      parent.child_companies?.forEach((child) => {
        allCompanyIds.push(child.id);
        allCompanyNames[child.id] = child.name;
      });
    });

    // Aplicar inmediatamente
    setSelectedCompanies(allCompanyIds);
    setPendingSelection(allCompanyIds);

    // Guardar nombres en localStorage
    localStorage.setItem("companyNames", JSON.stringify(allCompanyNames));

    toast.success(`Todas las empresas seleccionadas (${allCompanyIds.length})`);

    // Notificar a otros componentes
    window.dispatchEvent(new Event("companiesSelectionChanged"));
  };

  // Deseleccionar todas y seleccionar solo la primera empresa
  const handleSelectFirstOnly = () => {
    if (companies.length === 0) {
      toast.info("No hay empresas disponibles");
      return;
    }

    // Buscar la primera empresa RAÍZ (sin parent_company)
    let firstRootCompanyId = "";
    let firstRootCompanyName = "";

    // Buscar en empresas padre (raíces)
    for (const company of companies) {
      if (!company.parent_company) {
        firstRootCompanyId = company.id;
        firstRootCompanyName = company.name;
        break;
      }
    }

    // Si no se encontró empresa raíz, usar la primera empresa disponible
    if (!firstRootCompanyId && companies.length > 0) {
      firstRootCompanyId = companies[0].id;
      firstRootCompanyName = companies[0].name;
    }

    if (firstRootCompanyId) {
      // Aplicar inmediatamente (solo la primera empresa RAÍZ)
      const newSelection = [firstRootCompanyId];

      setSelectedCompanies(newSelection);
      setPendingSelection(newSelection);

      toast.success(`Seleccionada solo: ${firstRootCompanyName}`);

      // Notificar a otros componentes
      window.dispatchEvent(new Event("companiesSelectionChanged"));
    } else {
      toast.info("No se encontró ninguna empresa para seleccionar");
    }
  };

  // Expandir/contraer empresa padre
  const toggleParentExpansion = (parentId: string) => {
    setExpandedParents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(parentId)) {
        newSet.delete(parentId);
      } else {
        newSet.add(parentId);
      }
      return newSet;
    });
  };

  // Contar total de empresas (padres + hijos)
  const totalCompanies = companies.reduce((total, parent) => {
    return total + 1 + (parent.child_companies?.length || 0);
  }, 0);

  // Aplicar la selección pendiente
  const handleApplySelection = () => {
    // Obtener nombres de las empresas seleccionadas
    const selectedCompanyNames: Record<string, string> = {};

    // Buscar nombres de las empresas seleccionadas
    const findCompanyName = (id: string): string => {
      // Buscar en padres
      for (const parent of companies) {
        if (parent.id === id) return parent.name;

        // Buscar en hijos
        if (parent.child_companies) {
          for (const child of parent.child_companies) {
            if (child.id === id) return child.name;
          }
        }
      }
      return "Empresa";
    };

    pendingSelection.forEach((id) => {
      selectedCompanyNames[id] = findCompanyName(id);
    });

    // Guardar en el contexto y localStorage
    setSelectedCompanies(pendingSelection);
    localStorage.setItem("companyNames", JSON.stringify(selectedCompanyNames));

    toast.success(
      `Selección aplicada: ${pendingSelection.length} empresa${
        pendingSelection.length !== 1 ? "s" : ""
      } seleccionada${pendingSelection.length !== 1 ? "s" : ""}`,
      {
        duration: 3000,
      }
    );

    // Notificar a otros componentes
    window.dispatchEvent(new Event("companiesSelectionChanged"));

    // Notificar al componente padre si es necesario
    onSelectionChange?.(pendingSelection);
  };

  // Verificar si una empresa está seleccionada en la selección pendiente
  const isPendingSelected = (companyId: string) => {
    return pendingSelection.includes(companyId);
  };

return (
  <Popover>
    <PopoverTrigger asChild>
      <button
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
        aria-label="Seleccionar empresa"
      >
        <Building2 className="w-5 h-5 text-gray-600" />
        {selectedCompanies.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {selectedCompanies.length}
          </span>
        )}
      </button>
    </PopoverTrigger>

    <PopoverContent
      className="w-[90vw] max-w-sm sm:max-w-md md:w-96 p-0 bg-white border border-gray-200 shadow-xl rounded-xl"
      align="end"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex gap-2 text-xs">
            <button
              onClick={handleSelectAll}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Todas
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleSelectFirstOnly}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Primera
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Selecciona las empresas que deseas ver
        </p>
      </div>

      {/* Lista */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : companies.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No hay empresas disponibles
            </p>
          </div>
        ) : (
          <div className="py-2">
            {companies.map((parentCompany) => {
              const isParentExpanded = expandedParents.has(parentCompany.id);
              const parentChildren = parentCompany.child_companies || [];

              return (
                <div
                  key={parentCompany.id}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  {/* Empresa Padre */}
                  <div className="flex items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isPendingSelected(parentCompany.id)}
                      onChange={() => handleCompanyToggle(parentCompany.id)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />

                    <span className="ml-3 flex-1 text-sm font-medium text-gray-800 truncate">
                      {parentCompany.name}
                    </span>

                    {parentChildren.length > 0 && (
                      <button
                        onClick={() =>
                          toggleParentExpansion(parentCompany.id)
                        }
                        className="p-1 hover:bg-gray-200 rounded transition-colors ml-2"
                      >
                        {isParentExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    )}
                  </div>

                  {/* Hijas */}
                  {isParentExpanded && parentChildren.length > 0 && (
                    <div className="ml-4 pl-8 border-l border-gray-200">
                      {parentChildren.map((childCompany) => (
                        <div
                          key={childCompany.id}
                          className="flex items-center px-4 py-2 hover:bg-gray-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isPendingSelected(childCompany.id)}
                            onChange={() =>
                              handleCompanyToggle(childCompany.id)
                            }
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-3 text-sm text-gray-600 truncate">
                            {childCompany.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              <span className="text-blue-600 font-medium">
                {pendingSelection.length}
              </span>{" "}
              de <span className="text-gray-800">{totalCompanies}</span>{" "}
              empresas
            </p>
          </div>

          <button
            onClick={handleApplySelection}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={pendingSelection.length === 0}
          >
            Aplicar
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);
}
