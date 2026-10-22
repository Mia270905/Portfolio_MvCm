"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShoppingCart, ArrowRight, Minus, Plus } from "lucide-react"

interface Product {
  id: string
  bar_code?: string
  name: string
  description?: string
  image_url?: string
  cost_price?: number
  is_available: boolean
  quantity?: number
  price_lists?: Array<{  
    price_list_id: string
    price: number
    price_list?: {code: string}[]
  }>
}

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [quantityInCart, setQuantityInCart] = useState(0)
  const router = useRouter()

  const availableStock = typeof product.quantity === "number" ? product.quantity : 0
  const realAvailableStock = Math.max(0, availableStock - quantityInCart)
  const isOutOfStock = realAvailableStock === 0

  useEffect(() => {
    const checkCartQuantity = () => {
      const cartKey = "store_cart"
      const storedCart = localStorage.getItem(cartKey)
      if (storedCart) {
        try {
          const cart = JSON.parse(storedCart)
          const existingProduct = cart.find((item: any) => item.id === product.id)
          setQuantityInCart(existingProduct ? existingProduct.quantity : 0)
        } catch (err) {
          console.error("Error checking cart:", err)
          setQuantityInCart(0)
        }
      } else {
        setQuantityInCart(0)
      }
    }

    checkCartQuantity()
    window.addEventListener("cartUpdated", checkCartQuantity)

    return () => {
      window.removeEventListener("cartUpdated", checkCartQuantity)
    }
  }, [product.id])

  useEffect(() => {
    if (quantity > realAvailableStock) {
      setQuantity(Math.max(1, realAvailableStock))
    }
  }, [realAvailableStock])

  const incrementQuantity = () => {
    if (quantity < realAvailableStock) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleAddToCart = () => {
    const cartKey = "store_cart"
    const storedCart = localStorage.getItem(cartKey)
    const cart = storedCart ? JSON.parse(storedCart) : []

    const existingIndex = cart.findIndex((item: any) => item.id === product.id)

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += quantity
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price_lists?.find((pl: any) => pl.price_list?.code === "default")?.price || product.cost_price || 0,
        image_url: product.image_url || "",
        quantity,
        stock: availableStock
      })
    }

    localStorage.setItem(cartKey, JSON.stringify(cart))

    window.dispatchEvent(new Event("cartUpdated"))

    setShowModal(true)
  }

  const handleContinueShopping = () => {
    setShowModal(false)
  }

  const handleGoToCart = () => {
    setShowModal(false)
    router.push("/cart")
  }

  const defaultPrice = product.price_lists?.find(
    (pl: any) => pl.price_list?.code === "default"
  )?.price;

  const price = defaultPrice || product.cost_price || 0;

  return (
    <>
      <div className="grid xl:grid-cols-2 gap-8 xl:gap-16 mt-8">
        <div className="bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center p-8">
          <div className="relative w-full aspect-square max-w-lg">
            <Image
              src={product.image_url || "/placeholder.svg?height=600&width=600"}
              alt={product.name}
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-1">{product.name}</h1>
            <p className="text-gray-600 text-sm">Tienda Pollería Gris</p>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl lg:text-4xl font-bold text-gray-900">
              $ {price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOutOfStock ? (
              <span className="text-red-600 font-medium text-sm">Sin stock disponible</span>
            ) : (
              <div className="flex flex-col gap-1">
                <span className="text-gray-600 text-sm">
                  Stock disponible: <span className="font-semibold text-gray-900">{availableStock}</span> unidades
                </span>
                {quantityInCart > 0 && (
                  <span className="text-amber-600 text-sm">
                    Ya tienes <span className="font-semibold">{quantityInCart}</span> en el carrito. Puedes agregar{" "}
                    <span className="font-semibold">{realAvailableStock}</span> más.
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2">
            <span className="text-gray-700 font-medium">Cantidad:</span>
            <div className="flex items-center border-2 border-gray-300 rounded-md">
              <button
                onClick={decrementQuantity}
                disabled={quantity <= 1 || isOutOfStock}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Disminuir cantidad"
              >
                <Minus className="h-4 w-4 text-gray-700" />
              </button>
              <input
                type="number"
                min="1"
                max={realAvailableStock}
                value={quantity}
                onChange={(e) => {
                  const value = Number.parseInt(e.target.value) || 1
                  if (value >= 1 && value <= realAvailableStock) {
                    setQuantity(value)
                  }
                }}
                disabled={isOutOfStock}
                className="w-16 text-center border-x-2 border-gray-300 py-2 text-gray-900 font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Cantidad"
              />
              <button
                onClick={incrementQuantity}
                disabled={quantity >= realAvailableStock || isOutOfStock}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                aria-label="Aumentar cantidad"
              >
                <Plus className="h-4 w-4 text-gray-700" />
              </button>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="w-full py-6 text-base cursor-pointer font-medium border-2 border-red-600 text-red-600 bg-white hover:bg-red-600 hover:text-white transition-all duration-200 rounded-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-red-600 "
            size="lg"
          >
            {isOutOfStock ? "Sin stock" : "Añadir al carrito"}
          </Button>

          {product.description && (
            <div className="space-y-4 mt-4">
              <p className="text-gray-700 leading-relaxed text-sm">{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-black">
              <ShoppingCart className="h-5 w-5 text-red-600 " />
              Producto agregado al carrito
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              <span className="font-medium text-gray-900">{product.name}</span> se ha añadido exitosamente a tu carrito.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleContinueShopping}
              className="w-full sm:flex-1 border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-black"
            >
              Seguir comprando
            </Button>
            <Button onClick={handleGoToCart} className="w-full sm:flex-1 bg-red-600 hover:bg-red-700 text-white">
              Ir al carrito
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
