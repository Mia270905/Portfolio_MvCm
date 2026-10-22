"use client"

import type React from "react"

import { useState } from "react"
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
import { Loader2, Share2 } from "lucide-react"
import { toast } from "sonner"

interface ShareWhatsAppModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: {
    order_number: string
    user_name: string
    billing_info?: {
      id_facrutama?: string
      rfc?: string
      name?: string
    }
  }
}

export function ShareWhatsAppModal({ open, onOpenChange, order }: ShareWhatsAppModalProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const limited = numbers.slice(0, 10)

    if (limited.length <= 3) {
      return limited
    } else if (limited.length <= 6) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneNumber.trim()) {
      toast.error("Por favor ingresa un número de WhatsApp")
      return
    }

    const cleanNumbers = phoneNumber.replace(/\D/g, "")
    if (cleanNumbers.length !== 10) {
      toast.error("El número debe tener 10 dígitos")
      return
    }

    setIsLoading(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const downloadUrl = `${baseUrl}/descargar-factura/${order.billing_info?.id_facrutama}`

      const message =
        `¡Hola! \n\nTu factura de la orden #${order.order_number} está lista.\n\n` +
        `Detalles:\n` +
        `- Cliente: ${order.user_name}\n` +
        `- RFC: ${order.billing_info?.rfc || "N/A"}\n` +
        `- Razón Social: ${order.billing_info?.name || "N/A"}\n\n` +
        `Descarga tu factura aquí:\n${downloadUrl}\n\n` +
        `Gracias por tu preferencia.`

      const fullPhone = `52${cleanNumbers}`
      const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")

      toast.success("Se abrió WhatsApp con el mensaje preparado")

      onOpenChange(false)
      setPhoneNumber("")
    } catch (error) {
      console.error("Error al compartir por WhatsApp:", error)
      toast.error("No se pudo compartir por WhatsApp")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) setPhoneNumber("")
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-600" />
            Compartir Factura por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Ingresa el número de WhatsApp para compartir la factura de la orden #{order.order_number}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                Número de WhatsApp
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md border border-input">
                  <span className="text-sm font-medium text-muted-foreground">+52</span>
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="555-123-4567"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="flex-1 font-mono"
                  disabled={isLoading}
                  maxLength={12}
                />
              </div>
              <p className="text-xs text-muted-foreground">Ingresa 10 dígitos del número</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
