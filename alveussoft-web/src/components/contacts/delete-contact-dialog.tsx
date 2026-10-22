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
      // Verificar autenticación del usuario
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Usuario no autenticado");
      }

      // Llamar a la action para eliminar el contacto
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

  const isConfirmed = confirmationInput.trim() === contactName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            ¿Está seguro que desea eliminar este contacto?
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm text-gray-400">
            Esta acción no se puede deshacer. El contacto será eliminado permanentemente del sistema.
            <br /><br />
            Escriba el nombre{" "}
            <span className="font-semibold text-gray-100">{contactName}</span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <div className="mb-3">
            <CopyTextButton value={contactName} />
          </div>
          <Input
            placeholder={`Escriba "${contactName}" para confirmar`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full focus:border-red-500 focus:ring-red-500"
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
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
            className="flex-1 sm:flex-none"
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