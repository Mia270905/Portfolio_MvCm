"use client";

import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  FileText,
  User,
  MapPin,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getInvoiceDetails,
  getUserBillingAddresses,
  getOrderBasicInfo,
} from "@/lib/actions/cancel-invoice.actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { processInvoiceReplacement } from "@/lib/actions/cancel-invoice.actions";

// Datos CFDI (de la factura original)
export const CFDI_USES = [
  { value: "G01", label: "G01 - Adquisición de mercancías" },
  { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 - Gastos en general" },
  { value: "I01", label: "I01 - Construcciones" },
  {
    value: "I02",
    label: "I02 - Mobilario y equipo de oficina por inversiones",
  },
  { value: "I03", label: "I03 - Equipo de transporte" },
  { value: "I04", label: "I04 - Equipo de cómputo y accesorios" },
  {
    value: "I05",
    label: "I05 - Dados, troqueles, moldes, matrices y herramental",
  },
  { value: "I06", label: "I06 - Comunicaciones telefónicas" },
  { value: "I07", label: "I07 - Comunicaciones satelitales" },
  { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  {
    value: "D01",
    label: "D01 - Honorarios médicos, dentales y gastos hospitalarios",
  },
  {
    value: "D02",
    label: "D02 - Gastos médicos por incapacidad o discapacidad",
  },
  { value: "D03", label: "D03 - Gastos funerarios" },
  { value: "D04", label: "D04 - Donativos" },
  { value: "D05", label: "D05 - Intereses reales por créditos hipotecarios" },
  { value: "D06", label: "D06 - Aportaciones voluntarias al SAR" },
  { value: "D07", label: "D07 - Primas de seguros de gastos médicos" },
  { value: "D08", label: "D08 - Gastos de transportación escolar obligatoria" },
  { value: "D09", label: "D09 - Depósitos en cuentas para el ahorro" },
  {
    value: "D10",
    label: "D10 - Pagos por servicios educativos (colegiaturas)",
  },
  { value: "S01", label: "S01 - Sin efectos fiscales" },
  { value: "P01", label: "P01 - Por definir (obsoleto)" },
];

export const TAX_REGIMES = [
  { value: "601", label: "601 - General de Ley Personas Morales" },
  { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
  {
    value: "605",
    label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios",
  },
  { value: "606", label: "606 - Arrendamiento" },
  {
    value: "607",
    label: "607 - Régimen de Enajenación o Adquisición de Bienes",
  },
  { value: "608", label: "608 - Demás ingresos" },
  { value: "610", label: "610 - Residentes en el Extranjero sin EP en México" },
  { value: "611", label: "611 - Ingresos por Dividendos" },
  {
    value: "612",
    label: "612 - Personas Físicas con Actividades Empresariales",
  },
  { value: "614", label: "614 - Ingresos por intereses" },
  { value: "615", label: "615 - Obtención de premios" },
  { value: "616", label: "616 - Sin obligaciones fiscales" },
  { value: "620", label: "620 - Sociedades Cooperativas" },
  { value: "621", label: "621 - Incorporación Fiscal" },
  { value: "622", label: "622 - Actividades Agropecuarias" },
  { value: "623", label: "623 - Grupos de sociedades" },
  { value: "624", label: "624 - Coordinados" },
  { value: "625", label: "625 - Plataformas tecnológicas" },
  { value: "626", label: "626 - Régimen Simplificado de Confianza" },
];

// Interfaces
interface Producto {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuento?: number;
  subtotal: number;
  total: number;
}

interface BillingAddress {
  id: string;
  user_id: string;
  rfc: string;
  name: string;
  cfdi_use: string;
  fiscal_regime: string;
  tax_zip_code: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  is_active: boolean;
  created_at: string;
}

interface CancelInvoiceFormProps {
  orderNumber: string;
}

interface FormData {
  selectedBilling: string; // "new" o ID de la dirección existente
  updateAddress: boolean;

  // Datos de facturación
  rfc: string;
  name: string;
  cfdi_use: string;
  fiscal_regime: string;
  tax_zip_code: string;
  street: string;
  exterior_number: string;
  interior_number: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
}

// Interfaces para errores de validación
interface ValidationErrors {
  rfc?: string;
  name?: string;
  cfdi_use?: string;
  fiscal_regime?: string;
  tax_zip_code?: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export default function CancelInvoiceForm({
  orderNumber,
}: CancelInvoiceFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>(
    [],
  );
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  // Datos de la factura original
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);

  const [formData, setFormData] = useState<FormData>({
    selectedBilling: "new",
    updateAddress: false,

    // Datos de facturación - inicializados vacíos
    rfc: "",
    name: "",
    cfdi_use: "",
    fiscal_regime: "",
    tax_zip_code: "",
    street: "",
    exterior_number: "",
    interior_number: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "México",
    zip_code: "",
  });

  // Función para validar RFC según el formato SAT
  const validateRFC = (rfc: string): boolean => {
    // Eliminar espacios y convertir a mayúsculas
    const cleanedRFC = rfc.trim().toUpperCase();

    // Patrones de RFC
    const rfcPatterns = {
      personaFisica: /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/,
      personaMoral: /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/,
      extranjero: /^[A-Z][A-Z0-9&][A-Z0-9][0-9A-Z]$/,
    };

    // Validar longitud básica (12-13 caracteres)
    if (cleanedRFC.length < 12 || cleanedRFC.length > 13) {
      return false;
    }

    // Validar formato
    if (
      rfcPatterns.personaFisica.test(cleanedRFC) ||
      rfcPatterns.personaMoral.test(cleanedRFC)
    ) {
      return true;
    }

    return false;
  };

  // Función para validar código postal mexicano
  const validateZipCode = (zipCode: string): boolean => {
    const cleanedZip = zipCode.trim();
    return /^\d{5}$/.test(cleanedZip);
  };

  // Función para validar campos requeridos
  const validateRequiredField = (
    value: string,
    fieldName: string,
  ): string | undefined => {
    if (!value.trim()) {
      return `El campo ${fieldName} es requerido`;
    }
    return undefined;
  };

  // Función para validar longitud máxima
  const validateMaxLength = (
    value: string,
    maxLength: number,
    fieldName: string,
  ): string | undefined => {
    if (value.length > maxLength) {
      return `${fieldName} no debe exceder ${maxLength} caracteres`;
    }
    return undefined;
  };

  // Validación completa del formulario
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validar RFC
    if (
      formData.selectedBilling === "new" ||
      formData.rfc !== invoiceData?.rfc
    ) {
      if (!formData.rfc.trim()) {
        errors.rfc = "El RFC es requerido";
      } else if (!validateRFC(formData.rfc)) {
        errors.rfc = "RFC inválido. Formato: XXXX123456XXX (12-13 caracteres)";
      } else if (formData.rfc.length > 13) {
        errors.rfc = "El RFC no debe exceder 13 caracteres";
      }
    }

    // Validar Razón Social/Nombre
    if (
      formData.selectedBilling === "new" ||
      formData.name !== invoiceData?.razonSocial
    ) {
      const nameError = validateRequiredField(formData.name, "Razón Social");
      if (nameError) errors.name = nameError;
      else if (formData.name.length > 254) {
        errors.name = "La razón social no debe exceder 254 caracteres";
      }
    }

    // Validar Uso CFDI
    if (
      formData.selectedBilling === "new" ||
      formData.cfdi_use !== invoiceData?.usoCFDI
    ) {
      if (!formData.cfdi_use.trim()) {
        errors.cfdi_use = "El uso CFDI es requerido";
      }
    }

    // Validar Régimen Fiscal
    if (
      formData.selectedBilling === "new" ||
      formData.fiscal_regime !== invoiceData?.regimenFiscal
    ) {
      if (!formData.fiscal_regime.trim()) {
        errors.fiscal_regime = "El régimen fiscal es requerido";
      }
    }

    // Validar Código Postal Fiscal
    if (
      formData.selectedBilling === "new" ||
      formData.tax_zip_code !== invoiceData?.codigoPostal
    ) {
      if (!formData.tax_zip_code.trim()) {
        errors.tax_zip_code = "El código postal fiscal es requerido";
      } else if (!validateZipCode(formData.tax_zip_code)) {
        errors.tax_zip_code = "Código postal inválido. Debe tener 5 dígitos";
      }
    }

    // Validar dirección (solo si hay cambios)
    if (
      formData.selectedBilling === "new" ||
      formData.street !== invoiceData?.calle ||
      formData.exterior_number !== invoiceData?.numeroExterior ||
      formData.zip_code !== invoiceData?.codigoPostal
    ) {
      // Calle
      if (!formData.street.trim()) {
        errors.street = "La calle es requerida";
      } else if (formData.street.length > 200) {
        errors.street = "La calle no debe exceder 200 caracteres";
      }

      // Número Exterior
      if (!formData.exterior_number.trim()) {
        errors.exterior_number = "El número exterior es requerido";
      } else if (formData.exterior_number.length > 10) {
        errors.exterior_number =
          "El número exterior no debe exceder 10 caracteres";
      }

      // Número Interior (opcional pero validar longitud si existe)
      if (formData.interior_number && formData.interior_number.length > 10) {
        errors.interior_number =
          "El número interior no debe exceder 10 caracteres";
      }

      // Colonia
      if (!formData.neighborhood.trim()) {
        errors.neighborhood = "La colonia es requerida";
      } else if (formData.neighborhood.length > 100) {
        errors.neighborhood = "La colonia no debe exceder 100 caracteres";
      }

      // Ciudad
      if (!formData.city.trim()) {
        errors.city = "La ciudad es requerida";
      } else if (formData.city.length > 100) {
        errors.city = "La ciudad no debe exceder 100 caracteres";
      }

      // Estado
      if (!formData.state.trim()) {
        errors.state = "El estado es requerido";
      } else if (formData.state.length > 50) {
        errors.state = "El estado no debe exceder 50 caracteres";
      }

      // Código Postal
      if (!formData.zip_code.trim()) {
        errors.zip_code = "El código postal es requerido";
      } else if (!validateZipCode(formData.zip_code)) {
        errors.zip_code = "Código postal inválido. Debe tener 5 dígitos";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validar campo individual al perder foco
  const validateField = (fieldName: keyof ValidationErrors, value: string) => {
    const errors = { ...validationErrors };

    switch (fieldName) {
      case "rfc":
        if (!value.trim()) {
          errors.rfc = "El RFC es requerido";
        } else if (!validateRFC(value)) {
          errors.rfc =
            "RFC inválido. Formato: XXXX123456XXX (12-13 caracteres)";
        } else {
          delete errors.rfc;
        }
        break;

      case "name":
        if (!value.trim()) {
          errors.name = "La razón social es requerida";
        } else if (value.length > 254) {
          errors.name = "La razón social no debe exceder 254 caracteres";
        } else {
          delete errors.name;
        }
        break;

      case "tax_zip_code":
      case "zip_code":
        if (!value.trim()) {
          errors[fieldName] = "El código postal es requerido";
        } else if (!validateZipCode(value)) {
          errors[fieldName] = "Código postal inválido. Debe tener 5 dígitos";
        } else {
          delete errors[fieldName];
        }
        break;

      case "street":
        if (!value.trim()) {
          errors.street = "La calle es requerida";
        } else if (value.length > 200) {
          errors.street = "La calle no debe exceder 200 caracteres";
        } else {
          delete errors.street;
        }
        break;

      case "exterior_number":
        if (!value.trim()) {
          errors.exterior_number = "El número exterior es requerido";
        } else if (value.length > 10) {
          errors.exterior_number =
            "El número exterior no debe exceder 10 caracteres";
        } else {
          delete errors.exterior_number;
        }
        break;

      case "interior_number":
        if (value && value.length > 10) {
          errors.interior_number =
            "El número interior no debe exceder 10 caracteres";
        } else {
          delete errors.interior_number;
        }
        break;

      case "neighborhood":
        if (!value.trim()) {
          errors.neighborhood = "La colonia es requerida";
        } else if (value.length > 100) {
          errors.neighborhood = "La colonia no debe exceder 100 caracteres";
        } else {
          delete errors.neighborhood;
        }
        break;

      case "city":
        if (!value.trim()) {
          errors.city = "La ciudad es requerida";
        } else if (value.length > 100) {
          errors.city = "La ciudad no debe exceder 100 caracteres";
        } else {
          delete errors.city;
        }
        break;

      case "state":
        if (!value.trim()) {
          errors.state = "El estado es requerido";
        } else if (value.length > 50) {
          errors.state = "El estado no debe exceder 50 caracteres";
        } else {
          delete errors.state;
        }
        break;

      case "cfdi_use":
        if (!value.trim()) {
          errors.cfdi_use = "El uso CFDI es requerido";
        } else {
          delete errors.cfdi_use;
        }
        break;

      case "fiscal_regime":
        if (!value.trim()) {
          errors.fiscal_regime = "El régimen fiscal es requerido";
        } else {
          delete errors.fiscal_regime;
        }
        break;
    }

    setValidationErrors(errors);
  };

  // Calcular si hay cambios (usando useMemo para evitar bucles)
  const hasChanges = useMemo(() => {
    if (!invoiceData) return false;

    return (
      formData.rfc !== invoiceData.rfc ||
      formData.name !== invoiceData.razonSocial ||
      formData.cfdi_use !== invoiceData.usoCFDI ||
      formData.fiscal_regime !== invoiceData.regimenFiscal ||
      formData.tax_zip_code !== invoiceData.codigoPostal ||
      formData.street !== invoiceData.calle ||
      formData.exterior_number !== invoiceData.numeroExterior ||
      formData.interior_number !== (invoiceData.numeroInterior || "") ||
      formData.neighborhood !== invoiceData.colonia ||
      formData.city !== invoiceData.ciudad ||
      formData.zip_code !== invoiceData.codigoPostal
    );
  }, [formData, invoiceData]);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // 1. Obtener información básica de la orden
        const orderInfo = await getOrderBasicInfo(orderNumber);
        if (!orderInfo) {
          toast.error("No se encontró la orden");
          router.back();
          return;
        }
        setOrderData(orderInfo);

        // 2. Obtener detalles de la factura
        const invoiceDetails = await getInvoiceDetails(orderNumber);

        if (!invoiceDetails) {
          toast.error(
            "No se encontró información de facturación para esta orden",
          );
          router.back();
          return;
        }
        setInvoiceData(invoiceDetails);

        // 3. Cargar direcciones de facturación del usuario
        const addresses = await getUserBillingAddresses(orderInfo.user_id);
        setBillingAddresses(addresses);

        // 4. Cargar datos originales en el formulario (predeterminados)
        setFormData({
          selectedBilling: "new",
          updateAddress: false,

          // Datos originales de la factura como valores predeterminados
          rfc: invoiceDetails.rfc,
          name: invoiceDetails.razonSocial,
          cfdi_use: invoiceDetails.usoCFDI,
          fiscal_regime: invoiceDetails.regimenFiscal,
          tax_zip_code: invoiceDetails.codigoPostal,
          street: invoiceDetails.calle,
          exterior_number: invoiceDetails.numeroExterior,
          interior_number: invoiceDetails.numeroInterior || "",
          neighborhood: invoiceDetails.colonia,
          city: invoiceDetails.ciudad,
          state: invoiceDetails.regimenFiscal.includes("Nayarit")
            ? "Nayarit"
            : "",
          country: "México",
          zip_code: invoiceDetails.codigoPostal,
        });
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar los datos de la factura");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [orderNumber, router]);

  // Manejar cambio de selección de datos de facturación
  const handleBillingSelect = useCallback(
    (value: string) => {
      if (value === "new") {
        // Restaurar datos originales como valores predeterminados
        setFormData((prev) => ({
          ...prev,
          selectedBilling: "new",
          updateAddress: false,
          rfc: invoiceData?.rfc || "",
          name: invoiceData?.razonSocial || "",
          cfdi_use: invoiceData?.usoCFDI || "",
          fiscal_regime: invoiceData?.regimenFiscal || "",
          tax_zip_code: invoiceData?.codigoPostal || "",
          street: invoiceData?.calle || "",
          exterior_number: invoiceData?.numeroExterior || "",
          interior_number: invoiceData?.numeroInterior || "",
          neighborhood: invoiceData?.colonia || "",
          city: invoiceData?.ciudad || "",
          state: invoiceData?.regimenFiscal?.includes("Nayarit")
            ? "Nayarit"
            : "",
          zip_code: invoiceData?.codigoPostal || "",
        }));
      } else {
        // Buscar la dirección seleccionada
        const selectedAddress = billingAddresses.find(
          (addr) => addr.id === value,
        );
        if (selectedAddress) {
          setFormData((prev) => ({
            ...prev,
            selectedBilling: value,
            updateAddress: false,
            rfc: selectedAddress.rfc,
            name: selectedAddress.name,
            cfdi_use: selectedAddress.cfdi_use,
            fiscal_regime: selectedAddress.fiscal_regime,
            tax_zip_code: selectedAddress.tax_zip_code,
            street: selectedAddress.street || "",
            exterior_number: selectedAddress.exterior_number || "",
            interior_number: selectedAddress.interior_number || "",
            neighborhood: selectedAddress.neighborhood || "",
            city: selectedAddress.city || "",
            state: selectedAddress.state || "",
            country: selectedAddress.country || "México",
            zip_code:
              selectedAddress.zip_code || selectedAddress.tax_zip_code || "",
          }));
        }
      }
      // Limpiar errores al cambiar selección
      setValidationErrors({});
    },
    [invoiceData, billingAddresses],
  );

  const handleInputChange = useCallback(
    <K extends keyof FormData>(field: K, value: FormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Limpiar error del campo al escribir
      if (validationErrors[field as keyof ValidationErrors]) {
        setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [validationErrors],
  );

  // Modificar la función handleSubmit para validar antes de mostrar el diálogo
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    if (!validateForm()) {
      toast.error("Por favor, corrija los errores en el formulario");
      return;
    }

    // No permitir cancelar si no hay cambios
    if (!hasChanges) {
      toast.error(
        "No puede cancelar la factura sin realizar cambios en los datos de facturación",
      );
      return;
    }

    // Mostrar modal de confirmación
    setShowConfirmDialog(true);
  };

  // Resto del código permanece igual...
  const handleConfirmCancel = async () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    // Capturar el ID del toast para poder cerrarlo después
    const loadingToastId = toast.loading(
      "Procesando cancelación y nueva factura...",
    );

    try {
      const result = await processInvoiceReplacement({
        orderNumber,
        userId: orderData.user_id,
        originalFacturamaId: invoiceData.id_facturama || invoiceData.id,
        newBillingData: {
          rfc: formData.rfc,
          name: formData.name,
          cfdi_use: formData.cfdi_use,
          fiscal_regime: formData.fiscal_regime,
          tax_zip_code: formData.tax_zip_code,
          street: formData.street,
          exterior_number: formData.exterior_number,
          interior_number: formData.interior_number,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zip_code: formData.zip_code,
        },
        updateAddress:
          formData.updateAddress && formData.selectedBilling !== "new",
      });

      // Cerrar el toast de loading
      toast.dismiss(loadingToastId);

      if (result.ok) {
        const {
          newFacturamaId,
          originalCancelled,
          originalDeleted,
          newInvoiceUuid,
        } = result.data;

        let title = "Proceso completado";
        let description = "";

        if (originalCancelled && originalDeleted) {
          description = `Factura cancelada exitosamente y nueva factura generada.`;
          toast.success(title, { description, duration: 10000 });
        } else if (originalCancelled && !originalDeleted) {
          description = `Factura cancelada en Facturama. Nueva factura creada. Verifique el estado en base de datos.`;
          toast.warning(title, { description, duration: 10000 });
        } else if (!originalCancelled && originalDeleted) {
          description = `Nueva factura creada. La anterior fue marcada como eliminada pero no cancelada en Facturama.`;
          toast.warning(title, { description, duration: 10000 });
        } else {
          description = `Nueva factura creada. No se pudo modificar la anterior.`;
          toast.info(title, { description, duration: 10000 });
        }

        setTimeout(() => {
          router.push("/dashboard/facturacion/gestion");
          router.refresh();
        }, 3000);
      } else {
        if (result.error?.includes("CFDI no encontrado")) {
          toast.error("Factura no encontrada", {
            description:
              "La factura original no existe en Facturama. Se creó una nueva factura.",
            duration: 10000,
          });
        } else {
          toast.error("Error en el proceso", {
            description: result.error || "No se pudo completar la operación",
            duration: 10000,
          });
        }
      }
    } catch (error: any) {
      // Cerrar el toast de loading también en caso de error
      toast.dismiss(loadingToastId);

      console.error("Error en el proceso de cancelación:", error);
      toast.error("Error inesperado", {
        description: error.message || "Intente nuevamente o contacte a soporte",
        duration: 10000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Componente de mensaje de error
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;

    return (
      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {message}
      </p>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-gray-600">
            Cargando información de la factura...
          </p>
        </div>
      </div>
    );
  }

  if (!invoiceData || !orderData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Factura no encontrada
        </h3>
        <p className="mt-2 text-gray-600">
          No se pudo cargar la información de la factura #{orderNumber}
        </p>
        <Button onClick={() => router.back()} className="mt-6">
          Volver
        </Button>
      </div>
    );
  }

  // Calcular totales
  const totals = {
    subtotal: invoiceData.subtotal || 0,
    impuestos: invoiceData.impuestos || 0,
    costoEnvio: invoiceData.costoEnvio || 0,
    total: invoiceData.total || 0,
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>

        {/* Resumen de la factura original */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Resumen de Factura Original - Orden #{orderNumber}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Información del Cliente
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {invoiceData.customerName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {invoiceData.customerEmail}
                    </p>
                    <p>
                      <span className="font-medium">RFC:</span>{" "}
                      {invoiceData.rfc}
                    </p>
                    <p>
                      <span className="font-medium">Razón Social:</span>{" "}
                      {invoiceData.razonSocial}
                    </p>
                    <p>
                      <span className="font-medium">Uso CFDI:</span>{" "}
                      {invoiceData.usoCFDI}
                    </p>
                    <p>
                      <span className="font-medium">Régimen Fiscal:</span>{" "}
                      {invoiceData.regimenFiscal}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Domicilio Fiscal
                  </h3>
                  <div className="text-sm space-y-1">
                    <p>
                      {invoiceData.calle} {invoiceData.numeroExterior}
                    </p>
                    {invoiceData.numeroInterior && (
                      <p>Int. {invoiceData.numeroInterior}</p>
                    )}
                    <p>{invoiceData.colonia}</p>
                    <p>
                      {invoiceData.ciudad}, CP: {invoiceData.codigoPostal}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Productos ({invoiceData.productos.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {invoiceData.productos.map((producto: Producto) => (
                    <div
                      key={producto.id}
                      className="flex justify-between text-sm border-b pb-2"
                    >
                      <div>
                        <span className="font-medium">{producto.nombre}</span>
                        <div className="text-gray-600 text-xs">
                          {producto.cantidad} × $
                          {producto.precioUnitario.toFixed(2)}
                          {producto.descuento && producto.descuento > 0 && (
                            <span className="text-green-600 ml-2">
                              (Descuento: ${producto.descuento.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-medium">
                        ${producto.total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impuestos:</span>
                    <span>${totals.impuestos.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costo de Envío:</span>
                    <span>${totals.costoEnvio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Total:</span>
                    <span>${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selección de datos de facturación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Seleccionar Datos de Facturación para Cancelación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="billing-select"
                  className="text-base font-medium mb-2 block"
                >
                  Seleccione datos de facturación
                </Label>
                <Select
                  value={formData.selectedBilling}
                  onValueChange={handleBillingSelect}
                >
                  <SelectTrigger id="billing-select" className="w-full">
                    <SelectValue placeholder="Seleccione datos de facturación" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Opción para ingresar nuevos datos */}
                    <SelectItem value="new">
                      Ingresar nuevos datos de facturación
                    </SelectItem>

                    {/* Separador visual */}
                    <div className="border-t my-1"></div>

                    {/* Direcciones existentes del cliente */}
                    {billingAddresses.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-gray-500 text-center">
                        El cliente no tiene direcciones de facturación guardadas
                      </div>
                    ) : (
                      billingAddresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{address.name}</span>
                            <span className="text-xs text-gray-500">
                              {address.rfc} • {address.city}, {address.state}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Nota informativa */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium mb-1">Importante:</p>
                    <p>
                      Debe realizar cambios en los datos de facturación para
                      proceder con la cancelación.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulario de datos de facturación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Datos de Facturación
              {hasChanges && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Cambios detectados
                </span>
              )}
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
                  onChange={(e) =>
                    handleInputChange("rfc", e.target.value.toUpperCase())
                  }
                  onBlur={() => validateField("rfc", formData.rfc)}
                  disabled={isSubmitting}
                  placeholder="XAXX010101000"
                  className={
                    validationErrors.rfc
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={13}
                />
                <ErrorMessage message={validationErrors.rfc} />
              </div>

              <div>
                <Label htmlFor="name">
                  Razón Social <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onBlur={() => validateField("name", formData.name)}
                  disabled={isSubmitting}
                  placeholder="Nombre o Razón Social"
                  className={
                    validationErrors.name
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={254}
                />
                <ErrorMessage message={validationErrors.name} />
              </div>

              <div>
                <Label htmlFor="cfdi_use">
                  Uso CFDI <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.cfdi_use}
                  onValueChange={(value) =>
                    handleInputChange("cfdi_use", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="cfdi_use"
                    className={
                      validationErrors.cfdi_use
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Selecciona el uso CFDI" />
                  </SelectTrigger>
                  <SelectContent>
                    {CFDI_USES.map((uso) => (
                      <SelectItem key={uso.value} value={uso.value}>
                        {uso.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorMessage message={validationErrors.cfdi_use} />
              </div>

              <div>
                <Label htmlFor="fiscal_regime">
                  Régimen Fiscal <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.fiscal_regime}
                  onValueChange={(value) =>
                    handleInputChange("fiscal_regime", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="fiscal_regime"
                    className={
                      validationErrors.fiscal_regime
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  >
                    <SelectValue placeholder="Selecciona el régimen fiscal" />
                  </SelectTrigger>
                  <SelectContent>
                    {TAX_REGIMES.map((regimen) => (
                      <SelectItem key={regimen.value} value={regimen.value}>
                        {regimen.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ErrorMessage message={validationErrors.fiscal_regime} />
              </div>

              <div>
                <Label htmlFor="tax_zip_code">
                  Código Postal Fiscal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tax_zip_code"
                  value={formData.tax_zip_code}
                  onChange={(e) => {
                    // Solo permitir números
                    const value = e.target.value.replace(/\D/g, "");
                    handleInputChange("tax_zip_code", value);
                  }}
                  onBlur={() =>
                    validateField("tax_zip_code", formData.tax_zip_code)
                  }
                  disabled={isSubmitting}
                  placeholder="12345"
                  className={
                    validationErrors.tax_zip_code
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={5}
                />
                <ErrorMessage message={validationErrors.tax_zip_code} />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="street">
                  Calle <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => handleInputChange("street", e.target.value)}
                  onBlur={() => validateField("street", formData.street)}
                  disabled={isSubmitting}
                  placeholder="Nombre de la calle"
                  className={
                    validationErrors.street
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={200}
                />
                <ErrorMessage message={validationErrors.street} />
              </div>

              <div>
                <Label htmlFor="exterior_number">
                  Número Exterior <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="exterior_number"
                  value={formData.exterior_number}
                  onChange={(e) =>
                    handleInputChange("exterior_number", e.target.value)
                  }
                  onBlur={() =>
                    validateField("exterior_number", formData.exterior_number)
                  }
                  disabled={isSubmitting}
                  placeholder="123"
                  className={
                    validationErrors.exterior_number
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={10}
                />
                <ErrorMessage message={validationErrors.exterior_number} />
              </div>

              <div>
                <Label htmlFor="interior_number">Número Interior</Label>
                <Input
                  id="interior_number"
                  value={formData.interior_number}
                  onChange={(e) =>
                    handleInputChange("interior_number", e.target.value)
                  }
                  onBlur={() =>
                    validateField("interior_number", formData.interior_number)
                  }
                  disabled={isSubmitting}
                  placeholder="A, 101, etc. (opcional)"
                  className={
                    validationErrors.interior_number
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={10}
                />
                <ErrorMessage message={validationErrors.interior_number} />
              </div>

              <div>
                <Label htmlFor="neighborhood">
                  Colonia <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) =>
                    handleInputChange("neighborhood", e.target.value)
                  }
                  onBlur={() =>
                    validateField("neighborhood", formData.neighborhood)
                  }
                  disabled={isSubmitting}
                  placeholder="Nombre de la colonia"
                  className={
                    validationErrors.neighborhood
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={100}
                />
                <ErrorMessage message={validationErrors.neighborhood} />
              </div>

              <div>
                <Label htmlFor="city">
                  Ciudad <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  onBlur={() => validateField("city", formData.city)}
                  disabled={isSubmitting}
                  placeholder="Ciudad"
                  className={
                    validationErrors.city
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={100}
                />
                <ErrorMessage message={validationErrors.city} />
              </div>

              <div>
                <Label htmlFor="state">
                  Estado <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  onBlur={() => validateField("state", formData.state)}
                  disabled={isSubmitting}
                  placeholder="Estado"
                  className={
                    validationErrors.state
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={50}
                />
                <ErrorMessage message={validationErrors.state} />
              </div>

              <div>
                <Label htmlFor="zip_code">
                  Código Postal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => {
                    // Solo permitir números
                    const value = e.target.value.replace(/\D/g, "");
                    handleInputChange("zip_code", value);
                  }}
                  onBlur={() => validateField("zip_code", formData.zip_code)}
                  disabled={isSubmitting}
                  placeholder="12345"
                  className={
                    validationErrors.zip_code
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                  maxLength={5}
                />
                <ErrorMessage message={validationErrors.zip_code} />
              </div>
            </div>

            {/* Confirmación para actualizar dirección */}
            {hasChanges && formData.selectedBilling !== "new" && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <Label htmlFor="updateAddress" className="font-medium">
                    ¿Desea actualizar la dirección de facturación del cliente
                    con estos cambios?
                  </Label>
                </div>
                <div className="ml-7 mt-2">
                  <RadioGroup
                    value={formData.updateAddress.toString()}
                    onValueChange={(value) =>
                      handleInputChange("updateAddress", value === "true")
                    }
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="update-yes" />
                      <Label htmlFor="update-yes">
                        Sí, actualizar en el perfil del cliente
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="update-no" />
                      <Label htmlFor="update-no">
                        No, solo para esta cancelación
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validación final */}
        <Card
          className={`border-2 ${!hasChanges ? "border-red-200 bg-red-50" : Object.keys(validationErrors).length > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!hasChanges ? (
                  <>
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">
                        No se pueden realizar cambios
                      </p>
                      <p className="text-sm text-red-700">
                        Debe realizar cambios en los datos de facturación para
                        proceder con la cancelación.
                      </p>
                    </div>
                  </>
                ) : Object.keys(validationErrors).length > 0 ? (
                  <>
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">
                        Errores de validación
                      </p>
                      <p className="text-sm text-amber-700">
                        Corrija los errores en el formulario antes de continuar.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">
                        Listo para cancelar
                      </p>
                      <p className="text-sm text-green-700">
                        Se han detectado cambios en los datos de facturación.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancelar Proceso
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !hasChanges ||
                    Object.keys(validationErrors).length > 0
                  }
                  className={`${hasChanges && Object.keys(validationErrors).length === 0 ? "bg-red-600 hover:bg-red-700" : "bg-gray-400 cursor-not-allowed"}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : hasChanges ? (
                    "Confirmar Cancelación"
                  ) : (
                    "Realice cambios para continuar"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Modal de confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Cancelación de Factura
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <div>
                      <p className="font-medium text-amber-800 mb-1">
                        Esta acción no se puede deshacer
                      </p>
                      <p className="text-sm text-amber-700">
                        ¿Está seguro de realizar los cambios para cancelar la
                        factura vieja y emitir una nueva?
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Orden:</span>
                    <span className="font-medium">#{orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-medium">
                      {invoiceData.customerName}
                    </span>
                  </div>

                  {formData.rfc !== invoiceData.rfc && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 border border-green-200 rounded">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        Cambio en RFC detectado
                      </span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 mt-2">
                    <p className="text-xs text-gray-500">
                      Se cancelará la factura actual y se generará una nueva
                      factura con los datos actualizados.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Sí, cancelar y emitir nueva factura"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
