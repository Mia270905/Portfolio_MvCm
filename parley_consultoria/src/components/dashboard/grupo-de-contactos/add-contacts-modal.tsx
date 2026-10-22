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
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContactsIds, setSelectedContactsIds] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(0);

  // Cargar todas los contactos no seleccionados en el grupo de contactos actual
  useEffect(() => {
    const loadAvailableContacts = async () => {
      if (!isOpen) return;

      try {
        setLoading(true);
        const allContacts = await getAvailableContactsForGroup(contactGroupId, 1, 1000, "");
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
      toast.info("No has seleccionado ningún contacto");
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
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-[#f5efe6] rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-6 border-b border-[#f5efe6]">
          <div>
            <h3 className="text-xl font-medium text-neutral-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#c6a365]" />
              Agregar contactos al grupo
            </h3>
            <p className="text-sm text-neutral-600 mt-1">
              Selecciona los contactos que quieres agregar al grupo{" "}
              <span className="text-[#c6a365] font-medium">
                {contactGroupName}
              </span>
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-900 p-1 hover:bg-[#faf8f3] rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Búsqueda y controles */}
          <div className="p-4 border-b border-[#f5efe6] space-y-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar contactos por nombre, correo o teléfono..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#e6dcc9] rounded-lg bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50"
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-neutral-600">
                <span
                  className={
                    selectedContactsIds.length > 0
                      ? "text-[#c6a365]"
                      : "text-neutral-500"
                  }
                >
                  {selectedContactsIds.length} contacto{selectedContactsIds.length !== 1 ? 's' : ''} seleccionado{selectedContactsIds.length !== 1 ? 's' : ''}
                </span>
                <span className="text-neutral-400 ml-2">
                  de {filteredContacts.length} mostrado{filteredContacts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
                className="border border-[#e6dcc9] text-neutral-700 hover:bg-[#faf8f3] hover:text-neutral-900 hover:border-[#c6a365]"
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
                    className="h-16 bg-[#f5efe6] rounded animate-pulse"
                  ></div>
                ))}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12">
                <h4 className="text-lg font-medium text-neutral-900 mb-2">
                  {searchQuery
                    ? "No se encontraron resultados"
                    : "No hay contactos disponibles"}
                </h4>
                <p className="text-neutral-600 max-w-md mx-auto">
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
                          ? "bg-[#f5efe6] border-[#c6a365]"
                          : "bg-white border-[#f5efe6] hover:border-[#e6dcc9] hover:bg-[#faf8f3]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-5 h-5 flex items-center justify-center rounded border ${
                                isSelected
                                  ? "bg-[#c6a365] border-[#c6a365]"
                                  : "bg-white border-[#e6dcc9]"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <h4
                              className={`text-neutral-900 font-medium truncate ${
                                isSelected ? "text-[#c6a365]" : ""
                              }`}
                            >
                              {contact.full_name}
                            </h4>
                          </div>
                          <div className="ml-7">
                            {contact.email && (
                              <p className="text-sm text-neutral-600 truncate">
                                {contact.email}
                              </p>
                            )}
                            {(contact.phone || contact.mobile) && (
                              <p className="text-sm text-neutral-500">
                                {contact.phone || contact.mobile}
                                {contact.job_position && ` • ${contact.job_position}`}
                              </p>
                            )}
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
        <div className="p-4 border-t border-[#f5efe6]">
          <div className="flex items-center justify-between">
            {/* Estado de selección */}
            <div className="flex-1 min-w-0">
              {selectedContactsIds.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#c6a365] animate-pulse"></div>
                  <span className="text-[#c6a365] font-medium text-sm truncate">
                    {selectedContactsIds.length} seleccionado{selectedContactsIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neutral-400"></div>
                  <span className="text-neutral-500 text-sm truncate">
                    Selecciona contactos
                  </span>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <Button
                onClick={handleClose}
                variant="outline"
                size="sm"
                className="border border-[#e6dcc9] text-neutral-700 hover:bg-[#faf8f3] hover:text-neutral-900 hover:border-[#c6a365] px-4"
                disabled={saving}
              >
                Cancelar
              </Button>

              <Button
                onClick={handleProceedToConfirmation}
                size="sm"
                className={`px-4 ${
                  selectedContactsIds.length === 0
                    ? "bg-neutral-400 cursor-not-allowed hover:bg-neutral-400"
                    : "bg-[#c6a365] hover:bg-[#b59555] text-white"
                } shadow-sm hover:shadow-lg hover:shadow-[#c6a365]/25`}
                disabled={saving || selectedContactsIds.length === 0}
              >
                {selectedContactsIds.length > 0 ? (
                  <>
                    Agregar {selectedContactsIds.length} contacto{selectedContactsIds.length !== 1 ? 's' : ''}
                    {saving && (
                      <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    )}
                  </>
                ) : (
                  "Agregar contactos"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}