"use client"

import { getInvoicePDF, getInvoiceXML } from "@/lib/actions/invoices.actions";
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, FileText, FileCode, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DescargarFacturaPage() {
  const params = useParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Preparando descarga de facturas...")
  const [downloadedFiles, setDownloadedFiles] = useState<string[]>([])
  const facturamaId = params.id as string

  // Función para descargar archivo desde base64
  const downloadBase64File = (base64Data: string, filename: string, mimeType: string) => {
    try {
      // Decodificar base64
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Crear y activar descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error("Error al procesar archivo base64:", error);
      return false;
    }
  }

  useEffect(() => {
    const downloadInvoices = async () => {
      if (!facturamaId) {
        setStatus("error")
        setMessage("ID de factura no válido")
        return
      }

      try {
        setMessage("Descargando PDF...")

        // Descargar PDF
        const pdfResult = await getInvoicePDF(facturamaId)
        
        if (!pdfResult.ok || !pdfResult.pdfBase64) {
          throw new Error(pdfResult.error || "Error al descargar PDF")
        }

        // Descargar archivo PDF
        const pdfDownloaded = downloadBase64File(
          pdfResult.pdfBase64, 
          `factura-${facturamaId}.pdf`,
          'application/pdf'
        );

        if (!pdfDownloaded) {
          throw new Error("No se pudo descargar el PDF");
        }

        setDownloadedFiles((prev) => [...prev, "PDF"])
        setMessage("Descargando XML...")

        // Pequeña pausa para mejor UX
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Descargar XML
        const xmlResult = await getInvoiceXML(facturamaId);
        
        if (!xmlResult.ok || !xmlResult.xmlBase64) {
          throw new Error(xmlResult.error || "Error al descargar XML")
        }

        // Descargar archivo XML
        const xmlDownloaded = downloadBase64File(
          xmlResult.xmlBase64,
          `factura-${facturamaId}.xml`,
          'application/xml'
        );

        if (!xmlDownloaded) {
          throw new Error("No se pudo descargar el XML");
        }

        setDownloadedFiles((prev) => [...prev, "XML"])
        setStatus("success")
        setMessage("¡Facturas descargadas exitosamente!")
        
        setTimeout(() => {
          router.push("/");
        }, 10000);
        
      } catch (error) {
        console.error("Error descargando facturas:", error)
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "Ocurrió un error al descargar las facturas. Por favor intenta nuevamente.")
      }
    }

    downloadInvoices()
  }, [facturamaId, router])

  return (
    <div className="min-h-screen bg-lineal-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Descargando Facturas</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              {downloadedFiles.length > 0 && (
                <div className="space-y-2 mt-4">
                  {downloadedFiles.map((file) => (
                    <div key={file} className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">{file} descargado</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Descarga Completa!</h1>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500 mb-6">Serás redirigido automáticamente en 10 segundos...</p>
              <div className="space-y-2 mb-6">
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Factura PDF</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <FileCode className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Factura XML</span>
                </div>
              </div>
              <Button onClick={() => router.push("/")} className="w-full bg-blue-600 hover:bg-blue-700">
                Volver al inicio
              </Button>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700">
                  Reintentar
                </Button>
                <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                  Volver al inicio
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">ID de Factura: {facturamaId}</p>
        </div>
      </div>
    </div>
  )
}