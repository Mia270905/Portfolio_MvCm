"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, CheckCircle, FileX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { getInvoiceDetails } from "@/lib/actions/cancel-invoice.actions";
import { processPureCancelInvoice } from "@/lib/actions/cancel-invoice.actions";

export default function CancelInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params.order_number as string;

  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [cancellationData, setCancellationData] = useState({
    motive: "02" as "02" | "03",
    reason: "",
  });

  useEffect(() => {
    loadInvoiceDetails();
  }, [orderNumber]);

  async function loadInvoiceDetails() {
    setIsLoading(true);
    setError(null);
    try {
      const details = await getInvoiceDetails(orderNumber);
      if (!details) {
        setError("No se encontró información de factura para esta orden");
      } else {
        setInvoiceDetails(details);
      }
    } catch (err) {
      setError("Error al cargar los detalles de la factura");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmitClick = () => {
    if (!invoiceDetails?.id_facturama) {
      setError("No hay información de factura válida");
      return;
    }

    if (!cancellationData.motive) {
      setError("Debe seleccionar un motivo de cancelación");
      return;
    }

    setShowConfirmationModal(true);
  };

  async function handleConfirmCancel() {
    if (!invoiceDetails?.id_facturama) return;

    setShowConfirmationModal(false);
    setIsProcessing(true);
    setError(null);

    try {
      const result = await processPureCancelInvoice({
        orderNumber,
        originalFacturamaId: invoiceDetails.id_facturama,
        motive: cancellationData.motive,
        cancellationReason: cancellationData.reason,
      });

      if (result.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/dashboard/facturacion/gestion");
        }, 3000);
      } else {
        setError(result.error || "Error al procesar la cancelación");
      }
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-4 px-3 sm:px-4">
          <div className="flex items-center mb-4">
            <Link
              href="/dashboard/facturacion/gestion"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-sm"></span>
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <span className="text-gray-600 text-center">
              Cargando información de la factura...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-4 px-3 sm:px-4">
          <div className="flex items-center mb-4">
            <Link
              href="/dashboard/facturacion/gestion"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-sm"></span>
            </Link>
          </div>
          <Alert variant="destructive" className="mx-2 sm:mx-0">
            <AlertTriangle className="w-5 h-5" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-4 px-3 sm:px-4">
        {/* Modal de Confirmación - Versión móvil optimizada */}
        {showConfirmationModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-2 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirmar Cancelación
                  </h3>
                </div>
                <button
                  onClick={() => setShowConfirmationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                </button>
              </div>
              
              <div className="p-4 sm:p-6">
                <p className="text-gray-700 mb-4">
                  ¿Está seguro de cancelar la factura de la orden{" "}
                  <span className="font-bold text-gray-900">#{orderNumber}</span>?
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-gray-800 mb-2">
                    Detalles de la factura:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Cliente:</span>
                      <span className="font-medium truncate">
                        {invoiceDetails?.customerName}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">RFC:</span>
                      <span className="font-mono truncate">
                        {invoiceDetails?.rfc}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-xs">Motivo:</span>
                      <span className="font-medium">
                        {cancellationData.motive === "02" 
                          ? "02 - Comprobante con errores sin relación" 
                          : "03 - No se llevó a cabo la operación"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-red-500 mr-2 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      ⚠️ Esta acción es irreversible. Una vez cancelada, la factura no podrá ser utilizada.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmationModal(false)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto sm:flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmCancel}
                  disabled={isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 sm:w-auto sm:flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Confirmar Cancelación"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header optimizado para móvil */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Link
              href="/dashboard/facturacion/gestion"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="text-sm sm:text-base"></span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Cancelar Factura
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Orden #{orderNumber} - {invoiceDetails?.customerName}
          </p>
        </div>

        {success ? (
          <div className="max-w-2xl mx-auto">
            <Card className="mx-2 sm:mx-0">
              <CardContent className="pt-6">
                <div className="text-center py-6 sm:py-8">
                  <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Factura Cancelada Exitosamente
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base mb-6">
                    La factura ha sido cancelada con motivo {cancellationData.motive}.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex flex-col space-y-2">
                      <div>
                        <span className="text-xs text-green-700 font-medium">Motivo:</span>
                        <p className="text-sm mt-1 text-green-800">
                          {cancellationData.motive === "02" 
                            ? "Comprobante con errores sin relación" 
                            : "No se llevó a cabo la operación"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Serás redirigido automáticamente a la gestión de facturación...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            {/* Información de la factura - Versión móvil optimizada */}
            <div className="lg:col-span-2">
              <Card className="mx-2 sm:mx-0">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Información de la Factura
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  {invoiceDetails && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="text-gray-500 text-sm">Cliente</Label>
                          <p className="font-medium truncate">{invoiceDetails.customerName}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">RFC</Label>
                          <p className="font-mono text-sm truncate">{invoiceDetails.rfc}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Razón Social</Label>
                          <p className="font-medium truncate">{invoiceDetails.razonSocial}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Total</Label>
                          <p className="font-bold">${invoiceDetails.total.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500 text-sm">Fecha de Factura</Label>
                          <p className="text-sm">
                            {new Date(invoiceDetails.fechaFactura).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <div>
                        <Label className="text-gray-500 text-sm mb-2 block">
                          Productos
                        </Label>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-60 overflow-y-auto">
                          {invoiceDetails.productos.map((producto: any, index: number) => (
                            <div 
                              key={index} 
                              className="flex flex-col sm:flex-row sm:justify-between py-3 border-b last:border-0"
                            >
                              <div className="mb-2 sm:mb-0">
                                <p className="font-medium text-sm">{producto.nombre}</p>
                                <p className="text-xs text-gray-500">
                                  {producto.cantidad} × ${producto.precioUnitario.toFixed(2)}
                                </p>
                              </div>
                              <p className="font-medium text-sm self-end sm:self-center">
                                ${producto.total.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Formulario de cancelación - Con pills/tabs elegantes */}
            <div>
              <Card className="mx-2 sm:mx-0">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Detalles de Cancelación
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <div className="space-y-5">
                    <Alert variant="destructive" className="text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        Esta acción no se puede deshacer. Una vez cancelada, la factura no podrá ser utilizada.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 text-sm font-medium mb-3 block">
                          Seleccione el motivo de cancelación:
                        </Label>
                        
                        {/* Contenedor de pestañas/pills */}
                        <div className="grid grid-cols-1 gap-3">
                          {/* Motivo 02 */}
                          <div 
                            className={`cursor-pointer transition-all duration-200 ${
                              cancellationData.motive === "02" 
                                ? "ring-2 ring-blue-500 ring-offset-2" 
                                : ""
                            }`}
                            onClick={() => setCancellationData({...cancellationData, motive: "02"})}
                          >
                            <div className={`rounded-lg border p-4 ${
                              cancellationData.motive === "02" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}>
                              <div className="flex items-start">
                                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                                  cancellationData.motive === "02" 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-100 text-gray-400"
                                }`}>
                                  {cancellationData.motive === "02" ? (
                                    <FileX className="w-3.5 h-3.5" />
                                  ) : (
                                    <span className="text-xs font-bold">02</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`font-medium ${
                                      cancellationData.motive === "02" 
                                        ? "text-blue-800" 
                                        : "text-gray-700"
                                    }`}>
                                      Comprobante con errores sin relación
                                    </h4>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                      cancellationData.motive === "02" 
                                        ? "bg-blue-100 text-blue-800" 
                                        : "bg-gray-100 text-gray-600"
                                    }`}>
                                      02
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Use cuando el CFDI contiene errores pero no será reemplazado.
                                    <br />
                                    <span className="text-gray-400">Ej: Error en RFC, dirección, etc.</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Motivo 03 */}
                          <div 
                            className={`cursor-pointer transition-all duration-200 ${
                              cancellationData.motive === "03" 
                                ? "ring-2 ring-blue-500 ring-offset-2" 
                                : ""
                            }`}
                            onClick={() => setCancellationData({...cancellationData, motive: "03"})}
                          >
                            <div className={`rounded-lg border p-4 ${
                              cancellationData.motive === "03" 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}>
                              <div className="flex items-start">
                                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                                  cancellationData.motive === "03" 
                                    ? "bg-blue-500 text-white" 
                                    : "bg-gray-100 text-gray-400"
                                }`}>
                                  {cancellationData.motive === "03" ? (
                                    <FileX className="w-3.5 h-3.5" />
                                  ) : (
                                    <span className="text-xs font-bold">03</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h4 className={`font-medium ${
                                      cancellationData.motive === "03" 
                                        ? "text-blue-800" 
                                        : "text-gray-700"
                                    }`}>
                                      No se llevó a cabo la operación
                                    </h4>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                      cancellationData.motive === "03" 
                                        ? "bg-blue-100 text-blue-800" 
                                        : "bg-gray-100 text-gray-600"
                                    }`}>
                                      03
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Use cuando la operación comercial no se concretó.
                                    <br />
                                    <span className="text-gray-400">Ej: Devolución, pedido no entregado, etc.</span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {error && (
                        <Alert variant="destructive" className="text-sm">
                          <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="pt-2 space-y-2">
                        <Button
                          onClick={handleSubmitClick}
                          disabled={isProcessing || !cancellationData.motive}
                          className="w-full bg-red-600 hover:bg-red-700 text-sm py-2.5"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            "Continuar con Cancelación"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push("/dashboard/facturacion/gestion")}
                          className="w-full text-sm py-2.5"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}