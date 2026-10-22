"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import QuotationForm from "@/components/dashboard/quotation/quotation-form";
import type { ProductSearch } from "@/lib/actions/product.actions";

interface ProductItem {
  id: string;
  product: ProductSearch;
  quantity: number;
  unitPrice: number;
  discount: number;
  notes: string;
}

export default function CreateQuotationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    quotationNumber: `COT-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    notes: "",
    validityDays: 30,
    currency: "MXN",
    taxRate: 16,
    discount: 0,
    shipping: 0,
    products: [] as ProductItem[],
  });

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

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleProductSelect = (productId: string, product: ProductSearch) => {
    const exists = formData.products.find(p => p.id === productId);
    if (exists) {
      toast.info("Este producto ya está en la cotización");
      return;
    }

    const defaultPrice = product.products_price_lists?.[0]?.price || 0;
    const newProduct: ProductItem = {
      id: productId,
      product,
      quantity: 1,
      unitPrice: defaultPrice,
      discount: 0,
      notes: "",
    };

    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));

    toast.success(`"${product.name}" agregado a la cotización`);
  };

  const handleProductRemove = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter(p => p.id !== productId),
    }));
    toast.info("Producto removido de la cotización");
  };

  const handleProductUpdate = (productId: string, updates: Partial<ProductItem>) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === productId ? { ...p, ...updates } : p
      ),
    }));
  };

  const handleClearProducts = () => {
    setFormData((prev) => ({ ...prev, products: [] }));
    toast.info("Todos los productos han sido removidos");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    const newErrors: { [key: string]: string } = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = "El nombre del cliente es requerido";
    }

    if (formData.products.length === 0) {
      newErrors.products = "Debes agregar al menos un producto a la cotización";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Simular guardado (reemplazar con lógica real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log("Datos a guardar:", formData);
      
      toast.success("¡Cotización creada exitosamente!");
      router.push("/dashboard/cotizaciones");
    } catch (error) {
      console.error("Error creando cotización:", error);
      toast.error("Error al crear la cotización");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Crear Nueva Cotización
        </h1>
        <p className="text-gray-400 mb-8">
          Completa los detalles de la cotización y agrega productos
        </p>

        <QuotationForm
          handleSubmit={handleSubmit}
          formData={formData}
          handleChange={handleChange}
          handleSelectChange={handleSelectChange}
          handleNumberChange={handleNumberChange}
          errors={errors}
          buttonText="Crear Cotización"
          buttonLoadingText="Creando..."
          loading={loading}
          onProductSelect={handleProductSelect}
          onProductRemove={handleProductRemove}
          onProductUpdate={handleProductUpdate}
          onClearProducts={handleClearProducts}
        />
      </div>
    </div>
  );
}