"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X } from "lucide-react";
import CopyTextButton from "@/components/general/copy-text-button";

interface RemoveAffiliationDialogProps {
  companyId: string;
  companyName: string;
  parentCompanyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (companyId: string) => Promise<void>;
}

export function RemoveAffiliationDialog({
  companyId,
  companyName,
  parentCompanyName,
  open,
  onOpenChange,
  onRemove,
}: RemoveAffiliationDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await onRemove(companyId);
      toast.success(`Se eliminó la afiliación de "${companyName}"`);
      onOpenChange(false);
      setConfirmationInput("");
    } catch (err: any) {
      console.error("Error eliminando afiliación:", err);
      toast.error(err.message || "Error al eliminar la afiliación");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmed = confirmationInput.trim() === companyName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <X className="h-5 w-5 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Eliminar sucursal
            </DialogTitle>
          </div>

          <DialogDescription className="text-sm text-gray-600">
            <div className="space-y-4">
              <p>
                ¿Está seguro que desea eliminar la afiliación de{" "}
                <span className="font-semibold text-gray-900">
                  {companyName}
                </span>{" "}
                como sucursal de{" "}
                <span className="font-semibold text-gray-900">
                  {parentCompanyName}
                </span>?
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700 font-medium">
                  ⚠️ Esta acción no eliminará la empresa, solo la relación de afiliación.
                </p>
                <ul className="mt-2 text-xs text-amber-600 space-y-1">
                  <li>• La empresa se convertirá en una empresa independiente</li>
                  <li>• Si tenía sucursales, estas se mantendrán</li>
                  <li>• Puede volver a asignarla como sucursal después</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p>
                  Escriba el nombre de la empresa{" "}
                  <span className="font-semibold text-gray-900">
                    {companyName}
                  </span>{" "}
                  para confirmar la eliminación.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mb-3">
          <CopyTextButton value={companyName} />
        </div>

        <div className="mb-6">
          <Input
            placeholder={`Escriba "${companyName}" para confirmar`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full focus:border-red-500 focus:ring-red-500 bg-white border-gray-300 text-gray-900"
            autoFocus
          />
          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <X className="h-3 w-3" />
              El nombre debe coincidir exactamente
            </p>
          )}
          {isConfirmed && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              ✓ Nombre confirmado
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isRemoving}
            className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving || !isConfirmed}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isRemoving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Eliminando...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Eliminar sucursal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}