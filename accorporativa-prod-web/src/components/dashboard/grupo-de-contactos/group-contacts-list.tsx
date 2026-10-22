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
        const contactsData = await getContactsByGroupIdPaginated(contactGroupId,1, 1000, "");

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

  useEffect(() => {
    if (allContacts.length === 0) return;

    setIsSearching(true);

    const timer = setTimeout(() => {
      let filtered = [...allContacts];

      if (searchQuery) {
        filtered = filtered.filter((gc) => {
        const contact = gc.contact;

        if (!contact || typeof contact === 'string') return false;

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

      if (jobPositionFilter !== "all") {

            filtered = filtered.filter((gc) => {
            const contact = gc.contact;

            if (!contact || typeof contact === 'string') return false;
            
            return (
                contact.job_position === jobPositionFilter
            );
        });
      }

      if (emailFilter) {

        filtered = filtered.filter((gc) => {
            const contact = gc.contact;

            if (!contact || typeof contact === 'string') return false;
            
            return (
                contact.email.toLowerCase().includes(emailFilter.toLowerCase())
            );
        });
      }

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
    ]
  );

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

  const handleAddContacts = () => {
    setShowAddModal(true);
  };

  const handleChildrenAdded = () => {
    loadInitialData();
    if (onContactsAdded) onContactsAdded();
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const data = await getContactsByGroupIdPaginated(contactGroupId,1, 1000, "");
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
      await loadInitialData();
      setRemoveDialogOpen(false);
      setGroupContactsToRemove(null);
    } catch (error) {
      console.error("Error al eliminar afiliación:", error);
      throw error;
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
                className={`animate-pulse bg-card rounded-lg border border-input p-4 ${
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

    if (contactsData.groupContacts.length === 0 && searchQuery) {
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
    
    if (contactsData.groupContacts.length === 0) {
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
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-card-foreground">
                Contactos del grupo
                </h3>
            </div>
            <p className="text-sm text-muted-foreground">
                {allContacts.length} contacto(s) asociado(s)
            </p>
            </div>

            {canCreateGroupContacts && (
            <div className="flex gap-2">
                <Button
                onClick={handleAddContacts}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <Input
            type="text"
            placeholder="Buscar contactos por nombre, email, teléfono o posición..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-base text-foreground placeholder-muted-foreground"
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
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-primary bg-primary/10 border border-primary/30 rounded-full">
                Email: {emailFilter}
                <button
                  onClick={() => setEmailFilter("")}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {phoneFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-primary bg-primary/10 border border-primary/30 rounded-full">
                Teléfono: {phoneFilter}
                <button
                  onClick={() => setPhoneFilter("")}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {showFilters && (
          <div className="bg-card border border-input rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
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