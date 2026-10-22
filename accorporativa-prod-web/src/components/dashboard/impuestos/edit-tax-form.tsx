"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getTaxById, updateTax, type Tax } from "@/lib/actions/tax.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface EditTaxFormProps {
  taxId: string;
}

export function EditTaxForm({ taxId }: EditTaxFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tax, setTax] = useState<Tax | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tax_type: "percentage" as "percentage" | "fixed_amount",
    general_type: "venta" as "venta" | "compras" | "ninguno",
    sat_tax_type: "iva" as "iva" | "isr" | "ieps" | "local",
    rate: 0,
    is_active: true,
  });

  // Cargar el impuesto
  useEffect(() => {
    const loadTax = async () => {
      try {
        setLoading(true);
        const taxData = await getTaxById(taxId);

        if (!taxData) {
          toast.error("Impuesto no encontrado");
          router.push("/dashboard/impuestos/gestion");
          return;
        }

        setTax(taxData);
        setFormData({
          name: taxData.name || "",
          description: taxData.description || "",
          tax_type: taxData.tax_type,
          general_type: taxData.general_type,
          sat_tax_type: taxData.sat_tax_type,
          rate: taxData.rate || 0,
          is_active: taxData.is_active,
        });
      } catch (error) {
        console.error("Error loading tax:", error);
        toast.error("Error al cargar el impuesto");
        router.push("/dashboard/impuestos/gestion");
      } finally {
        setLoading(false);
      }
    };

    loadTax();
  }, [taxId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "rate") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData((prev) => ({
          ...prev,
          [name]: numValue,
        }));
      } else if (value === "" || value === ".") {
        setFormData((prev: any) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tax) return;

    setSaving(true);

    try {
      // Validaciones
      if (!formData.name.trim()) {
        toast.error("El nombre del impuesto es requerido");
        setSaving(false);
        return;
      }

      if (isNaN(formData.rate) || formData.rate < 0) {
        toast.error("El valor debe ser mayor o igual a 0");
        setSaving(false);
        return;
      }

      if (formData.tax_type === "percentage" && formData.rate > 100) {
        toast.error("El porcentaje no puede ser mayor al 100%");
        setSaving(false);
        return;
      }

      const result = await updateTax(taxId, {
        name: formData.name,
        description: formData.description || undefined,
        tax_type: formData.tax_type,
        general_type: formData.general_type,
        sat_tax_type: formData.sat_tax_type,
        rate: formData.rate,
        is_active: formData.is_active,
      });

      if (result.success) {
        toast.success("¡Impuesto actualizado exitosamente!");
        setTimeout(() => {
          router.push("/dashboard/impuestos/gestion");
          router.refresh();
        }, 1000);
      } else {
        toast.error(result.message || "Error al actualizar el impuesto");
      }
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    } finally {
      setSaving(false);
    }
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-800 rounded-lg"></div>
          <div className="h-32 bg-gray-800 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-10 bg-gray-800 rounded-lg"></div>
            <div className="h-10 bg-gray-800 rounded-lg"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-10 bg-gray-800 rounded-lg"></div>
            <div className="h-10 bg-gray-800 rounded-lg"></div>
          </div>
          <div className="h-16 bg-gray-800 rounded-lg"></div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-800">
          <div className="h-10 bg-gray-800 rounded-lg w-24"></div>
          <div className="h-10 bg-gray-800 rounded-lg w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        {/* Nombre del impuesto */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-300">
            Nombre del impuesto *
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: IVA, ISR, Impuesto Local"
            disabled={saving}
            className="w-full bg-[#0A0F17] border-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Descripción */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-300">
            Descripción (opcional)
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Descripción del impuesto..."
            disabled={saving}
            className="w-full bg-[#0A0F17] border-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Grid de 2 columnas para los combobox superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aplicación del impuesto */}
          <div className="space-y-2">
            <Label htmlFor="general_type" className="text-sm font-medium text-gray-300">
              Aplicación del impuesto *
            </Label>
            <Select
              value={formData.general_type}
              onValueChange={(value: "venta" | "compras" | "ninguno") =>
                handleSelectChange("general_type", value)
              }
              disabled={saving}
            >
              <SelectTrigger id="general_type" className="w-full bg-[#0A0F17] border-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F17] border-gray-800">
                <SelectItem value="venta" className="text-gray-300">Venta</SelectItem>
                <SelectItem value="compras" className="text-gray-300">Compras</SelectItem>
                <SelectItem value="ninguno" className="text-gray-300">Ninguno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Impuesto SAT */}
          <div className="space-y-2">
            <Label htmlFor="sat_tax_type" className="text-sm font-medium text-gray-300">
              Tipo de Impuesto SAT *
            </Label>
            <Select
              value={formData.sat_tax_type}
              onValueChange={(value: "iva" | "isr" | "ieps" | "local") =>
                handleSelectChange("sat_tax_type", value)
              }
              disabled={saving}
            >
              <SelectTrigger id="sat_tax_type" className="w-full bg-[#0A0F17] border-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F17] border-gray-800">
                <SelectItem value="iva" className="text-gray-300">IVA</SelectItem>
                <SelectItem value="isr" className="text-gray-300">ISR</SelectItem>
                <SelectItem value="ieps" className="text-gray-300">IEPS</SelectItem>
                <SelectItem value="local" className="text-gray-300">Local</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid de 2 columnas para tipo de cálculo y valor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de cálculo */}
          <div className="space-y-2">
            <Label htmlFor="tax_type" className="text-sm font-medium text-gray-300">
              Tipo de cálculo *
            </Label>
            <Select
              value={formData.tax_type}
              onValueChange={(value: "percentage" | "fixed_amount") =>
                handleSelectChange("tax_type", value)
              }
              disabled={saving}
            >
              <SelectTrigger id="tax_type" className="w-full bg-[#0A0F17] border-gray-800 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0A0F17] border-gray-800">
                <SelectItem value="percentage" className="text-gray-300">Porcentaje</SelectItem>
                <SelectItem value="fixed_amount" className="text-gray-300">Monto fijo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor del impuesto */}
          <div className="space-y-2">
            <Label htmlFor="rate" className="text-sm font-medium text-gray-300">
              {formData.tax_type === "percentage"
                ? "Tasa (%) *"
                : "Monto fijo ($) *"}
            </Label>
            <div className="relative">
              <Input
                type="number"
                id="rate"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                min="0"
                max={formData.tax_type === "percentage" ? "100" : undefined}
                step="0.01"
                required
                placeholder={
                  formData.tax_type === "percentage" ? "0.00" : "0.00"
                }
                disabled={saving}
                className="w-full pr-10 bg-[#0A0F17] border-gray-800 text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-400"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400">
                  {formData.tax_type === "percentage" ? "%" : "$"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {formData.tax_type === "percentage"
                ? "Ej: 16.00, 8.00, 0.00"
                : "Ej: 50.00, 100.00, 0.00"}
            </p>
          </div>
        </div>

        {/* Estado activo */}
        <div className="flex items-center justify-between p-4 bg-[#0A0F17] rounded-lg border border-gray-800">
          <div className="space-y-0.5">
            <Label htmlFor="is_active" className="text-sm font-medium text-gray-300">
              Impuesto activo
            </Label>
            <p className="text-sm text-gray-400">
              Los impuestos activos pueden ser asignados a productos
            </p>
          </div>
          <Switch
            id="is_active"
            checked={formData.is_active}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_active: checked })
            }
            disabled={loading}
            className="data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-gray-600"
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/impuestos/gestion")}
          disabled={saving}
          className="border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-400"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={saving || !formData.name.trim() || isNaN(formData.rate)}
          className="bg-yellow-500 text-gray-900 hover:bg-yellow-400"
        >
          {saving ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}
