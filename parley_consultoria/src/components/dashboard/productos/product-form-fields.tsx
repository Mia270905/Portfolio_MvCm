"use client";

import type React from "react";
import { useEffect, useRef } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PriceListCombobox } from "./price-list-combobox";
import { generateNameUnaccent } from "@/lib/text-utils";
import ImageUpload from "@/components/image-upload";
import { cn } from "@/lib/utils";
import { PriceListSelector, ProductPriceList } from "./price-list-selector";
import { TaxSelector } from "./tax-selector";

interface Category {
  id: string;
  title: string;
}

interface Measurement {
  id: string;
  unit: string;
  quantity: string;
}

interface PriceList {
  id: string;
  name: string;
  code?: string;
}

interface ProductFormFieldsProps {
  handleSubmit: (e: React.FormEvent) => void;
  formData: {
    code: string;
    bar_code: string;
    name: string;
    name_unaccent: string;
    description: string;
    image_url: string;
    image?: File | null;
    id_price_list?: string;
    category_id: string;
    cost_price: string;
    type: 'article' | 'service'; // Nuevo campo
    measure_unit?: string;
    is_available: boolean;
    price_lists?: ProductPriceList[];
  };
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleToggleAvailable: () => void;
  handleTypeChange?: (type: 'article' | 'service') => void; 
  errors: { [key: string]: string };
  categories: Category[];
  priceLists: PriceList[];
  measurements?: Measurement[];
  buttonText: string;
  buttonLoadingText: string;
  loading: boolean;
  onImageChange: (urlOrFile: string | File) => void;
  onAddPriceList?: (priceListId: string) => void;
  onRemovePriceList?: (priceListId: string) => void;
  onUpdatePrice?: (priceListId: string, price: string) => void;
  taxes?: { id: string; name: string; rate: number; tax_type: string }[];
  selectedTaxIds?: string[];
  onAddTax?: (taxId: string) => void;
  onRemoveTax?: (taxId: string) => void;
}

export default function ProductFormFields({
  handleSubmit,
  formData,
  handleChange,
  handleSelectChange,
  handleToggleAvailable,
  handleTypeChange, // Nueva prop
  errors,
  categories,
  priceLists,
  measurements = [],
  buttonText,
  buttonLoadingText,
  loading,
  onImageChange,
  onAddPriceList,
  onRemovePriceList,
  onUpdatePrice,
  taxes,
  selectedTaxIds,
  onAddTax,
  onRemoveTax,
}: ProductFormFieldsProps) {
  const hasAddedDefault = useRef(false);
  
  // Función para manejar el cambio de tipo si handleTypeChange no está definida
  const handleTypeChangeInternal = (type: 'article' | 'service') => {
    if (handleTypeChange) {
      handleTypeChange(type);
    } else {
      // Si no hay una función específica, usar handleSelectChange
      handleSelectChange("type", type);
    }
  };

  const handleImageUpload = (fileOrUrl: string | File) => {
    onImageChange(fileOrUrl);
  };

  useEffect(() => {
    if (!loading && formData.name) {
      handleChange({
        target: {
          name: "name_unaccent",
          value: generateNameUnaccent(formData.name),
        },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  }, [formData.name, loading]);

  useEffect(() => {
    if (!hasAddedDefault.current && priceLists.length > 0) {
      const defaultList = priceLists.find((pl) => pl.code === "default");

      if (defaultList && onAddPriceList) {
        const hasDefaultList = formData.price_lists?.some(
          (pl) => pl.id === defaultList.id
        );

        if (!hasDefaultList) {
          hasAddedDefault.current = true;
          onAddPriceList(defaultList.id);
        }
      }
    }
  }, [priceLists, onAddPriceList, formData.price_lists]);

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-[#0A0F17] rounded-lg border border-gray-800 p-4"
    >
      {/* Tipo de Producto */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300">
          Tipo de Producto <span className="text-red-400">*</span>
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Artículo */}
          <div
            onClick={() => handleTypeChangeInternal('article')}
            className={`relative cursor-pointer rounded-lg border-2 p-3 transition-all duration-200 ${
              formData.type === 'article'
                ? 'border-yellow-400 bg-yellow-400/10'
                : 'border-gray-700 bg-[#070B14] hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center rounded-full border-2 ${
                formData.type === 'article'
                  ? 'border-yellow-400 bg-yellow-400'
                  : 'border-gray-500'
              }`}>
                {formData.type === 'article' && (
                  <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">Artículo</h4>
              </div>
            </div>
          </div>

          {/* Servicio */}
          <div
            onClick={() => handleTypeChangeInternal('service')}
            className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
              formData.type === 'service'
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-gray-700 bg-[#070B14] hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center rounded-full border-2 ${
                formData.type === 'service'
                  ? 'border-blue-400 bg-blue-400'
                  : 'border-gray-500'
              }`}>
                {formData.type === 'service' && (
                  <div className="w-2 h-2 rounded-full bg-gray-900"></div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">Servicio</h4>
              </div>
            </div>
          </div>
        </div>
                
        {errors.type && (
          <p className="text-red-400 text-xs mt-1">{errors.type}</p>
        )}
      </div>

      {/* Código */}
      <div>
        <Label htmlFor="code" className="text-sm font-medium text-gray-300">
          Código <span className="text-red-400">*</span>
        </Label>
        <Input
          id="code"
          name="code"
          type="text"
          value={formData.code}
          onChange={handleChange}
          placeholder="Ej: AD001"
          className={`mt-1 bg-[#070B14] border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 ${
            errors.code ? "border-red-500" : ""
          }`}
          disabled={loading}
        />
        {errors.code && (
          <p className="text-red-400 text-xs mt-1">{errors.code}</p>
        )}
      </div>

      {/* Código de barras */}
      <div>
        <Label htmlFor="bar_code" className="text-sm font-medium text-gray-300">
          Código de barras
        </Label>
        <Input
          id="bar_code"
          name="bar_code"
          type="text"
          value={formData.bar_code}
          onChange={handleChange}
          placeholder="Ej: 7501234567890"
          className={`mt-1 bg-[#070B14] border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 ${
            errors.bar_code ? "border-red-500" : ""
          }`}
          disabled={loading}
        />
        {errors.bar_code && (
          <p className="text-red-400 text-xs mt-1">{errors.bar_code}</p>
        )}
      </div>

      {/* Nombre */}
      <div>
        <Label htmlFor="name" className="text-sm font-medium text-gray-300">
          Nombre {formData.type === 'article' ? 'del artículo' : 'del servicio'} <span className="text-red-400">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder={
            formData.type === 'article' 
              ? "Ej: Muslo de Pollo 1kg" 
              : "Ej: Servicio de Instalación"
          }
          className={`mt-1 bg-[#070B14] border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 ${
            errors.name ? "border-red-500" : ""
          }`}
          disabled={loading}
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          El nombre se convertirá automáticamente a formato sin acentos para búsquedas
        </p>
      </div>

      {/* Nombre sin acentos */}
      <div>
        <Label
          htmlFor="name_unaccent"
          className="text-sm font-medium text-gray-300"
        >
          Nombre para búsquedas
        </Label>
        <Input
          id="name_unaccent"
          name="name_unaccent"
          type="text"
          value={formData.name_unaccent}
          onChange={handleChange}
          placeholder="Se genera automáticamente del nombre"
          className="mt-1 bg-[#070B14] border-gray-700 text-gray-300 placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
          disabled={loading}
        />
        <p className="text-xs text-gray-400 mt-1">
          Se genera automáticamente en minúsculas sin acentos. Puedes editarlo si lo prefieres.
        </p>
      </div>

      {/* Descripción */}
      <div>
        <Label
          htmlFor="description"
          className="text-sm font-medium text-gray-300"
        >
          Descripción <span className="text-red-400">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder={
            formData.type === 'article' 
              ? "Describe las características del artículo..." 
              : "Describe el servicio ofrecido..."
          }
          rows={4}
          className={`mt-1 bg-[#070B14] border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 ${
            errors.description ? "border-red-500" : ""
          }`}
          disabled={loading}
        />
        {errors.description && (
          <p className="text-red-400 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      {/* Imagen */}
      <ImageUpload
        title={`Imagen ${formData.type === 'article' ? 'del artículo' : 'del servicio'}`}
        value={formData.image_url}
        onChange={handleImageUpload}
        error={errors.image_url}
      />

      {/* Categoría */}
      <div>
        <Label
          htmlFor="category_id"
          className="text-sm font-medium text-gray-300"
        >
          Categoría <span className="text-red-400">*</span>
        </Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => handleSelectChange("category_id", value)}
          disabled={loading}
        >
          <SelectTrigger
            className={`mt-1 bg-[#070B14] border-gray-700 text-white hover:border-yellow-400 ${
              errors.category_id ? "border-red-500" : ""
            }`}
          >
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent className="bg-[#0A0F17] border-gray-700">
            {categories.map((category) => (
              <SelectItem
                key={category.id}
                value={category.id}
                className="text-white hover:bg-yellow-400/10 focus:bg-yellow-400/10"
              >
                {category.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-red-400 text-xs mt-1">{errors.category_id}</p>
        )}
      </div>

      {/* Unidad de Medida - Condicional para artículos */}
        <div>
          <Label
            htmlFor="measure_unit"
            className="text-sm font-medium text-gray-300"
          >
            Unidad de Medida
          </Label>
          <Select
            value={formData.measure_unit || "none"} 
            onValueChange={(value) =>
              handleSelectChange("measure_unit", value === "none" ? "" : value)
            }
            disabled={loading}
          >
            <SelectTrigger
              className={`mt-1 bg-[#070B14] border-gray-700 text-white hover:border-yellow-400 ${
                errors.measure_unit ? "border-red-500" : ""
              }`}
            >
              <SelectValue placeholder="Selecciona una unidad de medida" />
            </SelectTrigger>
            <SelectContent className="bg-[#0A0F17] border-gray-700 max-h-60">
              <SelectItem
                value="none"
                className="text-gray-400 hover:bg-yellow-400/10 focus:bg-yellow-400/10"
              >
                Sin unidad específica
              </SelectItem>
              {measurements.map((measurement) => (
                <SelectItem
                  key={measurement.id}
                  value={measurement.id}
                  className="text-white hover:bg-yellow-400/10 focus:bg-yellow-400/10"
                >
                  {measurement.unit} ({measurement.quantity})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.measure_unit && (
            <p className="text-red-400 text-xs mt-1">{errors.measure_unit}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Unidad de medida para inventario y ventas (ej: kilogramos, litros, piezas)
          </p>
        </div>

      {/* Lista de precios */}
      <PriceListSelector
        priceLists={priceLists}
        selectedPriceLists={formData.price_lists || []}
        onAddPriceList={onAddPriceList || (() => {})}
        onRemovePriceList={onRemovePriceList || (() => {})}
        onUpdatePrice={onUpdatePrice || (() => {})}
        disabled={loading}
        errors={errors}
      />
      {errors.price_list && (
        <p className="text-red-400 text-xs mt-1">{errors.price_list}</p>
      )}

      {/* Precio de costo */}
      <div>
        <Label
          htmlFor="cost_price"
          className="text-sm font-medium text-gray-300"
        >
          Precio de costo <span className="text-red-400">*</span>
        </Label>
        <Input
          id="cost_price"
          name="cost_price"
          type="number"
          step="0.01"
          min="0"
          value={formData.cost_price}
          onChange={handleChange}
          placeholder="0.00"
          className={`mt-1 bg-[#070B14] border-gray-700 text-white placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 ${
            errors.cost_price ? "border-red-500" : ""
          }`}
          disabled={loading}
        />
        {errors.cost_price && (
          <p className="text-red-400 text-xs mt-1">{errors.cost_price}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Ingresa el precio en formato decimal (ej: 99.99)
        </p>
      </div>

      {/* Selector de impuestos */}
      {taxes && (
        <TaxSelector
          availableTaxes={taxes}
          selectedTaxIds={selectedTaxIds || []}
          onAddTax={onAddTax || (() => {})}
          onRemoveTax={onRemoveTax || (() => {})}
          disabled={loading}
        />
      )}

      {/* Disponibilidad */}
      <div className="space-y-2">
        <label className="block font-medium text-gray-300 mb-3">
          {formData.type === 'article' ? 'Artículo' : 'Servicio'} disponible
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleAvailable}
            disabled={loading}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 ${
              formData.is_available ? "bg-green-600" : "bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.is_available ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
              formData.is_available
                ? "bg-green-900/40 text-green-300 border-green-800"
                : "bg-red-900/40 text-red-300 border-red-800"
            }`}
          >
            {formData.is_available ? "Disponible" : "No disponible"}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {formData.is_available
            ? `El ${formData.type === 'article' ? 'artículo' : 'servicio'} está disponible`
            : `El ${formData.type === 'article' ? 'artículo' : 'servicio'} no está disponible`}
        </p>
      </div>

      {/* Botón de envío */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              {buttonLoadingText}
            </>
          ) : (
            buttonText
          )}
        </button>
      </div>
    </form>
  );
}