"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Package,
  Calendar,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronLeft,
  MessageCircle,
  Timer,
  Printer,
  Download,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import Confetti from "react-confetti"
import { useWindowSize } from "@/hooks/use-window-size"

interface TicketItem {
  id: string
  product_id: string
  product_name: string
  product_code?: string
  product_image?: string
  product_description?: string
  quantity: number
  product_price: number
}

interface TicketAddress {
  postal_code: string
  neighborhood: string
  street: string
  exterior_number: string
  interior_number?: string | null
  phone_number: string
}

interface Ticket {
  id: string
  order_number: string
  status: string
  created_at: string
  order_type: string
  user_id: string
  user_name?: string
  user_phone?: string
  user_address?: string
  subtotal: number
  shipping_cost: number
  total: number
  details: TicketItem[]
  special_instructions?: string
  delivery_instructions?: string
  delivery_time?: number | null
  assigned_delivery_time_at?: string | null
  address?: TicketAddress
  assigned_driver?: {
    full_name: string
  }
}

interface TicketDetailClientProps {
  ticket: Ticket
  onContactSupport?: () => void
  showConfetti?: boolean
}

export function TicketDetailClient({
  ticket,
  onContactSupport,
  showConfetti: initialShowConfetti = false,
}: TicketDetailClientProps) {
  const [showConfetti, setShowConfetti] = useState(initialShowConfetti)
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const { width, height } = useWindowSize()

  const calculateRemainingTime = (): number | null => {
    if (!ticket.delivery_time || !ticket.assigned_delivery_time_at) {
      return null
    }

    const assignedTime = new Date(ticket.assigned_delivery_time_at).getTime()
    const currentTime = new Date().getTime()
    const elapsedMinutes = Math.floor((currentTime - assignedTime) / (1000 * 60))
    const remaining = ticket.delivery_time - elapsedMinutes

    return Math.max(0, remaining)
  }

  useEffect(() => {
    const updateTime = () => {
      setRemainingTime(calculateRemainingTime())
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [ticket.delivery_time, ticket.assigned_delivery_time_at])

  useEffect(() => {
    if (initialShowConfetti) {
      setShowConfetti(true)
      const confettiTimer = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(confettiTimer)
    }
  }, [initialShowConfetti])

  const formatRemainingTime = (minutes: number): string => {
    if (minutes === 0) {
      return "Llegando pronto"
    }

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins} min`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Entregado":
        return "bg-emerald-100 text-emerald-800 border-emerald-200"
      case "En camino":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Preparación":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "Pagado":
        return "bg-violet-100 text-violet-800 border-violet-200"
      case "Pendiente":
        return "bg-slate-100 text-slate-800 border-slate-200"
      case "Cancelado":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-slate-100 text-slate-800 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Entregado":
        return <CheckCircle2 className="w-5 h-5" />
      case "En camino":
        return <Truck className="w-5 h-5" />
      case "Preparación":
        return <Package className="w-5 h-5" />
      case "Pagado":
        return <CheckCircle2 className="w-5 h-5" />
      case "Pendiente":
        return <Clock className="w-5 h-5" />
      case "Cancelado":
        return <XCircle className="w-5 h-5" />
      default:
        return <Package className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTicketTimeline = (status: string) => {
    const statuses = ["Pendiente", "Pagado", "Preparación", "En camino", "Entregado"]
    const currentIndex = statuses.indexOf(status)

    return statuses.map((s, index) => ({
      status: s,
      completed: index <= currentIndex && status !== "Cancelado",
      active: s === status,
    }))
  }

  const timeline = getTicketTimeline(ticket.status)

  const shouldShowDeliveryTime =
    ticket.status !== "Cancelado" &&
    ticket.status !== "Entregado" &&
    ticket.status !== "Pendiente" &&
    remainingTime !== null

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.3} />}

      <div className="min-h-screen bg-slate-50 py-8 px-4">
        <div className="max-w-6xl mx-auto w-full">
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Volver a mis tickets</span>
          </Link>

          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Ticket #{ticket.order_number}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{ticket.order_type}</span>
                  </div>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`${getStatusColor(ticket.status)} text-base px-4 py-2 flex-shrink-0 w-fit`}
              >
                <span className="mr-2">{getStatusIcon(ticket.status)}</span>
                {ticket.status}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {ticket.status !== "Cancelado" && (
                <Card className="bg-white border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-6">Estado del ticket</h2>

                  {/* Versión móvil - Vertical */}
                  <div className="md:hidden">
                    {timeline.map((item, index) => {
                      const isLastStep = index === timeline.length - 1

                      return (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                                item.completed
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "bg-white border-slate-300 text-slate-400"
                              }`}
                            >
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-slate-300" />
                              )}
                            </div>
                            {!isLastStep && (
                              <div
                                className={`w-0.5 h-12 my-1 transition-colors ${
                                  timeline[index + 1].completed ? "bg-emerald-600" : "bg-slate-200"
                                }`}
                              />
                            )}
                          </div>

                          <div className="flex-1 pt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-sm font-medium ${
                                  item.completed ? "text-slate-900" : "text-slate-500"
                                }`}
                              >
                                {item.status}
                              </span>
                              {item.active && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  Actual
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Versión desktop - Horizontal */}
                  <div className="hidden md:block relative overflow-hidden">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200" />
                    <div
                      className="absolute top-5 left-0 h-0.5 bg-emerald-600 transition-all duration-500"
                      style={{
                        width: `${(timeline.filter((t) => t.completed).length / timeline.length) * 100}%`,
                      }}
                    />
                    <div className="relative flex justify-between gap-2">
                      {timeline.map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                              item.completed
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white border-slate-300 text-slate-400"
                            }`}
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-slate-300" />
                            )}
                          </div>
                          <span
                            className={`mt-3 text-sm font-medium text-center ${
                              item.completed ? "text-slate-900" : "text-slate-500"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              <Card className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Productos ({ticket.details.length})</h2>
                <div className="space-y-4">
                  {ticket.details.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                      <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
                          src={
                            item.product_image ||
                            `/placeholder.svg?height=96&width=96&query=${
                              encodeURIComponent(item.product_name) || "/placeholder.svg"
                            }`
                          }
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1">{item.product_name}</h3>
                        {item.product_code && (
                          <p className="text-xs text-slate-500 mb-1">Código: {item.product_code}</p>
                        )}
                        <p className="text-sm text-slate-600 mb-2">Cantidad: {item.quantity}</p>
                        <p className="text-sm text-slate-600">${item.product_price.toFixed(2)} c/u</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-slate-900">
                          ${(item.product_price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Detalles de entrega</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                    <div className="text-slate-700">
                      <p className="font-medium">Dirección de envío</p>
                      {ticket.address ? (
                        <p className="text-sm mt-1">
                          {ticket.address.street} #{ticket.address.exterior_number}
                          {ticket.address.interior_number ? `, Int. ${ticket.address.interior_number}` : ""}
                          <br />
                          {ticket.address.neighborhood}
                          <br />
                          CP: {ticket.address.postal_code}
                          <br />
                          Tel: {ticket.address.phone_number}
                        </p>
                      ) : ticket.user_address ? (
                        <p className="text-sm mt-1">{ticket.user_address}</p>
                      ) : (
                        <p className="text-sm mt-1 text-slate-500 italic">No se especificó dirección de envío.</p>
                      )}
                    </div>
                  </div>

                  {ticket.special_instructions && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div className="text-slate-700">
                          <p className="font-medium">Instrucciones especiales</p>
                          <p className="text-sm mt-1">{ticket.special_instructions}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {ticket.delivery_instructions && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-start gap-3">
                        <Truck className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                        <div className="text-slate-700">
                          <p className="font-medium">Instrucciones para el repartidor</p>
                          <p className="text-sm mt-1">{ticket.delivery_instructions}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="space-y-6">
              {shouldShowDeliveryTime && remainingTime !== null && (
                <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-200 p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                      <Timer className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-600">Tiempo estimado</h3>
                      <p className="text-2xl font-bold text-emerald-600">{formatRemainingTime(remainingTime)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700">
                    {ticket.status === "En camino" ? "Tu pedido está en camino" : "Tu pedido está siendo preparado"}
                  </p>
                  {remainingTime > 0 && (
                    <div className="mt-4 bg-white/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full transition-all duration-1000 ease-linear"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, ((ticket.delivery_time! - remainingTime) / ticket.delivery_time!) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </Card>
              )}

              <Card className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumen del ticket</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="text-slate-900 font-medium">${ticket.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Envío</span>
                    <span className="text-slate-900 font-medium">${ticket.shipping_cost.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-slate-900">${ticket.total.toFixed(2)}</span>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Acciones</h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full bg-transparent" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir ticket
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => {
                      // Aquí iría la lógica para descargar el PDF
                      console.log("Descargar PDF")
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
              </Card>

              {onContactSupport && (
                <Card className="bg-blue-50 border border-blue-200 p-5">
                  <h3 className="font-semibold text-blue-900 mb-2">¿Necesitas ayuda?</h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Nuestro equipo está disponible para ayudarte con cualquier pregunta sobre tu ticket.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors bg-transparent"
                    onClick={onContactSupport}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contactar soporte
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
