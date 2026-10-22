"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface QuotationPaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function QuotationPagination({
  currentPage,
  totalPages,
  onPageChange,
}: QuotationPaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-custom-border-secondary">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-custom-border-secondary hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-custom-text-secondary hover:text-white text-sm"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <div className="flex items-center gap-1">
        <span className="text-sm text-custom-text-tertiary px-2">
          Página {currentPage} de {totalPages}
        </span>
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg border border-custom-border-secondary hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-custom-text-secondary hover:text-white text-sm"
        aria-label="Página siguiente"
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}