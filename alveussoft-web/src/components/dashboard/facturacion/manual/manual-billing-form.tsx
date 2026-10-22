"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ManualInvoiceData,
  ProductoConImpuestos,
  ImpuestoCalculado,
} from "@/lib/actions/manual-billing.actions";
import { ProductSelector } from "./product-selector";
import {
  FileText,
  User,
  MapPin,
  ShoppingCart,
  Truck,
  ArrowLeft,
  AlertCircle,
  Building,
  Building2,
} from "lucide-react";
import { downloadInvoicePDF } from "@/lib/utils/download-pdf";
import { downloadInvoiceXML } from "@/lib/utils/download-xml";
import { getInvoicePDF, getInvoiceXML } from "@/lib/actions/invoices.actions";
import {
  parseFacturamaErrors,
  getRegimenOptionsForRfc,
  getUsoCfdiOptionsForRegimen,
} from "@/lib/actions/billing.actions";
import {
  validateBillingData,
  validateRfcFormat,
  getTipoPersonaByRfc,
  type ValidationResult,
} from "@/lib/utils/cfdi-validations";
import { CompaniesResponse, getCompanies } from "@/lib/actions/company.actions";

interface ManualBillingFormProps {
  onSubmit: (data: ManualInvoiceData) => Promise<{
    success: boolean;
    invoice?: { id: string };
    message?: string;
  }>;
  onEmitInvoice?: (
    manualBillingId: string,
    data: ManualInvoiceData,
  ) => Promise<{ ok: boolean; cfdiId?: string; error?: any }>;
  isSubmitting: boolean;
  onCancel?: () => void;
  initialData?: ManualInvoiceData | null;
  draftId?: string;
  isEditMode?: boolean;
}

interface CalculosProducto {
  subtotal: number;
  total: number;
  impuestos: ImpuestoCalculado[];
  tieneImpuestos: boolean;
}

interface CalculosFactura {
  subtotalFactura: number;
  totalImpuestos: number;
  totalFactura: number;
}

interface CalculosActualizados {
  productos: ProductoConImpuestos[];
  subtotalFactura: number;
  totalImpuestos: number;
}

const EXPEDITION_ZIP_CODE = "42501";

const areObjectsEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object")
    return obj1 === obj2;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (key === "impuestos") {
      const impuestos1 = obj1[key] || [];
      const impuestos2 = obj2[key] || [];
      if (impuestos1.length !== impuestos2.length) return false;
      const sorted1 = [...impuestos1].sort((a, b) => a.id.localeCompare(b.id));
      const sorted2 = [...impuestos2].sort((a, b) => a.id.localeCompare(b.id));
      for (let i = 0; i < sorted1.length; i++) {
        if (!areObjectsEqual(sorted1[i], sorted2[i])) return false;
      }
    } else if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
      if (obj1[key].length !== obj2[key].length) return false;
      for (let i = 0; i < obj1[key].length; i++) {
        if (!areObjectsEqual(obj1[key][i], obj2[key][i])) return false;
      }
    } else if (typeof obj1[key] === "object" && typeof obj2[key] === "object") {
      if (!areObjectsEqual(obj1[key], obj2[key])) return false;
    } else if (obj1[key] !== obj2[key]) {
      return false;
    }
  }

  return true;
};

const calculateProductTaxes = (
  producto: ProductoConImpuestos,
): CalculosProducto => {
  const { cantidad, precioUnitario, descuento = 0, impuestos = [] } = producto;

  const subtotal = precioUnitario * cantidad - descuento;

  let totalImpuestos = 0;
  const impuestosCalculados: ImpuestoCalculado[] = [];

  if (impuestos && impuestos.length > 0) {
    impuestos.forEach((tax) => {
      let amount: number;
      if (tax.tax_type === "percentage") {
        amount = subtotal * (tax.rate / 100);
      } else {
        amount = tax.rate * cantidad;
      }
      totalImpuestos += amount;
      impuestosCalculados.push({
        ...tax,
        amount: parseFloat(amount.toFixed(2)),
      });
    });
  }

  const total = subtotal + totalImpuestos;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    impuestos: impuestosCalculados,
    tieneImpuestos: impuestos.length > 0,
  };
};

const calculateInvoiceTotals = (
  productos: ProductoConImpuestos[],
): CalculosActualizados => {
  let subtotalFactura = 0;
  let totalImpuestos = 0;

  const productosActualizados: ProductoConImpuestos[] = productos.map(
    (producto) => {
      const calculos = calculateProductTaxes(producto);

      subtotalFactura += calculos.subtotal;
      totalImpuestos += calculos.total - calculos.subtotal;

      return {
        ...producto,
        subtotal: calculos.subtotal,
        total: calculos.total,
        impuestos: calculos.impuestos,
        tieneImpuestos: calculos.tieneImpuestos,
      };
    },
  );

  return {
    productos: productosActualizados,
    subtotalFactura: parseFloat(subtotalFactura.toFixed(2)),
    totalImpuestos: parseFloat(totalImpuestos.toFixed(2)),
  };
};

const downloadInvoiceDocuments = async (
  cfdiId: string,
  customerName: string,
) => {
  try {
    const pdfResult = await getInvoicePDF(cfdiId);
    if (pdfResult.ok && pdfResult.pdfBase64) {
      const fileName = `Factura-${cfdiId}.pdf`;
      downloadInvoicePDF(pdfResult.pdfBase64, fileName);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const xmlResult = await getInvoiceXML(cfdiId);
    if (xmlResult.ok && xmlResult.xmlBase64) {
      const fileName = `Factura-${cfdiId}.xml`;
      downloadInvoiceXML(xmlResult.xmlBase64, fileName);
    }
  } catch (error) {
    console.error("Error descargando documentos:", error);
  }
};

export function ManualBillingForm({
  onSubmit,
  onEmitInvoice,
  isSubmitting,
  onCancel,
  initialData,
  draftId,
  isEditMode = false,
}: ManualBillingFormProps) {
  const [initialFormData, setInitialFormData] =
    useState<ManualInvoiceData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedState = useRef<ManualInvoiceData | null>(null);

  const [formData, setFormData] = useState<ManualInvoiceData>(
    initialData || {
      paymentType: "efectivo",
      rfc: "",
      razonSocial: "",
      calle: "",
      colonia: "",
      numeroInterior: "",
      numeroExterior: "",
      ciudad: "",
      codigoPostalFiscal: "",
      usoCFDI: "",
      regimenFiscal: "",
      productos: [],
      costoEnvio: 0,
      company: "",
      descuentoGeneral: 0,
    },
  );
  const [displayedCompanies, setDisplayedCompanies] = useState<
    Array<{ id: string; name: string; rfc?: string }>
  >([]);

  const [selectedCompany, setSelectedCompany] = useState<string>(
    formData.company || ""
  );
  const handleCompanyChange = (companyId: string) => {
  setFormData((prev) => ({
    ...prev,
    company: companyId,
  }));

  setSelectedCompany(companyId);

  if (errors.company) {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.company;
      return newErrors;
    });
  }
};
useEffect(() => {
  const fetchCompanies = async () => {
    try {
      const response: CompaniesResponse = await getCompanies();

      // Mapear al formato esperado
      const companies = response.companies.map((c) => ({
        id: c.id,       // Asegúrate de que tu Company tenga id
        name: c.name,   // Asegúrate de que tenga name
        rfc: c.rfc ?? undefined, // evita null, ahora es compatible con el estado
      }));

      setDisplayedCompanies(companies);
    } catch (error) {
      console.error("Error cargando compañías:", error);
    }
  };

  fetchCompanies();
}, []);
  const [tipoPersona, setTipoPersona] = useState<string>("");
  const [regimenOptions, setRegimenOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [usoCfdiOptions, setUsoCfdiOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [cfdiValidationResult, setCfdiValidationResult] =
    useState<ValidationResult | null>(null);

  const [invoiceCalculations, setInvoiceCalculations] =
    useState<CalculosFactura>({
      subtotalFactura: 0,
      totalImpuestos: 0,
      totalFactura: 0,
    });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isEmittingInvoice, setIsEmittingInvoice] = useState(false);
  const [savedInvoiceId, setSavedInvoiceId] = useState<string | null>(
    draftId || null,
  );
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setInitialFormData(initialData);
      lastSavedState.current = initialData;

      const { subtotalFactura, totalImpuestos } = calculateInvoiceTotals(
        initialData.productos,
      );
      const totalFactura =
        subtotalFactura - (initialData.descuentoGeneral || 0) + totalImpuestos + (initialData.costoEnvio || 0);
      setInvoiceCalculations({
        subtotalFactura,
        totalImpuestos,
        totalFactura,
      });

      setHasUnsavedChanges(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (initialFormData && isEditMode) {
      const hasChanges = !areObjectsEqual(formData, initialFormData);
      setHasUnsavedChanges(hasChanges);
    }
  }, [formData, initialFormData, isEditMode]);

  useEffect(() => {
    const updateRegimenOptions = async () => {
      if (formData.rfc.length >= 12) {
        const rfcValidation = validateRfcFormat(formData.rfc);
        if (rfcValidation.isValid) {
          const options = await getRegimenOptionsForRfc(formData.rfc);
          setRegimenOptions(options);

          const tipo = getTipoPersonaByRfc(formData.rfc);
          setTipoPersona(tipo);

          if (
            formData.regimenFiscal &&
            !options.some((o) => o.value === formData.regimenFiscal)
          ) {
            setFormData((prev) => ({
              ...prev,
              regimenFiscal: "",
              usoCFDI: "",
            }));
            setUsoCfdiOptions([]);
          }
        }
      } else {
        setRegimenOptions([]);
        setTipoPersona("");
      }
    };
    updateRegimenOptions();
  }, [formData.rfc]);

  useEffect(() => {
    const updateUsoCfdiOptions = async () => {
      if (formData.rfc.length >= 12 && formData.regimenFiscal) {
        const options = await getUsoCfdiOptionsForRegimen(
          formData.rfc,
          formData.regimenFiscal,
        );
        setUsoCfdiOptions(options);

        if (
          formData.usoCFDI &&
          !options.some((o) => o.value === formData.usoCFDI)
        ) {
          setFormData((prev) => ({ ...prev, usoCFDI: "" }));
        }
      } else {
        setUsoCfdiOptions([]);
      }
    };
    updateUsoCfdiOptions();
  }, [formData.rfc, formData.regimenFiscal]);

  useEffect(() => {
    if (
      formData.rfc &&
      formData.regimenFiscal &&
      formData.usoCFDI &&
      formData.codigoPostalFiscal &&
      formData.razonSocial
    ) {
      const result = validateBillingData(
        {
          rfc: formData.rfc,
          fiscal_regime: formData.regimenFiscal,
          cfdi_use: formData.usoCFDI,
          tax_zip_code: formData.codigoPostalFiscal,
          name: formData.razonSocial,
        },
        EXPEDITION_ZIP_CODE,
      );
      setCfdiValidationResult(result);
    } else {
      setCfdiValidationResult(null);
    }
  }, [
    formData.rfc,
    formData.regimenFiscal,
    formData.usoCFDI,
    formData.codigoPostalFiscal,
    formData.razonSocial,
  ]);

  const updateProductCalculations = (productos: ProductoConImpuestos[]) => {
    const {
      productos: productosActualizados,
      subtotalFactura,
      totalImpuestos,
    } = calculateInvoiceTotals(productos);

    const totalFactura =
      subtotalFactura - (formData.descuentoGeneral || 0) + totalImpuestos + (formData.costoEnvio || 0);

    setFormData((prev) => ({
      ...prev,
      productos: productosActualizados,
    }));

    setInvoiceCalculations({
      subtotalFactura,
      totalImpuestos,
      totalFactura,
    });
  };

  const showErrorToast = (errorsArray: any[], title?: string) => {
    if (!errorsArray || errorsArray.length === 0) {
      toast.error("Error desconocido", { duration: 8000 });
      return;
    }

    const errorStrings = errorsArray
      .map((err) => {
        if (err === null || err === undefined) return "";
        if (typeof err === "string") return err;
        if (typeof err === "object") {
          try {
            return JSON.stringify(err);
          } catch {
            return String(err);
          }
        }
        return String(err);
      })
      .filter((err) => err && err.trim() !== "");

    if (errorStrings.length === 0) {
      toast.error("Error desconocido", { duration: 8000 });
      return;
    }

    if (errorStrings.length === 1) {
      toast.error(errorStrings[0], { duration: 8000 });
    } else {
      toast.error(
        <div>
          <p className="font-medium mb-2">
            {title || "Errores de validación:"}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errorStrings.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>,
        { duration: 10000 },
      );
    }
  };

  const showWarningToasts = (warnings: string[]) => {
    warnings.forEach((warning) => toast.warning(warning, { duration: 5000 }));
  };

  const getTipoPersonaLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      moral: "Persona Moral",
      fisica: "Persona Física",
      generico: "Público en General",
      extranjero: "Extranjero",
    };
    return labels[tipo] || tipo;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.company) newErrors.company = "Debes seleccionar una compañía";
    if (!formData.rfc.trim()) newErrors.rfc = "El RFC es requerido";
    if (!formData.razonSocial.trim())
      newErrors.razonSocial = "La razón social es requerida";
    if (!formData.calle.trim()) newErrors.calle = "La calle es requerida";
    if (!formData.colonia.trim()) newErrors.colonia = "La colonia es requerida";
    if (!formData.numeroExterior.trim())
      newErrors.numeroExterior = "El número exterior es requerido";
    if (!formData.ciudad.trim()) newErrors.ciudad = "La ciudad es requerida";
    if (!formData.codigoPostalFiscal.trim())
      newErrors.codigoPostalFiscal = "El código postal fiscal es requerido";
    if (!formData.usoCFDI.trim())
      newErrors.usoCFDI = "El uso CFDI es requerido";
    if (!formData.regimenFiscal.trim())
      newErrors.regimenFiscal = "El régimen fiscal es requerido";
    if (formData.productos.length === 0)
      newErrors.productos = "Debes agregar al menos un producto";

    if (formData.rfc.trim()) {
      const rfcValidation = validateRfcFormat(formData.rfc);
      if (!rfcValidation.isValid) {
        newErrors.rfc = rfcValidation.error || "RFC inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCfdiBeforeEmit = (): boolean => {
    const validation = validateBillingData(
      {
        rfc: formData.rfc,
        fiscal_regime: formData.regimenFiscal,
        cfdi_use: formData.usoCFDI,
        tax_zip_code: formData.codigoPostalFiscal,
        name: formData.razonSocial,
      },
      EXPEDITION_ZIP_CODE,
    );

    if (!validation.isValid) {
      showErrorToast(validation.errors, "Datos de facturación inválidos:");
      return false;
    }

    if (validation.warnings.length > 0) {
      showWarningToasts(validation.warnings);
    }

    return true;
  };

  const handleRfcChange = (value: string) => {
    const rfcUpper = value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, "");
    setFormData((prev) => ({
      ...prev,
      rfc: rfcUpper,
      regimenFiscal: "",
      usoCFDI: "",
    }));

    if (errors.rfc) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.rfc;
        return newErrors;
      });
    }
  };

  const handleInputChange = (
    field: keyof ManualInvoiceData,
    value: string | number,
  ) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    if (field === "costoEnvio") {
      const totalFactura =
        invoiceCalculations.subtotalFactura -
        (formData.descuentoGeneral || 0) +
        invoiceCalculations.totalImpuestos +
        (Number(value) || 0);
      setInvoiceCalculations((prev) => ({
        ...prev,
        totalFactura,
      }));
    }

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (validateForm()) {
      setLocalIsSubmitting(true);
      try {
        const result = await onSubmit(formData);
        if (result.success && result.invoice?.id) {
          setSavedInvoiceId(result.invoice.id);
          lastSavedState.current = formData;
          setHasUnsavedChanges(false);

          toast.success(
            result.message ||
              `Borrador ${isEditMode ? "actualizado" : "guardado"} exitosamente`,
          );
        } else {
          toast.error(
            `Error al ${isEditMode ? "actualizar" : "guardar"} el borrador`,
          );
        }
      } catch (error) {
        console.error("Error al guardar borrador:", error);
        toast.error(
          `Error al ${isEditMode ? "actualizar" : "guardar"} el borrador`,
        );
      } finally {
        setLocalIsSubmitting(false);
      }
    }
  };

  const confirmEmitInvoice = () => {
    if (isEditMode && hasUnsavedChanges) {
      toast.warning(
        "Tienes cambios sin guardar. Guarda el borrador antes de emitir la factura.",
      );
      return;
    }

    if (!validateCfdiBeforeEmit()) {
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleEmitInvoice = async () => {
    const invoiceId = savedInvoiceId || draftId;
    if (!invoiceId) {
      toast.warning(
        "Primero debes guardar el borrador antes de emitir la factura",
      );
      return;
    }

    if (isEditMode && hasUnsavedChanges) {
      toast.error(
        "Tienes cambios sin guardar. Guarda el borrador antes de emitir la factura.",
      );
      setShowConfirmDialog(false);
      return;
    }

    if (!validateCfdiBeforeEmit()) {
      setShowConfirmDialog(false);
      return;
    }

    setShowConfirmDialog(false);
    setIsEmittingInvoice(true);
    try {
      if (onEmitInvoice) {
        const invoiceResult = await onEmitInvoice(invoiceId, formData);

        if (invoiceResult.ok && invoiceResult.cfdiId) {
          toast.success(
            "Factura emitida exitosamente. Descargando documentos...",
          );

          await downloadInvoiceDocuments(
            invoiceResult.cfdiId,
            formData.razonSocial,
          );

          toast.success("Documentos descargados exitosamente");

          setTimeout(() => {
            if (onCancel) onCancel();
          }, 2000);
        } else {
          let errorsToShow: string[] = [];

          if (invoiceResult.error) {
            if (typeof invoiceResult.error === "string") {
              try {
                const parsed = JSON.parse(invoiceResult.error);
                errorsToShow = await parseFacturamaErrors(parsed);
              } catch {
                errorsToShow = [invoiceResult.error];
              }
            } else if (typeof invoiceResult.error === "object") {
              errorsToShow = await parseFacturamaErrors(invoiceResult.error);
            }
          }

          if (errorsToShow.length === 0) {
            if (invoiceResult.error) {
              if (typeof invoiceResult.error === "object") {
                const errorObj = invoiceResult.error as any;
                if (errorObj.Message) {
                  errorsToShow = [String(errorObj.Message)];
                } else if (errorObj.message) {
                  errorsToShow = [String(errorObj.message)];
                } else {
                  try {
                    errorsToShow = [JSON.stringify(invoiceResult.error)];
                  } catch {
                    errorsToShow = ["Error desconocido del servidor"];
                  }
                }
              } else {
                errorsToShow = [String(invoiceResult.error)];
              }
            } else {
              errorsToShow = ["Error desconocido al emitir la factura"];
            }
          }

          showErrorToast(errorsToShow, "Error al emitir factura:");
        }
      } else {
        toast.error("No se puede emitir la factura - función no disponible");
      }
    } catch (error: any) {
      console.error("Error al emitir factura:", error);

      let errorsToShow: string[] = [];

      if (error?.response?.data) {
        errorsToShow = await parseFacturamaErrors(error.response.data);
      } else if (error.message) {
        try {
          const parsed = JSON.parse(error.message);
          errorsToShow = await parseFacturamaErrors(parsed);
        } catch {
          errorsToShow = [error.message];
        }
      }

      if (errorsToShow.length === 0) {
        errorsToShow = ["Error inesperado al emitir la factura"];
      }

      showErrorToast(errorsToShow, "Error al emitir factura:");
    } finally {
      setIsEmittingInvoice(false);
    }
  };

  const isFormComplete =
    formData.rfc.trim() !== "" &&
    formData.razonSocial.trim() !== "" &&
    formData.calle.trim() !== "" &&
    formData.colonia.trim() !== "" &&
    formData.numeroExterior.trim() !== "" &&
    formData.ciudad.trim() !== "" &&
    formData.codigoPostalFiscal.trim() !== "" &&
    formData.usoCFDI.trim() !== "" &&
    formData.regimenFiscal.trim() !== "" &&
    formData.productos.length > 0;

  const isCfdiValid =
    cfdiValidationResult === null || cfdiValidationResult.isValid;

  const isEmitButtonDisabled =
    !isFormComplete ||
    isSubmitting ||
    localIsSubmitting ||
    isEmittingInvoice ||
    (isEditMode && hasUnsavedChanges) ||
    !isCfdiValid;

  return (
    <div className="space-y-6">
      {onCancel && (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="gap-2 text-gray-400 hover:text-yellow-400 hover:bg-[#0E1421]"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al listado
        </Button>
      )}

      {isEditMode && hasUnsavedChanges && (
        <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <div className="text-sm text-amber-300">
              <p className="font-medium">Tienes cambios sin guardar</p>
              <p className="text-xs mt-1 text-amber-400">
                Guarda el borrador antes de emitir la factura.
              </p>
            </div>
          </div>
        </div>
      )}

      {cfdiValidationResult && !cfdiValidationResult.isValid && (
        <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div className="text-sm text-red-300">
              <p className="font-medium">Errores en datos fiscales:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {cfdiValidationResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <Card className="bg-[#0A0F17] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5 text-yellow-400" />
            Información de Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentType">
                Tipo de Pago <span className="text-red-500">*</span>
              </Label>
            <Select
              value={formData.paymentType}
              onValueChange={(value: string) =>
                handleInputChange("paymentType", value)
              }
            >
              <SelectTrigger
                id="paymentType"
                className="bg-[#0F1623] border-gray-700 text-white w-full"
              >
                <SelectValue placeholder="Método de pago" />
              </SelectTrigger>

              <SelectContent className="bg-[#0F1623] border-gray-700 text-white max-h-[260px]">

              {/* Métodos comunes */}
            <SelectItem value="efectivo">Efectivo</SelectItem>
            <SelectItem value="transferencia">Transferencia</SelectItem>
            <SelectItem value="tarjeta_credito">Tarjeta crédito</SelectItem>
            <SelectItem value="tarjeta_debito">Tarjeta débito</SelectItem>
            <SelectItem value="cheque">Cheque</SelectItem>

            {/* Separador */}
            <div className="px-2 py-1 text-xs text-gray-400">
              Otros métodos
            </div>

            <SelectItem value="tarjeta_servicios">Tarjeta servicios</SelectItem>
            <SelectItem value="monedero">Monedero electrónico</SelectItem>
            <SelectItem value="dinero_electronico">Dinero electrónico</SelectItem>
            <SelectItem value="vales">Vales despensa</SelectItem>
            <SelectItem value="dacion_pago">Dación pago</SelectItem>
            <SelectItem value="subrogacion">Subrogación</SelectItem>
            <SelectItem value="consignacion">Consignación</SelectItem>
            <SelectItem value="condonacion">Condonación</SelectItem>
            <SelectItem value="compensacion">Compensación</SelectItem>
            <SelectItem value="novacion">Novación</SelectItem>
            <SelectItem value="confusion">Confusión</SelectItem>
            <SelectItem value="remision_deuda">Remisión deuda</SelectItem>
            <SelectItem value="prescripcion">Prescripción</SelectItem>
            <SelectItem value="satisfaccion">Satisfacción acreedor</SelectItem>
            <SelectItem value="anticipos">Aplicación anticipos</SelectItem>
            <SelectItem value="intermediario">Intermediario pagos</SelectItem>

            <SelectItem value="por_definir" className="text-amber-400 font-semibold">
              Por definir
            </SelectItem>

  </SelectContent>
</Select>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* selector de compañía y sucursales */}
      <Card className="bg-[#111827]/50 border-gray-800/60 backdrop-blur-sm">
  <CardHeader className="pb-3">
    <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-300">
      <Building2 className="w-4 h-4 text-yellow-500" />
      Sucursal
    </CardTitle>
  </CardHeader>
  
  <CardContent>
    <Select
      value={selectedCompany}
      onValueChange={handleCompanyChange}
      disabled={displayedCompanies.length === 0}
    >
      <SelectTrigger
        className={`w-full h-11 bg-[#0A0F17] border-gray-700/50 text-gray-200 
        hover:bg-[#161B22] hover:border-gray-600 transition-all duration-200
        focus:ring-1 focus:ring-yellow-500/50 focus:border-yellow-500/50
        disabled:opacity-40
        ${errors.company ? "border-red-500/50 focus:ring-red-500/30" : ""}`}
      >
        <SelectValue
          placeholder={
            displayedCompanies.length === 0
              ? "No hay compañías disponibles"
              : "Seleccionar compañía"
          }
        />
      </SelectTrigger>

      <SelectContent className="bg-[#0D1117] border-gray-800 shadow-2xl max-h-80">
        {displayedCompanies.map((company) => (
          <SelectItem
            key={company.id}
            value={company.id}
            className="cursor-pointer mx-1 my-1 rounded-md
            text-gray-300 focus:bg-yellow-500/10 focus:text-yellow-500
            transition-colors duration-150"
          >
            <div className="flex items-center gap-3 py-1">
              {/* Icono minimalista */}
              <div className="flex items-center justify-center w-8 h-8 rounded bg-gray-800/50 group-hover:bg-yellow-500/20">
                <Building className="w-4 h-4 text-gray-400 group-focus:text-yellow-500" />
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none mb-1">
                  {company.name}
                </span>
                {company.rfc && (
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">
                    {company.rfc}
                  </span>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </CardContent>
</Card>
      <Card className="bg-[#0A0F17] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5 text-yellow-400" />
            Información Fiscal del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rfc">
                RFC <span className="text-red-500">*</span>
              </Label>
              <Input
                id="rfc"
                value={formData.rfc}
                onChange={(e) => handleRfcChange(e.target.value)}
                disabled={isSubmitting || localIsSubmitting}
                placeholder="XAXX010101000"
                maxLength={13}
                className={errors.rfc ? "border-red-500" : ""}
              />
              {tipoPersona && (
                <p className="text-xs text-yellow-400 mt-1">
                  Tipo: {getTipoPersonaLabel(tipoPersona)}
                </p>
              )}
              {errors.rfc && (
                <p className="text-red-400 text-xs mt-1">{errors.rfc}</p>
              )}
            </div>

            <div>
              <Label htmlFor="razonSocial">
                Razón Social <span className="text-red-500">*</span>
              </Label>
              <Input
                id="razonSocial"
                value={formData.razonSocial}
                onChange={(e) =>
                  handleInputChange("razonSocial", e.target.value)
                }
                disabled={isSubmitting || localIsSubmitting}
                placeholder="Nombre o Razón Social"
                className={errors.razonSocial ? "border-red-500" : ""}
              />
              {errors.razonSocial && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.razonSocial}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="regimenFiscal">
                Régimen Fiscal <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.regimenFiscal}
                onValueChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    regimenFiscal: value,
                    usoCFDI: "",
                  }));
                  if (errors.regimenFiscal) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.regimenFiscal;
                      return newErrors;
                    });
                  }
                }}
                disabled={
                  isSubmitting ||
                  localIsSubmitting ||
                  regimenOptions.length === 0
                }
              >
                <SelectTrigger
                  id="regimenFiscal"
                  className={errors.regimenFiscal ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={
                      regimenOptions.length === 0
                        ? "Ingresa un RFC válido primero"
                        : "Selecciona el régimen fiscal"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {regimenOptions.map((regimen) => (
                    <SelectItem key={regimen.value} value={regimen.value}>
                      {regimen.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {regimenOptions.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {regimenOptions.length} régimen(es) disponible(s) para{" "}
                  {getTipoPersonaLabel(tipoPersona)}
                </p>
              )}
              {errors.regimenFiscal && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.regimenFiscal}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="usoCFDI">
                Uso CFDI <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.usoCFDI}
                onValueChange={(value) => {
                  handleInputChange("usoCFDI", value);
                }}
                disabled={
                  isSubmitting ||
                  localIsSubmitting ||
                  usoCfdiOptions.length === 0
                }
              >
                <SelectTrigger
                  id="usoCFDI"
                  className={errors.usoCFDI ? "border-red-500" : ""}
                >
                  <SelectValue
                    placeholder={
                      usoCfdiOptions.length === 0
                        ? "Selecciona un régimen primero"
                        : "Selecciona el uso CFDI"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {usoCfdiOptions.map((uso) => (
                    <SelectItem key={uso.value} value={uso.value}>
                      {uso.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {usoCfdiOptions.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {usoCfdiOptions.length} uso(s) disponible(s) para este régimen
                </p>
              )}
              {errors.usoCFDI && (
                <p className="text-red-400 text-xs mt-1">{errors.usoCFDI}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0A0F17] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5 text-yellow-400" />
            Domicilio de Facturación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="calle">
                Calle <span className="text-red-500">*</span>
              </Label>
              <Input
                id="calle"
                value={formData.calle}
                onChange={(e) => handleInputChange("calle", e.target.value)}
                disabled={isSubmitting || localIsSubmitting}
                placeholder="Nombre de la calle"
                className={errors.calle ? "border-red-500" : ""}
              />
              {errors.calle && (
                <p className="text-red-400 text-xs mt-1">{errors.calle}</p>
              )}
            </div>

            <div>
              <Label htmlFor="numeroExterior">
                Número Exterior <span className="text-red-500">*</span>
              </Label>
              <Input
                id="numeroExterior"
                value={formData.numeroExterior}
                onChange={(e) =>
                  handleInputChange("numeroExterior", e.target.value)
                }
                disabled={isSubmitting || localIsSubmitting}
                placeholder="123"
                className={errors.numeroExterior ? "border-red-500" : ""}
              />
              {errors.numeroExterior && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.numeroExterior}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="numeroInterior">Número Interior</Label>
              <Input
                id="numeroInterior"
                value={formData.numeroInterior}
                onChange={(e) =>
                  handleInputChange("numeroInterior", e.target.value)
                }
                disabled={isSubmitting || localIsSubmitting}
                placeholder="A, 101, etc. (opcional)"
              />
            </div>

            <div>
              <Label htmlFor="colonia">
                Colonia <span className="text-red-500">*</span>
              </Label>
              <Input
                id="colonia"
                value={formData.colonia}
                onChange={(e) => handleInputChange("colonia", e.target.value)}
                disabled={isSubmitting || localIsSubmitting}
                placeholder="Nombre de la colonia"
                className={errors.colonia ? "border-red-500" : ""}
              />
              {errors.colonia && (
                <p className="text-red-400 text-xs mt-1">{errors.colonia}</p>
              )}
            </div>

            <div>
              <Label htmlFor="ciudad">
                Ciudad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ciudad"
                value={formData.ciudad}
                onChange={(e) => handleInputChange("ciudad", e.target.value)}
                disabled={isSubmitting || localIsSubmitting}
                placeholder="Ciudad"
                className={errors.ciudad ? "border-red-500" : ""}
              />
              {errors.ciudad && (
                <p className="text-red-400 text-xs mt-1">{errors.ciudad}</p>
              )}
            </div>

            <div>
              <Label htmlFor="codigoPostalFiscal">
                Código Postal Fiscal <span className="text-red-500">*</span>
              </Label>
              <Input
                id="codigoPostalFiscal"
                value={formData.codigoPostalFiscal}
                onChange={(e) =>
                  handleInputChange(
                    "codigoPostalFiscal",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                disabled={isSubmitting || localIsSubmitting}
                placeholder="12345"
                maxLength={5}
                className={errors.codigoPostalFiscal ? "border-red-500" : ""}
              />
              {errors.codigoPostalFiscal && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.codigoPostalFiscal}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0A0F17] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Truck className="w-5 h-5 text-yellow-400" />
            Costo de Envío
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Label htmlFor="costoEnvio">Costo de Envío</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500 text-sm">
                $
              </span>
              <Input
                id="costoEnvio"
                type="number"
                step="0.01"
                min="0"
                value={formData.costoEnvio}
                onChange={(e) =>
                  handleInputChange(
                    "costoEnvio",
                    Number.parseFloat(e.target.value) || 0,
                  )
                }
                disabled={isSubmitting || localIsSubmitting}
                className="pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0A0F17] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ShoppingCart className="w-5 h-5 text-yellow-400" />
            Productos Adquiridos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductSelector
            productos={formData.productos}
            onChange={(productos) => updateProductCalculations(productos)}
            disabled={isSubmitting || localIsSubmitting}
          />
          {errors.productos && (
            <p className="text-red-400 text-xs mt-2">{errors.productos}</p>
          )}
        </CardContent>
      </Card>

      {formData.productos.length > 0 && (
        <Card className="bg-yellow-400/10 border-yellow-400/30">
          <CardHeader>
            <CardTitle className="text-lg text-white">Resumen de Factura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Subtotal:</span>
                <span className="font-medium text-white">
                  ${invoiceCalculations.subtotalFactura.toFixed(2)}
                </span>
              </div>
              {formData.descuentoGeneral && formData.descuentoGeneral > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Descuento:</span>
                  <span className="font-medium">
                    -${formData.descuentoGeneral.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm text-gray-300">
                <span>Impuestos:</span>
                <span className="font-medium text-white">
                  ${invoiceCalculations.totalImpuestos.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-300">
                <span>Costo de Envío:</span>
                <span className="font-medium text-white">
                  ${formData.costoEnvio.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-yellow-400/30 pt-2 text-yellow-400">
                <span>Total:</span>
                <span>${invoiceCalculations.totalFactura.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting || localIsSubmitting || isEmittingInvoice}
          onClick={onCancel}
          className="border-gray-700 hover:bg-[#070B14]"
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={isSubmitting || localIsSubmitting || isEmittingInvoice}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
          onClick={handleSaveDraft}
        >
          {localIsSubmitting
            ? "Guardando..."
            : isEditMode
              ? "Actualizar Borrador"
              : "Guardar Borrador"}
        </Button>
        {(savedInvoiceId || draftId) && (
          <Button
            type="button"
            disabled={isEmitButtonDisabled}
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={confirmEmitInvoice}
          >
            {isEmittingInvoice ? "Emitiendo..." : "Emitir Factura"}
          </Button>
        )}
      </div>

      {/* Modal de confirmación - SIN DialogDescription para evitar hydration errors */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md bg-[#0A0F17] border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-5 h-5" />
              Confirmar Emisión de Factura
            </DialogTitle>
          </DialogHeader>

          {/* Contenido del modal fuera de DialogDescription */}
          <div className="space-y-3 py-4">
            <p className="text-gray-300 text-sm">
              ¿Estás seguro de que quieres emitir esta factura? Una vez emitida
              no podrás realizar cambios.
            </p>
            <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-400 mb-2">
                Resumen de la factura:
              </p>
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium text-white">{formData.razonSocial}</span>
                </div>
                <div className="flex justify-between">
                  <span>RFC:</span>
                  <span className="font-medium text-white">{formData.rfc}</span>
                </div>
                <div className="flex justify-between">
                  <span>Régimen:</span>
                  <span className="font-medium text-white">{formData.regimenFiscal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uso CFDI:</span>
                  <span className="font-medium text-white">{formData.usoCFDI}</span>
                </div>
                <div className="flex justify-between">
                  <span>Productos:</span>
                  <span className="font-medium text-white">
                    {formData.productos.length}
                  </span>
                </div>
                <div className="flex justify-between border-t border-amber-900/50 pt-1 mt-1">
                  <span className="font-medium text-amber-400">Total:</span>
                  <span className="font-bold text-amber-400">
                    ${invoiceCalculations.totalFactura.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Verifica que todos los datos sean correctos antes de continuar.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="sm:flex-1 sm:mr-2 border-gray-700 hover:bg-[#070B14]"
              disabled={isEmittingInvoice}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleEmitInvoice}
              className="bg-green-600 hover:bg-green-700 sm:flex-1 text-white"
              disabled={isEmittingInvoice}
            >
              {isEmittingInvoice ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Emitiendo...
                </>
              ) : (
                "Sí, emitir factura"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
