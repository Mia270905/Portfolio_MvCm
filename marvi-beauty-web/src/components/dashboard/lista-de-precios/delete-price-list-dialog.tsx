"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface DeletePriceListDialogProps {
  priceList: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    active: boolean;
    product_count?: number; // Número de productos asociados (opcional)
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (deletedPriceListId: string) => void;
  deleteFunction: (
    id: string,
  ) => Promise<{ success: boolean; message?: string }>;
  showProductWarning?: boolean;
}

export function DeletePriceListDialog({
  priceList,
  open,
  onOpenChange,
  onSuccess,
  deleteFunction,
  showProductWarning = true,
}: DeletePriceListDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteFunction(priceList.id);

      if (result.success) {
        toast.success(
          `Lista de precios "${priceList.code}" eliminada exitosamente`,
        );
        onSuccess(priceList.id);
        handleCancel();
      } else {
        toast.error(result.message || "Error al eliminar la lista de precios");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al eliminar la lista de precios");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmationValid = confirmationInput === priceList.code;

  // Mensaje de advertencia si hay productos asociados
  const productWarning =
    priceList.product_count && priceList.product_count > 0
      ? `Esta lista de precios tiene ${priceList.product_count} producto(s) asociado(s). Al eliminar la lista, los productos perderán esta referencia.`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0A0F1C] border border-gray-800">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-red-900/40 p-2 rounded-full border border-red-800">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Eliminar Lista de Precios
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Advertencia de productos asociados */}
          {showProductWarning && productWarning && (
            <div className="bg-amber-900/40 border border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-300">{productWarning}</p>
              </div>
            </div>
          )}

          {/* Sección de confirmación */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Para confirmar la eliminación, escriba el nombre exacto de la
              lista de precios:
            </p>
            <div className="bg-[#070B14] border border-gray-800 rounded-lg p-3">
              <p className="text-sm font-semibold text-white break-words">
                {priceList.code}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium text-gray-300">
              Escriba el nombre aquí:
            </Label>
            <Input
              id="confirmation"
              placeholder={priceList.code}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              className="w-full bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-400"
              autoFocus
              autoComplete="off"
            />
          </div>

          {/* Advertencia adicional si el input no coincide */}
          {confirmationInput && !isConfirmationValid && (
            <div className="bg-red-900/40 border border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-300">
                El nombre ingresado no coincide. Verifique e intente nuevamente.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="sm:mr-2 bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmationValid}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Eliminar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}