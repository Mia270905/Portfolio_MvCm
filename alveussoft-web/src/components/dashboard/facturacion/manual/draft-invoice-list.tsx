"use client"
import { useState, useEffect } from "react"
import { FileText, Eye, Pencil, Plus, Calendar, DollarSign, CheckCircle2, Search, Printer, MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { QuotationPDF } from "@/components/pdf/QuotationPDF"
import type { DraftInvoice } from "@/lib/actions/manual-billing.actions"
import { getDraftInvoiceById } from "@/lib/actions/manual-billing.actions"
import { getCompanyById } from "@/lib/actions/company.actions"

import { createClient } from "@/lib/supabase/client"

import { getCompanyLogoRecursive } from "@/lib/actions/company.actions"

import { pdf } from "@react-pdf/renderer"
import { toast } from "sonner"
import { ManualInvoicePDF } from "@/components/pdf/FacturacioPDF"
interface DraftInvoiceListProps {
  drafts: DraftInvoice[]
  onCreateNew: () => void
  onView: (draft: DraftInvoice) => void
  onEdit: (draft: DraftInvoice) => void
}
interface InvoiceDataResponse {
  subtotal?: number;
  iva?: number;
  logo_url?: string;
  productos: any[];
  sucursal: {
    id: string;
    name: string;
    street: string;
    address_number: string;
    colony: string;
    city: string;
    zip_code: string;
    phone?: string;
    cellphone?: string;
  } | null;
}
// 🔹 Nuevo componente para formatear fechas solo en cliente
function ClientDate({ dateString }: { dateString: string }) {
  const [formattedDate, setFormattedDate] = useState("")

  useEffect(() => {
    const d = new Date(dateString)
    setFormattedDate(
      d.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    )
  }, [dateString])

  return <span>{formattedDate}</span>
}

export function DraftInvoiceList({ drafts, onCreateNew, onView, onEdit }: DraftInvoiceListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"drafts" | "issued">("drafts")
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null); // Guardamos el ID para saber cuál se está cargando

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",  
      month: "long",
      day: "numeric",
    })
  }
// --- LÓGICA DE GENERACIÓN DE PDF ---


const handleDownloadPDF = async (draft: DraftInvoice) => {
  setIsGeneratingPDF(draft.id);

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
    const response = await getDraftInvoiceById(draft.id);
    
    if (!response || !response.invoiceData) {
      throw new Error("No se encontraron los detalles de la factura");
    }

    const invoiceData = response.invoiceData as InvoiceDataResponse;
    const isEmitted = !!draft.id_facturama;

    // 1. Lógica para la dirección de la empresa (Emisor)
    // Solo se construye si existe al menos la calle o la ciudad
    const sucursal = invoiceData.sucursal;
    let fullCompanyAddress = "";

    if (sucursal && (sucursal.street || sucursal.city)) {
      fullCompanyAddress = [
        sucursal.street,
        sucursal.address_number ? `#${sucursal.address_number}` : "",
        sucursal.colony,
        sucursal.city,
        sucursal.zip_code ? `CP ${sucursal.zip_code}` : ""
      ]
        .filter(Boolean) // Esto quita los null o undefined automáticamente
        .join(", ");
    }

    const companyId = sucursal?.id;
    const companyLogo = companyId 
      ? await getCompanyLogoRecursive(companyId)
      : null;

    const subtotalCalculado = invoiceData.productos.reduce((acc, p) => 
      acc + (p.precioUnitario * p.cantidad - (p.descuento || 0)), 0
    );

    const quotationData = {
      quotationNumber: draft.id.substring(0, 8).toUpperCase(),
      clientName: draft.name || "Cliente",
      clientEmail: (draft as any).email || "",
      clientPhone: (draft as any).phone || "",
      validFrom: formatDateForPDF(draft.created_at),
      validUntil: formatDateForPDF(draft.updated_at || draft.created_at),
      vendor: "Vendedor", 
      // Dirección del cliente
      deliveryAddress: `${draft.street || ""} ${draft.exterior_number || ""}, ${draft.city || ""}`.trim(),
      notes: "Borrador de Factura Manual",
      status: isEmitted ? "accepted" : "pending", 
      products: invoiceData.productos.map((prod) => {
        const lineSubtotal = (prod.precioUnitario * prod.cantidad) - (prod.descuento || 0);
        const taxTotal = prod.impuestos?.reduce((acc: number, tax: any) => {
            const amt = tax.tax_type === "percentage" ? lineSubtotal * (tax.rate / 100) : (tax.rate * prod.cantidad);
            return acc + amt;
        }, 0) || 0;

        return {
          id: prod.productCode,
          product: {
            name: prod.nombre,
            description: "", 
          },
          quantity: prod.cantidad,
          unitPrice: prod.precioUnitario,
          discount: prod.descuento || 0,
          taxAmount: taxTotal,
          total: lineSubtotal + taxTotal,
          taxTitle: prod.impuestos?.[0]?.name,
          taxValue: prod.impuestos?.[0]?.rate,
        };
      }),
      subtotal: subtotalCalculado,
      total: draft.total,
      companyName: sucursal?.name || "ALVEUS SOFT",
      // --- PASAMOS LA DIRECCIÓN PROCESADA ---
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
    toast.error("Error al obtener datos o generar el PDF");
  } finally {
    setIsGeneratingPDF(null);
  }
};

  const filterInvoices = (invoices: DraftInvoice[]) => {
    if (!searchQuery.trim()) return invoices
    const query = searchQuery.toLowerCase()
    return invoices.filter(
      (invoice) => invoice.name.toLowerCase().includes(query) || invoice.rfc.toLowerCase().includes(query),
    )
  }

  const draftInvoices = filterInvoices(drafts.filter((d) => !d.id_facturama))
  const issuedInvoices = filterInvoices(drafts.filter((d) => d.id_facturama))

  const renderInvoiceCard = (invoice: DraftInvoice, isDraft: boolean) => (
  <Card
  key={invoice.id}
  className="group p-5 bg-[#0D121B] border border-gray-800 hover:border-yellow-500/50 transition-all duration-300 print:border-none print:shadow-none print:bg-white"
>
  <div className="flex flex-col gap-5">

    {/* HEADER */}
    <div className="flex justify-between items-start gap-4">

      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-xl shrink-0 ${
            isDraft
              ? "bg-yellow-500/10 text-yellow-500"
              : "bg-emerald-500/10 text-emerald-500"
          }`}
        >
          {isDraft ? (
            <FileText className="w-6 h-6" />
          ) : (
            <CheckCircle2 className="w-6 h-6" />
          )}
        </div>

        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-white group-hover:text-yellow-400 transition-colors print:text-black leading-tight">
            {invoice.name}
          </h3>

          <p className="text-xs text-yellow-500/90 font-medium flex items-center gap-1 mt-1">
            <span className="opacity-70">Sucursal:</span>
            {(invoice as any).company?.name || "Sucursal no definida"}
          </p>

          <p className="text-sm font-mono text-gray-500 uppercase mt-1">
            {invoice.rfc}
          </p>
        </div>
      </div>

      {/* STATUS */}
      <div className="flex items-start print:hidden">
        <Badge
          variant={isDraft ? "outline" : "default"}
          className={
            isDraft
              ? "border-yellow-500/50 text-yellow-500"
              : "bg-emerald-600"
          }
        >
          {isDraft ? "Borrador" : "Emitida"}
        </Badge>
      </div>
    </div>

    {/* INFO GRID */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4 border-y border-gray-800/50 print:border-gray-200">

      {/* FECHA */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
          Fecha de creación
        </p>

        <div className="flex items-center gap-2 text-gray-300 print:text-black">
          <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
          <span className="text-sm">{formatDate(invoice.created_at)}</span>
        </div>
      </div>

      {/* TOTAL */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
          Monto Total
        </p>

        <div className="flex items-center gap-2 text-yellow-500 font-semibold print:text-black">
          <DollarSign className="w-4 h-4 shrink-0" />
          <span className="text-lg">{formatCurrency(invoice.total)}</span>
        </div>
      </div>

      {/* UBICACION */}
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
          Ubicación
        </p>

        <div className="flex items-start gap-2 text-gray-400 print:text-black">
          <MapPin className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
          <span className="text-xs italic leading-relaxed">
            {invoice.neighborhood}, {invoice.city}, CP {invoice.zip_code}
          </span>
        </div>
      </div>

    </div>

    {/* FOOTER ACTIONS */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 print:hidden">

      <div className="flex gap-2">
        <Badge
          variant="secondary"
          className="bg-gray-800 text-gray-400 hover:bg-gray-700"
        >
          {invoice.payment_type === "efectivo"
            ? "Efectivo"
            : "Transferencia"}
        </Badge>
      </div>

      <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(invoice)}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={isGeneratingPDF === invoice.id}
          onClick={() => handleDownloadPDF(invoice)}
          className="border-gray-700 hover:bg-white hover:text-black min-w-[120px]"
        >
          {isGeneratingPDF === invoice.id ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Printer className="w-4 h-4 mr-2" />
          )}

          {isGeneratingPDF === invoice.id
            ? "Cargando..."
            : "Imprimir"}
        </Button>

        {isDraft && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(invoice)}
            className="text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10"
          >
            <Pencil className="w-4 h-4 mr-2" />
            Editar
          </Button>
        )}
      </div>
    </div>

  </div>
</Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 print:hidden">
        <Button onClick={onCreateNew} className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 shadow-[0_0_20px_rgba(234,179,8,0.2)] ml-auto">
          <Plus className="w-5 h-5" />
          Nuevo Borrador
        </Button>
      </div>

      <div className="relative group print:hidden">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-yellow-500 transition-colors w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar por cliente o RFC..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#0A0F17] border-gray-800 focus:border-yellow-500/50 transition-all"
        />
      </div>

      {drafts.length === 0 ? (
        <Card className="p-16 bg-[#0A0F17] border-dashed border-gray-800 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-gray-900/50 p-6 rounded-full mb-4">
              <FileText className="w-12 h-12 text-gray-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin registros</h3>
            <p className="text-gray-500 mb-8 max-w-sm">No hay facturas en el sistema.</p>
            <Button onClick={onCreateNew} variant="outline" className="border-gray-700 hover:bg-gray-800">
              Crear mi primera factura
            </Button>
          </div>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "drafts" | "issued")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0A0F17] border border-gray-800 p-1 print:hidden">
            <TabsTrigger value="drafts" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black transition-all">
              Borradores ({draftInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="issued" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all">
              Emitidas ({issuedInvoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="space-y-4 mt-6">
            <div className="grid gap-4 print:block">
              {draftInvoices.length === 0 ? (
                <div className="py-20 text-center text-gray-500 italic">No se encontraron borradores</div>
              ) : (
                draftInvoices.map((draft) => renderInvoiceCard(draft, true))
              )}
            </div>
          </TabsContent>

          <TabsContent value="issued" className="space-y-4 mt-6">
            <div className="grid gap-4">
              {issuedInvoices.length === 0 ? (
                <div className="py-20 text-center text-gray-500 italic">No hay facturas emitidas</div>
              ) : (
                issuedInvoices.map((invoice) => renderInvoiceCard(invoice, false))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <style jsx global>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:border-none { border: none !important; }
        }
      `}</style>
    </div>
  )
}

function calculateProductTaxes(prod: any) {
  throw new Error("Function not implemented.")
}
