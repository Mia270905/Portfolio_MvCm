"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { createCompany } from "@/lib/actions/company.actions";
import { EmpresaForm, EmpresaPayload } from "@/components/dashboard/empresas/company-form"

export default function CreateCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmpresaPayload>({
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

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Función para normalizar URLs
  const normalizeWebsite = (url: string): string => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        return `https://${url}`;
      }
      return url;
    }
    return url;
  };

  // Función para formatear RFC a mayúsculas
  const formatRfc = (rfc: string): string => {
    return rfc.toUpperCase().replace(/[^A-Z&Ñ0-9]/g, '');
  };

  // Función para formatear números de teléfono con guiones
  const formatPhoneNumber = (value: string): string => {
    // Remover todos los caracteres no numéricos excepto el +
    const numbers = value.replace(/[^\d+]/g, '');
    
    // Si empieza con +, mantenerlo separado
    if (numbers.startsWith('+')) {
      const countryCode = numbers.slice(0, 3); // +52
      const rest = numbers.slice(3);
      
      if (rest.length <= 3) {
        return `${countryCode} ${rest}`;
      } else if (rest.length <= 6) {
        return `${countryCode} ${rest.slice(0, 3)}-${rest.slice(3)}`;
      } else if (rest.length <= 10) {
        return `${countryCode} ${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6)}`;
      } else {
        return `${countryCode} ${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6, 10)}`;
      }
    } else {
      // Sin código de país
      if (numbers.length <= 3) {
        return numbers;
      } else if (numbers.length <= 6) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      } else if (numbers.length <= 10) {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
      } else {
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
      }
    }
  };

  // Manejar cambios de inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Aplicar formatos específicos por campo
    if (name === 'rfc') {
      processedValue = formatRfc(value);
    } else if (name === 'phone' || name === 'cellphone') {
      // Aplicar formato con guiones
      processedValue = formatPhoneNumber(value);
    } else if (name === 'website') {
      processedValue = value.toLowerCase();
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nombre (requerido)
    if (!formData.name?.trim()) {
      newErrors.name = "El nombre de la empresa es requerido";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres";
    }

    // Validar RFC (formato)
    if (formData.rfc && formData.rfc.trim()) {
      const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
      if (!rfcRegex.test(formData.rfc)) {
        newErrors.rfc = "El formato del RFC no es válido";
      }
    }

    // Validar teléfono (formato más flexible para permitir guiones)
    if (formData.phone && formData.phone.trim()) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      const cleanPhone = formData.phone.replace(/[-\s]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = "El formato del teléfono no es válido";
      }
    }

    // Validar celular (formato más flexible para permitir guiones)
    if (formData.cellphone && formData.cellphone.trim()) {
      const cellphoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      const cleanCellphone = formData.cellphone.replace(/[-\s]/g, '');
      if (!cellphoneRegex.test(cleanCellphone)) {
        newErrors.cellphone = "El formato del celular no es válido";
      }
    }

    // Validar website (formato)
    if (formData.website && formData.website.trim()) {
      const websiteRegex = /^(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
      const cleanWebsite = formData.website.replace(/^https?:\/\//, '');
      
      const testUrl1 = formData.website; // formato original
      const testUrl2 = `https://${cleanWebsite}`; // con https
      const testUrl3 = cleanWebsite.startsWith('www.') ? `https://${cleanWebsite}` : cleanWebsite; // con www
      
      if (!websiteRegex.test(testUrl1) && !websiteRegex.test(testUrl2) && !websiteRegex.test(testUrl3)) {
        newErrors.website = "El formato del website no es válido. Ejemplos válidos: miempresa.com, www.miempresa.com, https://miempresa.com";
      }
    }

    // Validar código postal (formato)
    if (formData.zip_code && formData.zip_code.trim()) {
      const zipCodeRegex = /^\d{5}$/;
      if (!zipCodeRegex.test(formData.zip_code)) {
        newErrors.zip_code = "El código postal debe tener 5 dígitos";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para enviar
      const companyData = {
        name: formData.name.trim(),
        street: formData.street?.trim() || null,
        colony: formData.colony?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        zip_code: formData.zip_code?.trim() || null,
        address_number: formData.address_number?.trim() || null,
        phone: formData.phone?.trim() || null,
        cellphone: formData.cellphone?.trim() || null,
        website: formData.website?.trim() ? normalizeWebsite(formData.website) : null,
        rfc: formData.rfc?.trim() || null,
        parent_company: formData.parent_company || null,
      };

      const result = await createCompany(companyData);

      if (result.success) {
        toast.success("¡Empresa creada con éxito!"); 
        router.push("/dashboard/empresas-padre/empresas");
      } else {
        toast.error(result.message || "Error al crear la empresa");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al crear la empresa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      <div className="mb-6 py-4">
        <button
          onClick={() => router.push("/dashboard/empresas-padre/empresas")}
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-custom-accent-tertiary">
            Crear Empresa
          </h1>
          <p className="text-gray-500 mt-2">
            Completa la información para registrar una nueva empresa en el sistema.
          </p>
        </div>

      {/* Formulario */}
      <EmpresaForm
        handleSubmit={handleSubmit}
        formData={formData}
        handleChange={handleChange}
        errors={errors}
        loading={loading}
        buttonText="Crear Empresa"
        buttonLoadingText="Creando..."
      />
      </div>
    </div>
  );
}