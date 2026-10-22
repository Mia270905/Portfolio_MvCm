"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function CategoryPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: CategoryPaginationProps) {
  const getVisiblePages = () => {
    const pages = [];
    const showPages = 3; // Número de páginas a mostrar alrededor de la actual

    let startPage = Math.max(1, currentPage - showPages);
    let endPage = Math.min(totalPages, currentPage + showPages);

    // Ajustar si estamos cerca del inicio
    if (currentPage <= showPages) {
      endPage = Math.min(totalPages, showPages * 2 + 1);
    }

    // Ajustar si estamos cerca del final
    if (currentPage >= totalPages - showPages) {
      startPage = Math.max(1, totalPages - showPages * 2);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-4 sm:px-0">
      {/* Información de items */}
      <div className="text-sm text-gray-700">
        Mostrando {startItem} - {endItem} de {totalItems} categorías
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Números de página */}
        <div className="flex gap-1">
          {/* Mostrar primera página si no está visible */}
          {!visiblePages.includes(1) && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                1
              </button>
              {!visiblePages.includes(2) && (
                <span className="px-3 py-1 text-gray-500">...</span>
              )}
            </>
          )}

          {/* Páginas visibles */}
          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 border rounded-md text-sm font-medium ${
                page === currentPage
                  ? "bg-blue-500 text-white border-blue-500"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {page}
            </button>
          ))}

          {/* Mostrar última página si no está visible */}
          {!visiblePages.includes(totalPages) && (
            <>
              {!visiblePages.includes(totalPages - 1) && (
                <span className="px-3 py-1 text-gray-500">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}