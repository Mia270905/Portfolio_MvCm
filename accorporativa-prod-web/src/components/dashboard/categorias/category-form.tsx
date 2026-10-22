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
    <form onSubmit={handleSubmit} className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6 space-y-6">
      <div className="space-y-2">
        <label className="text-gray-300">Título <span className="text-red-400">*</span></label>
        <input
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          placeholder="Ej: Pollo preparado"
          className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 transition-colors duration-200"
        />
        {errors.title && <p className="text-red-400 text-sm">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-gray-300">Descripción <span className="text-red-400">*</span></label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Describe la categoría..."
          rows={4}
          className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 transition-colors duration-200 resize-none"
        />
        {errors.description && <p className="text-red-400 text-sm">{errors.description}</p>}
      </div>

      <ImageUpload title={"Imagen de la categoría"} value={formData.image_url} onChange={handleImageChange} error={errors.image_url} />

      <div className="space-y-2">
        <label className="block font-medium text-gray-300 mb-3">Estado</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleActive}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 ${
              formData.active ? "bg-green-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              formData.active 
                ? "bg-green-900/40 text-green-300 border-green-800" 
                : "bg-red-900/40 text-red-300 border-red-800"
            }`}
          >
            {formData.active ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? buttonLoadingText : buttonText}
        </button>
      </div>
    </form>
  )
}