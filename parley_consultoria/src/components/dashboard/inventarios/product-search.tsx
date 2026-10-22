"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  code: string;
}

interface ProductSearchProps {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
}

export default function ProductSearch({
  products,
  value,
  onChange,
}: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredProducts(
        products.filter(
          (product) =>
            product.name.toLowerCase().includes(term) ||
            product.code.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, products]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProduct = products.find((p) => p.id === value);

  return (
    <div className="relative w-full" ref={searchRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Producto
      </label>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm || (selectedProduct?.name ?? "")}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Buscar producto por nombre o código..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
        {value && (
          <button
            onClick={() => {
              onChange("");
              setSearchTerm("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No se encontraron productos
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  onChange(product.id);
                  setSearchTerm("");
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors ${
                  value === product.id ? "bg-blue-100 font-medium" : ""
                }`}
              >
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-xs text-gray-500">{product.code}</div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
