"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Trash2, Search, DollarSign, ChevronDown, Warehouse, AlertTriangle, Tag, Package, MoreVertical, Percent, BanknoteArrowUp } from "lucide-react";
import {
  searchProductsByName,
  getProductPriceInPriceList,
  getProducts,
} from "@/lib/actions/product.actions";
import { getActivePriceLists } from "@/lib/actions/price_list.actions";
import { getPhysicalInventoryLocations } from "@/lib/actions/warehouse.actions";
import type { ProductSearch } from "@/lib/actions/product.actions";
import { toast } from "sonner";
import { DiscountModal } from "./discount-modal";
import { TaxModal } from "./tax-modal";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { ProductTaxesDialog } from "./product-taxes-dialog";

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

interface SimplePriceList {
  id: string;
  code: string;
  name: string;
}

interface SimpleLocation {
  id: string;
  code: string;
  name: string;
}

interface QuotationFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  formData: {
    date: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    notes: string;
    validityDays: number;
    currency: string;
    taxRate: number;
    discount: number;
    shipping: number;
    products: ProductItem[];
    selectedPriceList: string;
    inventory_location_id: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleNumberChange: (name: string, value: number) => void;
  errors: { [key: string]: string };
  buttonText: string;
  buttonLoadingText: string;
  loading: boolean;
  onProductSelect: (productId: string, product: ProductSearch, discountItem?: Partial<ProductItem>) => void;
  onProductRemove: (productId: string) => void;
  onProductUpdate: (productId: string, updates: Partial<ProductItem>) => void;
  onClearProducts: () => void;
  showMobileButtons?: boolean;
  // Nuevas props para cálculos
  calculateProductsSubtotal?: number;
  calculateDiscountsTotal?: number;
  total?: number;
}

export default function QuotationForm({
  handleSubmit,
  formData,
  handleChange,
  handleSelectChange,
  handleNumberChange,
  errors,
  buttonText,
  buttonLoadingText,
  loading,
  onProductSelect,
  onProductRemove,
  onProductUpdate,
  onClearProducts,
  showMobileButtons = true,
  calculateProductsSubtotal = 0,
  calculateDiscountsTotal = 0,
  total = 0,
}: QuotationFormProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [priceLists, setPriceLists] = useState<SimplePriceList[]>([]);
  const [isLoadingPriceLists, setIsLoadingPriceLists] = useState(false);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);
  const [showPriceListConfirm, setShowPriceListConfirm] = useState(false);
  const [pendingPriceListChange, setPendingPriceListChange] = useState<string | null>(null);
  const [locations, setLocations] = useState<SimpleLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showTaxModal, setshowTaxModal] = useState(false);
  const [productDiscountModal, setProductDiscountModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string | null;
    productSubtotal: number | null;
    existingDiscountType?: "PERCENTAGE" | "FIXED";
    existingDiscountValue?: number;
  }>({
    isOpen: false,
    productId: null,
    productName: null,
    productSubtotal: null,
  });
  const [productTaxModal, setProductTaxModal] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string | null;
    productSubtotal: number | null;
    existingTaxType?: "PERCENTAGE" | "FIXED";
    existingTaxValue?: number;
    existingTaxIds?: string[];
    existingTaxTitle?: string;
    existingTaxId?: string;
  }>({
    isOpen: false,
    productId: null,
    productName: null,
    productSubtotal: null,
  });
  const [recentProducts, setRecentProducts] = useState<ProductSearch[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [inventoryCache, setInventoryCache] = useState<Map<string, any[]>>(new Map());
  const [viewTaxesDialog, setViewTaxesDialog] = useState<{
    isOpen: boolean;
    productName: string;
    taxes: Array<{ id: string; name: string; rate: number; tax_type: "percentage" | "fixed_amount"; description?: string }>;
    productSubtotal: number;
  }>({
    isOpen: false,
    productName: "",
    taxes: [],
    productSubtotal: 0,
  });

  // Verificar si ya existe un descuento en la cotización
  const hasDiscount = useMemo(() => {
    return formData.products.some(product => product.isDiscount);
  }, [formData.products]);

  const hasTaxes = useMemo(() => {
    return formData.products.some(product => {
      const p: any = product as any;
      return (
        product.hasTax === true ||
        (p.taxAmount ?? p.tax_amount ?? 0) > 0
      );
    });
  }, [formData.products]);

  // Cargar productos recientes cuando se abre el buscador
  useEffect(() => {
    const loadRecentProducts = async () => {
      if (searchOpen && searchQuery.length === 0) {
        setIsLoadingRecent(true);
        try {
          const result = await getProducts(1, 10);
          
          // Convertir los productos a ProductSearch incluyendo el inventario
          const convertedProducts: ProductSearch[] = result.products.map(product => {
            const rawProduct = product as any; 
            
            return {
              id: product.id,
              name: product.name,
              description: product.description || null,
              image_url: product.image_url || null,
              category_id: product.category_id || null,
              is_available: product.is_available,
              measure_unit: product.measure_unit || null,
              type: product.type,
              measurement: product.measurement || null,
              product_categories: product.category_name ? {
                title: product.category_name,
                active: true
              } : null,
              products_price_lists: product.price_lists?.map(pl => ({
                price: pl.price || 0
              })) || [],
              product_inventory: rawProduct.product_inventory || [],
              // Calcular el stock total
              total_stock: rawProduct.product_inventory?.reduce(
                (sum: number, inv: { quantity: number }) => sum + (inv.quantity || 0), 
                0
              ) || 0
            };
          });
          
          setRecentProducts(convertedProducts);
        } catch (error) {
          console.error("Error cargando productos recientes:", error);
          setRecentProducts([]);
        } finally {
          setIsLoadingRecent(false);
        }
      }
    };

    loadRecentProducts();
  }, [searchOpen, searchQuery]);

  const calculateProductTotal = (product: ProductItem) => {
    const subtotal = product.quantity * product.unitPrice;
    let total = subtotal;
    
    // Si tiene descuento específico aplicado, restarlo
    if (product.discountAmount && product.discountAmount > 0) {
      total -= product.discountAmount;
    }
    
    // Si tiene impuesto específico aplicado, sumarlo
    if (product.taxAmount && product.taxAmount > 0) {
      total += product.taxAmount;
    }
    
    return total;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN", // Usar MXN fijo
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Cargar listas de precios
  useEffect(() => {
    const loadPriceLists = async () => {
      setIsLoadingPriceLists(true);
      try {
        const lists = await getActivePriceLists();
        setPriceLists(lists);

        const defaultList = lists.find((list) => list.code === "default");
        const firstList = lists[0];
        const initialList = defaultList || firstList;

        if (initialList && !formData.selectedPriceList) {
          handleSelectChange("selectedPriceList", initialList.id);
        }
      } catch (error) {
        console.error("Error cargando listas de precios:", error);
        toast.error("Error al cargar listas de precios");
      } finally {
        setIsLoadingPriceLists(false);
      }
    };

    loadPriceLists();
  }, []);

  // Cargar almacenes/ubicaciones
  useEffect(() => {
    const loadLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const locs = await getPhysicalInventoryLocations();
        setLocations(locs);
        
        // Seleccionar automáticamente el primer almacén
        if (locs.length > 0 && !formData.inventory_location_id) {
          handleSelectChange("inventory_location_id", locs[0].id);
        }
      } catch (error) {
        console.error("Error cargando almacenes:", error);
        toast.error("Error al cargar almacenes");
      } finally {
        setIsLoadingLocations(false);
      }
    };

    loadLocations();
  }, []);

  // Actualizar inventario de productos cuando cambia el almacén
  useEffect(() => {
    // Timeout para evitar múltiples requests simultáneos
    const timeoutId = setTimeout(async () => {
      if (!formData.inventory_location_id || formData.products.length === 0) {
        setInventoryCache(new Map());
        return;
      }

      // Filtrar solo productos reales (no descuentos ni impuestos)
      const realProducts = formData.products.filter(
        p => !p.isDiscount && !(typeof p.id === 'string' && p.id.startsWith('tax-'))
      );

      if (realProducts.length === 0) {
        setInventoryCache(new Map());
        return;
      }

      try {
        // Obtener los IDs de los productos
        const productIds = realProducts.map(p => p.id);

        // Consultar productos actualizados con inventario
        const supabase = await createClient();
        const { data, error } = await supabase
          .from('products')
          .select(`
            id,
            product_inventory!left (
              id_inventory,
              quantity
            )
          `)
          .in('id', productIds);

        if (error) {
          console.error("Error actualizando inventarios:", error);
          return;
        }

        // Actualizar la caché de inventarios
        if (data) {
          const newCache = new Map();
          data.forEach(product => {
            if (product.product_inventory) {
              newCache.set(product.id, product.product_inventory);
            }
          });
          setInventoryCache(newCache);
        }
      } catch (error) {
        console.error("Error actualizando inventario de productos:", error);
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [formData.inventory_location_id, formData.products.length]);

  // Función para obtener el precio de un producto según la lista seleccionada
  const getProductPriceByPriceList = async (
    productId: string,
    priceListId: string
  ): Promise<number | null> => {
    try {
      const priceInList = await getProductPriceInPriceList(
        productId,
        priceListId
      );

      if (priceInList !== null) {
        return priceInList;
      }

      const defaultList = priceLists.find((list) => list.code === "default");

      if (defaultList && defaultList.id !== priceListId) {
        const priceInDefault = await getProductPriceInPriceList(
          productId,
          defaultList.id
        );

        if (priceInDefault !== null) {
          return priceInDefault;
        }
      }

      return null;
    } catch (error) {
      console.error(`[getProductPriceByPriceList] Error:`, error);
      return null;
    }
  };

  // Función para manejar cambio de lista de precios
  const handlePriceListChange = async (priceListId: string) => {
    if (formData.products.filter(p => !p.isDiscount).length > 0) {
      setPendingPriceListChange(priceListId);
      setShowPriceListConfirm(true);
    } else {
      await executePriceListChange(priceListId);
    }
  };

  // Función para ejecutar el cambio de lista de precios
  const executePriceListChange = async (priceListId: string) => {
    try {
      setUpdatingPrices(true);
      setShowPriceListConfirm(false);
      setPriceListOpen(false);

      handleSelectChange("selectedPriceList", priceListId);

      await updateProductPricesForNewPriceList(priceListId);

      const selectedListName =
        priceLists.find((list) => list.id === priceListId)?.name || "la lista";
      toast.success(`Lista de precios cambiada a "${selectedListName}"`);
    } catch (error) {
      console.error("Error cambiando lista de precios:", error);
      toast.error("Error al actualizar precios");
    } finally {
      setUpdatingPrices(false);
      setPendingPriceListChange(null);
    }
  };

  // Actualizar precios de todos los productos cuando cambia la lista (excluyendo descuentos)
  const updateProductPricesForNewPriceList = async (priceListId: string) => {
    const productsToUpdate = formData.products.filter(product => !product.isDiscount);
    
    if (productsToUpdate.length === 0) return;

    const updates: Array<Promise<void>> = [];

    for (const productItem of productsToUpdate) {
      updates.push(
        (async () => {
          try {
            const newPrice = await getProductPriceByPriceList(
              productItem.id,
              priceListId
            );

            if (newPrice !== null) {
              onProductUpdate(productItem.id, { unitPrice: newPrice });
            }
          } catch (error) {
            console.error(
              `Error actualizando precio para producto ${productItem.id}:`,
              error
            );
          }
        })()
      );
    }

    await Promise.all(updates);
  };

  // Buscar productos
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length === 0) {
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchProductsByName(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Error buscando productos:", error);
        toast.error("Error al buscar productos");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(() => {
      searchProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

    const handleSearchSelect = async (product: ProductSearch) => {
      const exists = formData.products.find((p) => p.id === product.id);
      if (exists) {
        const msg = product?.type === 'service'
          ? 'Este servicio ya está en la cotización'
          : 'Este producto ya está en la cotización'
        toast.info(msg);
        return;
      }

      let unitPrice = 0;

      if (formData.selectedPriceList) {
        try {
          const price = await getProductPriceByPriceList(
            product.id,
            formData.selectedPriceList
          );
          if (price !== null) {
            unitPrice = price;
          }
        } catch (error) {
          console.error(`Error obteniendo precio para ${product.name}:`, error);
          unitPrice = 0;
        }
      } else {
        const defaultList = priceLists.find((list) => list.code === "default");
        if (defaultList) {
          const price = await getProductPriceByPriceList(
            product.id,
            defaultList.id
          );
          unitPrice = price || 0;
        }
      }

      const newProduct: ProductItem = {
        id: product.id,
        product,
        quantity: 1,
        unitPrice,
        discount: 0,
        notes: "",
        isDiscount: false,
      };

      onProductSelect(product.id, product, newProduct);

      // No mostrar notificación para servicios
      if (product.type !== 'service') {
        toast.success(`"${product.name}" agregado a la cotización`);
      }
      setSearchQuery("");
      setSearchResults([]);
      setSearchOpen(false);
    };

  // Función para manejar descuento desde el modal
  const handleDiscountFromModal = (amount: string, title: string, type: "amount" | "percentage") => {
    if (!amount || isNaN(parseFloat(amount.replace(",", ".")))) {
      toast.error("Ingresa un monto válido");
      return;
    }

    let discountValue = 0;
    let discountNotes = "";
    const numericAmount = parseFloat(amount.replace(",", "."));

    if (type === "amount") {
      // Descuento en monto fijo
      discountValue = numericAmount;
      
      // Validar que el descuento no sea mayor que el subtotal de productos
      if (discountValue > calculateProductsGrossSubtotalWithProductDiscounts()) {
        toast.error("El descuento no puede ser mayor al subtotal");
        return;
      }
      
      discountNotes = `Descuento fijo: ${formatCurrency(discountValue)}`;
    } else {
      // Descuento en porcentaje
      if (numericAmount < 0 || numericAmount > 100) {
        toast.error("El porcentaje debe estar entre 0 y 100");
        return;
      }
      discountValue = (calculateProductsGrossSubtotalWithProductDiscounts() * numericAmount) / 100;
      discountNotes = `${numericAmount}% de descuento`;
    }

    // Crear un ID único para el descuento
    const discountId = `discount-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear el objeto de descuento como un "producto especial"
    const discountProduct: ProductSearch = {
      id: discountId,
      name: title || "Descuento",
      description: type === "percentage" ? `${numericAmount}% de descuento` : "Descuento aplicado",
      image_url: null,
      category_id: null,
      is_available: true,
      product_categories: null,
      products_price_lists: [],
    };

    // Crear el item de descuento
    const discountItem: Partial<ProductItem> = {
      id: discountId,
      product: discountProduct,
      quantity: 1, // Siempre será 1 para descuentos
      unitPrice: -Math.abs(discountValue), // Precio negativo
      discount: 0,
      notes: discountNotes,
      isDiscount: true,
      discountTitle: title || "Descuento",
      discountType: type, // Guardamos el tipo aquí
    };

    // Agregar el descuento como un "producto"
    onProductSelect(discountId, discountProduct, discountItem);
    
    // Mostrar mensaje
    toast.success(`Descuento "${title || 'Descuento'}" agregado: ${formatCurrency(discountValue)}`);
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const productItem = formData.products.find(p => p.id === productId);
    
    // Si es un descuento o impuesto, NO PERMITIR cambiar la cantidad
    if (productItem?.isDiscount) {
      toast.info("No se puede modificar la cantidad de un descuento");
      return;
    }
    
    // Allow changing quantity for real products that have a product-level tax.
    // Only block quantity changes for tax pseudo-products added as items (id starts with 'tax-').
    if (productItem && typeof productItem.id === "string" && productItem.id.startsWith("tax-")) {
      toast.info("No se puede modificar la cantidad de un impuesto");
      return;
    }
    
    if (quantity < 1) return;
    onProductUpdate(productId, { quantity });
  };

  const handlePriceChange = (productId: string, price: number) => {
    const productItem = formData.products.find(p => p.id === productId);
    
    // Si es un descuento o impuesto, NO PERMITIR cambiar el precio
    if (productItem?.isDiscount) {
      toast.info("No se puede modificar el precio de un descuento");
      return;
    }
    
    // Only prevent price edits for tax pseudo-products (items whose id starts with 'tax-')
    if (productItem && typeof productItem.id === "string" && productItem.id.startsWith("tax-")) {
      toast.info("No se puede modificar el precio de un impuesto");
      return;
    }
    
    if (price < 0) return;
    onProductUpdate(productId, { unitPrice: price });
  };

  // Abrir modal de descuento para un producto específico
  const handleOpenProductDiscount = (productId: string) => {
    const product = formData.products.find(p => p.id === productId);
    if (!product || product.isDiscount) return;

    const productSubtotal = product.quantity * product.unitPrice;
    
    // Convertir el tipo de descuento al formato correcto
    let discountType: "PERCENTAGE" | "FIXED" | undefined;
    if (product.discountType === "PERCENTAGE" || product.discountType === "percentage") {
      discountType = "PERCENTAGE";
    } else if (product.discountType === "FIXED" || product.discountType === "amount") {
      discountType = "FIXED";
    }
    
    setProductDiscountModal({
      isOpen: true,
      productId: product.id,
      productName: product.product.name,
      productSubtotal,
      existingDiscountType: discountType,
      existingDiscountValue: product.discountValue,
    });
  };

  // Aplicar descuento a un producto específico
  const handleApplyProductDiscount = (amount: string, title: string, type: "amount" | "percentage") => {
    if (!productDiscountModal.productId) return;

    const numericAmount = Number.parseFloat(amount);
    if (Number.isNaN(numericAmount) || numericAmount < 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    const product = formData.products.find(p => p.id === productDiscountModal.productId);
    if (!product) return;

    // Si el monto es 0, eliminar el descuento
    if (numericAmount === 0) {
      // Quitar descuento
      const productSubtotal = product.quantity * product.unitPrice;
      // Recalcular impuesto específico si existía
      let newTaxAmount: number | undefined = undefined;
      if (product.taxType && product.taxValue != null) {
        const taxValueNum = Number(product.taxValue || 0);
        if (product.taxType === "PERCENTAGE") {
          newTaxAmount = (productSubtotal * taxValueNum) / 100;
        } else {
          newTaxAmount = taxValueNum;
        }
      } else if (product.tax_ids && product.tax_ids.length > 0 && product.taxesData) {
        // Si hay múltiples impuestos, recalcularlos todos sobre el subtotal sin descuento
        newTaxAmount = 0;
        product.taxesData.forEach(tax => {
          if (tax.tax_type === 'percentage') {
            newTaxAmount! += (productSubtotal * tax.rate) / 100;
          } else {
            newTaxAmount! += tax.rate;
          }
        });
      }

      onProductUpdate(productDiscountModal.productId, {
        discountType: undefined,
        discountValue: undefined,
        discountAmount: undefined,
        taxAmount: newTaxAmount,
        hasTax: newTaxAmount && newTaxAmount > 0 ? true : false,
        // Preservar campos de impuestos existentes
        taxTitle: product.taxTitle,
        taxType: product.taxType,
        taxValue: product.taxValue,
        tax_id: product.tax_id,
        tax_ids: product.tax_ids,
        taxesData: product.taxesData,
      });
      toast.success('Descuento eliminado');
      setProductDiscountModal({ isOpen: false, productId: null, productName: null, productSubtotal: null, existingDiscountType: undefined, existingDiscountValue: undefined });
      return;
    }

    const productSubtotal = product.quantity * product.unitPrice;
    let discountAmount = 0;

    if (type === "percentage") {
      if (numericAmount > 100) {
        toast.error("El porcentaje no puede ser mayor a 100%");
        return;
      }
      discountAmount = (productSubtotal * numericAmount) / 100;
    } else {
      if (numericAmount > productSubtotal) {
        toast.error("El descuento no puede ser mayor al subtotal del producto");
        return;
      }
      discountAmount = numericAmount;
    }

    // Recalcular impuesto específico si existe, usando la base gravable después del descuento
    let newTaxAmount: number | undefined = undefined;
    if (product.taxType && product.taxValue != null) {
      const taxValueNum = Number(product.taxValue || 0);
      const taxableBase = Math.max(0, productSubtotal - discountAmount);
      if (product.taxType === "PERCENTAGE") {
        newTaxAmount = (taxableBase * taxValueNum) / 100;
      } else {
        newTaxAmount = taxValueNum;
      }
    } else if (product.tax_ids && product.tax_ids.length > 0 && product.taxesData) {
      // Si hay múltiples impuestos, recalcularlos todos
      const taxableBase = Math.max(0, productSubtotal - discountAmount);
      newTaxAmount = 0;
      product.taxesData.forEach(tax => {
        if (tax.tax_type === 'percentage') {
          newTaxAmount! += (taxableBase * tax.rate) / 100;
        } else {
          newTaxAmount! += tax.rate;
        }
      });
    }

    // Actualizar el producto con el descuento y el impuesto recalculado
    // IMPORTANTE: Preservar TODOS los campos de impuestos existentes
    onProductUpdate(productDiscountModal.productId, {
      discountType: type === "percentage" ? "PERCENTAGE" : "FIXED",
      discountValue: numericAmount,
      discountAmount: discountAmount,
      taxAmount: newTaxAmount,
      hasTax: newTaxAmount && newTaxAmount > 0 ? true : (product.hasTax ?? false),
      // Preservar campos de impuestos existentes
      taxTitle: product.taxTitle,
      taxType: product.taxType,
      taxValue: product.taxValue,
      tax_id: product.tax_id,
      tax_ids: product.tax_ids,
      taxesData: product.taxesData,
    });

    toast.success(`Descuento aplicado a ${product.product.name}`);
    setProductDiscountModal({ isOpen: false, productId: null, productName: null, productSubtotal: null, existingDiscountType: undefined, existingDiscountValue: undefined });
  };

  // Función para manejar impuesto desde el modal (general)
  const handleTaxFromModal = (amount: string, title: string, type: "amount" | "percentage", taxId?: string) => {
    if (!amount || isNaN(parseFloat(amount.replace(",", ".")))) {
      toast.error("Ingresa un monto válido");
      return;
    }

    const numericAmount = parseFloat(amount.replace(",", "."));
    let taxValue = 0;
    let taxNotes = "";

    if (type === "amount") {
      // Impuesto en monto fijo
      taxValue = numericAmount;
      taxNotes = `Impuesto fijo: ${formatCurrency(taxValue)}`;
    } else {
      // Impuesto en porcentaje
      if (numericAmount < 0 || numericAmount > 100) {
        toast.error("El porcentaje debe estar entre 0 y 100");
        return;
      }
      // Calcular impuesto sobre el subtotal considerando descuentos por producto (sin descuento general)
      // If taxId is provided, numericAmount is the rate; calculate from it
      taxValue = (calculateProductsGrossSubtotalWithProductDiscounts() * numericAmount) / 100;
      taxNotes = `${numericAmount}% de impuesto`;
    }

    // Crear un ID único para el item-impuesto (pseudo-producto)
    const newTaxItemId = `tax-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Crear el objeto de impuesto como un "producto especial"
    const taxProduct: ProductSearch = {
      id: newTaxItemId,
      name: title || "Impuesto",
      description: type === "percentage" ? `${numericAmount}% de impuesto` : "Impuesto aplicado",
      image_url: null,
      category_id: null,
      is_available: true,
      product_categories: null,
      products_price_lists: [],
    };

    // Crear el item de impuesto (exactamente igual al descuento pero con valores positivos)
    const taxItem: Partial<ProductItem> = {
      id: newTaxItemId,
      product: taxProduct,
      quantity: 1, // Siempre será 1 para impuestos
      unitPrice: Math.abs(taxValue), // Precio positivo para impuestos
      discount: 0,
      notes: taxNotes,
      hasTax: true,
      taxTitle: title || "Impuesto",
      taxType: type, // Guardamos el tipo aquí
      taxValue: numericAmount,
      taxAmount: Math.abs(taxValue),
      tax_id: taxId ?? newTaxItemId,
    };

    // Agregar el impuesto como un "producto"
    onProductSelect(newTaxItemId, taxProduct, taxItem);
    
    // Mostrar mensaje
    toast.success(`Impuesto "${title || 'Impuesto'}" agregado: ${formatCurrency(taxValue)}`);
  };

  // Abrir modal de impuesto para un producto específico
  const handleOpenProductTax = (productId: string) => {
    const product = formData.products.find(p => p.id === productId);
    if (!product || product.isDiscount) return;

    const productSubtotal = product.quantity * product.unitPrice;
    const productDiscount = product.discountAmount || 0;
    const taxableBase = Math.max(0, productSubtotal - productDiscount);
    
    // Convertir el tipo de impuesto al formato correcto
    let taxType: "PERCENTAGE" | "FIXED" | undefined;
    if (product.taxType === "PERCENTAGE" || product.taxType === "percentage") {
      taxType = "PERCENTAGE";
    } else if (product.taxType === "FIXED" || product.taxType === "amount") {
      taxType = "FIXED";
    }

    setProductTaxModal({
      isOpen: true,
      productId: product.id,
      productName: product.product.name,
      productSubtotal: taxableBase,
      existingTaxType: taxType,
      existingTaxValue: product.taxValue,
      existingTaxTitle: product.taxTitle,
      existingTaxId: (product as any).tax_id,
      existingTaxIds: (product as any).tax_ids,
    });
  };

  // Aplicar impuesto(s) a un producto específico
  const handleApplyProductTax = (amount: string, title: string, type: "amount" | "percentage", taxId?: string, taxIds?: string[], taxesData?: any[]) => {
    if (!productTaxModal.productId) return;

    const product = formData.products.find(p => p.id === productTaxModal.productId);
    if (!product) return;

    // Si taxIds está vacío, eliminar impuestos
    if (taxIds && taxIds.length === 0) {
      onProductUpdate(productTaxModal.productId, {
        taxType: undefined,
        taxValue: undefined,
        taxAmount: undefined,
        taxTitle: undefined,
        hasTax: false,
        tax_id: undefined,
        tax_ids: [],
        taxesData: [],
      });
      toast.success('Impuestos eliminados');
      setProductTaxModal({ isOpen: false, productId: null, productName: null, productSubtotal: null, existingTaxType: undefined, existingTaxValue: undefined, existingTaxTitle: undefined, existingTaxId: undefined, existingTaxIds: undefined });
      return;
    }

    const productSubtotal = product.quantity * product.unitPrice;
    const productDiscount = Number(product.discountAmount ?? 0) || 0;
    const taxableBase = Math.max(0, productSubtotal - productDiscount);
    let totalTaxAmount = 0;
    const taxNames: string[] = [];

    // Si tenemos múltiples impuestos, calcular la suma
    if (taxIds && taxIds.length > 0 && taxesData) {
      taxesData.forEach(tax => {
        if (taxIds.includes(tax.id)) {
          let taxAmount = 0;
          if (tax.tax_type === 'percentage') {
            taxAmount = (taxableBase * tax.rate) / 100;
          } else {
            taxAmount = tax.rate;
          }
          totalTaxAmount += taxAmount;
          taxNames.push(tax.name);
        }
      });

      // Actualizar el producto con múltiples impuestos
      onProductUpdate(productTaxModal.productId, {
        taxType: "PERCENTAGE", // Valor legacy, ya no se usa realmente
        taxValue: undefined,
        taxAmount: totalTaxAmount,
        taxTitle: taxNames.join(', '),
        hasTax: true,
        tax_id: taxIds.length === 1 ? taxIds[0] : undefined, // Retrocompatibilidad
        tax_ids: taxIds,
        taxesData: taxesData.filter(tax => taxIds.includes(tax.id)), // Guardar información completa de los impuestos
      });

      toast.success(`${taxIds.length} impuesto(s) aplicado(s) a ${product.product.name}`);
    } else {
      // Lógica legacy para compatibilidad con código anterior
      const numericAmount = Number.parseFloat(amount);
      if (Number.isNaN(numericAmount) || numericAmount < 0) {
        toast.error("Por favor ingresa un monto válido");
        return;
      }

      if (numericAmount === 0) {
        onProductUpdate(productTaxModal.productId, {
          taxType: undefined,
          taxValue: undefined,
          taxAmount: undefined,
          taxTitle: undefined,
          hasTax: false,
          tax_id: undefined,
          tax_ids: [],
          taxesData: [],
        });
        toast.success('Impuesto eliminado');
        setProductTaxModal({ isOpen: false, productId: null, productName: null, productSubtotal: null, existingTaxType: undefined, existingTaxValue: undefined, existingTaxTitle: undefined, existingTaxId: undefined, existingTaxIds: undefined });
        return;
      }

      let taxAmount = 0;
      if (type === "percentage") {
        if (numericAmount > 100) {
          toast.error("El porcentaje no puede ser mayor a 100%");
          return;
        }
        taxAmount = (taxableBase * numericAmount) / 100;
      } else {
        taxAmount = numericAmount;
      }

      onProductUpdate(productTaxModal.productId, {
        taxType: type === "percentage" ? "PERCENTAGE" : "FIXED",
        taxValue: numericAmount,
        taxAmount: taxAmount,
        taxTitle: title,
        hasTax: true,
        tax_id: taxId ?? undefined,
        tax_ids: taxId ? [taxId] : undefined,
        taxesData: taxId ? [{
          id: taxId,
          name: title,
          rate: numericAmount,
          tax_type: type === "percentage" ? "percentage" : "fixed_amount",
          amount: taxAmount,
        }] : undefined,
      });

      toast.success(`Impuesto aplicado a ${product.product.name}`);
    }

    setProductTaxModal({ isOpen: false, productId: null, productName: null, productSubtotal: null, existingTaxType: undefined, existingTaxValue: undefined, existingTaxTitle: undefined, existingTaxId: undefined, existingTaxIds: undefined });
  };

  // Obtener el nombre de la lista de precios seleccionada
  const getSelectedPriceListName = () => {
    if (!formData.selectedPriceList || priceLists.length === 0)
      return isLoadingPriceLists ? "Cargando..." : "Seleccionar lista";

    const selectedList = priceLists.find(
      (list) => list.id === formData.selectedPriceList
    );
    return selectedList ? selectedList.name : "Seleccionar lista";
  };

  // Obtener el nombre del almacén seleccionado
  const getSelectedLocationName = () => {
    if (!formData.inventory_location_id || locations.length === 0) 
      return isLoadingLocations ? "Cargando..." : "Seleccionar almacén"
    
    const selectedLocation = locations.find(loc => loc.id === formData.inventory_location_id)
    return selectedLocation ? selectedLocation.name : "Seleccionar almacén"
  }

  // Obtener el nombre de la lista de precios pendiente
  const getPendingPriceListName = () => {
    if (!pendingPriceListChange || priceLists.length === 0) return "";

    const pendingList = priceLists.find(
      (list) => list.id === pendingPriceListChange
    );
    return pendingList ? pendingList.name : "";
  };

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (!target.closest(".search-container")) {
        setSearchOpen(false);
      }

      if (!target.closest(".price-list-container")) {
        setPriceListOpen(false);
      }
      
      if (!target.closest('.location-container')) {
        setLocationOpen(false)
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Obtener stock según almacén seleccionado
const getStockByLocation = (
  product: ProductSearch,
  locationId?: string
): number => {

  if (product.type === "service") {
    return 0;
  }

  if (!locationId) {
    return product.total_stock ?? 0;
  }

  const cachedInventory = inventoryCache.get(product.id);

  if (cachedInventory) {
    const inventory = cachedInventory.find(
      (inv: any) => inv.id_inventory === locationId
    );

    if (inventory) {
      return inventory.quantity ?? 0;
    }
  }

  const inventory = (product as any).product_inventory?.find(
    (inv: any) => inv.id_inventory === locationId
  );

  return inventory?.quantity ?? 0;
};
  // Calcular impuestos a partir de los productos del formulario
  const calculateTaxes = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, product) => {
      const p: any = product as any;
      const tax = Number(p.taxAmount ?? p.tax_amount ?? 0) || 0;
      return sum + tax;
    }, 0);
  };

  // Impuestos específicos aplicados a productos reales (excluye impuestos generales añadidos como producto 'tax-')
  const calculateProductLevelTaxes = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, product) => {
      const p: any = product as any;
      if (p.isDiscount) return sum;
      if (typeof p.id === "string" && p.id.startsWith("tax-")) return sum;
      const tax = Number(p.taxAmount ?? p.tax_amount ?? 0) || 0;
      return sum + tax;
    }, 0);
  };

  // Impuesto general añadido como "producto" (id comienza con 'tax-')
  const calculateGeneralTaxes = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, product) => {
      const p: any = product as any;
      if (typeof p.id === "string" && p.id.startsWith("tax-")) {
        const tax = Number(p.taxAmount ?? p.tax_amount ?? p.unitPrice ?? 0) || 0;
        return sum + tax;
      }
      return sum;
    }, 0);
  };

  // Descuento general añadido como "producto" (items con isDiscount === true)
  const calculateGeneralDiscounts = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, product) => {
      const p: any = product as any;
      if (!p.isDiscount) return sum;
      const amt = Math.abs(Number(p.unitPrice ?? p.unit_price ?? p.discountAmount ?? p.discount_amount ?? 0) || 0);
      return sum + amt;
    }, 0);
  };

  // Subtotal bruto de productos (sin descuentos ni impuestos)
  const calculateProductsGrossSubtotal = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, product) => {
      const p: any = product as any;
      // Excluir items de descuento y items que representan impuestos añadidos como "producto" (id comienza con 'tax-')
      if (p.isDiscount) return sum;
      if (typeof p.id === "string" && p.id.startsWith("tax-")) return sum;
      const qty = Number(p.quantity ?? 0);
      const unit = Number(p.unitPrice ?? p.unit_price ?? 0);
      const discountAmt = Number(p.discountAmount ?? p.discount_amount ?? 0) || 0;
      const line = Math.max(0, qty * unit - discountAmt);
      return sum + line;
    }, 0);
  };

  // Subtotal bruto incluyendo descuentos aplicados por producto (excluye descuento general e impuesto)
  const calculateProductsGrossSubtotalWithProductDiscounts = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, product) => {
      const p: any = product as any;
      // Excluir items que son descuentos globales o items que representan impuestos
      // Excluir items que son descuentos globales
      if (p.isDiscount) return sum;

      // Excluir items que son impuestos generales añadidos como producto (id comienza con 'tax-')
      if (typeof p.id === "string" && p.id.startsWith("tax-")) return sum;

      const qty = Number(p.quantity ?? 0);
      const unit = Number(p.unitPrice ?? p.unit_price ?? 0);
      const discountAmt = Number(p.discountAmount ?? p.discount_amount ?? 0) || 0;
      const productTax = Number(p.taxAmount ?? p.tax_amount ?? 0) || 0;

      // Calcular subtotal del producto con su descuento y sumar impuesto específico del producto
      return sum + (qty * unit - discountAmt) + productTax;
    }, 0);
  };

  const calculateAllProductDiscounts = () => {
    if (!formData?.products || formData.products.length === 0) return 0;
    return formData.products.reduce((sum, product) => {
      const p: any = product as any;
      const discount = p.discountAmount ?? p.discount_amount ?? (p.hasDiscount ? Math.abs(p.unitPrice || 0) : 0);
      return sum + (discount || 0);
    }, 0);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 md:px-6 py-4 border-b border-gray-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Productos
              </h2>

              {formData.products.filter(p => !p.isDiscount).length > 0 && (
                <button
                  type="button"
                  onClick={onClearProducts}
                  disabled={updatingPrices}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto sm:hidden"
                  title="Limpiar todo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Combobox de Almacenes */}
              <div className="relative location-container w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setLocationOpen(!locationOpen)}
                  disabled={isLoadingLocations || updatingPrices}
                  className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-300 bg-[#070B14] border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Warehouse className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="text-left truncate">
                      <div className="font-medium truncate">
                        {getSelectedLocationName()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    <ChevronDown className={`w-4 h-4 transition-transform ${locationOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Dropdown de Almacenes */}
                {locationOpen && (
                  <div className="absolute z-50 mt-1 w-full sm:w-48 rounded-lg border border-gray-700 bg-[#0A0F17] shadow-xl">
                    {isLoadingLocations ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-yellow-400 mr-2" />
                        <span className="text-sm text-gray-400">Cargando...</span>
                      </div>
                    ) : locations.length === 0 ? (
                      <div className="py-3 px-4 text-center">
                        <p className="text-sm text-gray-400">No hay almacenes disponibles</p>
                      </div>
                    ) : (
                      <ul className="py-1 max-h-60 overflow-y-auto">
                        {locations.map((location) => (
                          <li key={location.id}>
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectChange("inventory_location_id", location.id)
                                setLocationOpen(false)
                                toast.success(`Almacén cambiado a "${location.name}"`)
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-400/10 transition-colors flex items-center justify-between ${
                                formData.inventory_location_id === location.id 
                                  ? 'bg-yellow-400/20 text-yellow-400' 
                                  : 'text-gray-300'
                              }`}
                            >
                              <div className="truncate">
                                <div className="font-medium truncate">{location.name}</div>
                              </div>
                              {formData.inventory_location_id === location.id && (
                                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0"></div>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Combobox de Listas de Precios */}
              <div className="relative price-list-container w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPriceListOpen(!priceListOpen)}
                  disabled={isLoadingPriceLists || updatingPrices}
                  className="inline-flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-300 bg-[#070B14] border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <DollarSign className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="text-left truncate">
                      <div className="font-medium truncate">
                        {getSelectedPriceListName()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-shrink-0">
                    {updatingPrices ? (
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    ) : (
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${priceListOpen ? "rotate-180" : ""}`}
                      />
                    )}
                  </div>
                </button>

                {/* Dropdown de Listas de Precios */}
                {priceListOpen && (
                  <div className="absolute z-50 mt-1 w-full sm:w-48 rounded-lg border border-gray-700 bg-[#0A0F17] shadow-xl right-0">
                    {isLoadingPriceLists ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="h-4 w-4 animate-spin text-yellow-400 mr-2" />
                        <span className="text-sm text-gray-400">Cargando...</span>
                      </div>
                    ) : priceLists.length === 0 ? (
                      <div className="py-3 px-4 text-center">
                        <p className="text-sm text-gray-400">
                          No hay listas disponibles
                        </p>
                      </div>
                    ) : (
                      <ul className="py-1 max-h-60 overflow-y-auto">
                        {priceLists.map((list) => (
                          <li key={list.id}>
                            <button
                              type="button"
                              onClick={() => handlePriceListChange(list.id)}
                              disabled={updatingPrices}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-400/10 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                                formData.selectedPriceList === list.id
                                  ? "bg-yellow-400/20 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            >
                              <div className="truncate">
                                <div className="font-medium truncate">{list.name}</div>
                              </div>
                              {formData.selectedPriceList === list.id && (
                                <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0"></div>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {formData.products.filter(p => !p.isDiscount).length > 0 && (
                <button
                  type="button"
                  onClick={onClearProducts}
                  disabled={updatingPrices}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hidden sm:inline-flex self-start sm:self-center"
                  title="Limpiar todo"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="px-4 md:px-6 py-4 bg-[#070B14] border-b border-gray-800">
            <div className="relative search-container">
              <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 md:h-5 md:w-5 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Buscar productos o hacer clic para ver todos..."
                className="pl-9 md:pl-12 pr-9 md:pr-12 h-10 md:h-12 bg-[#0A0F17] border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-lg text-sm md:text-base"
                disabled={loading || updatingPrices}
              />

              {/* Resultados de búsqueda */}
              {searchOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 bg-[#0A0F17] shadow-xl max-h-80 overflow-y-auto">
                  {searchQuery.length === 0 ? (
                    // Mostrar productos recientes cuando no hay búsqueda
                    <>
                      {isLoadingRecent ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-yellow-400 mr-2" />
                          <span className="text-sm text-gray-400">Cargando productos...</span>
                        </div>
                      ) : recentProducts.length === 0 ? (
                        <div className="py-8 text-center">
                          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-900 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-500" />
                          </div>
                          <p className="text-sm text-gray-300 font-medium">Productos disponibles</p>
                          <p className="text-xs text-gray-500 mt-1">Comienza a escribir para buscar productos específicos</p>
                        </div>
                      ) : (
                        <>
                          <div className="sticky top-0 bg-[#0A0F17] px-4 py-3 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-yellow-400" />
                              <span className="text-sm font-medium text-white">Productos disponibles</span>
                              <span className="text-xs text-gray-400 ml-auto">
                                {recentProducts.length} productos
                              </span>
                            </div>
                          </div>
                          <ul className="divide-y divide-gray-800">
                            {recentProducts.map((product) => {
                              const isService = product.type === 'service';
                              const stock = isService ? 0 : getStockByLocation(product, formData.inventory_location_id);
                              const isLowStock = stock <= 0;
                              
                              return (
                                <li
                                  key={product.id}
                                  onClick={() =>
                                    !updatingPrices && handleSearchSelect(product)
                                  }
                                  className={`cursor-pointer px-4 py-3 transition-colors ${
                                    updatingPrices
                                      ? "opacity-50 cursor-not-allowed"
                                      : "hover:bg-yellow-400/10"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-white text-sm md:text-base">
                                        {product.name}
                                      </div>
                                      {product.description && (
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                                          {product.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        {product.product_categories?.title && (
                                          <span className="text-xs text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">
                                            {product.product_categories.title}
                                          </span>
                                        )}
                                        {isService && (
                                          <span className="text-xs text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-500/30">
                                            Servicio
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3">
                                      {/* Badge de stock disponible - Solo para artículos, no para servicios */}
                                      {!isService && (
                                        <span
                                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                            isLowStock
                                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                              : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                          }`}
                                        >
                                          {stock > 0 ? `${stock} unidades` : '0 unidades'}
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        disabled={updatingPrices}
                                        className="p-1.5 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                    </>
                  ) : isSearching ? (
                    // Mostrar loader cuando se está buscando
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-yellow-400 mr-2" />
                      <span className="text-sm text-gray-400">
                        Buscando productos...
                      </span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    // No hay resultados de búsqueda
                    <div className="py-8 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-900 flex items-center justify-center">
                        <Search className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-300 font-medium">
                        No se encontraron productos
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Intenta con otros términos de búsqueda
                      </p>
                    </div>
                  ) : (
                    // Mostrar resultados de búsqueda
                    <>
                      <div className="sticky top-0 bg-[#0A0F17] px-4 py-3 border-b border-gray-800">
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-medium text-white">Resultados de búsqueda</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {searchResults.length} productos encontrados
                          </span>
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-800">
                        {searchResults.map((product) => {
                          const isService = product.type === 'service';
                          const stock = isService ? 0 : getStockByLocation(product, formData.inventory_location_id)
                          const isLowStock = stock <= 0

                          return (
                            <li
                              key={product.id}
                              onClick={() =>
                                !updatingPrices && handleSearchSelect(product)
                              }
                              className={`cursor-pointer px-4 py-3 transition-colors ${
                                updatingPrices
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-yellow-400/10"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-white text-sm md:text-base">{product.name}</div>
                                  {product.description && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">{product.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    {product.product_categories?.title && (
                                      <span className="text-xs text-gray-500 bg-gray-900 px-1.5 py-0.5 rounded">
                                        {product.product_categories.title}
                                      </span>
                                    )}
                                    {isService && (
                                      <span className="text-xs text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-500/30">
                                        Servicio
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  {/* Badge de stock disponible - Solo para artículos, no para servicios */}
                                  {!isService && (
                                    <span
                                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                        isLowStock
                                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      }`}
                                    >
                                      {stock > 0 ? `${stock} unidades` : '0 unidades'}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    disabled={updatingPrices}
                                    className="p-1.5 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ) 
                        })}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lista de Productos */}
          {formData.products.filter(p => !p.isDiscount && !(typeof p.id === 'string' && p.id.startsWith('tax-'))).length > 0 || hasDiscount || hasTaxes ? (
            <div className="px-4 md:px-6 py-6">
              {/* Headers de tabla - Oculto en móvil. Producto ocupa más espacio, el resto queda agrupado con menos separación */}
              <div className="hidden md:flex items-center pb-3 mb-4 border-b border-gray-800">
                {/* Producto - un poco menos espacio que antes */}
                <div className="md:flex-[1.5] text-sm font-medium text-gray-400">Producto</div>

                {/* Grupo de columnas: más ancho y sin separación entre columnas */}
                <div className="md:flex-[2.5]">
                  <div className="flex items-center gap-0">
                    <div className="flex-1 text-sm font-medium text-gray-400 text-center">Cantidad</div>
                    <div className="flex-1 text-sm font-medium text-gray-400 text-center">Precio Unit.</div>
                    <div className="flex-1 text-sm font-medium text-gray-400 text-center">Descuento</div>
                    <div className="flex-1 text-sm font-medium text-gray-400 text-center">Impuesto</div>
                    <div className="flex-1 text-sm font-medium text-gray-400 text-right">Subtotal</div>
                  </div>
                </div>

                <div className="w-12 flex-shrink-0" />
              </div>

              {/* Productos */}
              <div className="space-y-6 md:space-y-4">
                {formData.products.map((productItem) => (
                  <div
                    key={productItem.id}
                    className={`border border-gray-800 rounded-lg p-4 md:p-0 md:border-0 ${
                      productItem.isDiscount ? 'bg-yellow-400/5' : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? 'bg-orange-400/5' : ''
                    }`}
                  >
                    {/* Diseño móvil (vertical) */}
                    <div className="md:hidden space-y-4">
                      {/* Cabecera del producto móvil */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                            {productItem.isDiscount ? (
                              <Tag className="w-5 h-5 text-yellow-400" />
                            ) : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? (
                              <DollarSign className="w-5 h-5 text-orange-400" />
                            ) : (
                              <div className="w-6 h-6 bg-gray-800 rounded"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm ${
                              productItem.isDiscount ? 'text-yellow-300' : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? 'text-orange-300' : 'text-white'
                            }`}>
                              {productItem.isDiscount 
                                ? (productItem.discountTitle || "Descuento") 
                                : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-'))
                                ? (productItem.taxTitle || "Impuesto")
                                : productItem.product.name}
                            </div>
                            {productItem.isDiscount && productItem.notes && (
                              <p className="text-xs text-yellow-400 mt-0.5">
                                {productItem.notes}
                              </p>
                            )}
                            {(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) && productItem.notes && (
                              <p className="text-xs text-orange-400 mt-0.5">
                                {productItem.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        {!productItem.isDiscount && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                disabled={updatingPrices}
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleOpenProductDiscount(productItem.id)}
                                className="cursor-pointer"
                              >
                                <Percent className="w-4 h-4 mr-2" />
                                Aplicar descuento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenProductTax(productItem.id)}
                                className="cursor-pointer"
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Aplicar impuesto
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onProductRemove(productItem.id)}
                                className="cursor-pointer text-red-400 focus:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar producto
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {(productItem.isDiscount || (typeof productItem.id === 'string' && productItem.id.startsWith('tax-'))) && (
                          <button
                            type="button"
                            onClick={() => onProductRemove(productItem.id)}
                            disabled={updatingPrices}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Campos de entrada móvil - Ocultos para descuentos e impuestos */}
                      {!productItem.isDiscount && !(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) && (
                        <div className="grid grid-cols-2 gap-3">
                          {/* Cantidad */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                              Cantidad
                            </label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="1"
                                value={productItem.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    productItem.id,
                                    Number.parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-full h-9 px-3 bg-[#070B14] border-gray-700 rounded-lg text-white text-center focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 text-sm"
                                disabled={loading || updatingPrices}
                              />
                              {/* Mostrar alerta de stock faltante solo para artículos, no para servicios */}
                              {productItem.product?.type === 'article' && (() => {
                                const availableStock = getStockByLocation(productItem.product, formData.inventory_location_id)
                                if (availableStock === undefined || availableStock === null) return null
                                const missing = productItem.quantity - availableStock

                                if (missing > 0) {
                                  return (
                                    <span className="absolute -bottom-5 left-0 right-0 text-center text-xs text-red-400 font-medium whitespace-nowrap">
                                      {missing} faltante{missing !== 1 ? 's' : ''}
                                    </span>
                                  )
                                }
                                return null
                              })()
                              }
                            </div>
                          </div>

                          {/* Precio Unitario */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                              Precio Unit.
                            </label>
                            <div className="relative">
                              <DollarSign className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={productItem.unitPrice}
                                onChange={(e) => {
                                  const price = parseFloat(e.target.value) || 0;
                                  handlePriceChange(productItem.id, price);
                                }}
                                className="w-full h-9 pl-8 pr-3 bg-[#070B14] border-gray-700 rounded-lg text-white text-right focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 text-sm"
                                disabled={loading || updatingPrices}
                              />
                            </div>
                          </div>

                          {/* Descuento */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                              Descuento
                            </label>
                            <div className="w-full h-9 px-3 bg-[#070B14] border border-gray-700 rounded-lg flex items-center justify-end text-green-400 text-sm">
                              {productItem.discountAmount && productItem.discountAmount > 0
                                ? `-${formatCurrency(productItem.discountAmount)}`
                                : '$0.00'}
                            </div>
                          </div>
                          {/* Impuesto */}
                          <div>
                            <label className="block text-xs text-gray-400 mb-1.5">
                              Impuesto
                            </label>
                            {productItem.taxAmount && productItem.taxAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (productItem.tax_ids && productItem.tax_ids.length > 0) {
                                    const productSubtotal = productItem.quantity * productItem.unitPrice - (productItem.discountAmount || 0);
                                    setViewTaxesDialog({
                                      isOpen: true,
                                      productName: productItem.product.name,
                                      taxes: productItem.taxesData || [],
                                      productSubtotal: productSubtotal,
                                    });
                                  }
                                }}
                                className="w-full h-9 px-3 bg-[#070B14] border border-gray-700 rounded-lg flex items-center justify-end text-orange-400 text-sm hover:bg-orange-400/10 transition-colors"
                              >
                                <span className="flex items-center gap-1">
                                  {`+${formatCurrency(productItem.taxAmount)}`}
                                  {productItem.tax_ids && productItem.tax_ids.length > 1 && (
                                    <span className="text-xs bg-orange-500/20 px-1.5 py-0.5 rounded-full border border-orange-500/30">
                                      {productItem.tax_ids.length}
                                    </span>
                                  )}
                                </span>
                              </button>
                            ) : (
                              <div className="w-full h-9 px-3 bg-[#070B14] border border-gray-700 rounded-lg flex items-center justify-end text-gray-500 text-sm">
                                $0.00
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Subtotal móvil */}
                      <div className="pt-3 border-t border-gray-800 space-y-2">
                        {!productItem.isDiscount && !(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) && productItem.discountAmount && productItem.discountAmount > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">Subtotal sin desc.:</span>
                            <span className="text-gray-500 line-through">
                              {formatCurrency(productItem.quantity * productItem.unitPrice)}
                            </span>
                          </div>
                        )}
                        {!productItem.isDiscount && !(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) && productItem.discountAmount && productItem.discountAmount > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-yellow-400">Descuento:</span>
                            <span className="text-yellow-400">
                              -{formatCurrency(productItem.discountAmount)}
                            </span>
                          </div>
                        )}
                        {!productItem.isDiscount && !(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) && productItem.taxAmount && productItem.taxAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (productItem.tax_ids && productItem.tax_ids.length > 0) {
                                const productSubtotal = productItem.quantity * productItem.unitPrice - (productItem.discountAmount || 0);
                                setViewTaxesDialog({
                                  isOpen: true,
                                  productName: productItem.product.name,
                                  taxes: productItem.taxesData || [],
                                  productSubtotal: productSubtotal,
                                });
                              }
                            }}
                            className="flex justify-between items-center text-xs w-full hover:bg-orange-400/5 -mx-1 px-1 py-1 rounded transition-colors"
                          >
                            <span className="text-orange-400 flex items-center gap-1">
                              Impuesto:
                              {productItem.tax_ids && productItem.tax_ids.length > 1 && (
                                <span className="text-xs bg-orange-500/20 px-1.5 py-0.5 rounded-full border border-orange-500/30">
                                  {productItem.tax_ids.length}
                                </span>
                              )}
                            </span>
                            <span className="text-orange-400">
                              +{formatCurrency(productItem.taxAmount)}
                            </span>
                          </button>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400 font-medium">
                            Subtotal:
                          </span>
                          <div className={`font-semibold text-base ${
                            productItem.isDiscount ? 'text-red-400' : 
                            (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? 'text-orange-400' : 
                            (productItem.taxAmount && productItem.taxAmount > 0) ? 'text-orange-400' : 
                            'text-white'
                          }`}>
                            {formatCurrency(calculateProductTotal(productItem))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Diseño escritorio (horizontal) */}
                    <div className="hidden md:flex md:items-center md:py-3">
                      {/* Imagen y detalles del producto */}
                      <div className="md:flex-[1.5] flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          productItem.isDiscount ? 'bg-yellow-400/20' : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? 'bg-orange-400/20' : 'bg-gray-900'
                        }`}>
                          {productItem.isDiscount ? (
                            <Tag className="w-6 h-6 text-yellow-400" />
                          ) : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? (
                            <DollarSign className="w-6 h-6 text-orange-400" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-800 rounded"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${
                            productItem.isDiscount ? 'text-yellow-300' : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? 'text-orange-300' : 'text-white'
                          }`}>
                            {productItem.isDiscount 
                              ? (productItem.discountTitle || "Descuento") 
                              : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-'))
                              ? (productItem.taxTitle || "Impuesto")
                              : productItem.product.name}
                          </div>
                          {productItem.isDiscount && productItem.notes && (
                            <p className="text-xs text-yellow-400 mt-0.5">
                              {productItem.notes}
                            </p>
                          )}
                          {(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) && productItem.notes && (
                            <p className="text-xs text-orange-400 mt-0.5">
                              {productItem.notes}
                            </p>
                          )}
                          {!productItem.isDiscount && !(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) && productItem.product.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {productItem.product.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Grupo de columnas numericas con flex - alineado con header */}
                      <div className="md:flex-[2.5]">
                        <div className="flex items-center gap-0">
                          {/* Cantidad - Mostrar 1 para descuentos e impuestos, campo editable para productos */}
                          <div className="flex-1 flex justify-center">
                            {(productItem.isDiscount || (typeof productItem.id === 'string' && productItem.id.startsWith('tax-'))) ? (
                              <div className="w-20 h-10 px-3 bg-[#070B14] border border-gray-700 rounded-lg flex items-center justify-center text-white">
                                1
                              </div>
                            ) : (
                              <div className="relative">
                                <Input
                                  type="number"
                                  min="1"
                                  value={productItem.quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      productItem.id,
                                      Number.parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-20 h-10 px-3 bg-[#070B14] border-gray-700 rounded-lg text-white text-center focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                                    disabled={loading || updatingPrices}
                                />
                                {/* Mostrar alerta de stock faltante solo para artículos, no para servicios */}
                                {productItem.product?.type === 'article' && (() => {
                                  const availableStock = getStockByLocation(
                                    productItem.product,
                                    formData.inventory_location_id
                                  )
                                  if (availableStock === undefined || availableStock === null) return null
                                  const missing = productItem.quantity - availableStock
                                  
                                  if (missing > 0) {
                                    return (
                                      <span className="absolute -bottom-5 left-0 right-0 text-center text-xs text-red-400 font-medium whitespace-nowrap">
                                        {missing} faltante{missing !== 1 ? 's' : ''}
                                      </span>
                                    )
                                  }
                                  return null
                                })()
                            }
                              </div>
                            )}
                          </div>

                          {/* Precio Unitario - Para descuentos e impuestos, mostrar campo de solo lectura */}
                          <div className="flex-1 flex justify-center">
                            <div className="relative w-32">
                              <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                              {productItem.isDiscount ? (
                                <div className="w-full h-10 pl-8 pr-3 bg-[#070B14] border border-gray-700 rounded-lg flex items-center justify-end">
                                  {formatCurrency(Math.abs(productItem.unitPrice))}
                                </div>
                              ) : (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? (
                                <div className="w-full h-10 pl-8 pr-3 bg-[#070B14] border border-gray-700 rounded-lg flex items-center justify-end text-orange-400">
                                  {formatCurrency(Math.abs(productItem.unitPrice))}
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={productItem.unitPrice}
                                  onChange={(e) => {
                                    const price = parseFloat(e.target.value) || 0;
                                    handlePriceChange(productItem.id, price);
                                  }}
                                  className="w-full h-10 pl-8 pr-3 bg-[#070B14] border-gray-700 rounded-lg text-white text-right focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                                  disabled={loading || updatingPrices}
                                />
                              )}
                            </div>
                          </div>

                          {/* Descuento del producto */}
                          <div className="flex-1 flex justify-center">
                            <div className="text-center text-sm">
                              {!productItem.isDiscount && !(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? (
                                productItem.discountAmount && productItem.discountAmount > 0 ? (
                                  <span className="text-green-400">-{formatCurrency(productItem.discountAmount)}</span>
                                ) : (
                                  <span className="text-gray-500">$0.00</span>
                                )
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </div>
                          </div>

                          {/* Impuesto del producto */}
                          <div className="flex-1 flex justify-center">
                            <div className="text-center text-sm">
                              {!productItem.isDiscount && !(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? (
                                productItem.taxAmount && productItem.taxAmount > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (productItem.tax_ids && productItem.tax_ids.length > 0) {
                                        const productSubtotal = productItem.quantity * productItem.unitPrice - (productItem.discountAmount || 0);
                                        setViewTaxesDialog({
                                          isOpen: true,
                                          productName: productItem.product.name,
                                          taxes: productItem.taxesData || [],
                                          productSubtotal: productSubtotal,
                                        });
                                      }
                                    }}
                                    className="group inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 transition-colors"
                                  >
                                    <span>+{formatCurrency(productItem.taxAmount)}</span>
                                    {productItem.tax_ids && productItem.tax_ids.length > 1 && (
                                      <span className="text-xs bg-orange-500/20 px-1.5 py-0.5 rounded-full border border-orange-500/30 group-hover:bg-orange-500/30 transition-colors">
                                        {productItem.tax_ids.length}
                                      </span>
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-gray-500">$0.00</span>
                                )
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="flex-1 flex items-center justify-end">
                            {!productItem.isDiscount && !(typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) && (productItem.discountAmount && productItem.discountAmount > 0) ? (
                              <div className="text-right">
                                <div className="text-xs text-gray-500 line-through">
                                  {formatCurrency(productItem.quantity * productItem.unitPrice)}
                                </div>
                                <div className={`font-semibold text-base ${
                                  (productItem.taxAmount && productItem.taxAmount > 0) ? 'text-orange-400' : 'text-white'
                                }`}>
                                  {formatCurrency(calculateProductTotal(productItem))}
                                </div>
                              </div>
                            ) : (
                              <div className={`font-semibold text-base ${
                                productItem.isDiscount ? 'text-green-400' : 
                                (typeof productItem.id === 'string' && productItem.id.startsWith('tax-')) ? 'text-orange-400' : 
                                (productItem.taxAmount && productItem.taxAmount > 0) ? 'text-orange-400' : 
                                'text-white'
                              }`}>
                                {formatCurrency(calculateProductTotal(productItem))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acciones */}
                      <div className="w-12 flex-shrink-0 flex justify-end">
                        {!productItem.isDiscount && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                disabled={updatingPrices}
                                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleOpenProductDiscount(productItem.id)}
                                className="cursor-pointer"
                              >
                                <Percent className="w-4 h-4 mr-2" />
                                Aplicar descuento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleOpenProductTax(productItem.id)}
                                className="cursor-pointer"
                              >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Aplicar impuesto
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onProductRemove(productItem.id)}
                                className="cursor-pointer text-red-400 focus:text-red-400"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar producto
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {(productItem.isDiscount || (typeof productItem.id === 'string' && productItem.id.startsWith('tax-'))) && (
                          <button
                            type="button"
                            onClick={() => onProductRemove(productItem.id)}
                            disabled={updatingPrices}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>             
              {/* Resumen de totales */}
              <div className="mt-8 pt-6 border-t border-gray-800 space-y-3">
                {hasTaxes && (
                  <div className="flex justify-between items-center text-sm md:text-base">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm md:text-base">
                        Descuento de productos
                      </span>
                    </div>
                    <span className="text-green-300 font-medium">
                      -{formatCurrency(calculateAllProductDiscounts())}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="font-medium text-sm md:text-base">Subtotal</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(calculateProductsGrossSubtotal())}
                  </span>
                </div>               
                {hasTaxes && (
                  <div className="flex justify-between items-center text-sm md:text-base">
                    <div className="flex items-center gap-2">
                      <BanknoteArrowUp className="w-4 h-4 text-orange-300" />
                      <span className="text-orange-300 font-medium text-sm md:text-base">
                        Impuesto aplicado
                      </span>
                    </div>
                    <span className="text-orange-300 font-medium">
                      +{formatCurrency(calculateTaxes())}
                    </span>
                  </div>
                )}  
                {hasTaxes && (
                  <div className="flex justify-between items-center text-sm md:text-base">
                    <div className="flex items-center gap-2">
                      <span className=" font-medium text-sm md:text-base">
                        Nuevo subtotal
                      </span>
                    </div>
                    <span className=" font-medium">
                      {formatCurrency(calculateProductsGrossSubtotalWithProductDiscounts())}
                    </span>
                  </div>
                )}              
                <div className="flex justify-between items-center text-sm md:text-base">
                  {/* Botón de Agregar Descuento - OCULTO si ya hay un descuento */}
                  {!hasDiscount ? (
                    <button
                      type="button"
                      className="text-yellow-400 hover:text-yellow-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                      onClick={() => setShowDiscountModal(true)}
                          disabled={updatingPrices || calculateProductsGrossSubtotalWithProductDiscounts() === 0}
                    >
                      Agregar Descuento
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-green-300" />
                      <span className="text-green-300 font-medium text-sm md:text-base">
                        Descuento General
                      </span>
                    </div>
                  )}                 
                  {calculateDiscountsTotal > 0 && (
                    <span className="text-green-300">
                      -{formatCurrency(calculateDiscountsTotal)}
                    </span>
                  )}
                </div>             
                <div className="flex justify-between items-center text-sm md:text-base">                 
                </div>
                <div className="flex justify-between items-center text-base md:text-lg pt-3 border-t border-gray-800">
                  <span className="font-semibold text-white">Total a pagar</span>
                  <span className="font-bold text-yellow-400 text-lg md:text-xl">
                    {formatCurrency(
                      // Base (subtotal bruto - descuentos por producto) + impuestos por producto + impuesto(s) general(es) - descuento general
                      calculateProductsGrossSubtotal() + calculateProductLevelTaxes() + calculateGeneralTaxes() - calculateGeneralDiscounts()
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 md:px-6 py-8 md:py-12 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
                <Search className="w-6 h-6 md:w-8 md:h-8 text-gray-500" />
              </div>
              <h3 className="text-base font-medium text-white mb-2">
                Sin productos agregados
              </h3>
              <p className="text-sm text-gray-400 max-w-md mx-auto px-4">
                Busca y agrega productos usando el campo de búsqueda arriba para
                comenzar tu cotización.
              </p>

              {/* Mostrar lista de precios seleccionada incluso cuando no hay productos */}
              {formData.selectedPriceList && priceLists.length > 0 && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">
                    Lista:{" "}
                    <span className="text-yellow-300 font-medium">
                      {getSelectedPriceListName()}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nota al Cliente */}
        <div className="mt-8 pt-6 px-6 pb-4 border rounded-lg bg-[#0A0F17] border-gray-800 space-y-2">
          <label className="text-sm font-medium text-gray-300">Nota al Cliente</label>
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Añade detalles importantes para tu cliente..."
            className="bg-[#0A0F17] mt-2 border-gray-700 text-gray-200 placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 min-h-[100px] resize-none"
          />
          <p className="text-xs text-gray-500">
            Esta nota aparecerá en la cotización enviada al cliente.
          </p>
        </div>

        {/* Botones de acción móviles (opcional) */}
        {showMobileButtons && (
          <div className="lg:hidden flex flex-col-reverse gap-4 pt-6">
            <div className="text-sm text-gray-400 text-center">
              {formData.products.filter(p => !p.isDiscount && !(typeof p.id === 'string' && p.id.startsWith('tax-'))).length > 0 ? (
                <span className="text-green-400 font-medium">
                  ✓ {formData.products.filter(p => !p.isDiscount && !(typeof p.id === 'string' && p.id.startsWith('tax-'))).length} producto
                  {formData.products.filter(p => !p.isDiscount && !(typeof p.id === 'string' && p.id.startsWith('tax-'))).length !== 1 ? "s" : ""} listo
                  {formData.products.filter(p => !p.isDiscount && !(typeof p.id === 'string' && p.id.startsWith('tax-'))).length !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="text-yellow-400 font-medium">
                  ⚠ Agrega al menos un producto
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => window.history.back()}
                disabled={loading || updatingPrices}
                className="px-4 py-2 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 text-sm"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={
                  loading || updatingPrices || formData.products.filter(p => !p.isDiscount && !(typeof p.id === 'string' && p.id.startsWith('tax-'))).length === 0
                }
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading || updatingPrices ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    {updatingPrices ? "Actualizando..." : buttonLoadingText}
                  </>
                ) : (
                  buttonText
                )}
              </Button>
            </div>
          </div>
        )}
      </form>

      {/* Modal de descuento - SOLO se muestra si no hay descuento ya agregado */}
      <DiscountModal
        isOpen={showDiscountModal && !hasDiscount}
        onClose={() => setShowDiscountModal(false)}
        onContinue={handleDiscountFromModal}
          currentTotal={calculateProductsGrossSubtotalWithProductDiscounts()}
      />

      {/* Modal de descuento por producto específico */}
      <DiscountModal
        isOpen={productDiscountModal.isOpen}
        onClose={() => setProductDiscountModal({ isOpen: false, productId: null, productName: null, productSubtotal: null, existingDiscountType: undefined, existingDiscountValue: undefined })}
        onContinue={handleApplyProductDiscount}
        currentTotal={calculateProductsGrossSubtotalWithProductDiscounts()}
        productId={productDiscountModal.productId || undefined}
        productName={productDiscountModal.productName || undefined}
        productSubtotal={productDiscountModal.productSubtotal || undefined}
        existingDiscountType={productDiscountModal.existingDiscountType}
        existingDiscountValue={productDiscountModal.existingDiscountValue}
      />

      {/* Modal de impuesto general - SOLO se muestra si no hay impuestos ya agregados */}
      <TaxModal
        isOpen={showTaxModal && !hasTaxes}
        onClose={() => setshowTaxModal(false)}
        onContinue={handleTaxFromModal}
        currentTotal={calculateProductsGrossSubtotalWithProductDiscounts()}
      />

      {/* Modal de impuesto por producto específico */}
      <TaxModal
        isOpen={productTaxModal.isOpen}
        onClose={() => setProductTaxModal({ isOpen: false, productId: null, productName: null, productSubtotal: null, existingTaxType: undefined, existingTaxValue: undefined, existingTaxTitle: undefined, existingTaxId: undefined, existingTaxIds: undefined })}
        onContinue={handleApplyProductTax}
        currentTotal={calculateProductsGrossSubtotalWithProductDiscounts()}
        productId={productTaxModal.productId || undefined}
        productName={productTaxModal.productName || undefined}
        productSubtotal={productTaxModal.productSubtotal || undefined}
        existingTaxType={productTaxModal.existingTaxType}
        existingTaxValue={productTaxModal.existingTaxValue}
        existingTaxTitle={productTaxModal.existingTaxTitle}
        existingTaxId={productTaxModal.existingTaxId}
        existingTaxIds={productTaxModal.existingTaxIds}
      />

      {/* Modal de confirmación para cambio de lista de precios */}
      {showPriceListConfirm && pendingPriceListChange && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0F17] rounded-xl border border-gray-800 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    ¿Cambiar lista de precios?
                  </h3>
                  <p className="text-gray-300 text-sm">
                    Estás a punto de cambiar la lista de precios de{" "}
                    <span className="text-yellow-300 font-medium">
                      {getSelectedPriceListName()}
                    </span>{" "}
                    a{" "}
                    <span className="text-yellow-300 font-medium">
                      {getPendingPriceListName()}
                    </span>
                    .
                  </p>
                  <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                    <p className="text-yellow-300 text-sm font-medium">
                      ⚠ Los precios de los productos en esta cotización se actualizarán.
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Los descuentos no se verán afectados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPriceListConfirm(false);
                    setPendingPriceListChange(null);
                  }}
                  className="flex-1 px-4 py-2 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                  disabled={updatingPrices}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => executePriceListChange(pendingPriceListChange)}
                  disabled={updatingPrices}
                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium disabled:opacity-50"
                >
                  {updatingPrices ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    "Sí, cambiar lista"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para visualizar impuestos del producto (solo lectura) */}
      <ProductTaxesDialog
        isOpen={viewTaxesDialog.isOpen}
        onClose={() => setViewTaxesDialog({ isOpen: false, productName: "", taxes: [], productSubtotal: 0 })}
        productName={viewTaxesDialog.productName}
        taxes={viewTaxesDialog.taxes}
        productSubtotal={viewTaxesDialog.productSubtotal}
      />
    </>
  );
}