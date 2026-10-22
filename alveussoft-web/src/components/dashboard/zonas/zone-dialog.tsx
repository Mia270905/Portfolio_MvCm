"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { Zone } from "@/lib/actions/zone.actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ZoneDialogProps {
  zone: Zone | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (zone: Partial<Zone>) => void
  isLoading?: boolean
}

export function ZoneDialog({ zone, open, onOpenChange, onSave, isLoading }: ZoneDialogProps) {
  const [formData, setFormData] = useState<Partial<Zone>>({
    name: "",
    shipping_price: 0,
  })

  useEffect(() => {
    if (zone) {
      setFormData(zone)
    } else {
      setFormData({
        name: "",
        shipping_price: 0,
      })
    }
  }, [zone, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xs rounded-lg mx-4">
        <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-lg sm:text-xl">
              {zone ? "Editar Zona" : "Crear Nueva Zona"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm sm:text-base">
              {zone ? "Modifica los detalles de la zona de envío" : "Completa la información para crear una nueva zona"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 text-sm sm:text-base">
              Nombre de la Zona *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Zona Norte"
              required
              disabled={isLoading}
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping_price" className="text-gray-700 text-sm sm:text-base">
              Precio de Envío *
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="shipping_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.shipping_price}
                onChange={(e) => setFormData({ ...formData, shipping_price: Number.parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
                disabled={isLoading}
                className="border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base pl-8"
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-500">Ingresa el costo de envío para esta zona</p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#4F46E5] hover:bg-[#6366F1] text-white w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading ? "Guardando..." : zone ? "Guardar Cambios" : "Crear Zona"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
