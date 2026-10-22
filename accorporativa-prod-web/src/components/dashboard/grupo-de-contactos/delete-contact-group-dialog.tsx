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
import { deleteContactGroup } from "@/lib/actions/contact_group.actions";
import CopyTextButton from "@/components/general/copy-text-button";

interface DeleteContactGroupDialogProps {
  contactGroupId: string;
  contactGroupTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (contactGroupId: string) => void;
}

export function DeleteContactGroupDialog({
  contactGroupId,
  contactGroupTitle,
  open,
  onOpenChange,
  onDelete,
}: DeleteContactGroupDialogProps) {
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

      if (userError || !user)
        throw new Error("Usuario no autenticado");

      const result = await deleteContactGroup({
        contactGroupId,
        userId: user.id,
      });

      if (result.success) {
        toast.success(
          `Grupo de contacto "${contactGroupTitle}" eliminado`
        );
        onDelete(contactGroupId);
        onOpenChange(false);
        setConfirmationInput("");
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message ||
          "Error al eliminar el grupo de contacto"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmed =
    confirmationInput.trim() ===
    contactGroupTitle.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-gray-200 shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900">
            ¿Está seguro que desea eliminar el grupo de contacto?
          </DialogTitle>

          <DialogDescription className="mt-4 text-sm text-gray-600">
            Esta acción no se puede deshacer. El grupo será eliminado
            permanentemente del sistema.
            <br />
            <br />
            Escriba el nombre{" "}
            <span className="font-semibold text-gray-900">
              {contactGroupTitle}
            </span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>

        {/* Caja nombre + copiar */}
        <div className="mb-3 p-3 rounded-md border border-gray-200 bg-gray-50">
          <CopyTextButton value={contactGroupTitle} />
        </div>

        {/* Input confirmación */}
        <div className="mb-4">
          <Input
            placeholder={`Escriba "${contactGroupTitle}" para confirmar`}
            value={confirmationInput}
            onChange={(e) =>
              setConfirmationInput(e.target.value)
            }
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
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}