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
import { deleteContact } from "@/lib/actions/contact.actions";
import CopyTextButton from '@/components/general/copy-text-button'

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

  const isConfirmed = confirmationInput.trim() === contactName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-card-foreground">
            ¿Está seguro que desea eliminar este contacto?
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm text-muted-foreground">
            Esta acción no se puede deshacer. El contacto será eliminado permanentemente del sistema.
            <br /><br />
            Escriba el nombre{" "}
            <span className="font-semibold text-foreground">{contactName}</span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-3">
          <CopyTextButton value={contactName} />
        </div>
        <div className="mb-4">
          <Input
            placeholder={`Escriba "${contactName}" para confirmar`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full focus:border-destructive focus:ring-destructive bg-background text-foreground"
            autoFocus
          />
          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-destructive mt-2">
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive-foreground mr-2" />
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