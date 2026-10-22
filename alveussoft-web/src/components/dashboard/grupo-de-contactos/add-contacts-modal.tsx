"use client";

import { useState, useEffect } from "react";
import {
  X,
  Check,
  Search,
  AlertCircle,
  Building,
  Users,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { 
  Contact, 
  createGroupContacts, 
  getAllContacts, 
  getAvailableContactsForGroup } from "@/lib/actions/contact.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getContactGroupById } from "@/lib/actions/contact_group.actions";

interface AddContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactGroupId: string;
  contactGroupName?: string;
  onSuccess?: () => void;
}

export function AddContactsModal({
  isOpen,
  onClose,
  contactGroupId,
  contactGroupName = "este grupo",
  onSuccess,
}: AddContactsModalProps) {
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]); // Todos los contactos
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]); // Contactos filtrados
  const [selectedContactsIds, setSelectedContactsIds] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(0); // 0: principal, 1: advertencias, 2: resumen


  // Cargar todas los contactos no seleccionados en el grupo de contactos actual
  useEffect(() => {
    const loadAvailableContacts = async () => {
      if (!isOpen) return;

      try {
        setLoading(true);
        const allContacts = await getAvailableContactsForGroup(contactGroupId,1, 1000, "");
        // Ordenar por nombre
        allContacts.contacts.sort((a, b) => a.full_name.localeCompare(b.full_name));

        setAvailableContacts(allContacts.contacts);
        setFilteredContacts(allContacts.contacts);

        // Inicializar selecciones vacías
        setSelectedContactsIds([]);
        setSelectedContacts([]);
        setConfirmationStep(0);
      } catch (error) {
        console.error("Error al cargar contactos disponibles:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAvailableContacts();
  }, [isOpen, contactGroupId]);

  // Actualizar lista de contactos seleccionados cuando cambian los IDs
  useEffect(() => {
    const selected = availableContacts.filter((contact) =>
      selectedContactsIds.includes(contact.id)
    );
    setSelectedContacts(selected);
  }, [selectedContactsIds, availableContacts]);

  // Filtrar empresas por búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredContacts(availableContacts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = availableContacts.filter(
      (contact) =>
      contact.full_name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      (contact.phone && contact.phone.toLowerCase().includes(query)) ||
      (contact.mobile && contact.mobile.toLowerCase().includes(query)) ||
      (contact.job_position &&
      contact.job_position.toLowerCase().includes(query))
    );
    setFilteredContacts(filtered);
  }, [searchQuery, availableContacts]);

  const toggleContactSelection = (contactId: string) => {
    setSelectedContactsIds((prev) => {
      if (prev.includes(contactId)) {
        return prev.filter((id) => id !== contactId);
      } else {
        return [...prev, contactId];
      }
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredContacts.map((contact) => contact.id);

    // Verificar si ya están todos seleccionados
    const allSelected = allFilteredIds.every((id) =>
      selectedContactsIds.includes(id)
    );

    if (allSelected) {
      // Deseleccionar solo los que están en la lista filtrada
      setSelectedContactsIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id))
      );
    } else {
      // Agregar todos los filtrados que no estén ya seleccionados
      const newSelections = allFilteredIds.filter(
        (id) => !selectedContactsIds.includes(id)
      );
      setSelectedContactsIds((prev) => [...prev, ...newSelections]);
    }
  };

  const handleProceedToConfirmation = () => {
    if (selectedContactsIds.length === 0) {
      toast.info("No has seleccionado ningun contacto");
      return;
    }

    handleSave();
  };

  const handleSave = async () => {
    if (selectedContactsIds.length === 0) return;

    try {
      setSaving(true);

      const result = await createGroupContacts({
        id_contact_groups: contactGroupId,
        contactIds: selectedContactsIds,
      });

      if (!result.success) {
        toast.error("No se pudieron agregar los contactos");
        return;
      }

      toast.success(
        `Se agregaron ${result.inserted} contactos correctamente`
      );

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error al guardar contactos:", error);
      toast.error("Ocurrió un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedContactsIds([]);
    setSelectedContacts([]);
    setShowConfirmation(false);
    setConfirmationStep(0);
    onClose();
  };


  // Verificar si todos los filtrados están seleccionados
  const allFilteredSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((contact) =>
      selectedContactsIds.includes(contact.id)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0A0F17] border border-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-green-400" />
              Agregar contactos al grupo
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Selecciona los contactos que quieres agregar al grupo{" "}
              <span className="text-green-300 font-medium">
                {contactGroupName}
              </span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Búsqueda y controles */}
          <div className="p-4 border-b border-gray-800 space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar contactos por nombre, correo o telefono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-[#070B14] text-white placeholder-gray-500"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400">
                <span
                  className={
                    selectedContactsIds.length > 0
                      ? "text-green-400"
                      : "text-amber-400"
                  }
                >
                  {selectedContactsIds.length} contactos(s) seleccionado(s)
                </span>
                <span className="text-gray-500 ml-2">
                  de {filteredContacts.length} mostradas
                </span>
              </div>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled={filteredContacts.length === 0}
              >
                {allFilteredSelected && filteredContacts.length > 0
                  ? "Deseleccionar todos"
                  : "Seleccionar todos"}
              </Button>
            </div>
          </div>

          {/* Lista de contactos */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, idx) => (
                  <div
                    key={idx}
                    className="h-16 bg-gray-800/30 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                {/* <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/50 mb-3">
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                </div> */}
                <h4 className="text-lg font-medium text-white mb-2">
                  {searchQuery
                    ? "No se encontraron resultados"
                    : "No hay contactos disponibles"}
                </h4>
                <p className="text-gray-400 max-w-md mx-auto">
                  {searchQuery
                    ? `No hay contactos que coincidan con "${searchQuery}"`
                    : "Todos los contactos ya están en este grupo."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContactsIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => toggleContactSelection(contact.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-green-400/10 border-green-500/50"
                          : "bg-[#070B14] border-gray-800 hover:border-gray-700 hover:bg-gray-800/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-5 h-5 flex items-center justify-center rounded border ${
                                isSelected
                                  ? "bg-green-500 border-green-500"
                                  : "bg-[#0A0F17] border-gray-600"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <h4
                              className={`text-white font-medium truncate ${
                                isSelected ? "text-green-300" : ""
                              }`}
                            >
                              {contact.full_name}
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center justify-between">
            {/* Estado de selección - Móvil compacto */}
            <div className="flex-1 min-w-0">
              {selectedContactsIds.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="hidden xs:block w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-400 font-medium text-sm truncate">
                    {selectedContactsIds.length} seleccionadas
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="hidden xs:block w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-amber-400 text-sm truncate">
                    Selecciona contactos
                  </span>
                </div>
              )}
            </div>

            {/* Botones - Iconos en móvil, texto en desktop */}
            <div className="flex gap-2">
              {/* Botón Cancelar */}
              <Button
                onClick={handleClose}
                variant="outline"
                size="sm"
                className="p-2 sm:px-4 sm:py-2"
                disabled={saving}
              >
                <span className="hidden sm:inline">Cancelar</span>
                <X className="h-4 w-4 sm:hidden" />
              </Button>

              <Button
                onClick={handleProceedToConfirmation}
                size="sm"
                className={`p-2 sm:px-4 sm:py-2 ${
                  selectedContactsIds.length === 0
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                } text-white`}
                disabled={saving || selectedContactsIds.length === 0}
              >
                {selectedContactsIds.length > 0 ? (
                  <>
                    <span className="hidden sm:inline">Continuar</span>
                    <span className="sm:hidden">Continuar</span>
                    <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                      {selectedContactsIds.length}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Continuar</span>
                    <span className="sm:hidden">→</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

