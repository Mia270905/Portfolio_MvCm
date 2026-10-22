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
      className="bg-[#FAF7F2] rounded-lg border border-[#E5E7EB] p-4 sm:p-6 space-y-6"
    >
      {/* Número de Teléfono */}
      <div className="space-y-2">
        <label className="text-[#1F2937] font-medium">
          Número de Teléfono *
        </label>
        <input
          name="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Ej: 555-123-4567"
          maxLength={12}
          className={`w-full border ${
            errors.phone_number 
              ? 'border-red-500' 
              : 'border-custom-border-primary'
          } rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 bg-white text-[#1F2937] placeholder-[#9CA3AF]`}
        />
        {errors.phone_number && (
          <p className="text-red-400 text-sm mt-1">{errors.phone_number}</p>
        )}
        <p className="text-sm text-custom-text-tertiary">
          Ingresa el número en formato: XXX-XXX-XXXX (10 dígitos con código de área)
        </p>
      </div>

      {/* Checkbox de estado activo */}
      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-[#D1D5DB]">
        <input
          name="active"
          type="checkbox"
          checked={formData.active || false}
          onChange={handleChange}
          className="w-5 h-5 text-blue-600 bg-white border-[#D1D5DB] rounded focus:ring-blue-500 focus:ring-2 transition-colors duration-200"
          id="active-checkbox"
        />
        <label htmlFor="active-checkbox" className="text-[#1F2937] font-medium">
          Número de teléfono activo
        </label>
      </div>

      {errors.submit && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
        <Link href="/dashboard/sitio-web/numero_whatsapp" className="w-full sm:w-auto">
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-2 border border-[#D1D5DB] text-[#1F2937] font-medium rounded-lg hover:bg-[#FAF7F2] transition-all duration-200"
          >
            Cancelar
          </button>
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-custom-bg-primary font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {buttonLoadingText}
            </span>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </form>
  );
}