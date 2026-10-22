"use client";

import type React from "react";
import type { Zone } from "@/lib/actions/zone.actions";
import PostalCodeSelector from "./postal-code-selector";

interface PostalCode {
  id: string;
  code: string;
  zone_id: string | null;
}

interface ZoneFormProps {
  handleSubmit: (e: React.FormEvent) => void;
  formData: Partial<Zone>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: { [key: string]: string };
  buttonText: string;
  buttonLoadingText: string;
  loading: boolean;
  selectedPostalCodes: string[];
  onPostalCodesChange: (codes: string[]) => void;
  availablePostalCodes: PostalCode[];
  currentZoneId?: string;
  allZones?: Zone[];
}

export default function ZoneForm({
  handleSubmit,
  formData,
  handleChange,
  errors,
  buttonText,
  buttonLoadingText,
  loading,
  selectedPostalCodes,
  onPostalCodesChange,
  availablePostalCodes,
  currentZoneId,
  allZones, // Agregar allZones aquí en la desestructuración
}: ZoneFormProps) {
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-xs border border-gray-200 p-6 space-y-6"
    >
      <div className="space-y-2">
        <label className="text-gray-700 font-medium">Nombre de la Zona *</label>
        <input
          name="name"
          value={formData.name || ""}
          onChange={handleChange}
          placeholder="Ej: Zona Norte, Centro, etc."
          className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-200"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-gray-700 font-medium">Precio de Envío *</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            name="shipping_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.shipping_price || ""}
            onChange={handleChange}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-sm pl-8 pr-3 py-2 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-200"
          />
        </div>
        {errors.shipping_price && (
          <p className="text-red-500 text-sm">{errors.shipping_price}</p>
        )}
        <p className="text-sm text-gray-500">
          Ingresa el costo de envío para esta zona
        </p>
      </div>

      <PostalCodeSelector
        selectedCodes={selectedPostalCodes}
        onChange={onPostalCodesChange}
        availablePostalCodes={availablePostalCodes}
        currentZoneId={currentZoneId || ""}
        allZones={allZones || []} // Pasar allZones al componente
      />

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-6 py-2 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? buttonLoadingText : buttonText}
        </button>
      </div>
    </form>
  );
}