"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { deleteAvailableAppointment } from "@/lib/actions/appointment.actions";
import CopyTextButton from "@/components/general/copy-text-button";

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
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(labelToDelete);
      setCopied(true);
      toast.success("Texto copiado");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar");
    }
  };  
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            ¿Está seguro que desea eliminar este espacio disponible? ({appointmentDatetimeLabel})
          </DialogTitle>
        <DialogDescription className="mt-4 text-custom-text-tertiary flex items-center gap-1">
          Escriba{" "}
          <span className="font-semibold text-custom-text-primary flex items-center gap-1">
            {labelToDelete}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-5 w-5 p-0 hover:bg-transparent"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              ) : (
                <Copy className="h-3.5 w-3.5 text-custom-text-tertiary" />
              )}
            </Button>
          </span>{" "}
          para confirmar la eliminación.
        </DialogDescription>
        </DialogHeader>
        <div className="mb-3">
          <CopyTextButton value={labelToDelete} />
        </div>
        <div className="mb-4">
          <Input
            placeholder={labelToDelete}
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
            disabled={
              isDeleting ||
              confirmationInput !== labelToDelete
            }
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}