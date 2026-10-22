"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Trash2, Search, MoreVertical, Barcode, DollarSign, ChevronDown } from "lucide-react"
import { 
  searchProductsByName, 
  getProductPriceInPriceList
} from "@/lib/actions/product.actions"
import { getActivePriceLists } from "@/lib/actions/price_list.actions"
import type { ProductSearch } from "@/lib/actions/product.actions"
import { toast } from "sonner"

interface ProductItem {
  id: string
  product: ProductSearch
  quantity: number
  unitPrice: number
  discount: number
  notes: string
}

interface SimplePriceList {
  id: string;
  code: string;
  name: string;
}

interface QuotationFormProps {
  handleSubmit: (e: React.FormEvent) => void
  formData: {
    quotationNumber: string
    date: string
    clientName: string
    clientEmail: string
    clientPhone: string
    notes: string
    validityDays: number
    currency: string
    taxRate: number
    discount: number
    shipping: number
    products: ProductItem[]
    selectedPriceList?: string
  }
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSelectChange: (name: string, value: string) => void
  handleNumberChange: (name: string, value: number) => void
  errors: { [key: string]: string }
  buttonText: string
  buttonLoadingText: string
  loading: boolean
  onProductSelect: (productId: string, product: ProductSearch) => void
  onProductRemove: (productId: string) => void
  onProductUpdate: (productId: string, updates: Partial<ProductItem>) => void
  onClearProducts: () => void
}

export default function QuotationForm({
  handleSubmit,
  formData,
  handleChange,
  handleSelectChange,
  handleNumberChange,
  errors,
  buttonText,
  buttonLoadingText,
  loading,
  onProductSelect,
  onProductRemove,
  onProductUpdate,
  onClearProducts,
}: QuotationFormProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ProductSearch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [priceLists, setPriceLists] = useState<SimplePriceList[]>([])
  const [isLoadingPriceLists, setIsLoadingPriceLists] = useState(false)
  const [priceListOpen, setPriceListOpen] = useState(false)
  const [updatingPrices, setUpdatingPrices] = useState(false)

  const calculateProductTotal = (product: ProductItem) => {
    return product.quantity * product.unitPrice
  }

  const subtotal = formData.products.reduce((sum, product) => sum + calculateProductTotal(product), 0)

  const discountAmount = formData.discount || 0
  const total = subtotal - discountAmount

  // Cargar listas de precios
  useEffect(() => {
    const loadPriceLists = async () => {
      setIsLoadingPriceLists(true)
      try {
        const lists = await getActivePriceLists()
        setPriceLists(lists)
        
        // Siempre seleccionar "default" primero, si existe
        const defaultList = lists.find(list => list.code === "default")
        const firstList = lists[0]
        const initialList = defaultList || firstList
        
        if (initialList && !formData.selectedPriceList) {
          handleSelectChange("selectedPriceList", initialList.id)
        }
      } catch (error) {
        console.error("Error cargando listas de precios:", error)
        toast.error("Error al cargar listas de precios")
      } finally {
        setIsLoadingPriceLists(false)
      }
    }

    loadPriceLists()
  }, [])

  // Función para obtener el precio de un producto según la lista seleccionada
  const getProductPriceByPriceList = async (
    productId: string, 
    priceListId: string
  ): Promise<number | null> => {
    try {
      
      // 1. Primero buscar en la tabla intermedia products_price_lists
      const priceInList = await getProductPriceInPriceList(productId, priceListId);
      
      if (priceInList !== null) {
        return priceInList;
      }
      
      // 2. Si no tiene precio en esa lista, buscar en la lista "default"
      const defaultList = priceLists.find(list => list.code === "default");
      
      if (defaultList && defaultList.id !== priceListId) {
        const priceInDefault = await getProductPriceInPriceList(productId, defaultList.id);
        
        if (priceInDefault !== null) {
          return priceInDefault;
        }
      }
      
      // 3. Si no tiene precio en ninguna lista
      return null;
    } catch (error) {
      console.error(`[getProductPriceByPriceList] Error:`, error);
      return null;
    }
  }

  // Función para manejar cambio de lista de precios
  const handlePriceListChange = async (priceListId: string) => {
    try {
      setUpdatingPrices(true)
      
      // Actualizar la lista seleccionada
      handleSelectChange("selectedPriceList", priceListId)
      setPriceListOpen(false)
      
      // Actualizar precios de productos existentes
      await updateProductPricesForNewPriceList(priceListId)
      
      const selectedListName = priceLists.find(list => list.id === priceListId)?.name || "la lista"
      toast.success(`Lista de precios cambiada a "${selectedListName}"`)
    } catch (error) {
      console.error("Error cambiando lista de precios:", error)
      toast.error("Error al actualizar precios")
    } finally {
      setUpdatingPrices(false)
    }
  }

  // Actualizar precios de todos los productos cuando cambia la lista
  const updateProductPricesForNewPriceList = async (priceListId: string) => {
    if (formData.products.length === 0) return
    
    const updates: Array<Promise<void>> = []
    
    for (const productItem of formData.products) {
      updates.push(
        (async () => {
          try {
            const newPrice = await getProductPriceByPriceList(productItem.id, priceListId)
            
            if (newPrice !== null) {
              onProductUpdate(productItem.id, { unitPrice: newPrice })
            } else {
              // Mantener el precio actual
            }
          } catch (error) {
            console.error(`Error actualizando precio para producto ${productItem.id}:`, error)
          }
        })()
      )
    }
    
    // Ejecutar todas las actualizaciones en paralelo
    await Promise.all(updates)
  }

  // Buscar productos
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        return
      }

      setIsSearching(true)
      try {
        const results = await searchProductsByName(searchQuery)
        setSearchResults(results)
      } catch (error) {
        console.error("Error buscando productos:", error)
        toast.error("Error al buscar productos")
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    const timer = setTimeout(() => {
      searchProducts()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearchSelect = async (product: ProductSearch) => {
    const exists = formData.products.find((p) => p.id === product.id)
    if (exists) {
      toast.info("Este producto ya está en la cotización")
      return
    }

    let unitPrice = 0
    
    // Obtener precio según la lista seleccionada
    if (formData.selectedPriceList) {
      try {
        const price = await getProductPriceByPriceList(product.id, formData.selectedPriceList)
        if (price !== null) {
          unitPrice = price
        } else {
          // Si no tiene precio en ninguna lista, usar 0
          unitPrice = 0
        }
      } catch (error) {
        console.error(`Error obteniendo precio para ${product.name}:`, error)
        unitPrice = 0
      }
    } else {
      // Si no hay lista seleccionada, buscar en default
      const defaultList = priceLists.find(list => list.code === "default")
      if (defaultList) {
        const price = await getProductPriceByPriceList(product.id, defaultList.id)
        unitPrice = price || 0
      }
    }

    // Crear el nuevo producto con precio ya calculado
    const newProduct: ProductItem = {
      id: product.id,
      product,
      quantity: 1,
      unitPrice,
      discount: 0,
      notes: "",
    }

    onProductSelect(product.id, product)
    onProductUpdate(product.id, newProduct)

    toast.success(`"${product.name}" agregado a la cotización`)
    setSearchQuery("")
    setSearchResults([])
    setSearchOpen(false)
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return
    onProductUpdate(productId, { quantity })
  }

  const handlePriceChange = (productId: string, price: number) => {
    if (price < 0) return
    onProductUpdate(productId, { unitPrice: price })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: formData.currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Obtener el nombre de la lista de precios seleccionada
  const getSelectedPriceListName = () => {
    if (!formData.selectedPriceList || priceLists.length === 0) 
      return isLoadingPriceLists ? "Cargando..." : "Seleccionar lista"
    
    const selectedList = priceLists.find(list => list.id === formData.selectedPriceList)
    return selectedList ? selectedList.name : "Seleccionar lista"
  }

  // Obtener el código de la lista de precios seleccionada
  const getSelectedPriceListCode = () => {
    if (!formData.selectedPriceList || priceLists.length === 0) 
      return ""
    
    const selectedList = priceLists.find(list => list.id === formData.selectedPriceList)
    return selectedList?.code || ""
  }

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Cerrar búsqueda de productos si se hace clic fuera
      if (!target.closest('.search-container')) {
        setSearchOpen(false)
      }
      
      // Cerrar selector de lista de precios si se hace clic fuera
      if (!target.closest('.price-list-container')) {
        setPriceListOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-[#0A0F17] rounded-lg border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-semibold text-white">Productos</h2>
          <div className="flex items-center gap-2">
            {/* Combobox de Listas de Precios */}
            <div className="relative price-list-container">
              <button
                type="button"
                onClick={() => setPriceListOpen(!priceListOpen)}
                disabled={isLoadingPriceLists || updatingPrices}
                className="inline-flex items-center justify-between gap-2 px-4 py-2 text-sm text-gray-300 bg-[#070B14] border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors w-48 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <div className="text-left truncate">
                    <div className="font-medium">{getSelectedPriceListName()}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  {updatingPrices ? (
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                  ) : (
                    <ChevronDown className={`w-4 h-4 transition-transform ${priceListOpen ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </button>

              {/* Dropdown de Listas de Precios */}
              {priceListOpen && (
                <div className="absolute z-50 mt-1 w-48 rounded-lg border border-gray-700 bg-[#0A0F17] shadow-xl">
                  {isLoadingPriceLists ? (
                    <div className="flex items-center justify-center py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-yellow-400 mr-2" />
                      <span className="text-sm text-gray-400">Cargando...</span>
                    </div>
                  ) : priceLists.length === 0 ? (
                    <div className="py-3 px-4 text-center">
                      <p className="text-sm text-gray-400">No hay listas disponibles</p>
                    </div>
                  ) : (
                    <ul className="py-1 max-h-60 overflow-y-auto">
                      {priceLists.map((list) => (
                        <li key={list.id}>
                          <button
                            type="button"
                            onClick={() => handlePriceListChange(list.id)}
                            disabled={updatingPrices}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-yellow-400/10 transition-colors flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed ${
                              formData.selectedPriceList === list.id 
                                ? 'bg-yellow-400/20 text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          >
                            <div>
                              <div className="font-medium">{list.name}</div>
                            </div>
                            {formData.selectedPriceList === list.id && (
                              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {formData.products.length > 0 && (
              <button
                type="button"
                onClick={onClearProducts}
                disabled={updatingPrices}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Limpiar todo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              disabled={updatingPrices}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="px-6 py-4 bg-[#070B14] border-b border-gray-800">
          <div className="relative search-container">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Buscar por nombre"
              className="pl-12 pr-12 h-12 bg-[#0A0F17] border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-lg"
              disabled={loading || updatingPrices}
            />

            {/* Resultados de búsqueda */}
            {searchOpen && (searchQuery.length >= 2 || searchResults.length > 0) && (
              <div className="absolute z-50 mt-2 w-full rounded-lg border border-gray-700 bg-[#0A0F17] shadow-xl max-h-80 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-400 mr-2" />
                    <span className="text-sm text-gray-400">Buscando productos...</span>
                  </div>
                ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-900 flex items-center justify-center">
                      <Search className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-300 font-medium">No se encontraron productos</p>
                    <p className="text-xs text-gray-500 mt-1">Intenta con otros términos</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    Escribe al menos 2 caracteres para buscar
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-800">
                    {searchResults.map((product) => (
                      <li
                        key={product.id}
                        onClick={() => !updatingPrices && handleSearchSelect(product)}
                        className={`cursor-pointer px-4 py-3 transition-colors ${
                          updatingPrices 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-yellow-400/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-white">{product.name}</div>
                            {product.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{product.description}</p>
                            )}
                            {/* TODO: CONSULTAR PRECIO */}
                            {/* <div className="flex flex-wrap items-center gap-2 mt-2">
                              {priceLists.length > 0 && (
                                <span className="text-sm font-medium text-green-400">
                                  {(() => {
                                    const defaultList = priceLists.find(list => list.code === "default");
                                    if (defaultList) {
                                      // Simular obtención de precio para mostrar en la búsqueda
                                      return "Consultar precio";
                                    }
                                    return "Consultar precio";
                                  })()}
                                </span>
                              )}
                            </div> */}
                          </div>
                          <button
                            type="button"
                            disabled={updatingPrices}
                            className="ml-3 p-1.5 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lista de Productos */}
        {formData.products.length > 0 ? (
          <div className="px-6 py-6">
            {/* Headers de tabla */}
            <div className="grid grid-cols-12 gap-4 pb-3 mb-4 border-b border-gray-800">
              <div className="col-span-5 text-sm font-medium text-gray-400">Producto</div>
              <div className="col-span-2 text-sm font-medium text-gray-400 text-center">Cantidad</div>
              <div className="col-span-2 text-sm font-medium text-gray-400 text-center">Precio Unit.</div>
              <div className="col-span-2 text-sm font-medium text-gray-400 text-right">Subtotal</div>
              <div className="col-span-1"></div>
            </div>

            {/* Productos */}
            <div className="space-y-4">
              {formData.products.map((productItem) => (
                <div key={productItem.id} className="grid grid-cols-12 gap-4 items-center py-3">
                  {/* Imagen y detalles del producto */}
                  <div className="col-span-5 flex items-start gap-3">
                    <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-800 rounded"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white text-sm">{productItem.product.name}</div>
                      {productItem.product.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {productItem.product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div className="col-span-2 flex justify-center">
                    <Input
                      type="number"
                      min="1"
                      value={productItem.quantity}
                      onChange={(e) => handleQuantityChange(productItem.id, Number.parseInt(e.target.value) || 1)}
                      className="w-20 h-10 px-3 bg-[#070B14] border-gray-700 rounded-lg text-white text-center focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                      disabled={loading || updatingPrices}
                    />
                  </div>

                  {/* Precio Unitario */}
                  <div className="col-span-2 flex justify-center">
                    <div className="relative w-32">
                      <DollarSign className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={productItem.unitPrice}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value) || 0
                          handlePriceChange(productItem.id, price)
                        }}
                        className="w-full h-10 pl-8 pr-3 bg-[#070B14] border-gray-700 rounded-lg text-white text-right focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
                        disabled={loading || updatingPrices}
                      />
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="col-span-2 flex items-center justify-end">
                    <div className="font-semibold text-white text-base">
                      {formatCurrency(calculateProductTotal(productItem))}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onProductRemove(productItem.id)}
                      disabled={updatingPrices}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de totales */}
            <div className="mt-8 pt-6 border-t border-gray-800 space-y-3">
              <div className="flex justify-between items-center text-base">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-base">
                <button
                  type="button"
                  className="text-yellow-400 hover:text-yellow-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (updatingPrices) return
                    const discount = prompt("Ingresa el descuento:", formData.discount.toString())
                    if (discount !== null) {
                      handleNumberChange("discount", Number.parseFloat(discount) || 0)
                    }
                  }}
                  disabled={updatingPrices}
                >
                  Agregar Descuento
                </button>
                <span className="text-gray-300">{formatCurrency(discountAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-lg pt-3 border-t border-gray-800">
                <span className="font-semibold text-white">Total a pagar</span>
                <span className="font-bold text-yellow-400 text-xl">{formatCurrency(total)}</span>
              </div>
              
              {/* Información de lista de precios seleccionada */}
              {formData.selectedPriceList && priceLists.length > 0 && (
                <div className="pt-3 border-t border-gray-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Lista de precios:</span>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-yellow-400" />
                      <span className="text-yellow-300 font-medium">
                        {getSelectedPriceListName()}
                      </span>
                      {updatingPrices && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400 ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-900 flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-base font-medium text-white mb-2">Sin productos agregados</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Busca y agrega productos usando el campo de búsqueda arriba para comenzar tu cotización.
            </p>
            
            {/* Mostrar lista de precios seleccionada incluso cuando no hay productos */}
            {formData.selectedPriceList && priceLists.length > 0 && (
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-900/50 rounded-lg border border-gray-800">
                <DollarSign className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-300">
                  Lista de precios: <span className="text-yellow-300 font-medium">{getSelectedPriceListName()}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between gap-4 pt-6">
        <div className="text-sm text-gray-400">
          {formData.products.length > 0 ? (
            <span className="text-green-400 font-medium">
              ✓ {formData.products.length} producto{formData.products.length !== 1 ? "s" : ""} listo
              {formData.products.length !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-yellow-400 font-medium">⚠ Agrega al menos un producto</span>
          )}
        </div>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={loading || updatingPrices}
            className="px-6 py-2 border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            Cancelar
          </Button>

          <Button 
            type="submit" 
            disabled={loading || updatingPrices || formData.products.length === 0} 
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || updatingPrices ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {updatingPrices ? "Actualizando precios..." : buttonLoadingText}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}