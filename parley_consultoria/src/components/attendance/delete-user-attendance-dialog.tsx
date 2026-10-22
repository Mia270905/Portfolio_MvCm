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
import { removeUserFromAttendance } from "@/lib/actions/attendance.actions";

interface RemoveUserDialogProps {
  attendanceUserId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (attendanceUserId: string) => void;
}

export function RemoveUserDialog({
  attendanceUserId,
  userName,
  open,
  onOpenChange,
  onRemove,
}: RemoveUserDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const supabase = createClient();

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      // Verificar autenticación del usuario
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error("Usuario no autenticado");
      }

      // Llamar a la action para remover del checador
      const result = await removeUserFromAttendance(attendanceUserId);

      if (result.success) {
        toast.success(`Usuario "${userName}" removido del checador correctamente`);
        onRemove(attendanceUserId);
        onOpenChange(false);
        setConfirmationInput("");
      } else {
        toast.error(result.message || "No se pudo remover el usuario del checador");
      }
    } catch (err: any) {
      console.error("Error removiendo usuario del checador:", err);
      toast.error(err.message || "Error al remover usuario del checador");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleCancel = () => {
    setConfirmationInput("");
    onOpenChange(false);
  };

  const isConfirmed = confirmationInput.trim().toLowerCase() === "confirmar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0A0F17] border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">
            ¿Quitar usuario del checador?
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm text-gray-400">
            Esta acción removerá el acceso al sistema de asistencia para el usuario{" "}
            <span className="font-semibold text-gray-100">{userName}</span>.
            <br /><br />
            Escriba <span className="font-semibold text-amber-400">"confirmar"</span>{" "}
            para proceder.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder='Escriba "confirmar" para proceder'
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full focus:border-red-500 focus:ring-red-500 bg-[#070B14] border-gray-700 text-white"
            autoFocus
          />
          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-red-400 mt-2">
              Debe escribir exactamente <span className="font-mono">"confirmar"</span>
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isRemoving}
            className="flex-1 sm:flex-none bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving || !isConfirmed}
            className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
          >
            {isRemoving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Quitando...
              </>
            ) : (
              "Quitar del Checador"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}