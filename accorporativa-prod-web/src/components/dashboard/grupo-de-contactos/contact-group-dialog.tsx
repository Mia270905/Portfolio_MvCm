"use client";

import type React from "react";
import { useState, useEffect } from "react";
import type { ContactGroup } from "./contact-group-list";
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

interface ContactGroupDialogProps {
  contactGroup: ContactGroup | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contactGroup: Partial<ContactGroup>) => void;
  isLoading?: boolean;
  onImageChange: (urlOrFile: string | File) => void;
  errors: { [key: string]: string };
}

export function ContactGroupDialog({
  contactGroup,
  open,
  onOpenChange,
  onSave,
  isLoading,
  onImageChange,
  errors,
}: ContactGroupDialogProps) {
  const [formData, setFormData] = useState<Partial<ContactGroup>>({
    title: "",
    description: "",
    image_url: "",
    active: true,
  });

  useEffect(() => {
    if (contactGroup) {
      setFormData(contactGroup);
    } else {
      setFormData({
        title: "",
        description: "",
        image_url: "",
        active: true,
      });
    }
  }, [contactGroup, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleImageChange = (urlOrFile: string | File) => {
    onImageChange(urlOrFile);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-card border-border shadow-sm rounded-lg mx-4">
        <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-card-foreground text-lg sm:text-xl">
              {contactGroup ? "Editar Grupo de Contactos" : "Crear Nuevo Grupo de Contactos"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm sm:text-base">
              {contactGroup
                ? "Modifica los detalles del grupo de contactos"
                : "Completa la información para crear un nuevo grupo de contactos"}
            </DialogDescription>
          </DialogHeader>

          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-card-foreground text-sm sm:text-base"
            >
              Título *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ej: Grupo de Proveedores"
              required
              disabled={isLoading}
              className="border-input focus:ring-2 focus:ring-primary text-sm sm:text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-card-foreground text-sm sm:text-base"
            >
              Descripción *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe el grupo de contactos..."
              rows={3}
              required
              disabled={isLoading}
              className="border-input focus:ring-2 focus:ring-primary text-sm sm:text-base min-h-[80px]"
            />
          </div>

          {/* Image Upload */}
          <ImageUpload 
            title={"Imagen del grupo de contacto"} 
            value={formData.image_url} 
            onChange={handleImageChange} 
            error={errors.image_url} 
          />

          {/* Active Status */}
          <div className="flex items-center justify-between py-2">
            <div className="space-y-0.5 flex-1">
              <Label
                htmlFor="active"
                className="text-card-foreground text-sm sm:text-base"
              >
                Estado Activo
              </Label>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Los grupos de contactos inactivos no se mostrarán en el catálogo
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
                formData.active ? "bg-green-500" : "bg-muted"
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
              className="border-input text-muted-foreground hover:bg-muted w-full sm:w-auto order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto order-1 sm:order-2"
            >
              {isLoading
                ? "Guardando..."
                : contactGroup
                ? "Guardar Cambios"
                : "Crear Grupo de Contactos"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}