"use client";

import * as React from "react";
import { Trash2, AlertCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PriceListCombobox } from "./price-list-combobox";
import { cn } from "@/lib/utils";

interface PriceList {
  id: string;
  name: string;
  code?: string;
}

export interface ProductPriceList {
  id: string;
  price: string;
}

interface PriceListSelectorProps {
  priceLists: PriceList[];
  selectedPriceLists: ProductPriceList[];
  onAddPriceList: (priceListId: string) => void;
  onRemovePriceList: (priceListId: string) => void;
  onUpdatePrice: (priceListId: string, price: string) => void;
  disabled?: boolean;
  errors?: { [key: string]: string };
}

export function PriceListSelector({
  priceLists,
  selectedPriceLists,
  onAddPriceList,
  onRemovePriceList,
  onUpdatePrice,
  disabled = false,
  errors = {},
}: PriceListSelectorProps) {
  const [currentSelection, setCurrentSelection] = React.useState("");

  const handleAdd = () => {
    if (currentSelection) {
      onAddPriceList(currentSelection);
      setCurrentSelection("");
    }
  };

  const getSelectedPriceListNames = (id: string) => {
    const list = priceLists.find((pl) => pl.id === id);
    return list?.name || "";
  };

  const defaultListObj = priceLists.find((pl) => pl.code === "default");

  const availablePriceLists = priceLists.filter((pl) => {
    if (pl.code === "default") return false;
    return !selectedPriceLists.find((spl) => spl.id === pl.id);
  });

  const defaultList = selectedPriceLists.find((pl) => {
    const list = priceLists.find((p) => p.id === pl.id);
    return list?.code === "default";
  });

  const otherLists = selectedPriceLists.filter((pl) => {
    const list = priceLists.find((p) => p.id === pl.id);
    return list?.code !== "default";
  });

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold text-white mb-1 block">
          Listas de precios <span className="text-red-400">*</span>
        </Label>
        <p className="text-xs text-gray-400 mb-4">
          La lista &quot;default&quot; es obligatoria. Busca y agrega otras
          listas de precios con sus precios específicos.
        </p>

        {/* Selector para agregar listas - Solo mostrar si hay listas disponibles */}
        {availablePriceLists.length > 0 && (
          <Card className="border border-gray-800 mb-2 bg-[#070B14] py-2">
            <CardContent className="p-4">
              <div className="space-y-2">
                <Label
                  htmlFor="add-price-list"
                  className="text-xs font-medium text-gray-300 block"
                >
                  Buscar lista de precios
                </Label>
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <div className="flex-1 min-w-0">
                    <PriceListCombobox
                      priceLists={availablePriceLists}
                      value={currentSelection}
                      onValueChange={setCurrentSelection}
                      disabled={disabled}
                      placeholder="Selecciona una lista..."
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAdd}
                    disabled={!currentSelection || disabled}
                    className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-[#04060B]"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de precios agregadas */}
        <div className="space-y-2">
          {defaultList && defaultListObj && (
            <Card className="border border-gray-800 bg-[#070B14] overflow-hidden py-1">
              {" "}
              <CardContent className="p-3">
                {" "}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_40px] gap-2 items-center">
                  {" "}
                  <div className="min-w-0">
                    <Label
                      htmlFor={`price-${defaultList.id}`}
                      className="text-xs font-medium text-gray-300 block mb-2"
                    >
                      Precio por defecto <span className="text-red-400">*</span>
                    </Label>

                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-400 text-sm font-medium pointer-events-none">
                        {" "}$
                      </span>
                      <Input
                        id={`price-${defaultList.id}`}
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="9999999.99"
                        value={defaultList.price}
                        onChange={(e) => {
                          const val = e.target.value;

                          if (val === "" || val === "0") {
                            onUpdatePrice(defaultList.id, "");
                            return;
                          }

                          const num = parseFloat(val);
                          if (!isNaN(num) && num > 0) {
                            onUpdatePrice(defaultList.id, val);
                          }
                        }}
                        onBlur={(e) => {
                          const val = e.target.value;
                          if (val && val !== "") {
                            const num = parseFloat(val);
                            if (!isNaN(num) && num > 0) {
                              onUpdatePrice(defaultList.id, num.toFixed(2));
                            }
                          }
                        }}
                        placeholder="0.00"
                        disabled={disabled}
                        className={cn(
                          "pl-7 text-sm font-medium transition-colors bg-gray-800 border-gray-700 text-gray-200 h-8",
                          errors[`price_${defaultList.id}`]
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-900/20"
                            : "focus:border-blue-600 focus:ring-blue-600/30"
                        )}
                      />
                    </div>

                    {errors[`price_${defaultList.id}`] && (
                      <p
                        id={`error-${defaultList.id}`}
                        className="text-red-400 text-xs mt-1 flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors[`price_${defaultList.id}`]}
                      </p>
                    )}

                    <p
                      id={`hint-${defaultList.id}`}
                      className={cn(
                        "text-xs mt-1 transition-opacity",
                        errors[`price_${defaultList.id}`]
                          ? "text-red-400 opacity-70"
                          : "text-gray-400"
                      )}
                    >
                      Formato: 99.99 - El precio debe ser mayor a 0
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {otherLists.length > 0 && (
            <div className="space-y-2">
              {otherLists.map((item) => (
                <Card
                  key={item.id}
                  className="border border-gray-800 bg-[#070B14] overflow-hidden py-1 hover:bg-[#0A0F1C] transition-colors" 
                >
                  <CardContent className="p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_40px] gap-2 items-center">
                      <div className="min-w-0">
                        <Label className="text-xs font-medium text-gray-300 block mb-1">
                          {getSelectedPriceListNames(item.id)}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-400 text-sm font-medium pointer-events-none">
                            {" "}$
                          </span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max="9999999.99"
                            value={item.price}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                onUpdatePrice(item.id, "");
                              } else {
                                const num = Number.parseFloat(val);
                                if (!isNaN(num)) {
                                  onUpdatePrice(item.id, num.toFixed(2));
                                }
                              }
                            }}
                            placeholder="0.00"
                            disabled={disabled}
                            className={cn(
                              "pl-7 text-sm font-medium bg-gray-800 border-gray-700 text-gray-200 h-8", 
                              errors[`price_${item.id}`]
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-900/20"
                                : "focus:border-blue-600 focus:ring-blue-600/30"
                            )}
                          />
                        </div>
                        {errors[`price_${item.id}`] && (
                          <p className="text-red-400 text-xs mt-1">
                            {" "}
                            {errors[`price_${item.id}`]}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {" "}
                          Formato: 99.99
                        </p>
                      </div>

                      <div className="flex items-center justify-end sm:justify-end col-span-1 sm:col-span-1">
                        <Button
                          type="button"
                          onClick={() => onRemovePriceList(item.id)}
                          disabled={disabled}
                          variant="destructive"
                          size="sm"
                          className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700" 
                          title="Eliminar lista de precios"
                        >
                          <Trash2 className="h-3.5 w-3.5" />{" "}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedPriceLists.length === 0 && (
            <Card className="border border-dashed border-gray-700 bg-gray-900/30">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-gray-400">
                  Agrega la lista default y otras listas de precios para
                  comenzar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}