"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface MovementsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isMobile?: boolean;
}

export function MovementsPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  isMobile = false,
}: MovementsPaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Si no hay páginas, no mostrar la paginación
  if (totalPages <= 1) return null;

  // Generar array de páginas a mostrar con keys únicas
  const getPageNumbers = () => {
    const pages: Array<{
      type: "page" | "ellipsis";
      value: number | string;
      key: string;
    }> = [];

    // Siempre mostrar primera página
    pages.push({ type: "page", value: 1, key: "page-1" });

    // Calcular páginas alrededor de la actual
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);

    // Ajustar si hay huecos
    if (startPage > 2) {
      pages.push({ type: "ellipsis", value: "...", key: "ellipsis-start" });
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push({ type: "page", value: i, key: `page-${i}` });
    }

    if (endPage < totalPages - 1) {
      pages.push({ type: "ellipsis", value: "...", key: "ellipsis-end" });
    }

    // Siempre mostrar última página si no es la primera
    if (totalPages > 1) {
      pages.push({
        type: "page",
        value: totalPages,
        key: `page-${totalPages}`,
      });
    }

    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Mostrando <span className="font-medium">{startItem}</span> -{" "}
        <span className="font-medium">{endItem}</span> de{" "}
        <span className="font-medium">{totalItems}</span> movimientos
      </div>

      <div className="flex items-center gap-2">
        {/* Botón para ir a la primera página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Primera página"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>

        {/* Botón para página anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Números de página */}
        <div className="flex gap-1">
          {getPageNumbers().map((item) => {
            if (item.type === "ellipsis") {
              return (
                <span
                  key={item.key}
                  className="px-2 py-1 text-gray-400 flex items-center"
                >
                  ...
                </span>
              );
            }

            const pageNumber = item.value as number;
            return (
              <button
                key={item.key}
                onClick={() => onPageChange(pageNumber)}
                className={`min-w-[40px] px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  pageNumber === currentPage
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        {/* Botón para página siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Botón para ir a la última página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Última página"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>

      {/* Selector de página en móvil */}
      {isMobile && (
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-sm text-gray-600">Página</span>
          <select
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <option key={`mobile-page-${page}`} value={page}>
                {page}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">de {totalPages}</span>
        </div>
      )}
    </div>
  );
}
