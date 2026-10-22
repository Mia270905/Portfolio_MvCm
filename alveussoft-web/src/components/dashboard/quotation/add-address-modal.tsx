"use client";

import { useState, useEffect } from "react";
import { X, MapPin, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveContactAddress } from "@/lib/actions/address.actions";

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  contactEmail?: string;
  onAddressAdded: (address: {
    id: string;
    street: string;
    exterior_number: string;
    interior_number?: string;
    neighborhood: string;
    postal_code: string;
    full_address: string;
  }) => void;
  initialAddress?: {
    street: string;
    exterior_number: string;
    interior_number?: string;
    neighborhood: string;
    postal_code: string;
  };
}

export default function AddAddressModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  contactPhone = "",
  contactEmail = "",
  onAddressAdded,
  initialAddress,
}: AddAddressModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [newAddress, setNewAddress] = useState({
    street: initialAddress?.street || "",
    exterior_number: initialAddress?.exterior_number || "",
    interior_number: initialAddress?.interior_number || "",
    neighborhood: initialAddress?.neighborhood || "",
    postal_code: initialAddress?.postal_code || "",
  });

  // Actualizar el formulario cuando cambia initialAddress o se abre el modal
  useEffect(() => {
    if (isOpen) {
      setNewAddress({
        street: initialAddress?.street || "",
        exterior_number: initialAddress?.exterior_number || "",
        interior_number: initialAddress?.interior_number || "",
        neighborhood: initialAddress?.neighborhood || "",
        postal_code: initialAddress?.postal_code || "",
      });
      setError("");
    }
  }, [isOpen, initialAddress]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleCreateAddress = async () => {
    // Validaciones
    if (!newAddress.street.trim()) {
      setError("La calle es obligatoria");
      return;
    }
    if (!newAddress.exterior_number.trim()) {
      setError("El número exterior es obligatorio");
      return;
    }
    if (!newAddress.neighborhood.trim()) {
      setError("La colonia/barrio es obligatoria");
      return;
    }
    if (!newAddress.postal_code.trim()) {
      setError("El código postal es obligatorio");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // NO GUARDAR EN BD - Solo construir los datos y retornarlos
      const fullAddress = `${newAddress.street} #${newAddress.exterior_number}${
        newAddress.interior_number ? ` Int. ${newAddress.interior_number}` : ""
      }, ${newAddress.neighborhood}, CP: ${newAddress.postal_code}`;

      const addressData = {
        id: "", // Será asignado un ID temporal por el componente padre
        street: newAddress.street,
        exterior_number: newAddress.exterior_number,
        interior_number: newAddress.interior_number,
        neighborhood: newAddress.neighborhood,
        postal_code: newAddress.postal_code,
        full_address: fullAddress,
      };

      onAddressAdded(addressData);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error al procesar dirección:", error);
      setError("Ocurrió un error al procesar la dirección");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewAddress({
      street: "",
      exterior_number: "",
      interior_number: "",
      neighborhood: "",
      postal_code: "",
    });
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[#0A0F17] w-full max-w-md rounded-xl max-h-[85vh] overflow-hidden flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-yellow-400" />
            <h2 className="text-lg font-semibold text-white">
              {initialAddress ? "Editar Dirección" : "Agregar Nueva Dirección"}
            </h2>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                Calle <span className="text-red-400">*</span>
              </label>
              <Input
                name="street"
                value={newAddress.street}
                onChange={handleAddressChange}
                placeholder="Nombre de la calle"
                className="bg-[#0F172A] border-gray-700 text-white placeholder:text-gray-500"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Número Exterior <span className="text-red-400">*</span>
                </label>
                <Input
                  name="exterior_number"
                  value={newAddress.exterior_number}
                  onChange={handleAddressChange}
                  placeholder="Ej: 123"
                  className="bg-[#0F172A] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  Número Interior
                </label>
                <Input
                  name="interior_number"
                  value={newAddress.interior_number}
                  onChange={handleAddressChange}
                  placeholder="Ej: 45"
                  className="bg-[#0F172A] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                Colonia/Barrio <span className="text-red-400">*</span>
              </label>
              <Input
                name="neighborhood"
                value={newAddress.neighborhood}
                onChange={handleAddressChange}
                placeholder="Nombre de la colonia"
                className="bg-[#0F172A] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                Código Postal <span className="text-red-400">*</span>
              </label>
              <Input
                name="postal_code"
                value={newAddress.postal_code}
                onChange={handleAddressChange}
                placeholder="Ej: 01000"
                className="bg-[#0F172A] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 p-4 bg-gray-900/50">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAddress}
              disabled={isSubmitting}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Guardar Dirección
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}