"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  User,
  MapPin,
  CreditCard,
  PlusCircle,
  CheckCircle2,
  Loader2,
  Building,
  Mail,
  AlertTriangle,
  Users,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import {
  getUserBillingInfo2,
  createUserBillingInfo,
  createBillingInfoFromUserBilling,
  getExpeditionZipCode,
  getRegimenOptionsForRfc,
  getUsoCfdiOptionsForRegimen,
  parseFacturamaErrors,
  getBillingInfoById,
} from "@/lib/actions/billing.actions";
import {
  validateBillingData,
  validateRfcFormat,
  getTipoPersonaByRfc,
  type ValidationResult,
} from "@/lib/utils/cfdi-validations";
import {
  getInvoicePDF,
  getInvoiceXML,
  createInvoiceFromBillingInfo,
} from "@/lib/actions/invoices.actions";
import { downloadInvoicePDF } from "@/lib/utils/download-pdf";
import { downloadInvoiceXML } from "@/lib/utils/download-xml";

interface InvoiceOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    order_number: string;
    user_id?: string | null;
    contact_id?: string | null;
    user_name?: string;
    user_email?: string;
    id_billing_info?: string | null;
  };
  onSuccess: () => void;
}

interface UserBillingData {
  id: string;
  rfc: string;
  name: string;
  cfdi_use: string;
  fiscal_regime: string;
  tax_zip_code: string;
  email?: string;
  street?: string;
  exterior_number?: string;
  interior_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  zip_code?: string;
  user_id?: string | null;
  contact_id?: string | null;
}

export function InvoiceOrderModal({
  open,
  onOpenChange,
  order,
  onSuccess,
}: InvoiceOrderModalProps) {
  
  const [userBillingData, setUserBillingData] = useState<UserBillingData[]>([]);
  const [selectedBilling, setSelectedBilling] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expeditionZipCode, setExpeditionZipCode] = useState<string>("42501");
  const [ownerType, setOwnerType] = useState<'user' | 'contact'>(
    order.user_id ? 'user' : 'contact'
  );

  const [usingPreSelectedBilling, setUsingPreSelectedBilling] = useState(false);

  // Estados para validación
  const [formIsValid, setFormIsValid] = useState(false);
  const [selectedBillingIsValid, setSelectedBillingIsValid] = useState(true);

  // Estados para opciones dinámicas
  const [regimenOptions, setRegimenOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [usoCfdiOptions, setUsoCfdiOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [tipoPersona, setTipoPersona] = useState<string>("");

  // Form state para nuevos datos
  const [newBillingData, setNewBillingData] = useState({
    rfc: "",
    name: "",
    cfdi_use: "",
    fiscal_regime: "",
    tax_zip_code: "",
    email: order.user_email || "",
    street: "",
    exterior_number: "",
    interior_number: "",
    neighborhood: "",
    city: "",
    state: "",
    country: "México",
    zip_code: "",
  });

  // Determinar el ID del propietario (user_id o contact_id)
  const ownerId = order.user_id || order.contact_id;

  // Cargar código postal de expedición al montar
  useEffect(() => {
    const loadExpeditionZip = async () => {
      const zip = await getExpeditionZipCode();
      setExpeditionZipCode(zip);
    };
    loadExpeditionZip();
  }, []);

  // SOLO UN EFECTO para cargar datos cuando se abre el modal
  useEffect(() => {
    if (open) {
      loadBillingData();
    } else {
      // Resetear estados al cerrar
      setUsingPreSelectedBilling(false);
      setSelectedBilling(null);
      setShowNewForm(false);
      resetForm();
    }
  }, [open, order.id, order.id_billing_info, ownerId]); // Incluir ownerId en dependencias

  // ELIMINADO: useEffect que llamaba a loadOwnerBillingData

  // Efecto para actualizar opciones de régimen cuando cambia el RFC
  useEffect(() => {
    const updateRegimenOptions = async () => {
      if (newBillingData.rfc.length >= 12) {
        const rfcValidation = validateRfcFormat(newBillingData.rfc);
        if (rfcValidation.isValid) {
          const options = await getRegimenOptionsForRfc(newBillingData.rfc);
          setRegimenOptions(options);

          const tipo = getTipoPersonaByRfc(newBillingData.rfc);
          setTipoPersona(tipo);

          // Si el régimen actual no es válido para este RFC, limpiarlo
          if (
            newBillingData.fiscal_regime &&
            !options.some((o) => o.value === newBillingData.fiscal_regime)
          ) {
            setNewBillingData((prev) => ({
              ...prev,
              fiscal_regime: "",
              cfdi_use: "",
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
  }, [newBillingData.rfc]);

  // Efecto para actualizar opciones de uso CFDI cuando cambia el régimen
  useEffect(() => {
    const updateUsoCfdiOptions = async () => {
      if (newBillingData.rfc.length >= 12 && newBillingData.fiscal_regime) {
        const options = await getUsoCfdiOptionsForRegimen(
          newBillingData.rfc,
          newBillingData.fiscal_regime,
        );
        setUsoCfdiOptions(options);

        // Si el uso actual no es válido para este régimen, limpiarlo
        if (
          newBillingData.cfdi_use &&
          !options.some((o) => o.value === newBillingData.cfdi_use)
        ) {
          setNewBillingData((prev) => ({ ...prev, cfdi_use: "" }));
        }
      } else {
        setUsoCfdiOptions([]);
      }
    };
    updateUsoCfdiOptions();
  }, [newBillingData.rfc, newBillingData.fiscal_regime]);

  // Validar datos del formulario
  useEffect(() => {
    if (
      newBillingData.rfc &&
      newBillingData.fiscal_regime &&
      newBillingData.cfdi_use &&
      newBillingData.tax_zip_code &&
      newBillingData.name
    ) {
      const result = validateBillingData(
        {
          rfc: newBillingData.rfc,
          fiscal_regime: newBillingData.fiscal_regime,
          cfdi_use: newBillingData.cfdi_use,
          tax_zip_code: newBillingData.tax_zip_code,
          name: newBillingData.name,
        },
        expeditionZipCode,
      );
      setFormIsValid(result.isValid);
    } else {
      setFormIsValid(false);
    }
  }, [newBillingData, expeditionZipCode]);

  // Validar datos seleccionados
  useEffect(() => {
    if (selectedBilling) {
      const billing = userBillingData.find((b) => b.id === selectedBilling);
      if (billing) {
        const result = validateBillingData(
          {
            rfc: billing.rfc,
            fiscal_regime: billing.fiscal_regime,
            cfdi_use: billing.cfdi_use,
            tax_zip_code: billing.tax_zip_code,
            name: billing.name,
          },
          expeditionZipCode,
        );
        setSelectedBillingIsValid(result.isValid);
      }
    } else {
      setSelectedBillingIsValid(true);
    }
  }, [selectedBilling, userBillingData, expeditionZipCode]);

  // NUEVA FUNCIÓN: Cargar datos del propietario (separada)
  const loadOwnerBillingData = async () => {
    if (!ownerId) return;
    
    try {
      const data = await getUserBillingInfo2(ownerId, ownerType);
      setUserBillingData(data);

      if (data.length > 0) {
        setSelectedBilling(data[0].id);
        setShowNewForm(false);
      } else {
        setShowNewForm(true);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
      toast.error("No se pudieron cargar los datos fiscales");
    }
  };

  // MODIFICADA: Ahora maneja correctamente los dos casos
  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      // CASO 1: La orden ya tiene id_billing_info
      if (order.id_billing_info) {
        console.log("Orden tiene id_billing_info:", order.id_billing_info);
        
        // Obtener los datos de billing_info por ID
        const billingInfo = await getBillingInfoById(order.id_billing_info);
        
        if (billingInfo) {
          console.log("Datos de facturación encontrados:", billingInfo);
          
          // Convertir a formato UserBillingData para mostrarlo
          const billingData: UserBillingData = {
            id: billingInfo.id,
            rfc: billingInfo.rfc,
            name: billingInfo.name,
            cfdi_use: billingInfo.cfdi_use,
            fiscal_regime: billingInfo.fiscal_regime,
            tax_zip_code: billingInfo.tax_zip_code,
            email: billingInfo.email,
            street: billingInfo.street,
            exterior_number: billingInfo.exterior_number,
            interior_number: billingInfo.interior_number,
            neighborhood: billingInfo.neighborhood,
            city: billingInfo.city,
            state: billingInfo.state,
            country: billingInfo.country,
            zip_code: billingInfo.zip_code,
            user_id: billingInfo.user_id,
            contact_id: billingInfo.contact_id,
          };
          
          // Establecer SOLO este dato, no todos los del usuario
          setUserBillingData([billingData]);
          setSelectedBilling(billingInfo.id);
          setUsingPreSelectedBilling(true);
          setShowNewForm(false);
          
          // Validar los datos
          const validation = validateBillingItem(billingData);
          if (!validation.isValid) {
            showErrorToast(
              validation.errors,
              "Los datos de facturación tienen errores:"
            );
          }
          if (validation.warnings.length > 0) {
            showWarningToasts(validation.warnings);
          }
          
          setIsLoading(false);
          return;
        }
      }

      // CASO 2: No hay id_billing_info, cargar TODOS los datos del propietario
      if (ownerId) {
        await loadOwnerBillingData();
      } else {
        // No hay propietario, mostrar formulario vacío
        setUserBillingData([]);
        setShowNewForm(true);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
      toast.error("No se pudieron cargar los datos fiscales");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRfcChange = (value: string) => {
    const rfcUpper = value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, "");
    setNewBillingData((prev) => ({
      ...prev,
      rfc: rfcUpper,
      fiscal_regime: "",
      cfdi_use: "",
    }));
  };

  /**
   * Muestra errores en toast con formato legible
   */
  const showErrorToast = (errors: string[], title?: string) => {
    if (errors.length === 0) return;

    if (errors.length === 1) {
      toast.error(errors[0], { duration: 8000 });
    } else {
      toast.error(
        <div>
          <p className="font-medium mb-2">
            {title || "Errores de validación:"}
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>,
        { duration: 10000 },
      );
    }
  };

  /**
   * Muestra warnings en toast
   */
  const showWarningToasts = (warnings: string[]) => {
    warnings.forEach((warning) => toast.warning(warning, { duration: 5000 }));
  };

  /**
   * Valida y retorna el resultado de validación
   */
  const validateBillingItem = (billing: UserBillingData): ValidationResult => {
    return validateBillingData(
      {
        rfc: billing.rfc,
        fiscal_regime: billing.fiscal_regime,
        cfdi_use: billing.cfdi_use,
        tax_zip_code: billing.tax_zip_code,
        name: billing.name,
      },
      expeditionZipCode,
    );
  };

  const handleCreateNewBilling = async () => {
    if (!ownerId) {
      toast.error("No se encontró el propietario de la orden");
      return;
    }

    // Validación completa antes de guardar
    const fullValidation = validateBillingData(
      {
        rfc: newBillingData.rfc,
        fiscal_regime: newBillingData.fiscal_regime,
        cfdi_use: newBillingData.cfdi_use,
        tax_zip_code: newBillingData.tax_zip_code,
        name: newBillingData.name,
      },
      expeditionZipCode,
    );

    if (!fullValidation.isValid) {
      showErrorToast(fullValidation.errors, "Datos de facturación inválidos:");
      return;
    }

    // Mostrar warnings
    if (fullValidation.warnings.length > 0) {
      showWarningToasts(fullValidation.warnings);
    }

    setIsCreating(true);
    try {
      const result = await createUserBillingInfo(
        ownerId, 
        ownerType, 
        newBillingData
      );

      if (result.success && result.id) {
        toast.success("Datos fiscales guardados");
        await loadOwnerBillingData();
        setSelectedBilling(result.id);
        setShowNewForm(false);
        resetForm();
      } else {
        toast.error(result.error || "Error al guardar datos fiscales");
      }
    } catch (error) {
      console.error("Error creating billing:", error);
      toast.error("Error al guardar datos fiscales");
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewBillingData({
      rfc: "",
      name: "",
      cfdi_use: "",
      fiscal_regime: "",
      tax_zip_code: "",
      email: order.user_email || "",
      street: "",
      exterior_number: "",
      interior_number: "",
      neighborhood: "",
      city: "",
      state: "",
      country: "México",
      zip_code: "",
    });
    setRegimenOptions([]);
    setUsoCfdiOptions([]);
    setTipoPersona("");
    setFormIsValid(false);
  };

  const handleSelectBilling = (billingId: string) => {
    const billing = userBillingData.find((b) => b.id === billingId);
    if (billing) {
      const validation = validateBillingItem(billing);
      if (!validation.isValid) {
        showErrorToast(
          validation.errors,
          `Datos inválidos para ${billing.name}:`,
        );
      }
      if (validation.warnings.length > 0) {
        showWarningToasts(validation.warnings);
      }
    }
    setSelectedBilling(billingId);
    // Si el usuario selecciona manualmente, ya no estamos usando el pre-seleccionado
    setUsingPreSelectedBilling(false);
  };

  const handleGenerateInvoice = async () => {
    if (!selectedBilling) {
      toast.error("Selecciona o crea datos fiscales primero");
      return;
    }

    if (!ownerId && !usingPreSelectedBilling) {
      toast.error("No se encontró el propietario de la orden");
      return;
    }

    const billing = userBillingData.find((b) => b.id === selectedBilling);
    if (!billing) {
      toast.error("No se encontraron los datos fiscales seleccionados");
      return;
    }

    // Validar datos seleccionados antes de generar
    const validation = validateBillingItem(billing);
    if (!validation.isValid) {
      showErrorToast(validation.errors, "No se puede generar la factura:");
      return;
    }

    // Mostrar warnings
    if (validation.warnings.length > 0) {
      showWarningToasts(validation.warnings);
    }

    setIsProcessing(true);
    try {
      // 1. Crear billing_info desde user_billing_info
      const billingResult = await createBillingInfoFromUserBilling(
        order.order_number,
        selectedBilling,
        {
          user_id: order.user_id,
          contact_id: order.contact_id,
        }
      );

      if (!billingResult.success || !billingResult.id) {
        toast.error(
          billingResult.error || "Error al preparar datos de facturación",
        );
        return;
      }

      // 2. Generar factura en Facturama
      const invoiceResult = await createInvoiceFromBillingInfo(
        order.id,
        billingResult.id,
      );

      if (!invoiceResult.ok || !invoiceResult.cfdiId) {
        // Parsear errores de Facturama
        let errorsToShow: string[] = [];

        if (invoiceResult.error) {
          if (typeof invoiceResult.error === "object") {
            errorsToShow = await parseFacturamaErrors(invoiceResult.error);
          } else if (typeof invoiceResult.error === "string") {
            try {
              const parsed = JSON.parse(invoiceResult.error);
              errorsToShow = await parseFacturamaErrors(parsed);
            } catch {
              errorsToShow = [invoiceResult.error];
            }
          }
        }

        if (errorsToShow.length === 0) {
          errorsToShow = ["Error desconocido al crear la factura"];
        }

        showErrorToast(errorsToShow, "Error al generar factura:");
        return;
      }

      // 3. Descargar PDF y XML
      try {
        const pdf = await getInvoicePDF(invoiceResult.cfdiId);
        const xml = await getInvoiceXML(invoiceResult.cfdiId);

        if (pdf.ok && pdf.pdfBase64) {
          await downloadInvoicePDF(
            pdf.pdfBase64,
            `factura-${order.order_number}`,
          );
        }

        if (xml.ok && xml.xmlBase64) {
          await downloadInvoiceXML(
            xml.xmlBase64,
            `factura-${order.order_number}`,
          );
        }
      } catch (downloadError) {
        console.error("Error al descargar archivos:", downloadError);
        toast.warning(
          "Factura creada pero hubo un error al descargar. Intenta descargarla nuevamente.",
        );
      }

      toast.success("Factura generada y descargada correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error generating invoice:", error);

      // Intentar parsear el error si viene de Facturama
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
        errorsToShow = ["Error inesperado al generar la factura"];
      }

      showErrorToast(errorsToShow, "Error al generar factura:");
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedBillingItem = userBillingData.find(
    (item) => item.id === selectedBilling,
  );

  // Helper para mostrar el tipo de persona
  const getTipoPersonaLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      moral: "Persona Moral",
      fisica: "Persona Física",
      generico: "Público en General",
      extranjero: "Extranjero",
    };
    return labels[tipo] || tipo;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Facturar Orden #{order.order_number}
          </DialogTitle>
          <DialogDescription>
            {usingPreSelectedBilling 
              ? "Esta orden ya tiene datos de facturación asociados" 
              : "Selecciona o crea datos fiscales para generar la factura"}
          </DialogDescription>
        </DialogHeader>

        {/* Información del cliente */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {order.user_id ? (
                <User className="w-4 h-4" />
              ) : (
                <Users className="w-4 h-4" />
              )}
              {order.user_id ? "Cliente (Usuario)" : "Cliente (Contacto)"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Nombre:</span>
                <p className="font-medium">
                  {order.user_name || "No especificado"}
                </p>
              </div>
              {order.user_email && (
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <p className="font-medium">{order.user_email}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Orden:</span>
                <Badge variant="outline" className="ml-2">
                  #{order.order_number}
                </Badge>
              </div>
              
              {/* Indicador de datos pre-seleccionados */}
              {usingPreSelectedBilling && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium">Datos de facturación pre-seleccionados</p>
                    <p className="text-xs">Esta orden ya tenía datos fiscales asociados al momento de la creación.</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Selector de datos fiscales existentes */}
            {!showNewForm && userBillingData.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {usingPreSelectedBilling 
                      ? "Datos Fiscales de la Orden" 
                      : "Datos Fiscales Guardados"}
                  </h3>
                  {/* Solo mostrar botón "Nuevos Datos" si NO estamos en modo pre-seleccionado */}
                  {!usingPreSelectedBilling && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNewForm(true)}
                      className="flex items-center gap-2"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Nuevos Datos
                    </Button>
                  )}
                </div>

                <div className="space-y-3">
                  {userBillingData.map((billing) => {
                    const itemValidation = validateBillingItem(billing);
                    const hasErrors = !itemValidation.isValid;
                    const hasWarnings = itemValidation.warnings.length > 0;

                    return (
                      <Card
                        key={billing.id}
                        className={`cursor-pointer transition-all ${
                          selectedBilling === billing.id
                            ? usingPreSelectedBilling
                              ? "border-green-500 bg-green-50"
                              : "border-blue-500 bg-blue-50"
                            : "hover:border-gray-300"
                        } ${hasErrors ? "border-red-300 bg-red-50/50" : ""}`}
                        onClick={() => handleSelectBilling(billing.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Building className="w-4 h-4 text-gray-500" />
                                <h4 className="font-medium">{billing.name}</h4>
                                {selectedBilling === billing.id && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Seleccionado
                                  </Badge>
                                )}
                                {usingPreSelectedBilling && selectedBilling === billing.id && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-100 text-green-700 border-green-300"
                                  >
                                    Datos de la orden
                                  </Badge>
                                )}
                                {hasErrors && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Datos inválidos
                                  </Badge>
                                )}
                                {!hasErrors && hasWarnings && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-amber-600 border-amber-300"
                                  >
                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                    Advertencia
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="text-gray-500">RFC:</span>
                                  <p className="font-mono">{billing.rfc}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Régimen:
                                  </span>
                                  <p>{billing.fiscal_regime}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    Uso CFDI:
                                  </span>
                                  <p>{billing.cfdi_use}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">
                                    CP Fiscal:
                                  </span>
                                  <p>{billing.tax_zip_code}</p>
                                </div>
                              </div>
                              {billing.email && (
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    {billing.email}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              {selectedBilling === billing.id && !hasErrors && (
                                <CheckCircle2 className={`w-5 h-5 ${usingPreSelectedBilling ? 'text-green-500' : 'text-blue-500'}`} />
                              )}
                              {hasErrors && (
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Formulario para nuevos datos */}
            {showNewForm && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Nuevos Datos Fiscales</h3>
                  {userBillingData.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewForm(false);
                        resetForm();
                      }}
                    >
                      Ver existentes
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* RFC con indicador de tipo de persona */}
                  <div className="space-y-2">
                    <Label htmlFor="rfc">RFC *</Label>
                    <Input
                      id="rfc"
                      value={newBillingData.rfc}
                      onChange={(e) => handleRfcChange(e.target.value)}
                      placeholder="ABCD123456XYZ"
                      maxLength={13}
                      className={
                        newBillingData.rfc &&
                        !validateRfcFormat(newBillingData.rfc).isValid
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {newBillingData.rfc &&
                      !validateRfcFormat(newBillingData.rfc).isValid && (
                        <p className="text-xs text-red-500">
                          {validateRfcFormat(newBillingData.rfc).error}
                        </p>
                      )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Razón Social *</Label>
                    <Input
                      id="name"
                      value={newBillingData.name}
                      onChange={(e) =>
                        setNewBillingData({
                          ...newBillingData,
                          name: e.target.value,
                        })
                      }
                      placeholder="Nombre o razón social"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tax_zip_code">Código Postal Fiscal *</Label>
                    <Input
                      id="tax_zip_code"
                      value={newBillingData.tax_zip_code}
                      onChange={(e) =>
                        setNewBillingData({
                          ...newBillingData,
                          tax_zip_code: e.target.value.replace(/\D/g, ""),
                        })
                      }
                      placeholder="00000"
                      maxLength={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newBillingData.email}
                      onChange={(e) =>
                        setNewBillingData({
                          ...newBillingData,
                          email: e.target.value,
                        })
                      }
                      placeholder="correo@ejemplo.com"
                    />
                  </div>

                  {/* Régimen Fiscal - Opciones filtradas por tipo de persona */}
                  <div className="space-y-2">
                    <Label htmlFor="fiscal_regime">Régimen Fiscal *</Label>
                    <Select
                      value={newBillingData.fiscal_regime}
                      onValueChange={(value) =>
                        setNewBillingData({
                          ...newBillingData,
                          fiscal_regime: value,
                          cfdi_use: "",
                        })
                      }
                      disabled={regimenOptions.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            regimenOptions.length === 0
                              ? "Ingresa un RFC válido primero"
                              : "Selecciona un régimen fiscal"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {regimenOptions.map((regime) => (
                          <SelectItem key={regime.value} value={regime.value}>
                            {regime.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Uso CFDI - Opciones filtradas por régimen */}
                  <div className="space-y-2">
                    <Label htmlFor="cfdi_use">Uso CFDI *</Label>
                    <Select
                      value={newBillingData.cfdi_use}
                      onValueChange={(value) =>
                        setNewBillingData({
                          ...newBillingData,
                          cfdi_use: value,
                        })
                      }
                      disabled={usoCfdiOptions.length === 0}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            usoCfdiOptions.length === 0
                              ? "Selecciona un régimen primero"
                              : "Selecciona el uso CFDI"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {usoCfdiOptions.map((use) => (
                          <SelectItem key={use.value} value={use.value}>
                            {use.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Dirección Fiscal */}
                <div className="pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Dirección Fiscal (Opcional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Calle</Label>
                      <Input
                        id="street"
                        value={newBillingData.street}
                        onChange={(e) =>
                          setNewBillingData({
                            ...newBillingData,
                            street: e.target.value,
                          })
                        }
                        placeholder="Calle"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="exterior_number">Número Ext.</Label>
                        <Input
                          id="exterior_number"
                          value={newBillingData.exterior_number}
                          onChange={(e) =>
                            setNewBillingData({
                              ...newBillingData,
                              exterior_number: e.target.value,
                            })
                          }
                          placeholder="123"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interior_number">Número Int.</Label>
                        <Input
                          id="interior_number"
                          value={newBillingData.interior_number}
                          onChange={(e) =>
                            setNewBillingData({
                              ...newBillingData,
                              interior_number: e.target.value,
                            })
                          }
                          placeholder="A"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="neighborhood">Colonia</Label>
                      <Input
                        id="neighborhood"
                        value={newBillingData.neighborhood}
                        onChange={(e) =>
                          setNewBillingData({
                            ...newBillingData,
                            neighborhood: e.target.value,
                          })
                        }
                        placeholder="Colonia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={newBillingData.city}
                        onChange={(e) =>
                          setNewBillingData({
                            ...newBillingData,
                            city: e.target.value,
                          })
                        }
                        placeholder="Ciudad"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={newBillingData.state}
                        onChange={(e) =>
                          setNewBillingData({
                            ...newBillingData,
                            state: e.target.value,
                          })
                        }
                        placeholder="Estado"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code">Código Postal</Label>
                      <Input
                        id="zip_code"
                        value={newBillingData.zip_code}
                        onChange={(e) =>
                          setNewBillingData({
                            ...newBillingData,
                            zip_code: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="00000"
                        maxLength={5}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreateNewBilling}
                  disabled={isCreating || !formIsValid}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Guardar Datos Fiscales
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Resumen seleccionado */}
            {selectedBillingItem && !showNewForm && selectedBillingIsValid && (
              <Card className={`${usingPreSelectedBilling ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {usingPreSelectedBilling 
                      ? "Datos de Facturación de la Orden" 
                      : "Datos Seleccionados para Facturar"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className={`text-sm ${usingPreSelectedBilling ? 'text-green-700' : 'text-blue-700'}`}>RFC:</span>
                        <p className="font-mono font-medium">
                          {selectedBillingItem.rfc}
                        </p>
                      </div>
                      <div>
                        <span className={`text-sm ${usingPreSelectedBilling ? 'text-green-700' : 'text-blue-700'}`}>
                          Razón Social:
                        </span>
                        <p className="font-medium">
                          {selectedBillingItem.name}
                        </p>
                      </div>
                      <div>
                        <span className={`text-sm ${usingPreSelectedBilling ? 'text-green-700' : 'text-blue-700'}`}>Régimen:</span>
                        <p>{selectedBillingItem.fiscal_regime}</p>
                      </div>
                      <div>
                        <span className={`text-sm ${usingPreSelectedBilling ? 'text-green-700' : 'text-blue-700'}`}>Uso CFDI:</span>
                        <p>{selectedBillingItem.cfdi_use}</p>
                      </div>
                    </div>
                    {selectedBillingItem.email && (
                      <div>
                        <span className={`text-sm ${usingPreSelectedBilling ? 'text-green-700' : 'text-blue-700'}`}>Email:</span>
                        <p>{selectedBillingItem.email}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Separator />

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerateInvoice}
            disabled={
              isProcessing ||
              !selectedBilling ||
              isLoading ||
              !selectedBillingIsValid
            }
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generando Factura...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generar y Descargar Factura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}