"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUserAddresses } from "@/lib/actions/address.actions";
import {
  saveUserBillingInfo,
  updateUserBillingInfo,
  getRegimenOptionsForRfc,
  getUsoCfdiOptionsForRegimen,
  validateBillingLocally,
  getTipoPersona,
  type SaveBillingResult,
  type BillingFormData,
} from "@/lib/actions/billing.actions";
import { validateRfcFormat } from "@/lib/utils/cfdi-validations";
import { toast } from "sonner";

interface BillingFormProps {
  billing?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

type AddressMode = "existing" | "custom";

// Funciones de sanitización
const onlyNumbers = (value: string) => value.replace(/\D/g, "");
const onlyLettersAndSpaces = (value: string) =>
  value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
const alphanumericUpper = (value: string) =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

export function BillingForm({
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
  const [addressMode, setAddressMode] = useState<AddressMode>("existing");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [addressCopied, setAddressCopied] = useState(false);

  // Estados de validación
  const [regimenOptions, setRegimenOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [usoCfdiOptions, setUsoCfdiOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [tipoPersona, setTipoPersona] = useState<string>("");

  // Cargar direcciones al montar
  useEffect(() => {
    async function loadAddresses() {
      const { addresses } = await getUserAddresses();
      setAddresses(addresses);

      if (!billing && addresses.length > 0) {
        setSelectedAddressId(addresses[0].id);
      } else {
        setAddressMode("custom");
      }
    }
    loadAddresses();
  }, [billing]);

  // Si es edición, usar modo personalizado
  useEffect(() => {
    if (!billing) return;
    setAddressMode("custom");
    setSelectedAddressId(null);
  }, [billing]);

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

  // Copiar dirección seleccionada
  useEffect(() => {
    if (!selectedAddressId || addressMode !== "existing" || addressCopied)
      return;

    const address = addresses.find((a) => a.id === selectedAddressId);
    if (!address) return;

    setForm((prev) => ({
      ...prev,
      street: address.street,
      exterior_number: address.exterior_number,
      interior_number: address.interior_number ?? "",
      neighborhood: address.neighborhood,
      city: address.city ?? "",
      state: address.state ?? "",
      tax_zip_code: address.postal_code,
    }));

    setAddressCopied(true);
  }, [selectedAddressId, addressMode, addresses, addressCopied]);

  // Limpiar campos de dirección
  const clearAddressFields = () => {
    setForm((prev) => ({
      ...prev,
      street: "",
      exterior_number: "",
      interior_number: "",
      neighborhood: "",
      city: "",
      state: "",
      tax_zip_code: "",
    }));
  };

  // Limpiar errores de campos
  const clearFieldErrors = () => {
    setFieldErrors({});
  };

  // Manejador de cambios en inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressCopied(true);
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
        result = await saveUserBillingInfo(form);
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
    <Card className="p-6 border-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="font-semibold text-lg">
          {billing
            ? "Editar Datos de Facturación"
            : "Agregar Datos de Facturación"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RFC */}
          <div className="space-y-1">
            <Label htmlFor="rfc">RFC</Label>
            <Input
              id="rfc"
              name="rfc"
              value={form.rfc}
              onChange={handleChange}
              required
              maxLength={13}
              placeholder="XAXX010101000"
              className={fieldErrors.rfc ? "border-red-500" : ""}
            />
            {fieldErrors.rfc && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.rfc}
              </p>
            )}
          </div>

          {/* Razón Social */}
          <div className="space-y-1">
            <Label htmlFor="name">Razón Social</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="Nombre o razón social"
            />
          </div>

          {/* Régimen Fiscal */}
          <div className="space-y-1">
            <Label>Régimen Fiscal</Label>
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
                className={
                  !form.fiscal_regime && form.rfc.length >= 12
                    ? "border-yellow-500"
                    : ""
                }
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
                  <SelectItem key={regime.value} value={regime.value}>
                    {regime.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Uso CFDI */}
          <div className="space-y-1">
            <Label>Uso CFDI</Label>
            <Select
              value={form.cfdi_use}
              onValueChange={(value) => {
                setForm((prev) => ({ ...prev, cfdi_use: value }));
              }}
              disabled={usoCfdiOptions.length === 0}
            >
              <SelectTrigger
                className={
                  !form.cfdi_use && form.fiscal_regime
                    ? "border-yellow-500"
                    : ""
                }
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
                  <SelectItem key={use.value} value={use.value}>
                    {use.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Código Postal Fiscal */}
          <div className="space-y-1">
            <Label htmlFor="tax_zip_code">Código Postal Fiscal</Label>
            <Input
              id="tax_zip_code"
              name="tax_zip_code"
              value={form.tax_zip_code}
              onChange={handleChange}
              required
              maxLength={5}
              inputMode="numeric"
              placeholder="00000"
              className={fieldErrors.tax_zip_code ? "border-red-500" : ""}
            />
            {fieldErrors.tax_zip_code && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {fieldErrors.tax_zip_code}
              </p>
            )}
          </div>
        </div>

        <hr className="my-4" />

        {/* Selector de modo de dirección */}
        <div className="space-y-2">
          <Label>Domicilio de facturación</Label>
          <div className="flex flex-col gap-2 md:flex-row">
            <Button
              type="button"
              variant={addressMode === "existing" ? "default" : "outline"}
              onClick={() => {
                setAddressMode("existing");
                setAddressCopied(false);
                if (addresses.length > 0) {
                  setSelectedAddressId(addresses[0].id);
                }
              }}
              disabled={addresses.length === 0}
            >
              Usar domicilio existente
            </Button>
            <Button
              type="button"
              variant={addressMode === "custom" ? "default" : "outline"}
              onClick={() => {
                setAddressMode("custom");
                setSelectedAddressId(null);
                setAddressCopied(false);
                clearAddressFields();
              }}
            >
              Usar domicilio diferente
            </Button>
          </div>
          {addresses.length === 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              No tienes domicilios guardados
            </p>
          )}
        </div>

        {/* Selector de dirección existente */}
        {addressMode === "existing" && addresses.length > 0 && (
          <div className="space-y-1">
            <Label>Selecciona un domicilio</Label>
            <Select
              value={selectedAddressId ?? ""}
              onValueChange={(value) => {
                setSelectedAddressId(value);
                setAddressCopied(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un domicilio" />
              </SelectTrigger>
              <SelectContent>
                {addresses.map((address) => (
                  <SelectItem key={address.id} value={address.id}>
                    {address.street} #{address.exterior_number},{" "}
                    {address.neighborhood} ({address.postal_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Campos de dirección */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="street">Calle</Label>
            <Input
              id="street"
              name="street"
              value={form.street}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="exterior_number">Número Exterior</Label>
            <Input
              id="exterior_number"
              name="exterior_number"
              value={form.exterior_number}
              onChange={handleChange}
              required
              maxLength={10}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="interior_number">Número Interior (opcional)</Label>
            <Input
              id="interior_number"
              name="interior_number"
              value={form.interior_number}
              onChange={handleChange}
              maxLength={10}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="neighborhood">Colonia</Label>
            <Input
              id="neighborhood"
              name="neighborhood"
              value={form.neighborhood}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="city">Ciudad / Municipio</Label>
            <Input
              id="city"
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="state">Estado</Label>
            <Input
              id="state"
              name="state"
              value={form.state}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || regimenOptions.length === 0}
            className="bg-[#CE0E2D] hover:bg-[#CE0E2D]/90"
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
