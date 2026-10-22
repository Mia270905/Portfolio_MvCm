"use client";

import { useState, useEffect } from "react";
import ContactCard from "./contact-card";
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
  Check,
} from "lucide-react";
import { ContactPagination } from "./conctact-pagination";
import {
  getContacts,
  type Contact,
  type ContactsResponse,
  getAllActiveContactGroups,
  getContactsByGroupIds,
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
import { ContactGroup } from "../dashboard/grupo-de-contactos/contact-group-list";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface ContactListProps {
  userPermissions?: string[];
}

export function ContactList({ userPermissions = [] }: ContactListProps) {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [contactsData, setContactsData] = useState<ContactsResponse>({
    contacts: [],
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 0,
  });
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [jobPositionFilter, setJobPositionFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [openGroupSelect, setOpenGroupSelect] = useState(false);

  const canCreateContacts = userPermissions.includes("create:contacts");
  const canUpdateContacts = userPermissions.includes("update:contacts");
  const canDeleteContacts = userPermissions.includes("delete:contacts");
  const canReadContacts = userPermissions.includes("read:contacts");

  const jobPositions = Array.from(
    new Set(allContacts.map((contact) => contact.job_position).filter(Boolean)),
  ) as string[];

  useEffect(() => {
    const loadInitialData = async () => {
      if (!canReadContacts) {
        setInitialLoading(false);
        return;
      }

      try {
        setLoading(true);
        const contactsData = await getContacts(1, 1000, "");

        setAllContacts(contactsData.contacts);
        setFilteredContacts(contactsData.contacts);

        // Cargar grupos de contactos
        setIsLoadingGroups(true);
        const groups = await getAllActiveContactGroups();
        setContactGroups(groups);
        setIsLoadingGroups(false);

        setContactsData((prev) => ({
          ...prev,
          contacts: contactsData.contacts.slice(0, 9),
          total: contactsData.contacts.length,
          totalPages: Math.ceil(contactsData.contacts.length / 9),
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
    if (allContacts.length === 0) return;

    setIsSearching(true);

    const timer = setTimeout(async () => {
      let filtered = [...allContacts];

      if (selectedGroups.length > 0) {
        const groupContactsData = await getContactsByGroupIds(
          selectedGroups,
          1,
          1000,
          searchQuery,
        );
        filtered = groupContactsData.contacts;
      } else {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (contact) =>
              contact.full_name.toLowerCase().includes(query) ||
              contact.email.toLowerCase().includes(query) ||
              (contact.phone && contact.phone.toLowerCase().includes(query)) ||
              (contact.mobile &&
                contact.mobile.toLowerCase().includes(query)) ||
              (contact.job_position &&
                contact.job_position.toLowerCase().includes(query)),
          );
        }
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (contact) =>
            contact.full_name.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query) ||
            (contact.phone && contact.phone.toLowerCase().includes(query)) ||
            (contact.mobile && contact.mobile.toLowerCase().includes(query)) ||
            (contact.job_position &&
              contact.job_position.toLowerCase().includes(query)) ||
            (contact.notes && contact.notes.toLowerCase().includes(query)),
        );
      }

      if (jobPositionFilter !== "all") {
        filtered = filtered.filter(
          (contact) => contact.job_position === jobPositionFilter,
        );
      }

      if (emailFilter) {
        filtered = filtered.filter((contact) =>
          contact.email.toLowerCase().includes(emailFilter.toLowerCase()),
        );
      }

      if (phoneFilter) {
        const phoneQuery = phoneFilter.replace(/\D/g, "");
        filtered = filtered.filter(
          (contact) =>
            (contact.phone &&
              contact.phone.replace(/\D/g, "").includes(phoneQuery)) ||
            (contact.mobile &&
              contact.mobile.replace(/\D/g, "").includes(phoneQuery)),
        );
      }

      setFilteredContacts(filtered);

      const currentPageSize = viewMode === "grid" ? 9 : 6;
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
    contactsData.page,
    viewMode,
    selectedGroups,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setContactsData((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

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
    setSelectedGroups([]);
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
        (contact) => contact.id !== contactId,
      );
      setAllContacts(newAllContacts);

      const newFilteredContacts = filteredContacts.filter(
        (contact) => contact.id !== contactId,
      );
      setFilteredContacts(newFilteredContacts);

      const currentPageSize = viewMode === "grid" ? 9 : 6;
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

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

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
                className={`animate-pulse bg-[#faf8f3] rounded-lg border border-[#e6dcc9] p-4 ${viewMode === "list" ? "flex gap-3" : ""}`}
              >
                <div className="flex gap-3">
                  <div
                    className={`${
                      viewMode === "list" ? "h-16 w-16" : "h-20 w-20"
                    } bg-[#e6dcc9] rounded-md`}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#e6dcc9] rounded w-3/4" />
                    <div className="h-3 bg-[#e6dcc9] rounded w-1/2" />
                    <div className="h-3 bg-[#e6dcc9] rounded w-2/3" />
                    {viewMode === "list" && (
                      <div className="h-3 bg-[#e6dcc9] rounded w-1/3" />
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
          <p className="text-neutral-600 mb-2 text-sm sm:text-base">
            No se encontraron contactos que coincidan con "{searchQuery}"
          </p>
          <p className="text-neutral-500 text-xs sm:text-sm">
            Intenta con otros términos de búsqueda
          </p>
        </div>
      );
    }

    if (contactsData.contacts.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-neutral-600 mb-4 text-sm sm:text-base">
            No hay contactos registrados
          </p>
          {canCreateContacts && (
            <Button
              onClick={handleCreate}
              className="bg-[#c6a365] hover:bg-[#b59555] text-white"
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
        {viewMode === "grid" ? (
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
        ) : (
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
      </>
    );
  };

  return (
    <>
      {/* Controles de búsqueda y vista */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar contactos por nombre, email, teléfono o posición..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#e6dcc9] rounded-lg bg-white text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:border-[#c6a365]"
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
            {selectedGroups.length > 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-[#c6a365] bg-[#f5efe6] border border-[#e6dcc9] rounded-full">
                Grupos: {selectedGroups.length} seleccionado
                {selectedGroups.length !== 1 ? "s" : ""}
                <button
                  onClick={() => setSelectedGroups([])}
                  className="hover:bg-[#e6dcc9] rounded-full p-0.5"
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

              {/* Filtro por Grupos de Contactos */}
              <div className="space-y-2">
                <Label
                  htmlFor="group-filter"
                  className="text-xs font-semibold text-neutral-700 uppercase tracking-wide"
                >
                  Grupo de contactos
                </Label>
                <Popover
                  open={openGroupSelect}
                  onOpenChange={setOpenGroupSelect}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openGroupSelect}
                      className="w-full justify-between h-auto min-h-10 px-3 bg-white border-[#e6dcc9] text-neutral-900 hover:bg-[#faf8f3] hover:border-[#c6a365] hover:text-neutral-900"
                    >
                      <div className="flex flex-wrap gap-1 flex-1 text-left overflow-hidden">
                        {selectedGroups.length === 0 ? (
                          <span className="text-neutral-500 text-sm">
                            Selecciona grupos
                          </span>
                        ) : (
                          selectedGroups.map((groupId) => {
                            const group = contactGroups.find(
                              (g) => g.id === groupId,
                            );
                            return group ? (
                              <span
                                key={groupId}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#f5efe6] text-[#c6a365] rounded mr-1 mb-1"
                              >
                                {group.title}
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleGroupToggle(groupId);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleGroupToggle(groupId);
                                    }
                                  }}
                                  className="ml-1 cursor-pointer hover:bg-[#e6dcc9] rounded-full p-0.5 focus:outline-none focus:ring-1 focus:ring-[#c6a365]"
                                >
                                  <X className="h-3 w-3" />
                                </span>
                              </span>
                            ) : null;
                          })
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-full p-0 min-w-[var(--radix-popover-trigger-width)] bg-white border-[#e6dcc9] shadow-lg"
                    align="start"
                  >
                    <div className="w-full">
                      {/* Input de búsqueda */}
                      <div className="px-3 py-2 border-b border-[#e6dcc9]">
                        <input
                          type="text"
                          placeholder="Buscar grupos..."
                          className="w-full h-9 px-2 bg-transparent text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0 border-0"
                          onChange={(e) => {
                            // Aquí podrías agregar lógica de filtrado si es necesario
                          }}
                        />
                      </div>

                      {/* Lista de grupos */}
                      <div className="max-h-64 overflow-y-auto">
                        {contactGroups.length === 0 ? (
                          <div className="py-6 text-center text-sm text-neutral-500">
                            No se encontraron grupos.
                          </div>
                        ) : (
                          <div className="p-1">
                            {contactGroups.map((group) => {
                              const isSelected = selectedGroups.includes(
                                group.id,
                              );
                              return (
                                <button
                                  key={group.id}
                                  type="button"
                                  onClick={() => handleGroupToggle(group.id)}
                                  className={cn(
                                    "w-full cursor-pointer py-2 px-3 rounded-md flex items-center gap-2",
                                    "text-left text-neutral-900 hover:bg-[#faf8f3] hover:text-neutral-900",
                                    "transition-colors duration-150",
                                  )}
                                >
                                  <div
                                    className={cn(
                                      "flex h-4 w-4 items-center justify-center rounded-sm border flex-shrink-0",
                                      isSelected
                                        ? "bg-[#c6a365] border-[#c6a365] text-white"
                                        : "border-[#e6dcc9]",
                                    )}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span className="flex-1 text-sm text-neutral-900 truncate">
                                    {group.title}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
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
          <div className="inline-flex items-center gap-2 text-neutral-500">
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
