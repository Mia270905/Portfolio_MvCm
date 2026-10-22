"use client";

import {
  Command,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Check } from "lucide-react";

import { useState, useEffect } from "react";
import ContactCard from "./contact-card";
import { ContactTable } from "./contact-table";
import { ContactDialog } from "./contact-dialog";
import {
  Plus,
  Grid3x3,
  List,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
  Table as TableIcon,
} from "lucide-react";
import { ContactPagination } from "./conctact-pagination";
import {
  getContacts,
  getContactGroups ,
  type Contact,
  type ContactsResponse,
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
import { DeleteContactDialog } from "./delete-contact-dialog";
import { Button } from "@/components/ui/button";

interface ContactListProps {
  userPermissions?: string[];
}

export function ContactList({ userPermissions = [] }: ContactListProps) {
  const [allContacts, setAllContacts] = useState<Contact[]>([]); // Todos los contactos
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]); // Contactos filtrados
  const [contactsData, setContactsData] = useState<ContactsResponse>({
    contacts: [],
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  });
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "table">("grid");

  const [jobPositionFilter, setJobPositionFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const canCreateContacts = userPermissions.includes("create:contacts");
  const canUpdateContacts = userPermissions.includes("update:contacts");
  const canDeleteContacts = userPermissions.includes("delete:contacts");
  const canReadContacts = userPermissions.includes("read:contacts");

  
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [openGroupSelect, setOpenGroupSelect] = useState(false);
  type ContactGroup = {
  id: string;
  title: string;
};
const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);

// Búsqueda para el selector de grupos
const [groupSearch, setGroupSearch] = useState("");

// Grupos filtrados por la búsqueda
const filteredContactGroups = contactGroups.filter((g) =>
  g.title.toLowerCase().includes(groupSearch.toLowerCase())
);
const handleGroupToggle = (groupId: string) => {
  setSelectedGroups((prev) =>
    prev.includes(groupId)
      ? prev.filter((id) => id !== groupId)
      : [...prev, groupId]
  );
};




  // Obtener posiciones de trabajo únicas para el filtro
  const jobPositions = Array.from(
    new Set(allContacts.map((contact) => contact.job_position).filter(Boolean))
  ) as string[];

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (!canReadContacts) {
        setInitialLoading(false);
        return;
      }

      try {
        setLoading(true);
        const contactsData = await getContacts(1, 1000, "", true); // includeGroups = true
 // Traer muchos contactos de una vez

        setAllContacts(contactsData.contacts);
        setFilteredContacts(contactsData.contacts);

        // Configurar paginación inicial
        setContactsData((prev) => ({
          ...prev,
          contacts: contactsData.contacts.slice(0, 50),
          total: contactsData.contacts.length,
          totalPages: Math.ceil(contactsData.contacts.length / 50),
        }));
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, [canReadContacts]);
  useEffect(() => {
  const loadGroups = async () => {
    try {
      const groups = await getContactGroups();
      setContactGroups(groups);
    } catch (error) {
      console.error("Error cargando grupos:", error);
    }
  };
  loadGroups();
}, []);


  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    if (allContacts.length === 0) return;

    setIsSearching(true);

    const timer = setTimeout(() => {
      let filtered = [...allContacts];

      // Filtro de búsqueda general
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const numericQuery = query.replace(/\D/g, "");

        filtered = filtered.filter((contact) => {
          // Búsqueda en campos de texto
          const matchesText =
            contact.full_name.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query) ||
            (contact.job_position && contact.job_position.toLowerCase().includes(query)) ||
            (contact.notes && contact.notes.toLowerCase().includes(query));

          // Búsqueda en números de teléfono
          let matchesPhone = false;
          if (numericQuery.length > 0) {
            const phoneDigits = (contact.phone || "").replace(/\D/g, "");
            const mobileDigits = (contact.mobile || "").replace(/\D/g, "");
            matchesPhone = phoneDigits.includes(numericQuery) || mobileDigits.includes(numericQuery);
          }

          return matchesText || matchesPhone;
        });
      }
  // 🔥 FILTRO POR GRUPOS (AQUÍ ES)
    if (selectedGroups.length > 0) {
      filtered = filtered.filter((contact) =>
        contact.group_contacts?.some((gc) =>
          selectedGroups.includes(gc.group_id)
        )
      );
    }
      // Filtro por posición de trabajo
      if (jobPositionFilter !== "all") {
        filtered = filtered.filter(
          (contact) => contact.job_position === jobPositionFilter
        );
      }

      // Filtro por email
      if (emailFilter) {
        filtered = filtered.filter((contact) =>
          contact.email.toLowerCase().includes(emailFilter.toLowerCase())
        );
      }

      // Filtro por teléfono
      if (phoneFilter) {
        const phoneQuery = phoneFilter.replace(/\D/g, "");
        filtered = filtered.filter(
          (contact) =>
            (contact.phone &&
              contact.phone.replace(/\D/g, "").includes(phoneQuery)) ||
            (contact.mobile &&
              contact.mobile.replace(/\D/g, "").includes(phoneQuery))
        );
      }

  
      setFilteredContacts(filtered);

      // Actualizar paginación
      const currentPageSize = 50;
      const startIndex = (contactsData.page - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;

      setContactsData((prev) => ({
        ...prev,
        contacts: filtered.slice(startIndex, endIndex),
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
  selectedGroups,
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
    const newPageSize = 50;
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
  setSelectedGroups([]);
  setSearchInput("");
  setSearchQuery("");
};


  const hasActiveFilters =
  jobPositionFilter !== "all" ||
  emailFilter ||
  phoneFilter ||
  searchQuery ||
  selectedGroups.length > 0;

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

  const handleSave = async () => {
    try {
      // Recargar todos los contactos después de guardar
      setLoading(true);
      const data = await getContacts(1, 1000, "");
      setAllContacts(data.contacts);
      setFilteredContacts(data.contacts);
    } catch (error) {
      console.error("Error al recargar contactos:", error);
    } finally {
      setLoading(false);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteClick = (contact: Contact) => {
    if (canDeleteContacts) {
      setContactToDelete(contact);
      setDeleteDialogOpen(true);
    }
  };

  const handleDelete = async (contactId: string) => {
    try {
      const newAllContacts = allContacts.filter(
        (contact) => contact.id !== contactId
      );
      setAllContacts(newAllContacts);

      const newFilteredContacts = filteredContacts.filter(
        (contact) => contact.id !== contactId
      );
      setFilteredContacts(newFilteredContacts);

      const currentPageSize = 50;
      const startIndex = (contactsData.page - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;

      setContactsData((prev) => ({
        ...prev,
        contacts: newFilteredContacts.slice(startIndex, endIndex),
        total: newFilteredContacts.length,
        totalPages: Math.ceil(newFilteredContacts.length / currentPageSize),
      }));
    } catch (error) {
      console.error("Error al eliminar contacto visualmente:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setContactsData((prev) => ({
      ...prev,
      page,
    }));
  };

  // Mostrar skeleton solo para los contactos cuando está cargando
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
                className={`animate-pulse bg-[#0A0F17] rounded-lg border border-gray-800 p-4 ${
                  viewMode === "list" ? "flex gap-3" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`${
                      viewMode === "list" ? "h-16 w-16" : "h-20 w-20"
                    } bg-gray-800 rounded-md`}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-800 rounded w-2/3" />
                    {viewMode === "list" && (
                      <div className="h-3 bg-gray-800 rounded w-1/3" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (contactsData.contacts.length === 0 && searchQuery) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-gray-300 mb-2 text-sm sm:text-base">
            No se encontraron contactos que coincidan con `&quot;`{searchQuery}
            `&quot;`
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Intenta con otros términos de búsqueda
          </p>
        </div>
      );
    }
    
    if (contactsData.contacts.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-gray-300 mb-4 text-sm sm:text-base">
            No hay contactos registrados
          </p>
          {canCreateContacts && (
            <Button
              onClick={handleCreate}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus size={16} className="mr-2" />
              Crear Primer Contacto
            </Button>
          )}
        </div>
      );
    }

    return (
      <>
        {viewMode === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {contactsData.contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                userPermissions={userPermissions}
              />
            ))}
          </div>
        )}
        {viewMode === "list" && (
          <div className="space-y-3 mb-6">
            {contactsData.contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                userPermissions={userPermissions}
              />
            ))}
          </div>
        )}
        {viewMode === "table" && (
          <div className="mb-6">
            <ContactTable
              contacts={contactsData.contacts}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              userPermissions={userPermissions}
            />
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Controles de búsqueda y vista */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar contactos por nombre, email, teléfono o posición..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-base text-white placeholder-gray-400"
          />
        </div>

        {/* Botones de vista - ocultos en móvil */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "grid"
                ? "bg-blue-900/30 border-blue-600 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
            }`}
            title="Vista de cuadrícula"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "list"
                ? "bg-blue-900/30 border-blue-600 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
            }`}
            title="Vista de lista"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "table"
                ? "bg-blue-900/30 border-blue-600 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
            }`}
            title="Vista de tabla"
          >
            <TableIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

        {/* Filtros - Modo oscuro */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-200 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
              {hasActiveFilters && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                  {
              [
              jobPositionFilter !== "all",
              emailFilter,
              phoneFilter,
              selectedGroups.length > 0,
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
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-md transition-colors"
              >
                <X className="w-3 h-3" />
                Limpiar todo
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-3">
              {jobPositionFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 border border-blue-800 rounded-full">
                  Posición: {jobPositionFilter}
                  <button
                    onClick={() => setJobPositionFilter("all")}
                    className="hover:bg-blue-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {emailFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-300 bg-green-900/40 border border-green-800 rounded-full">
                  Email: {emailFilter}
                  <button
                    onClick={() => setEmailFilter("")}
                    className="hover:bg-green-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {phoneFilter && (
                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-300 bg-purple-900/40 border border-purple-800 rounded-full">
                  Teléfono: {phoneFilter}
                  <button
                    onClick={() => setPhoneFilter("")}
                    className="hover:bg-purple-800/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {showFilters && (
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Filtro por Posición de Trabajo */}
                <div className="space-y-2">
                  <Label
                    htmlFor="job-position-filter"
                    className="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                  >
                    Posición de trabajo
                  </Label>
                  <Select
                    value={jobPositionFilter}
                    onValueChange={setJobPositionFilter}
                  >
                    <SelectTrigger
                      id="job-position-filter"
                      className="h-10 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors text-gray-200"
                    >
                      <SelectValue placeholder="Todas las posiciones" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem
                        value="all"
                        className="text-gray-200 hover:bg-gray-700"
                      >
                        Todas las posiciones
                      </SelectItem>
                      {jobPositions.map((position) => (
                        <SelectItem
                          key={position}
                          value={position}
                          className="text-gray-200 hover:bg-gray-700"
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
                    className="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                  >
                    Email contiene
                  </Label>
                  <Input
                    id="email-filter"
                    type="text"
                    placeholder="ejemplo@correo.com"
                    value={emailFilter}
                    onChange={(e) => setEmailFilter(e.target.value)}
                    className="h-10 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors text-gray-200 placeholder-gray-400"
                  />
                </div>

                {/* Filtro por Teléfono */}
                <div className="space-y-2">
                  <Label
                    htmlFor="phone-filter"
                    className="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                  >
                    Teléfono contiene
                  </Label>
                  <Input
                    id="phone-filter"
                    type="text"
                    placeholder="Número de teléfono"
                    value={phoneFilter}
                    onChange={(e) => setPhoneFilter(e.target.value)}
                    className="h-10 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors text-gray-200 placeholder-gray-400"
                  />


                </div>
                {/* Filtro por Grupos de Contactos */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Grupo de contactos
              </Label>

              <Popover
                open={openGroupSelect}
                onOpenChange={(open) => {
                  setOpenGroupSelect(open);
                  if (!open) setGroupSearch("");
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between min-h-10 bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
                  >
                    <div className="flex gap-1 flex-1 text-left min-w-0 overflow-hidden items-center">
                      {selectedGroups.length === 0 ? (
                        <span className="text-gray-400 text-sm">Selecciona grupos</span>
                      ) : (
                        <>
                          {selectedGroups.slice(0, 2).map((groupId) => {
                            const group = contactGroups.find((g) => g.id === groupId);
                            return group ? (
                              <span
                                key={groupId}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-purple-900/40 text-purple-300 border border-purple-800 rounded max-w-[9rem] overflow-hidden"
                                title={group.title}
                              >
                                <span className="truncate">{group.title}</span>
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGroupToggle(groupId);
                                  }}
                                  className="cursor-pointer hover:bg-purple-800/50 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </span>
                              </span>
                            ) : null;
                          })}

                          {selectedGroups.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs bg-gray-700 text-gray-200 rounded ml-1">
                              +{selectedGroups.length - 2}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 opacity-50 ml-2" />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="bg-gray-800 border border-gray-700 p-0">
                  <div className="p-2">
                    <Input
                      placeholder="Buscar grupos..."
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      className="mb-2 h-9 bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-400"
                    />
                  </div>
                  <Command className="bg-gray-800">
                    <CommandList>
                      {filteredContactGroups.map((group) => {
                        const isSelected = selectedGroups.includes(group.id);
                        return (
                          <CommandItem
                            key={group.id}
                            onSelect={() => handleGroupToggle(group.id)}
                            className="flex items-center gap-2 text-gray-200 bg-gray-800"
                          >
                            <div
                              className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                                isSelected
                                  ? "bg-blue-800 border-blue-700"
                                  : "border-gray-500"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            {group.title}
                          </CommandItem>
                        );
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
              </div>
            </div>
          )}

        </div>

      {/* Indicador de búsqueda */}
      {isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
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
      <DeleteContactDialog
        contactId={contactToDelete?.id || ""}
        contactName={contactToDelete?.full_name || ""}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setContactToDelete(null);
          }
        }}
        onDelete={handleDelete}
      />

      {/* Diálogo de contacto */}
      {(canCreateContacts || canUpdateContacts) && (
        <ContactDialog
          contact={selectedContact}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          isLoading={false}
        />
      )}
    </>
  );
}

export type { Contact };
