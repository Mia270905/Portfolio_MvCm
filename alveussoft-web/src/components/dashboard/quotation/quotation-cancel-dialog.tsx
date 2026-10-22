"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cancelQuotation, type Quotation } from "@/lib/actions/quotations.actions";
import { toast } from "sonner";
import CopyTextButton from "@/components/general/copy-text-button";

interface QuotationCancelDialogProps {
  isOpen: boolean;
  quotation: Quotation | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuotationCancelDialog({
  isOpen,
  quotation,
  onClose,
  onSuccess,
}: QuotationCancelDialogProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const handleConfirmCancel = async () => {
    if (!quotation) return;

    // Validar que haya escrito "cancelar"
    if (confirmationText.toLowerCase().trim() !== "cancelar") {
      toast.error('Debes escribir "cancelar" para confirmar');
      return;
    }

    setIsCancelling(true);
    try {
      const result = await cancelQuotation(quotation.id);

      if (result.success) {
        toast.success("Cotización cancelada correctamente");
        setConfirmationText(""); // Limpiar el input
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error || "Error al cancelar la cotización");
      }
    } catch (error) {
      console.error("Error cancelando cotización:", error);
      toast.error("Error inesperado al cancelar la cotización");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen || !quotation) return null;

  const handleClose = () => {
    setConfirmationText(""); // Limpiar el input al cerrar
    onClose();
  };

  // Función para calcular el total correcto desde los items
  const calculateQuotationTotal = (quotation: Quotation) => {
    if (!quotation?.items) return quotation.total || 0;
    // item_total ya incluye impuestos y descuentos por producto
    const itemsTotal = quotation.items.reduce((sum, item) => sum + (item.item_total || 0), 0);
    // Restar descuento general
    return itemsTotal - (quotation.discount_amount || 0);
  };

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-custom-bg-secondary rounded-lg border border-custom-border-secondary shadow-xl">
        <div className="p-6">
          {/* Icono y título */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-900/20 flex items-center justify-center">
              <X className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-custom-text-primary mb-1">
                ¿Cancelar cotización?
              </h3>
              <p className="text-sm text-custom-text-tertiary">
                La cotización será marcada como cancelada.
              </p>
            </div>
          </div>

          {/* Información de la cotización */}
          <div className="bg-custom-bg-tertiary rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-custom-text-tertiary">Número:</span>
                <span className="text-custom-text-primary font-medium">
                  #{quotation.quotation_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-custom-text-tertiary">Cliente:</span>
                <span className="text-custom-text-primary font-medium">
                  {quotation.contact?.name ||
                    quotation.contact?.full_name ||
                    "Sin cliente"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-custom-text-tertiary">Total:</span>
                <span className="text-custom-text-primary font-medium">
                  {formatCurrency(calculateQuotationTotal(quotation))}
                </span>
              </div>
            </div>
          </div>

          {/* Campo de confirmación */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-custom-text-secondary mb-2">
              Para confirmar, escribe{" "}
              <span className="text-amber-400 font-semibold">cancelar</span>:
            </label>
            <div className="mb-3">
              <CopyTextButton value={"cancelar"} />
            </div>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Escribe 'cancelar'"
              className="w-full px-4 py-2.5 bg-custom-bg-tertiary border border-custom-border-secondary rounded-lg text-custom-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              disabled={isCancelling}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isCancelling}
              className="flex-1 px-4 py-2.5 border border-custom-border-secondary text-custom-text-primary hover:bg-custom-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cerrar
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={isCancelling || confirmationText.toLowerCase().trim() !== "cancelar"}
              className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-900 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title={confirmationText.toLowerCase().trim() !== "cancelar" ? 'Escribe "cancelar" para habilitar' : ''}
            >
              {isCancelling ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Cancelando...
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Cancelar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
