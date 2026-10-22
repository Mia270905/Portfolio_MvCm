"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { deleteUserBillingInfo } from "@/lib/actions/billing.actions";

interface BillingListProps {
  billingList: any[];
  onEdit: (billing: any) => void;
  onDeleted: () => void;
}

export function BillingList({
  billingList,
  onEdit,
  onDeleted,
}: BillingListProps) {
  if (!billingList.length) {
    return (
      <Card className="p-6 text-center border-2 bg-[#0A0F17]">
        <p className="text-muted-foreground">
          No hay datos de facturación registrados
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {billingList.map((billing) => (
        <Card
          key={billing.id}
          className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          {/* INFO */}
          <div className="space-y-1">
            <p className="font-semibold">{billing.name}</p>
            <p className="text-sm text-muted-foreground">RFC: {billing.rfc}</p>
            <p className="text-sm text-muted-foreground">
              Uso CFDI: {billing.cfdi_use}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-2 sm:justify-end">
            {/* EDIT */}
            <Button
              size="icon"
              variant="outline"
              onClick={() => onEdit(billing)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* DELETE WITH CONFIRMATION */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    ¿Eliminar datos de facturación?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Los datos se marcarán como
                    eliminados.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>

                  <AlertDialogAction
                    className="bg-[#CE0E2D]"
                    onClick={async () => {
                      await deleteUserBillingInfo(billing.id);
                      onDeleted();
                    }}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>
      ))}
    </div>
  );
}
