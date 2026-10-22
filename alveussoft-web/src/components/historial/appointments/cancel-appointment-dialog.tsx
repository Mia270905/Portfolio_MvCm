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
import { cancelAppointment } from "@/lib/actions/appointment.actions";
import CopyTextButton from "@/components/general/copy-text-button";

interface CancelAppointmentDialogProps {
  appointmentId: string;
  appointmentDatetimeLabel: string; // ej: "2025-01-15 10:30"
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  canCancel: boolean;
  contactId?: string;
}

export function CancelAppointmentDialog({
  appointmentId,
  appointmentDatetimeLabel,
  open,
  onOpenChange,
  onSuccess,
  canCancel,
  contactId,
}: CancelAppointmentDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const labelToCancel = "cancelar"; // Texto fijo que debe escribir el usuario

  const handleCancelAppointment = async () => {
    setIsCancelling(true);

    try {
      // Solo proceder si se puede cancelar según la configuración de tiempo
      if (!canCancel) {
        toast.error("No se puede cancelar esta cita según la política de cancelación");
        return;
      }

      const result = await cancelAppointment(appointmentId, undefined, contactId);

      if (!result.success) {
        toast.error(
          result.message ?? "No se pudo cancelar la cita"
        );
        return;
      }

      toast.success("Cita cancelada correctamente");
      onSuccess();
      onOpenChange(false);
      setConfirmationInput("");
    } catch (err: any) {
      console.error(err);
      toast.error(
        err.message ?? "Error al cancelar la cita"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  // Si no se puede cancelar, mostrar un diálogo diferente
  if (!canCancel) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-500">
              No se puede cancelar esta cita
            </DialogTitle>
            <DialogDescription className="mt-4 text-gray-400">
              La cita programada para el {appointmentDatetimeLabel} no puede ser cancelada 
              según la política de tiempo de cancelación configurada.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⚠️ La cita está muy próxima o ya pasó el tiempo permitido para cancelación.
              Consulte la configuración de política de cancelación para más detalles.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleClose}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            ¿Está seguro que desea cancelar esta cita? ({appointmentDatetimeLabel})
          </DialogTitle>
          <DialogDescription className="mt-4 text-gray-400">
            Escriba{" "}
            <span className="font-semibold text-gray-100">
              {labelToCancel}
            </span>{" "}
            para confirmar la cancelación.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-3">
          <CopyTextButton value={labelToCancel} />
        </div>
        <div className="mb-4">
          <Input
            placeholder={labelToCancel}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isCancelling}
          >
            Regresar
          </Button>

          <Button
            variant="destructive"
            onClick={handleCancelAppointment}
            disabled={
              isCancelling ||
              confirmationInput !== labelToCancel
            }
          >
            {isCancelling ? "Cancelando..." : "Confirmar Cancelación"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}