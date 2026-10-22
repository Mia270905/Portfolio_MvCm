"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContactGroupPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ContactGroupPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: ContactGroupPaginationProps) {
  const getVisiblePages = () => {
    const pages = [];
    const showPages = 3;

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[#f5efe6]">
      {/* Información de items */}
      <div className="text-sm text-neutral-600">
        Mostrando {startItem} - {endItem} de {totalItems} grupos de contactos
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-[#e6dcc9] hover:bg-[#faf8f3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-5 h-5 text-neutral-600" />
        </button>

        {/* Números de página */}
        <div className="flex gap-1">
          {/* Mostrar primera página si no está visible */}
          {!visiblePages.includes(1) && (
            <>
              <button
                onClick={() => onPageChange(1)}
                className="px-3 py-1 border border-[#e6dcc9] rounded-lg text-sm font-medium text-neutral-700 hover:bg-[#faf8f3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                1
              </button>
              {!visiblePages.includes(2) && (
                <span className="px-3 py-1 text-neutral-400">...</span>
              )}
            </>
          )}

          {/* Páginas visibles */}
          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50 ${
                page === currentPage
                  ? "bg-[#c6a365] text-white border border-[#c6a365]"
                  : "border border-[#e6dcc9] hover:bg-[#faf8f3] text-neutral-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {page}
            </button>
          ))}

          {/* Mostrar última página si no está visible */}
          {!visiblePages.includes(totalPages) && (
            <>
              {!visiblePages.includes(totalPages - 1) && (
                <span className="px-3 py-1 text-neutral-400">...</span>
              )}
              <button
                onClick={() => onPageChange(totalPages)}
                className="px-3 py-1 border border-[#e6dcc9] rounded-lg text-sm font-medium text-neutral-700 hover:bg-[#faf8f3] disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="p-2 rounded-lg border border-[#e6dcc9] hover:bg-[#faf8f3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-5 h-5 text-neutral-600" />
        </button>
      </div>
    </div>
  );
}