"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getRootCompanies, Company } from "@/lib/actions/company.actions";

export interface EmpresaPayload {
  name: string;
  street?: string | null;
  colony?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  address_number?: string | null;
  phone?: string | null;
  cellphone?: string | null;
  website?: string | null;
  rfc?: string | null;
  parent_company?: string | null;
}

interface EmpresaFormProps {
  empresa?: EmpresaPayload & { id?: string };
  handleSubmit: (e: React.FormEvent) => void;
  formData: EmpresaPayload;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  errors: Record<string, string>;
  buttonText?: string;
  buttonLoadingText?: string;
  loading: boolean;
  isEditing?: boolean;
}

export function EmpresaForm({
  empresa,
  handleSubmit,
  formData,
  handleChange,
  errors,
  buttonText = "Crear Empresa",
  buttonLoadingText = "Creando...",
  loading,
  isEditing = false,
}: EmpresaFormProps) {
  const router = useRouter();

  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [companySearchResults, setCompanySearchResults] = useState<Company[]>([]);
  const [isCompanySearching, setIsCompanySearching] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedParentCompany, setSelectedParentCompany] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar empresas disponibles para parent_company (solo empresas raíz)
  useEffect(() => {
    const loadAvailableCompanies = async () => {
      try {
        const companies = await getRootCompanies(empresa?.id);
        // Filtrar para excluir la empresa actual si estamos editando
        const filteredCompanies =
          isEditing && empresa?.id
            ? companies.filter((company) => company.id !== empresa.id)
            : companies;
        setAvailableCompanies(filteredCompanies);
        
        // Inicializar empresa padre después de cargar las disponibles
        if (isEditing && empresa?.parent_company && !isInitialized) {
          const parentCompany = filteredCompanies.find(
            (company) => company.id === empresa.parent_company
          );
          if (parentCompany) {
            setSelectedParentCompany(parentCompany);
            setCompanySearchQuery(
              `${parentCompany.name} ${parentCompany.rfc ? `- ${parentCompany.rfc}` : ""}`
            );
          } else if (empresa.parent_company) {
            // Si no está en las disponibles, intentar cargarla específicamente
            await loadParentCompanyById(empresa.parent_company);
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error cargando empresas disponibles:", error);
      }
    };

    loadAvailableCompanies();
  }, [isEditing, empresa?.id, empresa?.parent_company, isInitialized]);

  const handleCompanySearch = async (query: string) => {
    setCompanySearchQuery(query);

    if (query.length < 2) {
      setCompanySearchResults([]);
      setShowCompanyDropdown(false);
      return;
    }

    setIsCompanySearching(true);
    try {
      // Filtrar empresas disponibles localmente
      const filteredCompanies = availableCompanies.filter(
        (company) =>
          company.name.toLowerCase().includes(query.toLowerCase()) ||
          (company.rfc &&
            company.rfc.toLowerCase().includes(query.toLowerCase()))
      );
      setCompanySearchResults(filteredCompanies);
      setShowCompanyDropdown(filteredCompanies.length > 0);
    } catch (error) {
      console.error("Error buscando empresas:", error);
      setCompanySearchResults([]);
      setShowCompanyDropdown(false);
    } finally {
      setIsCompanySearching(false);
    }
  };

  const loadParentCompanyById = async (companyId: string) => {
    try {
      const companies = await getRootCompanies();
      const company = companies.find((c) => c.id === companyId);

      if (company) {
        console.log("Empresa padre encontrada:", company);
        setSelectedParentCompany(company);
        setCompanySearchQuery(
          `${company.name} ${company.rfc ? `- ${company.rfc}` : ""}`
        );
        // Agregar a availableCompanies si no está
        if (!availableCompanies.some(c => c.id === company.id)) {
          setAvailableCompanies(prev => [...prev, company]);
        }
      } else {
        console.log("Empresa padre no encontrada");
        // Mantener el nombre si existe
        if (selectedParentCompany) {
          setCompanySearchQuery(
            `${selectedParentCompany.name} ${selectedParentCompany.rfc ? `- ${selectedParentCompany.rfc}` : ""}`
          );
        } else {
          setCompanySearchQuery("Empresa no encontrada");
        }
      }
    } catch (error) {
      console.error("Error cargando empresa padre:", error);
      // Mantener el nombre si existe
      if (selectedParentCompany) {
        setCompanySearchQuery(
          `${selectedParentCompany.name} ${selectedParentCompany.rfc ? `- ${selectedParentCompany.rfc}` : ""}`
        );
      }
    }
  };

  // Seleccionar empresa padre
  const handleSelectParentCompany = (company: Company) => {
    console.log("Empresa padre seleccionada:", company);
    setSelectedParentCompany(company);

    // Actualizar el formData del padre
    const fakeEvent = {
      target: {
        name: "parent_company",
        value: company.id,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(fakeEvent);

    setCompanySearchQuery(
      `${company.name} ${company.rfc ? `- ${company.rfc}` : ""}`
    );
    setShowCompanyDropdown(false);
    setCompanySearchResults([]);
  };

  // Limpiar selección de empresa padre
  const handleClearParentCompany = () => {
    console.log("Limpiando empresa padre seleccionada");
    setSelectedParentCompany(null);

    const fakeEvent = {
      target: {
        name: "parent_company",
        value: "",
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(fakeEvent);

    setCompanySearchQuery("");
    setShowCompanyDropdown(false);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCompanyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Función para mostrar información de la empresa padre
  const renderParentCompanyInfo = () => {
    if (formData.parent_company && !selectedParentCompany) {
      // Buscar en availableCompanies por si acaso
      const foundCompany = availableCompanies.find(
        company => company.id === formData.parent_company
      );
      
      if (foundCompany) {
        return (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
            <p className="text-sm text-primary">
              <strong>Empresa padre:</strong> {foundCompany.name} 
              {foundCompany.rfc && ` - RFC: ${foundCompany.rfc}`}
            </p>
          </div>
        );
      }
      
      return (
        <p className="text-sm text-muted-foreground">
          <strong>Empresa padre:</strong> Cargando información...
        </p>
      );
    }
    return null;
  };

  // Función para manejar el submit del formulario
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("EmpresaForm: Enviando formulario...");

    if (typeof handleSubmit === "function") {
      console.log("EmpresaForm: Llamando handleSubmit del padre");
      handleSubmit(e);
    } else {
      console.error("EmpresaForm: handleSubmit no es una función");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form
        onSubmit={handleFormSubmit}
        className="space-y-6 bg-background rounded-lg border border-input p-6"
      >
        {/* Información Básica */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Información Básica
          </h2>

          {/* Nombre */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Nombre de la Empresa *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Empresa XYZ S.A. de C.V."
              className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
            />
            {errors.name && (
              <p className="text-destructive text-sm">{errors.name}</p>
            )}
          </div>

          {/* RFC */}
          <div className="space-y-2">
            <label htmlFor="rfc" className="text-sm font-medium text-foreground">
              RFC
            </label>
            <input
              id="rfc"
              name="rfc"
              type="text"
              value={formData.rfc || ""}
              onChange={handleChange}
              placeholder="Ej: XAXX010101000"
              className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground uppercase"
              style={{ textTransform: "uppercase" }}
            />
            {errors.rfc && <p className="text-destructive text-sm">{errors.rfc}</p>}
            <p className="text-xs text-muted-foreground">
              Formato: 12-13 caracteres alfanuméricos. Ej: XAXX010101000 o
              MEPM800101PL8
            </p>
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Dirección</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calle */}
            <div className="space-y-2">
              <label
                htmlFor="street"
                className="text-sm font-medium text-foreground"
              >
                Calle
              </label>
              <input
                id="street"
                name="street"
                type="text"
                value={formData.street || ""}
                onChange={handleChange}
                placeholder="Nombre de la calle"
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
              />
            </div>

            {/* Número exterior */}
            <div className="space-y-2">
              <label
                htmlFor="address_number"
                className="text-sm font-medium text-foreground"
              >
                Número exterior
              </label>
              <input
                id="address_number"
                name="address_number"
                type="text"
                value={formData.address_number || ""}
                onChange={handleChange}
                placeholder="Ej: 123"
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonia */}
            <div className="space-y-2">
              <label
                htmlFor="colony"
                className="text-sm font-medium text-foreground"
              >
                Colonia
              </label>
              <input
                id="colony"
                name="colony"
                type="text"
                value={formData.colony || ""}
                onChange={handleChange}
                placeholder="Nombre de la colonia"
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
              />
            </div>

            {/* Código Postal */}
            <div className="space-y-2">
              <label
                htmlFor="zip_code"
                className="text-sm font-medium text-foreground"
              >
                Código Postal
              </label>
              <input
                id="zip_code"
                name="zip_code"
                type="text"
                value={formData.zip_code || ""}
                onChange={handleChange}
                placeholder="Ej: 01234"
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad */}
            <div className="space-y-2">
              <label
                htmlFor="city"
                className="text-sm font-medium text-foreground"
              >
                Ciudad
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={formData.city || ""}
                onChange={handleChange}
                placeholder="Nombre de la ciudad"
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <label
                htmlFor="state"
                className="text-sm font-medium text-foreground"
              >
                Estado
              </label>
              <input
                id="state"
                name="state"
                type="text"
                value={formData.state || ""}
                onChange={handleChange}
                placeholder="Nombre del estado"
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-foreground"
              >
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={handleChange}
                placeholder="Ej: +52 55 1234 5678"
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
              />
              {errors.phone && (
                <p className="text-destructive text-sm">{errors.phone}</p>
              )}
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <label
                htmlFor="cellphone"
                className="text-sm font-medium text-foreground"
              >
                Celular
              </label>
              <input
                id="cellphone"
                name="cellphone"
                type="tel"
                value={formData.cellphone || ""}
                onChange={handleChange}
                placeholder="Ej: +52 1 55 1234 5678"
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
              />
              {errors.cellphone && (
                <p className="text-destructive text-sm">{errors.cellphone}</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label
              htmlFor="website"
              className="text-sm font-medium text-foreground"
            >
              Sitio Web
            </label>
            <input
              id="website"
              name="website"
              type="text"
              value={formData.website || ""}
              onChange={handleChange}
              placeholder="Ej: https://miempresa.com"
              className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
            />
            {errors.website && (
              <p className="text-destructive text-sm">{errors.website}</p>
            )}
          </div>
        </div>

        {/* Empresa Padre */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Empresa Padre</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Empresa matriz
            </label>
            <div className="relative" ref={dropdownRef}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={companySearchQuery}
                  onChange={(e) => handleCompanySearch(e.target.value)}
                  onFocus={() => {
                    if (
                      companySearchResults.length > 0 &&
                      companySearchQuery.length >= 2
                    ) {
                      setShowCompanyDropdown(true);
                    }
                  }}
                  placeholder="Escribe para buscar empresas (mínimo 2 caracteres)..."
                  className="flex-1 border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground"
                />
                {selectedParentCompany && (
                  <button
                    type="button"
                    onClick={handleClearParentCompany}
                    className="px-3 py-2 text-destructive border border-destructive/30 rounded-lg hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-opacity-50 transition-colors whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Dropdown de resultados */}
              {showCompanyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-input rounded-lg shadow-lg max-h-60 overflow-auto">
                  {isCompanySearching ? (
                    <div className="px-3 py-2 text-muted-foreground flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Buscando empresas...
                    </div>
                  ) : companySearchResults.length === 0 ? (
                    <div className="px-3 py-2 text-muted-foreground">
                      {companySearchQuery.length < 2
                        ? "Escribe al menos 2 caracteres para buscar"
                        : "No se encontraron empresas disponibles"}
                    </div>
                  ) : (
                    companySearchResults.map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => handleSelectParentCompany(company)}
                        className="w-full px-3 py-2 text-left hover:bg-primary/10 focus:bg-primary/10 focus:outline-none border-b border-input last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-foreground">
                          {company.name}
                        </div>
                        {company.rfc && (
                          <div className="text-sm text-muted-foreground">
                            RFC: {company.rfc}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground/70 mt-1">
                          {company.city && `${company.city}`}
                          {company.city && company.state && ", "}
                          {company.state && `${company.state}`}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {errors.parent_company && (
              <p className="text-destructive text-sm mt-1">
                {errors.parent_company}
              </p>
            )}

            {/* Información de la empresa padre */}
            {renderParentCompanyInfo()}

            {selectedParentCompany && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-primary">
                  <strong>Empresa padre seleccionada:</strong> {selectedParentCompany.name}
                  {selectedParentCompany.rfc && ` - RFC: ${selectedParentCompany.rfc}`}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Solo se muestran empresas que no son hijas de otras. Las empresas
              que ya tienen una empresa padre asignada no pueden ser
              seleccionadas como padres.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-input">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-4 py-2 text-foreground bg-background border border-input rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-opacity-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                {buttonLoadingText}
              </>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </form>
    </div>
  );
}