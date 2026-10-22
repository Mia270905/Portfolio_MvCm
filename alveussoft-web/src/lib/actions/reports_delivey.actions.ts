"use server"

import { createClient } from "@/lib/supabase/server"

export interface DeliveryDriver {
  id: string
  full_name: string
  email: string
}

export interface DeliveryOrder {
  id: string
  order_number: number
  status: string
  created_at: string
  total: number
  driver_id: string | null
  driver_name: string | null
  delivery_time: number | null
  delivered_at: string | null
}

export interface DeliveryMetrics {
  total: number
  completed: number
  inProgress: number
  cancelled: number
  totalRevenue: number
  avgDeliveryTime: number
  successRate: number
}

export interface ChartDataByDriver {
  name: string
  entregas: number
  ingresos: number
}

export interface ChartDataByStatus {
  name: string
  value: number
}

export interface ChartDataByDate {
  date: string
  entregas: number
}

/**
 * Obtiene todos los repartidores activos
 */
export async function getDeliveryDrivers(): Promise<DeliveryDriver[]> {
  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("code", "delivery_driver")
    .single()

  if (profileError || !profile) {
    return []
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("active", true)
    .eq("profile_id", profile.id)

  if (error) {
    console.error("[v0] Error fetching delivery drivers:", error)
    return []
  }

  return data as DeliveryDriver[]
}

/**
 * Obtiene las órdenes de entrega con filtros
 */
export async function getDeliveryOrders(dateFrom?: Date, dateTo?: Date, driverId?: string): Promise<DeliveryOrder[]> {
  const supabase = await createClient()


  let query = supabase
    .from("sale_orders")
    .select(`
      id,
      order_number,
      status,
      created_at,
      shipping_cost,
      assigned_delivery_driver,
      delivery_time,
      driver:assigned_delivery_driver(full_name)
    `)
    .not("assigned_delivery_driver", "is", null)

  // Filtrar por rango de fechas
  if (dateFrom) {
    const startOfDay = new Date(dateFrom)
    startOfDay.setHours(0, 0, 0, 0)
    query = query.gte("created_at", startOfDay.toISOString())
  }
  if (dateTo) {
    const endOfDay = new Date(dateTo)
    endOfDay.setHours(23, 59, 59, 999)
    query = query.lte("created_at", endOfDay.toISOString())
  }

  // Filtrar por repartidor específico
  if (driverId && driverId !== "all") {
    query = query.eq("assigned_delivery_driver", driverId)
  }

  query = query.order("created_at", { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("[v0] Error fetching delivery orders:", error)
    return []
  }


  const ordersWithTotal = await Promise.all(
    (data || []).map(async (order: any) => {
      const { data: details, error: detailsError } = await supabase
        .from("sale_order_details")
        .select("quantity, product_price")
        .eq("sale_order_id", order.id)

      if (detailsError) {
        console.error("[v0] Error fetching order details:", detailsError)
        return {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          created_at: order.created_at,
          total: Number.parseFloat(order.shipping_cost || 0),
          driver_id: order.assigned_delivery_driver,
          driver_name: order.driver?.full_name || "Sin asignar",
          delivery_time: order.delivery_time,
          delivered_at: order.status === "Entregado" ? order.created_at : null,
        }
      }

      const subtotal = (details || []).reduce((sum: number, item: any) => {
        return sum + Number.parseFloat(item.quantity) * Number.parseFloat(item.product_price)
      }, 0)

      const total = subtotal + Number.parseFloat(order.shipping_cost || 0)

      return {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        total,
        driver_id: order.assigned_delivery_driver,
        driver_name: order.driver?.full_name || "Sin asignar",
        delivery_time: order.delivery_time,
        delivered_at: order.status === "Entregado" ? order.created_at : null,
      }
    }),
  )

  return ordersWithTotal
}

/**
 * Calcula las métricas de entregas
 */
export async function getDeliveryMetrics(dateFrom?: Date, dateTo?: Date, driverId?: string): Promise<DeliveryMetrics> {
  const orders = await getDeliveryOrders(dateFrom, dateTo, driverId)

  const completed = orders.filter((o) => o.status === "Entregado")
  const inProgress = orders.filter((o) => o.status === "En camino")
  const cancelled = orders.filter((o) => o.status === "Cancelado")

  const totalRevenue = completed.reduce((sum, order) => sum + order.total, 0)

  const deliveryTimes = completed.filter((o) => o.delivery_time !== null).map((o) => o.delivery_time!)

  const avgDeliveryTime =
    deliveryTimes.length > 0 ? Math.round(deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length) : 0

  const successRate = orders.length > 0 ? Math.round((completed.length / orders.length) * 100) : 0

  return {
    total: orders.length,
    completed: completed.length,
    inProgress: inProgress.length,
    cancelled: cancelled.length,
    totalRevenue,
    avgDeliveryTime,
    successRate,
  }
}

/**
 * Obtiene datos para gráfico por repartidor
 */
export async function getChartDataByDriver(
  dateFrom?: Date,
  dateTo?: Date,
  driverId?: string,
): Promise<ChartDataByDriver[]> {
  const orders = await getDeliveryOrders(dateFrom, dateTo, driverId)
  const completedOrders = orders.filter((o) => o.status === "Entregado")

  const driverStats = completedOrders.reduce(
    (acc, order) => {
      const driverName = order.driver_name || "Sin asignar"
      if (!acc[driverName]) {
        acc[driverName] = { entregas: 0, ingresos: 0 }
      }
      acc[driverName].entregas++
      acc[driverName].ingresos += order.total
      return acc
    },
    {} as Record<string, { entregas: number; ingresos: number }>,
  )

  return Object.entries(driverStats)
    .map(([name, stats]) => ({
      name,
      entregas: stats.entregas,
      ingresos: Math.round(stats.ingresos),
    }))
    .sort((a, b) => b.entregas - a.entregas)
}

/**
 * Obtiene datos para gráfico por estado
 */
export async function getChartDataByStatus(
  dateFrom?: Date,
  dateTo?: Date,
  driverId?: string,
): Promise<ChartDataByStatus[]> {
  const orders = await getDeliveryOrders(dateFrom, dateTo, driverId)

  const statusCounts = orders.reduce(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }))
}

/**
 * Obtiene datos para gráfico por fecha
 */
export async function getChartDataByDate(
  dateFrom?: Date,
  dateTo?: Date,
  driverId?: string,
): Promise<ChartDataByDate[]> {
  const orders = await getDeliveryOrders(dateFrom, dateTo, driverId)

  const dateGroups = orders.reduce(
    (acc, order) => {
      const date = new Date(order.created_at)
      const dateKey = `${date.getDate()} ${date.toLocaleString("es", { month: "short" })}`
      acc[dateKey] = (acc[dateKey] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return Object.entries(dateGroups)
    .map(([date, entregas]) => ({ date, entregas }))
    .slice(0, 7) // Últimos 7 días
}
