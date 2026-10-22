"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { getContactGroups } from "@/lib/actions/contact.actions";
import { getGroupsByContactId, updateContactGroups } from "@/lib/actions/contact.actions";

interface ContactGroupsSectionProps {
  contactId: string;
}

interface GroupOption {
  id: string;
  title: string;
  selected: boolean;
}

export function ContactGroupsSection({ contactId }: ContactGroupsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<GroupOption[]>([]);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        // Cargar todos los grupos disponibles (para mostrarlos todos)
        const allGroups = await getContactGroups();
        
        // Cargar grupos donde este contacto ya está
        const contactGroups = await getGroupsByContactId(contactId);
        const contactGroupIds = contactGroups.map(g => g.id);

        const groupsWithSelection = allGroups.map(group => ({
          ...group,
          selected: contactGroupIds.includes(group.id)
        }));

        setGroups(groupsWithSelection);
      } catch (error) {
        console.error("Error cargando grupos:", error);
        toast.error("Error al cargar los grupos");
      } finally {
        setLoading(false);
      }
    };

    if (contactId) {
      loadGroups();
    }
  }, [contactId]);

  const handleToggleGroup = (groupId: string) => {
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, selected: !g.selected } : g
    ));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const selectedGroupIds = groups.filter(g => g.selected).map(g => g.id);
      
      const result = await updateContactGroups(contactId, selectedGroupIds);
      
      if (result.success) {
        toast.success("Grupos actualizados correctamente");
      } else {
        toast.error(result.message || "Error al actualizar los grupos");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error inesperado al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0A0F17] rounded-lg border border-gray-800">
        <Loader2 className="h-8 w-8 text-yellow-400 animate-spin mb-4" />
        <p className="text-gray-400">Cargando grupos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              Grupos Asociados
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Selecciona los grupos a los que pertenece este contacto.
            </p>
          </div>
        </div>

        {groups.length === 0 ? (
          <div className="text-center p-8 bg-[#070B14] rounded-lg border border-gray-800">
            <p className="text-gray-400">No hay grupos disponibles creados.</p>
            <p className="text-sm text-gray-500 mt-2">Puedes crear grupos en la sección de "Grupos de Contactos".</p>
          </div>
        ) : (
          <div className="grid gap-3 mb-6">
            {groups.map((group) => (
              <label 
                key={group.id} 
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                  group.selected 
                    ? "bg-yellow-400/10 border-yellow-400/50" 
                    : "bg-[#070B14] border-gray-800 hover:border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    group.selected ? "bg-yellow-400 border-yellow-400" : "border-gray-600"
                  }`}>
                    {group.selected && (
                      <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 text-black">
                        <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={`font-medium ${group.selected ? "text-white" : "text-gray-300"}`}>
                    {group.title}
                  </span>
                </div>
                {/* Checkbox oculto para accesibilidad */}
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={group.selected}
                  onChange={() => handleToggleGroup(group.id)}
                />
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-800">
          <button
            onClick={handleSave}
            disabled={saving || groups.length === 0}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg text-sm transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
