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
import { deletePostalCode } from "@/lib/actions/zone.actions";

interface DeletePostalCodeDialogProps {
  postalCode: { id: string; code: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (postalCodeId: string) => void;
  isDeleting?: boolean;
}

export function DeletePostalCodeDialog({
  postalCode,
  open,
  onOpenChange,
  onDelete,
}: DeletePostalCodeDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const supabase = createClient();

  const handleDelete = async () => {
    if (!postalCode) return;

    setIsDeleting(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Usuario no autenticado");

      // Usar la acción del servidor para eliminar el código postal
      const result = await deletePostalCode({
        postalCodeId: postalCode.id,
        userId: user.id,
      });

      if (result.success) {
        toast.success(
          `Código postal "${postalCode.code}" eliminado correctamente`
        );
        onDelete(postalCode.id);
        onOpenChange(false);
        setConfirmationInput("");
      } else {
        throw new Error(result.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al eliminar el código postal");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            ¿Está seguro que desea eliminar el código postal?
          </DialogTitle>
          <DialogDescription className="mt-4 text-gray-400">
            Esta acción no se puede deshacer.
            <br />
            Escriba el código postal{" "}
            <span className="font-semibold text-gray-100">
              {postalCode?.code}
            </span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder={postalCode?.code}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmationInput !== postalCode?.code}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
