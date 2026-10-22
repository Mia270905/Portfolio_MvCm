"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ManualBillingForm } from "./manual-billing-form";
import { DraftInvoiceList } from "./draft-invoice-list";
import { DraftInvoiceView } from "./draft-invoice-view";
import { AlertCircle } from "lucide-react";
import {
  createManualInvoice,
  updateManualInvoice,
  getDraftInvoices,
  getDraftInvoiceById,
} from "@/lib/actions/manual-billing.actions";
import type {
  ManualInvoiceData,
  DraftInvoice,
} from "@/lib/actions/manual-billing.actions";
import { createManualInvoiceFromForm } from "@/lib/actions/invoices_manual.actions";
import { parseFacturamaErrors } from "@/lib/actions/billing.actions";
import { getQuotationForInvoice } from "@/lib/actions/quotations.actions";
import { toast } from "sonner";

type ViewMode = "list" | "create" | "edit" | "view";

export function ManualBillingContainer() {
  const searchParams = useSearchParams();

  const fromQuotationId = searchParams.get("fromQuotation");
  const branchId = searchParams.get("branchId"); // 👈 NUEVO

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [drafts, setDrafts] = useState<DraftInvoice[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<DraftInvoice | null>(null);
  const [selectedInvoiceData, setSelectedInvoiceData] =
    useState<ManualInvoiceData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuotation, setIsLoadingQuotation] = useState(false);

  useEffect(() => {
    loadDrafts();
  }, []);

  useEffect(() => {
    const loadQuotationData = async () => {
      if (fromQuotationId) {
        setIsLoadingQuotation(true);
        try {
          const result = await getQuotationForInvoice(fromQuotationId);
          console.log("RESULTADO COMPLETO:", result);
          console.log("QUOTATION:", result.quotation);
          console.log("Sucursal ID:", result.quotation?.inventory_location_id);
          console.log("Sucursal RELATION:", result.quotation?.inventory_location);
          if (result.success && result.quotation) {
            const invoiceData = mapQuotationToInvoiceData(
              result.quotation,
              result.billingInfo,
              branchId // 👈 NUEVO
            );

            setSelectedInvoiceData(invoiceData);
            setViewMode("create");

            toast.success("Datos de cotización cargados correctamente");
          } else {
            console.error("Failed to load quotation:", result.error);
            toast.error(result.error || "Error al cargar datos de cotización");
          }
        } catch (error) {
          console.error("Exception loading quotation:", error);
          toast.error("Error inesperado al cargar datos de cotización");
        } finally {
          setIsLoadingQuotation(false);
        }
      }
    };

    loadQuotationData();
  }, [fromQuotationId, branchId]);

  const loadDrafts = async () => {
    setIsLoading(true);
    const result = await getDraftInvoices();

    if (result.success && result.drafts) {
      setDrafts(result.drafts);
    }

    setIsLoading(false);
  };

  const handleCreateNew = () => {
    setSelectedDraft(null);
    setSelectedInvoiceData(null);
    setViewMode("create");
  };

  const handleView = async (draft: DraftInvoice) => {
    const result = await getDraftInvoiceById(draft.id);

    if (result.success && result.invoiceData) {
      setSelectedDraft(draft);
      setSelectedInvoiceData(result.invoiceData);
      setViewMode("view");
    } else {
      const errorMsg = await parseErrorToString(result.error);
      setError(errorMsg);
    }
  };

  const handleEdit = async (draft: DraftInvoice) => {
    if (draft.id_facturama) {
      setError("No se puede editar una factura ya emitida");
      return;
    }

    const result = await getDraftInvoiceById(draft.id);

    if (result.success && result.invoiceData) {
      setSelectedDraft(draft);
      setSelectedInvoiceData(result.invoiceData);
      setViewMode("edit");
    } else {
      const errorMsg = await parseErrorToString(result.error);
      setError(errorMsg);
    }
  };

  const handleBack = () => {
    setSelectedDraft(null);
    setSelectedInvoiceData(null);
    setError(null);
    setViewMode("list");
    loadDrafts();
  };

  const parseErrorToString = async (err: any): Promise<string> => {
    if (err === null || err === undefined) return "Error desconocido";

    if (typeof err === "string") return err;

    if (typeof err === "object") {
      try {
        const parsedErrors = await parseFacturamaErrors(err);
        if (parsedErrors && parsedErrors.length > 0) {
          return parsedErrors.join(". ");
        }
      } catch {}

      if (err.Message) return err.Message;
      if (err.message) return err.message;

      try {
        return JSON.stringify(err);
      } catch {
        return "Error al procesar la respuesta del servidor";
      }
    }

    return String(err);
  };

  const showErrorToast = (errors: string[], title?: string) => {
    if (!errors || errors.length === 0) return;

    if (errors.length === 1) {
      toast.error(errors[0], { duration: 8000 });
    } else {
      toast.error(
        <div>
          <p className="font-medium mb-2">{title || "Errores:"}</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>,
        { duration: 10000 }
      );
    }
  };

  const handleSubmit = async (data: ManualInvoiceData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;

      if (viewMode === "edit" && selectedDraft) {
        result = await updateManualInvoice(selectedDraft.id, data);
      } else {
        result = await createManualInvoice(data);
      }

      if (result.success) {
        toast.success(
          viewMode === "edit"
            ? "Borrador actualizado exitosamente"
            : "Borrador guardado exitosamente"
        );

        setTimeout(() => {
          handleBack();
        }, 1500);
      } else {
        const errorMessage = await parseErrorToString(result.error);
        setError(errorMessage);
      }

      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmitInvoice = async (
    manualBillingId: string,
    data: ManualInvoiceData
  ) => {
    return await createManualInvoiceFromForm(manualBillingId, data);
  };

  const handleEmitInvoiceFromView = async (
    manualBillingId: string,
    data: ManualInvoiceData
  ) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createManualInvoiceFromForm(manualBillingId, data);

      if (result.ok && result.cfdiId) {
        return result;
      }

      let errorsToShow: string[] = [];

      if (result.error) {
        if (typeof result.error === "string") {
          try {
            const parsed = JSON.parse(result.error);
            errorsToShow = await parseFacturamaErrors(parsed);
          } catch {
            errorsToShow = [result.error];
          }
        } else {
          errorsToShow = await parseFacturamaErrors(result.error);
        }
      }

      errorsToShow = errorsToShow.filter(Boolean);

      if (errorsToShow.length === 0) {
        errorsToShow = ["Error desconocido al emitir la factura"];
      }

      showErrorToast(errorsToShow, "Error al emitir factura:");

      return result;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Mapea cotización → factura manual
   */
  const mapQuotationToInvoiceData = (
    quotation: any,
    billingInfo: any,
    branchId?: string | null
  ): ManualInvoiceData => {
    const productos = (quotation.items || []).map((item: any) => {
      const cantidad = Number(item.quantity) || 1;
      const precioUnitario = Number(item.unit_price) || 0;
      const descuento = Number(item.discount_amount) || 0;

      const subtotal = precioUnitario * cantidad - descuento;

      return {
        id: item.product?.id || "",
        productCode: item.product?.code || "",
        nombre: item.product?.name || "Producto",
        cantidad,
        precioUnitario,
        descuento,
        subtotal,
        total: subtotal,
        tieneImpuestos: false,
        impuestos: [],
      };
    });

    return {
      paymentType: "efectivo",
      rfc: billingInfo?.rfc || "",
      razonSocial: billingInfo?.name || quotation.contact?.full_name || "",
      calle: billingInfo?.street || "",
      colonia: billingInfo?.neighborhood || "",
      numeroInterior: billingInfo?.interior_number || "",
      numeroExterior: billingInfo?.exterior_number || "",
      ciudad: billingInfo?.city || "",
      codigoPostalFiscal: billingInfo?.tax_zip_code || "",
      usoCFDI: billingInfo?.cfdi_use || "",
      regimenFiscal: billingInfo?.fiscal_regime || "",
      costoEnvio: 0,
      descuentoGeneral: quotation.discount_amount || 0,
      productos,

      // 👇 SUCURSAL
      company: quotation.company?.id || "",
      
    };
    
  };

  if (isLoading || isLoadingQuotation) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-custom-tertiary">
          {isLoadingQuotation
            ? "Cargando datos de cotización..."
            : "Cargando borradores..."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-custom-tertiary border border-custom-secondary rounded-lg p-4">
          <div className="flex items-center gap-2 text-custom-primary">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="font-medium">Error</div>
          </div>
          <div className="text-sm text-red-400 mt-1">{error}</div>
        </div>
      )}

      {viewMode === "list" && (
        <DraftInvoiceList
          drafts={drafts}
          onCreateNew={handleCreateNew}
          onView={handleView}
          onEdit={handleEdit}
        />
      )}

      {viewMode === "view" && selectedDraft && selectedInvoiceData && (
        <DraftInvoiceView
          draft={selectedDraft}
          invoiceData={selectedInvoiceData}
          onBack={handleBack}
          onEdit={() => setViewMode("edit")}
          onEmit={handleEmitInvoiceFromView}
        />
      )}

      {(viewMode === "create" || viewMode === "edit") && (
        <ManualBillingForm
          onSubmit={handleSubmit}
          onEmitInvoice={handleEmitInvoice}
          isSubmitting={isSubmitting}
          onCancel={handleBack}
          initialData={selectedInvoiceData}
          draftId={selectedDraft?.id}
          isEditMode={viewMode === "edit"}
        />
      )}
      
    </div>
    
  );
}