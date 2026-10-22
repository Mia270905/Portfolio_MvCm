"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  createContactGroup,
} from "@/lib/actions/contact_group.actions";
import type { ContactGroup } from "@/components/dashboard/grupo-de-contactos/contact-group.types";
import ContactGroupForm from "@/components/dashboard/grupo-de-contactos/contact-group-form";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type ContactGroupFormData = Partial<ContactGroup> & {
  image_url?: string | File;
};

export default function CreateContactGroupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ContactGroupFormData>({
    title: "",
    description: "",
    image_url: "",
    active: true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!formData.title?.trim()) newErrors.title = "El título es requerido.";
    if (!formData.description?.trim())
      newErrors.description = "La descripción es requerida.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Usuario no autenticado");

      const result = await createContactGroup({
        title: formData.title!,
        description: formData.description!,
        image_url: "", 
        active: formData.active ?? true,
        userId: user.id,
      });

      if (!result.success || !result.data) {
        toast.error("Error al crear el grupo de contactos: " + result.message);
        setLoading(false);
        return;
      }

      toast.success("¡Grupo de contactos creado con éxito!");
      router.push("/dashboard/contacts-parent/grupo-contactos");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al crear el grupo de contactos.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, active: !prev.active }));
  };

  const handleImageChange = (urlOrFile: string | File) => {
    setFormData(
      (prev): ContactGroupFormData => ({
        ...prev,
        image_url: urlOrFile,
      })
    );
  };

  return (
    <div>
      {/* Volver */}
      <div className="mb-6">
        <a
          href="/dashboard/contacts-parent/grupo-contactos"
          className="inline-flex items-center text-yellow-700 hover:text-yellow-900 p-2 hover:bg-yellow-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-yellow-800">
            Crear nuevo grupo de contactos
          </h1>
          <p className="text-yellow-700/80 mt-1">
            Completa los datos para registrar un nuevo grupo de contactos
          </p>
        </div>

        {/* Formulario */}
        <ContactGroupForm
          handleSubmit={handleSubmit}
          formData={formData}
          handleChange={handleChange}
          handleToggleActive={handleToggleActive}
          errors={errors}
          buttonText="Crear grupo de contactos"
          buttonLoadingText="Creando..."
          loading={loading}
          onImageChange={handleImageChange}
        />
      </div>
    </div>
  );
}
