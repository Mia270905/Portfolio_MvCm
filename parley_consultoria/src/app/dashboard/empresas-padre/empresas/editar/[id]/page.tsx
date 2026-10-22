"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getCompanyById, updateCompany } from "@/lib/actions/company.actions";
import { EmpresaForm } from "@/components/dashboard/empresas/company-form";
import { CompanySkeleton } from "@/components/dashboard/empresas/company-skeleton";
import { CompanyChildrenList } from "@/components/dashboard/empresas/company-children-list";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface FormData {
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

export default function EditCompanyPage() {
  const router = useRouter();
  const { id: idParams } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    street: "",
    colony: "",
    city: "",
    state: "",
    zip_code: "",
    address_number: "",
    phone: "",
    cellphone: "",
    website: "",
    rfc: "",
    parent_company: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadedStatus, setLoadedStatus] = useState("loading");
  const [companyId, setCompanyId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("info"); // "info" o "children"

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d+]/g, "");

    if (numbers.startsWith("+")) {
      const countryCode = numbers.slice(0, 3);
      const rest = numbers.slice(3);

      if (rest.length <= 3) {
        return `${countryCode} ${rest}`;
      } else if (rest.length <= 6) {
        return `${countryCode} ${rest.slice(0, 3)}-${rest.slice(3)}`;
      } else if (rest.length <= 10) {
        return `${countryCode} ${rest.slice(0, 3)}-${rest.slice(
          3,
          6
        )}-${rest.slice(6)}`;
      } else {
        return `${countryCode} ${rest.slice(0, 3)}-${rest.slice(
          3,
          6
        )}-${rest.slice(6, 10)}`;
      }
    } else {
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(
          6
        )}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(
          6,
          10
        )}`;
      }
    }
  };

  useEffect(() => {
    if (!idParams) {
      setLoadedStatus("failed");
      return;
    }

    const loadSelectedCompany = async () => {
      try {
        const id = Array.isArray(idParams) ? idParams[0] : idParams;
        const company = await getCompanyById(id);

        if (!company) throw new Error("No se encontró la empresa");

        setCompanyId(id);
        setFormData({
          name: company.name || "",
          street: company.street || "",
          colony: company.colony || "",
          city: company.city || "",
          state: company.state || "",
          zip_code: company.zip_code || "",
          address_number: company.address_number || "",
          phone: company.phone || "",
          cellphone: company.cellphone || "",
          website: company.website || "",
          rfc: company.rfc || "",
          parent_company: company.parent_company || "",
        });
        setLoadedStatus("loaded");
      } catch (error) {
        console.error("Error loading company:", error);
        toast.error(
          "No se pudo cargar la empresa, recargue la página o intentelo más tarde."
        );
        setLoadedStatus("failed");
      }
    };

    loadSelectedCompany();
  }, [idParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      if (!companyId) {
        console.error("No hay ID de empresa");
        return;
      }

      const updateData = {
        name: formData.name,
        street: formData.street || null,
        colony: formData.colony || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        address_number: formData.address_number || null,
        phone: formData.phone || null,
        cellphone: formData.cellphone || null,
        website: formData.website || null,
        rfc: formData.rfc || null,
        parent_company: formData.parent_company || null,
      };

      const result = await updateCompany(companyId, updateData);

      if (result.success) {
        toast.success("¡Empresa actualizada con éxito!");
        // Recargar datos si estamos en la pestaña de hijos
        if (activeTab === "children") {
          setTimeout(() => {
            router.refresh();
          }, 500);
        } else {
          setTimeout(
            () => router.push("/dashboard/empresas-padre/empresas"),
            1500
          );
        }
      } else {
        toast.error(result.message || "Error al actualizar la empresa");
      }
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Error inesperado al actualizar la empresa");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAffiliation = async (childCompanyId: string) => {
    try {
      // Actualizar la empresa hija para quitar la afiliación
      const result = await updateCompany(childCompanyId, {
        parent_company: null
      });

      if (result.success) {
        toast.success("Afiliación eliminada correctamente");
        return;
      } else {
        toast.error(result.message || "Error al eliminar la afiliación");
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error al eliminar afiliación:", error);
      toast.error("Error al eliminar la afiliación");
      throw error;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "rfc") {
      processedValue = value.toUpperCase().replace(/[^A-Z&Ñ0-9]/g, "");
    } else if (name === "phone" || name === "cellphone") {
      processedValue = formatPhoneNumber(value);
    } else if (name === "website") {
      processedValue = value.toLowerCase();
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="mb-6 p-4 lg:p-6">
          <button
            onClick={() => router.push("/dashboard/empresas-padre/empresas")}
            className="inline-flex items-center text-neutral-600 hover:text-[#c6a365] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              {formData.name || "Editar Empresa"}
            </h1>
            <p className="text-neutral-600 mt-2">
              Modifica los datos de la empresa
            </p>
          </div>

          {/* CONTENIDO */}
          {loadedStatus === "loading" ? (
            <CompanySkeleton />
          ) : loadedStatus === "failed" ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#fdeaea] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  Empresa no encontrada
                </h3>
                <p className="text-neutral-600 mb-6">
                  La empresa que intentas editar no existe o ha sido eliminada.
                </p>
                <button
                  onClick={() => router.push("/dashboard/empresas-padre/empresas")}
                  className="inline-flex items-center text-[#c6a365] hover:text-[#b59555]"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Empresas
                </button>
              </div>
            </div>
          ) : (
            <Tabs
              defaultValue="info"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              {/* TABS */}
              <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-[#F5F1E8] border border-[#CFC7B8] rounded-lg p-1 shadow-sm">
                <TabsTrigger
                  value="info"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#a78447] data-[state=active]:to-[#c6a365] data-[state=active]:text-white
                            data-[state=inactive]:bg-[#EDE7D9] data-[state=inactive]:text-[#c6a365]
                            data-[state=active]:shadow-inner data-[state=active]:rounded-lg
                            hover:bg-[#c6a365] transition-all"
                >
                  Información General
                </TabsTrigger>
                <TabsTrigger
                  value="children"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#a78447] data-[state=active]:to-[#c6a365] data-[state=active]:text-white
                            data-[state=inactive]:bg-[#EDE7D9] data-[state=inactive]:text-[#4B4B4B]
                            data-[state=active]:shadow-inner data-[state=active]:rounded-lg
                            hover:bg-[#c6a365] transition-all"
                >
                  Sucursales
                </TabsTrigger>
              </TabsList>

              {/* TAB INFO */}
              <TabsContent value="info" className="mt-0">
                <div className="bg-white rounded-lg border border-[#f5efe6] p-6 shadow-sm">
                  <EmpresaForm
                    empresa={{ ...formData, id: companyId }}
                    handleSubmit={handleSubmit}
                    formData={formData}
                    handleChange={handleChange}
                    errors={errors}
                    loading={loading}
                    isEditing={true}
                    buttonText="Actualizar Empresa"
                    buttonLoadingText="Actualizando..."
                  />
                </div>
              </TabsContent>

              {/* TAB SUCURSALES */}
              <TabsContent value="children" className="mt-0">
                <div className="bg-white rounded-lg border border-[#f5efe6] p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                    Sucursales de {formData.name}
                  </h3>
                  
                  <CompanyChildrenList
                    companyId={companyId}
                    parentCompanyName={formData.name}
                    userPermissions={[
                      "read:empresas",
                      "update:empresas",
                      "delete:empresas",
                      "create:empresas",
                    ]}
                    onRemoveAffiliation={handleRemoveAffiliation}
                    onChildrenAdded={() => {
                      router.refresh();
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}