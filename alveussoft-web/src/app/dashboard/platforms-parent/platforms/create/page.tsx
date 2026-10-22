"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPlatform } from "@/lib/actions/platform.actions";
import { PlatformForm, PlatformPayload } from "@/components/dashboard/platforms/platform-form"

export default function CreatePlatformPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PlatformPayload>({
    code: "",
    name: "",
    description: "",
    domain: "",
    contact_id: "",
    is_write_protected: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Función para normalizar URLs
  const normalizeDomain = (url: string): string => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        return `https://${url}`;
      }
      return url;
    }
    return url;
  };

  // Manejar cambios de inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Convertir código a minúsculas y solo permitir letras minúsculas, números y guiones
    if (name === 'code') {
      processedValue = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
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

    if (!formData.code?.trim()) {
      newErrors.code = "El código es requerido";
    } else if (formData.code.length < 2) {
      newErrors.code = "El código debe tener al menos 2 caracteres";
    } else if (!/^[a-z0-9-]+$/.test(formData.code)) {
      newErrors.code = "El código solo puede contener letras minúsculas, números y guiones";
    }

    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (!formData.domain?.trim()) {
      newErrors.domain = "El dominio es requerido";
    } else {
      // Validación más flexible de dominio
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-.]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
      const cleanDomain = formData.domain.replace(/^https?:\/\//, '');
      if (!domainRegex.test(cleanDomain)) {
        newErrors.domain = "El formato del dominio no es válido";
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
      const normalizedDomain = normalizeDomain(formData.domain);
      
      const result = await createPlatform({
        code: formData.code,
        name: formData.name,
        description: formData.description,
        domain: normalizedDomain,
        contact_id: formData.contact_id,
      });

      if (result.success) {
        toast.success("¡Plataforma creada con éxito!"); 
        router.push("/dashboard/platforms-parent/platforms");
      } else {
        toast.error(result.message || "Error al crear la plataforma");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al crear la plataforma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlatformForm
      handleSubmit={handleSubmit}
      formData={formData}
      handleChange={handleChange}
      errors={errors}
      loading={loading}
      buttonText="Crear Plataforma"
      buttonLoadingText="Creando..."
    />
  );
}