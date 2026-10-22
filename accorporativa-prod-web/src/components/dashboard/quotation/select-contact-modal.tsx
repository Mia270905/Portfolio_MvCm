"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  User,
  Mail,
  Phone,
  Briefcase,
  X,
  Check,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { searchContacts, type Contact } from "@/lib/actions/contact.actions";

interface SelectContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectContact: (contact: Contact) => void;
}

export function SelectContactModal({
  isOpen,
  onClose,
  onSelectContact,
}: SelectContactModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalContacts, setTotalContacts] = useState(0);
  const pageSize = 20; // Número de contactos por página

  // Cargar contactos con paginación
  const loadContacts = useCallback(async (page = 1, query = "") => {
    if (!isOpen) return;

    try {
      setLoading(true);
      const result = await searchContacts(query);
      
      // result no tiene las propiedades .contacts, .total, .totalPages, .page
      // se usa el resultado directo como arreglo de contactos
      setContacts(result as unknown as Contact[]);
      // setContacts(result.contacts);
      // setTotalContacts(result.total);
      // setTotalPages(result.totalPages);
      // setCurrentPage(result.page);
      
      if (page === 1) {
        setSelectedContactId(null);
      }
    } catch (error) {
      console.error("Error al cargar contactos:", error);
      setContacts([]);
      setTotalPages(0);
      setTotalContacts(0);
    } finally {
      setLoading(false);
    }
  }, [isOpen, pageSize]);

  // Cargar contactos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadContacts(1, "");
      setSearchInput("");
      setSearchQuery("");
    }
  }, [isOpen, loadContacts]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Cargar contactos cuando cambia la query o la página
  useEffect(() => {
    if (isOpen) {
      loadContacts(1, searchQuery);
    }
  }, [searchQuery, isOpen, loadContacts]);

  // Cambiar página
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    loadContacts(newPage, searchQuery);
  };

  const handleContactSelect = () => {
    if (!selectedContactId) return;

    const selectedContact = contacts.find(
      (contact) => contact.id === selectedContactId
    );
    if (selectedContact) {
      onSelectContact(selectedContact);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedContactId(null);
    setSearchInput("");
    setCurrentPage(1);
    onClose();
  };

  // Renderizar paginación
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between border-t border-gray-700 pt-4 mt-4">
        <div className="text-sm text-gray-400">
          Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalContacts)} de {totalContacts} contactos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="border-gray-600 text-gray-400 hover:text-gray-200 hover:border-yellow-400"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className={
                    currentPage === pageNum
                      ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                      : "border-gray-600 text-gray-400 hover:text-gray-200 hover:border-yellow-400"
                  }
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="border-gray-600 text-gray-400 hover:text-gray-200 hover:border-yellow-400"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col bg-[#0A0F17] border border-gray-700" aria-describedby="select-contact-description">
        {/* Encabezado */}
        <DialogHeader className="border-b border-gray-700 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-400/20">
                <User className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-200">
                  Seleccionar Cliente
                </DialogTitle>
                <DialogDescription id="select-contact-description" className="text-sm text-gray-400 mt-1">
                  Busca y selecciona un cliente para la cotización
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Búsqueda */}
          <div className="p-4 border-b border-gray-700">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar contactos por nombre, email o teléfono..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setCurrentPage(1); // Resetear a página 1 al buscar
                }}
                className="pl-10 bg-[#0F172A] border-gray-600 text-gray-200 placeholder-gray-500 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* Lista de contactos */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading && currentPage === 1 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-3" />
                <p className="text-gray-400">Cargando contactos...</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-3">
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-200 mb-2">
                  {searchQuery
                    ? "No se encontraron resultados"
                    : "No hay contactos disponibles"}
                </h4>
                <p className="text-gray-400 max-w-md mx-auto">
                  {searchQuery
                    ? `No hay contactos que coincidan con "${searchQuery}"`
                    : "No se encontraron contactos en el sistema."}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {contacts.map((contact) => {
                    const isSelected = selectedContactId === contact.id;
                    return (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContactId(contact.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all duration-200 ${
                          isSelected
                            ? "bg-yellow-400/10 border-yellow-400/50"
                            : "bg-[#0F172A] border-gray-700 hover:border-yellow-400/30 hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <div className="flex-shrink-0 mt-1">
                            <div
                              className={`w-5 h-5 flex items-center justify-center rounded-full border ${
                                isSelected
                                  ? "bg-yellow-400 border-yellow-400"
                                  : "bg-gray-800 border-gray-600"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-gray-900" />
                              )}
                            </div>
                          </div>

                          {/* Información del contacto */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4
                                className={`text-lg font-semibold truncate ${
                                  isSelected
                                    ? "text-yellow-400"
                                    : "text-gray-200"
                                }`}
                              >
                                {contact.full_name}
                              </h4>
                              {/* {contact.job_position && (
                                <span
                                  className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                    isSelected
                                      ? "bg-yellow-400/20 text-yellow-300"
                                      : "bg-gray-700 text-gray-400"
                                  }`}
                                >
                                  {contact.job_position}
                                </span>
                              )} */}
                            </div>

                            {/* Email */}
                            {contact.email && (
                              <div className="flex items-center gap-2 mb-1">
                                <Mail className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="text-sm text-gray-300 truncate">
                                  {contact.email}
                                </span>
                              </div>
                            )}

                            {/* Teléfonos */}
                            {(contact.phone || contact.mobile) && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-3 h-3 text-gray-500 flex-shrink-0" />
                                <span className="text-sm text-gray-300">
                                  {contact.phone || contact.mobile}
                                  {contact.phone && contact.mobile && " / "}
                                  {contact.phone && contact.mobile && contact.mobile}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Indicador de selección */}
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-yellow-400/20 flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center">
                                  <Check className="w-2 h-2 text-gray-900" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Paginación */}
                {renderPagination()}
                
                {/* Loading para cambios de página (no primera carga) */}
                {loading && currentPage > 1 && (
                  <div className="mt-4 flex justify-center">
                    <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
<div className="p-4 border-t border-gray-700">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    {/* Estado de selección - Ahora arriba en móvil, al lado en desktop */}
    <div className="flex items-center gap-2">
      {selectedContactId ? (
        <>
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
          <span className="text-yellow-400 font-medium text-sm truncate">
            1 cliente seleccionado
          </span>
        </>
      ) : (
        <>
          <div className="w-2 h-2 rounded-full bg-gray-500 flex-shrink-0" />
          <span className="text-gray-400 text-sm">
            Selecciona un cliente
          </span>
        </>
      )}
    </div>

    {/* Botones - Siempre a la derecha */}
    <div className="flex gap-2 self-end sm:self-auto">
      <Button
        variant="outline"
        onClick={handleClose}
        className="border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-800 min-w-[100px]"
      >
        Cancelar
      </Button>
      <Button
        onClick={handleContactSelect}
        disabled={!selectedContactId}
        className={`min-w-[160px] ${
          !selectedContactId
            ? "bg-gray-700 cursor-not-allowed text-gray-500"
            : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
        }`}
      >
        <Check className="w-4 h-4 mr-2" />
        Seleccionar Cliente
      </Button>
    </div>
  </div>
</div>
      </DialogContent>
    </Dialog>
  );
}