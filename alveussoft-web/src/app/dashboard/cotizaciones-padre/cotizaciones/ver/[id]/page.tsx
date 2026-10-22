"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, redirect } from "next/navigation";
import { 
  FileText, User, Building, Calendar, DollarSign, Percent, Tag, 
  MapPin, MessageSquare, Package, Hash, CheckCircle, Clock, 
  Send, XCircle, ExternalLink, Copy, Printer, Mail, Loader2, 
  ArrowLeft, BanknoteArrowUp, 
  ChevronDown, History, Plus, PlusIcon, 
  Edit
} from "lucide-react";

import { getQuotationById, QuotationItem, addQuotationComment, type Quotation } from "@/lib/actions/quotations.actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { QuotationApproveDialog } from "@/components/dashboard/quotation/quotation-approve-dialog";
import { QuotationCancelDialog } from "@/components/dashboard/quotation/quotation-cancel-dialog";
import { pdf } from "@react-pdf/renderer";
import { QuotationPDF } from "@/components/pdf/QuotationPDF";
import { getProductTaxes } from "@/lib/utils/quotationTaxes";
import { getCompanyNamesByIds, getCompanyLogoRecursive } from "@/lib/actions/company.actions";
import { getContactNamesByIds } from "@/lib/actions/contact.actions";
import { getPriceListNamesByIds } from "@/lib/actions/price_list.actions";
import { getUserNamesByIds, getUserById } from "@/lib/actions/user.actions";
import { getLocationNamesByIds } from "@/lib/actions/inventory.actions";

import { 
  PencilIcon,
  ChatBubbleLeftEllipsisIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { ProductTaxesDialog } from "@/components/dashboard/quotation/product-taxes-dialog";
import { QuotationSendDialog } from "@/components/dashboard/quotation/quotation-send-dialog";
export default function QuotationPage() {
  const router = useRouter();
  const params = useParams();
  const quotationId = params?.id as string | undefined;
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [state, setState] = useState({
    quotation: null as Quotation | null,
    loading: false,
    error: null as string | null,
    comment: "",
    addingComment: false,
  });
  const [taxesDialogOpen, setTaxesDialogOpen] = useState(false);
  const [selectedItemTaxes, setSelectedItemTaxes] = useState<{
    productName: string;
    taxes: Array<{
      id: string;
      name: string;
      rate: number;
      tax_type: "percentage" | "fixed_amount";
      description?: string;
    }>;
    productSubtotal: number;
  }>({ productName: "", taxes: [], productSubtotal: 0 });
  const [comment, setComment] = useState<string>("");
  const [addingComment, setAddingComment] = useState(false);

  const statusMap: Record<string, string> = {
  pending: "Pendiente",
  sent: "Enviado",
  accepted: "Aceptado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
  draft: "Borrador"
};

  // Maps para resolver nombres de entidades en el historial
  const [entityNames, setEntityNames] = useState<{
    companies: Map<string, string>;
    contacts: Map<string, string>;
    priceLists: Map<string, string>;
    users: Map<string, string>;
    locations: Map<string, string>;
  }>({
    companies: new Map(),
    contacts: new Map(),
    priceLists: new Map(),
    users: new Map(),
    locations: new Map(),
  });

  // Cargar detalles de la cotización cuando se monta la página o cambia el id
  useEffect(() => {
    if (quotationId) {
      loadQuotationDetails();
    }
  }, [quotationId]);

  const loadQuotationDetails = async () => {
    if (!quotationId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getQuotationById(quotationId);

      if (data) {
        // Crear un nuevo objeto para forzar render
        setQuotation({ ...data, movements: data.movements || [] });
        setState({ ...state, quotation: { ...data, movements: data.movements || [] } });

        // Extraer todos los IDs únicos de los movimientos para resolución de nombres
        const extractIdsFromMovements = (movements: any[]) => {
          const companyIds = new Set<string>();
          const contactIds = new Set<string>();
          const priceListIds = new Set<string>();
          const userIds = new Set<string>();
          const locationIds = new Set<string>();


          movements.forEach((movement) => {
            // Agregar el user_id del movimiento (usuario que realizó la acción)
            if (movement.user_id && typeof movement.user_id === 'string') {
              userIds.add(movement.user_id);
            }

            // Parsear description como JSON si es necesario
            let updatedFields: Record<string, any> = {};
            
            try {
              if (typeof movement.description === 'string') {
                updatedFields = JSON.parse(movement.description);
              } else if (movement.description && typeof movement.description === 'object') {
                updatedFields = movement.description;
              }
            } catch {
              // Si no se puede parsear, intentar desde details
              if (movement.details) {
                if (typeof movement.details === 'string') {
                  try {
                    updatedFields = JSON.parse(movement.details);
                  } catch {}
                } else if (typeof movement.details === 'object') {
                  updatedFields = movement.details;
                }
              }
            }

            // Extraer IDs de campos específicos
            Object.entries(updatedFields).forEach(([key, value]) => {
              // Manejar objetos {old, new}
              const extractId = (val: any) => {
                if (val && typeof val === 'string' && val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                  return val;
                }
                return null;
              };

              let ids: string[] = [];
              if (value && typeof value === 'object') {
                if ('old' in value) {
                  const id = extractId(value.old);
                  if (id) ids.push(id);
                }
                if ('new' in value) {
                  const id = extractId(value.new);
                  if (id) ids.push(id);
                }
                if ('value' in value) {
                  const id = extractId(value.value);
                  if (id) ids.push(id);
                }
              } else {
                const id = extractId(value);
                if (id) ids.push(id);
              }

              // Clasificar por tipo de campo
              ids.forEach((id) => {
                if (key === 'company_id') companyIds.add(id);
                else if (key === 'contact_id') contactIds.add(id);
                else if (key === 'price_list_id') priceListIds.add(id);
                else if (key === 'seller_user_id' || key === 'seller_contact_id') userIds.add(id);
                else if (key === 'inventory_location' || key === 'inventory_location_id' || key === 'location_id') locationIds.add(id);
              });
            });
          });

          return {
            companyIds: Array.from(companyIds),
            contactIds: Array.from(contactIds),
            priceListIds: Array.from(priceListIds),
            userIds: Array.from(userIds),
            locationIds: Array.from(locationIds),
          };
        };

        const { companyIds, contactIds, priceListIds, userIds, locationIds } = extractIdsFromMovements(data.movements || []);

        // Hacer batch fetch de nombres
        const [companies, contacts, priceLists, users, locations] = await Promise.all([
          getCompanyNamesByIds(companyIds),
          getContactNamesByIds(contactIds),
          getPriceListNamesByIds(priceListIds),
          getUserNamesByIds(userIds),
          getLocationNamesByIds(locationIds),
        ]);

        setEntityNames({
          companies,
          contacts,
          priceLists,
          users,
          locations,
        });
      } else {
        setError("No se pudo cargar la cotización");
      }
    } catch (err) {
      console.error("Error cargando detalles de cotización:", err);
      setError("Error al cargar los detalles de la cotización");
    } finally {
      setLoading(false);
    }
  };

  //Función para abrir el diálogo de cancelación
  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  }

  //Función para cerrar diálogo de cancelación
  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
  }

  // Función llamada después de aprobar exitosamente
  const handleCancelSuccess = async () => {
    await loadQuotationDetails();
  };

  // Función para abrir diálogo de aprobación
  const handleApproveClick = () => {
    setApproveDialogOpen(true);
  };

  // Función para cerrar diálogo de aprobación
  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
  };

  // Función llamada después de aprobar exitosamente
  const handleApproveSuccess = async () => {
    // Recargar detalles para mostrar el nuevo estado
    await loadQuotationDetails();
  };

  // Función para abrir diálogo de enviado
  const handleSendClick = () => {
    setSendDialogOpen(true);
  };

  // Función para cerrar diálogo de enviado
  const handleCloseSendDialog = () => {
    setSendDialogOpen(false);
  };

  // Función llamada después de enviar exitosamente
  const handleSendSuccess = async () => {
    // Recargar detalles para mostrar el nuevo estado
    await loadQuotationDetails();
  };

  //Funcion para redirigir a editar
  const handleNavigateToEdit = () => {
    redirect(`/dashboard/cotizaciones-padre/cotizaciones/editar/${quotationId}`);
  }
  
  const handleAddComment = async () => {
    if (!quotation || !comment.trim()) return;

    try {
      setAddingComment(true);
      
      // 1. Guardamos el comentario
      await addQuotationComment(quotation.id, comment.trim());
      
      // 2. Limpiamos el input por cortesía antes de que refresque
      setComment("");
      
      // 3. Forzamos la recarga completa del navegador
      // Esto asegura que el historial se vea actualizado y "limpio"
      window.location.reload(); 

    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el comentario");
    } finally {
      setAddingComment(false);
    }
  };


  // Función para descargar PDF
  const handleDownloadPDF = async () => {
    if (!quotation) return;

    setIsGeneratingPDF(true);
    try {
      // Buscar el logo recursivamente en la jerarquía de empresas
      const companyLogo = quotation.company?.id 
        ? await getCompanyLogoRecursive(quotation.company.id)
        : null;

      // Transformar datos de quotation al formato esperado por QuotationPDF
      const quotationData = {
        quotationNumber: quotation.quotation_number || undefined,
        clientName: quotation.contact?.name || quotation.contact?.full_name || "Cliente",
        clientEmail: quotation.contact?.email || undefined,
        clientPhone: quotation.contact?.phone || undefined,
        validFrom: quotation.created_at,
        validUntil: quotation.valid_until,
        vendor: quotation.seller_user?.full_name || quotation.created_by_user?.full_name || "Vendedor",
        deliveryAddress: quotation.address || undefined,
        notes: quotation.customer_note || undefined,
        status: quotation.status,
        products: [
          // Mapear items regulares de productos
          ...(quotation.items || []).map((item) => ({
            id: item.id,
            product: {
              name: item.product?.name || "Producto",
              description: item.product?.description || undefined,
            },
            quantity: item.quantity,
            unitPrice: item.unit_price,
            discount: item.discount_value || 0,
            notes: item.notes || "",
            // Preserve discount flag if provided by the API
            isDiscount: Boolean((item as any).is_discount ?? (item as any).isDiscount ?? false),
            discountTitle: (item as any).discount_title || (item as any).discountTitle || undefined,
            discountType: item.discount_type || (item as any).discountType || undefined,
            discountValue: item.discount_value || (item as any).discountValue || undefined,
            discountAmount: item.discount_amount || (item as any).discountAmount || undefined,
            // Tax fields: pasar objetos completos para que el helper pueda calcular
            tax: item.tax ? {
              id: item.tax.id,
              name: item.tax.name,
              rate: item.tax.rate,
              tax_type: item.tax.tax_type,
              description: item.tax.description ?? undefined,
            } : undefined,
            tax_id: item.tax_id || undefined,
            product_taxes: (item as any).product_taxes ? (item as any).product_taxes.map((t: any) => ({
              id: t.id,
              name: t.name,
              rate: t.rate,
              tax_type: t.tax_type,
              description: t.description ?? undefined,
            })) : undefined,
            taxTitle: item.tax?.name || undefined,
            taxType: item.tax?.tax_type === 'percentage' ? 'PERCENTAGE' : item.tax?.tax_type === 'fixed_amount' ? 'FIXED' : undefined,
            taxValue: item.tax?.rate || undefined,
            taxAmount: (() => {
              const { totalTaxAmount } = getProductTaxes({
                quantity: item.quantity,
                unitPrice: item.unit_price,
                discountAmount: item.discount_amount || 0,
                product_taxes: (item as any).product_taxes,
                tax: item.tax,
                tax_id: item.tax_id || undefined,
              });
              return totalTaxAmount > 0 ? totalTaxAmount : undefined;
            })(),
            hasTax: Boolean(item.tax_id && item.tax),
          })),
          // Agregar descuento general como item virtual si existe
          ...(quotation.discount_amount && quotation.discount_amount > 0 ? [{
            id: 'discount-general',
            product: {
              name: 'Descuento General',
              description: undefined,
            },
            quantity: 1,
            unitPrice: -Math.abs(quotation.discount_amount),
            discount: 0,
            notes: "",
            isDiscount: true,
            discountTitle: 'Descuento General',
            discountType: quotation.discount_type || 'FIXED',
            discountValue: quotation.discount_value || undefined,
            discountAmount: quotation.discount_amount,
          }] : []),
        ],
        subtotal: calculateSubtotal(),
        discountAmount: quotation.discount_amount || undefined,
        total: quotation.total || 0,
        companyName: quotation.company?.name || undefined,
        companyAddress: quotation.company ? [
          quotation.company.street,
          quotation.company.address_number,
          quotation.company.colony,
          quotation.company.city,
          quotation.company.state,
          quotation.company.zip_code
        ].filter(Boolean).join(", ") || undefined : undefined,
        companyPhone: quotation.company?.phone || quotation.company?.cellphone || undefined,
        companyWebsite: quotation.company?.website || undefined,
        companyLogo: companyLogo || undefined,
      };

      // Generar el PDF
      const blob = await pdf(<QuotationPDF quotationData={quotationData} />).toBlob();

      // Crear enlace y descargar
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotizacion_${quotation.quotation_number || "Nueva"}_${(quotation.contact?.name || quotation.contact?.full_name || "Cliente").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Por favor intenta de nuevo.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day, 12, 0, 0); 
        return format(date, "dd/MM/yyyy", { locale: es });
      }
      
      return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "sent":
        return "Enviada";
      case "accepted":
        return "Aceptada";
      case "cancelled":
        return "Cancelada";
      case "expired":
        return "Expirada";
      case "converted_to_order":
        return "Convertida a Orden";
      default:
        return status;
    }
  };

  // Función para obtener el color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "sent":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "accepted":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "expired":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      case "converted_to_order":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "sent":
        return <Send className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "expired":
        return <Clock className="w-4 h-4" />;
      case "converted_to_order":
        return <ExternalLink className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Función para formatear número de cotización
  const formatQuotationNumber = (number: string | null) => {
    if (!number) return "N/A";
    return `${number.padStart(4, '0')}`;
  };

  // Calcular total de productos
  const calculateItemsTotal = () => {
    if (!quotation?.items) return 0;
    return quotation.items.reduce((sum, item) => sum + (item.item_total || 0), 0);
  };

  // Calcular subtotal
  const calculateSubtotal = () => {
    if (!quotation?.items) return 0;
    return quotation.items.reduce((sum, item) => sum + (item.item_subtotal || 0), 0);
  };

  //Calcular impuestos
  const calculateTaxes = () => {
    if (!quotation?.items) return 0;
    return quotation.items.reduce((sum, item) => {
      const { totalTaxAmount } = getProductTaxes({
        quantity: item.quantity,
        unitPrice: item.unit_price,
        discountAmount: item.discount_amount || 0,
        product_taxes: (item as any).product_taxes,
        tax: item.tax,
        tax_id: item.tax_id || undefined,
      });
      return sum + totalTaxAmount;
    }, 0);
  };

  //Calcular descuentos
  const calculateDiscounts = () => {
    if (!quotation?.items) return 0;
    return quotation.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0);
  };

  // Calcular total final (item_total ya incluye impuestos del servidor)
  const calculateFinalTotal = () => {
    const itemsTotal = calculateItemsTotal(); // Ya incluye impuestos por producto
    const generalDiscount = quotation?.discount_amount || 0;
    return itemsTotal - generalDiscount;
  };

  // Función para truncar texto largo
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const handleRedirect = () => {
    redirect('/dashboard/cotizaciones-padre/cotizaciones')
  }

  // Función para redirigir a factura manual con datos de cotización
  const handleConvertToInvoice = () => {
    if (!quotationId) return;
    router.push(`/dashboard/facturacion/factura-manual?fromQuotation=${quotationId}`);
  }

  // Si no hay id en la ruta, no renderizar
  if (!quotationId) return null;

  return (
    <div>

        <div className="mb-6">
          <button
            onClick={handleRedirect}
            className="inline-flex items-center text-custom-secondary hover:text-custom-accent p-2 hover:bg-custom-accent-hover rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">     

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-custom-primary mb-2">
              Detalles de Cotización
            </h1>
            <p className="text-custom-secondary">
              Ver los detalles de una cotización
            </p>
          </div>

          <div className="relative w-full bg-custom-bg-primary rounded-lg shadow-2xl border-custom-border-secondary max-h-[90vh] flex flex-col">
            
            {loading ? (
              // Estado de carga
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-custom-accent"></div>
              </div>

            ) : error ? (
              // Estado de error
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-red-400" />
                </div>

                <h3 className="text-lg font-medium text-custom-primary mb-2">Error</h3>
                <p className="text-custom-secondary mb-6">{error}</p>

                <button
                  onClick={loadQuotationDetails}
                  className="px-4 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-black font-medium rounded-lg"
                >
                  Reintentar
                </button>
              </div>

            ) : quotation ? (
              // Detalles de la cotización
              <div className="space-y-6 sm:space-y-8">

                {/* Sección 1: Información general */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 ">

                  {/* Información del cliente */}
                  <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
                    <h3 className="text-base sm:text-lg font-semibold text-custom-primary flex items-center gap-2">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-custom-secondary flex-shrink-0" />
                      <span className="truncate">Información del Cliente</span>
                    </h3>

                    <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-3 sm:p-4 space-y-3 flex-1">
                      
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm text-custom-secondary">Cliente</p>
                        <p className="text-custom-primary font-medium break-words">
                          {quotation.contact?.name || quotation.contact?.full_name || "No especificado"}
                        </p>
                      </div>

                      {(quotation.contact?.email || quotation.contact?.phone) && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">

                          {quotation.contact?.email && (
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm text-custom-secondary">Email</p>
                              <p className="text-custom-primary break-words">{quotation.contact.email}</p>
                            </div>
                          )}

                          {quotation.contact?.phone && (
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm text-custom-secondary">Teléfono</p>
                              <p className="text-custom-primary break-words">{quotation.contact.phone}</p>
                            </div>
                          )}

                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información general */}
                  <div className="space-y-3 sm:space-y-4 h-full flex flex-col">
                    <h3 className="text-base sm:text-lg font-semibold text-custom-primary flex items-center gap-2">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5 text-custom-secondary flex-shrink-0" />
                      <span className="truncate">Información General</span>
                    </h3>

                    <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-3 sm:p-4 space-y-2 sm:space-y-3">

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {quotation.company && (
                          <div>
                            <p className="text-xs sm:text-sm text-custom-secondary">Empresa</p>
                            <p className="text-custom-primary font-medium break-words">
                              {quotation.company.name}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs sm:text-sm text-custom-secondary">Cotización</p>
                          <p className="text-custom-primary font-medium break-words">
                            #{quotation.quotation_number}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        
                        <div>
                          <p className="text-xs sm:text-sm text-custom-secondary">Válida desde</p>
                          <div className="flex items-center gap-2 text-custom-primary">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-custom-secondary flex-shrink-0" />
                            <span className="truncate">{formatDate(quotation.valid_from)}</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs sm:text-sm text-custom-secondary">Válida hasta</p>
                          <div className="flex items-center gap-2 text-custom-primary">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-custom-secondary flex-shrink-0" />
                            <span className="truncate">{formatDate(quotation.valid_until)}</span>
                          </div>
                        </div>

                      </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">

                      {quotation.price_list && (
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm text-custom-secondary">Lista de precios</p>
                          <p className="text-custom-primary break-words">
                            {quotation.price_list.name}
                          </p>
                        </div>
                      )}

                      {quotation.status && (
                        <div className="flex flex-col">
                          <p className="text-xs sm:text-sm text-custom-secondary">
                            Estado
                          </p>

                          <div
                            className={`mt-1 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border w-fit ${getStatusColor(
                              quotation.status
                            )}`}
                          >
                            {getStatusIcon(quotation.status)}

                            <span>
                              {statusMap[quotation.status] || quotation.status}
                            </span>

                          </div>
                        </div>
                      )}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Dirección de entrega si existe */}
              {quotation.address && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-custom-primary flex items-center gap-2">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-custom-secondary flex-shrink-0" />
                    <span className="truncate">Dirección de Entrega</span>
                  </h3>
                  <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-3 sm:p-4">
                    <p className="text-custom-primary whitespace-pre-line break-words">
                      {quotation.address}
                    </p>
                  </div>
                </div>
              )}

              {/* Notas del cliente si existen */}
              {quotation.customer_note && (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold text-custom-primary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-custom-secondary flex-shrink-0" />
                    <span className="truncate">Notas del Cliente</span>
                  </h3>
                  <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-3 sm:p-4">
                    <p className="text-custom-primary whitespace-pre-line break-words">
                      {quotation.customer_note}
                    </p>
                  </div>
                </div>
              )}

              {/* Sección 2: Productos */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-custom-primary flex items-center gap-2">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5 text-custom-secondary flex-shrink-0" />
                  <span>Productos ({quotation.items?.length || 0})</span>
                </h3>

                {quotation.items && quotation.items.length > 0 ? (
                  <div>

                    {/* Tabla */}
                    <div className="hidden md:block overflow-x-auto rounded-lg border border-custom-border-secondary">
                      <table className="w-full min-w-[600px]">

                        <thead className="bg-custom-bg-tertiary">
                          <tr>
                            <th className="py-3 px-4 text-left text-sm font-medium text-custom-secondary">Producto</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-custom-secondary">Cantidad</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-custom-secondary">Precio Unitario</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-custom-secondary">Descuento</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-custom-secondary">Impuesto</th>
                            <th className="py-3 px-4 text-right text-sm font-medium text-custom-secondary">Subtotal</th>
                            {quotation.items.some(item => item.notes) && (
                              <th className="py-3 px-4 text-left text-sm font-medium text-custom-secondary">Notas</th>
                            )}
                          </tr>
                        </thead>

                        <tbody className="divide-y border-custom-border-secondary">
                          {quotation.items.map((item) => (
                            <tr key={item.id} className="hover:bg-custom-bg-hover">

                              <td className="py-3 px-4">
                                <div className="min-w-0">
                                  <p className="text-custom-primary font-medium break-words">
                                    {item.product?.name || "Producto no encontrado"}
                                  </p>
                                  {item.product?.description && (
                                    <p className="text-sm text-custom-secondary mt-1 break-words">
                                      {item.product.description}
                                    </p>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <span className="text-custom-primary whitespace-nowrap">
                                  {item.quantity}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                <p className="text-custom-primary whitespace-nowrap">
                                  {formatCurrency(item.unit_price)}
                                </p>
                              </td>

                              <td className="py-3 px-4 text-right">
                                {item.discount_amount && item.discount_amount > 0 ? (
                                  <p className="text-green-400 whitespace-nowrap">
                                    {item.discount_type === 'PERCENTAGE'
                                      ? `-${formatCurrency(item.discount_amount)} (${Number(item.discount_value).toFixed(2)}%)`
                                      : `-${formatCurrency(item.discount_amount)}`}
                                  </p>
                                ) : (
                                  <span className="text-custom-muted">-</span>
                                )}
                              </td>

                              {/* Impuestos */}
                              <td className="py-3 px-4 text-right">
                                {(() => {
                                  const itemSubtotal = item.quantity * item.unit_price;
                                  const itemDiscountAmount = item.discount_amount || 0;
                                  const taxableBase = itemSubtotal - itemDiscountAmount;

                                  const taxes = item.product_taxes && item.product_taxes.length > 0
                                    ? item.product_taxes
                                    : (item.tax_id && item.tax ? [item.tax] : []);

                                  if (taxes.length === 0) {
                                    return <span className="text-custom-muted">-</span>;
                                  }

                                  const totalTaxAmount = taxes.reduce((sum, tax) => {
                                    if (tax.tax_type === 'percentage') {
                                      return sum + (taxableBase * tax.rate) / 100;
                                    }
                                    return sum + tax.rate;
                                  }, 0);

                                  return (
                                    <div className="flex flex-col gap-1 items-end">
                                      <button
                                        onClick={() => {
                                          setSelectedItemTaxes({
                                            productName: item.product?.name || "Producto",
                                            taxes: taxes.map(tax => ({
                                              id: tax.id,
                                              name: tax.name,
                                              rate: tax.rate,
                                              tax_type: tax.tax_type,
                                              description: tax.description ?? undefined
                                            })),
                                            productSubtotal: taxableBase
                                          });
                                          setTaxesDialogOpen(true);
                                        }}
                                        className="text-orange-400 hover:text-orange-300 hover:underline whitespace-nowrap cursor-pointer transition-colors text-right"
                                        title="Click para ver detalles"
                                      >
                                        {taxes.length > 1
                                          ? `${taxes.length} impuestos (+${formatCurrency(totalTaxAmount)})`
                                          : `+${formatCurrency(totalTaxAmount)}`
                                        }
                                      </button>
                                      <span className="text-xs text-custom-muted">
                                        Click para detalles
                                      </span>
                                    </div>
                                  );
                                })()}
                              </td>

                              {/* Subtotal */}
                              <td className="py-3 px-4 text-right">
                                {item.discount_amount && item.discount_amount > 0 ? (
                                  <div>
                                    <p className="text-xs text-custom-muted line-through whitespace-nowrap">
                                      {formatCurrency(item.quantity * item.unit_price)}
                                    </p>
                                    <p className="font-medium whitespace-nowrap text-custom-primary">
                                      {formatCurrency(item.item_total || item.quantity * item.unit_price)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="font-medium whitespace-nowrap text-custom-primary">
                                    {formatCurrency(item.item_total || item.quantity * item.unit_price)}
                                  </p>
                                )}
                              </td>

                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>

                      {/* Versión móvil - Tarjetas */}
                      <div className="md:hidden space-y-3">
                        {quotation.items.map((item) => (
                          <div 
                            key={item.id} 
                            className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 space-y-3"
                          >

                            {/* Producto */}
                            <div>
                              <p className="text-sm text-custom-secondary mb-1">Producto</p>
                              <p className="text-custom-primary font-medium break-words">
                                {item.product?.name || "Producto no encontrado"}
                              </p>
                              {item.product?.description && (
                                <p className="text-sm text-custom-secondary mt-1 break-words">
                                  {item.product.description}
                                </p>
                              )}
                            </div>

                            {/* Detalles en grid para móvil */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-sm text-custom-secondary mb-1">Cantidad</p>
                                <p className="text-custom-primary">{item.quantity}</p>
                              </div>

                              <div>
                                <p className="text-sm text-custom-secondary mb-1">Precio Unitario</p>
                                <p className="text-custom-primary">
                                  {formatCurrency(item.unit_price)}
                                </p>
                              </div>

                              {item.discount_amount && item.discount_amount > 0 && (
                                <div className="col-span-2">
                                  <p className="text-sm text-custom-secondary mb-1">Descuento</p>
                                  <p className="text-green-400 font-medium">
                                    {item.discount_type === 'PERCENTAGE'
                                      ? `-${formatCurrency(item.discount_amount)} (${Number(item.discount_value).toFixed(2)}%)`
                                      : `-${formatCurrency(item.discount_amount)}`}
                                  </p>
                                </div>
                              )}

                              <div className="col-span-2">
                                <p className="text-sm text-custom-secondary mb-1">Subtotal</p>

                                {item.discount_amount && item.discount_amount > 0 ? (
                                  <div>
                                    <p className="text-xs text-custom-muted line-through">
                                      {formatCurrency(item.quantity * item.unit_price)}
                                    </p>
                                    <p className="font-medium whitespace-nowrap text-custom-primary">
                                      {formatCurrency(item.item_total || item.quantity * item.unit_price)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="font-medium whitespace-nowrap text-custom-primary">
                                    {formatCurrency(item.item_total || item.quantity * item.unit_price)}
                                  </p>
                                )}

                                {/* Mostrar impuesto en móvil */}
                                <div className="mt-2">
                                  <p className="text-sm text-custom-secondary mb-1">Impuesto</p>
                                  {(() => {
                                    const itemSubtotal = item.quantity * item.unit_price;
                                    const itemDiscountAmount = item.discount_amount || 0;
                                    const taxableBase = itemSubtotal - itemDiscountAmount;
                                    
                                    // Soportar múltiples impuestos (product_taxes) o impuesto único (tax)
                                    const taxes = item.product_taxes && item.product_taxes.length > 0
                                      ? item.product_taxes
                                      : (item.tax_id && item.tax ? [item.tax] : []);
                                    
                                    if (taxes.length === 0) {
                                      return <span className="text-custom-muted">-</span>;
                                    }
                                    
                                    const totalTaxAmount = taxes.reduce((sum, tax) => {
                                      if (tax.tax_type === 'percentage') {
                                        return sum + (taxableBase * tax.rate) / 100;
                                      }
                                      return sum + tax.rate;
                                    }, 0);
                                    
                                    return (
                                      <div>
                                        <button
                                          onClick={() => {
                                            setSelectedItemTaxes({
                                              productName: item.product?.name || "Producto",
                                              taxes: taxes.map(tax => ({
                                                id: tax.id,
                                                name: tax.name,
                                                rate: tax.rate,
                                                tax_type: tax.tax_type,
                                                description: tax.description ?? undefined
                                              })),
                                              productSubtotal: taxableBase
                                            });
                                            setTaxesDialogOpen(true);
                                          }}
                                          className="text-orange-400 hover:text-orange-300 hover:underline font-medium cursor-pointer transition-colors"
                                        >
                                          {taxes.length > 1
                                            ? `${taxes.length} impuestos (+${formatCurrency(totalTaxAmount)})`
                                            : `+${formatCurrency(totalTaxAmount)}`
                                          }
                                        </button>
                                        <p className="text-xs text-custom-muted mt-1">Toca para ver detalles</p>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Notas si existen */}
                            {item.notes && (
                              <div>
                                <p className="text-sm text-custom-secondary mb-1">Notas</p>
                                <p className="text-sm text-custom-secondary break-words">{item.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 sm:p-8 text-center">
                      <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-custom-disabled" />
                      <p className="text-custom-secondary">No hay productos en esta cotización</p>
                    </div>
                  )}
                </div>

                {/* Sección 3: Resumen y totales */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Descuentos si existen */}
                  {(quotation.discount_type || quotation.discount_amount) && (
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-custom-primary flex items-center gap-2">
                        <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-custom-accent flex-shrink-0" />
                        <span className="truncate">Descuentos</span>
                      </h3>
                      <div className="bg-custom-bg-secondary rounded-lg border border-custom-accent p-3 sm:p-4 space-y-2 sm:space-y-3">
                        {quotation.discount_type && (
                          <div>
                            <p className="text-xs sm:text-sm text-custom-secondary">Tipo de descuento</p>
                            <p className="text-custom-primary font-medium">
                              {quotation.discount_type === 'PERCENTAGE' ? 'Porcentaje' : 'Monto fijo'}
                            </p>
                          </div>
                        )}
                        {quotation.discount_value && (
                          <div>
                            <p className="text-xs sm:text-sm text-custom-secondary">Valor del descuento</p>
                            <p className="text-custom-primary font-medium">
                              {quotation.discount_type === 'PERCENTAGE' 
                                ? `${Number(quotation.discount_value).toFixed(2)}%`
                                : formatCurrency(quotation.discount_value)
                              }
                            </p>
                          </div>
                        )}

                        {quotation.discount_amount && (
                          <div>
                            <p className="text-xs sm:text-sm text-custom-secondary">Monto de descuento</p>
                            <p className="font-medium text-red-400">
                              -{formatCurrency(quotation.discount_amount)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Totales */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-base sm:text-lg font-semibold text-custom-primary flex items-center gap-2">
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-custom-secondary flex-shrink-0" />
                      <span className="truncate">Resumen de Totales</span>
                    </h3>

                    <div className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] rounded-lg border border-custom-primary p-4 sm:p-6 space-y-3 sm:space-y-4">

                      <div className="flex justify-between items-center">
                        <span className="text-custom-secondary text-sm sm:text-base">
                          Subtotal
                        </span>
                        <span className="text-custom-primary font-medium text-sm sm:text-base">
                          {formatCurrency(calculateSubtotal())}
                        </span>
                      </div>

                      {/* {calculateDiscounts() > 0 && (
                        <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-gray-700">
                          <span className="text-green-300 text-sm sm:text-base flex items-center gap-2">
                            <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                            Descuentos por producto
                          </span>
                          <span className="text-green-300 font-medium text-sm sm:text-base">
                            -{formatCurrency(calculateDiscounts())}
                          </span>
                        </div>
                      )} */}
                      
                      {quotation.discount_amount && quotation.discount_amount > 0 && (
                        <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-custom-primary">
                          <span className="text-green-300 text-sm sm:text-base flex items-center gap-2">
                            <Tag className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                            Descuento
                          </span>
                          <span className="text-green-300 font-medium text-sm sm:text-base">
                            -{formatCurrency(quotation.discount_amount)}
                          </span>
                        </div>
                      )}

                      {calculateTaxes() > 0 && (
                        <div className="flex justify-between items-center pt-2 sm:pt-3 border-t border-custom-primary">
                          <span className="text-orange-300 text-sm sm:text-base flex items-center gap-2">
                            <BanknoteArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-orange-300" />
                            Impuestos
                          </span>
                          <span className="text-orange-300 font-medium text-sm sm:text-base">
                            +{formatCurrency(calculateTaxes())}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-3 sm:pt-4 border-t border-custom-primary">
                        <span className="text-lg sm:text-xl font-bold text-custom-primary">
                          Total
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-custom-accent">
                          {formatCurrency(calculateFinalTotal())}
                        </span>
                      </div>

                      {/* Info adicional */}
                      {(quotation.created_by_user || quotation.seller_user) && (
                        <div className="pt-3 sm:pt-4 border-t border-custom-primary space-y-2">
                          {quotation.created_by_user && (
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-custom-secondary">Creado por</span>
                              <span className="text-custom-secondary break-words text-right">
                                {quotation.created_by_user.full_name}
                              </span>
                            </div>
                          )}
                          {quotation.seller_user && (
                            <div className="flex justify-between items-center text-xs sm:text-sm">
                              <span className="text-custom-secondary">Vendedor asignado</span>
                              <span className="text-custom-secondary break-words text-right">
                                {quotation.seller_user.full_name}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Sin datos
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-custom-bg-hover flex items-center justify-center">
                  <FileText className="w-8 h-8 text-custom-disabled" />
                </div>

                <h3 className="text-lg font-medium text-custom-primary mb-2">
                  Sin datos
                </h3>

                <p className="text-custom-secondary">
                  No se encontró información de la cotización
                </p>
              </div>
            )}

          {/* Footer del modal con acciones */}
          {quotation && !loading && !error && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-custom-border-secondary gap-3 flex-shrink-0">

              <div className="text-xs sm:text-sm text-custom-secondary">
                Última actualización: {quotation.updated_at ? formatDate(quotation.updated_at) : "N/A"}
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-end">
                {/* Botón para aprobar (solo si está enviado) */}
                {quotation.status === "sent" && (
                  <button
                    onClick={handleApproveClick}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Aprobar</span>
                  </button>
                )}

                {/* Botón para convertir en factura (solo si está aprobado) */}
                {quotation.status === "accepted" && (
                  <button
                    onClick={handleConvertToInvoice}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm"
                  >
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Convertir en Factura</span>
                  </button>
                )}

                {/* Botón para enviar (solo si está pendiente) */}
                {quotation.status === "pending" && (
                  <button
                    onClick={handleSendClick}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                    title="Enviar cotización"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                )}

                {/* Botón para cancelar (solo si está pendiente) */}
                {(quotation.status === "pending" || quotation.status === "sent" || quotation.status === "accepted" ) && (
                  <button
                    onClick={handleCancelClick}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
                    title="Cancelar cotización"
                  >
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Cancelar</span>
                  </button>
                )}

                {/* Botón para editar (solo si está pendiente) */}
                {(quotation.status === "pending" || quotation.status === "sent") && (
                  <button
                    onClick={handleNavigateToEdit}
                    className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-black font-medium rounded-lg transition-colors text-sm"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                )}

                {/* Botón para imprimir/exportar PDF */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF}
                  className="inline-flex items-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-custom-bg-tertiary hover:bg-custom-bg-hover text-custom-secondary font-medium rounded-lg border border-custom-primary transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Printer className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {isGeneratingPDF ? "Generando..." : "Exportar"}
                  </span>
                </button>
                
                {/* Botón para cerrar */}
                {/* <button
                  onClick={() => router.back()}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-custom-bg-tertiary hover:bg-gray-700 text-custom-text-secondary font-medium rounded-lg border border-custom-border-secondary transition-colors text-sm"
                >
                  Cerrar
                </button> */}
              </div>
            </div>
          )}
          {/* 🔹 Contenedor Principal de Historial y Notas */}
          {Array.isArray(quotation?.movements) && quotation.movements.length > 0 && (() => {
            // 1. Lógica de procesamiento de datos: Limpieza de duplicados y Orden Cronológico
            const uniqueMovements = Array.from(
              new Map(quotation.movements.map((m) => [m.id, m])).values()
            );

            const sortedMovements = uniqueMovements.sort((a, b) => {
              const dateA = a?.movement_date ? new Date(a.movement_date).getTime() : 0;
              const dateB = b?.movement_date ? new Date(b.movement_date).getTime() : 0;
              return dateB - dateA;
            });

            // 2. Definición de estilos y etiquetas en Español
            const getMovementStyle = (type: string) => {
              const t = type.toLowerCase();
              switch (t) {
                case "edition":
                case "edición de cotización":
                  return { 
                    label: "Edición", 
                    icon: PencilIcon, 
                    bg: "bg-blue-800", 
                    text: "text-blue-400", 
                    badge: "bg-blue-900 text-blue-300 ring-blue-600/20" 
                  };

                case "comment":
                case "admin_comment":
                case "comentario":
                  return { 
                    label: "Comentario", 
                    icon: ChatBubbleLeftEllipsisIcon, 
                    bg: "bg-green-800", 
                    text: "text-green-400", 
                    badge: "bg-green-900 text-green-300 ring-green-600/20" 
                  };

                case "creation":
                case "cotización registrada":
                  return { 
                    label: "Creación", 
                    icon: DocumentTextIcon, 
                    bg: "bg-custom-bg-tertiary", 
                    text: "text-custom-secondary", 
                    badge: "bg-custom-bg-secondary text-custom-secondary ring-[var(--color-border-secondary)]" 
                  };

                default:
                  return { 
                    label: "Movimiento", 
                    icon: ClockIcon, 
                    bg: "bg-custom-bg-tertiary", 
                    text: "text-custom-secondary", 
                    badge: "bg-custom-bg-tertiary text-custom-secondary ring-[var(--color-border-secondary)]" 
                  };
              }
            };
            
            // Resolver nombre de usuario por id usando el Map `entityNames.users`
            const getUserNameById = (id?: string | null) => {
              if (!id) return "N/A";
              return entityNames.users.get(id);
            }

            const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
            const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

            return (
              <div className="mt-8 space-y-4">
                
                {/* 1. SECCIÓN DE COMENTARIOS (NUEVA NOTA) */}
                <details open className="group bg-custom-bg-secondary border border-custom-primary rounded-2xl overflow-hidden shadow-sm">

                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-custom-bg-hover transition-colors">
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600/10 rounded-lg">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                      </div>

                      <h3 className="text-lg font-bold text-custom-primary">
                        Notas Administrativas
                      </h3>
                    </div>

                    <ChevronDown className="w-5 h-5 text-custom-muted group-open:rotate-180 transition-transform" />
                  </summary>

                  <div className="px-6 pb-6 pt-2 border-t border-custom-secondary">

                    <div className="mt-4 rounded-xl border border-dashed border-custom-primary bg-custom-bg-hover p-4">
                      
                      <label className="text-xs font-semibold text-custom-secondary mb-2 block uppercase tracking-wider">
                        Nuevo Comentario Interno
                      </label>

                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Escribe un comentario administrativo..."
                        className="w-full rounded-lg border border-custom-primary bg-custom-bg-secondary px-3 py-2 text-sm text-custom-primary focus:ring-2 focus:ring-blue-500 resize-none outline-none"
                        rows={3}
                      />

                      <div className="flex justify-end mt-3">
                        <button
                          onClick={handleAddComment}
                          disabled={addingComment || !comment.trim()}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-all active:scale-95"
                        >
                          {addingComment ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Guardando...
                            </>
                          ) : (
                            <>
                              <PlusIcon className="w-4 h-4" />
                              Agregar Nota
                            </>
                          )}
                        </button>
                      </div>

                    </div>
                  </div>
                </details>

                {/* 2. SECCIÓN DE HISTORIAL DE MOVIMIENTOS */}
                <details className="group bg-custom-bg-secondary border border-custom-primary rounded-2xl overflow-hidden shadow-sm" open>

                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none hover:bg-custom-bg-hover transition-colors">
                    
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-600/10 rounded-lg">
                        <History className="w-5 h-5 text-purple-500" />
                      </div>

                      <h3 className="text-lg font-bold text-custom-primary">
                        Historial de Movimientos
                      </h3>
                    </div>

                    <ChevronDown className="w-5 h-5 text-custom-muted group-open:rotate-180 transition-transform" />
                  </summary>

                  <div className="px-6 pb-6 pt-2 border-t border-custom-secondary">

                    <div className="relative ml-4 mt-6">

                      {/* Línea vertical */}
                      <div className="absolute left-0 top-0 bottom-0 w-px bg-custom-border-primary" />

                      <div className="space-y-6">
                        {sortedMovements.map((movement, index) => {
                          const style = getMovementStyle(movement.type);
                          const Icon = style.icon;
                          const isLast = index === sortedMovements.length - 1;
                          
                          // Detectamos si es un comentario para ajustar la visualización
                          const isCommentType = movement.type.toLowerCase().includes("comment") || movement.type.toLowerCase().includes("comentario");                         

                          // Detectamos si es una edición
                          const isEditType = movement.type.toLowerCase().includes("edition") || movement.type.toLowerCase().includes("edición");

                          // Detectamos si es un cambio de estado
                          const isStatusType = movement.type.toLowerCase().includes("status") || movement.type.toLowerCase().includes("estado");

                          // Parseo de detalles (JSON)
                          let details: any = {};
                          if (typeof movement.details === "string") {
                            try { details = JSON.parse(movement.details); } catch { details = {} }
                          } else {
                            details = movement.details || {};
                          }
                          
                          // Parseo de campos modificados (para ediciones)
                          // Puede estar en details, description, o en details.changes
                          let updatedFields: Record<string, any> = {};
                          if (isEditType) {
                            // Intentar parsear de múltiples fuentes
                            // 1. Intentar desde details.changes
                            if (details?.changes && typeof details.changes === "object") {
                              updatedFields = details.changes;
                            }
                            // 2. Intentar desde details directamente (excluyendo 'note')
                            else if (details && Object.keys(details).length > 0) {
                              const { note, ...otherFields } = details;
                              if (Object.keys(otherFields).length > 0) {
                                updatedFields = otherFields;
                              }
                            }
                            // 3. Intentar desde description como JSON
                            if (Object.keys(updatedFields).length === 0 && movement.description) {
                              try {
                                const parsed = typeof movement.description === "string" 
                                  ? JSON.parse(movement.description) 
                                  : movement.description;
                                if (parsed && typeof parsed === "object") {
                                  updatedFields = parsed;
                                }
                              } catch {
                                // No es JSON, ignorar
                              }
                            }
                          }
                          
                          // Helper para formatear campos modificados
                          const getFieldDisplay = (key: string, value: any) => {
                            const fieldLabels: Record<string, { label: string; icon: any }> = {
                              total: { label: "Total", icon: DollarSign },
                              subtotal: { label: "Subtotal", icon: DollarSign },
                              discount_amount: { label: "Descuento", icon: Tag },
                              discount_value: { label: "Valor de descuento", icon: Percent },
                              discount_type: { label: "Tipo de descuento", icon: Tag },
                              valid_until: { label: "Válida hasta", icon: Calendar },
                              valid_from: { label: "Válida desde", icon: Calendar },
                              validity: { label: "Período de validez", icon: Calendar },
                              created_at: { label: "Fecha de creación", icon: Calendar },
                              updated_at: { label: "Última actualización", icon: Clock },
                              status: { label: "Estado", icon: CheckCircle },
                              address: { label: "Dirección", icon: MapPin },
                              customer_note: { label: "Notas", icon: MessageSquare },
                              notes: { label: "Notas", icon: MessageSquare },
                              contact_id: { label: "Cliente", icon: User },
                              seller_user_id: { label: "Vendedor", icon: User },
                              seller_contact_id: { label: "Contacto vendedor", icon: User },
                              company_id: { label: "Empresa", icon: Building },
                              price_list_id: { label: "Lista de precios", icon: Tag },
                              inventory_location: { label: "Ubicación inventario", icon: MapPin },
                              inventory_location_id: { label: "Ubicación inventario", icon: MapPin },
                              location_id: { label: "Ubicación inventario", icon: MapPin },
                              quotation_number: { label: "No. Cotización", icon: Hash },
                            };
                            
                            const field = fieldLabels[key] || { label: key, icon: FileText };
                            const FieldIcon = field.icon;
                            
                            // Función para resolver IDs de llaves foráneas a nombres usando los Maps precargados
                            const resolveForeignKey = (fieldKey: string, id: any): string | null => {
                              if (!id || typeof id !== 'string') return null;
                              
                              // Buscar en los Maps según el tipo de campo
                              switch (fieldKey) {
                                case 'company_id':
                                  return entityNames.companies.get(id) || null;
                                case 'contact_id':
                                  return entityNames.contacts.get(id) || null;
                                case 'seller_user_id':
                                case 'seller_contact_id':
                                  return entityNames.users.get(id) || null;
                                case 'price_list_id':
                                  return entityNames.priceLists.get(id) || null;
                                case 'inventory_location':
                                case 'inventory_location_id':
                                case 'location_id':
                                  return entityNames.locations.get(id) || null;
                                default:
                                  return null;
                              }
                            };
                            
                            // Función auxiliar para formatear valores
                            const formatValue = (val: any, fieldKey: string, isCurrentValue: boolean = true): string => {
                              if (val === null || val === undefined) return '-';
                              
                              // Intentar resolver llave foránea primero
                              const resolvedName = resolveForeignKey(fieldKey, val);
                              if (resolvedName) return resolvedName;
                              
                              // Si es un ID de llave foránea pero no se pudo resolver, mostrar formato amigable
                              const isForeignKeyField = ['company_id', 'contact_id', 'seller_user_id', 'seller_contact_id', 'price_list_id', 'inventory_location', 'inventory_location_id', 'location_id'].includes(fieldKey);
                              if (isForeignKeyField && typeof val === 'string') {
                                // Si no se encontró en los Maps, mostrar los primeros caracteres del ID
                                return `ID: ${val.substring(0, 8)}...`;
                              }
                              
                              // Formatear según tipo
                              if (typeof val === "number" && (fieldKey.includes("total") || fieldKey.includes("amount") || fieldKey.includes("price"))) {
                                return formatCurrency(val);
                              }
                              // Formatear fechas, pero no campos que terminen en _id (como inventory_location_id)
                              if (typeof val === "string" && !fieldKey.endsWith("_id") && (fieldKey.includes("date") || fieldKey.includes("at") || fieldKey.includes("from") || fieldKey.includes("until"))) {
                                try {
                                  return formatDate(val);
                                } catch {
                                  return val;
                                }
                              }
                              if (fieldKey === "discount_type") {
                                return val === "PERCENTAGE" ? "Porcentaje" : "Monto fijo";
                              }
                              if (fieldKey === "status") {
                                return getStatusText(val);
                              }
                              
                              return String(val);
                            };
                            
                            // Manejar caso especial: validity (objeto con fechas)
                            if (key === 'validity' && value && typeof value === 'object') {
                              const hasOldNew = 'old_from' in value || 'new_from' in value;
                              
                              if (hasOldNew) {
                                const oldPeriod = value.old_from && value.old_until 
                                  ? `${formatValue(value.old_from, 'valid_from', false)} - ${formatValue(value.old_until, 'valid_until', false)}`
                                  : null;
                                const newPeriod = value.new_from && value.new_until
                                  ? `${formatValue(value.new_from, 'valid_from', true)} - ${formatValue(value.new_until, 'valid_until', true)}`
                                  : null;
                                
                                return {
                                  label: field.label,
                                  icon: FieldIcon,
                                  value: newPeriod || '-',
                                  oldValue: oldPeriod,
                                  showChange: !!(oldPeriod && newPeriod)
                                };
                              }
                            }
                            
                            // Extraer valor real si es un objeto {old, new} o {value}
                            let actualValue = value;
                            let oldActualValue = null;
                            let hasChange = false;
                            
                            if (value && typeof value === "object") {
                              if ('new' in value) {
                                actualValue = value.new;
                                if ('old' in value) {
                                  oldActualValue = value.old;
                                  hasChange = true;
                                }
                              } else if ('value' in value) {
                                actualValue = value.value;
                              } else if ('old' in value && !('new' in value)) {
                                actualValue = value.old;
                              }
                            }
                            
                            // Formatear valores usando la función auxiliar
                            // El nuevo valor es el actual (true), el viejo no (false)
                            const formattedValue = formatValue(actualValue, key, true);
                            const oldFormatted = hasChange && oldActualValue !== null ? formatValue(oldActualValue, key, false) : null;
                            
                            return { 
                              label: field.label, 
                              icon: FieldIcon, 
                              value: formattedValue, 
                              oldValue: oldFormatted, 
                              showChange: hasChange && oldFormatted !== null 
                            };
                          };

                          return (
                            <div key={movement.id} className="relative pl-9 group">
                              {/* Indicador circular en la línea */}
                              <div className="absolute left-0 top-1 -translate-x-1/2 z-10">
                                <div className={`w-8 h-8 rounded-full ${style.bg} ring-4 ring-[var(--color-bg-secondary)] flex items-center justify-center transition-transform group-hover:scale-110`}>
                                  <Icon className={`w-4 h-4 ${style.text}`} />
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${style.text}`}>
                                      {style.label}
                                    </span>
                                    <span className={`px-2 py-0.5 text-[9px] rounded-full border ${style.badge}`}>
                                      {movement.type.toLowerCase().includes("venta") ? "Venta" : "Evento"}
                                    </span>

                               <span className="text-[10px] text-custom-secondary">
                                {movement.contact?.full_name
                                  ? `Contacto: ${movement.contact.full_name}`
                                  : movement.user?.full_name
                                  ? `Usuario: ${movement.user.full_name}`
                                  : ""}
                              </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-bold text-custom-secondary">{formatDate(movement.movement_date)}</p>
                                    <p className="text-[9px] text-custom-muted">{formatTime(movement.movement_date)}</p>
                                  </div>
                                </div>

                                {/* Caja de contenido del movimiento */}
                                <div className="bg-custom-bg-hover rounded-xl p-3 border border-custom-primary group-hover:border-custom-border-secondary transition-colors">
                                  
                                  {/* 🔹 Solo mostramos la descripción si NO es un comentario Y NO es edición con campos Y NO es cambio de estado */}
                                  {!isCommentType && !(isEditType && Object.keys(updatedFields).length > 0) && !isStatusType && (
                                    <p className="text-xs text-custom-secondary leading-relaxed">{movement.description}</p>
                                  )}

                                  {isStatusType && (() => {
                                    // Buscar status en múltiples ubicaciones posibles
                                    let oldStatus: any = null;
                                    let newStatus: any = null;

                                    // 1. Buscar en details.status o details.status_change
                                    const statusFromDetails = details?.status ?? details?.status_change ?? null;
                                    if (statusFromDetails && typeof statusFromDetails === 'object') {
                                      oldStatus = statusFromDetails.old ?? statusFromDetails.old_status ?? statusFromDetails.previous ?? null;
                                      newStatus = statusFromDetails.new ?? statusFromDetails.new_status ?? statusFromDetails.current ?? statusFromDetails.value ?? null;
                                    }

                                    // 2. Buscar directamente en details.old_status / details.new_status
                                    if (!oldStatus && details?.old_status) oldStatus = details.old_status;
                                    if (!newStatus && details?.new_status) newStatus = details.new_status;

                                    // 3. Intentar extraer de description como JSON
                                    if (!oldStatus && !newStatus && movement.description) {
                                      try {
                                        const parsed = typeof movement.description === "string" 
                                          ? JSON.parse(movement.description) 
                                          : movement.description;
                                        if (parsed && typeof parsed === "object") {
                                          oldStatus = parsed.old_status ?? parsed.old ?? parsed.previous ?? null;
                                          newStatus = parsed.new_status ?? parsed.new ?? parsed.current ?? parsed.status ?? null;
                                        }
                                      } catch {
                                        // description no es JSON, intentar extraer con regex como último recurso
                                        const match = movement.description.match(/(?:de|from)\s*['":]?\s*(\w+)\s*(?:a|to)\s*['":]?\s*(\w+)/i);
                                        if (match) {
                                          oldStatus = match[1];
                                          newStatus = match[2];
                                        }
                                      }
                                    }

                                    const formattedOldStatus = getStatusText(oldStatus);
                                    const formattedNewStatus = getStatusText(newStatus);
                                    
                                    if (oldStatus || newStatus) {
                                      return (
                                        <p className="text-xs text-custom-secondary leading-relaxed">
                                          Estado cambiado de: <span className="font-semibold">{formattedOldStatus}</span> a <span className="font-semibold text-custom-accent">{formattedNewStatus}</span>
                                        </p>
                                      );
                                    }
                                    
                                    // Si no se encontró estructura de datos, mostrar description como fallback
                                    return movement.description ? (
                                      <p className="text-xs text-custom-secondary leading-relaxed">{movement.description}</p>
                                    ) : null;
                                  })()}
                                  {/* 🔹 Campos modificados (para ediciones) */}
                                  {isEditType && Object.keys(updatedFields).length > 0 && (
                                    <div className="space-y-2">

                                      <p className="text-[10px] font-semibold text-custom-secondary uppercase tracking-wider">
                                        Campos actualizados:
                                      </p>

                                      <div className="space-y-1.5 pl-3 border-l-2 border-blue-500/30">
                                        
                                        {Object.entries(updatedFields).map(([key, value]) => {
                                          const { label, icon: FieldIcon, value: formattedValue, oldValue, showChange } = getFieldDisplay(key, value);

                                          return (
                                            <div key={key} className="flex items-start gap-2">

                                              <FieldIcon className="w-3.5 h-3.5 text-blue-400/70 mt-0.5 shrink-0" />

                                              <div className="flex-1 min-w-0">

                                                <span className="text-[11px] text-custom-secondary">
                                                  {label}:
                                                </span>

                                                {showChange && oldValue ? (
                                                  <div className="flex flex-col gap-0.5 mt-0.5">

                                                    <span className="text-[10px] text-custom-muted line-through">
                                                      {oldValue?.toString() || '-'}
                                                    </span>

                                                    <span className="text-[11px] text-green-400 ml-1.5 font-medium break-words">
                                                      → {formattedValue?.toString() || '-'}
                                                    </span>

                                                  </div>
                                                ) : (
                                                  <span className="text-[11px] text-custom-primary ml-1.5 font-medium break-words">
                                                    {formattedValue?.toString() || '-'}
                                                  </span>
                                                )}

                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* 🔹 Cuadro de Nota Interna (Prioridad para comentarios) */}
                                  {details?.note && (
                                    <div className={`${!isCommentType || (isEditType && Object.keys(updatedFields).length > 0) ? 'mt-2' : ''} flex items-start gap-3 rounded-lg bg-blue-500/5 px-4 py-3 border-l-2 border-blue-500/50`}>
                                      <MessageSquare className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[13px] text-custom-primary leading-snug whitespace-pre-wrap break-words">
                                          {details.note}
                                        </p>
                                        <p className="text-[9px] text-blue-400/60 mt-2 font-medium uppercase tracking-tight">
                                          Nota Administrativa
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isLast && <div className="absolute left-0 -bottom-1 -translate-x-1/2 w-2 h-2 rounded-full bg-custom-border-primary" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            );
          })()}
        </div>

          {/* Diálogo de confirmación de aprobación */}
          <QuotationApproveDialog
            isOpen={approveDialogOpen}
            quotation={quotation}
            onClose={handleCloseApproveDialog}
            onSuccess={handleApproveSuccess}
          />

          {/* Diálogo de confirmación de aprobación */}
          <QuotationSendDialog
            isOpen={sendDialogOpen}
            quotation={quotation}
            onClose={handleCloseSendDialog}
            onSuccess={handleSendSuccess}
          />

          {/* Diálogo de confirmación de cancelación */}
          <QuotationCancelDialog
            isOpen={cancelDialogOpen}
            quotation={quotation}
            onClose={handleCloseCancelDialog}
            onSuccess={handleCancelSuccess}
          />

          {/* Diálogo de detalles de impuestos */}
          <ProductTaxesDialog
            isOpen={taxesDialogOpen}
            onClose={() => setTaxesDialogOpen(false)}
            productName={selectedItemTaxes.productName}
            taxes={selectedItemTaxes.taxes}
            productSubtotal={selectedItemTaxes.productSubtotal}
          />

      </div>
    </div>
  );
}
