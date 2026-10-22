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
import CopyTextButton from "@/components/general/copy-text-button";

interface DeleteGroupContactsDialogProps {
  groupContactsId: string;
  contactName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (contactId: string) => void;
}

export function DeleteGroupContactsDialog({
  groupContactsId,
  contactName,
  open,
  onOpenChange,
  onDelete,
}: DeleteGroupContactsDialogProps) {
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

      await onDelete(groupContactsId);

      toast.success(`Contacto "${contactName}" desvinculado correctamente`);
      onOpenChange(false);
      setConfirmationInput("");
    } catch (err: any) {
      console.error("Error desvinculando contacto:", err);
      toast.error(err.message || "Error al desvincular el contacto");
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
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-xl rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            ¿Está seguro que desea desvincular este contacto?
          </DialogTitle>

          <DialogDescription className="mt-4 text-sm text-gray-600">
            Esta acción no se puede deshacer. El contacto será desvinculado del
            grupo.
            <br />
            <br />
            Escriba el nombre{" "}
            <span className="font-semibold text-gray-900">
              {contactName}
            </span>{" "}
            para confirmar la desvinculación.
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
            className="w-full bg-white border-gray-300 text-gray-900 focus:border-red-500 focus:ring-red-500"
            autoFocus
          />

          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-red-500 mt-2">
              El nombre debe coincidir exactamente
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="border-gray-300 text-gray-700 hover:bg-gray-100 transition"
          >
            Cancelar
          </Button>

          <Button
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white shadow-sm transition disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Desvinculando...
              </span>
            ) : (
              "Desvincular Contacto"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}