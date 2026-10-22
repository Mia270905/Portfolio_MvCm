// app/dashboard/impuestos/gestion/tax-pagination.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TaxPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TaxPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: TaxPaginationProps) {
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];

    // Siempre mostrar primera página
    pages.push(1);

    // Rango alrededor de la página actual
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    // Agregar elipsis después de la primera página si es necesario
    if (start > 2) {
      pages.push("...");
    }

    // Agregar páginas del rango
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    // Agregar elipsis antes de la última página si es necesario
    if (end < totalPages - 1) {
      pages.push("...");
    }

    // Siempre mostrar última página si hay más de una
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-800">
      <div className="text-sm text-gray-400">
        Mostrando {startItem} - {endItem} de {totalItems} impuestos
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-400"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex gap-1">
          {getPageNumbers().map((page, index) =>
            page === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-1 text-gray-500"
              >
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1 ${
                  page === currentPage
                    ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400"
                    : "border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-400"
                }`}
              >
                {page}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 border-gray-700 text-gray-400 hover:text-yellow-400 hover:border-yellow-400"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
