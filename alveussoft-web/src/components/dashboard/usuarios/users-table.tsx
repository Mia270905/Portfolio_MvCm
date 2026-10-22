"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useCallback } from "react";
import type { UsersResponse } from "@/lib/actions/user.actions";
import { ConfirmDialog } from "@/components/general/confirm-dialog";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import {
  getUserWithPermissions,
  toggleUserActive,getUsersWithFilters,
} from "@/lib/actions/user.actions";

type UsersTableProps = {
  initialData: UsersResponse;
  allProfiles?: any[]; // Hacerlo opcional para compatibilidad
};

// --- NUEVA FUNCIÓN PARA LAS INICIALES ---
const getInitials = (name: string) => {
  if (!name) return "US";
  const words = name.trim().split(" ");
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  return words[0].substring(0, 2).toUpperCase();
};
// ------------------------------------------

export default function UsersTable({ initialData, allProfiles = [] }: UsersTableProps) {
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentSearch = searchParams.get("search") || "";
  const currentProfileFilter = searchParams.get("profile") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [profileFilter, setProfileFilter] = useState(currentProfileFilter);
  const currentSort = searchParams.get("sort") || "full_name";
  const currentOrder = (searchParams.get("order") || "asc") as "asc" | "desc";
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string;
    currentActive: boolean;
    userName: string;
  } | null>(null);

  const [canReadUsers, setCanReadUsers] = useState<boolean>(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [canUpdateUsers, setCanUpdateUsers] = useState(false);
  const [currentUserHierarchy, setCurrentUserHierarchy] = useState<number | null>(null);
const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  // Estados para controlar los timeouts de debounce
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [profileTimeout, setProfileTimeout] = useState<NodeJS.Timeout | null>(null);
  

  // Traer usuario y permisos
  useEffect(() => {
    const fetchPermissions = async () => {
      const userWithPermissions = await getUserWithPermissions();
      
      if (userWithPermissions) {
        setCanReadUsers(userWithPermissions.permissions.some((p: any) => p.code === "read:users"));
        setCanUpdateUsers(userWithPermissions.permissions.some((p: any) => p.code === "update:users"));
        setCurrentUserId(userWithPermissions.id);
        const actualHierarchy = userWithPermissions.profile?.hierarchy ?? 99;
        setCurrentUserHierarchy(actualHierarchy);
      }
      setLoadingPermissions(false);
    };
    fetchPermissions();
  }, []); 

  const canModify = (targetUser: any) => {
    if (!canUpdateUsers) return false;
    if (currentUserId === targetUser.id) return false; // No editarse a uno mismo

    const myLevel = currentUserHierarchy ?? 99;
    
    // IMPORTANTE: En el listado de usuarios (initialData), 
    // asegúrate de que cada 'user' tenga su 'hierarchy'
    const targetLevel = targetUser.hierarchy ?? 99;

    // Lógica: "Si mi número es menor o igual al tuyo, tengo permiso"
    // Ejemplo: Yo (0) vs Otro (2) -> 0 <= 2 es TRUE.
    return myLevel <= targetLevel;
  };

  const handleToggleActive = async (
    userId: string,
    currentActive: boolean,
    userName: string,
  ) => {
    if (!canUpdateUsers) {
      toast.error(
        "No tienes permisos para actualizar el estado de los usuarios.",
      );
      return;
    }

    setConfirmDialog({
      isOpen: true,
      userId,
      currentActive,
      userName,
    });
  };

  const isHierarchyInsufficient = (targetUser: any) => {
    if (currentUserHierarchy == null) return true;

    const myLevel = Number(currentUserHierarchy);

    const rawTargetLevel = targetUser.hierarchy ?? targetUser.profiles?.hierarchy;

    const targetLevel =
      rawTargetLevel !== undefined && rawTargetLevel !== null
        ? Number(rawTargetLevel)
        : 99;

    return myLevel > targetLevel;
  };


  const confirmToggle = async () => {
    if (!confirmDialog) return;

    setTogglingUserId(confirmDialog.userId);
    setConfirmDialog(null);

    const result = await toggleUserActive(
      confirmDialog.userId,
      confirmDialog.currentActive,
    );

    if (result.success) {
      toast.success(
        confirmDialog.currentActive
          ? "Usuario desactivado exitosamente"
          : "Usuario activado exitosamente",
      );
      router.refresh();
    } else {
      toast.error(result.error || "Error al actualizar el usuario");
    }

    setTogglingUserId(null);
  };

// Declarar estado para manejar debounce
const [statusTimeout, setStatusTimeout] = useState<NodeJS.Timeout | null>(null);

const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    const timeout = setTimeout(() => {
      updateParams({ status: value }, true);
    }, 300);
    // Nota: Deberías limpiar este timeout en un useEffect o useRef si el usuario clickea muy rápido
  };

// --- NUEVO: ESTADO PARA SELECCIÓN MASIVA ---
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Usuarios que realmente se pueden seleccionar en la página actual...
  const selectableUsersOnPage = initialData?.users?.filter(
    (u) => canUpdateUsers && currentUserId !== u.id && !isHierarchyInsufficient(u)
  ) || [];

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId) // Lo quita si ya estaba
        : [...prev, userId] // Lo agrega si no estaba
    );
  };

  const handleSelectAll = () => {
    // Si todos los disponibles están seleccionados, los deselecciona
    if (
      selectableUsersOnPage.length > 0 &&
      selectableUsersOnPage.every((u) => selectedUsers.includes(u.id))
    ) {
      setSelectedUsers((prev) =>
        prev.filter((id) => !selectableUsersOnPage.some((u) => u.id === id))
      );
    } else {
      // Selecciona todos los disponibles en esta página
      const newSelected = [...selectedUsers];
      selectableUsersOnPage.forEach((u) => {
        if (!newSelected.includes(u.id)) newSelected.push(u.id);
      });
      setSelectedUsers(newSelected);
    }
  };

  const isAllSelected =
    selectableUsersOnPage.length > 0 &&
    selectableUsersOnPage.every((u) => selectedUsers.includes(u.id));
  // ------------------------------------------



const updateParams = useCallback(
    (updates: Record<string, string | number>, resetPage: boolean = false) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value || value === "0") {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      if (resetPage) params.set("page", "1");

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [searchParams, router]
  );

  // Handler para cambio de búsqueda con debounce

const handleSearchChange = (value: string) => {
    setSearchInput(value);
    const timeout = setTimeout(() => {
      updateParams({ search: value }, true);
    }, 500);
  };
  // Handler para cambio de filtro de perfil con debounce
  const handleProfileFilterChange = (value: string) => {
    setProfileFilter(value);
    
    // Limpiar timeout anterior
    if (profileTimeout) {
      clearTimeout(profileTimeout);
    }
    
    // Crear nuevo timeout
    const timeout = setTimeout(() => {
      updateParams({ profile: value }, true); // Resetear página al filtrar
    }, 300);
    
    setProfileTimeout(timeout);
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSort === column) {
      params.set("order", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", column);
      params.set("order", "asc");
    }
    
    // Mantener la página actual al ordenar
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const getSortIcon = (column: string) => {
    if (currentSort !== column) {
      return (
        <svg
          className="h-4 w-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      );
    }
    return currentOrder === "asc" ? (
      <svg
        className="h-4 w-4 text-yellow-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="h-4 w-4 text-yellow-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    );
  };

  const clearFilters = () => {
    // Limpiar timeouts
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    if (profileTimeout) {
      clearTimeout(profileTimeout);
      setProfileTimeout(null);
    }
    
    setSearchInput("");
    setProfileFilter("");
    
    // Limpiar filtros manteniendo solo la página
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };
  useEffect(() => {
  setStatusFilter(searchParams.get("status") || "");
}, [searchParams]);

  // Cleanup de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
      if (profileTimeout) clearTimeout(profileTimeout);
    };
  }, [searchTimeout, profileTimeout]);

  // Handler para cambio de página (SIMPLIFICADO)
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  if (loadingPermissions) return null;

  if (!canReadUsers) {
    return (
      <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-red-400">
        No tienes permisos para ver los usuarios.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-3">

      {/* Barra de Acciones Masivas */}
      {selectedUsers.length > 0 && (
        <div className="bg-custom-bg-tertiary border border-custom-accent-primary/50 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-custom-text-primary">
            <span className="text-custom-accent-primary font-bold">
              {selectedUsers.length}
            </span>{" "}
            usuario(s) seleccionado(s)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedUsers([])}
              className="px-3 py-1.5 text-sm text-custom-text-tertiary hover:text-custom-text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => toast.info(`Función masiva en desarrollo para ${selectedUsers.length} usuarios`)}
              className="px-3 py-1.5 text-sm bg-custom-accent-primary text-black font-semibold rounded-md hover:bg-yellow-400 transition-colors shadow-sm shadow-yellow-400/20"
            >
              Acción Masiva
            </button>
          </div>
        </div>
      )}

        {/* Búsqueda */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-custom-text-tertiary"
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
            placeholder="Buscar por nombre o correo..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 md:py-2 py-2.5 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary text-base transition-all duration-200"
          />
        </div>

        {/* Filtro por perfil - Solo mostrar si hay perfiles */}
        {allProfiles.length > 0 && (
          <div className="w-full md:w-64">
            <select
              value={profileFilter}
              onChange={(e) => handleProfileFilterChange(e.target.value)}
              className="w-full px-3 md:py-2 py-2.5 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary text-base transition-all duration-200"
            >
              <option value="" className="bg-custom-bg-secondary text-custom-text-primary">
                Todos los perfiles
              </option>
              {allProfiles.map((profile) => (
                <option 
                  key={profile.id} 
                  value={profile.id}
                  className="bg-custom-bg-secondary text-custom-text-primary"
                >
                  {profile.name}
                </option>
              ))}
            </select>
            
          </div>
          
        )}
        {/* Filtro por estado */}
        <div className="w-full md:w-48">
         <select
           value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="w-full px-3 md:py-2 py-2.5 border border-custom-border-primary rounded-lg bg-custom-bg-tertiary text-custom-text-primary"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        {/* Botón limpiar filtros */}
        {(searchInput || profileFilter) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-custom-text-tertiary hover:text-custom-accent-primary border border-custom-border-primary rounded-lg hover:bg-custom-accent-hover transition-all duration-200"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex justify-center">
          <div className="bg-custom-accent-hover text-custom-accent-primary px-4 py-2 rounded-lg text-sm border border-custom-accent-border">
            Cargando...
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isPending && initialData.users.length === 0 && (
        <>
          {/* Skeleton Desktop */}
          <div className="hidden md:block bg-custom-bg-secondary rounded-lg border border-custom-border-secondary overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-custom-bg-tertiary px-6 py-3 flex justify-between items-center text-custom-text-tertiary">
                <div className="flex gap-4">
                  <div className="h-4 bg-custom-bg-hover rounded-sm w-24"></div>
                  <div className="h-4 bg-custom-bg-hover rounded-sm w-32"></div>
                  {allProfiles.length > 0 && (
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-24"></div>
                  )}
                  <div className="h-4 bg-custom-bg-hover rounded-sm w-20"></div>
                </div>
                <div className="h-4 bg-custom-bg-hover rounded-sm w-16"></div>
              </div>

              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-t border-custom-border-secondary px-6 py-4 flex justify-between items-center"
                >
                  <div className="flex gap-8 items-center">
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-40"></div>
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-56"></div>
                    {allProfiles.length > 0 && (
                      <div className="h-4 bg-custom-bg-hover rounded-sm w-32"></div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-12 bg-custom-bg-hover rounded-full"></div>
                      <div className="h-4 w-16 bg-custom-bg-hover rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-5 w-5 bg-custom-bg-hover rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Mobile */}
          <div className="md:hidden space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 animate-pulse"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-32"></div>
                    <div className="h-3 bg-custom-bg-hover rounded-sm w-48"></div>
                    {allProfiles.length > 0 && (
                      <div className="h-3 bg-custom-bg-hover rounded-sm w-24"></div>
                    )}
                  </div>
                  <div className="h-5 w-5 bg-custom-bg-hover rounded-full ml-3"></div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-6 w-12 bg-custom-bg-hover rounded-full"></div>
                  <div className="h-4 w-16 bg-custom-bg-hover rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tabla - Desktop / Cards - Mobile */}
      {!isPending && (
        <>
          {/* Vista Desktop - Tabla */}
          <div className="hidden md:block bg-custom-bg-secondary rounded-lg border border-custom-border-secondary overflow-hidden">
            <table className="min-w-full divide-y divide-custom-border-secondary">
              <thead className="bg-custom-bg-tertiary text-custom-text-tertiary">
                <tr>

                  {/* Checkbox "Seleccionar Todos" en el encabezado */}
                  {canUpdateUsers && (
                    <th className="px-6 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        disabled={selectableUsersOnPage.length === 0}
                        className="h-4 w-4 rounded border-custom-border-primary bg-custom-bg-tertiary text-custom-accent-primary focus:ring-custom-accent-primary cursor-pointer"
                      />
                    </th>
                  )}

                  <th
                    onClick={() => handleSort("full_name")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-custom-bg-hover select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Nombre
                      {getSortIcon("full_name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-custom-bg-hover select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Correo
                      {getSortIcon("email")}
                    </div>
                  </th>
                  {/* Columna de Tipo de Usuario/Perfil */}
                  {allProfiles.length > 0 && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        Tipo de Usuario
                      </div>
                    </th>
                  )}
                  <th
                    onClick={() => handleSort("active")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-custom-bg-hover select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Estado
                      {getSortIcon("active")}
                    </div>
                  </th>
                  {canUpdateUsers && (
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-custom-bg-secondary divide-y divide-custom-border-secondary">
                {/* 1. Usamos la variable filtrada que ya creaste arriba */}
                {initialData.users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canUpdateUsers ? (allProfiles.length > 0 ? 5 : 4) : (allProfiles.length > 0 ? 4 : 3)}
                      className="px-6 py-4 text-center text-custom-text-tertiary"
                    >
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  initialData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-custom-bg-hover transition-colors duration-200">

                    {/* Checkbox individual en la fila */}
                      {canUpdateUsers && (
                        <td className="px-6 py-4 whitespace-nowrap w-12">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            disabled={currentUserId === user.id || isHierarchyInsufficient(user)}
                            className="h-4 w-4 rounded border-custom-border-primary bg-custom-bg-tertiary text-custom-accent-primary focus:ring-custom-accent-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </td>
                      )}

                          {/* avatar y datos */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-sm font-medium text-amber-500 select-none">
                            {getInitials(user.full_name)}
                          </div>
                          <div className="text-sm font-medium text-custom-text-primary">
                            {user.full_name}
                          </div>
                        </div>
                      </td>



                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-custom-text-tertiary">
                          {user.email}
                        </div>
                      </td>
                      {allProfiles.length > 0 && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-custom-text-secondary">
                            {user.profile_name || (
                              <span className="text-custom-text-tertiary italic">
                                Sin perfil
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                handleToggleActive(
                                  user.id,
                                  user.active,
                                  user.full_name,
                                )
                              }
                              disabled={
                              togglingUserId === user.id ||
                              currentUserId === user.id ||
                              (currentUserHierarchy !== null &&
                                Number(user.hierarchy ?? 99) < Number(currentUserHierarchy ?? 99))
                            }

                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-accent-primary disabled:opacity-30 disabled:cursor-not-allowed ${
                                user.active ? "bg-green-500" : "bg-custom-text-tertiary"
                              }`}
                              title={
                                currentUserHierarchy !== null && ((user as any).hierarchy ?? 99) < (currentUserHierarchy ?? 99)
                                  ? "Jerarquía insuficiente"
                                  : user.active 
                                    ? "Click para desactivar" 
                                    : "Click para activar"
                              }
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${
                                  user.active ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                        </div>
                      </td>
                      {canUpdateUsers && (
                        <td className="px-6 py-4 text-right align-middle">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-2 rounded-full hover:bg-custom-accent-hover transition-all duration-200">
                                <MoreVertical
                                  size={18}
                                  className="text-custom-text-tertiary hover:text-custom-accent-primary transition-colors"
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2 bg-custom-bg-secondary border border-custom-border-primary" align="end">
                              <Link
                                href={`/dashboard/seguridad/usuarios/editar/${user.id}`}
                              >
                            <button
                                disabled={isHierarchyInsufficient(user)}
                                onClick={(e) => {
                                  // 1. Extraemos los valores para la alerta
                                  const myLevel = currentUserHierarchy;
                                  const targetLevel = (user as any).hierarchy;
                                  const isBlocked = isHierarchyInsufficient(user);

                                  // 3. Bloqueamos la acción si es insuficiente
                                  if (isBlocked) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                                  isHierarchyInsufficient(user)
                                    ? "opacity-30 cursor-not-allowed text-custom-text-tertiary"
                                    : "text-custom-text-secondary hover:bg-custom-accent-hover hover:text-custom-accent-primary"
                                }`}
                                title={isHierarchyInsufficient(user) ? "Jerarquía insuficiente para editar" : ""}
                              >
                                Editar
                              </button>
                              </Link>
                            </PopoverContent>
                          </Popover>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="md:hidden space-y-3">

              {/* Checkbox "Seleccionar Todos" en Móvil */}
              {initialData.users.length > 0 && canUpdateUsers && (
                <div className="flex items-center gap-2 px-2 pb-2">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={selectableUsersOnPage.length === 0}
                    id="selectAllMobile"
                    className="h-5 w-5 rounded border-custom-border-primary bg-custom-bg-tertiary text-custom-accent-primary focus:ring-custom-accent-primary cursor-pointer disabled:opacity-50"
                  />
                  <label htmlFor="selectAllMobile" className="text-sm font-medium text-custom-text-secondary cursor-pointer select-none">
                    Seleccionar todos en esta página
                  </label>
                </div>
              )}

            {initialData.users.length === 0 ? (
              <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-custom-text-tertiary">
                No se encontraron usuarios
              </div>
            ) : (
              initialData.users.map((user) => (
                <div
                  key={user.id}
                  className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 hover:border-custom-accent-border transition-all duration-200"
                >
                  <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                        {/* Checkbox individual móvil */}
                        {canUpdateUsers && (
                          <div className="pt-1.5">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => handleSelectUser(user.id)}
                              disabled={currentUserId === user.id || isHierarchyInsufficient(user)}
                              className="h-4 w-4 rounded border-custom-border-primary bg-custom-bg-tertiary text-custom-accent-primary focus:ring-custom-accent-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </div>
                        )}
                        
                        {/* Avatar y Datos */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/20 text-sm font-medium text-amber-500 select-none">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-custom-text-primary leading-none mb-1">
                            {user.full_name}
                          </h3>
                          <p className="text-sm text-custom-text-tertiary">{user.email}</p>
                          {allProfiles.length > 0 && (
                            <p className="text-sm text-custom-text-tertiary mt-1">
                              Tipo: {user.profile_name || "Sin perfil"}
                            </p>
                          )}
                        </div>
                      </div>

                      

                    {/* Botones de estado y edición */}
                    <div className="flex items-center justify-between mt-2">
                      {/* Toggle estado */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            handleToggleActive(
                              user.id,
                              user.active,
                              user.full_name,
                            )
                          }
                          disabled={
                            togglingUserId === user.id ||
                            currentUserId === user.id
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-custom-accent-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.active ? "bg-green-500" : "bg-custom-text-tertiary"
                          }`}
                        title={
                          currentUserHierarchy !== null &&
                          Number(user.hierarchy ?? 99) < Number(currentUserHierarchy ?? 99)
                            ? "Jerarquía insuficiente"
                            : user.active
                              ? "Click para desactivar"
                              : "Click para activar"
                        }
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${
                              user.active ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span
                          className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                            user.active
                              ? "bg-green-400/20 text-green-400"
                              : "bg-red-400/20 text-red-400"
                          }`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      {/* Botón 3 puntos - redirección a edición */}
                      {canUpdateUsers && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-custom-accent-hover transition-all duration-200">
                              <MoreVertical 
                                size={18}
                                className="text-custom-text-tertiary hover:text-custom-accent-primary transition-colors"
                              />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2 bg-custom-bg-secondary border border-custom-border-primary" align="end">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/seguridad/usuarios/editar/${user.id}`,
                                )
                              }
                              className="w-full text-left px-3 py-2 text-sm text-custom-text-secondary hover:bg-custom-accent-hover hover:text-custom-accent-primary rounded-md transition-all duration-200"
                            >
                              Editar
                            </button>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Paginación */}
      {initialData.totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-custom-text-tertiary">
            {(currentPage - 1) * initialData.pageSize + 1} -{" "}
            {Math.min(currentPage * initialData.pageSize, initialData.total)} de{" "}
            {initialData.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="px-3 py-2 border border-custom-border-primary rounded-md text-sm font-medium text-custom-text-secondary hover:bg-custom-bg-hover hover:text-custom-accent-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div className="flex gap-1">
              {Array.from({ length: initialData.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Mostrar primeras 2, últimas 2, y páginas cercanas a la actual
                  return (
                    p === 1 ||
                    p === initialData.totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                  );
                })
                .map((p, idx, arr) => {
                  // Agregar "..." entre gaps
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;

                  return (
                    <div key={p} className="flex gap-1">
                      {showEllipsis && (
                        <span className="px-3 py-1 text-custom-text-tertiary">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        disabled={isPending}
                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-all duration-200 ${
                          p === currentPage
                            ? "bg-custom-accent-primary text-custom-bg-primary border-custom-accent-primary hover:bg-custom-accent-secondary"
                            : "border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-hover hover:text-custom-accent-primary"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {p}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === initialData.totalPages || isPending}
              className="px-3 py-2 border border-custom-border-primary rounded-md text-sm font-medium text-custom-text-secondary hover:bg-custom-bg-hover hover:text-custom-accent-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={
            confirmDialog.currentActive
              ? "Desactivar usuario"
              : "Activar usuario"
          }
          message={`¿Estás seguro de que deseas ${
            confirmDialog.currentActive ? "desactivar" : "activar"
          } a ${confirmDialog.userName}?`}
          confirmText={confirmDialog.currentActive ? "Desactivar" : "Activar"}
          cancelText="Cancelar"
          onConfirm={confirmToggle}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}