import { useState } from "react";
import type { MeasurementForList } from "@/lib/definitions"; 
import { Ruler, MoreVertical } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { DeleteMeasurementDialog } from "./measurement-delete-dialog";

interface MeasurementItemProps {
  measurement: MeasurementForList; 
  onEdit: (measurement: MeasurementForList) => void;
  onDelete: (measurementId: string) => void;
  userPermissions?: string[];
}

export default function MeasurementItem({
  measurement,
  onEdit,
  onDelete,
  userPermissions = [],
}: MeasurementItemProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const canUpdate = userPermissions.includes("update:measurement");
  const canDelete = userPermissions.includes("delete:measurement");

  const handleEdit = () => {
    router.push(`/dashboard/productos/unidades-medida/editar/${measurement.id}`);
    setPopoverOpen(false);
  };

  return (
    <div className="mb-3">
      <div className="flex items-start justify-between p-4 rounded-lg bg-[#0A0F17] border border-gray-800 hover:border-yellow-400/30 transition-all cursor-pointer">
        {/* Icono */}
        <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mr-4 flex-shrink-0">
          <Ruler className="w-5 h-5 text-yellow-400" />
        </div>

        {/* Contenido principal - horizontal */}
        <div className="flex-1 min-w-0">
          {/* Fila superior: Unidad y cantidad */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-semibold text-white">
                {measurement.unit}
              </h3>
            </div>
            <div className="text-sm text-gray-300">
              Cantidad: <span className="font-medium">{measurement.quantity}</span>
            </div>
          </div>

          {/* Fila media: Referencia y UNSPSC */}
          <div className="flex items-center gap-6 mb-3">
            {/* Referencia */}
            {measurement.reference && measurement.parent_measurement && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Referencia:</span>
                <span className="text-sm text-gray-300">
                  {measurement.parent_measurement.unit} ({measurement.parent_measurement.quantity})
                </span>
              </div>
            )}

            {/* UNSPSC */}
            {measurement.unspsc && measurement.unspsc_data && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">UNSPSC:</span>
                <span className="text-sm text-gray-300">
                  {measurement.unspsc_data.code} - {measurement.unspsc_data.name}
                </span>
              </div>
            )}
          </div>

          {/* Fila inferior: Fechas */}
          <div className="flex items-center gap-6 text-xs text-gray-500 pt-3 border-t border-gray-800">
            <div>
              <span className="text-gray-400">Creado: </span>
              <span className="text-gray-300">
                {new Date(measurement.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
            
            <div>
              <span className="text-gray-400">Actualizado: </span>
              <span className="text-gray-300">
                {new Date(measurement.updated_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        {(canUpdate || canDelete) && (
          <div className="flex items-start flex-shrink-0 ml-4">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="p-1.5 hover:bg-yellow-400/10 rounded transition-colors">
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-40 p-2 bg-[#0A0F17] border border-gray-700 rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  {canUpdate && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-400 rounded transition-colors"
                      onClick={handleEdit}
                    >
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded transition-colors"
                      onClick={handleDeleteClick}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DeleteMeasurementDialog
              measurementId={measurement.id}
              measurementUnit={measurement.unit}
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}