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
import { deleteProduct } from "@/lib/actions/product.actions";

interface DeleteProductDialogProps {
  productId: string;
  nameUnaccent: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (productId: string) => void;
}

export function DeleteProductDialog({
  productId,
  nameUnaccent,
  open,
  onOpenChange,
  onDelete,
}: DeleteProductDialogProps) {
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
      if (userError || !user) throw new Error("Usuario no autenticado");

      const result = await deleteProduct({ productId, userId: user.id });

      if (result.success) {
        toast.success(`Producto "${nameUnaccent}" eliminado correctamente`);
        onDelete(productId);
        onOpenChange(false);
        setConfirmationInput("");
      } else {
        toast.error("No se pudo eliminar el producto");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al eliminar el producto");
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
          <DialogTitle>¿Está seguro que desea eliminar este producto?</DialogTitle>
          <DialogDescription className="mt-4 text-gray-400">
            Escriba el nombre{" "}
            <span className="font-semibold text-gray-100">{nameUnaccent}</span>{" "}
            para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder={nameUnaccent}
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
            disabled={isDeleting || confirmationInput !== nameUnaccent}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
