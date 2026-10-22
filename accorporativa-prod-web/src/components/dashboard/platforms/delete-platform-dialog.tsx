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
import { deletePlatform } from "@/lib/actions/platform.actions";

interface DeletePlatformDialogProps {
  platformId: string;
  platformName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (platformId: string) => void;
}

export function DeletePlatformDialog({
  platformId,
  platformName,
  open,
  onOpenChange,
  onDelete,
}: DeletePlatformDialogProps) {
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

      // Llamar a la action para eliminar la plataforma
      const result = await deletePlatform(platformId);

      if (result.success) {
        toast.success(`Plataforma "${platformName}" eliminada correctamente`);
        onDelete(platformId);
        onOpenChange(false);
        setConfirmationInput("");
      } else {
        toast.error(result.message || "No se pudo eliminar la plataforma");
      }
    } catch (err: any) {
      console.error("Error eliminando plataforma:", err);
      toast.error(err.message || "Error al eliminar la plataforma");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmed = confirmationInput.trim() === platformName.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0A0F17] border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">
            ¿Está seguro que desea eliminar esta plataforma?
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm text-gray-400">
            Esta acción no se puede deshacer. La plataforma será eliminada permanentemente del sistema.
            <br /><br />
            Escriba el nombre{" "}
            <span className="font-semibold text-gray-100">{platformName}</span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder={`Escriba "${platformName}" para confirmar`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full focus:border-red-500 focus:ring-red-500 bg-[#070B14] border-gray-700 text-white"
            autoFocus
          />
          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-red-400 mt-2">
              El nombre debe coincidir exactamente
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="flex-1 sm:flex-none bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Eliminando...
              </>
            ) : (
              "Eliminar Plataforma"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}