"use client";

import { useState } from "react";
import { CheckCircle, Trash2 } from "lucide-react";
import { updateQuotationStatus, type Quotation } from "@/lib/actions/quotations.actions";
import { toast } from "sonner";

interface QuotationApproveDialogProps {
  isOpen: boolean;
  quotation: Quotation | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuotationApproveDialog({
  isOpen,
  quotation,
  onClose,
  onSuccess,
}: QuotationApproveDialogProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");

  const handleConfirmApprove = async () => {
    if (!quotation) return;
    
    // Validar que haya escrito "aprobar"
    if (confirmationText.toLowerCase().trim() !== "aprobar") {
      toast.error('Debes escribir "aprobar" para confirmar');
      return;
    }

    setIsApproving(true);
    try {
      const result = await updateQuotationStatus(
        quotation.id,
        'accepted',
        quotation.created_by || ''
      );

      if (result.success) {
        toast.success('Cotización aprobada correctamente');
        setConfirmationText(""); // Limpiar el input
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(result.error || 'Error al aprobar la cotización');
      }
    } catch (error) {
      console.error('Error aprobando cotización:', error);
      toast.error('Error inesperado al aprobar la cotización');
    } finally {
      setIsApproving(false);
    }
  };

  if (!isOpen || !quotation) return null;

  const handleClose = () => {
    setConfirmationText(""); // Limpiar el input al cerrar
    onClose();
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
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-custom-text-primary mb-1">
                ¿Aprobar cotización?
              </h3>
              <p className="text-sm text-custom-text-tertiary">
                La cotización cambiará su estado a "Aceptada" y no podrá ser
                editada posteriormente.
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
                  ${quotation.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Campo de confirmación */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-custom-text-secondary mb-2">
              Para confirmar, escribe{" "}
              <span className="text-green-400 font-semibold">aprobar</span>:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Escribe 'aprobar'"
              className="w-full px-4 py-2.5 bg-custom-bg-tertiary border border-custom-border-secondary rounded-lg text-custom-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={isApproving}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isApproving}
              className="flex-1 px-4 py-2.5 border border-custom-border-secondary text-custom-text-primary hover:bg-custom-bg-tertiary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmApprove}
              disabled={isApproving || confirmationText.toLowerCase().trim() !== "aprobar"}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              title={confirmationText.toLowerCase().trim() !== "aprobar" ? 'Escribe "aprobar" para habilitar' : ''}
            >
              {isApproving ? (
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Aprobando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
