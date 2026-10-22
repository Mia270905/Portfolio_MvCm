"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Timer } from "lucide-react"
import type { DeliveryOrder } from "@/lib/actions/delivery.actions"

interface DeliveryTimerProps {
  order: DeliveryOrder
}

export default function DeliveryTimer({ order }: DeliveryTimerProps) {
  const [remainingTime, setRemainingTime] = useState<number | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  const calculateRemainingTime = (): number | null => {
    if (!order.delivery_time || !order.assigned_delivery_time_at) {
      return null
    }

    const assignedTime = new Date(order.assigned_delivery_time_at).getTime()
    const currentTime = new Date().getTime()
    const elapsedMinutes = Math.floor((currentTime - assignedTime) / (1000 * 60))
    const remaining = order.delivery_time - elapsedMinutes

    return Math.max(0, remaining)
  }

  const formatRemainingTime = (minutes: number): string => {
    if (minutes === 0) {
      return "Entrega tardía"
    }

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}h ${mins}min`
    }
    return `${mins} min`
  }

  useEffect(() => {
    setIsHydrated(true)
    const updateTime = () => {
      setRemainingTime(calculateRemainingTime())
    }

    updateTime()
    const interval = setInterval(updateTime, 60000)

    return () => clearInterval(interval)
  }, [order.delivery_time, order.assigned_delivery_time_at])

  if (!isHydrated || remainingTime === null) {
    return null
  }

  const shouldShowDeliveryTime = order.status === "En camino" && remainingTime !== null

  if (!shouldShowDeliveryTime) {
    return null
  }

  return (
    <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Timer className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-600">Tiempo restante estimado de entrega</h3>
          <p className="text-xl font-bold text-red-600">{formatRemainingTime(remainingTime)}</p>
        </div>
      </div>
      {remainingTime > 0 && (
        <div className="bg-white/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-red-600 h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${Math.max(0, Math.min(100, ((order.delivery_time! - remainingTime) / order.delivery_time!) * 100))}%`,
            }}
          />
        </div>
      )}
    </Card>
  )
}
