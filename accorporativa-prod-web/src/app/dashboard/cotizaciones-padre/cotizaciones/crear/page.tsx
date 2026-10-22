"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import QuotationForm from "@/components/dashboard/quotation/quotation-form";
import QuotationDetails from "@/components/dashboard/quotation/quotation-details";
import QuotationSuccessDialog from "@/components/dashboard/quotation/quotation-success-dialog";
import { fetchUserProfile } from "@/lib/actions/user.actions";
import { getCompanies, type Company } from "@/lib/actions/company.actions";
import { createQuotation } from "@/lib/actions/quotations.actions";
import { saveContactAddress } from "@/lib/actions/address.actions";
import type { ProductSearch } from "@/lib/actions/product.actions";
import { getProductTaxes } from "@/lib/utils/quotationTaxes";

// Interfaces locales para esta página
interface ProductItem {
  id: string;
  product: ProductSearch;
  quantity: number;
  unitPrice: number;
  discount: number;
  notes: string;
  isDiscount?: boolean;
  discountTitle?: string;
  discountType?: "amount" | "percentage" | "PERCENTAGE" | "FIXED";
  // Campos de descuento específico por producto
  discountValue?: number;
  discountAmount?: number;
  // Campos de impuesto específico por producto
  hasTax?: boolean;
  taxTitle?: string;
  taxType?: "amount" | "percentage" | "PERCENTAGE" | "FIXED";
  taxValue?: number;
  taxAmount?: number;
  tax_id?: string;      // DEPRECADO: mantener por retrocompatibilidad
  tax_ids?: string[];   // NUEVO: soporta múltiples impuestos
  taxesData?: Array<{ 
    id: string; 
    name: string; 
    rate: number; 
    tax_type: "percentage" | "fixed_amount"; 
    description?: string;
    amount: number; // Monto calculado del impuesto
  }>; // Información completa de los impuestos
}

interface FormErrors {
  [key: string]: string;
}

export default function CreateQuotationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    full_name?: string;
    email?: string;
    user_code?: string;
    id?: string;
  } | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdQuotationData, setCreatedQuotationData] = useState<any>(null);
  
  // Estado para la dirección temporal seleccionada que se guardará al crear la cotización
  const [selectedPendingAddress, setSelectedPendingAddress] = useState<{
    id: string
    street: string
    exterior_number: string
    interior_number?: string
    neighborhood: string
    postal_code: string
    isTemporary?: boolean
  } | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    contactId: "",
    notes: "",
    validityDays: 30,
    currency: "MXN",
    discount: 0,
    shipping: 0,
    products: [] as ProductItem[],
    selectedPriceList: "",
    inventory_location_id: "",
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: "",
    vendor: "",
    deliveryAddress: "",
    company: "",
  });

  useEffect(() => {
    if (!formData.validUntil) {
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      setFormData((prev) => ({
        ...prev,
        validUntil: thirtyDaysLater.toISOString().split("T")[0],
      }));
    }
  }, []);

  // Detectar scroll para ocultar subtítulo en móvil
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cargar información del usuario actual
  useEffect(() => {
    const loadCurrentUser = async () => {
      setIsLoadingUser(true);
      try {
        const result = await fetchUserProfile();

        if (result.profile) {
          setCurrentUser({
            id: result.profile.id,
            full_name: result.profile.full_name,
            email: result.profile.email,
            user_code: result.profile.user_code,
          });

          // Establecer el vendedor automáticamente como el usuario actual
          setFormData((prev) => ({
            ...prev,
            vendor: result.profile.full_name || "",
          }));
        } else if (result.user) {
          // Si no hay perfil pero sí usuario autenticado
          setCurrentUser({
            id: result.user.id,
            full_name:
              result.user.user_metadata?.full_name ||
              result.user.email?.split("@")[0] ||
              "",
            email: result.user.email || "",
          });

          setFormData((prev) => ({
            ...prev,
            vendor:
              result.user.user_metadata?.full_name ||
              result.user.email?.split("@")[0] ||
              "",
          }));
        }
      } catch (error) {
        console.error("Error cargando usuario actual:", error);
        toast.error("Error al cargar información del usuario");
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadCurrentUser();
  }, []);

  // Cargar compañías
  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const result = await getCompanies(1, 100);
        setCompanies(result.companies);

        // Establecer primera compañía como predeterminada si existe
        if (result.companies.length > 0 && !formData.company) {
          setFormData((prev) => ({
            ...prev,
            company: result.companies[0].id,
          }));
        }
      } catch (error) {
        console.error("Error cargando compañías:", error);
        toast.error("Error al cargar compañías");
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  // Calcular totales
  const calculateDiscountsTotal = formData.products
    .filter((product) => product.isDiscount)
    .reduce((total, product) => total + Math.abs(product.unitPrice), 0);

  const calculateProductTotal = (product: ProductItem) => {
    const subtotal = product.quantity * product.unitPrice;
    let total = subtotal;

    // Si tiene descuento específico aplicado, restarlo
    if (product.discountAmount && product.discountAmount > 0) {
      total -= product.discountAmount;
    }

    // Calcular impuestos usando el helper
    const { totalTaxAmount } = getProductTaxes({
      quantity: product.quantity,
      unitPrice: product.unitPrice,
      discountAmount: product.discountAmount,
      product_taxes: (product as any).product_taxes,
      tax: (product as any).tax,
      tax_id: product.tax_id,
    });
    total += totalTaxAmount;

    return total;
  };

  // Subtotal bruto de productos (sin descuentos ni impuestos)
  const calculateProductsGrossSubtotal = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, p) => {
      const prod: any = p as any;
      if (prod.isDiscount) return sum;
      if (typeof prod.id === "string" && prod.id.startsWith("tax-")) return sum;
      const qty = Number(prod.quantity ?? 0);
      const unit = Number(prod.unitPrice ?? prod.unit_price ?? 0);
      const discountAmt = Number(prod.discountAmount ?? prod.discount_amount ?? 0) || 0;
      const line = Math.max(0, qty * unit - discountAmt);
      return sum + line;
    }, 0);
  };

  // Impuestos específicos aplicados a productos reales
  const calculateProductLevelTaxes = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, p) => {
      const prod: any = p as any;
      if (prod.isDiscount) return sum;
      if (typeof prod.id === "string" && prod.id.startsWith("tax-")) return sum;
      
      const { totalTaxAmount } = getProductTaxes({
        quantity: prod.quantity,
        unitPrice: prod.unitPrice ?? prod.unit_price,
        discountAmount: prod.discountAmount ?? prod.discount_amount,
        product_taxes: prod.product_taxes,
        tax: prod.tax,
        tax_id: prod.tax_id,
      });
      return sum + totalTaxAmount;
    }, 0);
  };

  // Impuesto(s) generales añadidos como producto(s) 'tax-'
  const calculateGeneralTaxes = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, p) => {
      const prod: any = p as any;
      if (typeof prod.id === "string" && prod.id.startsWith("tax-")) {
        const tax = Number(prod.taxAmount ?? prod.tax_amount ?? prod.unitPrice ?? 0) || 0;
        return sum + tax;
      }
      return sum;
    }, 0);
  };

  const calculateGeneralDiscounts = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, p) => {
      const prod: any = p as any;
      if (!prod.isDiscount) return sum;
      const amt = Math.abs(Number(prod.unitPrice ?? prod.unit_price ?? prod.discountAmount ?? prod.discount_amount ?? 0) || 0);
      return sum + amt;
    }, 0);
  };

  const calculateProductsSubtotal = calculateProductsGrossSubtotal();
  const total = calculateProductsGrossSubtotal() + calculateProductLevelTaxes() + calculateGeneralTaxes() - calculateGeneralDiscounts();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Si se limpia el nombre del cliente, también limpia el contactId
    if (field === "clientName" && !value) {
      setFormData((prev) => ({ ...prev, contactId: "" }));
    }
  };

  const handleClearClient = () => {
    setFormData((prev) => ({
      ...prev,
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      contactId: "",
      deliveryAddress: "",
    }));
    toast.info("Cliente limpiado");
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

  const handleProductSelect = (
    productId: string,
    product: ProductSearch,
    discountItem?: Partial<ProductItem>,
  ) => {
    const exists = formData.products.find((p) => p.id === productId);
    if (exists) {
      toast.info("Este producto ya está en la cotización");
      return;
    }

    let newProduct: ProductItem;

    if (discountItem?.isDiscount) {
      // Si es un descuento, usa los datos proporcionados
      newProduct = {
        id: productId,
        product,
        quantity: discountItem.quantity || 1,
        unitPrice: discountItem.unitPrice || 0,
        discount: discountItem.discount || 0,
        notes: discountItem.notes || "",
        isDiscount: true,
        discountTitle: discountItem.discountTitle,
        discountType: discountItem.discountType,
      };
    } else {
      // Producto normal (puede tener impuestos específicos como campos adicionales)
      const defaultPrice = product.products_price_lists?.[0]?.price || 0;
      newProduct = {
        id: productId,
        product,
        quantity: 1,
        unitPrice: defaultPrice,
        discount: 0,
        notes: "",
        // Si viene con datos de impuesto específico, incluirlos
        taxType: discountItem?.taxType,
        taxValue: discountItem?.taxValue,
        taxAmount: discountItem?.taxAmount,
        // Si viene con datos de descuento específico, incluirlos
        discountType: discountItem?.discountType,
        discountValue: discountItem?.discountValue,
        discountAmount: discountItem?.discountAmount,
      };
    }

    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, newProduct],
    }));

    toast.success(`"${product.name}" agregado a la cotización`);
  };

  const handleProductRemove = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
    toast.info("Producto removido de la cotización");
  };

  const handleProductUpdate = (
    productId: string,
    updates: Partial<ProductItem>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId ? { ...p, ...updates } : p,
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
    const newErrors: FormErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = "El nombre del cliente es requerido";
    }

    if (formData.products.filter((p) => !p.isDiscount).length === 0) {
      newErrors.products = "Debes agregar al menos un producto a la cotización";
    }

    if (!formData.validUntil) {
      newErrors.validUntil = "La fecha de vencimiento es requerida";
    }

    if (!formData.deliveryAddress) {
      newErrors.deliveryAddress = "Debe haber una dirección de entrega";
    }

    if (!formData.company) {
      newErrors.company = "Selecciona una compañía";
    }

    if (!formData.selectedPriceList) {
      newErrors.selectedPriceList = "Selecciona una lista de precios";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // GUARDAR DIRECCIÓN TEMPORAL EN LA BASE DE DATOS (solo si está seleccionada y es temporal)
      if (selectedPendingAddress?.isTemporary && formData.contactId) {
        toast.info("Guardando dirección...");
        await saveContactAddress(formData.contactId, {
          postal_code: selectedPendingAddress.postal_code,
          neighborhood: selectedPendingAddress.neighborhood,
          street: selectedPendingAddress.street,
          exterior_number: selectedPendingAddress.exterior_number,
          interior_number: selectedPendingAddress.interior_number || null,
          phone_number: formData.clientPhone || "",
          full_name: formData.clientName,
          email: formData.clientEmail || null,
        });
      }

      // MANEJO DE DESCUENTOS
      const discountProduct = formData.products.find((p) => p.isDiscount);
      let discountType: "PERCENTAGE" | "FIXED" | undefined = undefined;
      let discountValue: number | undefined = undefined;
      let discountAmount: number | undefined = undefined;
      let discountTitle: string | undefined = undefined;

      if (discountProduct) {
        discountTitle = discountProduct.discountTitle;
        if (discountProduct.discountType === "percentage") {
          discountType = "PERCENTAGE";

          // Calcular el porcentaje basado en el monto del descuento y el subtotal
          const discountAmountValue = Math.abs(discountProduct.unitPrice);
          discountValue =
            (discountAmountValue / calculateProductsSubtotal) * 100;
          discountAmount = discountAmountValue;
        } else {
          // Monto fijo (por defecto o amount)
          discountType = "FIXED";
          discountValue = Math.abs(discountProduct.unitPrice);
          discountAmount = Math.abs(discountProduct.unitPrice);
        }
      }

      // Preparar datos para enviar
      const quotationData = {
        // Información del cliente
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim() || undefined,
        clientPhone: formData.clientPhone.trim() || undefined,
        contactId: formData.contactId || undefined,

        // Información de la cotización
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        notes: formData.notes.trim() || undefined,

        // Empresa y lista de precios
        companyId: formData.company,
        priceListId: formData.selectedPriceList,
        inventory_location_id: formData.inventory_location_id || undefined,

        // Dirección de entrega
        deliveryAddress: formData.deliveryAddress.trim() || undefined,

        // Productos (excluir descuentos e impuestos generales si existen)
        products: formData.products
          .filter((p) => {
            // Excluir items de descuento y los impuestos generales añadidos como "producto" (id comienza con 'tax-')
            if (p.isDiscount) return false;
            if (typeof p.id === "string" && p.id.startsWith("tax-")) return false;
            return true;
          })
          .map((p) => {
            // Convertir discountType al formato correcto
            let convertedDiscountType: "PERCENTAGE" | "FIXED" | undefined;
            if (
              p.discountType === "percentage" ||
              p.discountType === "PERCENTAGE"
            ) {
              convertedDiscountType = "PERCENTAGE";
            } else if (
              p.discountType === "amount" ||
              p.discountType === "FIXED"
            ) {
              convertedDiscountType = "FIXED";
            }

            // Convertir taxType al formato correcto
            let convertedTaxType: "PERCENTAGE" | "FIXED" | undefined;
            if (p.taxType === "percentage" || p.taxType === "PERCENTAGE") {
              convertedTaxType = "PERCENTAGE";
            } else if (p.taxType === "amount" || p.taxType === "FIXED") {
              convertedTaxType = "FIXED";
            }

            const productData = {
              productId: p.id,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              notes: p.notes.trim() || undefined,
              discountType: convertedDiscountType,
              discountValue: p.discountValue,
              discountAmount: p.discountAmount,
              discountTitle: p.discountTitle,
              taxType: convertedTaxType,
              taxValue: p.taxValue,
              taxAmount: p.taxAmount,
              taxTitle: p.taxTitle,
              // Usar tax_ids si existe, sino tax_id
              tax_id: p.tax_ids && p.tax_ids.length > 1 ? undefined : p.tax_id,
              tax_ids: p.tax_ids && p.tax_ids.length > 0 ? p.tax_ids : (p.tax_id ? [p.tax_id] : undefined),
            };
            return productData;
          }),

        // Descuentos
        discountType: discountType,
        discountValue: discountValue,
        discountAmount: discountAmount,
        discountTitle: discountTitle,

        // Totales
        subtotal: calculateProductsSubtotal,
        total: total,

        // Vendedor
        vendor: formData.vendor,
      };

      // Verificar que tenemos el ID del usuario
      if (!currentUser?.id) {
        throw new Error("No se pudo obtener el ID del usuario actual");
      }

      // Crear la cotización
      const result = await createQuotation(quotationData, currentUser.id);

      if (!result.success) {
        throw new Error(result.error || "Error al crear la cotización");
      }

      toast.success("¡Cotización creada exitosamente!");

      // Obtener el nombre de la compañía
      const selectedCompany = companies.find((c) => c.id === formData.company);

      // Construir dirección completa de la empresa
      let companyAddress = "";
      if (selectedCompany) {
        const addressParts = [
          selectedCompany.street,
          selectedCompany.address_number,
          selectedCompany.colony,
          selectedCompany.city,
          selectedCompany.state,
          selectedCompany.zip_code,
        ].filter(Boolean);
        companyAddress = addressParts.join(", ");
      }

      // Preparar datos para el diálogo de éxito y el PDF
      const quotationForDialog = {
        quotationNumber: result.quotationNumber?.toString() || "0001",
        quotationId: result.quotationId,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || undefined,
        clientPhone: formData.clientPhone || undefined,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        vendor: formData.vendor,
        deliveryAddress: formData.deliveryAddress || undefined,
        notes: formData.notes || undefined,
        products: formData.products.map((p) => {
          // Mapear taxesData a product_taxes para que getProductTaxes funcione
          const product_taxes = p.taxesData ? p.taxesData.map(t => ({
            id: t.id,
            name: t.name,
            rate: t.rate,
            tax_type: t.tax_type,
            description: t.description,
          })) : undefined;

          // Si solo hay 1 impuesto, también crear objeto tax individual (retrocompatibilidad)
          const tax = product_taxes && product_taxes.length === 1 ? product_taxes[0] : undefined;

          return {
            id: p.id,
            product: {
              name: p.product.name,
              description: p.product.description,
            },
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            discount: p.discount,
            notes: p.notes,
            isDiscount: p.isDiscount,
            discountTitle: p.discountTitle,
            discountType: p.discountType,
            discountValue: p.discountValue,
            discountAmount: p.discountAmount,
            taxTitle: p.taxTitle,
            taxType: p.taxType,
            taxValue: p.taxValue,
            taxAmount: p.taxAmount,
            // Pasar objetos tax completos desde taxesData
            tax: tax,
            tax_id: p.tax_id,
            product_taxes: product_taxes,
          };
        }),
        subtotal: calculateProductsSubtotal,
        discountAmount: discountAmount,
        total: total,
        companyName: selectedCompany?.name || "ALVEUSSOFT",
        companyAddress: companyAddress || undefined,
        companyPhone:
          selectedCompany?.phone || selectedCompany?.cellphone || undefined,
        companyWebsite: selectedCompany?.website || undefined,
      };

      setCreatedQuotationData(quotationForDialog);
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error creando cotización:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al crear la cotización",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Diálogo de éxito */}
      {createdQuotationData && (
        <QuotationSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          quotationData={createdQuotationData}
        />
      )}

      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header fijo con título y botones alineados */}
        <div
          className="sticky top-18 z-10 pb-6 mb-2 pt-4 bg-[#05060b] opacity-100  border-gray-800"
          style={{ backgroundColor: '#05060b' }}
        >
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            {/* Columna izquierda: Títulos */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Crear Nueva Cotización
              </h1>
              <p className={`text-gray-400 transition-all duration-300 ${
                isScrolled ? 'md:block hidden' : 'block'
              }`}>
                Completa los detalles de la cotización y agrega productos
              </p>
            </div>
            
            {/* Columna derecha: Botones */}
            <div className="flex flex-row gap-3 lg:flex-shrink-0">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-3 py-2 md:px-4 md:py-3 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  loading ||
                  formData.products.filter((p) => !p.isDiscount).length === 0
                }
                className="px-3 py-2 md:px-4 md:py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creando...
                  </div>
                ) : (
                  "Crear Cotización"
                )}
              </button>
            </div>
          </div>
        </div>       

        <div className="grid grid-cols-1 gap-8">
          {/* Panel de detalles */}
          <div className="space-y-6">
            {/* Detalles de la cotización */}
            <div className="bg-[#0A0F17] rounded-lg border border-gray-800 overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Detalles de la Cotización
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Información general del cliente y entrega
                </p>
              </div>

              <div className="p-4 md:p-6">
                <QuotationDetails
                  formData={{
                    clientName: formData.clientName,
                    clientEmail: formData.clientEmail,
                    clientPhone: formData.clientPhone,
                    validFrom: formData.validFrom,
                    validUntil: formData.validUntil,
                    vendor: formData.vendor,
                    deliveryAddress: formData.deliveryAddress,
                    notes: formData.notes,
                    company: formData.company,
                    contactId: formData.contactId, 
                  }}
                  onFieldChange={handleFieldChange}
                  onClearClient={handleClearClient}
                  onPendingAddressesChange={setSelectedPendingAddress}
                  currentUser={currentUser}
                  companies={companies}
                  isLoadingUser={isLoadingUser}
                  isLoadingCompanies={isLoadingCompanies}
                  errors={errors}
                />
              </div>
            </div>
          </div>

          {/* Formulario principal */}
          <div>
            <QuotationForm
              handleSubmit={handleSubmit}
              formData={{
                ...formData,
                taxRate: 0, // No se usa pero se mantiene por compatibilidad
                selectedPriceList: formData.selectedPriceList || "",
                inventory_location_id: formData.inventory_location_id || "",
              }}
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
              showMobileButtons={false}
              // Pasar las funciones de cálculo para que QuotationForm las use
              calculateProductsSubtotal={calculateProductsSubtotal}
              calculateDiscountsTotal={calculateDiscountsTotal}
              total={total}
            />
          </div>
                      {/* Panel de acciones */}
            {/* <div className="bg-[#0A0F17] rounded-lg border border-gray-800 overflow-hidden lg:col-span-3">
              <div className="flex flex-col px-4 md:px-6 py-4 border-b border-gray-800">
                <h3 className="text-sm md:text-base font-semibold text-white">
                  Acciones
                </h3>
                
              </div>
              <div className="p-4 md:p-6 space-y-3">
                

                {formData.products.filter((p) => !p.isDiscount).length ===
                  0 && (
                  <p className="text-xs text-yellow-400 text-center mt-2">
                    ⚠ Agrega productos para crear la cotización
                  </p>
                )}

                <div className="pt-3 border-t border-gray-800">
                  <div className="text-xs text-gray-400 text-center">
                    {formData.products.filter((p) => !p.isDiscount).length >
                    0 ? (
                      <span className="text-green-400 font-medium">
                        ✓{" "}
                        {formData.products.filter((p) => !p.isDiscount).length}{" "}
                        producto
                        {formData.products.filter((p) => !p.isDiscount)
                          .length !== 1
                          ? "s"
                          : ""}{" "}
                        listo
                        {formData.products.filter((p) => !p.isDiscount)
                          .length !== 1
                          ? "s"
                          : ""}
                      </span>
                    ) : (
                      <span className="text-yellow-400 font-medium">
                        ⚠ Agrega al menos un producto
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div> */}
        </div>
      </div>
    </div>
  );
}
