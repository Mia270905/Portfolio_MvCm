"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ProductCategory } from "@/components/dashboard/categorias/category-list";
import CategoryForm from "@/components/dashboard/categorias/category-form";
import { updateCategory } from "@/lib/actions/category.actions";
import { uploadFile } from "@/lib/supabase/upload-image";

const supabase = createClient();

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [category, setCategory] = useState<ProductCategory | null>(null);
  const [formData, setFormData] = useState<Partial<ProductCategory>>({
    title: "",
    description: "",
    image_url: "",
    active: true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categoryId = params.id as string;

  // Obtener la categoría al cargar la página
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const { data, error } = await supabase
          .from("product_categories")
          .select("*")
          .eq("id", categoryId)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setCategory(data);
          setFormData({
            title: data.title,
            description: data.description,
            image_url: data.image_url || "",
            active: data.active,
          });
        }
      } catch (error) {
        console.error("Error al obtener categoría:", error);
        toast.error("Error al cargar la categoría");
      } finally {
        setIsFetching(false);
      }
    };

    if (categoryId) {
      fetchCategory();
    }
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Usuario no autenticado");

      let imageUrl = formData.image_url as string | undefined;

      if (formData.image_url && formData.image_url instanceof File) {
        const uploadResult = await uploadFile(
          "categories",
          categoryId,
          formData.image_url
        );
        if (!uploadResult.success) {
          toast.error("Error al subir la imagen: " + uploadResult.error);
          setLoading(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      if (!formData.image_url) {
        imageUrl = "";
      }

      const result = await updateCategory({
        categoryId,
        title: formData.title!,
        description: formData.description!,
        image_url: imageUrl,
        active: formData.active,
        userId: user.id,
      });

      if (!result.success) {
        toast.error("Error al actualizar la categoría: " + result.message);
        setLoading(false);
        return;
      }

      setCategory(result.data!);
      toast.success("¡Categoría actualizada con éxito!");
      router.push("/dashboard/productos/categorias");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al actualizar la categoría");
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

  if (isFetching) {
    return (
      <div>
        <div className="mb-6">
          <div className="inline-flex items-center text-gray-600 p-2 rounded-lg">
            <ArrowLeft className="w-5 h-5 mr-2" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="h-8 bg-gray-800 rounded-sm w-64 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-800 rounded-sm w-96 animate-pulse"></div>
          </div>

          <div className="bg-[#0A0F17] rounded-lg shadow-xs border border-gray-800 p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-10 bg-gray-800 rounded"></div>
              <div className="h-24 bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
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
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Categoría no encontrada
            </h1>
            <p className="text-gray-500 mb-4">
              La categoría que intentas editar no existe o ha sido eliminada.
            </p>
            <a
              href="/dashboard/productos/categorias"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Categorías
            </a>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-white">Editar Categoría</h1>
          <p className="text-gray-500 mt-1">
            Modifica los datos de la categoría de productos
          </p>
        </div>

        <CategoryForm
          handleSubmit={handleSubmit}
          formData={formData}
          handleChange={handleChange}
          handleToggleActive={handleToggleActive}
          errors={errors}
          buttonText="Actualizar"
          buttonLoadingText="Actualizando..."
          loading={loading}
          onImageChange={(fileOrUrl: string | File) =>
            setFormData((prev) => ({ ...prev, image_url: fileOrUrl }))
          }
        />
      </div>
    </div>
  );
}
