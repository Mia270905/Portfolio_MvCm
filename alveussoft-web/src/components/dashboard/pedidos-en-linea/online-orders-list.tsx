"use client"

import { useState, useEffect } from "react"
import { type OnlineOrder, getOnlineOrders } from "@/lib/actions/sale_order.actions"
import { OnlineOrderCard } from "./online-order-card"
import { OnlineOrdersPagination } from "./online-orders-pagination"
import { OnlineOrdersFilters } from "./online-orders-filters"
import { Card } from "@/components/ui/card"
import { Package, RefreshCw } from "lucide-react"
import { useRealtimeOnlineOrders } from "@/hooks/useRealtimeOnlineOrders"

interface OnlineOrdersListProps {
  userPermissions?: string[]
  initialOrders?: OnlineOrder[]
}

interface Filters {
  statuses: string[]
  startDate: string
  endDate: string
  amountMin: string
  amountMax: string
}

const getTodayDateRange = () => {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  return {
    startDate: formatDateTime(startOfDay),
    endDate: formatDateTime(endOfDay),
  }
}

export function OnlineOrdersList({ userPermissions = [], initialOrders = [] }: OnlineOrdersListProps) {
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [orders, setOrders] = useState<OnlineOrder[]>(initialOrders)
  const [filteredOrders, setFilteredOrders] = useState<OnlineOrder[]>(initialOrders)
  const [loading, setLoading] = useState(!initialOrders.length)
  const [initialLoading, setInitialLoading] = useState(!initialOrders.length)
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)

  // Hook para pedidos en tiempo real
  const { newOrders, clearNewOrders } = useRealtimeOnlineOrders()

  const [filters, setFilters] = useState<Filters>(() => {
    const todayRange = getTodayDateRange()
    return {
      statuses: ["Pagado", "Preparación", "En camino"],
      startDate: todayRange.startDate,
      endDate: todayRange.endDate,
      amountMin: "",
      amountMax: "",
    }
  })

  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 9,
    total: initialOrders.length,
    totalPages: Math.ceil(initialOrders.length / 9),
  })

  const canReadOrders = userPermissions?.includes("read:online_orders") ?? false

  // Efecto para cargar datos iniciales
  useEffect(() => {
    const loadOrders = async () => {
      if (!canReadOrders || initialOrders.length > 0) {
        setInitialLoading(false)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const ordersData = await getOnlineOrders()
        setOrders(ordersData)
        setFilteredOrders(ordersData)

        setPagination((prev) => ({
          ...prev,
          total: ordersData.length,
          totalPages: Math.ceil(ordersData.length / prev.pageSize),
        }))
      } catch (error) {
        console.error("Error al cargar pedidos:", error)
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    }

    loadOrders()
  }, [canReadOrders, initialOrders.length])

  useEffect(() => {
    if (newOrders.length > 0) {
      setOrders((prevOrders) => {
        // Filtrar duplicados
        const existingIds = new Set(prevOrders.map((order) => order.id))
        const uniqueNewOrders = newOrders.filter((order) => !existingIds.has(order.id))

        if (uniqueNewOrders.length === 0) return prevOrders

        const updatedOrders = [...prevOrders, ...uniqueNewOrders]
        return updatedOrders
      })

      clearNewOrders()
    }
  }, [newOrders, clearNewOrders])

  useEffect(() => {
    if (!orders.length) return

    setIsSearching(true)

    const timer = setTimeout(() => {
      let filtered = [...orders]

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        filtered = filtered.filter((order) => {
          try {
            const orderNumber = String(order.order_number || "").toLowerCase()
            const userName = String(order.user_name || "").toLowerCase()
            const userId = String(order.user_id || "").toLowerCase()

            return orderNumber.includes(query) || userName.includes(query) || userId.includes(query)
          } catch (error) {
            console.error("Error en búsqueda para orden:", order?.id, error)
            return false
          }
        })
      }

      if (filters.statuses.length > 0) {
        filtered = filtered.filter((order) => filters.statuses.includes(order.status))
      }

      // Amount filters
      const minAmount = Number.parseFloat(filters.amountMin)
      if (!isNaN(minAmount)) {
        filtered = filtered.filter((order) => order.total_amount >= minAmount)
      }

      const maxAmount = Number.parseFloat(filters.amountMax)
      if (!isNaN(maxAmount)) {
        filtered = filtered.filter((order) => order.total_amount <= maxAmount)
      }

      if (filters.startDate || filters.endDate) {
        filtered = filtered.filter((order) => {
          const orderDate = new Date(order.created_at)

          if (filters.startDate) {
            const startDate = new Date(filters.startDate)
            if (orderDate < startDate) return false
          }

          if (filters.endDate) {
            const endDate = new Date(filters.endDate)
            if (orderDate > endDate) return false
          }

          return true
        })
      }

      setFilteredOrders(filtered)

      const pageSize = viewMode === "grid" ? 9 : 6
      setPagination((prev) => ({
        ...prev,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
        page: prev.page > Math.ceil(filtered.length / pageSize) ? 1 : prev.page,
      }))

      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [orders, searchQuery, filters, viewMode])

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 500)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Cambiar pageSize cuando cambia el viewMode
  useEffect(() => {
    const newPageSize = viewMode === "grid" ? 9 : 6
    setPagination((prev) => ({
      ...prev,
      page: 1,
      pageSize: newPageSize,
      totalPages: Math.ceil(filteredOrders.length / newPageSize),
    }))
  }, [viewMode, filteredOrders.length])

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleClearFilters = () => {
    const todayRange = getTodayDateRange()
    setFilters({
      statuses: ["Pagado", "Preparación", "En camino"],
      startDate: todayRange.startDate,
      endDate: todayRange.endDate,
      amountMin: "",
      amountMax: "",
    })
    setSearchInput("")
    setSearchQuery("")
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }

  const handleRefreshOrders = async () => {
    try {
      setLoading(true)
      const ordersData = await getOnlineOrders()
      setOrders(ordersData)
      setFilteredOrders(ordersData)

      setPagination((prev) => ({
        ...prev,
        total: ordersData.length,
        totalPages: Math.ceil(ordersData.length / prev.pageSize),
        page: 1,
      }))
    } catch (error) {
      console.error("Error al recargar pedidos:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentPageOrders = () => {
    const startIndex = (pagination.page - 1) * pagination.pageSize
    const endIndex = startIndex + pagination.pageSize
    return filteredOrders.slice(startIndex, endIndex)
  }

  const todayRange = getTodayDateRange()
  const hasActiveFilters = Boolean(
    filters.statuses.length > 0 ||
      filters.startDate ||
      filters.endDate ||
      filters.amountMin ||
      filters.amountMax ||
      searchQuery,
  )

  // Mostrar loading mientras se verifica permisos y carga datos
  if (initialLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span>Cargando pedidos...</span>
        </div>
      </div>
    )
  }

  if (!canReadOrders) {
    return (
      <div className="text-center py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center text-red-600">
          No tienes permisos para ver los pedidos en línea.
        </div>
      </div>
    )
  }

  // Renderizar lista de pedidos
  const renderOrderList = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div
            className={
              viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"
            }
          >
            {[...Array(pagination.pageSize)].map((_, idx) => (
              <div
                key={idx}
                className={`animate-pulse bg-white rounded-lg border border-gray-200 p-6 ${
                  viewMode === "list" ? "flex gap-4 items-center" : "space-y-4"
                }`}
              >
                {viewMode === "list" ? (
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-gray-300 rounded w-32"></div>
                      <div className="h-4 bg-gray-300 rounded w-48"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-6 bg-gray-300 rounded w-20"></div>
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-16"></div>
                        <div className="h-6 bg-gray-300 rounded w-24"></div>
                      </div>
                      <div className="h-6 bg-gray-300 rounded w-20"></div>
                    </div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-300 rounded w-32"></div>
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    const currentOrders = getCurrentPageOrders()

    if (currentOrders.length === 0 && (searchQuery || hasActiveFilters)) {
      return (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No se encontraron pedidos con los filtros aplicados</p>
          {(searchQuery || hasActiveFilters) && (
            <button onClick={handleClearFilters} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Limpiar filtros
            </button>
          )}
        </Card>
      )
    }

    if (currentOrders.length === 0 && !searchQuery && !hasActiveFilters && !loading) {
      return (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay pedidos en línea</p>
        </Card>
      )
    }

    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-muted-foreground">
            Mostrando {currentOrders.length} de {filteredOrders.length} pedidos
            {newOrders.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">• {newOrders.length} nuevo(s) disponible(s)</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Limpiar filtros
              </button>
            )}
            <button
              onClick={handleRefreshOrders}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 font-medium p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actualizar lista"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {currentOrders.map((order) => (
              <OnlineOrderCard key={order.id} order={order} viewMode={viewMode} userPermissions={userPermissions} />
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {currentOrders.map((order) => (
              <OnlineOrderCard key={order.id} order={order} viewMode={viewMode} userPermissions={userPermissions} />
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Indicador de nuevos pedidos en tiempo real */}
      {newOrders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div>
              <p className="text-blue-800 font-medium">{newOrders.length} nuevo(s) pedido(s) disponible(s)</p>
              <p className="text-blue-600 text-sm">Los pedidos se agregarán automáticamente a la lista</p>
            </div>
          </div>
          <button
            onClick={() => {
              // Forzar la actualización inmediata
              setOrders((prev) => [...newOrders, ...prev])
              clearNewOrders()
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Actualizar ahora
          </button>
        </div>
      )}

      {/* Filtros y búsqueda */}
      <OnlineOrdersFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        filters={filters}
        onFiltersChange={handleFilterChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={handleClearFilters}
        isSearching={isSearching}
        showFilters={showFilters}
        onShowFiltersChange={setShowFilters}
      />

      {/* Lista de pedidos */}
      {renderOrderList()}

      {/* Paginación */}
      {!loading && pagination.totalPages > 1 && (
        <OnlineOrdersPagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
