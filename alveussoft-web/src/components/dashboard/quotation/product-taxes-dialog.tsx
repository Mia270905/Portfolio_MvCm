"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ProductTax {
  id: string
  name: string
  rate: number
  tax_type: "percentage" | "fixed_amount"
  description?: string
}

interface ProductTaxesDialogProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  taxes: ProductTax[]
  productSubtotal: number
}

export function ProductTaxesDialog({
  isOpen,
  onClose,
  productName,
  taxes,
  productSubtotal,
}: ProductTaxesDialogProps) {
  // Calcular el monto total de impuestos
  const totalTaxAmount = taxes.reduce((sum, tax) => {
    if (tax.tax_type === 'percentage') {
      return sum + (productSubtotal * tax.rate) / 100
    }
    return sum + tax.rate
  }, 0)

  const totalWithTaxes = productSubtotal + totalTaxAmount

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0A0F17] border-gray-800" aria-describedby="product-taxes-description">
        <DialogHeader>
          <DialogTitle className="text-white">Impuestos Aplicados</DialogTitle>
          <DialogDescription id="product-taxes-description" className="text-gray-400">
            {productName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Subtotal del producto */}
          <div className="flex justify-between items-center py-2 border-b border-gray-800">
            <span className="text-sm text-gray-400">Subtotal del producto:</span>
            <span className="font-medium text-white">${productSubtotal.toFixed(2)}</span>
          </div>

          {/* Lista de impuestos */}
          {taxes.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300">
                Impuestos ({taxes.length})
              </h3>
              {taxes.map((tax) => {
                const taxAmount = tax.tax_type === 'percentage'
                  ? (productSubtotal * tax.rate) / 100
                  : tax.rate

                return (
                  <div
                    key={tax.id}
                    className="flex justify-between items-start p-3 rounded-lg bg-gray-800/50 border border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{tax.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {tax.tax_type === 'percentage' ? `${tax.rate}%` : `$${tax.rate}`}
                        </Badge>
                      </div>
                      {tax.description && (
                        <p className="text-xs text-gray-500 mt-1">{tax.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-medium text-green-400">
                      +${taxAmount.toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-gray-500">
              No hay impuestos aplicados
            </div>
          )}

          {/* Total con impuestos */}
          {taxes.length > 0 && (
            <div className="flex justify-between items-center py-3 border-t border-gray-800">
              <span className="text-sm font-semibold text-gray-300">Total con impuestos:</span>
              <span className="text-lg font-bold text-green-400">
                ${totalWithTaxes.toFixed(2)}
              </span>
            </div>
          )}

          {/* Monto total de impuestos */}
          {taxes.length > 0 && (
            <div className="text-xs text-gray-500 text-center">
              Total de impuestos: ${totalTaxAmount.toFixed(2)}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
