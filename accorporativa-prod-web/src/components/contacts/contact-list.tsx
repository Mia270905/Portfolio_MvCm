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
import { ContactGroup } from "@/components/dashboard/grupo-de-contactos/contact-group-list";
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
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [contactsData, setContactsData] = useState<ContactsResponse>({
    contacts: [],
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
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [jobPositionFilter, setJobPositionFilter] = useState<string>("all");
  const [emailFilter, setEmailFilter] = useState<string>("");
  const [phoneFilter, setPhoneFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [openGroupSelect, setOpenGroupSelect] = useState(false);

  const canCreateContacts = userPermissions.includes("create:contacts");
  const canUpdateContacts = userPermissions.includes("update:contacts");
  const canDeleteContacts = userPermissions.includes("delete:contacts");
  const canReadContacts = userPermissions.includes("read:contacts");

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const jobPositions = Array.from(
    new Set(allContacts.map((contact) => contact.job_position).filter(Boolean))
  ) as string[];

  useEffect(() => {
    const loadInitialData = async () => {
      if (!canReadContacts) {
        setInitialLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Cargar grupos de contactos
        setIsLoadingGroups(true);
        const groups = await getAllActiveContactGroups();
        setContactGroups(groups);
        setIsLoadingGroups(false);

        const contactsData = await getContacts(1, 1000, "");

        setAllContacts(contactsData.contacts);
        setFilteredContacts(contactsData.contacts);

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

    const timer = setTimeout(() => {
      let filtered = [...allContacts];

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (contact) =>
            contact.full_name.toLowerCase().includes(query) ||
            contact.email.toLowerCase().includes(query) ||
            (contact.phone && contact.phone.toLowerCase().includes(query)) ||
            (contact.mobile && contact.mobile.toLowerCase().includes(query)) ||
            (contact.job_position &&
              contact.job_position.toLowerCase().includes(query))
            || (contact.notes && contact.notes.toLowerCase().includes(query))
        );
      }

      if (jobPositionFilter !== "all") {
        filtered = filtered.filter(
          (contact) => contact.job_position === jobPositionFilter
        );
      }

      if (emailFilter) {
        filtered = filtered.filter((contact) =>
          contact.email.toLowerCase().includes(emailFilter.toLowerCase())
        );
      }

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
        (contact) => contact.id !== contactId
      );
      setAllContacts(newAllContacts);

      const newFilteredContacts = filteredContacts.filter(
        (contact) => contact.id !== contactId
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
                className={`animate-pulse bg-muted rounded-lg border border-border p-4 ${
                  viewMode === "list" ? "flex gap-3" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`${
                      viewMode === "list" ? "h-16 w-16" : "h-20 w-20"
                    } bg-muted rounded-md`}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    {viewMode === "list" && (
                      <div className="h-3 bg-muted rounded w-1/3" />
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
          <p className="text-muted-foreground mb-2 text-sm sm:text-base">
            No se encontraron contactos que coincidan con `&quot;`{searchQuery}
            `&quot;`
          </p>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Intenta con otros términos de búsqueda
          </p>
        </div>
      );
    }
    
    if (contactsData.contacts.length === 0) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-muted-foreground mb-4 text-sm sm:text-base">
            No hay contactos registrados
          </p>
          {canCreateContacts && (
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Buscar contactos por nombre, email, teléfono o posición..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base text-foreground placeholder-muted-foreground"
          />
        </div>

        {/* Botones de vista */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "grid"
                ? "text-primary border-primary bg-primary/10"
                : "bg-background border-input text-muted-foreground hover:bg-muted"
            }`}
            title="Vista de cuadrícula"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "list"
                ? "text-primary border-primary bg-primary/10"
                : "bg-background border-input text-muted-foreground hover:bg-muted"
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-primary-foreground bg-primary rounded-full">
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
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar todo
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-3">
            {jobPositionFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-primary bg-primary/10 border border-primary/30 rounded-full">
                Posición: {jobPositionFilter}
                <button
                  onClick={() => setJobPositionFilter("all")}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {emailFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/20 border border-blue-700/30 rounded-full">
                Email: {emailFilter}
                <button
                  onClick={() => setEmailFilter("")}
                  className="hover:bg-blue-900/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {phoneFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-300 bg-purple-900/20 border border-purple-700/30 rounded-full">
                Teléfono: {phoneFilter}
                <button
                  onClick={() => setPhoneFilter("")}
                  className="hover:bg-purple-900/30 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {showFilters && (
          <div className="bg-background border border-input rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtro por Posición de Trabajo */}
              <div className="space-y-2">
                <Label
                  htmlFor="job-position-filter"
                  className="text-xs font-semibold text-foreground uppercase tracking-wide"
                >
                  Posición de trabajo
                </Label>
                <Select
                  value={jobPositionFilter}
                  onValueChange={setJobPositionFilter}
                >
                  <SelectTrigger
                    id="job-position-filter"
                    className="h-10 bg-background border-input hover:border-primary transition-colors text-foreground"
                  >
                    <SelectValue placeholder="Todas las posiciones" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-input">
                    <SelectItem
                      value="all"
                      className="text-foreground hover:bg-muted"
                    >
                      Todas las posiciones
                    </SelectItem>
                    {jobPositions.map((position) => (
                      <SelectItem
                        key={position}
                        value={position}
                        className="text-foreground hover:bg-muted"
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
                  className="text-xs font-semibold text-foreground uppercase tracking-wide"
                >
                  Email contiene
                </Label>
                <Input
                  id="email-filter"
                  type="text"
                  placeholder="ejemplo@correo.com"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="h-10 bg-background border-input hover:border-primary transition-colors text-foreground placeholder-muted-foreground"
                />
              </div>

              {/* Filtro por Teléfono */}
              <div className="space-y-2">
                <Label
                  htmlFor="phone-filter"
                  className="text-xs font-semibold text-foreground uppercase tracking-wide"
                >
                  Teléfono contiene
                </Label>
                <Input
                  id="phone-filter"
                  type="text"
                  placeholder="Número de teléfono"
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className="h-10 bg-background border-input hover:border-primary transition-colors text-foreground placeholder-muted-foreground"
                />
              </div>

              {/* Filtro por Grupos de Contactos */}
              <div className="space-y-2">
                <Label
                  htmlFor="group-filter"
                  className="text-xs font-semibold text-foreground uppercase tracking-wide"
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
                      className="w-full justify-between h-auto min-h-10 px-3"
                    >
                      <div className="flex flex-wrap gap-1 flex-1 text-left overflow-hidden">
                        {selectedGroups.length === 0 ? (
                          <span className="text-foreground hover:bg-muted">
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
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded mr-1 mb-1"
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
                                  className="ml-1 cursor-pointer hover:bg-purple-200 rounded-full p-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                    className="w-full p-0 min-w-[var(--radix-popover-trigger-width)]"
                    align="start"
                    style={{
                      minWidth: "100%", // Asegura que tenga el mismo ancho que el trigger
                    }}
                  >
                    <Command className="w-full">
                      <div className="px-3 py-2 border-b">
                        <CommandInput
                          placeholder="Buscar grupos..."
                          className="h-9 w-full" // Misma altura que otros inputs
                        />
                      </div>
                      <CommandList className="max-h-64">
                        <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                          No se encontraron grupos.
                        </CommandEmpty>
                        <CommandGroup className="p-1">
                          {contactGroups.map((group) => {
                            const isSelected = selectedGroups.includes(
                              group.id,
                            );
                            return (
                              <CommandItem
                                key={group.id}
                                onSelect={() => handleGroupToggle(group.id)}
                                className="cursor-pointer py-2 px-3 rounded-md"
                              >
                                <div className="flex items-center gap-2 w-full">
                                  <div
                                    className={cn(
                                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                                      isSelected
                                        ? "bg-primary border-primary text-primary-foreground"
                                        : "border-gray-300",
                                    )}
                                  >
                                    {isSelected && (
                                      <Check className="h-3 w-3" />
                                    )}
                                  </div>
                                  <span className="flex-1 text-sm">
                                    {group.title}
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
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
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
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