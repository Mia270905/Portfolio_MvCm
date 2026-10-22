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
      <DialogContent className="sm:max-w-md bg-custom-bg-primary border border-custom-border-primary">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-custom-error-bg/20 flex items-center justify-center">
              <X className="h-5 w-5 text-custom-error-text" />
            </div>
            <DialogTitle className="text-lg font-semibold text-custom-text-primary">
              Eliminar sucursal
            </DialogTitle>
          </div>
          <DialogDescription className="mt-2 text-sm text-custom-text-tertiary">
            <div className="space-y-4">
              <p>
                ¿Está seguro que desea eliminar la afiliación de{" "}
                <span className="font-semibold text-custom-text-primary">{companyName}</span>{" "}
                como sucursal de{" "}
                <span className="font-semibold text-custom-text-primary">{parentCompanyName}</span>?
              </p>
              
              <div className="bg-custom-warning-bg/10 border border-custom-warning-text/30 rounded-lg p-3">
                <p className="text-sm text-custom-warning-text">
                  ⚠️ Esta acción no eliminará la empresa, solo la relación de afiliación.
                </p>
                <ul className="mt-2 text-xs text-custom-warning-text/80 space-y-1">
                  <li>• La empresa se convertirá en una empresa independiente</li>
                  <li>• Si tenía sucursales, estas se mantendrán</li>
                  <li>• Puede volver a asignarla como sucursal después</li>
                </ul>
              </div>
              
              <div className="pt-2 border-t border-custom-border-secondary">
                <p>
                  Escriba el nombre de la empresa{" "}
                  <span className="font-semibold text-custom-text-primary">{companyName}</span>{" "}
                  para confirmar la eliminación de la afiliación.
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
            className="w-full focus:border-custom-error-text focus:ring-custom-error-text bg-custom-bg-secondary border-custom-border-primary text-custom-text-primary"
            autoFocus
          />
          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-custom-error-text mt-2 flex items-center gap-1">
              <X className="h-3 w-3" />
              El nombre debe coincidir exactamente
            </p>
          )}
          {isConfirmed && (
            <p className="text-xs text-custom-accent-primary mt-2 flex items-center gap-1">
              ✓ Nombre confirmado
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isRemoving}
            className="flex-1 bg-transparent border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving || !isConfirmed}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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