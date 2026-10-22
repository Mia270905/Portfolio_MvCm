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
import { uploadImageAction, deleteImageAction } from "@/lib/actions/storage.actions";

interface FormData {
  name: string;
  active: boolean;
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
  logo_url?: string | null;
  logo_path?: string | null;
  logo_file?: File | null;
}

export default function EditCompanyPage() {
  const router = useRouter();
  const { id: idParams } = useParams();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    active: true,
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
    logo_url: null,
    logo_path: null,
    logo_file: null,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loadedStatus, setLoadedStatus] = useState("loading");
  const [companyId, setCompanyId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("info"); // "info" o "children"
  const [logoMarkedForDeletion, setLogoMarkedForDeletion] = useState(false);
  const [logoPathToDelete, setLogoPathToDelete] = useState<string | null>(null);

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
          active: company.active || false,
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
          logo_url: company.logo_url || null,
          logo_path: company.logo_path || null,
          logo_file: null,
        });
        setLogoMarkedForDeletion(false); // Reset flag al cargar
        setLogoPathToDelete(null); // Reset path al cargar
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

      let logoUrl = formData.logo_url;
      let logoPath = formData.logo_path;

      // Si el logo está marcado para eliminación (sin reemplazo), eliminarlo de Storage
      if (logoMarkedForDeletion && logoPathToDelete && !formData.logo_file) {
        toast.loading("Eliminando logo...");
        await deleteImageAction(logoPathToDelete, "company-logos");
        logoUrl = null;
        logoPath = null;
        toast.dismiss();
      }

      // Si hay un nuevo archivo de logo, subirlo (upsert sobrescribe automáticamente)
      if (formData.logo_file) {
        toast.loading("Subiendo logo...");
        const uploadResult = await uploadImageAction(
          formData.logo_file,
          companyId,
          "company-logos"
        );
        
        if (uploadResult.error || !uploadResult.url) {
          toast.dismiss();
          toast.error(uploadResult.error || "Error al subir el logo");
          setLoading(false);
          return;
        }

        // Agregar cache-buster para evitar que el navegador use imagen cacheada
        const cacheBuster = `?t=${Date.now()}`;
        logoUrl = uploadResult.url + cacheBuster;
        logoPath = uploadResult.path;
        toast.dismiss();
      }

      const updateData = {
        name: formData.name,
        street: formData.street || null,
        active: formData.active,
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
        logo_url: logoUrl,
        logo_path: logoPath,
      };

      const result = await updateCompany(companyId, updateData);

      if (result.success) {
        // Actualizar formData local con los nuevos valores (incluyendo cache-buster)
        setFormData(prev => ({
          ...prev,
          logo_url: logoUrl,
          logo_path: logoPath,
          logo_file: null,
        }));
        
        // Reset flags de eliminación
        setLogoMarkedForDeletion(false);
        setLogoPathToDelete(null);
        
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

  const handleChange = (e: React.ChangeEvent<any> | { target: { name: string; value: any } }) => {
  const { name, value } = e.target;

  let processedValue: any = value;

  if (name === "active") {
    processedValue = Boolean(value); // <-- Aquí forzamos booleano
  } else if (name === "rfc") {
    processedValue = String(value).toUpperCase().replace(/[^A-Z&Ñ0-9]/g, "");
  } else if (name === "phone" || name === "cellphone") {
    processedValue = formatPhoneNumber(String(value));
  } else if (name === "website") {
    processedValue = String(value).toLowerCase();
  }

  setFormData(prev => ({
    ...prev,
    [name]: processedValue,
  }));

  if (errors[name]) {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }
};

  // Manejar cambio de logo
  const handleLogoChange = (file: File | string) => {
    if (typeof file === "string") {
      // Si es una cadena vacía, limpiar el logo y marcar para eliminación si había un logo previo
      setFormData((prev) => {
        // Marcar para eliminación solo si había un logo previo en Storage
        if (prev.logo_path) {
          setLogoMarkedForDeletion(true);
          setLogoPathToDelete(prev.logo_path); // Guardar path antes de limpiarlo
        }
        
        return {
          ...prev,
          logo_file: null,
          logo_url: null,
          logo_path: null,
        };
      });
    } else {
      // Si es un archivo nuevo, guardarlo y desmarcar eliminación
      setLogoMarkedForDeletion(false);
      setLogoPathToDelete(null);
      setFormData((prev) => ({
        ...prev,
        logo_file: file,
      }));
    }

    // Limpiar error del campo
    if (errors.logo_file) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.logo_file;
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-custom-primary">
      <div className="mb-6 bg-custom-primary py-4">
        <button
          onClick={() => router.push("/dashboard/empresas-padre/empresas")}
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {formData.name || "Actualizar Empresa"}
          </h1>
          <p className="text-gray-400 mt-2">
            Gestiona la información de la empresa y sus sucursales.
          </p>
        </div>

        {loadedStatus === "loading" ? (
          <CompanySkeleton />
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12">
            <p className="text-gray-200">
              No se encontró la empresa específicada.
            </p>
            <button
              onClick={() => router.push("/dashboard/empresas-padre/empresas")}
              className="mt-4 inline-flex items-center text-yellow-400 hover:text-yellow-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Empresas
            </button>
          </div>
        ) : (
          <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-gray-900/50 border border-gray-800">
              <TabsTrigger 
                value="info" 
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-gray-900 transition-all"
              >
                Información General
              </TabsTrigger>
              <TabsTrigger 
                value="children" 
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white transition-all"
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
                handleLogoChange={handleLogoChange}
                errors={errors}
                loading={loading}
                isEditing={true}
                buttonText="Actualizar Empresa"
                buttonLoadingText="Actualizando..."
              />
            </TabsContent>

            <TabsContent value="children" className="mt-0">
              <div className="bg-custom-secondary rounded-lg border border-custom-secondary p-6">
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