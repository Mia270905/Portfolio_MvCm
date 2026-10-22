"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveUserBillingInfo2,
  updateUserBillingInfo,
  getRegimenOptionsForRfc,
  getUsoCfdiOptionsForRegimen,
  getTipoPersona,
  type SaveBillingResult,
  type BillingFormData,
} from "@/lib/actions/billing.actions";
import { validateRfcFormat } from "@/lib/utils/cfdi-validations";
import { toast } from "sonner";

interface BillingFormProps {
  contactId: string;
  billing?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

// Funciones de sanitización
const onlyNumbers = (value: string) => value.replace(/\D/g, "");
const onlyLettersAndSpaces = (value: string) =>
  value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
const alphanumericUpper = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export function BillingForm({
  contactId,
  billing,
  onSuccess,
  onCancel,
}: BillingFormProps) {
  // Estado del formulario
  const [form, setForm] = useState<BillingFormData>({
    rfc: billing?.rfc || "",
    name: billing?.name || "",
    fiscal_regime: billing?.fiscal_regime || "",
    cfdi_use: billing?.cfdi_use || "",
    tax_zip_code: billing?.tax_zip_code || "",
    street: billing?.street || "",
    exterior_number: billing?.exterior_number || "",
    interior_number: billing?.interior_number || "",
    neighborhood: billing?.neighborhood || "",
    city: billing?.city || "",
    state: billing?.state || "",
    country: billing?.country || "México",
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);

  // Estados de validación
  const [regimenOptions, setRegimenOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [usoCfdiOptions, setUsoCfdiOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tipoPersona, setTipoPersona] = useState<string>("");

  // Cuando cambia el RFC, actualizar opciones de régimen
  useEffect(() => {
    async function updateRegimenOptions() {
      if (form.rfc.length >= 12) {
        const rfcValidation = validateRfcFormat(form.rfc);

        if (rfcValidation.isValid) {
          // Obtener tipo de persona
          const tipo = await getTipoPersona(form.rfc);
          setTipoPersona(tipo);

          // Obtener opciones de régimen
          const opciones = await getRegimenOptionsForRfc(form.rfc);
          setRegimenOptions(opciones);
          setFieldErrors((prev) => ({ ...prev, rfc: "" }));

          // Si el régimen actual no es válido, limpiarlo
          const regimenesValidos = opciones.map((o) => o.value);
          if (
            form.fiscal_regime &&
            !regimenesValidos.includes(form.fiscal_regime)
          ) {
            setForm((prev) => ({ ...prev, fiscal_regime: "", cfdi_use: "" }));
            setUsoCfdiOptions([]);
          }
        } else {
          setFieldErrors((prev) => ({
            ...prev,
            rfc: rfcValidation.error || "RFC inválido",
          }));
          setRegimenOptions([]);
          setUsoCfdiOptions([]);
          setTipoPersona("");
        }
      } else {
        setRegimenOptions([]);
        setUsoCfdiOptions([]);
        setTipoPersona("");

        if (form.rfc.length > 0 && form.rfc.length < 12) {
          setFieldErrors((prev) => ({
            ...prev,
            rfc: "El RFC debe tener 12 o 13 caracteres",
          }));
        } else {
          setFieldErrors((prev) => ({ ...prev, rfc: "" }));
        }
      }
    }
    updateRegimenOptions();
  }, [form.rfc]);

  // Cuando cambia el régimen, actualizar opciones de uso CFDI
  useEffect(() => {
    async function updateUsoCfdiOptions() {
      if (form.rfc.length >= 12 && form.fiscal_regime) {
        const opciones = await getUsoCfdiOptionsForRegimen(
          form.rfc,
          form.fiscal_regime,
        );
        setUsoCfdiOptions(opciones);

        // Si el uso actual no es válido, limpiarlo
        const usosValidos = opciones.map((o) => o.value);
        if (form.cfdi_use && !usosValidos.includes(form.cfdi_use)) {
          setForm((prev) => ({ ...prev, cfdi_use: "" }));
        }
      } else {
        setUsoCfdiOptions([]);
      }
    }
    updateUsoCfdiOptions();
  }, [form.rfc, form.fiscal_regime]);

  // Limpiar errores de campos
  const clearFieldErrors = () => {
    setFieldErrors({});
  };

  // Manejador de cambios en inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearFieldErrors();

    const { name, value } = e.target;
    let newValue = value;

    switch (name) {
      case "rfc":
        newValue = alphanumericUpper(value).slice(0, 13);
        break;
      case "tax_zip_code":
        newValue = onlyNumbers(value).slice(0, 5);
        break;
      case "exterior_number":
      case "interior_number":
        newValue = alphanumericUpper(value).slice(0, 10);
        break;
      case "city":
      case "state":
      case "neighborhood":
        newValue = onlyLettersAndSpaces(value);
        break;
    }

    setForm((prev) => ({ ...prev, [name]: newValue }));

    // Limpiar error del campo al editar
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearFieldErrors();
    setLoading(true);

    try {
      // Enviar al servidor (validación incluida)
      let result: SaveBillingResult;

      if (billing?.id) {
        result = await updateUserBillingInfo(billing.id, form);
      } else {
        result = await saveUserBillingInfo2(form, contactId);
      }

      if (!result.success) {
        // Errores de validación local
        if (result.errors.length > 0) {
          result.errors.forEach((error) => toast.error(error));
        }

        // Warnings
        if (result.warnings.length > 0) {
          result.warnings.forEach((warning) => toast.warning(warning));
        }

        // Errores de Facturama
        if (result.facturamaErrors && result.facturamaErrors.length > 0) {
          result.facturamaErrors.forEach((error) =>
            toast.error(`Facturama: ${error}`),
          );
        }

        return;
      }

      // Éxito - mostrar warnings si los hay
      if (result.warnings.length > 0) {
        result.warnings.forEach((w) => toast.warning(w));
      }

      toast.success(
        billing
          ? "Datos actualizados correctamente"
          : "Datos guardados correctamente",
      );
      onSuccess();
    } catch (error) {
      console.error("Error en submit:", error);
      toast.error("Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 sm:p-6 border-2 bg-[#0A0F17]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="font-semibold text-base sm:text-lg">
          {billing
            ? "Editar Datos de Facturación"
            : "Agregar Datos de Facturación"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* RFC */}
          <div className="space-y-1">
            <Label htmlFor="rfc" className="text-sm">RFC</Label>
            <Input
              id="rfc"
              name="rfc"
              value={form.rfc}
              onChange={handleChange}
              required
              maxLength={13}
              placeholder="XAXX010101000"
              className={`text-sm ${fieldErrors.rfc ? "border-red-500" : ""}`}
            />
            {fieldErrors.rfc && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.rfc}
              </p>
            )}
          </div>

          {/* Razón Social */}
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm">Razón Social</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Nombre o razón social"
              className="text-sm"
            />
          </div>

          {/* Régimen Fiscal */}
          <div className="space-y-1">
            <Label className="text-sm">Régimen Fiscal</Label>
            <Select
              value={form.fiscal_regime}
              onValueChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  fiscal_regime: value,
                  cfdi_use: "",
                }));
              }}
              disabled={regimenOptions.length === 0}
            >
              <SelectTrigger
                className={`text-sm ${
                  !form.fiscal_regime && form.rfc.length >= 12
                    ? "border-yellow-500"
                    : ""
                }`}
              >
                <SelectValue
                  placeholder={
                    form.rfc.length < 12
                      ? "Primero ingresa el RFC"
                      : "Selecciona régimen fiscal"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {regimenOptions.map((regime) => (
                  <SelectItem key={regime.value} value={regime.value} className="text-sm">
                    {regime.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Uso CFDI */}
          <div className="space-y-1">
            <Label className="text-sm">Uso CFDI</Label>
            <Select
              value={form.cfdi_use}
              onValueChange={(value) => {
                setForm((prev) => ({ ...prev, cfdi_use: value }));
              }}
              disabled={usoCfdiOptions.length === 0}
            >
              <SelectTrigger
                className={`text-sm ${
                  !form.cfdi_use && form.fiscal_regime
                    ? "border-yellow-500"
                    : ""
                }`}
              >
                <SelectValue
                  placeholder={
                    !form.fiscal_regime
                      ? "Primero selecciona régimen"
                      : "Selecciona uso CFDI"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {usoCfdiOptions.map((use) => (
                  <SelectItem key={use.value} value={use.value} className="text-sm">
                    {use.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Código Postal Fiscal */}
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="tax_zip_code" className="text-sm block">Código Postal Fiscal</Label>
            <Input
              id="tax_zip_code"
              name="tax_zip_code"
              value={form.tax_zip_code}
              onChange={handleChange}
              required
              maxLength={5}
              inputMode="numeric"
              placeholder="00000"
              className={`text-sm max-w-xs ${fieldErrors.tax_zip_code ? "border-red-500" : ""}`}
            />
            {fieldErrors.tax_zip_code && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.tax_zip_code}
              </p>
            )}
          </div>
        </div>

        <hr className="my-3 sm:my-4" />

        {/* Título de dirección */}
        <div>
          <Label className="text-base font-medium">Domicilio de facturación</Label>
          <p className="text-xs text-gray-500 mt-1">
            Ingresa la dirección fiscal completa
          </p>
        </div>

        {/* Campos de dirección */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="street" className="text-sm">Calle</Label>
            <Input
              id="street"
              name="street"
              value={form.street}
              onChange={handleChange}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="exterior_number" className="text-sm">Número Exterior</Label>
            <Input
              id="exterior_number"
              name="exterior_number"
              value={form.exterior_number}
              onChange={handleChange}
              required
              maxLength={10}
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="interior_number" className="text-sm">Número Interior (opcional)</Label>
            <Input
              id="interior_number"
              name="interior_number"
              value={form.interior_number}
              onChange={handleChange}
              maxLength={10}
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="neighborhood" className="text-sm">Colonia</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              value={form.neighborhood}
              onChange={handleChange}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="city" className="text-sm">Ciudad / Municipio</Label>
            <Input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="state" className="text-sm">Estado</Label>
            <Input
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              required
              className="text-sm"
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || regimenOptions.length === 0}
            className="w-full sm:w-auto bg-[#1447E6] hover:bg-[#1447E6]/90"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}