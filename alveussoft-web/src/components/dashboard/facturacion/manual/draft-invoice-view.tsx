"use client";

import {
  ArrowLeft,
  FileText,
  MapPin,
  CreditCard,
  Send,
  AlertCircle,
  Download,
  Loader2,
  DollarSign,
  Landmark,
  HelpCircle,
  Gift,
  Wallet,
  Printer,
} from "lucide-react";
// ... tus otras importaciones
import { pdf } from "@react-pdf/renderer";
import { ManualInvoicePDF } from "@/components/pdf/FacturacioPDF";
import { getDraftInvoiceById } from "@/lib/actions/manual-billing.actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import type { DraftInvoice } from "@/lib/actions/manual-billing.actions";
import type {
  ManualInvoiceData,
  ProductoConImpuestos,
  ImpuestoCalculado,
} from "@/lib/actions/manual-billing.actions";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadInvoicePDF } from "@/lib/utils/download-pdf";
import { downloadInvoiceXML } from "@/lib/utils/download-xml";
import { getInvoicePDF, getInvoiceXML } from "@/lib/actions/invoices.actions";
import { parseFacturamaErrors } from "@/lib/actions/billing.actions";
import { QuotationPDF } from "@/components/pdf/QuotationPDF";
import { getCompanyById, getCompanyLogoRecursive } from "@/lib/actions/company.actions";
import { getProductTaxes } from "@/lib/utils/quotationTaxes";


const PAYMENT_METHODS_CONFIG: Record<string, { label: string, color: string, icon: any }> = {
  efectivo: { label: "Efectivo", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", icon: DollarSign },
  transferencia: { label: "Transferencia", color: "text-blue-400 bg-blue-500/10 border-blue-500/20", icon: Landmark },
  tarjeta_credito: { label: "T. Crédito", color: "text-purple-400 bg-purple-500/10 border-purple-500/20", icon: CreditCard },
  tarjeta_debito: { label: "T. Débito", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20", icon: CreditCard },
  cheque: { label: "Cheque", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: FileText },
  por_definir: { label: "Por Definir", color: "text-orange-400 bg-orange-500/10 border-orange-500/20", icon: HelpCircle },
  vales: { label: "Vales", color: "text-pink-400 bg-pink-500/10 border-pink-500/20", icon: Gift },
  // Default para los demás
  default: { label: "Otro", color: "text-gray-400 bg-gray-500/10 border-gray-500/20", icon: Wallet }
};

interface DraftInvoiceViewProps {
  draft: DraftInvoice;
  invoiceData: ManualInvoiceData;
  onBack: () => void;
  onEdit: () => void;
  onEmit?: (
    id: string,
    data: ManualInvoiceData,
  ) => Promise<{ ok: boolean; cfdiId?: string; error?: any }>;
}

interface CalculosProducto {
  subtotal: number;
  total: number;
  impuestos: ImpuestoCalculado[];
  tieneImpuestos: boolean;
}

interface CalculosFactura {
  subtotalFactura: number;
  totalImpuestos: number;
  totalFactura: number;
}

export function DraftInvoiceView({
  draft,
  invoiceData,
  onBack,
  onEdit,
  onEmit,
}: DraftInvoiceViewProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [isEmitting, setIsEmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [emitError, setEmitError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isDataComplete = () => {
    if (!invoiceData) return false;

    const hasBasicInfo =
      draft.rfc && draft.name && draft.tax_regime && draft.cfdi_use;
    const hasAddress =
      draft.street &&
      draft.exterior_number &&
      draft.neighborhood &&
      draft.city &&
      draft.zip_code;
    const hasPaymentInfo = draft.payment_type;
    const hasProducts =
      invoiceData.productos && invoiceData.productos.length > 0;
    const hasValidTotals = draft.total > 0;

    return (
      hasBasicInfo &&
      hasAddress &&
      hasPaymentInfo &&
      hasProducts &&
      hasValidTotals
    );
  };
  
  
const handleDownloadPDF = async () => {
    if (!draft || !invoiceData) return;

    setIsGeneratingPDF("generating");

    // Helper interno para formatear fechas a string legible
    const formatDateForPDF = (dateSource: string | Date) => {
      const d = new Date(dateSource);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    try {
      const companyId = invoiceData.sucursal?.id;
      const sucursal = invoiceData.sucursal;

      // --- LÓGICA DE DIRECCIÓN LIMPIA ---
      let fullCompanyAddress = "";
      if (sucursal && (sucursal.street || sucursal.city)) {
        fullCompanyAddress = [
          sucursal.street,
          sucursal.address_number ? `#${sucursal.address_number}` : "",
          sucursal.colony,
          sucursal.city,
          sucursal.zip_code ? `CP ${sucursal.zip_code}` : ""
        ]
          .filter(Boolean) // Quita null, undefined o vacíos
          .join(", ");
      }

      const companyLogo = companyId 
        ? await getCompanyLogoRecursive(companyId)
        : null;

      const quotationData = {
        quotationNumber: draft.id.substring(0, 8).toUpperCase(),
        clientName: draft.name || "Cliente",
        clientEmail: (draft as any).email || "",
        clientPhone: (draft as any).phone || "",
        
        // --- FORMATEO DE FECHAS ---
        validFrom: formatDateForPDF(draft.created_at),
        validUntil: formatDateForPDF(draft.updated_at || draft.created_at),
        // --------------------------

        vendor: "Vendedor", 
        deliveryAddress: `${draft.street || ""} ${draft.exterior_number || ""}, ${draft.city || ""}`.trim(),
        notes: "Borrador de Factura Manual",
        status: isEmitted ? "accepted" : "pending", 
        products: invoiceData.productos.map((prod) => {
          const calculos = calculateProductTaxes(prod);
          return {
            id: prod.productCode,
            product: {
              name: prod.nombre,
              description: "", 
            },
            quantity: prod.cantidad,
            unitPrice: prod.precioUnitario,
            discount: prod.descuento || 0,
            taxAmount: calculos.total - (prod.precioUnitario * prod.cantidad - (prod.descuento || 0)),
            total: calculos.total,
            taxTitle: prod.impuestos?.[0]?.name,
            taxValue: prod.impuestos?.[0]?.rate,
          };
        }),
        subtotal: subtotalFactura,
        total: totalFactura,
        companyName: sucursal?.name || "ALVEUS SOFT",
        
        // --- DIRECCIÓN PROCESADA ---
        companyAddress: fullCompanyAddress || undefined, 
        
        companyLogo: companyLogo || undefined,
        clientRfc: draft.rfc,
        taxRegime: draft.tax_regime,
        cfdiUse: draft.cfdi_use,
      };

      const blob = await pdf(<ManualInvoicePDF quotationData={quotationData as any} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Previsualizacion_${draft.rfc}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("Vista previa generada");
    } catch (error) {
      console.error("Error generando PDF:", error);
      toast.error("Error al generar el PDF");
    } finally {
      setIsGeneratingPDF(null);
    }
  };
  
  const confirmEmitInvoice = () => {
    if (isDataComplete()) {
      setShowConfirmDialog(true);
      setEmitError(null);
    } else {
      const errorMsg =
        "Complete todos los datos requeridos antes de emitir la factura";
      setEmitError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Función para descargar documentos de factura emitida
  const downloadInvoiceDocuments = async (cfdiId: string) => {
    setIsDownloading(true);

    try {
      // Descargar PDF
      const pdfResult = await getInvoicePDF(cfdiId);
      if (pdfResult.ok && pdfResult.pdfBase64) {
        const fileName = `Factura-${cfdiId}.pdf`;
        downloadInvoicePDF(pdfResult.pdfBase64, fileName);
      }

      // Esperar un momento antes de descargar el XML
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Descargar XML
      const xmlResult = await getInvoiceXML(cfdiId);
      if (xmlResult.ok && xmlResult.xmlBase64) {
        const fileName = `Factura-${cfdiId}.xml`;
        downloadInvoiceXML(xmlResult.xmlBase64, fileName);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Parsea el error y lo convierte a string para mostrar
   */
  const parseErrorToString = async (err: any): Promise<string> => {
    if (err === null || err === undefined) {
      return "Error desconocido";
    }

    if (typeof err === "string") {
      return err;
    }

    if (typeof err === "object") {
      try {
        const parsedErrors = await parseFacturamaErrors(err);
        if (parsedErrors && parsedErrors.length > 0) {
          return parsedErrors.join(". ");
        }
      } catch {
        // Continuar si falla
      }

      if (err.Message && typeof err.Message === "string") {
        return err.Message;
      }
      if (err.message && typeof err.message === "string") {
        return err.message;
      }

      try {
        return JSON.stringify(err);
      } catch {
        return "Error al procesar la respuesta del servidor";
      }
    }

    return String(err);
  };

  /**
   * Muestra errores en toast con formato legible
   */
  const showErrorToast = (errors: string[], title?: string) => {
    if (!errors || errors.length === 0) return;

    if (errors.length === 1) {
      toast.error(errors[0], { duration: 8000 });
    } else {
      toast.error(
        <div>
          <p className="font-medium mb-2">{title || "Errores:"}</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>,
        { duration: 10000 },
      );
    }
  };

  const handleEmitInvoice = async () => {
    if (!onEmit || !isDataComplete()) {
      const errorMsg =
        "No se puede emitir la factura. Verifique que todos los datos estén completos.";
      setEmitError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setShowConfirmDialog(false);
    setIsEmitting(true);
    setEmitError(null);

    try {
      const result = await onEmit(draft.id, invoiceData);

      if (result.ok && result.cfdiId) {
        // Descargar automáticamente PDF y XML
        await downloadInvoiceDocuments(result.cfdiId);

        toast.success("Factura emitida y documentos descargados exitosamente");

        // Redirigir después de un breve tiempo
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        // Parsear errores de Facturama
        let errorsToShow: string[] = [];

        if (result.error) {
          if (typeof result.error === "string") {
            try {
              const parsed = JSON.parse(result.error);
              errorsToShow = await parseFacturamaErrors(parsed);
            } catch {
              errorsToShow = [result.error];
            }
          } else if (typeof result.error === "object") {
            errorsToShow = await parseFacturamaErrors(result.error);
          }
        }

        // Asegurar que todos sean strings
        errorsToShow = errorsToShow
          .map((e) => (typeof e === "string" ? e : String(e)))
          .filter((e) => e && e.trim() !== "");

        if (errorsToShow.length === 0) {
          errorsToShow = ["Error desconocido al emitir la factura"];
        }

        // Mostrar errores en toast
        showErrorToast(errorsToShow, "Error al emitir factura:");

        // Guardar error como string para el estado
        const errorMsg = errorsToShow.join(". ");
        setEmitError(errorMsg);
      }
    } catch (error) {
      const errorMsg = await parseErrorToString(error);
      setEmitError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsEmitting(false);
    }
  };

  // Función para descargar documentos si la factura ya está emitida
  const handleDownloadEmittedDocuments = async () => {
    if (!draft.id_facturama) {
      toast.error("Esta factura no ha sido emitida");
      return;
    }

    toast.info("Descargando documentos de factura emitida...");
    await downloadInvoiceDocuments(draft.id_facturama);
    toast.success("Documentos descargados exitosamente");
  };

  const isEmitted = !!draft.id_facturama;

  // Función para calcular los impuestos de manera consistente
  const calculateProductTaxes = (
    producto: ProductoConImpuestos,
  ): CalculosProducto => {
    const {
      cantidad,
      precioUnitario,
      descuento = 0,
      impuestos = [],
    } = producto;

    const subtotal = precioUnitario * cantidad - descuento;

    let totalImpuestos = 0;
    const impuestosCalculados: ImpuestoCalculado[] = [];

    if (impuestos && impuestos.length > 0) {
      impuestos.forEach((tax) => {
        let amount: number;
        if (tax.tax_type === "percentage") {
          amount = subtotal * (tax.rate / 100);
        } else {
          amount = tax.rate * cantidad;
        }
        totalImpuestos += amount;
        impuestosCalculados.push({
          ...tax,
          amount: parseFloat(amount.toFixed(2)),
        });
      });
    }

    const total = subtotal + totalImpuestos;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      impuestos: impuestosCalculados,
      tieneImpuestos: impuestos.length > 0,
    };
  };

  // Función para calcular los impuestos para la vista (sin modificar los datos originales)
  const getCalculatedTaxesForDisplay = (
    producto: ProductoConImpuestos,
  ): CalculosProducto => {
    return calculateProductTaxes(producto);
  };

  // Calcular totales para mostrar en el resumen
  const calculateInvoiceTotalsForDisplay = (): CalculosFactura => {
    let subtotalFactura = 0;
    let totalImpuestos = 0;

    invoiceData.productos.forEach((producto) => {
      const calculos = calculateProductTaxes(producto);
      subtotalFactura += calculos.subtotal;
      totalImpuestos += calculos.total - calculos.subtotal;
    });

    const totalFactura =
      subtotalFactura + totalImpuestos + (invoiceData.costoEnvio || 0);

    return {
      subtotalFactura: parseFloat(subtotalFactura.toFixed(2)),
      totalImpuestos: parseFloat(totalImpuestos.toFixed(2)),
      totalFactura: parseFloat(totalFactura.toFixed(2)),
    };
  };

  // Calcular totales desglosados
  const { subtotalFactura, totalImpuestos, totalFactura } =
    calculateInvoiceTotalsForDisplay();

  // Calcular total de impuestos porcentuales
  const totalPercentageTaxes = invoiceData.productos.reduce(
    (total: number, producto: ProductoConImpuestos) => {
      if (!producto.impuestos) return total;
      const calculos = calculateProductTaxes(producto);
      return (
        total +
        calculos.impuestos
          .filter((imp) => imp.tax_type === "percentage")
          .reduce((sum, imp) => sum + imp.amount, 0)
      );
    },
    0,
  );

  // Calcular total de impuestos fijos
  const totalFixedTaxes = invoiceData.productos.reduce(
    (total: number, producto: ProductoConImpuestos) => {
      if (!producto.impuestos) return total;
      const calculos = calculateProductTaxes(producto);
      return (
        total +
        calculos.impuestos
          .filter((imp) => imp.tax_type === "fixed_amount")
          .reduce((sum, imp) => sum + imp.amount, 0)
      );
    },
    0,
  );

  // Filtrar impuestos por tipo
  const getPercentageTaxes = (
    impuestos: ImpuestoCalculado[],
  ): ImpuestoCalculado[] => {
    return impuestos.filter((imp) => imp.tax_type === "percentage");
  };

  const getFixedTaxes = (
    impuestos: ImpuestoCalculado[],
  ): ImpuestoCalculado[] => {
    return impuestos.filter((imp) => imp.tax_type === "fixed_amount");
  };

  // Calcular total de impuestos fijos
  const calculateFixedTaxesTotal = (impuestos: ImpuestoCalculado[]): number => {
    return getFixedTaxes(impuestos).reduce((sum, imp) => sum + imp.amount, 0);
  };

  // Verificar estado actual
  const isFormComplete = isDataComplete();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </Button>
        <div className="flex gap-2">
          {isEmitted && (
            <Button
              onClick={handleDownloadEmittedDocuments}
              disabled={isDownloading}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Descargando..." : "Descargar Factura"}
            </Button>
          )}
          {!isEmitted && (
            <Button onClick={onEdit} variant="outline">
              Editar Borrador
            </Button>
          )}
          {!isEmitted && onEmit && (
            <Button
              onClick={confirmEmitInvoice}
              disabled={!isFormComplete || isEmitting || isDownloading}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
              {isEmitting ? "Emitiendo..." : "Emitir Factura"}
            </Button>
          )}
        </div>
      </div>

      {/* Solo mostrar error si no está en proceso de emisión */}
      {emitError && !isEmitting && !isDownloading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <div className="font-medium">Error</div>
          </div>
          <div className="text-sm text-red-700 mt-1">{emitError}</div>
        </div>
      )}

      {!isEmitted && !isFormComplete && !isEmitting && !isDownloading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <div className="font-medium">Atención</div>
          </div>
          <div className="text-sm text-yellow-700 mt-1">
            Complete todos los datos requeridos antes de emitir la factura.
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Verifique: RFC, Razón Social, Dirección completa, Productos y Total
            válido.
          </div>
        </div>
      )}

   <Card className="overflow-hidden border border-gray-800 shadow-2xl bg-[#0f172a] rounded-2xl text-gray-100">
  {/* Header con gradiente que combina con tu interfaz */}
  <div className="bg-gradient-to-r from-[#1e293b] to-[#0f172a] p-8 border-b border-gray-800">
    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${isEmitted ? "bg-green-500/10" : "bg-amber-500/10"}`}>
            <FileText className={`w-6 h-6 ${isEmitted ? "text-green-400" : "text-amber-400"}`} />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white">{draft.name}</h2>
          <span className={`ml-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isEmitted ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-amber-500 text-black"
          }`}>
            {isEmitted ? "Emitida" : "Borrador"}
          </span>
        </div>

        <p className="text-gray-400 font-mono text-sm tracking-wider">RFC: {draft.rfc}</p>
        <br />
        <br />
           <p className="text-[10px] text-amber-500/50 uppercase font-black tracking-[0.3em] leading-none mb-1 block">
            {invoiceData?.sucursal?.name || "ALVEUS SOFT"}
          </p>
      </div>
      
      {isEmitted && draft.id_facturama && (
        <div className="text-right bg-black/20 p-3 rounded-xl border border-white/5">
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">ID Facturama</p>
          <p className="text-sm font-mono text-blue-400">{draft.id_facturama}</p>
        </div>
      )}
    </div>
  </div>

  <div className="p-8 space-y-8">
    {/* Sección de Información con tarjetas oscuras */}
    <div className="grid md:grid-cols-2 gap-6">
      <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Información Fiscal
        </h3>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
          <div>
            <span className="block text-gray-500 text-xs mb-1 uppercase">Régimen</span>
            <p className="font-medium text-gray-200">{draft.tax_regime}</p>
          </div>
          <div>
            <span className="block text-gray-500 text-xs mb-1 uppercase">Uso CFDI</span>
            <p className="font-medium text-gray-200">{draft.cfdi_use}</p>
          </div>
          <div className="col-span-2 mt-2 pt-2 border-t border-white/5">
            <span className="block text-gray-500 text-xs mb-1 uppercase">Dirección</span>
            <p className="font-medium text-gray-300 leading-relaxed">
              {draft.street} {draft.exterior_number} {draft.interior_number && `Int. ${draft.interior_number}`}<br />
              <span className="text-gray-400">{draft.neighborhood}, {draft.city}, CP: {draft.zip_code}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Detalles de Pago
        </h3>
        <div className="space-y-4 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-white/5">
          <span className="text-gray-500 uppercase text-[10px] font-bold tracking-widest">
            Método
          </span>
          
          {(() => {
            // Buscamos la configuración basada en el valor de la base de datos
            const methodKey = draft.payment_type;
            const config = PAYMENT_METHODS_CONFIG[methodKey] || PAYMENT_METHODS_CONFIG.default;
            const Icon = config.icon;

            return (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-tight shadow-sm ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </div>
            );
          })()}
        </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase text-xs">Creación</span>
            <span className="font-medium text-gray-300">{formatDate(draft.created_at)}</span>
          </div>
          {draft.updated_at && (
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-gray-500 uppercase text-xs">Actualización</span>
              <span className="font-medium text-gray-300">{formatDate(draft.updated_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Tabla de Productos Dark */}
    <div>
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Conceptos de Factura</h3>
      <div className="overflow-hidden border border-white/10 rounded-xl bg-black/20">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-4 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Cant.</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoiceData.productos.map((producto, index) => {
              const calculos = getCalculatedTaxesForDisplay(producto);
              return (
                <tr key={index} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-200 group-hover:text-amber-400 transition-colors">{producto.nombre}</p>
                    <p className="text-[10px] text-gray-500 font-mono tracking-tighter">{producto.productCode}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-400">{producto.cantidad}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-400">{formatCurrency(producto.precioUnitario)}</td>
                  <td className="px-6 py-4 text-right font-bold text-white">{formatCurrency(calculos.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* Footer de Totales */}
<div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 border-t border-white/10">
  <div className="hidden md:flex flex-col gap-3">

   <Button
      type="button"
      variant="ghost"
      onClick={handleDownloadPDF}
      disabled={isGeneratingPDF !== null || isEmitting}
      title="Imprimir Vista Previa"
      className="relative h-12 w-12 rounded-xl border border-slate-800 bg-slate-900/50 text-slate-500 
      transition-all duration-300 hover:border-amber-500/40 hover:text-amber-500 
      hover:bg-amber-500/5 active:scale-95 disabled:opacity-50 shadow-sm"
    >
      {isGeneratingPDF ? (
        <Loader2 className="h-6 w-6 animate-spin" />
      ) : (
        <Printer className="h-6 w-6" />
      )}
      
      {/* Indicador de carga sutil mejorado para el nuevo tamaño */}
      {isGeneratingPDF && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
        </span>
      )}
    </Button>
  </div>

  {/* Aquí sigue tu div de Totales (Subtotal, Impuestos, Total Naranja) */}

      
      <div className="w-full md:w-80 space-y-3">
        <div className="flex justify-between text-sm text-gray-400">
          <span>Subtotal</span>
          <span className="font-medium text-gray-200">{formatCurrency(subtotalFactura)}</span>
        </div>
        {totalImpuestos > 0 && (
          <div className="flex justify-between text-sm text-gray-400">
            <span>Impuestos</span>
            <span className="font-medium text-gray-200">{formatCurrency(totalImpuestos)}</span>
          </div>
        )}
        <div className="flex justify-between items-center p-5 bg-amber-500 rounded-xl text-black shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <span className="text-xs font-black uppercase tracking-wider">Total </span>
          <span className="text-2xl font-black">{formatCurrency(totalFactura)}</span>
        </div>
      </div>
    </div>
  </div>
</Card>

    <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
  <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-slate-800 bg-[#1a1c23] shadow-2xl">
    
    {/* Header con gradiente sutil de advertencia */}
    <div className="relative pt-8 pb-6 px-6 text-center">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
        <AlertCircle className="h-7 w-7 text-amber-500" />
      </div>
      <DialogTitle className="text-2xl font-bold text-white tracking-tight">
        Confirmar Emisión
      </DialogTitle>
      <p className="mt-2 text-sm text-slate-400">
        Estás a punto de generar el timbre fiscal. <br/>
        <span className="text-amber-500/90 font-medium">Esta acción es irreversible.</span>
      </p>
    </div>

    {/* Cuerpo del Modal - Estilo Glassmorphism / Dark */}
    <div className="px-6 pb-8">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-5 backdrop-blur-sm">
        <div className="space-y-4">
          
          {/* Fila Cliente */}
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Receptor</span>
            <div className="text-right">
              <p className="text-sm font-bold text-slate-200 leading-tight">{draft.name}</p>
              <code className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-amber-400 border border-slate-700">
                {draft.rfc}
              </code>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {/* Fila Conceptos */}
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Detalles</span>
            <span className="text-sm font-medium text-slate-300">
              {invoiceData.productos.length} {invoiceData.productos.length === 1 ? 'Concepto' : 'Conceptos'}
            </span>
          </div>

          {/* Fila Total - Destacada */}
          <div className="mt-2 pt-3 flex justify-between items-center border-t border-slate-700">
            <span className="text-sm font-bold text-white">Total a Pagar</span>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 tracking-tighter">
                {formatCurrency(totalFactura)}
              </span>
              <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">MXN Moneda Nacional</p>
            </div>
            
          </div>
        </div>
      </div>
    </div>

    {/* Footer con Botones mejorados */}
    <DialogFooter className="bg-slate-900/50 p-4 flex flex-row gap-3 border-t border-slate-800">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setShowConfirmDialog(false)}
        className="flex-1 text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
        disabled={isEmitting || isDownloading}
      >
        Regresar
      </Button>
      <Button
        type="button"
        onClick={handleEmitInvoice}
        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all active:scale-[0.97]"
        disabled={isEmitting || isDownloading}
      >
        {isEmitting || isDownloading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Procesando...</span>
          </div>
        ) : (
          "Emitir Ahora"
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
      </div>
    );
  }
