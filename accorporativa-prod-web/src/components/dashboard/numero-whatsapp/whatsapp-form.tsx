"use client";

import type React from "react";
import type { WhatsAppConfigForm } from "@/lib/actions/configuration.actions";
import Link from "next/link";

interface WhatsAppFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  formData: WhatsAppConfigForm;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: { [key: string]: string };
  buttonText: string;
  buttonLoadingText: string;
  loading: boolean;
}

export default function WhatsAppForm({
  handleSubmit,
  formData,
  handleChange,
  errors,
  buttonText,
  buttonLoadingText,
  loading,
}: WhatsAppFormProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 sm:p-6 space-y-6"
    >
      {/* Número de WhatsApp */}
      <div className="space-y-2">
        <label className="text-custom-text-primary font-medium">
          Número de WhatsApp *
        </label>
        <input
          name="phone_number"
          type="tel"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Ej: 311-247-9021"
          maxLength={12}
          className={`w-full border ${
            errors.phone_number 
              ? 'border-red-500' 
              : 'border-custom-border-primary'
          } rounded-lg px-3 py-2 focus:outline-none focus:border-custom-accent-border focus:ring-2 focus:ring-custom-accent-primary focus:ring-opacity-50 transition-all duration-200 bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary`}
        />
        {errors.phone_number && (
          <p className="text-red-400 text-sm mt-1">{errors.phone_number}</p>
        )}
        <p className="text-sm text-custom-text-tertiary">
          Ingresa el número en formato: XXX-XXX-XXXX (10 dígitos)
        </p>
      </div>

      {/* Checkbox de estado activo */}
      <div className="flex items-center space-x-3 p-3 bg-custom-bg-tertiary rounded-lg border border-custom-border-primary">
        <input
          name="active"
          type="checkbox"
          checked={formData.active || false}
          onChange={handleChange}
          className="w-5 h-5 text-custom-accent-primary bg-custom-bg-primary border-custom-border-primary rounded focus:ring-custom-accent-primary focus:ring-2 transition-colors duration-200"
          id="active-checkbox"
        />
        <label htmlFor="active-checkbox" className="text-custom-text-primary font-medium">
          Configuración activa
        </label>
      </div>

      {errors.submit && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Botones */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-custom-border-secondary">
        <Link href="/dashboard/sitio-web/numero_whatsapp" className="w-full sm:w-auto">
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-2 border border-custom-border-primary text-custom-text-primary font-medium rounded-lg hover:bg-custom-bg-hover transition-all duration-200"
          >
            Cancelar
          </button>
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-custom-bg-primary font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-custom-bg-primary" fill="none" viewBox="0 0 24 24">
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