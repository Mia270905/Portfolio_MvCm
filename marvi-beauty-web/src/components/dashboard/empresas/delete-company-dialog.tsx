"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { deleteCompany } from "@/lib/actions/company.actions";
import CopyTextButton from "@/components/general/copy-text-button";

interface DeleteCompanyDialogProps {
  companyId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (companyId: string) => void;
}

export function DeleteCompanyDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
  onDelete,
}: DeleteCompanyDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Verificar autenticación del usuario
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Usuario no autenticado");
      }

      // Llamar a la action para eliminar la empresa
      const result = await deleteCompany(companyId);

      if (result.success) {
        toast.success(`Empresa "${companyName}" eliminada correctamente`);
        onDelete(companyId);
        onOpenChange(false);
        setConfirmationInput("");
      } else {
        toast.error(result.message || "No se pudo eliminar la empresa");
      }
    } catch (err: any) {
      console.error("Error eliminando empresa:", err);
      toast.error(err.message || "Error al eliminar la empresa");
    } finally {
      setIsDeleting(false);
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
          <DialogTitle className="text-lg font-semibold text-custom-text-primary">
            ¿Está seguro que desea eliminar esta empresa?
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm text-custom-text-tertiary">
            Esta acción no se puede deshacer. La empresa será eliminada permanentemente del sistema.
            <br /><br />
            Escriba el nombre{" "}
            <span className="font-semibold text-custom-text-primary">{companyName}</span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-3">
          <CopyTextButton value={companyName} />
        </div>
        <div className="mb-4">
          <Input
            placeholder={`Escriba "${companyName}" para confirmar`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full focus:border-custom-error-text focus:ring-custom-error-text bg-custom-bg-secondary border-custom-border-primary text-custom-text-primary"
            autoFocus
          />
          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-custom-error-text mt-2">
              El nombre debe coincidir exactamente
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 sm:flex-none bg-transparent border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Eliminando...
              </>
            ) : (
              "Eliminar Empresa"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}