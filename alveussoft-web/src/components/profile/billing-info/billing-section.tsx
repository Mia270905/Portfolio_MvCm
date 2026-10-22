"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

import { BillingList } from "./billing-list";
import { BillingForm } from "./billing-form";
import { getUserBillingInfo } from "@/lib/actions/billing.actions";

export function BillingSection() {
  const [billingList, setBillingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBilling, setEditingBilling] = useState<any | undefined>();

  const loadBilling = async () => {
    setLoading(true);
    const billingList = await getUserBillingInfo();
    setBillingList(billingList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBilling();
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    setEditingBilling(undefined);
    loadBilling();
  };

  if (loading) {
    return (
      <Card className="p-8 border-2 text-center">
        <p className="text-muted-foreground">
          Cargando datos fiscales...
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-500" />
          Datos de Facturación
        </h2>

        {!showForm && (
          <Button
            onClick={() => {
              setEditingBilling(undefined);
              setShowForm(true);
            }}
            className="gap-2 bg-amber-500 hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Agregar Datos
          </Button>
        )}
      </div>

      {showForm && (
        <BillingForm
          billing={editingBilling}
          onSuccess={handleSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingBilling(undefined);
          }}
        />
      )}

      <BillingList
        billingList={billingList}
        onEdit={(b) => {
          setEditingBilling(b);
          setShowForm(true);
        }}
        onDeleted={loadBilling}
      />
    </div>
  );
}
