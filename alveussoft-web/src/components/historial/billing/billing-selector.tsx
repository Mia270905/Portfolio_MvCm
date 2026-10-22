"use client";

import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface BillingSelectorProps {
  billingList: any[];
  selectedId?: string;
  onSelect: (billing: any) => void;
}

export function BillingSelector({
  billingList,
  selectedId,
  onSelect,
}: BillingSelectorProps) {
  return (
    <div className="space-y-3">
      {billingList.map((billing) => {
        const selected = billing.id === selectedId;

        return (
          <Card
            key={billing.id}
            onClick={() => onSelect(billing)}
            className={clsx(
              "p-4 cursor-pointer border transition-all",
              selected
                ? "border-primary bg-primary/5"
                : "hover:border-neutral-400",
            )}
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                className={clsx(
                  "w-5 h-5 mt-1",
                  selected ? "text-primary" : "text-transparent",
                )}
              />

              <div className="flex-1 text-sm space-y-1">
                <p className="font-semibold">{billing.name}</p>
                <p>RFC: {billing.rfc}</p>
                <p>Uso CFDI: {billing.cfdi_use}</p>
                <p>Régimen: {billing.tax_regime}</p>
                <p>C.P.: {billing.zip_code}</p>

                {billing.street && (
                  <p className="text-muted-foreground">
                    {billing.street} {billing.exterior_number},{" "}
                    {billing.municipality}, {billing.state}
                  </p>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
