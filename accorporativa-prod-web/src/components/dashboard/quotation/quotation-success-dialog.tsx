"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { FileText, Download, ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuotationPDF } from "@/components/pdf/QuotationPDF";
import type { Tax } from "@/lib/utils/quotationTaxes";

interface Product {
  id: string;
  product: {
    name: string;
    description?: string;
  };
  quantity: number;
  unitPrice: number;
  discount: number;
  notes: string;
  isDiscount?: boolean;
  discountTitle?: string;
  // Campos de descuento específico por producto
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
  // Campos de impuesto (valores calculados para mostrar)
  taxTitle?: string;
  taxType?: string;
  taxValue?: number;
  taxAmount?: number;
  // Objetos completos de impuestos (para que getProductTaxes funcione)
  tax?: Tax;
  tax_id?: string;
  product_taxes?: Tax[];
}

interface QuotationSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationData: {
    quotationNumber?: string;
    quotationId?: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    validFrom: string;
    validUntil: string;
    vendor: string;
    deliveryAddress?: string;
    notes?: string;
    products: Product[];
    subtotal: number;
    discountAmount?: number;
    total: number;
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    companyWebsite?: string;
  };
}

export default function QuotationSuccessDialog({
  open,
  onOpenChange,
  quotationData,
}: QuotationSuccessDialogProps) {
  const router = useRouter();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleContinue = () => {
    onOpenChange(false);
    router.push(`/dashboard/cotizaciones-padre/cotizaciones/ver/${quotationData.quotationId}`);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      // Generar el PDF
      const blob = await pdf(<QuotationPDF quotationData={quotationData} />).toBlob();

      // Crear un enlace temporal y descargarlo
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Cotizacion_${quotationData.quotationNumber || "Nueva"}_${quotationData.clientName.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Pequeño delay antes de redirigir
      setTimeout(() => {
        onOpenChange(false);
        router.push(`/dashboard/cotizaciones-padre/cotizaciones?viewQuotation=${quotationData.quotationId}`);
      }, 500);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Por favor intenta de nuevo.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="quotation-success-description">
        <DialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-500/10 rounded-full mb-4">
            <FileText className="w-6 h-6 text-green-500" />
          </div>
          <DialogTitle className="text-center text-xl">
            ¡Cotización Creada Exitosamente!
          </DialogTitle>
          <DialogDescription id="quotation-success-description" className="text-center">
            La cotización {/*<span className="font-semibold text-white">#{quotationData.quotationNumber || "Nueva"}</span> 
            {" "}*/}para <span className="font-semibold text-white">{quotationData.clientName}</span> ha sido creada. 
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Información resumida */}
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Cliente:</span>
              <span className="text-white font-medium">{quotationData.clientName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total:</span>
              <span className="text-yellow-400 font-bold">
                {new Intl.NumberFormat("es-MX", {
                  style: "currency",
                  currency: "MXN",
                }).format(quotationData.total)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Productos:</span>
              <span className="text-white">
                {quotationData.products.filter((p) => !p.isDiscount).length}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Descargar PDF
                </>
              )}
            </button>

            <button
              onClick={handleContinue}
              disabled={isGeneratingPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-2">
            Puedes descargar el PDF ahora o continuar y hacerlo después
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
