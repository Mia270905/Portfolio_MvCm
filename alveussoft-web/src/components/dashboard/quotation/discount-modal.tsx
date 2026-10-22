"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

interface DiscountModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue?: (amount: string, title: string, type: "amount" | "percentage") => void
  currentTotal?: number
  // Props para descuento específico por producto
  productId?: string
  productName?: string
  productSubtotal?: number
  existingDiscountType?: "PERCENTAGE" | "FIXED"
  existingDiscountValue?: number
}

export function DiscountModal({ 
  isOpen, 
  onClose, 
  onContinue, 
  currentTotal = 170.0,
  productId,
  productName,
  productSubtotal,
  existingDiscountType,
  existingDiscountValue
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<"amount" | "percentage">("amount")
  const [discountAmount, setDiscountAmount] = useState("")
  const [discountTitle, setDiscountTitle] = useState("")

  const isProductDiscount = !!productId
  const baseAmount = isProductDiscount ? (productSubtotal || 0) : currentTotal

  // Cargar descuento existente o resetear campos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (existingDiscountType && existingDiscountValue !== undefined) {
        // Cargar descuento existente
        setDiscountType(existingDiscountType === "PERCENTAGE" ? "percentage" : "amount")
        setDiscountAmount(existingDiscountValue.toString())
        setDiscountTitle("")
      } else {
        // Resetear campos para nuevo descuento
        setDiscountAmount("")
        setDiscountTitle("")
        setDiscountType("amount")
      }
    }
  }, [isOpen, existingDiscountType, existingDiscountValue])

  // Calcular el subtotal dinámicamente con el descuento actual
  const calculateDynamicTotal = () => {
    const amount = Number.parseFloat(discountAmount) || 0
    if (amount === 0) return baseAmount

    if (discountType === "percentage") {
      const discount = (baseAmount * amount) / 100
      return baseAmount - discount
    } else {
      return baseAmount - amount
    }
  }

  const dynamicTotal = calculateDynamicTotal()

  if (!isOpen) return null

  const handleContinue = () => {
    if (onContinue) {
      onContinue(discountAmount, discountTitle, discountType)
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
              {isProductDiscount ? 'Descuento por Producto' : 'Agregar Descuento'}
            </h2>
            {isProductDiscount && productName && (
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

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-lg bg-gray-900/50 p-1">
          <button
            onClick={() => setDiscountType("amount")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              discountType === "amount" 
                ? "bg-yellow-500 text-gray-900 shadow-sm" 
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Cantidad ($)
          </button>
          <button
            onClick={() => setDiscountType("percentage")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              discountType === "percentage" 
                ? "bg-yellow-500 text-gray-900 shadow-sm" 
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            Porcentaje (%)
          </button>
        </div>

        {/* Discount Amount Field */}
        <div className="mb-4">
          <Label htmlFor="discount-amount" className="mb-2 block text-sm font-medium text-gray-300">
            Cantidad del descuento
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {discountType === "amount" ? "$" : "%"}
            </span>
            <Input
              id="discount-amount"
              type="text"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              placeholder="0,00"
              className="h-12 pl-8 border-gray-700 bg-[#070B14] text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* Discount Title Field */}
        <div className="mb-8">
          <Label htmlFor="discount-title" className="mb-2 block text-sm font-medium text-gray-300">
            Título del descuento (opcional)
          </Label>
          <Input
            id="discount-title"
            type="text"
            value={discountTitle}
            onChange={(e) => setDiscountTitle(e.target.value)}
            placeholder="Ej: Promo20"
            className="h-12 border-gray-700 bg-[#070B14] text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {/* Total */}
        <div className="mb-6 text-center space-y-2">
          <div>
            <p className="mb-1 text-sm text-gray-400">
              {isProductDiscount ? 'Subtotal original' : 'Total original'}
            </p>
            <p className={`text-lg font-medium ${discountAmount && Number.parseFloat(discountAmount) > 0 ? 'text-gray-500 line-through' : 'text-yellow-400'}`}>
              ${baseAmount.toFixed(2)}
            </p>
          </div>
          {discountAmount && Number.parseFloat(discountAmount) > 0 && (
            <div>
              <p className="mb-1 text-sm text-gray-400">
                {isProductDiscount ? 'Nuevo subtotal' : 'Nuevo total'}
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
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}