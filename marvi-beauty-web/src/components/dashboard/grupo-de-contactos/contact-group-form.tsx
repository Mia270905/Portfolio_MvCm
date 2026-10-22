"use client"

import type React from "react"
import type { ContactGroup } from "./contact-group-list"
import ImageUpload from "@/components/image-upload"

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
    <form onSubmit={handleSubmit} className="bg-card rounded-lg border border-border p-6 space-y-6">
      <div className="space-y-2">
        <label className="text-card-foreground font-medium">
          Título <span className="text-destructive">*</span>
        </label>
        <input
          name="title"
          value={formData.title || ""}
          onChange={handleChange}
          placeholder="Ej: Contactos de la empresa X"
          className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground transition-colors duration-200"
        />
        {errors.title && <p className="text-destructive text-sm mt-1">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-card-foreground font-medium">
          Descripción <span className="text-destructive">*</span>
        </label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Describe el grupo de contactos..."
          rows={4}
          className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 text-foreground bg-background placeholder-muted-foreground transition-colors duration-200 resize-none"
        />
        {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Si necesitas el ImageUpload, descomenta esta línea */}
      {/* <ImageUpload 
        title={"Imagen de la categoría"} 
        value={formData.image_url} 
        onChange={handleImageChange} 
        error={errors.image_url} 
      /> */}

      <div className="space-y-2">
        <label className="block font-medium text-card-foreground mb-3">Estado</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleActive}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
              formData.active ? "bg-green-500" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                formData.active ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              formData.active 
                ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400" 
                : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
            }`}
          >
            {formData.active ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? buttonLoadingText : buttonText}
        </button>
      </div>
    </form>
  )
}