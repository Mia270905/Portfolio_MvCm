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

interface ConfirmDeleteWarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  warehouseName: string;
  warehouseCode: string;
  isDeleting: boolean;
}

export function ConfirmDeleteWarehouseDialog({
  open,
  onOpenChange,
  onConfirm,
  warehouseName,
  warehouseCode,
  isDeleting,
}: ConfirmDeleteWarehouseDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");

  const handleConfirm = () => {
    if (confirmationText === warehouseCode) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    setConfirmationText("");
    onOpenChange(false);
  };

  const isConfirmed = confirmationText === warehouseCode;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0A0F17] border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">
            ¿Eliminar almacén?
          </DialogTitle>
          <DialogDescription className="mt-4 space-y-2 text-gray-400">
            <p>
              Esta acción eliminará permanentemente el almacén{" "}
              <span className="font-semibold text-gray-100">
                {warehouseName}
              </span>
              .
            </p>
            {/*
            <p className="text-amber-400 font-medium">
              Escriba el código{" "}
              <span className="font-semibold">{warehouseCode}</span> para
              confirmar la eliminación.
            </p>
            */}
            <p className="text-red-400 font-medium">
              Esta acción no se puede deshacer y podría afectar el inventario
              asociado.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <input
            type="text"
            placeholder={`Ingrese "${warehouseCode}"`}
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#070B14] border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent placeholder-gray-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting || !isConfirmed}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? "Eliminando..." : "Eliminar almacén"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
