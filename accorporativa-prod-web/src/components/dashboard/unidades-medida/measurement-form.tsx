"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { getMeasurementOptions } from "@/lib/actions/measurement.actions"
import { getUnspscOptions } from "@/lib/actions/unspsc.actions"

interface MeasurementFormData {
  unit: string;
  quantity: string;
  reference?: string | null;
  unspsc?: string | null;
}

interface MeasurementFormProps {
  handleSubmit: (e: React.FormEvent) => void
  formData: Partial<MeasurementFormData>
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  errors: { [key: string]: string }
  buttonText: string
  buttonLoadingText: string
  loading: boolean
}

export default function MeasurementForm({
  handleSubmit,
  formData,
  handleChange,
  errors,
  buttonText,
  buttonLoadingText,
  loading,
}: MeasurementFormProps) {
  const [measurementOptions, setMeasurementOptions] = useState<Array<{id: string, unit: string, quantity: string}>>([]);
  const [unspscOptions, setUnspscOptions] = useState<Array<{id: string, code: string, name: string, type: string}>>([]);

  useEffect(() => {
    getMeasurementOptions().then(setMeasurementOptions);
    getUnspscOptions().then(setUnspscOptions);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6 space-y-6">
      {/* Unidad */}
      <div className="space-y-2">
        <label className="text-gray-300">
          Unidad <span className="text-red-400">*</span>
        </label>
        <input
          name="unit"
          value={formData.unit || ""}
          onChange={handleChange}
          placeholder="Ej: Kilo, Litro, Pieza"
          className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 transition-colors duration-200"
          required
        />
        {errors.unit && <p className="text-red-400 text-sm">{errors.unit}</p>}
      </div>

      {/* Cantidad */}
      <div className="space-y-2">
        <label className="text-gray-300">
          Cantidad <span className="text-red-400">*</span>
        </label>
        <input
          name="quantity"
          value={formData.quantity || ""}
          onChange={handleChange}
          placeholder="Ej: 1, 1000, 0.5"
          className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500 transition-colors duration-200"
          required
        />
        {errors.quantity && <p className="text-red-400 text-sm">{errors.quantity}</p>}
      </div>

      {/* Referencia (opcional) */}
      <div className="space-y-2">
        <label className="text-gray-300">
          Referencia (Opcional)
        </label>
        <select
          name="reference"
          value={formData.reference || ""}
          onChange={handleChange}
          className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] transition-colors duration-200"
        >
          <option value="">Ninguna (sin referencia)</option>
          {measurementOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.unit} ({option.quantity})
            </option>
          ))}
        </select>
        {errors.reference && <p className="text-red-400 text-sm">{errors.reference}</p>}
      </div>

      {/* UNSPSC (opcional) */}
      <div className="space-y-2">
        <label className="text-gray-300">
          Código UNSPSC (Opcional)
        </label>
        <select
          name="unspsc"
          value={formData.unspsc || ""}
          onChange={handleChange}
          className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] transition-colors duration-200"
        >
          <option value="">Ninguno (sin código UNSPSC)</option>
          {unspscOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.code} - {option.name} {option.type ? `(${option.type})` : ''}
            </option>
          ))}
        </select>
        {errors.unspsc && <p className="text-red-400 text-sm">{errors.unspsc}</p>}
      </div>

      {/* Botón de envío */}
      <div className="flex justify-end pt-4 border-t border-gray-800">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? buttonLoadingText : buttonText}
        </button>
      </div>
    </form>
  )
}