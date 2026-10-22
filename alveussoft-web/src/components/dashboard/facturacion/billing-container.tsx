"use client";

import { useState, useEffect } from "react";
import { BillingFilters } from "./billing-filters";
import { BillingTable } from "./billing-table";
import {
  getOrdersWithBillingInfo,
  OrderWithBillingInfo,
} from "@/lib/actions/billing.actions";
import { getInvoicePDF, getInvoiceXML } from "@/lib/actions/invoices.actions";
import { BillingPagination } from "./billing-pagination";
import { AlertCircle, Search, RefreshCw, AlertTriangle, X, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { downloadInvoicePDF } from "@/lib/utils/download-pdf";
import { downloadInvoiceXML } from "@/lib/utils/download-xml";
import { BillingCard } from "./billing-card";

export interface BillingTableData extends OrderWithBillingInfo {
  has_invoice: boolean;
  invoice_date: string | null;
  contacts_id?: string | null;
}

interface BillingStats {
  totalOrders: number;
  withInvoice: number;
  withoutInvoice: number;
}

// Interfaz para filtros
interface BillingFiltersState {
  invoiceStatus: "all" | "with_invoice" | "without_invoice";
  orderDateFrom: string;
  orderDateTo: string;
  invoiceDateFrom: string;
  invoiceDateTo: string;
}

export function BillingContainer() {
  const [orders, setOrders] = useState<BillingTableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<BillingFiltersState>({
    invoiceStatus: "without_invoice",
    orderDateFrom: "",
    orderDateTo: "",
    invoiceDateFrom: "",
    invoiceDateTo: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Estadísticas
  const [stats, setStats] = useState<BillingStats>({
    totalOrders: 0,
    withInvoice: 0,
    withoutInvoice: 0,
  });

  // Estados para descargas
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
  const [downloadingXML, setDownloadingXML] = useState<string | null>(null);

  // Estados para modales
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<BillingTableData | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [cancellationMotive, setCancellationMotive] = useState<"02" | "03">("02");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationResult, setCancellationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const permissions = {
    canUpdate: true,
    canDelete: false,
    canDownloadPDF: true,
    canDownloadXML: true,
    canShare: true,
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Resetear a primera página al buscar
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Cargar datos cuando cambian filtros, búsqueda o página
  useEffect(() => {
    loadOrders();
  }, [currentPage, debouncedSearchTerm, filters]);

  async function loadOrders() {
    setIsLoading(true);
    setError(null);

    try {
      // Preparar filtros para enviar al servidor
      const serverFilters = {
        invoiceStatus: filters.invoiceStatus,
        orderDateFrom: filters.orderDateFrom || undefined,
        orderDateTo: filters.orderDateTo || undefined,
        invoiceDateFrom: filters.invoiceDateFrom || undefined,
        invoiceDateTo: filters.invoiceDateTo || undefined,
        searchTerm: debouncedSearchTerm || undefined,
      };

      // Llamar al servidor con todos los filtros
      const result = await getOrdersWithBillingInfo(
        currentPage,
        pageSize,
        serverFilters,
      );
      

      if (result.success) {
        // Formatear las órdenes
        const formattedOrders = result.orders.map((order) => ({
          ...order,
          has_invoice: order.billing_info !== null,
          invoice_date: order.billing_info?.created_at || null,
          contacts_id: order.contacts_id,
        }));

        setOrders(formattedOrders);
        setTotalItems(result.total || 0);
        setTotalPages(Math.ceil((result.total || 0) / pageSize));

        // Actualizar estadísticas
        if (result.stats) {
          setStats(result.stats);
        }
      } else {
        setError(result.error || "Error desconocido al cargar órdenes");
        setOrders([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setOrders([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFilterChange = (
    key: keyof BillingFiltersState,
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Resetear a primera página al cambiar filtros
  };

  const handleClearFilters = () => {
    setFilters({
      invoiceStatus: "all",
      orderDateFrom: "",
      orderDateTo: "",
      invoiceDateFrom: "",
      invoiceDateTo: "",
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll mejorado - se posiciona un poco más abajo
    setTimeout(() => {
      const container = document.querySelector("[data-billing-container]");
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const scrollY = window.scrollY;
        const targetY = scrollY + containerRect.top - 100;

        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth",
        });
      }
    }, 50);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleRefresh = () => {
    loadOrders();
  };

  const handleDownloadPDF = async (order: BillingTableData) => {
    if (!order.billing_info?.id_facrutama) return;

    try {
      setDownloadingPDF(order.billing_info.id_facrutama);
      const result = await getInvoicePDF(order.billing_info.id_facrutama);

      if (result.ok && result.pdfBase64) {
        await downloadInvoicePDF(
          result.pdfBase64,
          `factura-${order.order_number}`,
        );
      } else {
        console.error("Error descargando PDF:", result.error);
        alert("No se pudo descargar el PDF");
      }
    } catch (error) {
      console.error("Error descargando PDF:", error);
      alert("Error al descargar el PDF");
    } finally {
      setDownloadingPDF(null);
    }
  };

  const handleDownloadXML = async (order: BillingTableData) => {
    if (!order.billing_info?.id_facrutama) return;

    try {
      setDownloadingXML(order.billing_info.id_facrutama);
      const result = await getInvoiceXML(order.billing_info.id_facrutama);

      if (result.ok && result.xmlBase64) {
        await downloadInvoiceXML(
          result.xmlBase64,
          `factura-${order.order_number}`,
        );
      } else {
        console.error("Error descargando XML:", result.error);
        alert("No se pudo descargar el XML");
      }
    } catch (error) {
      console.error("Error descargando XML:", error);
      alert("Error al descargar el XML");
    } finally {
      setDownloadingXML(null);
    }
  };

  // Funciones para manejar cancelación
  const handleCancelClick = (order: BillingTableData) => {
    setOrderToCancel(order);
    setCancellationReason("");
    setCancellationMotive("02");
    setCancellationResult(null);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel?.billing_info?.id_facrutama) return;

    setIsCancelling(true);
    try {
      // Aquí llamarías a tu función de cancelación
      // Por ahora simularemos una respuesta
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulación de éxito
      setCancellationResult({
        success: true,
        message: `Factura cancelada exitosamente con motivo ${cancellationMotive}`
      });

      // Recargar las órdenes después de cancelar
      setTimeout(() => {
        loadOrders();
        setShowCancelModal(false);
        setCancellationResult(null);
      }, 2000);
      
    } catch (error) {
      setCancellationResult({
        success: false,
        message: "Error al cancelar la factura"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setOrderToCancel(null);
    setCancellationReason("");
    setCancellationResult(null);
  };

  const hasActiveFilters =
    filters.invoiceStatus !== "all" ||
    searchTerm !== "" ||
    filters.orderDateFrom !== "" ||
    filters.orderDateTo !== "" ||
    filters.invoiceDateFrom !== "" ||
    filters.invoiceDateTo !== "";

  return (
    <div className="space-y-6" data-billing-container>
      {/* Modal de Cancelación */}
      {showCancelModal && orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-[#0A0F17] rounded-lg shadow-xl w-full max-w-md border border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-white">
                  Cancelar Factura
                </h3>
              </div>
              <button
                onClick={handleCloseCancelModal}
                className="text-gray-500 hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {cancellationResult ? (
                <div className="text-center">
                  {cancellationResult.success ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-white mb-2">
                        ¡Cancelación Exitosa!
                      </h4>
                      <p className="text-gray-400 mb-4">
                        {cancellationResult.message}
                      </p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-white mb-2">
                        Error en Cancelación
                      </h4>
                      <p className="text-gray-400 mb-4">
                        {cancellationResult.message}
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Información de la orden */}
                  <div className="mb-4 p-3 bg-[#070B14] rounded-lg border border-gray-800">
                    <p className="text-sm font-medium text-white">
                      Orden #{orderToCancel.order_number}
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <span className="text-gray-500">Cliente:</span>
                        <p className="font-medium text-gray-300">{orderToCancel.user_name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">RFC:</span>
                        <p className="font-mono">{orderToCancel.billing_info?.rfc || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Factura ID:</span>
                        <p className="font-mono text-xs truncate">
                          {orderToCancel.billing_info?.id_facrutama?.slice(0, 20) || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Motivo de cancelación */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Motivo de cancelación
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="02"
                          checked={cancellationMotive === "02"}
                          onChange={(e) => setCancellationMotive(e.target.value as "02" | "03")}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          <span className="font-medium">02</span> - Comprobante con errores sin relación
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="03"
                          checked={cancellationMotive === "03"}
                          onChange={(e) => setCancellationMotive(e.target.value as "02" | "03")}
                          className="mr-2"
                        />
                        <span className="text-sm">
                          <span className="font-medium">03</span> - No se llevó a cabo la operación
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Razón adicional (opcional) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Razón adicional (opcional)
                    </label>
                    <textarea
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      placeholder="Describa la razón de la cancelación..."
                      className="w-full px-3 py-2 bg-[#070B14] border border-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 text-sm placeholder:text-gray-600"
                      rows={3}
                    />
                  </div>

                  {/* Advertencia */}
                  <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-3 mb-6">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400">
                        Esta acción no se puede deshacer. Una vez cancelada, la factura no podrá ser utilizada.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-800">
              {!cancellationResult ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCloseCancelModal}
                    disabled={isCancelling}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleConfirmCancel}
                    disabled={isCancelling || !cancellationMotive}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isCancelling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar Cancelación"
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleCloseCancelModal}
                  className="w-full"
                >
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <div className="font-medium">Error al cargar órdenes</div>
          </div>
          <div className="text-sm text-red-500 mt-1">{error}</div>
        </div>
      )}

      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <Input
                  type="search"
                  placeholder="Buscar por número de orden, cliente, email o RFC..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 py-2"
                  aria-label="Buscar órdenes"
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Cargando..." : "Actualizar"}
            </Button>
          </div>
        </div>

        <BillingFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Estadísticas - Siempre fijas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-4">
          <div className="text-sm text-gray-500">Total Órdenes Entregadas</div>
          <div className="text-2xl font-bold text-white">
            {stats.totalOrders}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Todas las órdenes con estado &quot;Entregado&quot;
          </div>
        </div>
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-4">
          <div className="text-sm text-gray-500">Facturas Emitidas</div>
          <div className="text-2xl font-bold text-green-400">
            {stats.withInvoice}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.totalOrders > 0
              ? `${Math.round(
                  (stats.withInvoice / stats.totalOrders) * 100,
                )}% de las órdenes`
              : "No hay órdenes"}
          </div>
        </div>
        <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-4">
          <div className="text-sm text-gray-500">Sin Facturar</div>
          <div className="text-2xl font-bold text-amber-400">
            {stats.withoutInvoice}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.totalOrders > 0
              ? `${Math.round(
                  (stats.withoutInvoice / stats.totalOrders) * 100,
                )}% de las órdenes`
              : "No hay órdenes"}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto"></div>
            <p className="mt-2 text-gray-400">Cargando órdenes...</p>
          </div>
        </div>
      ) : (
        <>
          {orders.length === 0 ? (
            <div className="bg-[#0A0F17] rounded-lg shadow border border-gray-800 p-8 text-center">
              <div className="text-gray-500 mb-2">
                No hay órdenes disponibles
              </div>
              <p className="text-gray-600 text-sm">
                {hasActiveFilters
                  ? "No se encontraron órdenes con los filtros aplicados"
                  : "No hay órdenes entregadas en el sistema"}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Versión para móviles y tablets - Cards */}
              <div className="lg:hidden space-y-4">
                {orders.map((order) => (
                  <BillingCard
                    key={order.id}
                    order={order}
                    onRefresh={handleRefresh}
                    onDownloadPDF={handleDownloadPDF}
                    onDownloadXML={handleDownloadXML}
                    downloadingPDF={downloadingPDF}
                    downloadingXML={downloadingXML}
                    onCancelClick={handleCancelClick} // Añadir esta prop
                  />
                ))}
              </div>

              {/* Versión solo para desktop - Tabla */}
              <div className="hidden lg:block">
                <BillingTable
                  orders={orders}
                  onRefresh={handleRefresh}
                  filters={filters}
                  isLoading={false}
                  permissions={permissions}
                  onDownloadPDF={handleDownloadPDF}
                  onDownloadXML={handleDownloadXML}
                  downloadingPDF={downloadingPDF}
                  downloadingXML={downloadingXML}
                  pagination={
                    totalPages > 1 ? (
                      <div className="mt-4 px-6 pb-4">
                        <BillingPagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          totalItems={totalItems}
                          pageSize={pageSize}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    ) : null
                  }
                />
              </div>

              {/* Paginación para móviles y tablets */}
              {totalPages > 1 && (
                <div className="lg:hidden mt-6">
                  <BillingPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    isMobile={true}
                  />
                </div>
              )}

              {/* Paginación para desktop (ya incluida en la tabla) */}
              {totalPages > 1 && (
                <div className="hidden lg:block mt-6">
                  <BillingPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}