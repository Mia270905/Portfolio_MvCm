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
import { deleteAvailableAppointment } from "@/lib/actions/appointment.actions";

interface DeleteAppointmentAvailableDialogProps {
  appointmentId: string;
  labelToDelete: string;
  appointmentDatetimeLabel: string; // ej: "2025-01-15 10:30"
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (appointmentId: string) => void;
}

export function DeleteAppointmentAvailableDialog({
  appointmentId,
  labelToDelete,
  appointmentDatetimeLabel,
  open,
  onOpenChange,
  onDelete,
}: DeleteAppointmentAvailableDialogProps) {
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

      const result = await deleteAvailableAppointment({
        appointmentId,
      });

      if (!result.success) {
        toast.error(
          result.message ??
            "No se pudo eliminar el espacio disponible"
        );
        return;
      }

      toast.success("Espacio disponible eliminado correctamente");
      onDelete(appointmentId);
      onOpenChange(false);
      setConfirmationInput("");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message ?? "Error al eliminar el espacio disponible"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmed = confirmationInput.trim() === labelToDelete.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border border-[#f5efe6]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-900">
            ¿Está seguro que desea eliminar este espacio disponible? ({appointmentDatetimeLabel})
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm text-neutral-600">
            Esta acción no se puede deshacer. El espacio disponible será eliminado permanentemente del sistema.
            <br /><br />
            Escriba el nombre{" "}
            <span className="font-medium text-[#c6a365]">
              {labelToDelete}
            </span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder={`Escriba "${labelToDelete}" para confirmar`}
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
            disabled={isDeleting}
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
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
            className="
              flex-1 sm:flex-none
              bg-red-600
              text-white
              hover:bg-red-700
              disabled:opacity-50
              border border-red-600
            "
          >
            {isDeleting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Eliminando...
              </>
            ) : (
              "Eliminar Espacio"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}