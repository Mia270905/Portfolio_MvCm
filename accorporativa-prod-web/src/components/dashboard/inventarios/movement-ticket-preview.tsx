"use client";

import { useState, useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import MovementTicketPDF from "./movements-ticket-pdf";
import { Button } from "@/components/ui/button";
import { Printer, Download, X, FileText, Eye } from "lucide-react";

interface MovementGroup {
  id: string;
  reference_id: string | null;
  movements: any[];
  latest_movement: any;
  created_at: string;
  total_quantity: number;
  total_products: number;
  notes: string | null;
}

interface MovementTicketPreviewProps {
  movement: any;
  group?: MovementGroup;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  isGenerating?: boolean;
}

export function MovementTicketPreview({
  movement,
  group,
  isOpen,
  onClose,
  onPrint,
  onDownload,
  isGenerating = false,
}: MovementTicketPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, movement]);

  if (!isOpen) return null;

  const getMovementTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      sale: "Venta",
      purchase: "Compra",
      transfer: "Transferencia",
      adjustment: "Ajuste",
      loss: "Pérdida",
      return: "Devolución",
      initial: "Stock Inicial",
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isGroup = group && group.movements && group.movements.length > 1;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[95vh] flex flex-col">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">
                {isGroup
                  ? "Ticket de Grupo de Movimientos"
                  : "Ticket de Movimiento"}
              </h2>
              <p className="text-sm text-gray-600">
                Vista previa para impresión
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {/*
            {onPrint && (
              <Button
                onClick={onPrint}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                {isGenerating ? "Generando..." : "Imprimir Directo"}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={
                onDownload ||
                (() => {
                  // Simulación de descarga si no hay handler
                  const link = document.createElement("a");
                  link.href = `data:application/pdf;base64,${btoa("simulated")}`;
                  link.download = `movimiento-${movement.reference_id || movement.id}.pdf`;
                  link.click();
                })
              }
              disabled={isGenerating}
              className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </Button>
            */}
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex items-center gap-2 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
              Cerrar
            </Button>
          </div>
        </div>

        {/* Contenedor del PDF Viewer */}
        <div className="flex-1 p-4 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  Generando vista previa del ticket...
                </p>
              </div>
            </div>
          )}

          <PDFViewer
            width="100%"
            height="100%"
            className="border rounded-lg"
            key={movement.id} // Forzar re-render cuando cambia el movimiento
          >
            <MovementTicketPDF movement={movement} group={group} />
          </PDFViewer>
        </div>

        {/* Footer con información adicional */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Vista previa
              </span>
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Formato 80mm
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
