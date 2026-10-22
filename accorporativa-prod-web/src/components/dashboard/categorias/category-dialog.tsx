"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { ProductCategory } from "./category-list";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "@/components/image-upload";

interface CategoryDialogProps {
  category: ProductCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (category: Partial<ProductCategory>) => void;
  isLoading?: boolean;
  onImageChange: (urlOrFile: string | File) => void;
  errors: { [key: string]: string };
}

export function CategoryDialog({
  category,
  open,
  onOpenChange,
  onSave,
  isLoading,
  onImageChange,
  errors,
}: CategoryDialogProps) {
  const [formData, setFormData] = useState<Partial<ProductCategory>>({
    title: "",
    description: "",
    image_url: "",
    active: true,
  });

  useEffect(() => {
    if (category) {
      setFormData(category);
    } else {
      setFormData({
        title: "",
        description: "",
        image_url: "",
        active: true,
      });
    }
  }, [category, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleImageChange = (urlOrFile: string | File) => {
    onImageChange(urlOrFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white border border-gray-200 shadow-xs rounded-lg mx-4">
        <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-lg sm:text-xl">
              {category ? "Editar Categoría" : "Crear Nueva Categoría"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm sm:text-base">
              {category
                ? "Modifica los detalles de la categoría"
                : "Completa la información para crear una nueva categoría"}
            </DialogDescription>
          </DialogHeader>

          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-gray-700 text-sm sm:text-base"
            >
              Título *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ej: Electrónica"
              required
              disabled={isLoading}
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-gray-700 text-sm sm:text-base"
            >
              Descripción *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe la categoría..."
              rows={3}
              required
              disabled={isLoading}
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base min-h-[80px]"
            />
          </div>

          {/* Image URL */}
          {/* <div className="space-y-2">
            <Label htmlFor="image_url" className="text-gray-700 text-sm sm:text-base">URL de Imagen</Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://ejemplo.com/imagen.jpg"
              disabled={isLoading}
              className="border-gray-300 focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            />
            <p className="text-xs sm:text-sm text-gray-500">Proporciona una URL de imagen para la categoría</p>
          </div> */}
          <ImageUpload title={"Imagen de la categoría"} value={formData.image_url} onChange={handleImageChange} error={errors.image_url} />

          {/* Active Status */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5 flex-1">
              <Label
                htmlFor="active"
                className="text-gray-700 text-sm sm:text-base"
              >
                Estado Activo
              </Label>
              <p className="text-xs sm:text-sm text-gray-500">
                Las categorías inactivas no se mostrarán en el catálogo
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
              disabled={isLoading}
              className={`${
                formData.active ? "bg-green-500" : "bg-gray-300"
              } flex-shrink-0`}
            />
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#4F46E5] hover:bg-[#6366F1] text-white w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading
                ? "Guardando..."
                : category
                ? "Guardar Cambios"
                : "Crear Categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
