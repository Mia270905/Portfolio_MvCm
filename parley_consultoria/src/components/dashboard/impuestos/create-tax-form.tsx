"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { createTax } from "@/lib/actions/tax.actions";
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

export function CreateTaxForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tax_type: "percentage" as "percentage" | "fixed_amount",
    general_type: "venta" as "venta" | "compras" | "ninguno",
    sat_tax_type: "iva" as "iva" | "isr" | "ieps" | "local",
    rate: 16.0,
    is_active: true,
  });

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
    setLoading(true);

    try {
      // Validaciones
      if (!formData.name.trim()) {
        toast.error("El nombre del impuesto es requerido");
        setLoading(false);
        return;
      }

      if (isNaN(formData.rate) || formData.rate < 0) {
        toast.error("El valor debe ser mayor o igual a 0");
        setLoading(false);
        return;
      }

      if (formData.tax_type === "percentage" && formData.rate > 100) {
        toast.error("El porcentaje no puede ser mayor al 100%");
        setLoading(false);
        return;
      }

      const result = await createTax({
        name: formData.name,
        description: formData.description || undefined,
        tax_type: formData.tax_type,
        general_type: formData.general_type,
        sat_tax_type: formData.sat_tax_type,
        rate: formData.rate,
        is_active: formData.is_active,
      });

      if (result.success) {
        toast.success("¡Impuesto creado exitosamente!");
        setTimeout(() => {
          router.push("/dashboard/impuestos/gestion");
          router.refresh();
        }, 1500);
      } else {
        toast.error(result.message || "Error al crear el impuesto");
      }
    } catch (err: any) {
      toast.error(err.message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-8">
        {/* Nombre del impuesto */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-300">
            Nombre del impuesto <span className="text-amber-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Ej: IVA, ISR, Impuesto Local"
            disabled={loading}
            className="w-full bg-[#070B14] border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
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
            disabled={loading}
            className="w-full bg-[#070B14] border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          />
        </div>

        {/* Grid de 2 columnas para los combobox superiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aplicación del impuesto */}
          <div className="space-y-2">
            <Label htmlFor="general_type" className="text-sm font-medium text-gray-300">
              Aplicación del impuesto <span className="text-amber-500">*</span>
            </Label>
            <Select
              value={formData.general_type}
              onValueChange={(value: "venta" | "compras" | "ninguno") =>
                handleSelectChange("general_type", value)
              }
              disabled={loading}
            >
              <SelectTrigger 
                id="general_type" 
                className="w-full bg-[#070B14] border-gray-700 text-white hover:border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <SelectValue placeholder="Seleccionar aplicación" />
              </SelectTrigger>
              <SelectContent className="bg-[#070B14] border-gray-700">
                <SelectItem value="venta" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  Venta
                </SelectItem>
                <SelectItem value="compras" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  Compras
                </SelectItem>
                <SelectItem value="ninguno" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  Ninguno
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Impuesto SAT */}
          <div className="space-y-2">
            <Label htmlFor="sat_tax_type" className="text-sm font-medium text-gray-300">
              Tipo de Impuesto SAT <span className="text-amber-500">*</span>
            </Label>
            <Select
              value={formData.sat_tax_type}
              onValueChange={(value: "iva" | "isr" | "ieps" | "local") =>
                handleSelectChange("sat_tax_type", value)
              }
              disabled={loading}
            >
              <SelectTrigger 
                id="sat_tax_type" 
                className="w-full bg-[#070B14] border-gray-700 text-white hover:border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <SelectValue placeholder="Seleccionar tipo SAT" />
              </SelectTrigger>
              <SelectContent className="bg-[#070B14] border-gray-700">
                <SelectItem value="iva" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  IVA
                </SelectItem>
                <SelectItem value="isr" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  ISR
                </SelectItem>
                <SelectItem value="ieps" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  IEPS
                </SelectItem>
                <SelectItem value="local" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  Local
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid de 2 columnas para tipo de cálculo y valor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tipo de cálculo */}
          <div className="space-y-2">
            <Label htmlFor="tax_type" className="text-sm font-medium text-gray-300">
              Tipo de cálculo <span className="text-amber-500">*</span>
            </Label>
            <Select
              value={formData.tax_type}
              onValueChange={(value: "percentage" | "fixed_amount") =>
                handleSelectChange("tax_type", value)
              }
              disabled={loading}
            >
              <SelectTrigger 
                id="tax_type" 
                className="w-full bg-[#070B14] border-gray-700 text-white hover:border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <SelectValue placeholder="Seleccionar tipo de cálculo" />
              </SelectTrigger>
              <SelectContent className="bg-[#070B14] border-gray-700">
                <SelectItem value="percentage" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  Porcentaje
                </SelectItem>
                <SelectItem value="fixed_amount" className="text-gray-200 hover:bg-[#0A0F17] focus:bg-[#0A0F17] focus:text-white">
                  Monto fijo
                </SelectItem>
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
                disabled={loading}
                className="w-full pr-10 bg-[#070B14] border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500">
                  {formData.tax_type === "percentage" ? "%" : "$"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.tax_type === "percentage"
                ? "Ej: 16.00, 8.00, 0.00"
                : "Ej: 50.00, 100.00, 0.00"}
            </p>
          </div>
        </div>

        {/* Estado activo */}
        <div className="flex items-center justify-between p-4 bg-[#070B14] rounded-lg border border-gray-700">
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
          disabled={loading}
          className="bg-transparent border-gray-700 text-gray-300 hover:bg-[#0A0F17] hover:text-white hover:border-gray-600"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || !formData.name.trim() || isNaN(formData.rate)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-900 font-semibold hover:from-yellow-400 hover:to-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500"
        >
          {loading ? (
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
              Creando...
            </>
          ) : (
            "Crear impuesto"
          )}
        </Button>
      </div>
    </form>
  );
}
