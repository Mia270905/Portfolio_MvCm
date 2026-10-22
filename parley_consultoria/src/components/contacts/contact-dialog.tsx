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
import type { Contact } from "./contact-list"
import { createContact, updateContact } from "@/lib/actions/contact.actions"

interface ContactDialogProps {
  contact: Contact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
  isLoading: boolean
}

export function ContactDialog({ contact, open, onOpenChange, onSave, isLoading }: ContactDialogProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({
    full_name: "",
    job_position: "",
    phone: "",
    mobile: "",
    email: "",
    website: "",
    title: "",
    rfc: "",
    curp: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [saving, setSaving] = useState(false)

  // Actualizar formData cuando cambia el contacto
  useEffect(() => {
    if (contact) {
      setFormData({
        full_name: contact.full_name || "",
        job_position: contact.job_position || "",
        phone: contact.phone || "",
        mobile: contact.mobile || "",
        email: contact.email || "",
        website: contact.website || "",
        title: contact.title || "",
        rfc: contact.rfc || "",
        curp: contact.curp || "",
      })
    } else {
      setFormData({
        full_name: "",
        job_position: "",
        phone: "",
        mobile: "",
        email: "",
        website: "",
        title: "",
        rfc: "",
        curp: "",
      })
    }
    setErrors({})
  }, [contact, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Función para formatear números de teléfono mientras se escribe
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    // Aplicar formato automático para teléfonos
    if (name === 'phone' || name === 'mobile') {
      const numbers = value.replace(/\D/g, '')
      
      if (numbers.length <= 3) {
        formattedValue = numbers
      } else if (numbers.length <= 6) {
        formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3)}`
      } else if (numbers.length <= 10) {
        formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`
      } else {
        formattedValue = `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
      }
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  // Función para normalizar URLs
  const normalizeWebsite = (url: string): string => {
    if (!url) return ''
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        return `https://${url}`
      }
      return url
    }
    return url
  }

  const validate = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.full_name?.trim()) {
      newErrors.full_name = "El nombre completo es requerido"
    }

    if (!formData.email?.trim()) {
      newErrors.email = "El correo electrónico es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El formato del correo electrónico no es válido"
    }

    // Validación opcional para teléfonos
    if (formData.phone && !/^[\d-]+$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "El formato del teléfono no es válido"
    }

    if (formData.mobile && !/^[\d-]+$/.test(formData.mobile.replace(/\s/g, ''))) {
      newErrors.mobile = "El formato del celular no es válido"
    }

    // Validación opcional para RFC (formato básico)
    if (formData.rfc && formData.rfc.trim() && !/^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(formData.rfc.toUpperCase())) {
      newErrors.rfc = "El formato del RFC no es válido"
    }

    // Validación opcional para CURP (formato básico)
    if (formData.curp && formData.curp.trim() && !/^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9A-Z]{2}$/.test(formData.curp.toUpperCase())) {
      newErrors.curp = "El formato de la CURP no es válido"
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
      const normalizedWebsite = normalizeWebsite(formData.website || "")

      if (contact?.id) {
        // Actualizar contacto existente
        const result = await updateContact(contact.id, {
          full_name: formData.full_name || "",
          job_position: formData.job_position || "",
          phone: formData.phone || "",
          mobile: formData.mobile || "",
          email: formData.email || "",
          website: normalizedWebsite,
          title: formData.title || "",
          rfc: formData.rfc || "",
          curp: formData.curp || "",
        })

        if (!result.success) {
          throw new Error(result.message || "Error al actualizar el contacto")
        }
      } else {
        // Crear nuevo contacto
        const result = await createContact({
          full_name: formData.full_name || "",
          job_position: formData.job_position || "",
          phone: formData.phone || "",
          mobile: formData.mobile || "",
          email: formData.email || "",
          website: normalizedWebsite,
          title: formData.title || "",
          rfc: formData.rfc || "",
          curp: formData.curp || "",
        })

        if (!result.success) {
          throw new Error(result.message || "Error al crear el contacto")
        }
      }

      // Llamar a onSave para refrescar la lista
      onSave()
      onOpenChange(false)
    } catch (error) {
      console.error("Error al guardar contacto:", error)
      setErrors({ submit: error instanceof Error ? error.message : "Error al guardar el contacto. Intenta de nuevo." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="space-y-6 bg-white rounded-xl border border-[#E5E1D8] p-6">
    <DialogHeader>
      <DialogTitle className="text-gray-900 text-lg font-semibold">
        {contact ? "Editar contacto" : "Crear nuevo contacto"}
      </DialogTitle>

      <DialogDescription className="text-gray-600">
        {contact
          ? "Modifica los datos del contacto"
          : "Completa los datos del nuevo contacto"}
      </DialogDescription>
    </DialogHeader>

        <form onSubmit={handleSubmit}  className="space-y-6 bg-white rounded-xl border border-[#E5E1D8] p-6">
          {/* Información Básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre completo */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Nombre completo *</label>
              <input
                name="full_name"
                value={formData.full_name || ""}
                onChange={handleChange}
                placeholder="Ej: Juan Pérez García"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name}</p>}
            </div>

            {/* Posición de trabajo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Posición de  trabajo</label>
              <input
                name="job_position"
                value={formData.job_position || ""}
                onChange={handleChange}
                placeholder="Ej: Sales Director"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            {/* Título */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Título</label>
              <input
                name="title"
                value={formData.title || ""}
                onChange={handleChange}
                placeholder="Ej: Licenciado en Administración"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Correo electrónico *</label>
              <input
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                placeholder="Ej: juan.perez@empresa.com"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            {/* Sitio web */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sitio web</label>
              <input
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                placeholder="Ej: empresa.com o https://empresa.com"
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Teléfono</label>
              <input
                name="phone"
                value={formData.phone || ""}
                onChange={handlePhoneChange}
                placeholder="Ej: 555-123-4567"
                maxLength={12}
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Celular</label>
              <input
                name="mobile"
                value={formData.mobile || ""}
                onChange={handlePhoneChange}
                placeholder="Ej: 555-987-6543"
                maxLength={12}
                className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
          bg-[#F5F1E8] text-gray-900 placeholder-gray-400
          focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
              />
              {errors.mobile && <p className="text-red-500 text-sm">{errors.mobile}</p>}
            </div>
          </div>

          {/* Información Adicional */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Información Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RFC */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">RFC</label>
                <input
                  name="rfc"
                  value={formData.rfc || ""}
                  onChange={handleChange}
                  placeholder="Ej: XAXX010101000"
                  className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
              bg-[#F5F1E8] text-gray-900 placeholder-gray-400 uppercase
              focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.rfc && <p className="text-red-500 text-sm">{errors.rfc}</p>}
              </div>

              {/* CURP */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CURP</label>
                <input
                  name="curp"
                  value={formData.curp || ""}
                  onChange={handleChange}
                  placeholder="Ej: XAXX010101HDFXXX00"
                  className="w-full border border-[#E5E1D8] rounded-lg px-3 py-2
              bg-[#F5F1E8] text-gray-900 placeholder-gray-400 uppercase
              focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30"
                  style={{ textTransform: 'uppercase' }}
                />
                {errors.curp && <p className="text-red-500 text-sm">{errors.curp}</p>}
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{errors.submit}</div>
          )}

          <DialogFooter>
           <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="border-[#D6D1C4]  text-gray-700 bg-white hover:bg-[#F2E6B8] hover:text-black hover:border-[#D4C27A] transition-colors">
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : contact ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}