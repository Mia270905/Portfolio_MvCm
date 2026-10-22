"use client"

import type React from "react"
import type { ProductCategory } from "./category-list"
import ImageUpload from "@/components/image-upload"

interface CategoryFormProps {
  handleSubmit: (e: React.FormEvent) => void
  formData: Partial<ProductCategory> & { image_url?: string | File }
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleToggleActive: () => void
  errors: { [key: string]: string }
  buttonText: string
  buttonLoadingText: string
  loading: boolean
  onImageChange: (urlOrFile: string | File) => void
}

export default function CategoryForm({
  handleSubmit,
  formData,
  handleChange,
  handleToggleActive,
  errors,
  buttonText,
  buttonLoadingText,
  loading,
  onImageChange,
}: CategoryFormProps) {
  
  const handleImageChange = (urlOrFile: string | File) => {
    onImageChange(urlOrFile)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-xs border border-gray-200 p-6 space-y-6">
      <div className="space-y-2">
        <label className="text-gray-700">Título *</label>
        <input
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          placeholder="Ej: Pollo preparado"
          className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-200"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-gray-700">Descripción *</label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Describe la categoría..."
          rows={4}
          className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-200"
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      <ImageUpload title={"Imagen de la categoría"} value={formData.image_url} onChange={handleImageChange} error={errors.image_url} />

      <div className="space-y-2">
        <label className="block font-medium text-gray-700 mb-3">Estado</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleActive}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden ${
              formData.active ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              formData.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {formData.active ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-medium rounded-lg"
        >
          {loading ? buttonLoadingText : buttonText}
        </button>
      </div>
    </form>
  )
}
