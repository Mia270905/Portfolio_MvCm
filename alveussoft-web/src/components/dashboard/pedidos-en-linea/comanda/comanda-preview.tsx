// components/dashboard/pedidos-en-linea/comanda-preview.tsx
"use client";

import { useState, useEffect } from "react";
import { PDFViewer } from '@react-pdf/renderer';
import OrderComandaPDF from './order-comanda-pdf';
import { Button } from "@/components/ui/button";
import { Printer, Download, X, FileText } from "lucide-react";

interface ComandaPreviewProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  onDownload: () => void;
  isGenerating?: boolean;
}

export function ComandaPreview({ 
  order, 
  isOpen, 
  onClose, 
  onPrint, 
  onDownload, 
  isGenerating = false 
}: ComandaPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[95vh] flex flex-col">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">Comanda #{order.order_number}</h2>
              <p className="text-sm text-gray-600">
                Vista previa para impresión - Formato 80mm
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onPrint}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {isGenerating ? "Generando..." : "Imprimir"}
            </Button>
            <Button
              variant="outline"
              onClick={onDownload}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Descargar
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Contenedor del PDF Viewer */}
        <div className="flex-1 p-4 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generando vista previa de la comanda...</p>
              </div>
            </div>
          )}

          <PDFViewer 
            width="100%" 
            height="100%" 
            className="border rounded-lg"
          >
            <OrderComandaPDF order={order} />
          </PDFViewer>
        </div>

        {/* Información adicional */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Orden #{order.order_number}
              </span>
              <span className="flex items-center gap-1">
                📦 {order.details.length} productos
              </span>
              {order.delivery_time && order.delivery_time > 0 && (
                <span className="flex items-center gap-1">
                  ⏱️ {order.delivery_time} min
                </span>
              )}
            </div>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Formato 80mm • Ticket
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}