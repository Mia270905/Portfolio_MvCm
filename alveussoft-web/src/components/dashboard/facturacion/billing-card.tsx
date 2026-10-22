"use client"

import type { BillingTableData } from "./billing-container"
import { 
  FileText, 
  FileCode, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Calendar, 
  User, 
  CreditCard, 
  Share2, 
  MoreVertical,
  X,
  RefreshCw // Icono para remplazar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { InvoiceOrderModal } from "./invoice-order-modal"
import { ShareWhatsAppModal } from "./share-whatsapp-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface BillingCardProps {
  order: BillingTableData
  onRefresh: () => void
  onDownloadPDF: (order: BillingTableData) => void
  onDownloadXML: (order: BillingTableData) => void
  downloadingPDF: string | null
  downloadingXML: string | null
  permissions?: {
    canUpdate: boolean
    canDelete: boolean
    canDownloadPDF: boolean
    canDownloadXML: boolean
    canShare: boolean
  }
  onCancelClick?: (order: BillingTableData) => void
}

export function BillingCard({
  order,
  onDownloadPDF,
  onDownloadXML,
  downloadingPDF,
  downloadingXML,
  onRefresh,
  permissions = {
    canUpdate: true,
    canDelete: true,
    canDownloadPDF: true,
    canDownloadXML: true,
    canShare: true,
  },
}: BillingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<BillingTableData | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const router = useRouter()

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "N/A"
    }
  }

  // Función para manejar el remplazo
  const handleReplaceAction = () => {
    // Redirigir a la pantalla de remplazo
    router.push(
      `/dashboard/facturacion/gestion/reemplazar/${order.order_number}`,
    )
  }

  // Función para mostrar que cancelar no está disponible
  const handleCancelNotAvailable = () => {
    alert("La funcionalidad de cancelación está temporalmente deshabilitada. Por favor, use la opción 'Remplazar' en su lugar.")
  }

  return (
    <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-4 shadow-sm hover:shadow-md hover:border-yellow-400/30 transition-all duration-200">
      {/* Header - Información principal */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-4 h-4 text-gray-500" />
            <h3 className="font-bold text-white text-lg">Orden #{order.order_number}</h3>
          </div>

          <div className="flex items-center gap-2">
            {order.has_invoice ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Facturada</span>
                {order.billing_info?.id_facrutama && (
                  <Badge variant="outline" className="text-xs py-0 h-5">
                    ID: {order.billing_info.id_facrutama.slice(0, 8)}...
                  </Badge>
                )}
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Por Facturar</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-yellow-400 h-8 w-8 p-0"
          >
            {isExpanded ? "Menos" : "Más"}
          </Button>

          {/* Botón de menú desplegable */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-400 hover:text-yellow-400"
                title="Acciones"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {order.has_invoice ? (
                <>
                  {permissions.canDownloadPDF && (
                    <DropdownMenuItem
                      onClick={() => onDownloadPDF(order)}
                      disabled={downloadingPDF === order.billing_info?.id_facrutama}
                      className="text-yellow-400 hover:text-yellow-300 focus:text-yellow-300 focus:bg-yellow-400/10"
                    >
                      {downloadingPDF === order.billing_info?.id_facrutama ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      Descargar PDF
                    </DropdownMenuItem>
                  )}

                  {permissions.canDownloadXML && (
                    <DropdownMenuItem
                      onClick={() => onDownloadXML(order)}
                      disabled={downloadingXML === order.billing_info?.id_facrutama}
                      className="text-green-400 hover:text-green-300 focus:text-green-300 focus:bg-green-400/10"
                    >
                      {downloadingXML === order.billing_info?.id_facrutama ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileCode className="w-4 h-4 mr-2" />
                      )}
                      Descargar XML
                    </DropdownMenuItem>
                  )}

                  {permissions.canShare && (
                    <DropdownMenuItem
                      onClick={() => setShareModalOpen(true)}
                      className="text-emerald-400 hover:text-emerald-300 focus:text-emerald-300 focus:bg-emerald-400/10"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir por WhatsApp
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />

                  {/* Nuevo botón de Remplazar */}
                  <DropdownMenuItem
                    onClick={handleReplaceAction}
                    className="text-purple-400 hover:text-purple-300 focus:text-purple-300 focus:bg-purple-400/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Remplazar
                  </DropdownMenuItem>

                  {/* Botón Cancelar (sin funcionalidad) */}
                  <DropdownMenuItem
                    onClick={handleCancelNotAvailable}
                    className="text-gray-600 hover:text-gray-500 focus:text-gray-500 focus:bg-gray-800/50 cursor-not-allowed"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar (No disponible)
                  </DropdownMenuItem>
                </>
              ) : (
                permissions.canUpdate && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedOrder(order)
                      setInvoiceModalOpen(true)
                    }}
                    className="text-orange-400 hover:text-orange-300 focus:text-orange-300 focus:bg-orange-400/10"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Generar Factura
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Información básica */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-gray-400">{formatDateTime(order.created_at)}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-500" />
          <div className="min-w-0">
            <div className="font-medium text-white truncate">{order.user_name || "Cliente no especificado"}</div>
            {order.user_email && <div className="text-gray-500 text-xs truncate">{order.user_email}</div>}
        </div>
      </div>
    </div>

    {/* Información expandida */}
    {isExpanded && (
      <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
        {/* Información de facturación */}
        {order.billing_info && (
          <div className="bg-[#070B14] border border-gray-800 rounded-lg p-3">
            <h4 className="font-medium text-white text-sm mb-2">Datos de Facturación</h4>

            <div className="space-y-1 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500">RFC:</div>
                <div className="font-mono text-gray-300">{order.billing_info.rfc}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="text-gray-500">Razón Social:</div>
                <div className="font-medium text-gray-300">{order.billing_info.name}</div>
              </div>

              {order.invoice_date && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-500">Fecha Factura:</div>
                  <div className="text-gray-300">{formatDateTime(order.invoice_date)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}

    {/* Modales */}
    {selectedOrder && (
      <InvoiceOrderModal
        open={invoiceModalOpen}
        onOpenChange={setInvoiceModalOpen}
        order={{
          id: selectedOrder.id,
          order_number: selectedOrder.order_number.toString(),
          user_id: selectedOrder.user_id,
          user_name: selectedOrder.user_name ?? undefined,
          user_email: selectedOrder.user_email ?? undefined,
          id_billing_info: selectedOrder.id_billing_info
        }}
        onSuccess={() => {
          onRefresh()
        }}
      />
    )}
    <ShareWhatsAppModal
      open={shareModalOpen}
      onOpenChange={setShareModalOpen}
      order={{
        order_number: order.order_number.toString(),
        user_name: order.user_name || "",
        billing_info: order.billing_info ?? undefined,
      }}
    />
  </div>
  )
}