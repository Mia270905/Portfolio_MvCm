"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTax } from "@/lib/actions/tax.actions";

interface DeleteTaxDialogProps {
  tax: {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (deletedTaxId: string) => void;
}

export function DeleteTaxDialog({
  tax,
  open,
  onOpenChange,
  onSuccess,
}: DeleteTaxDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTax(tax.id);

      if (result.success) {
        toast.success(`Impuesto "${tax.name}" eliminado exitosamente`);
        onSuccess(tax.id);
        handleCancel();
      } else {
        toast.error(result.message || "Error al eliminar el impuesto");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al eliminar el impuesto");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmationValid = confirmationInput === tax.name;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0A0F17] border border-gray-800">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-red-900/30 p-2 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-white">Eliminar Impuesto</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sección de confirmación */}
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Para confirmar la eliminación, escriba el nombre exacto del
              impuesto:
            </p>
            <p className="text-sm font-semibold text-white bg-gray-800 p-3 rounded-lg break-words">
              {tax.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium text-gray-300">
              Escriba el nombre aquí:
            </Label>
            <Input
              id="confirmation"
              placeholder={tax.name}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              className="w-full bg-[#0A0F17] border-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400"
              autoFocus
              autoComplete="off"
            />
          </div>

          {/* Advertencia adicional si el input no coincide */}
          {confirmationInput && !isConfirmationValid && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-400">
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
            className="sm:mr-2 border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-400"
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmationValid}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
