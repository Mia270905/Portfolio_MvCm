'use client'

import { useState } from 'react'
import type { Zone } from "@/lib/actions/zone.actions"
import { Pencil, MapPin, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { DeleteZoneDialog } from './delete-zone-dialog' 

interface PostalCode {
  id: string;
  code: string;
  zone_id: string;
}

interface ZoneWithPostalCodes extends Zone {
  postal_codes?: PostalCode[];
}

interface ZoneItemProps {
  zone: ZoneWithPostalCodes;
  onEdit: (zone: Zone) => void;
  onDelete: (zoneId: string) => void;
  userPermissions?: string[];
  highlightedPostalCode?: string;
  searchQuery?: string;
}

export default function ZoneItem({
  zone,
  onEdit,
  onDelete,
  userPermissions = [],
  highlightedPostalCode = "",
  searchQuery = "",
}: ZoneItemProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const canUpdateZones = userPermissions.includes("update:zones")
  const canDeleteZones = userPermissions.includes("delete:zones")

  // Función para determinar si un código postal debe ser resaltado
  const shouldHighlightPostalCode = (postalCode: string) => {
    if (!highlightedPostalCode) return false;
    return postalCode.includes(highlightedPostalCode);
  };

  // Función para determinar si la zona debe tener borde rojo
  const hasMatchingPostalCode = zone.postal_codes?.some(pc => 
    shouldHighlightPostalCode(pc.code)
  );

  return (
    <>
      <div className={`flex flex-col gap-4 bg-white rounded-lg shadow-xs border ${
        hasMatchingPostalCode 
          ? 'border-red-300 ring-2 ring-red-100' 
          : 'border-gray-200'
      } p-4 hover:shadow-sm transition-all duration-200`}>
        
        {/* Header con indicador de coincidencia */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              hasMatchingPostalCode ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <MapPin className={`w-5 h-5 sm:w-6 sm:h-6 ${
                hasMatchingPostalCode ? 'text-red-600' : 'text-blue-600'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  {zone.name}
                </h3>
                {hasMatchingPostalCode && (
                  <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-md">
                    Coincidencia
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                Precio de envío:{" "}
                <span className="font-semibold text-green-600">
                  ${zone.shipping_price.toFixed(2)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex justify-end sm:justify-start space-x-2 flex-shrink-0">
            {canUpdateZones && (
              <button
                onClick={() => router.push(`/dashboard/envios/zonas/editar/${zone.id}`)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Editar zona"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
            {canDeleteZones && (
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Eliminar zona"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {zone.postal_codes && zone.postal_codes.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Códigos Postales ({zone.postal_codes.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {zone.postal_codes.map((pc) => (
                <span
                  key={pc.id}
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${
                    shouldHighlightPostalCode(pc.code)
                      ? 'bg-red-100 text-red-800 border-red-300 ring-2 ring-red-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  } transition-all duration-200`}
                >
                  {pc.code}
                  {shouldHighlightPostalCode(pc.code) && (
                    <span className="ml-1 animate-pulse">✓</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <DeleteZoneDialog
        zoneId={zone.id}
        zoneName={zone.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={onDelete}
      />
    </>
  )
}