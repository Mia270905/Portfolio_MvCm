"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  updateProduct,
  getProductById,
  getActiveCategories,
  getPriceLists,
  updateProductPriceList,
  getActiveTaxes,
  updateProductTaxes,
} from "@/lib/actions/product.actions";
import { getMeasurementOptions } from "@/lib/actions/measurement.actions";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/supabase/upload-image";
import ProductFormFields from "@/components/dashboard/productos/product-form-fields";
import { ProductFormSkeleton } from "@/components/dashboard/productos/product-form-skeleton";
import { ProductPriceList } from "@/components/dashboard/productos/price-list-selector";

const supabase = createClient();

interface MeasurementOption {
  id: string;
  unit: string;
  quantity: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [categories, setCategories] = useState<{ id: string; title: string }[]>(
    []
  );
  const [priceLists, setPriceLists] = useState<{ id: string; name: string }[]>(
    []
  );
  const [measurements, setMeasurements] = useState<MeasurementOption[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [taxes, setTaxes] = useState<
    {
      id: string;
      name: string;
      rate: number;
      tax_type: string;
    }[]
  >([]);

  const [formData, setFormData] = useState<{
    code: string;
    bar_code: string;
    name: string;
    name_unaccent: string;
    description: string;
    image_url: string;
    image?: File | null;
    id_price_list: string;
    category_id: string;
    cost_price: string;
    type: "article" | "service";
    measure_unit: string;
    // product_code_sat: string;
    // product_tax_object_sat: string;
    is_available: boolean;
    price_lists: ProductPriceList[];
    tax_ids: string[];
  }>({
    code: "",
    bar_code: "",
    name: "",
    name_unaccent: "",
    description: "",
    image_url: "",
    image: null,
    id_price_list: "",
    category_id: "",
    cost_price: "",
    type: "article",
    measure_unit: "none",
    // product_code_sat: "",
    // product_tax_object_sat: "",
    is_available: true,
    price_lists: [] as ProductPriceList[],
    tax_ids: [],
  });

  // Cargar datos iniciales, categorías y unidades de medida
  useEffect(() => {
    const loadData = async () => {
      try {
        setInitialLoading(true);
        if (!productId) throw new Error("ID de producto no proporcionado");

        const [categoriesData, product, priceListsData, taxesData, measurementsData] =
          await Promise.all([
            getActiveCategories(),
            getProductById(productId),
            getPriceLists(),
            getActiveTaxes(),
            getMeasurementOptions(),
          ]);

        setCategories(categoriesData);
        setPriceLists(priceListsData);
        setTaxes(taxesData);
        setMeasurements(measurementsData);

        if (!product) throw new Error("Producto no encontrado");

        setFormData({
          code: product.code || "",
          bar_code: product.bar_code || "",
          name: product.name || "",
          name_unaccent: product.name_unaccent || "",
          description: product.description || "",
          image_url: product.image_url || "",
          image: null,
          id_price_list: product.id_price_list || "",
          category_id: product.category_id || "",
          cost_price: product.cost_price ? String(product.cost_price) : "0",
          type: product.type || "article",
          measure_unit: product.measure_unit || "none",
          is_available: product.is_available ?? true,
          // product_code_sat: product.product_code_sat ?? "",
          // product_tax_object_sat: product.product_tax_object_sat ?? "",
          price_lists: product.price_lists
            ? product.price_lists.map((pl) => ({
                id: pl.price_list_id,
                price: String(pl.price),
              }))
            : [],
          tax_ids: product.product_taxes?.map((pt) => pt.tax_id) || [],
        });
      } catch (error: any) {
        toast.error(error.message || "Error al cargar datos del producto");
        if (error.message.includes("no encontrado")) {
          setTimeout(() => router.push("/dashboard/productos/producto"), 2000);
        }
      } finally {
        setInitialLoading(false);
      }
    };

    loadData();
  }, [productId]);

  // Manejar cambios de inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Normalizar bar_code: string vacío a ""
    let finalValue = value;
    if (name === "bar_code") {
      finalValue = value.trim();
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    let finalValue = value;

    // Manejo especial para measure_unit
    if (name === "measure_unit") {
      finalValue = value === "none" ? "" : value;
    }

    setFormData((prev) => ({ ...prev, [name]: finalValue }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTypeChange = (type: "article" | "service") => {
    setFormData((prev) => ({
      ...prev,
      type,
      ...(type === "service" ? { measure_unit: "" } : {}),
    }));
  };

  const handleToggleAvailable = () => {
    setFormData((prev) => ({ ...prev, is_available: !prev.is_available }));
  };

  const handleImageChange = (fileOrUrl: string | File) => {
    if (fileOrUrl instanceof File) {
      setFormData((prev) => ({ ...prev, image: fileOrUrl }));
    } else {
      setFormData((prev) => ({ ...prev, image_url: fileOrUrl, image: null }));
    }
    if (errors.image_url) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.image_url;
        return newErrors;
      });
    }
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

  // Handlers para impuestos
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    const newErrors: { [key: string]: string } = {};
    if (!formData.code.trim()) newErrors.code = "El código es requerido";
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (!formData.description.trim())
      newErrors.description = "La descripción es requerida";
    if (!formData.category_id)
      newErrors.category_id = "La categoría es requerida";
    if (!formData.cost_price || Number.parseFloat(formData.cost_price) < 0)
      newErrors.cost_price =
        "El precio de costo debe ser un número válido mayor o igual a 0";
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
      let image_url: string;

      if (formData.image instanceof File) {
        // Subir nueva imagen
        const uploadResult = await uploadFile(
          "products",
          productId,
          formData.image
        );
        if (uploadResult.success && uploadResult.url) {
          image_url = uploadResult.url;
        } else {
          toast.error("Error al subir la imagen. Se mantendrá la anterior.");
          image_url = formData.image_url || "";
        }
      } else if (!formData.image_url) {
        // Imagen borrada
        image_url = "";
      } else {
        // Mantener la existente
        image_url = formData.image_url;
      }

      const updateData = {
        code: formData.code.trim(),
        bar_code: formData.bar_code.trim(),
        name: formData.name.trim(),
        name_unaccent: formData.name_unaccent.trim(),
        description: formData.description.trim(),
        image_url: image_url.trim(),
        id_price_list: formData.id_price_list || null,
        category_id: formData.category_id,
        cost_price: Number.parseFloat(formData.cost_price),
        type: formData.type,
        measure_unit: formData.measure_unit || null,
        // product_code_sat: formData.product_code_sat,
        // product_tax_object_sat: formData.product_tax_object_sat,
        is_available: formData.is_available,
      };

      const result = await updateProduct(productId, updateData);

      if (!result.success) {
        toast.error(result.message || "Error al actualizar el producto");
        return;
      }

      const resultPriceLists = await updateProductPriceList({
        productId,
        price_lists: formData.price_lists,
      });

      if (!resultPriceLists || !resultPriceLists.success) {
        toast.error(
          "Producto actualizado pero hubo error en listas de precios"
        );
        setTimeout(() => router.push("/dashboard/productos/producto"), 1000);
        return;
      }

      // Actualizar impuestos
      const resultTaxes = await updateProductTaxes({
        productId,
        tax_ids: formData.tax_ids,
      });

      if (!resultTaxes.success) {
        toast.error("Producto actualizado pero hubo error en los impuestos");
        setTimeout(() => router.push("/dashboard/productos/producto"), 1000);
        return;
      }

      toast.success("¡Producto actualizado con éxito!");
      setTimeout(() => router.push("/dashboard/productos/producto"), 1000);
    } catch (err: any) {
      toast.error(err.message || "Error inesperado al actualizar el producto");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div>
        <div className="mb-6">
          <div className="inline-flex items-center p-2">
            <div className="w-5 h-5 bg-gray-200 rounded mr-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
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
          className="inline-flex items-center text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Editar Producto</h1>
        </div>

        <ProductFormFields
          handleSubmit={handleSubmit}
          formData={formData}
          onImageChange={handleImageChange}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          handleTypeChange={handleTypeChange}
          handleToggleAvailable={handleToggleAvailable}
          errors={errors}
          categories={categories}
          priceLists={priceLists}
          measurements={measurements}
          buttonText="Actualizar Producto"
          buttonLoadingText="Actualizando..."
          loading={loading}
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
