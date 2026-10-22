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

interface CancelAppointmentDialogProps {
  appointmentId: string;
  appointmentDatetimeLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  canCancel: boolean;
}

export function CancelAppointmentDialog({
  appointmentId,
  appointmentDatetimeLabel,
  open,
  onOpenChange,
  onSuccess,
  canCancel,
}: CancelAppointmentDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const labelToCancel = "cancelar";

  const handleCancelAppointment = async () => {
    setIsCancelling(true);

    try {
      // Solo proceder si se puede cancelar según la configuración de tiempo
      if (!canCancel) {
        toast.error("No se puede cancelar esta cita según la política de cancelación");
        return;
      }

      const result = await cancelAppointment(appointmentId);

      if (!result.success) {
        toast.error(result.message ?? "No se pudo cancelar la cita");
        return;
      }

      toast.success("Cita cancelada correctamente");
      onSuccess();
      onOpenChange(false);
      setConfirmationInput("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? "Error al cancelar la cita");
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
        <DialogContent className="sm:max-w-md bg-[#F9F2D7] border border-[#E3C169]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-[#3A2A00]">
              No se puede cancelar esta cita
            </DialogTitle>
            <DialogDescription className="mt-4 text-sm text-[#5A4700]">
              La cita programada para el {appointmentDatetimeLabel} no puede ser cancelada 
              según la política de tiempo de cancelación configurada.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#F6E7B8] border border-[#E3C169] rounded-md p-4">
            <p className="text-sm text-red-600">
              ⚠️ La cita está muy próxima o ya pasó el tiempo permitido para cancelación.
              Consulte la configuración de política de cancelación para más detalles.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="
                flex-1 sm:flex-none
                bg-[#F6E7B8]
                text-[#3A2A00]
                border border-[#E3C169]
                hover:bg-[#EAD9A5]
              "
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
      <DialogContent className="sm:max-w-md bg-[#F9F2D7] border border-[#E3C169]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#3A2A00]">
            ¿Está seguro que desea cancelar esta cita? ({appointmentDatetimeLabel})
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm text-[#5A4700]">
            Escriba{" "}
            <span className="font-semibold text-[#3A2A00]">
              {labelToCancel}
            </span>{" "}
            para confirmar la cancelación.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder={labelToCancel}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            autoFocus
            className="
              w-full
              bg-[#FFF8E1]
              border-[#E3C169]
              text-[#3A2A00]
              placeholder:text-[#8A6A00]
              focus:border-red-500
              focus:ring-red-500
            "
          />

          {confirmationInput && confirmationInput !== labelToCancel && (
            <p className="text-xs text-red-600 mt-2">
              Debe escribir exactamente "{labelToCancel}"
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isCancelling}
            className="
              flex-1 sm:flex-none
              bg-[#F6E7B8]
              text-[#3A2A00]
              border border-[#E3C169]
              hover:bg-[#EAD9A5]
            "
          >
            Regresar
          </Button>

          <Button
            onClick={handleCancelAppointment}
            disabled={
              isCancelling ||
              confirmationInput !== labelToCancel
            }
            className="
              flex-1 sm:flex-none
              bg-red-600
              text-white
              hover:bg-red-700
              disabled:opacity-50
            "
          >
            {isCancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Cancelando...
              </>
            ) : (
              "Confirmar Cancelación"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}