"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, PhoneCall } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhoneForm from "@/components/dashboard/numero-whatsapp/phone-form";
import type { WhatsAppConfigForm } from "@/lib/actions/configuration.actions";
import {
  getPhoneConfig,
  createPhoneConfig,
  updatePhoneConfig,
} from "@/lib/actions/configuration.actions";
import { toast } from "sonner";

export default function EditPhonePage() {
  const [formData, setFormData] = useState<WhatsAppConfigForm>({
    phone_number: "",
    active: true,
  });
  const [configId, setConfigId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    fetchPhoneConfig();
  }, []);

  const formatPhoneForDisplay = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 10) {
      return `${cleaned.substring(0, 3)}-${cleaned.substring(
        3,
        6
      )}-${cleaned.substring(6)}`;
    } else if (cleaned.length === 11) {
      return `${cleaned.substring(1, 4)}-${cleaned.substring(
        4,
        7
      )}-${cleaned.substring(7)}`;
    }

    return cleaned;
  };

  const fetchPhoneConfig = async () => {
    try {
      const data = await getPhoneConfig();
      if (data.success && data.data) {
        setConfigId(data.data.id);
        setFormData({
          phone_number: formatPhoneForDisplay(data.data.value),
          active: data.data.active,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("No se encontró")) {
        toast.error("Error al cargar configuración: " + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone_number") {
      let cleanedValue = value.replace(/[^\d-]/g, "");
      const digitsOnly = cleanedValue.replace(/\D/g, "");

      if (digitsOnly.length <= 3) {
        cleanedValue = digitsOnly;
      } else if (digitsOnly.length <= 6) {
        cleanedValue = `${digitsOnly.substring(0, 3)}-${digitsOnly.substring(
          3
        )}`;
      } else {
        cleanedValue = `${digitsOnly.substring(0, 3)}-${digitsOnly.substring(
          3,
          6
        )}-${digitsOnly.substring(6, 10)}`;
      }

      setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    const digitsOnly = formData.phone_number.replace(/\D/g, "");

    if (!digitsOnly.trim()) {
      newErrors.phone_number = "El número de teléfono es obligatorio";
    } else if (digitsOnly.length !== 10) {
      newErrors.phone_number =
        "El número debe tener exactamente 10 dígitos (XXX-XXX-XXXX)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Usuario no autenticado");

      const cleanPhone = formData.phone_number.replace(/\D/g, "");

      if (configId) {
        const result = await updatePhoneConfig({
          id: configId,
          phone_number: cleanPhone,
          active: formData.active,
          userId: user.id,
        });

        if (!result.success) throw new Error(result.message);
        toast.success("Configuración actualizada correctamente");
      } else {
        const result = await createPhoneConfig({
          phone_number: cleanPhone,
          active: formData.active,
          userId: user.id,
        });

        if (!result.success) throw new Error(result.message);
        toast.success("Configuración creada correctamente");
      }

      router.push("/dashboard/sitio-web/numero_whatsapp");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast.error("Error al guardar configuración: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-bg-primary">
        <div className="mb-6 p-4">
          <Link
            href="/dashboard/sitio-web/numero_whatsapp"
            className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
          <div className="h-8 bg-custom-bg-secondary rounded w-1/3 mb-6" />
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 space-y-4">
            <div className="h-10 bg-custom-bg-tertiary rounded w-full" />
            <div className="h-10 bg-custom-bg-tertiary rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      {/* Flecha volver */}
      <div className="mb-6 p-4">
        <Link
          href="/dashboard/sitio-web/numero_whatsapp"
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-custom-text-primary flex items-center gap-3">
            <PhoneCall className="w-8 h-8" />
            {configId
              ? "Editar Configuración de Teléfono"
              : "Nueva Configuración de Teléfono"}
          </h1>
          <p className="text-custom-text-secondary mt-2">
            Configura tu número telefónico para recibir llamadas de clientes
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6">
          <PhoneForm
            handleSubmit={handleSubmit}
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            buttonText={configId ? "Guardar Cambios" : "Crear Configuración"}
            buttonLoadingText={configId ? "Guardando..." : "Creando..."}
            loading={saving}
          />
        </div>
      </div>
    </div>
  );
}
