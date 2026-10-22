"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

interface CompanyPaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function CompanyPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: CompanyPaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Función para generar los números de página a mostrar
  const getVisiblePages = () => {
    const pages = []
    const maxVisiblePages = 5 // Máximo de páginas visibles

    if (totalPages <= maxVisiblePages) {
      // Mostrar todas las páginas si son pocas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Siempre mostrar primera página
      pages.push(1)

      // Calcular páginas alrededor de la actual
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Ajustar si estamos cerca del inicio
      if (currentPage <= 3) {
        end = Math.min(totalPages - 1, 4)
      }

      // Ajustar si estamos cerca del final
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3)
      }

      // Agregar puntos suspensivos después de la primera página si es necesario
      if (start > 2) {
        pages.push('...')
      }

      // Agregar páginas del medio
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Agregar puntos suspensivos antes de la última página si es necesario
      if (end < totalPages - 1) {
        pages.push('...')
      }

      // Siempre mostrar última página
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-800">
      <div className="text-sm text-gray-400">
        Mostrando {startItem} - {endItem} de {totalItems} empresas
      </div>

      <div className="flex items-center gap-2">
        {/* Botón anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
        </button>

        {/* Números de página */}
        <div className="flex gap-1">
          {visiblePages.map((page, index) => {
            if (page === '...') {
              return (
                <span 
                  key={`ellipsis-${index}`} 
                  className="px-3 py-1 text-gray-500 flex items-center"
                >
                  ...
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 ${
                  page === currentPage 
                    ? "bg-yellow-500 text-gray-900 border border-yellow-500" 
                    : "border border-gray-700 hover:bg-gray-800 text-gray-300"
                }`}
                aria-label={`Ir a página ${page}`}
                aria-current={page === currentPage ? "page" : undefined}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Botón siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-700 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  )
}