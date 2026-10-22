"use client";

import type React from "react";
import type { WhatsAppConfigForm } from "@/lib/actions/configuration.actions";
import Link from "next/link";

interface PhoneFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  formData: WhatsAppConfigForm;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: { [key: string]: string };
  buttonText: string;
  buttonLoadingText: string;
  loading: boolean;
}

export default function PhoneForm({
  handleSubmit,
  formData,
  handleChange,
  errors,
  buttonText,
  buttonLoadingText,
  loading,
}: PhoneFormProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-xs border border-gray-200 p-6 space-y-6"
    >
      {/* Número de Teléfono */}
      <div className="space-y-2">
        <label className="text-gray-700 font-medium">
          Número de Teléfono *
        </label>
        <input
          name="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Ej: 555-123-4567"
          maxLength={12}
          className="w-full border border-gray-300 rounded-sm px-3 py-2
            focus:outline-hidden focus:border-blue-500
            focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50
            transition-colors duration-200"
        />
        {errors.phone_number && (
          <p className="text-red-500 text-sm">{errors.phone_number}</p>
        )}
        <p className="text-sm text-gray-500">
          Ingresa el número en formato: XXX-XXX-XXXX
        </p>
      </div>

      {/* Estado activo */}
      <div className="flex items-center space-x-3">
        <input
          name="active"
          type="checkbox"
          checked={formData.active || false}
          onChange={handleChange}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded
            focus:ring-blue-500 focus:ring-2"
          id="active-checkbox"
        />
        <label htmlFor="active-checkbox" className="text-gray-700 font-medium">
          Número de teléfono activo
        </label>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Link href="/dashboard/sitio-web/numero_whatsapp">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 text-gray-700
              font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2
            bg-[#4F46E5] hover:bg-[#6366F1]
            text-white font-medium rounded-lg
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {loading ? buttonLoadingText : buttonText}
        </button>
      </div>
    </form>
  );
}
