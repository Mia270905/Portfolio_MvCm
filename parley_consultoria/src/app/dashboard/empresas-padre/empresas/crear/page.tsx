"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Building2 } from "lucide-react";
import { createCompany } from "@/lib/actions/company.actions";
import {
  EmpresaForm,
  EmpresaPayload,
} from "@/components/dashboard/empresas/company-form";

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

  /* =======================
     TODA TU LÓGICA ORIGINAL
     ======================= */

  const normalizeWebsite = (url: string): string => {
    if (!url) return "";
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      if (url.includes(".") && !url.includes(" ")) {
        return `https://${url}`;
      }
      return url;
    }
    return url;
  };

  const formatRfc = (rfc: string): string => {
    return rfc.toUpperCase().replace(/[^A-Z&Ñ0-9]/g, "");
  };

  const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d+]/g, "");

    if (numbers.startsWith("+")) {
      const countryCode = numbers.slice(0, 3);
      const rest = numbers.slice(3);

      if (rest.length <= 3) return `${countryCode} ${rest}`;
      if (rest.length <= 6)
        return `${countryCode} ${rest.slice(0, 3)}-${rest.slice(3)}`;
      return `${countryCode} ${rest.slice(0, 3)}-${rest.slice(
        3,
        6
      )}-${rest.slice(6, 10)}`;
    } else {
      if (numbers.length <= 3) return numbers;
      if (numbers.length <= 6)
        return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
      return `${numbers.slice(0, 3)}-${numbers.slice(
        3,
        6
      )}-${numbers.slice(6, 10)}`;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "rfc") processedValue = formatRfc(value);
    else if (name === "phone" || name === "cellphone")
      processedValue = formatPhoneNumber(value);
    else if (name === "website") processedValue = value.toLowerCase();

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "El nombre de la empresa es requerido";
    }

    if (formData.rfc) {
      const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
      if (!rfcRegex.test(formData.rfc)) {
        newErrors.rfc = "El formato del RFC no es válido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      const result = await createCompany({
        ...formData,
        website: formData.website
          ? normalizeWebsite(formData.website)
          : null,
      });

      if (result.success) {
        toast.success("¡Empresa creada con éxito!");
        router.push("/dashboard/empresas-padre/empresas");
      } else {
        toast.error(result.message || "Error al crear la empresa");
      }
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     DISEÑO NUEVO
     ======================= */

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Volver */}
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => router.push("/dashboard/empresas-padre/empresas")}
          className="inline-flex items-center text-gray-700 hover:text-gray-900 p-2 hover:bg-[#FAF7F2] rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-8 h-8 text-yellow-600" />
            Crear Empresa
          </h1>
          <p className="text-gray-600 mt-2">
            Completa la información para registrar una nueva empresa.
          </p>
        </div>

        {/* Card formulario */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
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
    </div>
  );
}
