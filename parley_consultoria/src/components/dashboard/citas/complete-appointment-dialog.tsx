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
      <DialogContent className="sm:max-w-lg bg-white border border-[#f5efe6]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-neutral-900 text-xl font-semibold">
                Finalizar Cita
              </DialogTitle>
              <DialogDescription className="text-neutral-600">
                ¿Está seguro que desea marcar esta cita como finalizada?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Información del cliente */}
          <div className="bg-[#faf8f3] rounded-lg p-4 border border-[#e6dcc9]">
            <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Información del Cliente
            </h4>
            <div className="space-y-2">
              <p className="text-neutral-900 font-medium">{clientName}</p>
              {clientEmail && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Mail className="w-4 h-4" />
                  <span>{clientEmail}</span>
                </div>
              )}
              {clientPhone && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Phone className="w-4 h-4" />
                  <span>{clientPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Detalles de la cita */}
          <div className="bg-[#faf8f3] rounded-lg p-4 border border-[#e6dcc9]">
            <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Detalles de la Cita
            </h4>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-neutral-600">Fecha:</p>
                <p className="text-neutral-900 font-medium">{date}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Hora:</p>
                <p className="text-neutral-900 font-medium">{time}</p>
              </div>
              <div className="pt-2 border-t border-[#e6dcc9]">
                <p className="text-sm text-neutral-600">
                  Al finalizar, se marcará la cita como completada y se podrán agregar notas.
                </p>
              </div>
            </div>
          </div>

          {/* Campo de confirmación */}
          <div className="bg-[#faf8f3] rounded-lg p-4 border border-[#c6a365]/50">   
            <div className="space-y-2">
              <p className="text-xs text-neutral-600">
                Escriba <span className="font-medium text-[#c6a365]">"{confirmationText}"</span> para confirmar la finalización.
              </p>
              <Input
                placeholder={confirmationText}
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && confirmationInput === confirmationText) {
                    handleComplete();
                  }
                }}
              />
              {confirmationInput && confirmationInput !== confirmationText && (
                <p className="text-xs text-red-500">
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
            className="
              flex-1
              border border-[#e6dcc9] 
              text-neutral-700 
              hover:bg-[#faf8f3] 
              hover:text-neutral-900 
              hover:border-[#c6a365]
            "
          >
            Cerrar
          </Button>
          
          <Button
            onClick={handleComplete}
            disabled={isCompleting || confirmationInput !== confirmationText}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isCompleting ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
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