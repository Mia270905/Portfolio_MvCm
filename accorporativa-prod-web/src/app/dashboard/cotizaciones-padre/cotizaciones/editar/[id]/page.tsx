"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import QuotationForm from "@/components/dashboard/quotation/quotation-form";
import QuotationDetails from "@/components/dashboard/quotation/quotation-details";
import QuotationSuccessDialog from "@/components/dashboard/quotation/quotation-success-dialog";
import { fetchUserProfile } from "@/lib/actions/user.actions";
import { getCompanies, type Company } from "@/lib/actions/company.actions";
import { updateQuotation, getQuotationById } from "@/lib/actions/quotations.actions";
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
  // Campos de impuesto
  hasTax?: boolean;
  taxTitle?: string;
  taxType?: "amount" | "percentage" | "PERCENTAGE" | "FIXED";
  taxValue?: number;
  taxAmount?: number;
  tax_id?: string;
  // Nuevos campos para múltiples impuestos
  tax_ids?: string[];
  taxesData?: Array<{
    id: string;
    name: string;
    tax_type: "percentage" | "fixed_amount";
    rate: number;
    description?: string;
    amount: number;
  }>;
}

interface FormErrors {
  [key: string]: string;
}

export default function EditQuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingQuotation, setLoadingQuotation] = useState(true);
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
  const [updatedQuotationData, setUpdatedQuotationData] = useState<any>(null);
  
  // Estado para la dirección temporal seleccionada que se guardará al editar la cotización
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
    quotationNumber: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    contactId: "",
    notes: "",
    validityDays: 30,
    currency: "MXN",
    taxRate: 16,
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

  // Detectar scroll para ocultar subtítulo en móvil
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cargar datos de la cotización existente
  useEffect(() => {
    const loadQuotation = async () => {
      if (!quotationId) {
        toast.error("ID de cotización no válido");
        router.push("/dashboard/cotizaciones-padre/cotizaciones");
        return;
      }

      setLoadingQuotation(true);
      try {
        const quotation = await getQuotationById(quotationId);

        if (!quotation) {
          toast.error("Cotización no encontrada");
          router.push("/dashboard/cotizaciones-padre/cotizaciones");
          return;
        }

        // Validar que la cotización esté en estado "pending"
        if (quotation.status !== "pending") {
          toast.error("Solo se pueden editar cotizaciones pendientes");
          router.push("/dashboard/cotizaciones-padre/cotizaciones");
          return;
        }

        // Pre-llenar el formulario con los datos de la cotización
        const contactData = quotation.contact as any;
        const products: ProductItem[] = [];

        // Cargar productos desde quotation.items
        if (quotation.items && Array.isArray(quotation.items)) {
          for (const item of quotation.items) {
            const productData = item.product as any;
            
            // Convertir discountType al formato local
            let localDiscountType: "amount" | "percentage" | "PERCENTAGE" | "FIXED" | undefined;
            if (item.discount_type === "PERCENTAGE") {
              localDiscountType = "PERCENTAGE";
            } else if (item.discount_type === "FIXED") {
              localDiscountType = "FIXED";
            }
            
            // Cargar múltiples impuestos desde product_taxes
            const taxableBase = item.quantity * item.unit_price - (item.discount_amount || 0);
            let totalTaxAmount = 0;
            const tax_ids: string[] = [];
            const taxesData: Array<{
              id: string;
              name: string;
              tax_type: "percentage" | "fixed_amount";
              rate: number;
              amount: number;
            }> = [];
            
            // Si tiene product_taxes (nuevo sistema de múltiples impuestos)
            if (item.product_taxes && Array.isArray(item.product_taxes) && item.product_taxes.length > 0) {
              item.product_taxes.forEach((tax: any) => {
                tax_ids.push(tax.id);
                
                let taxAmount = 0;
                if (tax.tax_type === "percentage") {
                  taxAmount = (taxableBase * tax.rate) / 100;
                } else if (tax.tax_type === "fixed_amount") {
                  taxAmount = tax.rate;
                }
                
                totalTaxAmount += taxAmount;
                
                taxesData.push({
                  id: tax.id,
                  name: tax.name,
                  tax_type: tax.tax_type as "percentage" | "fixed_amount",
                  rate: tax.rate,
                  amount: taxAmount
                });
              });
            } 
            // Fallback: si no tiene product_taxes pero tiene tax_id (sistema antiguo)
            else if (item.tax_id && item.tax) {
              tax_ids.push(item.tax_id);
              
              let taxAmount = 0;
              if (item.tax.tax_type === "percentage") {
                taxAmount = (taxableBase * item.tax.rate) / 100;
              } else if (item.tax.tax_type === "fixed_amount") {
                taxAmount = item.tax.rate;
              }
              
              totalTaxAmount = taxAmount;
              
              taxesData.push({
                id: item.tax.id,
                name: item.tax.name,
                tax_type: item.tax.tax_type,
                rate: item.tax.rate,
                amount: taxAmount
              });
            }
            
            products.push({
              id: item.product_id,
              product: {
                id: item.product_id,
                name: productData?.name || "",
                description: productData?.description || null,
                measure_unit: productData?.measure_unit || null,
                image_url: null,
                category_id: null,
                is_available: true,
                products_price_lists: [],
                product_inventory: [],
                product_categories: null,
              },
              quantity: item.quantity,
              unitPrice: item.unit_price,
              discount: 0,
              notes: item.notes || "",
              discountType: localDiscountType,
              discountValue: item.discount_value || undefined,
              discountAmount: item.discount_amount || undefined,
              taxAmount: totalTaxAmount,
              tax_id: tax_ids.length === 1 ? tax_ids[0] : undefined, // Retrocompatibilidad
              tax_ids: tax_ids,
              taxesData: taxesData,
            });
          }
        }

        // Si hay descuento, agregarlo como producto especial
        if (quotation.discount_amount && quotation.discount_amount > 0) {
          const discountProduct: ProductItem = {
            id: `discount-${Date.now()}`,
            product: {
              id: "discount",
              name: "Descuento",
              description: null,
              measure_unit: null,
              image_url: null,
              category_id: null,
              is_available: true,
              products_price_lists: [],
              product_inventory: [],
              product_categories: null,
            },
            quantity: 1,
            unitPrice: -Math.abs(quotation.discount_amount),
            discount: 0,
            notes: "",
            isDiscount: true,
            discountTitle: "Descuento aplicado",
            discountType: quotation.discount_type === "PERCENTAGE" ? "percentage" : "amount",
          };
          products.push(discountProduct);
        }

        setFormData({
          date: quotation.valid_from.split("T")[0],
          quotationNumber: quotation.quotation_number || "",
          clientName: contactData?.full_name || contactData?.name || "",
          clientEmail: contactData?.email || "",
          clientPhone: contactData?.phone || "",
          contactId: quotation.contact_id || "",
          notes: quotation.customer_note || "",
          validityDays: 30,
          currency: "MXN",
          taxRate: 16,
          discount: 0,
          shipping: 0,
          products: products,
          selectedPriceList: quotation.price_list_id || "",
          inventory_location_id: quotation.inventory_location_id || "",
          validFrom: quotation.valid_from.split("T")[0],
          validUntil: quotation.valid_until.split("T")[0],
          vendor: (quotation as any).created_by_user?.full_name || "",
          deliveryAddress: quotation.address || "",
          company: quotation.company_id || "",
        });

        toast.success("Cotización cargada correctamente");
      } catch (error) {
        console.error("Error cargando cotización:", error);
        toast.error("Error al cargar la cotización");
        router.push("/dashboard/cotizaciones-padre/cotizaciones");
      } finally {
        setLoadingQuotation(false);
      }
    };

    loadQuotation();
  }, [quotationId, router]);

  // Calcular totales
  const calculateDiscountsTotal = formData.products
    .filter((product) => product.isDiscount)
    .reduce((total, product) => total + Math.abs(product.unitPrice), 0);

  const calculateTaxesTotal = formData.products
    .filter((product) => product.hasTax)
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
    return formData.products.reduce((sum, prod) => {
      const p: any = prod as any;
      if (p.isDiscount) return sum;
      if (typeof p.id === "string" && p.id.startsWith("tax-")) return sum;
      const qty = Number(p.quantity ?? 0);
      const unit = Number(p.unitPrice ?? p.unit_price ?? 0);
      const discountAmt = Number(p.discountAmount ?? p.discount_amount ?? 0) || 0;
      const line = Math.max(0, qty * unit - discountAmt);
      return sum + line;
    }, 0);
  };

  const calculateProductLevelTaxes = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, prod) => {
      const p: any = prod as any;
      if (p.isDiscount) return sum;
      if (typeof p.id === "string" && p.id.startsWith("tax-")) return sum;
      
      const { totalTaxAmount } = getProductTaxes({
        quantity: p.quantity,
        unitPrice: p.unitPrice ?? p.unit_price,
        discountAmount: p.discountAmount ?? p.discount_amount,
        product_taxes: p.product_taxes,
        tax: p.tax,
        tax_id: p.tax_id,
      });
      return sum + totalTaxAmount;
    }, 0);
  };

  const calculateGeneralTaxes = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, prod) => {
      const p: any = prod as any;
      if (typeof p.id === "string" && p.id.startsWith("tax-")) {
        const tax = Number(p.taxAmount ?? p.tax_amount ?? p.unitPrice ?? 0) || 0;
        return sum + tax;
      }
      return sum;
    }, 0);
  };

  const calculateGeneralDiscounts = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, prod) => {
      const p: any = prod as any;
      if (!p.isDiscount) return sum;
      const amt = Math.abs(Number(p.unitPrice ?? p.unit_price ?? p.discountAmount ?? p.discount_amount ?? 0) || 0);
      return sum + amt;
    }, 0);
  };

  const calculateProductsSubtotal = calculateProductsGrossSubtotal();
  const total = calculateProductsGrossSubtotal() + calculateProductLevelTaxes() + calculateGeneralTaxes() - calculateGeneralDiscounts();

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
    discountItem?: Partial<ProductItem>
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
    } else if (discountItem?.hasTax) {
      // Si es un impuesto, usa los datos proporcionados
      newProduct = {
        id: productId,
        product,
        quantity: discountItem.quantity || 1,
        unitPrice: discountItem.unitPrice || 0,
        discount: discountItem.discount || 0,
        notes: discountItem.notes || "",
        hasTax: true,
        taxTitle: discountItem.taxTitle,
        taxType: discountItem.taxType,
      };
    } else {
      // Producto normal
      const defaultPrice = product.products_price_lists?.[0]?.price || 0;
      newProduct = {
        id: productId,
        product,
        quantity: 1,
        unitPrice: defaultPrice,
        discount: 0,
        notes: "",
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
    updates: Partial<ProductItem>
  ) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
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
    const newErrors: FormErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = "El nombre del cliente es requerido";
    }

    if (
      formData.products.filter((p) => {
        if (p.isDiscount) return false;
        if (typeof p.id === "string" && p.id.startsWith("tax-")) return false;
        return true;
      }).length === 0
    ) {
      newErrors.products = "Debes agregar al menos un producto a la cotización";
    }

    if (!formData.validUntil) {
      newErrors.validUntil = "La fecha de vencimiento es requerida";
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

      // **MANEJO DE DESCUENTOS CORREGIDO**
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

        // Productos (excluir descuentos e impuestos)
        products: formData.products
          .filter((p) => {
            if (p.isDiscount) return false;
            if (typeof p.id === "string" && p.id.startsWith("tax-")) return false;
            return true;
          })
          .map((p) => {
            // Convertir discountType al formato correcto
            let convertedDiscountType: "PERCENTAGE" | "FIXED" | undefined;
            if (p.discountType === "percentage" || p.discountType === "PERCENTAGE") {
              convertedDiscountType = "PERCENTAGE";
            } else if (p.discountType === "amount" || p.discountType === "FIXED") {
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
              tax_id: p.tax_id, // Retrocompatibilidad
              tax_ids: p.tax_ids, // Múltiples impuestos
              taxesData: p.taxesData, // Datos detallados de impuestos
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

      // Actualizar la cotización
      const result = await updateQuotation(quotationId, quotationData, currentUser.id);

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar la cotización");
      }

      toast.success("¡Cotización actualizada exitosamente!");

      // Obtener la cotización actualizada para el número
      const updatedQuotation = await getQuotationById(quotationId);

      // Obtener el nombre de la compañía
      const selectedCompany = companies.find(c => c.id === formData.company);

      // Construir dirección completa de la empresa
      let companyAddress = "";
      if (selectedCompany) {
        const addressParts = [
          selectedCompany.street,
          selectedCompany.address_number,
          selectedCompany.colony,
          selectedCompany.city,
          selectedCompany.state,
          selectedCompany.zip_code
        ].filter(Boolean);
        companyAddress = addressParts.join(", ");
      }

      // Preparar datos para el diálogo de éxito
      const quotationForDialog = {
        quotationNumber: updatedQuotation?.quotation_number?.toString() || "0001",
        quotationId: quotationId,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || undefined,
        clientPhone: formData.clientPhone || undefined,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        vendor: formData.vendor,
        deliveryAddress: formData.deliveryAddress || undefined,
        notes: formData.notes || undefined,
        products: formData.products.map(p => {
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
            hasTax: p.hasTax,
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
        companyPhone: selectedCompany?.phone || selectedCompany?.cellphone || undefined,
        companyWebsite: selectedCompany?.website || undefined,
      };

      setUpdatedQuotationData(quotationForDialog);
      setShowSuccessDialog(true);

   } catch (error: any) {

  console.error("🔥 ERROR COMPLETO:", error);
  console.error("🔥 ERROR MESSAGE:", error?.message);
  console.error("🔥 ERROR STACK:", error?.stack);

  toast.error(
    error?.message || "Error al actualizar la cotización"
  );

} finally {
  setLoading(false);
}
    };

  // Mostrar skeleton mientras carga
  if (loadingQuotation) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="h-8 bg-gray-800 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-800 rounded w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-6">
            <div className="h-64 bg-gray-800 rounded-lg animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-gray-800 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Diálogo de éxito */}
      {updatedQuotationData && (
        <QuotationSuccessDialog
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
          quotationData={updatedQuotationData}
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

      {/* Sticky full-width header so background covers whole viewport */}
      <div className="sticky top-18 z-10 bg-[#05060b] opacity-100 border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-0">
                <h1 className="text-2xl md:text-3xl font-bold text-white">Editar Cotización</h1>
                <div className="inline-flex items-center gap-2 bg-yellow-400/20 px-3 py-1.5 rounded text-sm md:text-base">
                  <span className="text-yellow-400 font-medium text-sm md:text-base">Cotización No.</span>
                  <span className="text-yellow-400 font-medium text-sm md:text-base">{formData.quotationNumber}</span>
                </div>
              </div>
              <p className={`text-gray-400 mt-2 transition-all duration-300 ${
                isScrolled ? 'md:block hidden' : 'block'
              }`}>Actualiza los detalles de la cotización y productos</p>
            </div>

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
                  loading || formData.products.filter((p) => !p.isDiscount).length === 0
                }
                className="px-3 py-2 md:px-4 md:py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Actualizando...
                  </div>
                ) : (
                  "Actualizar Cotización"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1  gap-8">
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
                selectedPriceList: formData.selectedPriceList || "",
                inventory_location_id: formData.inventory_location_id || "",
              }}
              handleChange={handleChange}
              handleSelectChange={handleSelectChange}
              handleNumberChange={handleNumberChange}
              errors={errors}
              buttonText="Actualizar Cotización"
              buttonLoadingText="Actualizando..."
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
            {/* <div className="bg-[#0A0F17] rounded-lg border border-gray-800 overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-gray-800">
                <h3 className="text-sm md:text-base font-semibold text-white">
                  Acciones
                </h3>
              </div>
              <div className="p-4 md:p-6 space-y-3">
                

                {formData.products.filter((p) => !p.isDiscount).length ===
                  0 && (
                  <p className="text-xs text-yellow-400 text-center mt-2">
                    Agrega productos para actualizar la cotización
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
