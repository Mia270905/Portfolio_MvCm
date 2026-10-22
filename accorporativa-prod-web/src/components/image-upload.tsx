"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { title } from "process"


interface ImageUploadProps {
  value?: string | File
  title: string
  onChange: (file: File | string) => void
  error?: string
}

export default function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const [preview, setPreview] = useState<string>(() => {
    if (typeof value === "string") return value
    return ""
  })
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (file: File | null) => {
    if (!file) return

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      toast.warning("Por favor selecciona un archivo de imagen válido")
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("La imagen no debe superar los 5MB")
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Pass the File object to parent component
    onChange(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileChange(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleRemove = () => {
    setPreview("")
    onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-gray-700">{title}</label>

      {preview ? (
        <div className="relative w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
          <Image src={preview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          <Upload className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-gray-600 font-medium mb-1">Haz clic o arrastra una imagen aquí</p>
          <p className="text-sm text-gray-500">PNG, JPG, GIF hasta 5MB</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        className="hidden"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
