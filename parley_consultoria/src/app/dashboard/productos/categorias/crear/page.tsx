"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  createCategory,
  updateCategoryImage,
} from "@/lib/actions/category.actions";
import type { ProductCategory } from "@/components/dashboard/categorias/category-list";
import CategoryForm from "@/components/dashboard/categorias/category-form";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/upload-image";

const supabase = createClient();

// ✅ Tipo actualizado para ser compatible con CategoryForm
type CategoryFormData = Partial<ProductCategory> & {
  image_url?: string | File;
};

export default function CreateCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
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

      const result = await createCategory({
        title: formData.title!,
        description: formData.description!,
        image_url: "", 
        active: formData.active ?? true,
        userId: user.id,
      });

      if (!result.success || !result.data) {
        toast.error("Error al crear la categoría: " + result.message);
        setLoading(false);
        return;
      }

      const categoryId = result.data.id;

      // ✅ Subir imagen solo si es un archivo
      if (typeof formData.image_url !== "string" && formData.image_url) {
        const file = formData.image_url as File;

        // Bucket que subira, el nombre y el archivo
        const uploadResult = await uploadFile("categories", categoryId, file);
        
        if (!uploadResult.success) {
          toast.error(
            "Categoría creada pero error al subir la imagen: " +
              uploadResult.error
          );
          setLoading(false);
          router.push("/dashboard/productos/categorias");
          return;
        }

        const updateResult = await updateCategoryImage({
          categoryId: categoryId,
          image_url: uploadResult.url!,
        });

        if (!updateResult.success) {
          toast.error("Categoría creada pero error al actualizar la imagen");
          setLoading(false);
          router.push("/dashboard/productos/categorias");
          return;
        }
      }

      toast.success("¡Categoría creada con éxito!");
      router.push("/dashboard/productos/categorias");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al crear la categoría.");
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
      (prev): CategoryFormData => ({
        ...prev,
        image_url: urlOrFile,
      })
    );
  };

  return (
    <div>
      <div className="mb-6">
        <a
          href="/dashboard/productos/categorias"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">
            Crear Nueva Categoría
          </h1>
          <p className="text-gray-500 mt-1">
            Completa los datos para registrar una nueva categoría de productos
          </p>
        </div>

        <CategoryForm
          handleSubmit={handleSubmit}
          formData={formData}
          handleChange={handleChange}
          handleToggleActive={handleToggleActive}
          errors={errors}
          buttonText="Crear Categoría"
          buttonLoadingText="Creando..."
          loading={loading}
          onImageChange={handleImageChange}
        />
      </div>
    </div>
  );
}
