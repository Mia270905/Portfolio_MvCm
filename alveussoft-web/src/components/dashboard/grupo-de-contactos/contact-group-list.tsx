"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import ContactGroupItem from "./contact-group-item";
import { ContactGroupDialog  } from "./contact-group-dialog";
import { Button } from "../../ui/button"
import { Plus } from "lucide-react";
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
    pageSize: 50,
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
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">
          No tienes permisos para ver los grupos de contactos.
        </div>
      </div>
    );
  }

  // Mostrar skeleton solo en carga inicial
  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Skeleton de barra de búsqueda */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="h-10 bg-[#0A0F17] rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton de varios grupos de contactos */}
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A0F17] rounded-lg shadow-xs border border-gray-800 p-4"
          >
            {/* Contenedor de imagen y texto */}
            <div className="flex items-center space-x-4">
              {/* Imagen */}
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-800 rounded-full" />

              {/* Texto */}
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-800 rounded-sm w-3/4" />
                <div className="h-3 bg-gray-800 rounded-sm w-1/2" />
              </div>
            </div>

            {/* Botones de acciones (editar/eliminar) */}
            <div className="flex justify-end sm:justify-start space-x-2">
              <div className="h-8 w-8 bg-gray-800 rounded" />
              <div className="h-8 w-8 bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contactGroupsData.contactGroups.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-white mb-4 text-sm sm:text-base">
          No hay grupos de contactos registrados
        </p>
        {canCreateContactGroups && (
          <Link href="/dashboard/contacts-parent/grupo-contactos/crear">
            <Button className="inline-flex items-center px-3 md:px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg">
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Primer Grupo de Contactos</span>
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Barra de búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar categorías por título..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-base text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Mostrar indicador de búsqueda solo cuando hay query */}
      {isSearching && searchQuery && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Buscando grupos de contactos...</span>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados de búsqueda */}
      {contactGroupsData.contactGroups.length === 0 &&
        searchQuery &&
        !isSearching && (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-gray-300 mb-2 text-sm sm:text-base">
              No se encontraron grupos de contactos que coincidan con `&quot;`{searchQuery}`&quot;`
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}

      {/* Lista de grupos de contactos - Siempre visible excepto durante búsqueda con query */}
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

      {/* Dialog para editar/crear - Solo si tiene permisos */}
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
