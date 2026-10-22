"use client";

import { useState, useEffect } from "react";
import ContactCard from "@/components/contacts/contact-card";
import { ContactDialog } from "@/components/contacts/contact-dialog";
import {
  Plus,
  Grid3x3,
  List,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  Building2,
} from "lucide-react";
import { ContactPagination } from "@/components/contacts/conctact-pagination";
import {
  getContactsByGroupIdPaginated,
  GroupContacts,
  GroupContactsResponse,
  type Contact,
} from "@/lib/actions/contact.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AddContactsModal } from "./add-contacts-modal";
import { DeleteGroupContactsDialog } from "./delete-group-contacts-dialog";

interface GroupContactsListProps {
  contactGroupId: string;
  userPermissions?: string[];
  onContactsAdded?: () => void;
  onRemoveAffiliation?: (contactGroupId: string) => Promise<void>;
}

export function GroupContactsList({ 
  contactGroupId,
  userPermissions = [], 
  onContactsAdded,
  onRemoveAffiliation
}: GroupContactsListProps) {
  const [allContacts, setAllContacts] = useState<GroupContacts[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<GroupContacts[]>([]);
  const [contactsData, setContactsData] = useState<GroupContactsResponse>({
    groupContacts: [],
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 0,
  });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddModal, setShowAddModal] = useState(false);
  const [jobPositionFilter, setJobPositionFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [groupContactsToRemove, setGroupContactsToRemove] = useState<GroupContacts | null>(null);

  const canCreateContacts = userPermissions.includes("create:contacts");
  const canUpdateContacts = userPermissions.includes("update:contacts");
  const canDeleteContacts = userPermissions.includes("delete:contacts");
  const canReadContacts = userPermissions.includes("read:contacts");
  const canCreateGroupContacts = userPermissions.includes("create:group_contacts");
  const canUpdateGroupContacts = userPermissions.includes("update:group_contacts");
  const canDeleteGroupContacts = userPermissions.includes("delete:group_contacts");

  const jobPositions = Array.from(
    new Set(allContacts.map((groupContact) => {
        if (typeof groupContact.contact?.id === 'string') return null;
        return groupContact.contact?.job_position;
    }).filter(Boolean))
  ) as string[];

  const loadInitialData = async () => {
    if (!canReadContacts) {
      setInitialLoading(false);
      return;
    }

    try {
      setLoading(true);
      const contactsData = await getContactsByGroupIdPaginated(contactGroupId, 1, 1000, "");

      setAllContacts(contactsData.groupContacts);
      setFilteredContacts(contactsData.groupContacts);

      setContactsData((prev) => ({
        ...prev,
        groupContacts: contactsData.groupContacts.slice(0, 9),
        total: contactsData.groupContacts.length,
        totalPages: Math.ceil(contactsData.groupContacts.length / 9),
      }));
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [canReadContacts]);

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    if (allContacts.length === 0) return;

    setIsSearching(true);

    const timer = setTimeout(() => {
      let filtered = [...allContacts];

      // Filtro de búsqueda general
      if (searchQuery) {
        filtered = filtered.filter((gc) => {
        const contact = gc.contact;

        // Si no es un objeto, no podemos filtrar por sus campos, así que retornamos false
        if (!contact || typeof contact === 'string') return false;

        // Ahora TypeScript sabe que 'contact' es el objeto Contact
        const search = searchQuery.toLowerCase();
        
        return (
            contact.full_name?.toLowerCase().includes(search) ||
            contact.email?.toLowerCase().includes(search) ||
            (contact.phone && contact.phone.toLowerCase().includes(search)) ||
            (contact.mobile && contact.mobile.toLowerCase().includes(search)) ||
            (contact.job_position && contact.job_position.toLowerCase().includes(search))
        );
        });
      }

      // Filtro por posición de trabajo
      if (jobPositionFilter !== "all") {
        filtered = filtered.filter((gc) => {
          const contact = gc.contact;
          if (!contact || typeof contact === 'string') return false;
          return contact.job_position === jobPositionFilter;
        });
      }

      // Filtro por email
      if (emailFilter) {

        filtered = filtered.filter((gc) => {
          const contact = gc.contact;
          if (!contact || typeof contact === 'string') return false;
          return contact.email.toLowerCase().includes(emailFilter.toLowerCase());
        });
      }

      // Filtro por teléfono
      if (phoneFilter) {
        const phoneQuery = phoneFilter.replace(/\D/g, "");

        filtered = filtered.filter((gc) => {
          const contact = gc.contact;
          if (!contact || typeof contact === 'string') return false;
          return (
            (contact.phone &&
            contact.phone.replace(/\D/g, "").includes(phoneQuery)) ||
            (contact.mobile &&
            contact.mobile.replace(/\D/g, "").includes(phoneQuery))
          );
        });
      }

      setFilteredContacts(filtered);

      // Actualizar paginación
      const currentPageSize = viewMode === "grid" ? 9 : 6;
      const startIndex = (contactsData.page - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;

      setContactsData((prev) => ({
        ...prev,
        groupContacts: filtered.slice(startIndex, endIndex),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / currentPageSize),
        pageSize: currentPageSize,
      }));

      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    allContacts,
    searchQuery,
    jobPositionFilter,
    emailFilter,
    phoneFilter,
    contactsData.page,
    viewMode,
  ]);

  // Efecto para el debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setContactsData((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Efecto para cambiar el pageSize cuando cambia el viewMode
  useEffect(() => {
    const newPageSize = viewMode === "grid" ? 9 : 6;
    setContactsData((prev) => ({
      ...prev,
      page: 1,
      pageSize: newPageSize,
      totalPages: Math.ceil(filteredContacts.length / newPageSize),
    }));
  }, [viewMode, filteredContacts.length]);

  const clearFilters = () => {
    setJobPositionFilter("all");
    setEmailFilter("");
    setPhoneFilter("");
    setSearchInput("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    jobPositionFilter !== "all" || emailFilter || phoneFilter || searchQuery;

  const handleEdit = (contact: Contact) => {
    if (canUpdateContacts) {
      setSelectedContact(contact);
      setIsDialogOpen(true);
    }
  };

  const handleCreate = () => {
    if (canCreateContacts) {
      setSelectedContact(null);
      setIsDialogOpen(true);
    }
  };

  const handleAddContacts = () => {
    setShowAddModal(true);
  };

  const handleChildrenAdded = () => {
    loadInitialData();
    if (onContactsAdded) onContactsAdded();
  };

  const handleSave = async () => {
    try {
      // Recargar todos los contactos después de guardar
      setLoading(true);
      const data = await getContactsByGroupIdPaginated(contactGroupId, 1, 1000, "");
      setAllContacts(data.groupContacts);
      setFilteredContacts(data.groupContacts);
    } catch (error) {
      console.error("Error al recargar contactos:", error);
    } finally {
      setLoading(false);
    }
    setIsDialogOpen(false);
  };

  const handleRemoveClick = (gc: GroupContacts) => {
    if (canDeleteGroupContacts) {
      setGroupContactsToRemove(gc);
      setRemoveDialogOpen(true);
    }
  };

  const handleRemoveAffiliation = async (gcId: string) => {
    if (!onRemoveAffiliation) return;

    try {
      await onRemoveAffiliation(gcId);

      // Actualizar la lista localmente
      // setAllContacts((prev) =>
      //   prev.filter((gc) => gc.id !== gcId)
      // );
      // setFilteredContacts((prev) =>
      //   prev.filter((gc) => gc.id !== gcId)
      // );
      await loadInitialData();

      // Cerrar el diálogo
      setRemoveDialogOpen(false);
      setGroupContactsToRemove(null);
    } catch (error) {
      console.error("Error al eliminar afiliación:", error);
      throw error; // Propagar el error para que lo maneje el diálogo
    }
  };

  const handlePageChange = (page: number) => {
    setContactsData((prev) => ({
      ...prev,
      page,
    }));
  };

  const safeGroupContacts = contactsData.groupContacts.filter(
    (gc): gc is GroupContacts & { contact: Contact } =>
      gc.contact !== null && typeof gc.contact !== "string"
  );

  const renderContactList = () => {
    if (loading && initialLoading) {
      return (
        <div className="space-y-4 sm:space-y-6">
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }
          >
            {[...Array(contactsData.pageSize)].map((_, idx) => (
              <div
                key={idx}
                className={`animate-pulse bg-white rounded-lg border border-[#f5efe6] p-4 ${
                  viewMode === "list" ? "flex gap-3" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`${
                      viewMode === "list" ? "h-16 w-16" : "h-20 w-20"
                    } bg-[#f5efe6] rounded-md`}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#f5efe6] rounded w-3/4" />
                    <div className="h-3 bg-[#f5efe6] rounded w-1/2" />
                    <div className="h-3 bg-[#f5efe6] rounded w-2/3" />
                    {viewMode === "list" && (
                      <div className="h-3 bg-[#f5efe6] rounded w-1/3" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (contactsData.groupContacts.length === 0 && searchQuery) {
      return (
        <div className="text-center py-8">
          <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#faf8f3] flex items-center justify-center">
              <Search className="w-6 h-6 text-[#c6a365]" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No se encontraron resultados
            </h3>
            <p className="text-neutral-600 mb-2">
              No hay contactos que coincidan con "{searchQuery}"
            </p>
            <p className="text-neutral-500 text-sm mb-4">
              Intenta con otros términos de búsqueda
            </p>
            <button
              onClick={() => setSearchInput("")}
              className="text-sm border border-[#e6dcc9] text-neutral-700 hover:bg-[#faf8f3] hover:text-neutral-900 px-4 py-2 rounded-lg transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>
        </div>
      );
    }
    
    if (contactsData.groupContacts.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#faf8f3] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-[#c6a365]" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No hay contactos en este grupo</h3>
            <p className="text-neutral-600 mb-6">
              Agrega contactos para empezar
            </p>
            {canCreateGroupContacts && (
              <Button
                onClick={handleAddContacts}
                className="bg-[#c6a365] hover:bg-[#b59555] text-white"
              >
                <Plus size={16} className="mr-2" />
                Agregar Contactos
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {safeGroupContacts.map((groupContacts) => ( 
              <ContactCard
                key={groupContacts.id}
                contact={groupContacts.contact}
                groupContactId={groupContacts.id}
                onRemoveFromGroup={(id) => handleRemoveClick(groupContacts)}
                userPermissions={userPermissions}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {safeGroupContacts.map((groupContacts) => (
              <ContactCard
                key={groupContacts.id}
                contact={groupContacts.contact}
                groupContactId={groupContacts.id}
                onRemoveFromGroup={(id) => handleRemoveClick(groupContacts)}
                userPermissions={userPermissions}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Encabezado y controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-5 w-5 text-[#c6a365]" />
              <h3 className="text-lg font-medium text-neutral-900">
                Contactos del grupo
              </h3>
            </div>
            <p className="text-sm text-neutral-600">
              {allContacts.length} contacto{allContacts.length !== 1 ? 's' : ''} asociado{allContacts.length !== 1 ? 's' : ''}
            </p>
          </div>

          {canCreateGroupContacts && (
            <div className="flex gap-2">
              <Button
                onClick={handleAddContacts}
                className="bg-[#c6a365] hover:bg-[#b59555] text-white shadow-sm hover:shadow-lg hover:shadow-[#c6a365]/25"
              >
                <Plus size={16} className="mr-2" />
                Agregar Contactos
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Controles de búsqueda y vista */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-500" />
          </div>
          <Input
            type="text"
            placeholder="Buscar contactos por nombre, email, teléfono o posición..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#e6dcc9] rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50"
          />
        </div>

        {/* Botones de vista */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "grid"
                ? "bg-[#f5efe6] border-[#c6a365] text-[#c6a365]"
                : "bg-white border-[#e6dcc9] text-neutral-500 hover:bg-[#faf8f3]"
            }`}
            title="Vista de cuadrícula"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "list"
                ? "bg-[#f5efe6] border-[#c6a365] text-[#c6a365]"
                : "bg-white border-[#e6dcc9] text-neutral-500 hover:bg-[#faf8f3]"
            }`}
            title="Vista de lista"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-[#e6dcc9] rounded-lg hover:bg-[#faf8f3] transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-[#c6a365] rounded-full">
                {
                  [
                    jobPositionFilter !== "all",
                    emailFilter,
                    phoneFilter,
                  ].filter(Boolean).length
                }
              </span>
            )}
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-[#faf8f3] rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar todo
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-3">
            {jobPositionFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#1565c0] bg-[#e3f2fd] border border-[#bbdefb] rounded-full">
                Posición: {jobPositionFilter}
                <button
                  onClick={() => setJobPositionFilter("all")}
                  className="hover:bg-[#bbdefb] rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {emailFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#2e7d32] bg-[#e8f5e9] border border-[#c8e6c9] rounded-full">
                Email: {emailFilter}
                <button
                  onClick={() => setEmailFilter("")}
                  className="hover:bg-[#c8e6c9] rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {phoneFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#7b1fa2] bg-[#f3e5f5] border border-[#e1bee7] rounded-full">
                Teléfono: {phoneFilter}
                <button
                  onClick={() => setPhoneFilter("")}
                  className="hover:bg-[#e1bee7] rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {showFilters && (
          <div className="bg-gradient-to-br from-white to-[#faf8f3] border border-[#e6dcc9] rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtro por Posición de Trabajo */}
              <div className="space-y-2">
                <Label
                  htmlFor="job-position-filter"
                  className="text-xs font-semibold text-neutral-700 uppercase tracking-wide"
                >
                  Posición de trabajo
                </Label>
                <Select
                  value={jobPositionFilter}
                  onValueChange={setJobPositionFilter}
                >
                  <SelectTrigger
                    id="job-position-filter"
                    className="h-10 bg-white border-[#e6dcc9] hover:border-[#c6a365] transition-colors text-neutral-900"
                  >
                    <SelectValue placeholder="Todas las posiciones" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#e6dcc9]">
                    <SelectItem
                      value="all"
                      className="text-neutral-900 hover:bg-[#faf8f3] hover:text-neutral-900 focus:bg-[#faf8f3] focus:text-neutral-900"
                    >
                      Todas las posiciones
                    </SelectItem>
                    {jobPositions.map((position) => (
                      <SelectItem
                        key={position}
                        value={position}
                        className="text-neutral-900 hover:bg-[#faf8f3] hover:text-neutral-900 focus:bg-[#faf8f3] focus:text-neutral-900"
                      >
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email-filter"
                  className="text-xs font-semibold text-neutral-700 uppercase tracking-wide"
                >
                  Email contiene
                </Label>
                <Input
                  id="email-filter"
                  type="text"
                  placeholder="ejemplo@correo.com"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="h-10 bg-white border-[#e6dcc9] hover:border-[#c6a365] transition-colors text-neutral-900 placeholder-neutral-400"
                />
              </div>

              {/* Filtro por Teléfono */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone-filter"
                  className="text-xs font-semibold text-neutral-700 uppercase tracking-wide"
                >
                  Teléfono contiene
                </Label>
                <Input
                  id="phone-filter"
                  type="text"
                  placeholder="Número de teléfono"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className="h-10 bg-white border-[#e6dcc9] hover:border-[#c6a365] transition-colors text-neutral-900 placeholder-neutral-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de búsqueda */}
      {isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-neutral-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#c6a365]"></div>
            <span className="text-sm">Aplicando filtros...</span>
          </div>
        </div>
      )}

      {/* Lista de contactos */}
      {renderContactList()}

      {/* Paginación */}
      {!loading && contactsData.totalPages > 1 && (
        <ContactPagination
          currentPage={contactsData.page}
          totalPages={contactsData.totalPages}
          totalItems={contactsData.total}
          pageSize={contactsData.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Diálogo de eliminación */}
      <DeleteGroupContactsDialog
        groupContactsId={groupContactsToRemove?.id || ""}
        contactName={groupContactsToRemove?.contact?.full_name || ""}
        open={removeDialogOpen}
        onOpenChange={(open) => {
          setRemoveDialogOpen(open);
          if (!open) {
            setGroupContactsToRemove(null);
          }
        }}
        onDelete={handleRemoveAffiliation}
      />

      {/* Diálogo de contacto del grupo */}
      {(canCreateContacts || canUpdateContacts) && (
        <ContactDialog
          contact={selectedContact}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          isLoading={false}
        />
      )}

      {/* Modal para agregar contactos */}
      <AddContactsModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        contactGroupId={contactGroupId}
        onSuccess={handleChildrenAdded}
      />
    </>
  );
}

export type { Contact };