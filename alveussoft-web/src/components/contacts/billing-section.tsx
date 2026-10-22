"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus, ArrowLeft } from "lucide-react";
import { BillingList } from "./billing-list";
import { BillingForm } from "./billing-form";
import { getUserBillingInfo3 } from "@/lib/actions/billing.actions";
import { useRouter } from "next/navigation";

interface BillingSectionProps {
  contactId: string;
}

export function BillingSection({ contactId }: BillingSectionProps) {
  const [billingList, setBillingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBilling, setEditingBilling] = useState<any | undefined>();
  const router = useRouter();

  const loadBilling = async () => {
    setLoading(true);
    const billingList = await getUserBillingInfo3(contactId);
    
    setBillingList(billingList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBilling();
  }, [contactId]);

  const handleSuccess = () => {
    setShowForm(false);
    setEditingBilling(undefined);
    loadBilling();
  };

  const handleBackToInfo = () => {
    const tabTrigger = document.querySelector('[data-value="info"]') as HTMLButtonElement;
    if (tabTrigger) {
      tabTrigger.click();
    }
  };

  if (loading) {
    return (
      <Card className="p-4 sm:p-8 border-2 text-center bg-[#0A0F17]">
        <p className="text-sm sm:text-base text-muted-foreground">
          Cargando datos fiscales...
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Botón para volver a información del contacto */}
      <div className="flex items-center justify-between">
        
        {/* Título de la sección - visible solo en móvil */}
        {/* <div className="flex items-center gap-2 sm:hidden">
          <div className="p-1.5 bg-[#0A0F17] rounded-lg">
            <FileText className="h-4 w-4 text-amber-500" />
          </div>
          <span className="font-medium text-sm">Facturación</span>
        </div> */}
      </div>

      {/* Título de la sección y botón Agregar - visible en desktop */}
      <div className="hidden sm:flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0A0F17] rounded-lg">
            <FileText className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Datos de Facturación
            </h2>
            <p className="text-sm text-muted-foreground">
              {billingList.length === 0 
                ? "Aún no has agregado datos fiscales" 
                : `${billingList.length} ${billingList.length === 1 ? 'dato fiscal' : 'datos fiscales'} registrado${billingList.length === 1 ? '' : 's'}`
              }
            </p>
          </div>
        </div>

        {!showForm && (
          <Button
            onClick={() => {
              setEditingBilling(undefined);
              setShowForm(true);
            }}
            className="gap-2 bg-amber-500 hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            Agregar Datos
          </Button>
        )}
      </div>

      {/* Versión móvil del título cuando no hay datos */}
      {billingList.length === 0 && !showForm && (
        <div className="sm:hidden flex items-center gap-2 border-b border-border pb-3">
          <div className="p-1.5 bg-amber-500/10 rounded-lg">
            <FileText className="h-4 w-4 text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Datos de Facturación
            </h2>
            <p className="text-xs text-muted-foreground">
              Aún no has agregado datos fiscales
            </p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="overflow-x-auto">
          <BillingForm
            contactId={contactId}
            billing={editingBilling}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false);
              setEditingBilling(undefined);
            }}
          />
        </div>
      )}

      <div className="overflow-x-auto">
        <BillingList
          billingList={billingList}
          onEdit={(b) => {
            setEditingBilling(b);
            setShowForm(true);
          }}
          onDeleted={loadBilling}
        />
      </div>

      {/* Botón flotante para agregar en móvil cuando no hay datos */}
      {!showForm && billingList.length === 0 && (
        <div className="fixed bottom-4 right-4 sm:hidden">
          <Button
            onClick={() => {
              setEditingBilling(undefined);
              setShowForm(true);
            }}
            className="gap-2 bg-amber-500 hover:bg-amber-600 rounded-full w-12 h-12 p-0 shadow-lg"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}