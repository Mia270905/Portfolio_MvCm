"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { Product } from "./product-list"
import { getActiveCategories, createProduct, updateProduct } from "@/lib/actions/product.actions"
import { userAgent } from "next/server"

interface ProductDialogProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  isLoading: boolean
}

interface Category {
  id: string
  title: string
}

export function ProductDialog({ product, open, onOpenChange, onSave, isLoading }: ProductDialogProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    code: "",
    bar_code: "",
    description: "",
    image_url: "",
    category_id: "",
    cost_price: 0,
    type: "article" as 'article' | 'service',
    is_available: true,
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getActiveCategories()
        setCategories(data)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      }
      setLoadingCategories(false)
    }

    if (open) {
      fetchCategories()
    }
  }, [open])

  // Actualizar formData cuando cambia el producto
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        code: product.code || "",
        bar_code: product.bar_code || "",
        description: product.description || "",
        image_url: product.image_url || "",
        category_id: product.category_id || "",
        cost_price: product.cost_price || 0,
        type: product.type || "article",
        is_available: product.is_available ?? true,
      })
    } else {
      setFormData({
        name: "",
        code: "",
        bar_code: "",
        description: "",
        image_url: "",
        category_id: "",
        cost_price: 0,
        type: "article",
        is_available: true,
      })
    }
    setErrors({})
  }, [product, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleTypeChange = (type: 'article' | 'service') => {
    setFormData((prev) => ({ ...prev, type }))
    if (errors.type) {
      setErrors((prev) => ({ ...prev, type: "" }))
    }
  }

  const handleToggleAvailable = () => {
    setFormData((prev) => ({ ...prev, is_available: !prev.is_available }))
  }

  const validate = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name?.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!formData.category_id) {
      newErrors.category_id = "La categoría es requerida"
    }

    if (formData.cost_price === undefined || formData.cost_price === null || formData.cost_price < 0) {
      newErrors.cost_price = "El precio debe ser mayor o igual a 0"
    }

    if (!formData.type) {
      newErrors.type = "El tipo de producto es requerido" 
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setSaving(true)

    try {
      if (product?.id) {
        // Actualizar producto existente
        await updateProduct(product.id, formData)
      } else {
        // Crear nuevo producto
        await createProduct({
          code: formData.code || "",
          bar_code: formData.bar_code || "",
          name: formData.name || "",
          description: formData.description || "",
          image_url: formData.image_url || "",
          category_id: formData.category_id || "",
          cost_price: formData.cost_price || 0,
          type: formData.type || "article",
          is_available: formData.is_available ?? true,
        })
      }

      // Llamar a onSave para refrescar la lista
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error al guardar producto:", error)
      setErrors({ submit: "Error al guardar el producto. Intenta de nuevo." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar producto" : "Crear nuevo producto"}</DialogTitle>
          <DialogDescription>
            {product ? "Modifica los datos del producto" : "Completa los datos del nuevo producto"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nombre del producto *</label>
            <input
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              placeholder="Ej: Pollo entero"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Código y Código de barras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Código</label>
              <input
                name="code"
                value={formData.code || ""}
                onChange={handleChange}
                placeholder="Ej: PROD-001"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Código de barras</label>
              <input
                name="bar_code"
                value={formData.bar_code || ""}
                onChange={handleChange}
                placeholder="Ej: 7501234567890"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Describe el producto..."
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
            />
          </div>

          {/* Categoría y Precio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoría *</label>
              <select
                name="category_id"
                value={formData.category_id || ""}
                onChange={handleChange}
                disabled={loadingCategories}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
              >
                <option value="">{loadingCategories ? "Cargando..." : "Selecciona una categoría"}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
              {errors.category_id && <p className="text-red-500 text-sm">{errors.category_id}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Precio de costo *</label>
              <input
                name="cost_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price || ""}
                onChange={handleChange}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
              />
              {errors.cost_price && <p className="text-red-500 text-sm">{errors.cost_price}</p>}
            </div>
          </div>

          {/* Imagen URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">URL de Imagen</label>
            <input
              name="image_url"
              type="text"
              value={formData.image_url || ""}
              onChange={handleChange}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
            />
          </div>

          {/* Disponibilidad */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Disponibilidad</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleAvailable}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  formData.is_available ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_available ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                  formData.is_available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {formData.is_available ? "Disponible" : "No disponible"}
              </span>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{errors.submit}</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || loadingCategories}>
              {saving ? "Guardando..." : product ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
