"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Check, Plus, ChevronDown, ChevronRight, Trash2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { DeletePostalCodeDialog } from "./delete-postal-code-dialog";

interface Zone {
  id: string;
  name: string;
}

interface PostalCode {
  id: string;
  code: string;
  zone_id: string | null;
  zone?: Zone; // Información de la zona a la que pertenece
}

interface PostalCodeSelectorProps {
  selectedCodes: string[];
  onChange: (codes: string[]) => void;
  availablePostalCodes: PostalCode[];
  currentZoneId: string;
  currentUserId?: string;
  allZones?: Zone[]; // Lista de todas las zonas para mostrar información
}

export default function PostalCodeSelector({
  selectedCodes,
  onChange,
  availablePostalCodes,
  currentZoneId,
  currentUserId,
  allZones = [],
}: PostalCodeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAssignedToOthers, setShowAssignedToOthers] = useState(false);
  const [localPostalCodes, setLocalPostalCodes] = useState<PostalCode[]>([]);
  const [postalCodeToDelete, setPostalCodeToDelete] = useState<PostalCode | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Enriquecer los códigos postales con información de la zona
  const enrichedPostalCodes = useMemo(() => {
    return availablePostalCodes.map(pc => ({
      ...pc,
      zone: allZones.find(zone => zone.id === pc.zone_id)
    }));
  }, [availablePostalCodes, allZones]);

  // Inicializa los códigos locales con los disponibles enriquecidos
  useEffect(() => {
    setLocalPostalCodes(enrichedPostalCodes);
  }, [enrichedPostalCodes]);

  const filteredPostalCodes = useMemo(() => {
    return localPostalCodes.filter((pc) =>
      pc.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localPostalCodes, searchTerm]);

  const categorizedCodes = useMemo(() => {
    const selected: PostalCode[] = [];
    const availableUnassigned: PostalCode[] = [];
    const assignedToOthers: PostalCode[] = [];

    filteredPostalCodes.forEach((pc) => {
      if (selectedCodes.includes(pc.code)) {
        selected.push(pc);
      } else if (!pc.zone_id || pc.zone_id === currentZoneId) {
        availableUnassigned.push(pc);
      } else {
        assignedToOthers.push(pc);
      }
    });

    return { selected, availableUnassigned, assignedToOthers };
  }, [filteredPostalCodes, selectedCodes, currentZoneId]);

  const handleToggleCode = (pc: PostalCode) => {
    if (pc.zone_id && pc.zone_id !== currentZoneId) return;

    if (selectedCodes.includes(pc.code)) {
      onChange(selectedCodes.filter((c) => c !== pc.code));
    } else {
      onChange([...selectedCodes, pc.code]);
    }
  };

  const handleCreatePostalCode = () => {
    const code = searchTerm.trim();
    if (!code || code.length < 5) {
      toast.warning("El código postal debe tener al menos 5 caracteres.");
      return;
    }

    const alreadyExists = localPostalCodes.some(
      (pc) => pc.code.toLowerCase() === code.toLowerCase()
    );
    if (alreadyExists) {
      toast.warning("Este código postal ya existe.");
      return;
    }

    const newCode: PostalCode = {
      id: `local-${Date.now()}`,
      code,
      zone_id: currentZoneId,
      zone: allZones.find(zone => zone.id === currentZoneId)
    };

    setLocalPostalCodes([...localPostalCodes, newCode]);
    onChange([...selectedCodes, code]);
    setSearchTerm("");
    toast.success(`Código postal "${code}" creado correctamente`);
  };

  const handleDeletePostalCode = (postalCodeId: string) => {
    const deletedCode = localPostalCodes.find(pc => pc.id === postalCodeId);
    setLocalPostalCodes(prev => prev.filter(pc => pc.id !== postalCodeId));
    
    if (deletedCode && selectedCodes.includes(deletedCode.code)) {
      onChange(selectedCodes.filter(c => c !== deletedCode.code));
    }

    setPostalCodeToDelete(null);
    setDeleteDialogOpen(false);
  };

  const canDeletePostalCode = (pc: PostalCode) => {
    return !pc.zone_id || pc.zone_id === currentZoneId;
  };

  const showCreateOption =
    searchTerm.trim().length >= 5 &&
    !localPostalCodes.some(
      (pc) => pc.code.toLowerCase() === searchTerm.toLowerCase()
    );

  return (
    <div className="space-y-4">
      <DeletePostalCodeDialog
        postalCode={postalCodeToDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDelete={handleDeletePostalCode}
      />

      <div className="flex items-center justify-between">
        <label className="text-gray-700 font-medium">Códigos Postales</label>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.replace(/\D/g, ""))}
          placeholder="Buscar código postal..."
          className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 transition-colors duration-200"
        />
      </div>

      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
        <div className="max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreatePostalCode}
              className="w-full flex items-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 text-sm border-b border-yellow-200 hover:bg-yellow-100 transition-colors"
            >
              <Plus className="w-4 h-4" /> Crear `&quot;`{searchTerm}`&quot;`
            </button>
          )}

          {/* Seleccionados */}
          {categorizedCodes.selected.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="bg-blue-50 px-4 py-2 border-b border-blue-100">
                <h3 className="text-sm font-semibold text-blue-900">
                  Seleccionados ({categorizedCodes.selected.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {categorizedCodes.selected.map((pc) => (
                  <div
                    key={pc.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50 transition-colors group"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedCodes.includes(pc.code)}
                          onChange={() => handleToggleCode(pc)}
                          className="w-5 h-5 rounded border-2 border-blue-500 text-blue-600 focus:ring-2 focus:ring-blue-300 focus:ring-offset-0 cursor-pointer"
                        />
                        <Check className="absolute w-3.5 h-3.5 text-white pointer-events-none" />
                      </div>
                      <span className="font-medium text-gray-900">{pc.code}</span>
                    </label>
                    
                    {canDeletePostalCode(pc) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPostalCodeToDelete(pc);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar código postal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disponibles */}
          {categorizedCodes.availableUnassigned.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                  Disponibles ({categorizedCodes.availableUnassigned.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {categorizedCodes.availableUnassigned.map((pc) => (
                  <div
                    key={pc.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={selectedCodes.includes(pc.code)}
                        onChange={() => handleToggleCode(pc)}
                        className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-300 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-gray-700">{pc.code}</span>
                    </label>
                    
                    {canDeletePostalCode(pc) && (
                      <button
                        type="button"
                        onClick={() => {
                          setPostalCodeToDelete(pc);
                          setDeleteDialogOpen(true);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Eliminar código postal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asignados a otras zonas */}
          {categorizedCodes.assignedToOthers.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() =>
                  setShowAssignedToOthers(!showAssignedToOthers)
                }
                className="flex items-center justify-between w-full bg-gray-100 px-4 py-2 border-b border-gray-200 hover:bg-gray-200 transition-colors"
              >
                <h3 className="text-sm font-semibold text-gray-600">
                  Asignados a otras zonas (
                  {categorizedCodes.assignedToOthers.length})
                </h3>
                {showAssignedToOthers ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {showAssignedToOthers && (
                <div className="divide-y divide-gray-100">
                  {categorizedCodes.assignedToOthers.map((pc) => (
                    <div
                      key={pc.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 opacity-50 cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={false}
                          disabled
                          className="w-5 h-5 rounded border-2 border-gray-300 cursor-not-allowed"
                        />
                        <div className="flex flex-col">
                          <span className="text-gray-500">{pc.code}</span>
                          {pc.zone && (
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                Zona: {pc.zone.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="w-4 h-4"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sin resultados */}
          {filteredPostalCodes.length === 0 && !showCreateOption && (
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500">
                No se encontraron códigos postales
              </p>
              {searchTerm && (
                <p className="text-sm text-gray-400 mt-1">
                  Intenta con otro término de búsqueda
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Selecciona los códigos postales que pertenecen a esta zona. También
        puedes crear uno nuevo si no existe.
      </p>
    </div>
  );
}