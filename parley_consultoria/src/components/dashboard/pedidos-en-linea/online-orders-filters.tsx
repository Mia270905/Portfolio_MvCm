"use client"

import { Filter, ChevronDown, ChevronUp, X, Grid3x3, List, Search, CalendarIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface OnlineOrdersFiltersProps {
  searchInput: string
  onSearchChange: (value: string) => void
  filters: {
    statuses: string[]
    startDate: string
    endDate: string
    amountMin: string
    amountMax: string
  }
  onFiltersChange: (filters: any) => void
  viewMode: "grid" | "list"
  onViewModeChange: (mode: "grid" | "list") => void
  hasActiveFilters: boolean
  onClearFilters: () => void
  isSearching?: boolean
  showFilters?: boolean
  onShowFiltersChange?: (show: boolean) => void
}

export function OnlineOrdersFilters({
  searchInput,
  onSearchChange,
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  hasActiveFilters,
  onClearFilters,
  isSearching = false,
  showFilters = false,
  onShowFiltersChange,
}: OnlineOrdersFiltersProps) {
  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.statuses || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]
    handleFilterChange("statuses", newStatuses)
  }

  const toggleFilters = () => {
    onShowFiltersChange?.(!showFilters)
  }

  const availableStatuses = ["Pendiente de pago", "Pagado", "Preparación", "En camino", "Entregado", "Cancelado"]

  const startDate = filters.startDate ? new Date(filters.startDate) : undefined
  const endDate = filters.endDate ? new Date(filters.endDate) : undefined

  return (
    <div className="space-y-4">
      {/* Controles de búsqueda y vista */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por número de orden o cliente..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "grid"
                ? "bg-blue-50 border-blue-500 text-blue-600"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            title="Vista de cuadrícula"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "list"
                ? "bg-blue-50 border-blue-500 text-blue-600"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            title="Vista de lista"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={toggleFilters}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                {
                  [
                    filters.statuses.length > 0,
                    filters.startDate || filters.endDate,
                    filters.amountMin,
                    filters.amountMax,
                  ].filter(Boolean).length
                }
              </span>
            )}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar todo
            </button>
          )}
        </div>

        {/* Badges de filtros activos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-3">
            {filters.statuses.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full"
              >
                Estado: {status}
                <button onClick={() => handleStatusToggle(status)} className="hover:bg-blue-100 rounded-full p-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {filters.startDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full">
                Desde: {new Date(filters.startDate).toLocaleDateString()}
                <button
                  onClick={() => handleFilterChange("startDate", "")}
                  className="hover:bg-purple-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full">
                Hasta: {new Date(filters.endDate).toLocaleDateString()}
                <button
                  onClick={() => handleFilterChange("endDate", "")}
                  className="hover:bg-purple-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.amountMin && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full">
                Monto mín: ${filters.amountMin}
                <button
                  onClick={() => handleFilterChange("amountMin", "")}
                  className="hover:bg-green-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.amountMax && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full">
                Monto máx: ${filters.amountMax}
                <button
                  onClick={() => handleFilterChange("amountMax", "")}
                  className="hover:bg-green-100 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 shadow-sm animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Estados</Label>
                <div className="space-y-2 bg-white p-3 rounded-lg border border-gray-200">
                  {availableStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.statuses.includes(status)}
                        onCheckedChange={() => handleStatusToggle(status)}
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Rango de Fechas</Label>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Fecha inicial</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 bg-white border-gray-300 hover:border-gray-400 transition-colors",
                            !startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date: Date | undefined) => {
                            if (date) {
                              // Establecer hora a 00:00
                              const dateWithTime = new Date(date)
                              dateWithTime.setHours(0, 0, 0, 0)
                              handleFilterChange("startDate", dateWithTime.toISOString().slice(0, 16))
                            } else {
                              handleFilterChange("startDate", "")
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Fecha final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-10 bg-white border-gray-300 hover:border-gray-400 transition-colors",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date: Date | undefined) => {
                            if (date) {
                              // Establecer hora a 23:59
                              const dateWithTime = new Date(date)
                              dateWithTime.setHours(23, 59, 59, 999)
                              handleFilterChange("endDate", dateWithTime.toISOString().slice(0, 16))
                            } else {
                              handleFilterChange("endDate", "")
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Filtro por Monto Mínimo */}
              <div className="space-y-2">
                <Label
                  htmlFor="amount-min-filter"
                  className="text-xs font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Monto mínimo
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="amount-min-filter"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={filters.amountMin}
                    onChange={(e) => handleFilterChange("amountMin", e.target.value)}
                    className="h-10 pl-7 bg-white border-gray-300 hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>

              {/* Filtro por Monto Máximo */}
              <div className="space-y-2">
                <Label
                  htmlFor="amount-max-filter"
                  className="text-xs font-semibold text-gray-700 uppercase tracking-wide"
                >
                  Monto máximo
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="amount-max-filter"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={filters.amountMax}
                    onChange={(e) => handleFilterChange("amountMax", e.target.value)}
                    className="h-10 pl-7 bg-white border-gray-300 hover:border-gray-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de búsqueda */}
      {isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Aplicando filtros...</span>
          </div>
        </div>
      )}
    </div>
  )
}