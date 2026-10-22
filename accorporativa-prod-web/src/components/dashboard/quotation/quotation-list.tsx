"use client";
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {AlertTriangle, Plus, Search, FileText, Eye, Edit, Trash2, Copy, Send, CheckCircle, XCircle, Clock, DollarSign, Building, User, Calendar, MoreVertical, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { QuotationApproveDialog } from "./quotation-approve-dialog";
import { QuotationPagination } from "./quotation-pagination";
import {
  getQuotations,
  deleteQuotation,
  updateQuotationStatus,
  cancelQuotation,
  type Quotation,
} from "@/lib/actions/quotations.actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';

interface QuotationListProps {
  userPermissions?: string[];
}

export function QuotationList({ userPermissions = [] }: QuotationListProps) {
  const searchParams = useSearchParams();
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Estados para el modal de información
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Estados para filtros
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    vendorId: "",
    contactId: "", // Cambiado de clientName a contactId
    productName: "",
    status: [] as string[],
  });
  const [vendors, setVendors] = useState<Array<{id: string, full_name: string}>>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [clients, setClients] = useState<Array<{id: string, name: string, full_name?: string}>>([]);

  // Estados para combobox
  const [vendorSearch, setVendorSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  // Estados para opciones filtradas
  const [filteredVendors, setFilteredVendors] = useState<Array<{id: string, full_name: string}>>([]);
  const [filteredProducts, setFilteredProducts] = useState<string[]>([]);
  const [filteredClients, setFilteredClients] = useState<Array<{id: string, name: string, full_name?: string}>>([]);

  // Estados para paginación
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  // Estados para aprobación
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [quotationToApprove, setQuotationToApprove] = useState<Quotation | null>(null);
  
  // Referencia para scroll
  const listTopRef = useRef<HTMLDivElement>(null);

  const canCreateQuotations = userPermissions.includes("create:quotation");
  const canUpdateQuotations = userPermissions.includes("update:quotation");
  const canDeleteQuotations = userPermissions.includes("delete:quotation");
  const canReadQuotations = userPermissions.includes("read:quotation");

  // Función para abrir el modal con la cotización seleccionada
  const openQuotationModal = (quotationId: string) => {
    setSelectedQuotationId(quotationId);
    setShowModal(true);
    setOpenMenuId(null); // Cerrar el menú de acciones
  };

  // Función para cerrar el modal
  const closeQuotationModal = () => {
    setShowModal(false);
    setSelectedQuotationId(null);
  };

  // Detectar parámetro viewQuotation en la URL y abrir modal automáticamente
  useEffect(() => {
    const viewQuotationId = searchParams.get('viewQuotation');
    if (viewQuotationId && !initialLoading) {
      openQuotationModal(viewQuotationId);
      // Limpiar el parámetro de la URL sin recargar la página
      const url = new URL(window.location.href);
      url.searchParams.delete('viewQuotation');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, initialLoading]);

  // Función para abrir diálogo de eliminación
  const handleDeleteClick = (quotation: Quotation) => {
    setQuotationToDelete(quotation);
    setDeleteDialogOpen(true);
    setOpenMenuId(null);
  };
  
const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
const [quotationToCancel, setQuotationToCancel] = useState<Quotation | null>(null);
const [cancelConfirmationText, setCancelConfirmationText] = useState("");
const [isCancelling, setIsCancelling] = useState(false);
const [openGroupSelect, setOpenGroupSelect] = useState(false);

/**
 * Cerrar modal sin hacer nada
 */
const handleCancelCancel = () => {
  setCancelDialogOpen(false);
  setQuotationToCancel(null);
  setCancelConfirmationText("");
};

/**
 * Abrir modal de cancelación
 */
const handleCancelClick = (quotation: Quotation) => {
  setQuotationToCancel(quotation);
  setCancelDialogOpen(true);
  setCancelConfirmationText("");
  setOpenMenuId(null);
};

/**
 * Confirmar cancelación
 */
    const handleConfirmCancel = async () => {
  if (!quotationToCancel) return;

  try {
    setIsCancelling(true);

    const result = await cancelQuotation(quotationToCancel.id);

    if (!result.success) {
      toast.error(result.error || "Error al cancelar la cotización");
      return;
    }

    toast.success("Cotización cancelada correctamente");

    // ✅ limpiar estado
    setCancelDialogOpen(false);
    setQuotationToCancel(null);
    setCancelConfirmationText("");

    // 🔄 recargar listado
    await loadQuotations(currentPage, filters);
  } catch (error) {
    console.error("Error cancelando cotización:", error);
    toast.error("Error inesperado al cancelar la cotización");
  } finally {
    setIsCancelling(false);
  }
};


  // Función para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!quotationToDelete) return;

    // Validar que haya escrito "eliminar"
    if (deleteConfirmationText.toLowerCase().trim() !== "eliminar") {
      toast.error('Debes escribir "eliminar" para confirmar');
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteQuotation(quotationToDelete.id);

      if (result.success) {
        toast.success('Cotización eliminada correctamente');
        setDeleteDialogOpen(false);
        setQuotationToDelete(null);
        setDeleteConfirmationText(""); // Limpiar el input
        // Recargar cotizaciones
        await loadQuotations(currentPage, filters);
      } else {
        toast.error(result.error || 'Error al eliminar la cotización');
      }
    } catch (error) {
      console.error('Error eliminando cotización:', error);
      toast.error('Error inesperado al eliminar la cotización');
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para cancelar eliminación
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setQuotationToDelete(null);
    setDeleteConfirmationText(""); // Limpiar el input
  };

  // Función para abrir diálogo de aprobación
  const handleApproveClick = (quotation: Quotation) => {
    setQuotationToApprove(quotation);
    setApproveDialogOpen(true);
    setOpenMenuId(null);
  };

  // Función para cerrar diálogo de aprobación
  const handleCloseApproveDialog = () => {
    setApproveDialogOpen(false);
    setQuotationToApprove(null);
  };

  // Función llamada después de aprobar exitosamente
  const handleApproveSuccess = async () => {
    await loadQuotations(currentPage, filters);
  };

  // Función para cargar cotizaciones
  const loadQuotations = useCallback(async (
    page: number = 1,
    currentFilters = filters
  ) => {
    if (!canReadQuotations) return;
    
    try {
      setLoading(true);
      
      // Enviar filtros al servidor
      const result = await getQuotations(
        page,
        pageSize,
        searchQuery,
        '', // statusFilter legacy
        '', // companyFilter  
        'created_at',
        'desc',
        currentFilters.vendorId,
        currentFilters.contactId,
        currentFilters.dateFrom,
        currentFilters.dateTo,
        currentFilters.status,
        currentFilters.productName
      );
      
      setQuotations(result.quotations);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
      setCurrentPage(result.page);
      
      // Extraer datos únicos para filtros
      extractFilterData(result.quotations);
    } catch (error) {
      console.error("Error cargando cotizaciones:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setIsSearching(false);
    }
  }, [searchQuery, canReadQuotations, pageSize, filters]);


  // Extraer datos para filtros
  const extractFilterData = (quotes: Quotation[]) => {
    const uniqueVendors = new Map();
    const uniqueProducts = new Set<string>();
    const uniqueClients = new Map();
    
    quotes.forEach(quote => {
      // Vendedores
      if (quote.seller_user?.id && quote.seller_user?.full_name) {
        uniqueVendors.set(quote.seller_user.id, {
          id: quote.seller_user.id,
          full_name: quote.seller_user.full_name
        });
      }
      
      // Clientes
      if (quote.contact) {
        const clientName = quote.contact.name || quote.contact.full_name || "";
        if (clientName) {
          uniqueClients.set(quote.contact.id, {
            id: quote.contact.id,
            name: clientName,
            full_name: quote.contact.full_name
          });
        }
      }
      
      // Productos
      if (quote.items) {
        quote.items.forEach(item => {
          if (item.product?.name) {
            uniqueProducts.add(item.product.name);
          }
        });
      }
    });
    
    const vendorsList = Array.from(uniqueVendors.values());
    const productsList = Array.from(uniqueProducts).sort();
    const clientsList = Array.from(uniqueClients.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    setVendors(vendorsList);
    setProducts(productsList);
    setClients(clientsList);
    setFilteredVendors(vendorsList);
    setFilteredProducts(productsList);
    setFilteredClients(clientsList);
  };

  // Filtrar vendedores basado en búsqueda
  useEffect(() => {
    if (vendorSearch.trim() === "") {
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter(vendor =>
        vendor.full_name.toLowerCase().includes(vendorSearch.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  }, [vendorSearch, vendors]);

  // Filtrar productos basado en búsqueda
  useEffect(() => {
    if (productSearch.trim() === "") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.toLowerCase().includes(productSearch.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [productSearch, products]);

  // Filtrar clientes basado en búsqueda
  useEffect(() => {
    if (clientSearch.trim() === "") {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (client.full_name && client.full_name.toLowerCase().includes(clientSearch.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
  }, [clientSearch, clients]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest(`#menu-${openMenuId}`)) {
        setOpenMenuId(null);
      }
      
      if (!(event.target as Element).closest('.vendor-combobox')) {
        setShowVendorDropdown(false);
      }
      if (!(event.target as Element).closest('.product-combobox')) {
        setShowProductDropdown(false);
      }
      if (!(event.target as Element).closest('.client-combobox')) {
        setShowClientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // Carga inicial al montar el componente
  useEffect(() => {
    if (canReadQuotations) {
      loadQuotations(1, filters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReadQuotations]);

  // Efecto para búsqueda con debounce
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Recargar cotizaciones cuando cambia la búsqueda o página
  useEffect(() => {
    if (canReadQuotations && !initialLoading) {
      loadQuotations(currentPage, filters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, currentPage]);

  // Cuando cambien los filtros, resetear a página 1 y recargar
  useEffect(() => {
    if (canReadQuotations && !initialLoading) {
      setCurrentPage(1);
      loadQuotations(1, filters);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Scroll automático al cambiar de página
  useEffect(() => {
    if (listTopRef.current && !initialLoading) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, initialLoading]);

  // Función para cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Función para seleccionar vendedor
  const selectVendor = (vendorId: string, vendorName: string) => {
    setFilters(prev => ({ ...prev, vendorId }));
    setVendorSearch(vendorName);
    setShowVendorDropdown(false);
  };

  // Función para seleccionar cliente
  const selectClient = (clientId: string, clientName: string) => {
    setFilters(prev => ({ ...prev, contactId: clientId }));
    setClientSearch(clientName);
    setShowClientDropdown(false);
  };

  // Función para seleccionar producto
  const selectProduct = (productName: string) => {
    setFilters(prev => ({ ...prev, productName }));
    setProductSearch(productName);
    setShowProductDropdown(false);
  };

  // Función para limpiar vendedor
  const clearVendor = () => {
    setFilters(prev => ({ ...prev, vendorId: "" }));
    setVendorSearch("");
  };

  // Función para limpiar cliente
  const clearClient = () => {
    setFilters(prev => ({ ...prev, contactId: "" }));
    setClientSearch("");
  };

  // Función para limpiar producto
  const clearProduct = () => {
    setFilters(prev => ({ ...prev, productName: "" }));
    setProductSearch("");
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

  // Función para calcular el total correcto desde los items
  const calculateQuotationTotal = (quotation: Quotation) => {
    if (!quotation?.items) return quotation.total || 0;
    // item_total ya incluye impuestos y descuentos por producto
    const itemsTotal = quotation.items.reduce((sum, item) => sum + (item.item_total || 0), 0);
    // Restar descuento general
    return itemsTotal - (quotation.discount_amount || 0);
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
        case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };


  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "sent":
        return <Send className="w-3 h-3" />;
      case "accepted":
        return <CheckCircle className="w-3 h-3" />;
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      case "expired":
        return <Clock className="w-3 h-3" />;
      case "converted_to_order":
        return <DollarSign className="w-3 h-3" />;
        case "cancelled":
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  // Función para obtener el texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "sent":
        return "Enviada";
      case "accepted":
        return "Aprobada";
      case "rejected":
        return "Rechazada";
      case "expired":
        return "Expirada";
      case "converted_to_order":
        return "Convertida";
      case "cancelled":
        return "Cancelada";
      default:
        return status;
    }
  };

  // Función para formatear número de cotización
  const formatQuotationNumber = (number: string | null) => {
    if (!number) return "N/A";
    return `#${number.padStart(4, '0')}`;
  };

  // Función para obtener nombre del vendedor
  const getVendorName = (quotation: Quotation) => {
    if (quotation.seller_user) {
      return quotation.seller_user.full_name || "Vendedor";
    }
    
    if (quotation.created_by_user) {
      return quotation.created_by_user.full_name || "Vendedor";
    }
    
    return "Vendedor";
  };

  // Función para limpiar filtros
  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      vendorId: "",
      contactId: "",
      productName: "",
      status: []
    });
    setVendorSearch("");
    setClientSearch("");
    setProductSearch("");
  };

  // Función para eliminar un filtro específico
  const removeFilter = (filterName: keyof typeof filters) => {
    if (filterName === 'status') {
      setFilters(prev => ({ ...prev, status: [] }));
      return;
    }

    setFilters(prev => ({
      ...prev,
      [filterName]: ""
    }));
    
    if (filterName === 'vendorId') {
      setVendorSearch("");
    }
    if (filterName === 'contactId') {
      setClientSearch("");
    }
    if (filterName === 'productName') {
      setProductSearch("");
    }
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = Boolean(
    filters.dateFrom ||
    filters.dateTo ||
    filters.vendorId ||
    filters.contactId ||
    filters.productName ||
    (filters.status && filters.status.length > 0)
  );

  // Contar filtros activos (status cuenta por cada estado seleccionado)
  const activeFilterCount =
    [filters.dateFrom, filters.dateTo, filters.vendorId, filters.contactId, filters.productName].filter(
      (v) => v !== ""
    ).length + (filters.status ? filters.status.length : 0);

  // Si no tiene permiso de lectura
  if (!canReadQuotations && !initialLoading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-red-400">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-custom-text-primary mb-2">Acceso restringido</h3>
          <p className="text-custom-text-tertiary">No tienes permisos para ver las cotizaciones.</p>
        </div>
      </div>
    );
  }

  // Mostrar skeleton solo en carga inicial
  if (initialLoading || loading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <div className="h-10 bg-custom-bg-secondary rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-24 bg-gray-800 rounded animate-pulse"></div>
        </div>

        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="h-12 w-12 bg-gray-800 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-48 bg-gray-800 rounded"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-800 rounded"></div>
                  <div className="h-4 w-40 bg-gray-800 rounded"></div>
                </div>
              </div>
            </div>
            <div className="h-8 w-20 bg-gray-800 rounded flex-shrink-0"></div>
          </div>
        ))}
      </div>
    );
  }

  // Determinar qué cotizaciones mostrar
  const quotationsToDisplay = quotations;
  const displayTotalItems = totalItems;
  const displayTotalPages = totalPages;
  const displayCurrentPage = currentPage;

  return (
    <div className="space-y-6">
      {/* Referencia para scroll automático */}
      <div ref={listTopRef} className="scroll-mt-4" />
      
      {/* Barra de búsqueda y filtros */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-custom-text-tertiary" />
            </div>
            <input
              type="text"
              placeholder="Buscar cotizaciones por cliente, número o empresa..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-custom-bg-secondary border border-custom-border-secondary rounded-lg text-custom-text-primary placeholder-custom-text-muted focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-custom-text-secondary bg-custom-bg-tertiary border border-custom-border-secondary rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-yellow-600 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {searchInput && (
              <button 
                className="px-4 py-3 bg-custom-bg-tertiary text-custom-text-secondary rounded-lg border border-custom-border-secondary hover:bg-gray-700 transition-colors"
                onClick={() => setSearchInput("")}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Etiquetas de filtros activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 border border-blue-800 rounded-full">
                Fecha exacta: {formatDate(filters.dateFrom)}
                <button
                  onClick={() => removeFilter("dateFrom")}
                  className="hover:bg-blue-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 border border-blue-800 rounded-full">
                Fecha exacta: {formatDate(filters.dateTo)}
                <button
                  onClick={() => removeFilter("dateTo")}
                  className="hover:bg-blue-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.vendorId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-300 bg-green-900/40 border border-green-800 rounded-full">
                Vendedor: {vendors.find(v => v.id === filters.vendorId)?.full_name || "Vendedor"}
                <button
                  onClick={() => removeFilter("vendorId")}
                  className="hover:bg-green-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.contactId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-300 bg-purple-900/40 border border-purple-800 rounded-full">
                Cliente: {clients.find(c => c.id === filters.contactId)?.name || "Cliente"}
                <button
                  onClick={() => removeFilter("contactId")}
                  className="hover:bg-purple-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.productName && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-yellow-300 bg-yellow-900/40 border border-yellow-800 rounded-full">
                Producto: {filters.productName}
                <button
                  onClick={() => removeFilter("productName")}
                  className="hover:bg-yellow-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.status && filters.status.length > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-orange-300 bg-orange-900/40 border border-orange-800 rounded-full">
                Estado: {getStatusText(filters.status[0])}
                {filters.status.length > 1 && (
                  <span className="ml-1 text-xs text-orange-200">+{filters.status.length - 1}</span>
                )}
                <button
                  onClick={() => removeFilter("status")}
                  className="hover:bg-orange-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-md transition-colors"
              >
                <X className="w-3 h-3" />
                Limpiar todo
              </button>
            )}
          </div>
        )}

        {/* Panel de filtros expandido */}
        {showFilters && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Fecha de creación
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <div>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => {
                        setFilters({...filters, dateFrom: e.target.value, dateTo: ""});
                      }}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white hover:border-gray-600 transition-colors"
                      placeholder="Selecciona fecha"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 vendor-combobox">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Creada por (Vendedor)
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={vendorSearch}
                      onChange={(e) => {
                        setVendorSearch(e.target.value);
                        setShowVendorDropdown(true);
                      }}
                      onFocus={() => setShowVendorDropdown(true)}
                      placeholder="Buscar vendedor..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 hover:border-gray-600 transition-colors"
                    />
                    {filters.vendorId && (
                      <button
                        onClick={clearVendor}
                        className="px-2 text-gray-400 hover:text-white"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {showVendorDropdown && filteredVendors.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredVendors.map(vendor => (
                        <button
                          key={vendor.id}
                          onClick={() => selectVendor(vendor.id, vendor.full_name)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          {vendor.full_name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showVendorDropdown && filteredVendors.length === 0 && vendorSearch.trim() !== "" && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                      <div className="px-3 py-2 text-sm text-gray-400">
                        No se encontraron vendedores
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 client-combobox">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Cliente
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      placeholder="Buscar cliente..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 hover:border-gray-600 transition-colors"
                    />
                    {filters.contactId && (
                      <button
                        onClick={clearClient}
                        className="px-2 text-gray-400 hover:text-white"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {showClientDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredClients.map(client => (
                        <button
                          key={client.id}
                          onClick={() => selectClient(client.id, client.name)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          {client.name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showClientDropdown && filteredClients.length === 0 && clientSearch.trim() !== "" && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                      <div className="px-3 py-2 text-sm text-gray-400">
                        No se encontraron clientes
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 product-combobox">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Producto
                </label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      placeholder="Buscar producto..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 hover:border-gray-600 transition-colors"
                    />
                    {filters.productName && (
                      <button
                        onClick={clearProduct}
                        className="px-2 text-gray-400 hover:text-white"
                        type="button"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {showProductDropdown && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                      {filteredProducts.map(product => (
                        <button
                          key={product}
                          onClick={() => selectProduct(product)}
                          className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          {product}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {showProductDropdown && filteredProducts.length === 0 && productSearch.trim() !== "" && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
                      <div className="px-3 py-2 text-sm text-gray-400">
                        No se encontraron productos
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                  Estado
                </label>
                <Popover open={openGroupSelect} onOpenChange={setOpenGroupSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between min-h-10 bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                    >
                      <div className="flex gap-1 flex-1 text-left min-w-0 overflow-hidden items-center">
                        {filters.status && filters.status.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${getStatusColor(filters.status[0])}`}>
                              {getStatusText(filters.status[0])}
                            </span>
                            {filters.status.length > 1 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-700 text-gray-200 rounded">+{filters.status.length - 1}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Todos los estados</span>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="bg-gray-800 border border-gray-700 p-2">
                    <div className="flex flex-col gap-1">
                      {[
                        { value: "", label: "Todos los estados" },
                        { value: "pending", label: "Pendiente" },
                        { value: "sent", label: "Enviada" },
                        { value: "accepted", label: "Aprobada" },
                        { value: "cancelled", label: "Cancelada" },
                        { value: "rejected", label: "Rechazada" },
                        { value: "expired", label: "Expirada" },
                        { value: "converted_to_order", label: "Convertida a orden" },
                      ].map((opt) => {
                        const isSelected = opt.value !== "" && filters.status.includes(opt.value);
                        return (
                          <button
                            key={opt.value || "all"}
                            onClick={() => {
                              if (opt.value === "") {
                                setFilters(prev => ({ ...prev, status: [] }));
                                setOpenGroupSelect(false);
                                return;
                              }

                              setFilters(prev => {
                                const exists = prev.status.includes(opt.value);
                                return {
                                  ...prev,
                                  status: exists ? prev.status.filter(s => s !== opt.value) : [...prev.status, opt.value]
                                };
                              });
                            }}
                            className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 text-gray-200 flex items-center gap-2"
                          >
                            <span className={`h-4 w-4 rounded-sm border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                              {isSelected && (
                                <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                              )}
                            </span>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              </div>
            </div>
          )}
        </div>

      {/* Mostrar indicador de búsqueda */}
      {isSearching && searchQuery && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-custom-text-tertiary">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
            <span className="text-sm">Buscando cotizaciones...</span>
          </div>
        </div>
      )}

      {/* Mostrar mensaje cuando hay búsqueda sin resultados */}
      {searchQuery && !isSearching && quotationsToDisplay.length === 0 && (
        <div className="text-center py-8">
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
              <Search className="w-6 h-6 text-custom-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-custom-text-primary mb-2">No se encontraron resultados</h3>
            <p className="text-custom-text-tertiary mb-2">
              No hay cotizaciones que coincidan con &quot;{searchQuery}&quot;
              {hasActiveFilters && " y los filtros aplicados"}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <button 
                className="px-4 py-2 text-sm text-yellow-400 hover:text-yellow-300"
                onClick={() => setSearchInput("")}
              >
                Limpiar búsqueda
              </button>
              {hasActiveFilters && (
                <button 
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                  onClick={clearFilters}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mostrar cotizaciones */}
      {quotationsToDisplay.length > 0 ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-custom-text-tertiary">
              Mostrando {((displayCurrentPage - 1) * pageSize) + 1} - {Math.min(displayCurrentPage * pageSize, displayTotalItems)} de {displayTotalItems} cotización{displayTotalItems !== 1 ? "es" : ""}
              {hasActiveFilters && " (filtradas)"}
            </p>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button 
                  className="text-sm text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}
              <button 
                className="text-sm text-custom-text-tertiary hover:text-custom-text-primary flex items-center gap-1"
                onClick={() => loadQuotations(currentPage, filters)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>

          {quotationsToDisplay.map((quotation) => (
            <div
              key={quotation.id}
              className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 hover:border-gray-600 transition-colors"
            >
              {/* Cabecera con título y botón de acciones */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icono */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-lg bg-gray-900 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-yellow-400" />
                        </div>
                      </div>

                      {/* Detalles principales */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate mb-2">
                          {quotation.contact?.name || "Sin cliente"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(quotation.status)}`}
                          >
                            {getStatusIcon(quotation.status)}
                            {getStatusText(quotation.status)}
                          </span>
                          {quotation.quotation_number && (
                            <span className="text-sm text-gray-300 bg-gray-900 px-3 py-1 rounded">
                              {formatQuotationNumber(quotation.quotation_number)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón de acciones */}
                <div className="relative ml-2" id={`menu-${quotation.id}`}>
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === quotation.id ? null : quotation.id
                      )
                    }
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors flex-shrink-0"
                    title="Más opciones"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {/* Menú desplegable */}
                  {openMenuId === quotation.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-custom-bg-secondary border border-custom-border-secondary rounded-lg shadow-xl z-50">
                      <div className="py-1">
                        {/* Ver */}
                        <Link href={`/dashboard/cotizaciones-padre/cotizaciones/ver/${quotation.id}`}>
                        <button
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <Eye className="w-4 h-4" />
                          Ver detalles
                        </button>
                        </Link>

                        {/* Editar (solo si está pendiente) */}
                        {canUpdateQuotations &&
                          quotation.status === "pending" && (
                            <Link href={`/dashboard/cotizaciones-padre/cotizaciones/editar/${quotation.id}`}>
                            <button
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:bg-blue-900/20 hover:text-blue-300 transition-colors"
                              onClick={() => setOpenMenuId(null)}
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                            </Link>
                          )}

                        {/* Aprobar (solo si está pendiente) */}
                        {canUpdateQuotations &&
                          quotation.status === "pending" && (
                            <button
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-green-900/20 hover:text-green-300 transition-colors"
                              onClick={() => handleApproveClick(quotation)}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Aprobar
                            </button>
                          )}

                        {/* Separador */}
                        {canDeleteQuotations && quotation.status === "pending" && (
                          <div className="border-t border-custom-border-secondary my-1"></div>
                        )}
                    {canUpdateQuotations &&
                    quotation.status === "pending" && (
                      <button
                        type="button"
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-400 hover:bg-yellow-900/20 hover:text-yellow-300 transition-colors"
                        onClick={() => handleCancelClick(quotation)}
                      >
                        <X className="w-4 h-4" />
                        Cancelar
                      </button>
                    )}


                        {/* Eliminar */}
                        {canDeleteQuotations &&
                          quotation.status === "pending" && (
                            <button
                              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
                              onClick={() => handleDeleteClick(quotation)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles de la cotización */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
                {/* Compañía */}
                {quotation.company && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{quotation.company.name}</span>
                  </div>
                )}

                {/* Vendedor */}
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate" title="Vendedor">
                    Vendedor: {getVendorName(quotation)}
                  </span>
                </div>

                {/* Fecha de creación */}
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{formatDate(quotation.created_at)}</span>
                </div>

                {/* Total */}
                <div className="flex items-center gap-2 text-white font-medium">
                  <DollarSign className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                  <span>{formatCurrency(calculateQuotationTotal(quotation))}</span>
                </div>
              </div>

              {/* Validez */}
              {quotation.valid_until && (
                <div className="mt-2">
                  <p className="text-xs text-gray-400">
                    <span className="font-medium">Válida hasta:</span>{" "}
                    {formatDate(quotation.valid_until)}
                    {new Date(quotation.valid_until) < new Date() &&
                      quotation.status !== "expired" && (
                        <span className="ml-2 text-red-400">(Expirada)</span>
                      )}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Paginación */}
          {displayTotalPages > 1 && (
            <QuotationPagination
              currentPage={displayCurrentPage}
              totalPages={displayTotalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      ) : !searchQuery && !hasActiveFilters ? (
        // Estado vacío (sin cotizaciones)
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
            <FileText className="w-10 h-10 text-custom-text-muted" />
          </div>
          
          <h3 className="text-xl font-medium text-custom-text-primary mb-3">No hay cotizaciones</h3>
          <p className="text-custom-text-tertiary mb-6 max-w-md mx-auto">
            Crea tu primera cotización para empezar a gestionar presupuestos y ofertas.
          </p>
          
          {canCreateQuotations ? (
            <Link href="/dashboard/cotizaciones-padre/cotizaciones/crear">
              <Button className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg">
                <Plus className="w-5 h-5" />
                Crear Primera Cotización
              </Button>
            </Link>
          ) : (
            <div className="text-sm text-custom-text-tertiary">
              No tienes permisos para crear cotizaciones
            </div>
          )}
        </div>
      ) : null}

      {/* Diálogo de confirmación de eliminación */}
      {deleteDialogOpen && quotationToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCancelDelete}
          />
          {/* Dialog */}
          <div className="relative z-10 w-full max-w-md mx-4 bg-custom-bg-secondary rounded-lg border border-custom-border-secondary shadow-xl">
            <div className="p-6">
              {/* Icono y título */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-custom-text-primary mb-1">
                    ¿Eliminar cotización?
                  </h3>
                  <p className="text-sm text-custom-text-tertiary">
                    Esta acción no se puede deshacer. La cotización será marcada
                    como eliminada.
                  </p>
                </div>
              </div>

              {/* Información de la cotización */}
              <div className="bg-custom-bg-tertiary rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-custom-text-tertiary">Número:</span>
                    <span className="text-custom-text-primary font-medium">
                      #{quotationToDelete.quotation_number}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-custom-text-tertiary">Cliente:</span>
                    <span className="text-custom-text-primary font-medium">
                      {quotationToDelete.contact?.name ||
                        quotationToDelete.contact?.full_name ||
                        "Sin cliente"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-custom-text-tertiary">Total:</span>
                    <span className="text-custom-text-primary font-medium">
                      {formatCurrency(calculateQuotationTotal(quotationToDelete))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Campo de confirmación */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-custom-text-secondary mb-2">
                  Para confirmar, escribe{" "}
                  <span className="text-red-400 font-semibold">eliminar</span>:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder="Escribe 'eliminar'"
                  className="w-full px-4 py-2.5 bg-custom-bg-tertiary border border-custom-border-secondary rounded-lg text-custom-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isDeleting}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 border border-custom-border-secondary text-custom-text-primary hover:bg-custom-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting || deleteConfirmationText.toLowerCase().trim() !== "eliminar"}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title={deleteConfirmationText.toLowerCase().trim() !== "eliminar" ? 'Escribe "eliminar" para habilitar' : ''}
                >
                  {isDeleting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4"
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
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

         {/* ===== Diálogo de confirmación de cancelación ===== */}
{cancelDialogOpen && quotationToCancel && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    
    {/* Overlay */}
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={handleCancelCancel}
    />

    {/* Dialog */}
    <div className="relative z-10 w-full max-w-md mx-4 bg-custom-bg-secondary rounded-lg border border-custom-border-secondary shadow-xl">
      <div className="p-6">

        {/* Icono y título */}
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-900/20 flex items-center justify-center">
            <X className="w-6 h-6 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-custom-text-primary mb-1">
              ¿Cancelar cotización?
            </h3>
            <p className="text-sm text-custom-text-tertiary">
              La cotización será marcada como cancelada.
            </p>
          </div>
        </div>

        {/* Información de la cotización */}
        <div className="bg-custom-bg-tertiary rounded-lg p-4 mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-custom-text-tertiary">Número:</span>
              <span className="text-custom-text-primary font-medium">
                #{quotationToCancel.quotation_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-custom-text-tertiary">Cliente:</span>
              <span className="text-custom-text-primary font-medium">
                {quotationToCancel.contact?.name ||
                  quotationToCancel.contact?.full_name ||
                  "Sin cliente"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-custom-text-tertiary">Total:</span>
              <span className="text-custom-text-primary font-medium">
                {formatCurrency(calculateQuotationTotal(quotationToCancel))}
              </span>
            </div>
          </div>
        </div>

        {/* Campo de confirmación */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-custom-text-secondary mb-2">
            Para confirmar, escribe{" "}
            <span className="text-yellow-400 font-semibold">cancelar</span>:
          </label>
          <input
            type="text"
            value={cancelConfirmationText}
            onChange={(e) => setCancelConfirmationText(e.target.value)}
            placeholder="Escribe 'cancelar'"
            className="w-full px-4 py-2.5 bg-custom-bg-tertiary border border-custom-border-secondary rounded-lg text-custom-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            disabled={isCancelling}
          />
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3">
          <button
            onClick={handleCancelCancel}
            disabled={isCancelling}
            className="flex-1 px-4 py-2.5 border border-custom-border-secondary text-custom-text-primary hover:bg-custom-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cerrar
          </button>

          <button
            onClick={handleConfirmCancel}
            disabled={
              isCancelling ||
              cancelConfirmationText.toLowerCase().trim() !== "cancelar"
            }
            className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            title={
              cancelConfirmationText.toLowerCase().trim() !== "cancelar"
                ? 'Escribe "cancelar" para habilitar'
                : ""
            }
          >
            {isCancelling ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Cancelando...
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Cancelar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      {/* Diálogo de confirmación de aprobación */}
      <QuotationApproveDialog
        isOpen={approveDialogOpen}
        quotation={quotationToApprove}
        onClose={handleCloseApproveDialog}
        onSuccess={handleApproveSuccess}
      />
    </div>
  );
}