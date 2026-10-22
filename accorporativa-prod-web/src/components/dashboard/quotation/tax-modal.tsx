"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { getAllTaxes } from "@/lib/actions/tax.actions"

interface TaxModalProps {
  isOpen: boolean
  onClose: () => void
  // onContinue now supports multiple taxes: (amount, title, type, taxId?, taxIds?, taxesData?)
  onContinue?: (
    amount: string,
    title: string,
    type: "amount" | "percentage",
    taxId?: string,
    taxIds?: string[],
    taxesData?: any[]
  ) => void
  currentTotal?: number
  // Props para impuesto específico por producto
  productId?: string
  productName?: string
  productSubtotal?: number
  existingTaxType?: "PERCENTAGE" | "FIXED"
  existingTaxValue?: number
  existingTaxTitle?: string
  existingTaxId?: string
  existingTaxIds?: string[]
}

export function TaxModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  currentTotal = 170.0,
  productId,
  productName,
  productSubtotal,
  existingTaxType,
  existingTaxValue,
  existingTaxTitle,
  existingTaxId,
  existingTaxIds
}: TaxModalProps) {
  const [taxType, setTaxType] = useState<"amount" | "percentage">("amount")
  const [taxAmount, setTaxAmount] = useState("")
  const [taxTitle, setTaxTitle] = useState("")
  const [titleError, setTitleError] = useState(false)
  const [taxes, setTaxes] = useState<any[]>([])
  const [loadingTaxes, setLoadingTaxes] = useState(false)
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([])

  const isProductTax = !!productId
  const baseAmount = isProductTax ? (productSubtotal || 0) : currentTotal

  // Cargar impuestos existentes o resetear campos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setTitleError(false)
      
      // Prioridad: usar tax_ids si existe, sino tax_id
      if (existingTaxIds && existingTaxIds.length > 0) {
        setSelectedTaxIds(existingTaxIds)
      } else if (existingTaxId) {
        setSelectedTaxIds([existingTaxId])
      } else {
        setSelectedTaxIds([])
      }

      // Resetear campos legacy
      setTaxAmount("")
      setTaxTitle("")
      setTaxType("amount")
    }
  }, [isOpen, existingTaxType, existingTaxValue, existingTaxTitle, existingTaxId, existingTaxIds])

  // Cargar lista de impuestos desde server action
  useEffect(() => {
    let mounted = true
    const loadTaxes = async () => {
      setLoadingTaxes(true)
      try {
        const data = await getAllTaxes()
        if (!mounted) return
        setTaxes(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error loading taxes:', err)
        if (mounted) setTaxes([])
      } finally {
        if (mounted) setLoadingTaxes(false)
      }
    }

    if (isOpen) loadTaxes()
    return () => { mounted = false }
  }, [isOpen])

  // Calcular el subtotal dinámicamente con los impuestos actuales (suma de múltiples)
  const calculateDynamicTotal = () => {
    let totalTaxAmount = 0

    // Sumar todos los impuestos seleccionados
    selectedTaxIds.forEach(taxId => {
      const t = taxes.find(tx => tx.id === taxId)
      if (t) {
        if (t.tax_type === 'percentage') {
          totalTaxAmount += (baseAmount * Number(t.rate || 0)) / 100
        } else {
          totalTaxAmount += Number(t.rate || 0)
        }
      }
    })

    return baseAmount + totalTaxAmount
  }

  // Función para alternar selección de impuesto
  const toggleTax = (taxId: string) => {
    setSelectedTaxIds(prev => 
      prev.includes(taxId) 
        ? prev.filter(id => id !== taxId)
        : [...prev, taxId]
    )
  }

  const dynamicTotal = calculateDynamicTotal()

  if (!isOpen) return null

  const handleContinue = () => {
    if (onContinue) {
      if (selectedTaxIds.length === 0) {
        // Sin impuestos seleccionados - eliminar
        onContinue('0', 'Sin impuesto', 'amount', undefined, [], [])
      } else {
        // Pasar múltiples impuestos
        const taxNames = selectedTaxIds
          .map(id => taxes.find(t => t.id === id)?.name)
          .filter(Boolean)
          .join(', ')
        
        onContinue(
          '', // amount - no usado con múltiples
          taxNames,
          'percentage', // type - no usado con múltiples
          selectedTaxIds.length === 1 ? selectedTaxIds[0] : undefined, // retrocompatibilidad
          selectedTaxIds, // array de IDs
          taxes // datos completos
        )
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-md rounded-xl border border-gray-800 bg-[#0A0F17] p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {isProductTax ? 'Impuesto por Producto' : 'Agregar Impuesto'}
            </h2>
            {isProductTax && productName && (
              <p className="text-sm text-gray-400 mt-1">{productName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tax Multi-Selector */}
        {taxes.length > 0 && (
          <div className="mb-4">
            <Label className="mb-2 block text-sm font-medium text-gray-300">
              Seleccionar impuestos (múltiples)
            </Label>
            <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-700 bg-[#070B14] p-3 space-y-2">
              {taxes.map(tax => {
                const isSelected = selectedTaxIds.includes(tax.id)
                return (
                  <label
                    key={tax.id}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                      isSelected ? 'bg-yellow-500/20 border border-yellow-500/50' : 'hover:bg-gray-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTax(tax.id)}
                      className="w-4 h-4 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-gray-900"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">{tax.name}</div>
                      <div className="text-xs text-gray-400">
                        {tax.tax_type === 'percentage' ? `${tax.rate}%` : `$${tax.rate}`}
                        {tax.description && ` - ${tax.description}`}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-yellow-500 text-xs font-medium">✓ Seleccionado</div>
                    )}
                  </label>
                )
              })}
            </div>
            {selectedTaxIds.length > 0 && (
              <div className="mt-2 text-xs text-gray-400">
                {selectedTaxIds.length} impuesto(s) seleccionado(s)
              </div>
            )}
          </div>
        )}

        {loadingTaxes && (
          <div className="mb-4 text-center text-sm text-gray-400">
            Cargando impuestos...
          </div>
        )}

        {/* Total */}
        <div className="mb-6 text-center space-y-2">
          <div>
            <p className="mb-1 text-sm text-gray-400">
              {isProductTax ? 'Subtotal original' : 'Total original'}
            </p>
            <p className={`text-lg font-medium ${selectedTaxIds.length > 0 ? 'text-gray-500 line-through' : 'text-yellow-400'}`}>
              ${baseAmount.toFixed(2)}
            </p>
          </div>
          {selectedTaxIds.length > 0 && (
            <div>
              <p className="mb-1 text-sm text-gray-400">
                {isProductTax ? 'Nuevo subtotal' : 'Nuevo total'} (con {selectedTaxIds.length} impuesto{selectedTaxIds.length > 1 ? 's' : ''})
              </p>
              <p className="text-2xl font-semibold text-green-400">
                ${Math.max(0, dynamicTotal).toFixed(2)} 
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleContinue} 
            className="flex-1 h-11 bg-yellow-500 text-gray-900 hover:bg-yellow-400 font-medium"
          >
            {selectedTaxIds.length === 0 ? 'Sin impuestos' : `Aplicar ${selectedTaxIds.length} impuesto${selectedTaxIds.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}