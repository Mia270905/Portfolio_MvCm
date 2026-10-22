"use client"

import { useState } from "react"
import type { Product } from "@/lib/actions/product.actions"
import { ImageIcon, MoreVertical } from "lucide-react"
import Image from "next/image"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useRouter } from "next/navigation"

interface ProductTableRowProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (productId: string) => void
  userPermissions?: string[]
}

export default function ProductTableRow({ product, onEdit, onDelete, userPermissions = [] }: ProductTableRowProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const handleDeleteClick = () => setDeleteDialogOpen(true)

  const canUpdate = userPermissions.includes("update:product_details")
  const canDelete = userPermissions.includes("delete:product_details")

  const handleEdit = () => {
    router.push(`/dashboard/productos/editar/${product.id}`)
    setPopoverOpen(false)
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      {/* Imagen y Nombre */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {product.image_url ? (
              <Image src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
            {product.description && <p className="text-xs text-gray-500 truncate max-w-xs">{product.description}</p>}
          </div>
        </div>
      </td>

      {/* Códigos */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          {product.code && (
            <p className="text-xs font-mono text-gray-700">
              <span className="font-semibold">Cód:</span> {product.code}
            </p>
          )}
          {product.bar_code && (
            <p className="text-xs font-mono text-gray-600">
              <span className="font-semibold">CB:</span> {product.bar_code}
            </p>
          )}
        </div>
      </td>

      {/* Categoría */}
      <td className="px-4 py-3">
        {product.category_name ? (
          <span className="text-sm text-gray-700">{product.category_name}</span>
        ) : (
          <span className="text-sm text-gray-400">Sin categoría</span>
        )}
      </td>

      {/* Precio */}
      <td className="px-4 py-3">
        {product.cost_price !== null && product.cost_price !== undefined ? (
          <span className="text-sm font-semibold text-blue-600">${Number(product.cost_price).toFixed(2)}</span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        )}
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
            product.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {product.is_available ? "Activo" : "Inactivo"}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        {(canUpdate || canDelete) && (
          <div className="flex justify-end">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                  <MoreVertical size={16} className="text-gray-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-3 bg-white border border-gray-200 rounded-lg shadow-lg" align="end">
                <div className="space-y-1">
                  {canUpdate && (
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      onClick={handleDeleteClick}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

          </div>
        )}
      </td>
    </tr>
  )
}
