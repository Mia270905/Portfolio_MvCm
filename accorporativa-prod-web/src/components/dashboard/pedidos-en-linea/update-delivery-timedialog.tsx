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
import {
  updateDeliveryTime,
  markOrderAsPrepared,
} from "@/lib/actions/sale_order.actions";
import { toast } from "sonner";

interface UpdateDeliveryTimeDialogProps {
  orderId: string;
  currentTime?: number;
  status: string;
  newTime: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UpdateDeliveryTimeDialog({
  orderId,
  currentTime = 0,
  status,
  newTime,
  open,
  onOpenChange,
  onSuccess,
}: UpdateDeliveryTimeDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirm = async () => {
    setIsUpdating(true);
    try {
      await updateDeliveryTime(orderId, newTime);

      if (status === "Pagado") {
        await markOrderAsPrepared(orderId);

        if (typeof window !== "undefined") {
          try {
            const notifiedOrders = localStorage.getItem("notified_orders");
            if (notifiedOrders) {
              const ordersArray = JSON.parse(notifiedOrders);
              const filteredOrders = ordersArray.filter(
                (id: string) => id !== orderId
              );
              localStorage.setItem(
                "notified_orders",
                JSON.stringify(filteredOrders)
              );
            }
          } catch (error) {
            console.error("Error cleaning notified orders:", error);
          }
        }
      }

      toast.success("Tiempo de entrega actualizado correctamente");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el tiempo de entrega");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar actualización</DialogTitle>
          <DialogDescription className="mt-2 text-muted-foreground">
            El tiempo estimado de entrega cambiará de{" "}
            <span className="font-semibold text-foreground">
              {currentTime} min
            </span>{" "}
            a <span className="font-semibold text-primary">{newTime} min</span>.
            <br />
            ¿Deseas continuar con la actualización?
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUpdating}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isUpdating}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {isUpdating ? "Actualizando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
