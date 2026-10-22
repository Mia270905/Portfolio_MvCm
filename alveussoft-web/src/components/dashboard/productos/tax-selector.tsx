"use client";

import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Tax {
  id: string;
  name: string;
  rate: number;
  tax_type: string;
  description?: string;
  sat_tax_type?: string;
}

interface TaxSelectorProps {
  availableTaxes: Tax[];
  selectedTaxIds: string[];
  onAddTax: (taxId: string) => void;
  onRemoveTax: (taxId: string) => void;
  disabled?: boolean;
}

export function TaxSelector({
  availableTaxes,
  selectedTaxIds,
  onAddTax,
  onRemoveTax,
  disabled = false,
}: TaxSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTaxId, setSelectedTaxId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedTaxes = availableTaxes.filter((tax) =>
    selectedTaxIds.includes(tax.id),
  );

  // Filtrar impuestos disponibles
  const availableToAdd = availableTaxes
    .filter((tax) => !selectedTaxIds.includes(tax.id))
    .filter((tax) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        tax.name.toLowerCase().includes(term) ||
        tax.description?.toLowerCase().includes(term) ||
        tax.sat_tax_type?.toLowerCase().includes(term)
      );
    });

  // Enfocar el input de búsqueda cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleAddTax = () => {
    if (selectedTaxId && !selectedTaxIds.includes(selectedTaxId)) {
      onAddTax(selectedTaxId);
      setSelectedTaxId("");
      setSearchTerm("");
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-semibold text-gray-300 mb-1">
        Impuestos del producto
      </Label>

      {/* Lista de impuestos seleccionados */}
      {selectedTaxes.length > 0 && (
        <div className="space-y-2">
          {selectedTaxes.map((tax) => (
            <div
              key={tax.id}
              className="flex items-center justify-between p-3 bg-[#070B14] rounded-lg border border-gray-700"
            >
              <div className="flex flex-col">
                <span className="font-medium text-sm">{tax.name}</span>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {tax.tax_type === "percentage"
                      ? `Porcentaje: ${tax.rate}%`
                      : `Monto fijo: $${tax.rate}`}
                  </span>
                  {tax.sat_tax_type && (
                    <Badge variant="outline" className="text-xs h-5">
                      {tax.sat_tax_type.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemoveTax(tax.id)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Selector para agregar impuestos */}
      {availableToAdd.length > 0 && (
        <div className="flex gap-2">
          <Select
            value={selectedTaxId}
            onValueChange={setSelectedTaxId}
            disabled={disabled}
            open={isOpen}
            onOpenChange={setIsOpen}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Selecciona un impuesto" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-gray-800 border-gray-700">
              {/* Barra de búsqueda dentro del dropdown */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Buscar impuesto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9 text-sm font-medium bg-[#0A0F17] text-white border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Lista de impuestos filtrados */}
              <ScrollArea className="h-[200px]">
                {availableToAdd.length === 0 ? (
                  <div className="py-4 text-center text-sm text-gray-500">
                    No se encontraron impuestos
                  </div>
                ) : (
                  availableToAdd.map((tax) => (
                    <SelectItem key={tax.id} value={tax.id} className="py-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{tax.name}</span>
                          {tax.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {tax.description}
                            </p>
                          )}
                        </div>
                        <span className="ml-4 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {tax.tax_type === "percentage"
                            ? `${tax.rate}%`
                            : `$${tax.rate}`}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
          <Button
            type="button"
            onClick={handleAddTax}
            disabled={!selectedTaxId || disabled}
            className="bg-[#4F46E5] hover:bg-[#6366F1]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        </div>
      )}

      {/* Mensajes informativos */}
      {availableToAdd.length === 0 && selectedTaxes.length > 0 && (
        <p className="text-xs text-green-600 text-center p-2 bg-green-500/10 text-green-600 border-green-500/20 rounded">
          ✓ Todos los impuestos disponibles han sido agregados
        </p>
      )}

      {selectedTaxes.length === 0 && (
        <p className="text-xs text-gray-500 text-center p-2 bg-[#070B14]/50 rounded border border-gray-700">
          No hay impuestos asociados a este producto
        </p>
      )}
    </div>
  );
}
