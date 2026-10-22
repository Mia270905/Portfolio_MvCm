"use client"

import type React from "react"
import type { ContactGroup } from "./contact-group-list"

interface ContactGroupFormProps {
  handleSubmit: (e: React.FormEvent) => void
  formData: Partial<ContactGroup> & { image_url?: string | File }
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleToggleActive: () => void
  errors: { [key: string]: string }
  buttonText: string
  buttonLoadingText: string
  loading: boolean
  onImageChange: (urlOrFile: string | File) => void
}

export default function ContactGroupForm({
  handleSubmit,
  formData,
  handleChange,
  handleToggleActive,
  errors,
  buttonText,
  buttonLoadingText,
  loading,
  onImageChange,
}: ContactGroupFormProps) {
  
  const handleImageChange = (urlOrFile: string | File) => {
    onImageChange(urlOrFile)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-[#f5efe6] p-6 space-y-6 shadow-sm">
      
      {/* Título */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700">
          Título <span className="text-[#c62828]">*</span>
        </label>
        <input
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          placeholder="Ej: Contactos de la empresa X"
          className="w-full border border-[#e6dcc9] rounded-lg px-4 py-3 focus:outline-none focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50 text-neutral-900 bg-white placeholder-neutral-400 transition-colors duration-200"
        />
        {errors.title && <p className="text-sm text-[#c62828] mt-2">{errors.title}</p>}
      </div>

      {/* Descripción */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700">
          Descripción <span className="text-[#c62828]">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Describe el grupo de contactos..."
          rows={4}
          className="w-full border border-[#e6dcc9] rounded-lg px-4 py-3 focus:outline-none focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50 text-neutral-900 bg-white placeholder-neutral-400 transition-colors duration-200 resize-none"
        />
        {errors.description && <p className="text-sm text-[#c62828] mt-2">{errors.description}</p>}
      </div>

      {/* Estado */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 mb-3">Estado</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleActive}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50 ${
              formData.active ? "bg-[#2e7d32]" : "bg-[#e6dcc9]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border ${
              formData.active 
                ? "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]" 
                : "bg-[#f5efe6] text-neutral-600 border-[#e6dcc9]"
            }`}
          >
            {formData.active ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {/* Botón de enviar */}
      <div className="flex justify-end pt-4 border-t border-[#f5efe6]">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-[#c6a365] hover:bg-[#b59555] text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-lg hover:shadow-[#c6a365]/25"
        >
          {loading ? buttonLoadingText : buttonText}
          {loading && (
            <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
          )}
        </button>
      </div>
    </form>
  )
}