"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ContactGroupItem from "./contact-group-item";
import { ContactGroupDialog  } from "./contact-group-dialog";
import { Button } from "../../ui/button"
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { ContactGroupPagination } from "./contact-group-pagination";

export interface ContactGroup {
  id: string;
  title: string;
  description: string;
  image_url: string | File;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface ContactGroupResponse {
  contactGroups: ContactGroup[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ContactGroupListProps {
  userPermissions?: string[];
}

const supabase = createClient();

export function ContactGroupList({ userPermissions = [] }: ContactGroupListProps) {
  const [contactGroupsData, setContactGroupsData] = useState<ContactGroupResponse>({
    contactGroups: [],
    total: 0,
    page: 1,
    pageSize: 5,
    totalPages: 0,
  });
  const [selectedContactGroup, setSelectedContactGroup] =
    useState<ContactGroup | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const canCreateContactGroups = userPermissions.includes("create:contact-group");
  const canUpdateContactGroups = userPermissions.includes("update:contact-group");
  const canDeleteContactGroups = userPermissions.includes("delete:contact-group");
  const canReadContactGroups = userPermissions.includes("read:contact-group");

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setContactGroupsData((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Traer datos de Supabase con paginación y búsqueda
  useEffect(() => {
    const fetchContactGroups = async () => {
      // Si no tiene permiso de lectura, no hacer la petición
      if (!canReadContactGroups) {
        setInitialLoading(false);
        return;
      }

      if (searchQuery) {
        setIsSearching(true);
      }

      const from = (contactGroupsData.page - 1) * contactGroupsData.pageSize;
      const to = from + contactGroupsData.pageSize - 1;

      let query = supabase
        .from("contact_groups")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: true })
        .is("deleted_at", null);

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error al obtener grupos de contactos:", error.message);
      } else {
        const totalPages = count
          ? Math.ceil(count / contactGroupsData.pageSize)
          : 0;

        setContactGroupsData((prev) => ({
          ...prev,
          contactGroups: data.map((cat) => ({
            id: cat.id,
            title: cat.title,
            description: cat.description,
            image_url: cat.image_url,
            active: cat.active,
            created_at: cat.created_at,
            updated_at: cat.updated_at,
          })),
          total: count || 0,
          totalPages,
        }));
      }

      if (initialLoading) {
        setInitialLoading(false);
      }

      setIsSearching(false);
    };

    fetchContactGroups();
  }, [contactGroupsData.page, searchQuery, initialLoading, canReadContactGroups]);

  const handleEdit = (contactGroup: ContactGroup) => {
    if (canUpdateContactGroups) {
      setSelectedContactGroup(contactGroup);
      setIsDialogOpen(true);
    }
  };

  const handleCreate = () => {
    if (canCreateContactGroups) {
      setSelectedContactGroup(null);
      setIsDialogOpen(true);
    }
  };

  const handleSave = (contactGroup: Partial<ContactGroup>) => {
    if (!canCreateContactGroups && !canUpdateContactGroups) return;

    if (selectedContactGroup && selectedContactGroup.id) {
      setContactGroupsData((prev) => ({
        ...prev,
        contactGroups: prev.contactGroups.map((cat) =>
          cat.id === selectedContactGroup.id ? { ...cat, ...contactGroup } : cat
        ),
      }));
    } else {
      setContactGroupsData((prev) => ({
        ...prev,
        contactGroups: [
          ...prev.contactGroups,
          {
            id: Date.now().toString(),
            title: contactGroup.title || "Nuevo grupo de contactos",
            description: contactGroup.description || "",
            image_url: contactGroup.image_url || "",
            active: contactGroup.active ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      }));
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (contactGroupId: string) => {
    if (!canDeleteContactGroups) return;

    setContactGroupsData((prev) => ({
      ...prev,
      contactGroups: prev.contactGroups.filter((cat) => cat.id !== contactGroupId),
      total: prev.total - 1,
      totalPages: Math.ceil((prev.total - 1) / prev.pageSize),
    }));
  };

  const handlePageChange = (page: number) => {
    setContactGroupsData((prev) => ({
      ...prev,
      page,
    }));
  };

  // Si no tiene permiso de lectura
  if (!canReadContactGroups && !initialLoading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-white rounded-lg border border-[#f5efe6] p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#fdeaea] flex items-center justify-center">
            <svg className="w-6 h-6 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Acceso restringido
          </h3>
          <p className="text-neutral-600">
            No tienes permisos para ver los grupos de contactos.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar skeleton solo en carga inicial
  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Skeleton de barra de búsqueda */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="h-10 bg-[#faf8f3] rounded-lg animate-pulse border border-[#e6dcc9]" />
          </div>
        </div>

        {/* Skeleton de varios grupos de contactos */}
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-lg border border-[#f5efe6] p-4"
          >
            {/* Contenedor de imagen y texto */}
            <div className="flex items-center space-x-4">
              {/* Imagen */}
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-[#f5efe6] rounded-full" />

              {/* Texto */}
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-[#f5efe6] rounded-sm w-3/4" />
                <div className="h-3 bg-[#f5efe6] rounded-sm w-1/2" />
              </div>
            </div>

            {/* Botones de acciones (editar/eliminar) */}
            <div className="flex justify-end sm:justify-start space-x-2">
              <div className="h-8 w-8 bg-[#f5efe6] rounded" />
              <div className="h-8 w-8 bg-[#f5efe6] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contactGroupsData.contactGroups.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#faf8f3] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#c6a365]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No hay grupos de contactos</h3>
          <p className="text-neutral-600 mb-6">
            Crea el primer grupo de contactos para empezar
          </p>
          {canCreateContactGroups && (
            <Link href="/dashboard/contacts-parent/grupo-contactos/crear">
              <Button className="inline-flex items-center gap-2 px-6 py-3 bg-[#c6a365] hover:bg-[#b59555] text-white font-medium rounded-lg shadow-sm hover:shadow-lg hover:shadow-[#c6a365]/25">
                <Plus className="w-5 h-5" />
                Crear Primer Grupo de Contactos
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Barra de búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar grupos de contactos por título..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#e6dcc9] rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50"
          />
        </div>
      </div>

      {/* Mostrar indicador de búsqueda */}
      {isSearching && searchQuery && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-neutral-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#c6a365]"></div>
            <span className="text-sm">Buscando grupos de contactos...</span>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados de búsqueda */}
      {contactGroupsData.contactGroups.length === 0 &&
        searchQuery &&
        !isSearching && (
          <div className="text-center py-8">
            <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#faf8f3] flex items-center justify-center">
                <Search className="w-6 h-6 text-[#c6a365]" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-neutral-600 mb-2">
                No hay grupos de contactos que coincidan con "{searchQuery}"
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
        )}

      {/* Lista de grupos de contactos */}
      {(!isSearching || !searchQuery) && (
        <div className="space-y-3 sm:space-y-4">
          {contactGroupsData.contactGroups.map((contactGroup) => (
            <ContactGroupItem
              key={contactGroup.id}
              contactGroup={contactGroup}
              onEdit={handleEdit}
              onDelete={handleDelete}
              userPermissions={userPermissions}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {contactGroupsData.totalPages > 1 && !isSearching && (
        <ContactGroupPagination
          currentPage={contactGroupsData.page}
          totalPages={contactGroupsData.totalPages}
          totalItems={contactGroupsData.total}
          pageSize={contactGroupsData.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Dialog para editar/crear */}
      {(canCreateContactGroups || canUpdateContactGroups) && (
        <ContactGroupDialog
          contactGroup={selectedContactGroup}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          isLoading={false}
          onImageChange={(urlOrFile) => {
            // console.log("Imagen seleccionada o URL:", urlOrFile);
          }}
          errors={{}}
        />
      )}
    </>
  );
}