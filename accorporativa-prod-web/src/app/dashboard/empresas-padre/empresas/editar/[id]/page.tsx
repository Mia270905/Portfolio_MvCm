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
        console.log("Cargando empresa con ID:", id);
        const company = await getCompanyById(id);
        console.log("Empresa cargada:", company);

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
    console.log("Submit del formulario iniciado");
    console.log("Datos del formulario:", formData);

    const newErrors: { [key: string]: string } = {};

    console.log("Errores de validación:", newErrors);

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setErrors({});
    setLoading(true);
    console.log("Iniciando actualización...");

    try {
      if (!companyId) {
        console.error("No hay ID de empresa");
        return;
      }

      console.log("Actualizando empresa con ID:", companyId);

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

      console.log("Datos a actualizar:", updateData);

      const result = await updateCompany(companyId, updateData);

      console.log("Resultado de updateCompany:", result);

      if (result.success) {
        toast.success("¡Empresa actualizada con éxito!");
        // Recargar datos si estamos en la pestaña de hijos
        if (activeTab === "children") {
          // Podrías recargar la página o manejar de otra manera
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
      console.log("Finalizado proceso de actualización");
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
    <div className="min-h-screen bg-custom-bg-primary">
      <div className="mb-6 py-4">
        <button
          onClick={() => router.push("/dashboard/empresas-padre/empresas")}
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-bg-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-custom-text-primary">
            {formData.name || "Actualizar Empresa"}
          </h1>
          <p className="text-custom-text-tertiary mt-2">
            Gestiona la información de la empresa y sus sucursales.
          </p>
        </div>

        {loadedStatus === "loading" ? (
          <CompanySkeleton />
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12">
            <p className="text-custom-text-secondary">
              No se encontró la empresa específicada.
            </p>
            <button
              onClick={() => router.push("/dashboard/empresas-padre/empresas")}
              className="mt-4 inline-flex items-center text-custom-accent-primary hover:text-custom-accent-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Empresas
            </button>
          </div>
        ) : (
          <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-custom-bg-secondary border border-custom-border-primary">
              <TabsTrigger 
                value="info" 
                className="data-[state=active]:bg-custom-accent-primary data-[state=active]:text-white transition-all text-custom-text-secondary"
              >
                Información General
              </TabsTrigger>
              <TabsTrigger 
                value="children" 
                className="data-[state=active]:bg-custom-accent-primary data-[state=active]:text-white transition-all text-custom-text-secondary"
              >
                Sucursales
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-0">
              <EmpresaForm
                empresa={{...formData, id: companyId}}
                handleSubmit={handleSubmit}
                formData={formData}
                handleChange={handleChange}
                errors={errors}
                loading={loading}
                isEditing={true}
                buttonText="Actualizar Empresa"
                buttonLoadingText="Actualizando..."
              />
            </TabsContent>

            <TabsContent value="children" className="mt-0">
              <div className="bg-custom-bg-primary rounded-lg border border-custom-border-primary p-6">
                <CompanyChildrenList 
                  companyId={companyId} 
                  parentCompanyName={formData.name}
                  userPermissions={["read:empresas", "update:empresas", "delete:empresas", "create:empresas"]} 
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
  );
}