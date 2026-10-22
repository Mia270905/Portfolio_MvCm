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
      <DialogContent className="sm:max-w-md bg-white border border-[#f5efe6]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-900">
            ¿Está seguro que desea eliminar la afiliación?
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm text-neutral-600">
            <div className="space-y-4">
              <p>
                Esta acción eliminará la relación de afiliación de{" "}
                <span className="font-medium text-[#c6a365]">{companyName}</span>{" "}
                como sucursal de{" "}
                <span className="font-medium text-[#c6a365]">{parentCompanyName}</span>.
              </p>

              <div className="bg-[#faf8f3] border border-[#e6dcc9] rounded-md p-4">
                <p className="text-neutral-700 text-sm">
                  ⚠️ Esta acción no eliminará la empresa, solo la relación de afiliación.
                </p>
                <ul className="mt-2 text-xs text-neutral-600 space-y-1">
                  <li>• La empresa se convertirá en una empresa independiente</li>
                  <li>• Si tenía sucursales, estas se mantendrán</li>
                  <li>• Puede volver a asignarla como sucursal después</li>
                </ul>
              </div>

              <div className="pt-2">
                <p>
                  Escriba el nombre de la empresa{" "}
                  <span className="font-medium text-[#c6a365]">{companyName}</span>{" "}
                  para confirmar.
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <Input
            placeholder={`Escriba "${companyName}" para confirmar`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="
              w-full 
              border border-[#e6dcc9] 
              bg-white 
              text-neutral-900 
              placeholder:text-neutral-400
              focus:outline-none 
              focus:border-[#c6a365] 
              focus:ring-2 
              focus:ring-[#c6a365] 
              focus:ring-opacity-50
            "
            autoFocus
          />
          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-red-500 mt-2">
              El nombre debe coincidir exactamente
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isRemoving}
            className="
              flex-1 sm:flex-none
              border border-[#e6dcc9] 
              text-neutral-700 
              hover:bg-[#faf8f3] 
              hover:text-neutral-900 
              hover:border-[#c6a365]
            "
          >
            Cancelar
          </Button>

          <Button
            onClick={handleRemove}
            disabled={isRemoving || !isConfirmed}
            className="
              flex-1 sm:flex-none
              bg-red-600
              text-white
              hover:bg-red-700
              disabled:opacity-50
              border border-red-600
            "
          >
            {isRemoving ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Eliminando...
              </>
            ) : (
              'Eliminar Afiliación'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}