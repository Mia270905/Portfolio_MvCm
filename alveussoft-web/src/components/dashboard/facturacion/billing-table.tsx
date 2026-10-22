"use client";

import type React from "react";

import type { BillingTableData } from "./billing-container";
import {
  FileText,
  FileCode,
  CheckCircle2,
  XCircle,
  Loader2,
  Share2,
  MoreVertical,
  X,
  RefreshCw, 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceOrderModal } from "./invoice-order-modal";
import { useState } from "react";
import { ShareWhatsAppModal } from "./share-whatsapp-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface BillingTableProps {
  orders: BillingTableData[];
  onRefresh: () => void;
  filters: any;
  isLoading: boolean;
  permissions: {
    canUpdate: boolean;
    canDelete: boolean;
    canDownloadPDF: boolean;
    canDownloadXML: boolean;
    canShare: boolean;
  };
  onDownloadPDF: (order: BillingTableData) => void;
  onDownloadXML: (order: BillingTableData) => void;
  downloadingPDF: string | null;
  downloadingXML: string | null;
  pagination?: React.ReactNode;
}

export function BillingTable({
  orders,
  permissions,
  onDownloadPDF,
  onDownloadXML,
  downloadingPDF,
  downloadingXML,
  pagination,
  onRefresh,
}: BillingTableProps) {
  
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BillingTableData | null>(
    null,
  );
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [orderToShare, setOrderToShare] = useState<BillingTableData | null>(
    null,
  );
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [orderToReplace, setOrderToReplace] = useState<BillingTableData | null>(
    null,
  );
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<BillingTableData | null>(
    null,
  );
  const router = useRouter();

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Pendiente";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Pendiente";
    }
  };

  const handleReplaceClick = (order: BillingTableData) => {
    setOrderToReplace(order);
    setReplaceDialogOpen(true);
  };

  const handleCancelClick = (order: BillingTableData) => {
  router.push(`/dashboard/facturacion/gestion/cancelar/${order.order_number}`);
};

  const proceedToReplace = () => {
    if (orderToReplace) {
      // Redirigir a la pantalla de remplazo
      router.push(
        `/dashboard/facturacion/gestion/reemplazar/${orderToReplace.order_number}`,
      );
    }
  };

  // Función para mostrar alerta de cancelación no disponible
  const showCancelNotAvailable = () => {
    alert("La funcionalidad de cancelación está temporalmente deshabilitada. Por favor, use la opción 'Remplazar' en su lugar.");
  };

  return (
    <div className="bg-[#0A0F17] rounded-lg shadow border border-gray-800 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[12%]">Número de Orden</TableHead>
              <TableHead className="w-[30%]">Cliente</TableHead>
              <TableHead className="w-[15%]">Fecha Orden</TableHead>
              <TableHead className="w-[18%]">Estado Factura</TableHead>
              <TableHead className="w-[15%]">Fecha Factura</TableHead>
              <TableHead className="w-[10%]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-[#070B14] border-gray-800">
                <TableCell className="font-medium text-white">
                  #{order.order_number}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-white">
                      {order.user_name || "Pendiente"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.user_email || "Pendiente"}
                    </div>
                    <div className="text-sm text-gray-400 font-mono">
                      RFC: {order.billing_info?.rfc || "Pendiente"}
                    </div>
                    <div className="text-sm text-gray-400">
                      Razón Social: {order.billing_info?.name || "Pendiente"}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500">
                  {formatDateTime(order.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {order.has_invoice ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">
                          Facturada
                        </span>
                        {order.billing_info?.id_facrutama && (
                          <Badge variant="outline" className="text-xs">
                            {order.billing_info.id_facrutama.slice(0, 8)}...
                          </Badge>
                        )}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-amber-400 font-medium">
                          Por Facturar
                        </span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-gray-500">
                  {order.invoice_date
                    ? formatDateTime(order.invoice_date)
                    : "Pendiente"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-yellow-400 hover:bg-[#070B14]"
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
                              disabled={
                                downloadingPDF ===
                                order.billing_info?.id_facrutama
                              }
                              className="text-yellow-400 hover:text-yellow-300 focus:text-yellow-300 focus:bg-yellow-400/10"
                            >
                              {downloadingPDF ===
                              order.billing_info?.id_facrutama ? (
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
                              disabled={
                                downloadingXML ===
                                order.billing_info?.id_facrutama
                              }
                              className="text-green-400 hover:text-green-300 focus:text-green-300 focus:bg-green-400/10"
                            >
                              {downloadingXML ===
                              order.billing_info?.id_facrutama ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <FileCode className="w-4 h-4 mr-2" />
                              )}
                              Descargar XML
                            </DropdownMenuItem>
                          )}

                          {permissions.canShare && (
                            <DropdownMenuItem
                              onClick={() => {
                                setOrderToShare(order);
                                setShareModalOpen(true);
                              }}
                              className="text-emerald-400 hover:text-emerald-300 focus:text-emerald-300 focus:bg-emerald-400/10"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Compartir por WhatsApp
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {/* Nuevo botón de Remplazar */}
                          <DropdownMenuItem
                            onClick={() => handleReplaceClick(order)}
                            className="text-purple-400 hover:text-purple-300 focus:text-purple-300 focus:bg-purple-400/10"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Remplazar
                          </DropdownMenuItem>

                          {/* Botón Cancelar (sin funcionalidad) */}
                          <DropdownMenuItem
                            onClick={() => handleCancelClick(order)}
                            className="text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-red-400/10"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                          </DropdownMenuItem>
                        </>
                      ) : (
                        permissions.canUpdate && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedOrder(order);
                              setInvoiceModalOpen(true);
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* {pagination} */}

      {/* Modal de confirmación para remplazo */}
      <AlertDialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-purple-600">
              <RefreshCw className="w-5 h-5" />
              Confirmar Remplazo
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="mt-2">
            <div className="space-y-3">
              <p className="text-gray-700">
                ¿Estás seguro de que quieres proceder con el remplazo de la
                factura para la orden
                <span className="font-bold text-purple-700">
                  {" "}
                  #{orderToReplace?.order_number}
                </span>
                ?
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm font-medium text-purple-800 mb-1">
                  Información de la orden:
                </p>
                <div className="text-sm text-purple-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-medium">
                      {orderToReplace?.user_name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>RFC:</span>
                    <span className="font-medium">
                      {orderToReplace?.billing_info?.rfc || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Factura ID:</span>
                    <span className="font-medium">
                      {orderToReplace?.billing_info?.id_facrutama?.slice(0, 12) || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  ⚠️ Nota importante:
                </p>
                <p className="text-xs text-yellow-700">
                  El proceso de remplazo generará una nueva factura y cancelará automáticamente 
                  la factura anterior. Esta acción no se puede deshacer.
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Serás redirigido a la pantalla de gestión de remplazo.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={proceedToReplace}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Proceder con el Remplazo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de información para cancelación (opcional) */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-600">
              <X className="w-5 h-5" />
              Función No Disponible
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="mt-2">
            <div className="space-y-3">
              <p className="text-gray-700">
                La funcionalidad de <span className="font-bold text-gray-800">Cancelación</span> 
                está temporalmente deshabilitada.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-800 mb-1">
                  Por favor, use la opción <span className="font-bold">&quot;Remplazar&quot;</span> en su lugar:
                </p>
                <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
                  <li>El remplazo genera una nueva factura con correcciones</li>
                  <li>La factura anterior se cancela automáticamente</li>
                  <li>Se mantiene el historial completo de cambios</li>
                </ul>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Si necesita asistencia, contacte al administrador del sistema.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (orderToCancel) {
                  setCancelDialogOpen(false);
                  handleReplaceClick(orderToCancel);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Usar Remplazar en su lugar
            </AlertDialogAction>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            contact_id: selectedOrder.contacts_id,
            id_billing_info: selectedOrder.id_billing_info
          }}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
      {orderToShare && (
        <ShareWhatsAppModal
          open={shareModalOpen}
          onOpenChange={setShareModalOpen}
          order={{
            order_number: orderToShare.order_number.toString(),
            user_name: orderToShare.user_name || "",
            billing_info: orderToShare.billing_info ?? undefined,
          }}
        />
      )}
    </div>
  );
}