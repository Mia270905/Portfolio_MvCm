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
import CopyTextButton from "@/components/general/copy-text-button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { deleteContact } from "@/lib/actions/contact.actions";

interface DeleteContactDialogProps {
  contactId: string;
  contactName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (contactId: string) => void;
}

export function DeleteContactDialog({
  contactId,
  contactName,
  open,
  onOpenChange,
  onDelete,
}: DeleteContactDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Usuario no autenticado");
      }

      const result = await deleteContact(contactId);

      if (result.success) {
        toast.success(`Contacto "${contactName}" eliminado correctamente`);
        onDelete(contactId);
        onOpenChange(false);
        setConfirmationInput("");
      } else {
        toast.error(result.message || "No se pudo eliminar el contacto");
      }
    } catch (err: any) {
      console.error("Error eliminando contacto:", err);
      toast.error(err.message || "Error al eliminar el contacto");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmed =
    confirmationInput.trim() === contactName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            ¿Está seguro que desea eliminar este contacto?
          </DialogTitle>

          <DialogDescription className="mt-4 text-sm text-gray-600">
            Esta acción no se puede deshacer. El contacto será eliminado
            permanentemente del sistema.
            <br />
            <br />
            Escriba el nombre{" "}
            <span className="font-semibold text-gray-900">
              {contactName}
            </span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>

        {/* Caja nombre + copiar */}
        <div className="mb-3 p-3 rounded-md border border-gray-200 bg-gray-50">
          <CopyTextButton value={contactName} />
        </div>

        {/* Input confirmación */}
        <div className="mb-4">
          <Input
            placeholder={`Escriba "${contactName}" para confirmar`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500"
            autoFocus
          />

          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-red-500 mt-2">
              El nombre debe coincidir exactamente
            </p>
          )}
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
            className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Eliminando...
              </>
            ) : (
              "Eliminar Contacto"
            )}  
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}