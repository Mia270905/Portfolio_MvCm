"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";

interface PriceList {
  id: string;
  code: string;
  name: string;
}

interface PriceListSelectorProps {
  availablePriceLists: PriceList[];
  selectedPriceList: string | null;
  onChange: (priceListId: string | null) => void;
  disabled?: boolean;
}

export default function PriceListSelector({
  availablePriceLists,
  selectedPriceList,
  onChange,
  disabled = false,
}: PriceListSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filtrar listas según el término de búsqueda
  const filteredPriceLists = useMemo(() => {
    if (!searchTerm.trim()) return availablePriceLists;

    const term = searchTerm.toLowerCase();
    return availablePriceLists.filter(
      (priceList) =>
        priceList.code.toLowerCase().includes(term) ||
        priceList.name.toLowerCase().includes(term),
    );
  }, [availablePriceLists, searchTerm]);

  // Obtener la lista seleccionada actual
  const selectedPriceListData = useMemo(() => {
    return availablePriceLists.find((pl) => pl.id === selectedPriceList);
  }, [availablePriceLists, selectedPriceList]);

  const handleSelect = (priceListId: string) => {
    onChange(priceListId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    // Buscar la lista "default" y seleccionarla
    const defaultPriceList = availablePriceLists.find(
      (pl) => pl.code === "default",
    );
    if (defaultPriceList) {
      onChange(defaultPriceList.id);
    }
  };

  return (
    <div className="relative">
      {/* Campo de selección */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full text-left border border-gray-300 rounded-md p-2 pr-10 bg-white
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "hover:border-gray-400 cursor-pointer"}
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
        >
          {selectedPriceListData ? (
            <span className="block truncate">
              <span className="font-medium">{selectedPriceListData.code}</span>
              {" - "}
              <span className="text-gray-600">
                {selectedPriceListData.name}
              </span>
            </span>
          ) : (
            <span className="text-gray-400">
              Selecciona una lista de precios
            </span>
          )}
        </button>

        {/* Botón de limpiar */}
        {selectedPriceListData &&
          selectedPriceListData.code !== "default" &&
          !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              title="Restablecer a default"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
      </div>

      {/* Dropdown con búsqueda */}
      {isOpen && !disabled && (
        <>
          {/* Overlay para cerrar al hacer click fuera */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Campo de búsqueda */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Lista de opciones */}
            <div className="overflow-y-auto max-h-60">
              {filteredPriceLists.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron listas de precios
                </div>
              ) : (
                filteredPriceLists.map((priceList) => (
                  <button
                    key={priceList.id}
                    type="button"
                    onClick={() => handleSelect(priceList.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors
                      ${priceList.id === selectedPriceList ? "bg-indigo-50" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {priceList.code}
                        {priceList.id === selectedPriceList && (
                          <span className="ml-2 text-xs text-indigo-600 font-semibold">
                            ✓ Seleccionado
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-gray-600">
                        {priceList.name}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer con contador */}
            {filteredPriceLists.length > 0 && (
              <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-center">
                {filteredPriceLists.length === availablePriceLists.length
                  ? `${availablePriceLists.length} lista${availablePriceLists.length !== 1 ? "s" : ""} disponible${availablePriceLists.length !== 1 ? "s" : ""}`
                  : `${filteredPriceLists.length} de ${availablePriceLists.length} lista${availablePriceLists.length !== 1 ? "s" : ""}`}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
