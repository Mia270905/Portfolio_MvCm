"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle, Calendar, User, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface CompleteAppointmentDialogProps {
  appointmentId: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  appointmentDatetime: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (appointmentId: string, notes?: string) => Promise<any>;
}

export function CompleteAppointmentDialog({
  appointmentId,
  clientName,
  clientEmail,
  clientPhone,
  appointmentDatetime,
  open,
  onOpenChange,
  onComplete,
}: CompleteAppointmentDialogProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const confirmationText = "finalizar";

  const handleComplete = async () => {
    if (confirmationInput !== confirmationText) {
      toast.error(`Debe escribir "${confirmationText}" para finalizar`);
      return;
    }

    setIsCompleting(true);

    try {
      const result = await onComplete(
        appointmentId, 
        completionNotes.trim() || undefined
      );
      
      if (result && typeof result === 'object') {
        if (result.success) {
          toast.success(result.message || "Cita finalizada exitosamente");
          setConfirmationInput("");
          setCompletionNotes("");
          onOpenChange(false);
        } else {
          toast.error(result.message || "Error al finalizar la cita");
        }
      } else {
        toast.error("Respuesta inesperada del servidor");
      }
    } catch (err: any) {
      console.error("Error en handleComplete:", err);
      toast.error(err.message || "Error al finalizar la cita");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    setCompletionNotes("");
    onOpenChange(false);
  };

  // Formatear fecha y hora
  const formatDateTime = () => {
    try {
      const date = new Date(appointmentDatetime);
      return {
        date: format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
        time: format(date, "hh:mm a", { locale: es }),
        shortDate: format(date, "dd/MM/yyyy"),
      };
    } catch (error) {
      return {
        date: "Fecha inválida",
        time: "",
        shortDate: "",
      };
    }
  };

  const { date, time } = formatDateTime();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-custom-bg-secondary border border-blue-800">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <DialogTitle className="text-custom-text-primary text-xl">
                Finalizar Cita
              </DialogTitle>
              <DialogDescription className="text-custom-text-tertiary">
                ¿Está seguro que desea marcar esta cita como finalizada?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Información del cliente */}
          <div className="bg-custom-bg-tertiary/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-custom-text-secondary mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Información del Cliente
            </h4>
            <div className="space-y-2">
              <p className="text-custom-text-primary font-medium">{clientName}</p>
              {clientEmail && (
                <div className="flex items-center gap-2 text-sm text-custom-text-secondary">
                  <Mail className="w-4 h-4" />
                  <span>{clientEmail}</span>
                </div>
              )}
              {clientPhone && (
                <div className="flex items-center gap-2 text-sm text-custom-text-secondary">
                  <Phone className="w-4 h-4" />
                  <span>{clientPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detalles de la cita */}
          <div className="bg-custom-bg-tertiary/50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-custom-text-secondary mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Detalles de la Cita
            </h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-custom-text-tertiary">Fecha:</p>
                <p className="text-custom-text-primary font-medium">{date}</p>
              </div>
              <div>
                <p className="text-sm text-custom-text-tertiary">Hora:</p>
                <p className="text-custom-text-primary font-medium">{time}</p>
              </div>
              <div className="pt-2 border-t border-custom-border-secondary">
                <p className="text-sm text-custom-text-tertiary">
                  Al finalizar, se marcará la cita como completada y se podrán agregar notas.
                </p>
              </div>
            </div>
          </div>

          {/* Campo de confirmación */}
          <div className="bg-custom-bg-tertiary/30 rounded-lg p-4 border border-blue-900/50">   
            <div className="space-y-2">
              <p className="text-xs text-custom-text-tertiary">
                Escriba <span className="font-semibold text-custom-text-primary">"{confirmationText}"</span> para confirmar la finalización.
              </p>
              <Input
                placeholder={confirmationText}
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                className="w-full bg-custom-bg-hover border-custom-border-primary text-custom-text-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && confirmationInput === confirmationText) {
                    handleComplete();
                  }
                }}
              />
              {confirmationInput && confirmationInput !== confirmationText && (
                <p className="text-xs text-red-400">
                  El texto no coincide. Debe escribir exactamente "{confirmationText}"
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isCompleting}
            className="flex-1"
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleComplete}
            disabled={isCompleting || confirmationInput !== confirmationText}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCompleting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Finalizando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Finalizar Cita
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}