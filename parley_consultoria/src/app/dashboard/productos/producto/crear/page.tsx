"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  createManyProductPriceList,
  createProduct,
  getActiveCategories,
  getActiveTaxes,
  getPriceLists,
  updateProductImage,
  updateProductTaxes,
} from "@/lib/actions/product.actions";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/upload-image";
import ProductFormFields from "@/components/dashboard/productos/product-form-fields";
import { ProductFormSkeleton } from "@/components/dashboard/productos/product-form-skeleton";
import { ProductPriceList } from "@/components/dashboard/productos/price-list-selector";
import { getMeasurementOptions } from "@/lib/actions/measurement.actions";

const supabase = createClient();

interface MeasurementOption {
  id: string;
  unit: string;
  quantity: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; title: string }[]>(
    []
  );
  const [priceLists, setPriceLists] = useState<{ id: string; name: string }[]>(
    []
  );
  const [measurements, setMeasurements] = useState<MeasurementOption[]>([]);
  
  const [taxes, setTaxes] = useState<
    {
      id: string;
      name: string;
      rate: number;
      tax_type: string;
    }[]
  >([]);

  const [formData, setFormData] = useState({
    code: "",
    bar_code: "",
    name: "",
    name_unaccent: "",
    description: "",
    image_url: "",
    image: null as File | null,
    id_price_list: "",
    category_id: "",
    cost_price: "",
    type: "article" as 'article' | 'service', // ← AGREGADO
    measure_unit: "",
    is_available: true,
    price_lists: [] as ProductPriceList[],
    tax_ids: [] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Cargar categorías, listas de precios y impuestos
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, priceListsData, taxesData, measurementsData] =
          await Promise.all([
            getActiveCategories(),
            getPriceLists(),
            getActiveTaxes(),
            getMeasurementOptions(),
          ]);
        setCategories(categoriesData);
        setPriceLists(priceListsData);
        setTaxes(taxesData);
        setMeasurements(measurementsData);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        toast.error("Error al cargar datos del formulario");
      } finally {
        setInitialLoading(false);
      }
    };
    loadData();
  }, []);

  // Manejar cambio de imagen
  const handleImageChange = (fileOrUrl: File | string) => {
    if (fileOrUrl instanceof File) {
      setFormData((prev) => ({ ...prev, image: fileOrUrl }));
    } else {
      setFormData((prev) => ({ ...prev, image_url: fileOrUrl }));
    }
    if (errors.image) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.image;
        return newErrors;
      });
    }
  };

  // Manejar cambios de inputs
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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

  // Función para manejar cambio de tipo específico
  const handleTypeChange = (type: 'article' | 'service') => {
    setFormData((prev) => ({ 
      ...prev, 
      type,
      // Resetear measure_unit si cambia a servicio
      ...(type === 'service' ? { measure_unit: "" } : {})
    }));
    if (errors.type) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.type;
        return newErrors;
      });
    }
  };

  // Alternar disponibilidad
  const handleToggleAvailable = () => {
    setFormData((prev) => ({ ...prev, is_available: !prev.is_available }));
  };

  const handleAddPriceList = (priceListId: string) => {
    if (!formData.price_lists.find((pl) => pl.id === priceListId)) {
      setFormData((prev) => ({
        ...prev,
        price_lists: [...prev.price_lists, { id: priceListId, price: "" }],
      }));
    }
  };

  const handleRemovePriceList = (priceListId: string) => {
    setFormData((prev) => ({
      ...prev,
      price_lists: prev.price_lists.filter((pl) => pl.id !== priceListId),
    }));
  };

  const handleUpdatePrice = (priceListId: string, price: string) => {
    setFormData((prev) => ({
      ...prev,
      price_lists: prev.price_lists.map((pl) =>
        pl.id === priceListId ? { ...pl, price } : pl
      ),
    }));
  };

  const handleAddTax = (taxId: string) => {
    if (!formData.tax_ids.includes(taxId)) {
      setFormData((prev) => ({
        ...prev,
        tax_ids: [...prev.tax_ids, taxId],
      }));
    }
  };

  const handleRemoveTax = (taxId: string) => {
    setFormData((prev) => ({
      ...prev,
      tax_ids: prev.tax_ids.filter((id) => id !== taxId),
    }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    const newErrors: { [key: string]: string } = {};
    
    // Validación del tipo
    if (!formData.type) {
      newErrors.type = "El tipo de producto es requerido";
    }
    
    if (!formData.code.trim()) newErrors.code = "El código es requerido";
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (!formData.description.trim())
      newErrors.description = "La descripción es requerida";
    if (!formData.category_id)
      newErrors.category_id = "La categoría es requerida";
    if (!formData.cost_price || Number(formData.cost_price) < 0) {
      newErrors.cost_price = "El precio de costo debe ser mayor o igual a 0";
    }
    
    if (formData.price_lists) {
      const invalidPriceList = formData.price_lists.find(
        (pl: any) =>
          !pl.price || Number(pl.price) <= 0 || isNaN(Number(pl.price))
      );

      if (invalidPriceList) {
        newErrors.price_list = `El precio en una lista de precio debe ser mayor a 0`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Usuario autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Usuario no autenticado");

      // 1. Crear el producto
      const result = await createProduct({
        code: formData.code,
        bar_code: formData.bar_code,
        name: formData.name,
        name_unaccent: formData.name_unaccent,
        description: formData.description,
        image_url: "",
        id_price_list: formData.id_price_list || null,
        category_id: formData.category_id,
        cost_price: Number(formData.cost_price),
        type: formData.type, 
        measure_unit: formData.measure_unit || null,
        is_available: formData.is_available,
      });

      if (!result.success || !result.product) {
        toast.error("Error al crear el producto: " + result.message);
        setLoading(false);
        return;
      }

      // 2. Crear listas de precios
      const resultPriceList = await createManyProductPriceList({
        product_id: result.product.id,
        price_lists: formData.price_lists,
      });

      if (!resultPriceList.success) {
        toast.error(
          "Error al asignar precio de lista al producto: " + result.message
        );
        toast.error(
          "Producto creado pero hubo un error al cargar el precio de lista"
        );
      }

      // 3. Agregar impuestos al producto (si hay)
      if (formData.tax_ids.length > 0) {
        const resultTaxes = await updateProductTaxes({
          productId: result.product.id,
          tax_ids: formData.tax_ids,
        });

        if (!resultTaxes.success) {
          toast.error(
            "Producto creado pero hubo un error al asignar impuestos",
          );
        }
      }

      // 4. Subir imagen (si existe)
      if (formData.image instanceof File) {
        const uploadResult = await uploadFile(
          "products",
          result.product.id,
          formData.image
        );

        if (uploadResult.success && uploadResult.url) {
          await updateProductImage(result.product.id, uploadResult.url);
        } else {
          toast.error("Producto creado pero hubo un error al subir la imagen");
        }
      }

      toast.success("¡Producto creado con éxito!");
      router.push("/dashboard/productos/producto");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error inesperado al crear el producto");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
        </div>
        <ProductFormSkeleton />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">
          Crear Nuevo Producto
        </h1>

        <ProductFormFields
          handleSubmit={handleSubmit}
          formData={formData}
          handleChange={handleChange}
          handleSelectChange={(name, value) =>
            setFormData((prev) => ({ ...prev, [name]: value }))
          }
          handleTypeChange={handleTypeChange} 
          handleToggleAvailable={handleToggleAvailable}
          errors={errors}
          categories={categories}
          priceLists={priceLists}
          measurements={measurements}
          buttonText="Crear Producto"
          buttonLoadingText="Creando..."
          loading={loading}
          onImageChange={handleImageChange}
          onAddPriceList={handleAddPriceList}
          onRemovePriceList={handleRemovePriceList}
          onUpdatePrice={handleUpdatePrice}
          taxes={taxes}
          selectedTaxIds={formData.tax_ids}
          onAddTax={handleAddTax}
          onRemoveTax={handleRemoveTax}
        />
      </div>
    </div>
  );
}