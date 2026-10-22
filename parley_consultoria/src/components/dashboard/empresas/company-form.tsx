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
          <div className="p-3 bg-green-400/10 border border-green-700 rounded-lg">
            <p className="text-sm text-green-400">
              <strong>Empresa padre:</strong> {foundCompany.name} 
              {foundCompany.rfc && ` - RFC: ${foundCompany.rfc}`}
            </p>
          </div>
        );
      }
      
      return (
        <p className="text-sm text-amber-400">
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
       

      >
        {/* Información Básica */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Información Básica
          </h2>

          {/* Nombre */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre de la Empresa *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Empresa XYZ S.A. de C.V."
             className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
            />
            {errors.name && (
              <p className="text-red-400 text-sm">{errors.name}</p>
            )}
          </div>

          {/* RFC */}
          <div className="space-y-2">
            <label htmlFor="rfc" className="text-sm font-medium text-gray-700">
              RFC
            </label>
            <input
              id="rfc"
              name="rfc"
              type="text"
              value={formData.rfc || ""}
              onChange={handleChange}
              placeholder="Ej: XAXX010101000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              style={{ textTransform: "uppercase" }}
            />
            {errors.rfc && <p className="text-red-400 text-sm">{errors.rfc}</p>}
            <p className="text-xs text-gray-400">
              Formato: 12-13 caracteres alfanuméricos. Ej: XAXX010101000 o
              MEPM800101PL8
            </p>
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Dirección</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calle */}
            <div className="space-y-2">
              <label
                htmlFor="street"
                className="text-sm font-medium text-gray-700"
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
               className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            {/* Número exterior */}
            <div className="space-y-2">
              <label
                htmlFor="address_number"
                className="text-sm font-medium text-gray-700"
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
               className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonia */}
            <div className="space-y-2">
              <label
                htmlFor="colony"
                className="text-sm font-medium text-gray-700"
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
               className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            {/* Código Postal */}
            <div className="space-y-2">
              <label
                htmlFor="zip_code"
                className="text-sm font-medium text-gray-700"
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
               className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad */}
            <div className="space-y-2">
              <label
                htmlFor="city"
                className="text-sm font-medium text-gray-700"
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
               className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <label
                htmlFor="state"
                className="text-sm font-medium text-gray-700"
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
               className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Contacto</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
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
               className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.phone && (
                <p className="text-red-400 text-sm">{errors.phone}</p>
              )}
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <label
                htmlFor="cellphone"
                className="text-sm font-medium text-gray-700"
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
               className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.cellphone && (
                <p className="text-red-400 text-sm">{errors.cellphone}</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <label
              htmlFor="website"
              className="text-sm font-medium text-gray-700"
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
             className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
            />
            {errors.website && (
              <p className="text-red-400 text-sm">{errors.website}</p>
            )}
          </div>
        </div>

        {/* Empresa Padre */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Empresa Padre</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                />
                {selectedParentCompany && (
                  <button
                    type="button"
                    onClick={handleClearParentCompany}
                    className="px-3 py-2 text-red-400 border border-red-700 rounded-lg hover:bg-red-400/10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors whitespace-nowrap"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Dropdown de resultados */}
              {showCompanyDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-[#faf8f3] border border-[#CFC7B8] rounded-lg shadow-lg max-h-60 overflow-auto">
                  {isCompanySearching ? (
                    <div className="px-3 py-2 text-gray-800 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
                      Buscando empresas...
                    </div>
                  ) : companySearchResults.length === 0 ? (
                    <div className="px-3 py-2 text-gray-800">
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
                        className="w-full px-3 py-2 text-left hover:bg-yellow-400/10 focus:bg-yellow-400/10 focus:outline-none border-b border-gray-700 last:border-b-0 transition-colors"
                      >
                        <div className="font-medium text-gray-800">
                          {company.name}
                        </div>
                        {company.rfc && (
                          <div className="text-sm text-gray-600">
                            RFC: {company.rfc}
                          </div>
                        )}
                        <div className="text-xs text-gray-700 mt-1">
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
              <p className="text-red-400 text-sm mt-1">
                {errors.parent_company}
              </p>
            )}

            {/* Información de la empresa padre */}
            {renderParentCompanyInfo()}

            {selectedParentCompany && (
              <div className="p-3 bg-green-400/10 border border-green-700 rounded-lg">
                <p className="text-sm text-green-400">
                  <strong>Empresa padre seleccionada:</strong> {selectedParentCompany.name}
                  {selectedParentCompany.rfc && ` - RFC: ${selectedParentCompany.rfc}`}
                </p>
              </div>
            )}

            <p className="text-xs text-gray-400">
              Solo se muestran empresas que no son hijas de otras. Las empresas
              que ya tienen una empresa padre asignada no pueden ser
              seleccionadas como padres.
            </p>
          </div>
        </div>
<br /><br />
        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className="px-4 py-2 text-gray-800 border rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
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