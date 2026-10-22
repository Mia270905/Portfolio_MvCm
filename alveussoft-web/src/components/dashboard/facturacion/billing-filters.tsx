"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FilterKey = 'invoiceStatus' | 'orderDateFrom' | 'orderDateTo' | 'invoiceDateFrom' | 'invoiceDateTo';

interface BillingFiltersProps {
  filters: {
    invoiceStatus: "all" | "with_invoice" | "without_invoice";
    orderDateFrom: string;
    orderDateTo: string;
    invoiceDateFrom: string;
    invoiceDateTo: string;
  };
  onFilterChange: (key: FilterKey, value: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function BillingFilters({
  filters,
  onFilterChange,
  onClearFilters,
  hasActiveFilters,
}: BillingFiltersProps) {
  // Cambia el tipo de key a FilterKey
  const handleDateChange = (key: FilterKey, value: string) => {
    onFilterChange(key, value);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "Seleccionar";

    try {
      // Crear la fecha en horario local
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day); // month - 1 porque JS usa 0-index para meses

      return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-4">
      <div className="space-y-4">
        {/* Estado de Factura */}
        <div>
          <div className="text-sm font-medium text-gray-300 mb-2">
            Estado de Factura:
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filters.invoiceStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onFilterChange("invoiceStatus", "all")}
            >
              Todas
            </Button>
            <Button
              variant={
                filters.invoiceStatus === "with_invoice" ? "default" : "outline"
              }
              size="sm"
              onClick={() => onFilterChange("invoiceStatus", "with_invoice")}
            >
              Facturadas
            </Button>
            <Button
              variant={
                filters.invoiceStatus === "without_invoice"
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => onFilterChange("invoiceStatus", "without_invoice")}
            >
              Por Facturar
            </Button>
          </div>
        </div>

        {/* Filtros por fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fechas de Orden */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Calendar className="w-4 h-4" />
              Fecha de Orden
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="orderDateFrom" className="text-xs">
                  Desde:
                </Label>
                <Input
                  id="orderDateFrom"
                  type="date"
                  value={filters.orderDateFrom}
                  onChange={(e) =>
                    handleDateChange("orderDateFrom", e.target.value)
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="orderDateTo" className="text-xs">
                  Hasta:
                </Label>
                <Input
                  id="orderDateTo"
                  type="date"
                  value={filters.orderDateTo}
                  onChange={(e) =>
                    handleDateChange("orderDateTo", e.target.value)
                  }
                  className="h-9 text-sm"
                  min={filters.orderDateFrom}
                />
              </div>
            </div>
          </div>

          {/* Fechas de Factura */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Calendar className="w-4 h-4" />
              Fecha de Factura
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="invoiceDateFrom" className="text-xs">
                  Desde:
                </Label>
                <Input
                  id="invoiceDateFrom"
                  type="date"
                  value={filters.invoiceDateFrom}
                  onChange={(e) =>
                    handleDateChange("invoiceDateFrom", e.target.value)
                  }
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoiceDateTo" className="text-xs">
                  Hasta:
                </Label>
                <Input
                  id="invoiceDateTo"
                  type="date"
                  value={filters.invoiceDateTo}
                  onChange={(e) =>
                    handleDateChange("invoiceDateTo", e.target.value)
                  }
                  className="h-9 text-sm"
                  min={filters.invoiceDateFrom}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resumen y limpiar filtros */}
        {hasActiveFilters && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-800">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-yellow-400/20 text-yellow-400 border-yellow-400/30">
                Filtros activos:
              </Badge>
              <div className="text-xs text-gray-400 space-x-2">
                {filters.invoiceStatus !== "all" && (
                  <span className="inline-block">
                    Estado:{" "}
                    {filters.invoiceStatus === "with_invoice"
                      ? "Facturadas"
                      : "Por Facturar"}
                  </span>
                )}
                {filters.orderDateFrom && (
                  <span className="inline-block">
                    Orden desde: {formatDateDisplay(filters.orderDateFrom)}
                  </span>
                )}
                {filters.orderDateTo && (
                  <span className="inline-block">
                    Orden hasta: {formatDateDisplay(filters.orderDateTo)}
                  </span>
                )}
                {filters.invoiceDateFrom && (
                  <span className="inline-block">
                    Factura desde: {formatDateDisplay(filters.invoiceDateFrom)}
                  </span>
                )}
                {filters.invoiceDateTo && (
                  <span className="inline-block">
                    Factura hasta: {formatDateDisplay(filters.invoiceDateTo)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="whitespace-nowrap"
            >
              Limpiar todos los filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}