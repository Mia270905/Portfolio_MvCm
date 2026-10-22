"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { useState } from "react";

interface BillingSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingList: any[];
  onConfirm: (billing: any) => void;
  isProcessing: boolean;
}

export function BillingSelectorModal({
  open,
  onOpenChange,
  billingList,
  onConfirm,
  isProcessing,
}: BillingSelectorModalProps) {
  const [selectedBilling, setSelectedBilling] = useState<any | null>(null);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Selecciona los datos de facturación
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {billingList.map((billing) => {
            const selected = selectedBilling?.id === billing.id;

            return (
              <Card
                key={billing.id}
                onClick={() => setSelectedBilling(billing)}
                className={clsx(
                  "p-4 cursor-pointer border transition-all",
                  selected
                    ? "border-primary bg-primary/5"
                    : "hover:border-neutral-400"
                )}
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    className={clsx(
                      "w-5 h-5 mt-1",
                      selected ? "text-primary" : "text-transparent"
                    )}
                  />

                  <div className="text-sm space-y-1">
                    <p className="font-semibold">{billing.name}</p>
                    <p>RFC: {billing.rfc}</p>
                    <p>Uso CFDI: {billing.cfdi_use}</p>
                    <p>Régimen: {billing.fiscal_regime}</p>
                    <p>C.P.: {billing.tax_zip_code}</p>

                    {billing.street && (
                      <p className="text-muted-foreground">
                        {billing.street} {billing.exterior_number}{" "}
                        {billing.neighborhood}, {billing.city}, {billing.state}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction
            disabled={!selectedBilling || isProcessing}
            onClick={() => onConfirm(selectedBilling)}
          >
            {isProcessing ? "Generando factura..." : "Usar estos datos"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
