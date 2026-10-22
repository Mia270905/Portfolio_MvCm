"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Search, AlertCircle } from "lucide-react"
import { getProductsForInvoice } from "@/lib/actions/manual-billing.actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Product {
  id: string
  code: string
  name: string
  description: string | null
  cost_price: number
  taxes: Array<{
    id: string
    name: string
    rate: number
    tax_type: string
    sat_tax_type: string
  }>
}

interface SelectedProduct {
  id: string
  productCode: string
  nombre: string
  cantidad: number
  precioUnitario: number
  descuento: number
  subtotal: number
  total: number
  tieneImpuestos: boolean
  impuestos?: Array<{
    id: string
    name: string
    rate: number
    amount: number
    tax_type: string
  }>
}

interface ProductSelectorProps {
  productos: SelectedProduct[]
  onChange: (productos: SelectedProduct[]) => void
  disabled?: boolean
}

export function ProductSelector({ productos, onChange, disabled = false }: ProductSelectorProps) {  
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [discountErrors, setDiscountErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const result = await getProductsForInvoice()
      if (result.success && result.products) {
        setAvailableProducts(result.products)
      }
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const addProduct = (product: Product) => {
    const precioUnitario = product.cost_price || 0
    const cantidad = 1
    const descuento = 0
    const subtotal = precioUnitario * cantidad - descuento

    let impuestos: Array<{
      id: string
      name: string
      rate: number
      amount: number
      tax_type: string
    }> = []
    let totalImpuestos = 0

    if (product.taxes && product.taxes.length > 0) {
      impuestos = product.taxes.map((tax) => {
        let amount: number
        if (tax.tax_type === "percentage") {
          amount = subtotal * (tax.rate / 100)
        } else {
          amount = tax.rate
        }
        totalImpuestos += amount
        return {
          id: tax.id,
          name: tax.name,
          rate: tax.rate,
          amount,
          tax_type: tax.tax_type,
        }
      })
    }

    const total = subtotal + totalImpuestos

    const newProduct: SelectedProduct = {
      id: product.id,
      productCode: product.code,
      nombre: product.name,
      cantidad,
      precioUnitario,
      descuento,
      subtotal,
      total,
      tieneImpuestos: product.taxes.length > 0,
      impuestos: impuestos.length > 0 ? impuestos : undefined,
    }

    onChange([...productos, newProduct])
    setDialogOpen(false)
    setSearchTerm("")
  }

  const removeProduct = (index: number) => {
    const newProducts = productos.filter((_, i) => i !== index)
    onChange(newProducts)
  }

  const updateProduct = (index: number, field: keyof SelectedProduct, value: number) => {
    const newProducts = [...productos]
    const product = { ...newProducts[index] }

    if (field === "cantidad" || field === "precioUnitario" || field === "descuento") {
      if (field === "descuento") {
        const unitPrice = Number(product.precioUnitario) || 0
        if (value >= unitPrice) {
          setDiscountErrors({
            ...discountErrors,
            [index]: "El descuento debe ser menor al precio unitario",
          })
          return
        } else {
          const newErrors = { ...discountErrors }
          delete newErrors[index]
          setDiscountErrors(newErrors)
        }
      }

      product[field] = value

      const precioNum = Number(product.precioUnitario) || 0
      const cantidadNum = Number(product.cantidad) || 1
      const descuentoNum = Number(product.descuento) || 0

      const subtotalBeforeDiscount = precioNum * cantidadNum
      if (descuentoNum >= subtotalBeforeDiscount) {
        product.descuento = subtotalBeforeDiscount - 0.01
      }

      product.subtotal = precioNum * cantidadNum - descuentoNum

      let totalImpuestos = 0
      if (product.impuestos && product.impuestos.length > 0) {
        product.impuestos = product.impuestos.map((tax) => {
          let amount: number
          if (tax.tax_type === "percentage") {
            amount = product.subtotal * (tax.rate / 100)
          } else {
            amount = tax.rate
          }
          totalImpuestos += amount
          return { ...tax, amount }
        })
      }

      product.total = product.subtotal + totalImpuestos
    }

    newProducts[index] = product
    onChange(newProducts)
  }

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-2 hover:border-custom-accent hover:bg-custom-accent-hover bg-transparent text-custom-primary border-custom-primary"
            disabled={disabled}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-custom-secondary border border-custom-primary">
          <DialogHeader>
            <DialogTitle className="text-custom-primary">Seleccionar Producto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-custom-muted w-4 h-4" />
              <Input
                type="search"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-custom-tertiary border-custom-primary text-custom-primary placeholder:text-custom-muted"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-custom-tertiary">Cargando productos...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-custom-tertiary">No se encontraron productos</div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="hover:shadow-md transition-shadow cursor-pointer bg-custom-tertiary border-custom-secondary hover:border-custom-accent"
                    onClick={() => addProduct(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-custom-primary">{product.name}</h4>
                          <p className="text-sm text-custom-tertiary">Código: {product.code}</p>
                          {product.description && <p className="text-xs text-custom-muted mt-1">{product.description}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {product.taxes.length > 0 && (
                              <span className="text-xs bg-custom-accent-hover text-custom-accent px-2 py-1 rounded border border-custom-accent">
                                Con impuestos ({product.taxes.length})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-custom-accent">${product.cost_price.toFixed(2)}</p>
                          <p className="text-xs text-custom-tertiary">Precio base</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {productos.length > 0 ? (
        <div className="space-y-3">
          {productos.map((producto, index) => (
            <Card key={index} className="border border-custom-secondary bg-custom-tertiary">
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-custom-primary">{producto.nombre}</h4>
                      <p className="text-sm text-custom-tertiary">Código: {producto.productCode}</p>
                      {producto.tieneImpuestos && producto.impuestos && producto.impuestos.length > 0 && (
                        <div className="mt-2 text-xs text-custom-secondary">
                          <span className="font-medium text-custom-accent">Impuestos: </span>
                          <span className="text-custom-tertiary">
                            {producto.impuestos
                              .map(
                                (imp) =>
                                  `${imp.name} (${imp.tax_type === "percentage" ? `${imp.rate}%` : `$${imp.rate}`})`,
                              )
                              .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      disabled={disabled}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`cantidad-${index}`} className="text-xs text-custom-secondary">
                        Cantidad
                      </Label>
                      <Input
                        id={`cantidad-${index}`}
                        type="number"
                        min="1"
                        value={producto.cantidad}
                        onChange={(e) => updateProduct(index, "cantidad", Number.parseInt(e.target.value) || 1)}
                        disabled={disabled}
                        className="bg-[#0A0F1C] border-custom-primary text-white [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`precio-${index}`} className="text-xs text-custom-secondary">
                        Precio Unitario
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                        <Input
                          id={`precio-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={producto.precioUnitario}
                          onChange={(e) =>
                            updateProduct(index, "precioUnitario", Number.parseFloat(e.target.value) || 0)
                          }
                          disabled={disabled}
                          className="pl-7 bg-[#0A0F1C] border-custom-primary text-white [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`descuento-${index}`} className="text-xs text-custom-secondary">
                        Descuento
                      </Label>
                      <div className="space-y-1">
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-400 text-sm">$</span>
                          <Input
                            id={`descuento-${index}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max={producto.precioUnitario - 0.01}
                            value={producto.descuento}
                            onChange={(e) => updateProduct(index, "descuento", Number.parseFloat(e.target.value) || 0)}
                            disabled={disabled}
                            className="pl-7 bg-[#0A0F1C] border-custom-primary text-white [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        {discountErrors[index] && <p className="text-xs text-red-400">{discountErrors[index]}</p>}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-custom-secondary">Subtotal</Label>
                      <div className="h-10 flex items-center px-3 bg-[#0A0F1C] rounded-md border border-custom-primary">
                        <span className="text-sm font-bold text-custom-accent">${producto.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-custom-secondary">
                    <div className="text-sm text-custom-tertiary">
                      {producto.tieneImpuestos && producto.impuestos && producto.impuestos.length > 0 && (
                        <span>
                          Impuestos: <span className="text-custom-accent font-medium">${producto.impuestos.reduce((sum, imp) => sum + imp.amount, 0).toFixed(2)}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-custom-tertiary">Total</p>
                      <p className="text-lg font-bold text-custom-accent">${producto.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-custom-primary bg-custom-hover">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-custom-muted mx-auto mb-3" />
            <p className="text-sm text-custom-tertiary">
              No hay productos agregados. Haz clic en &quot;Agregar Producto&quot; para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
