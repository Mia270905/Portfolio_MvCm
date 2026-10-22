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
  toggleUserActive,
  getUserWithHierarchy
} from "@/lib/actions/user.actions";

type UsersTableProps = {
  initialData: UsersResponse;
  allProfiles: any[];
};

export default function UsersTable({
  initialData,
  allProfiles,
}: UsersTableProps) {
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
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
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

  // Estados para controlar los timeouts de debounce
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [profileTimeout, setProfileTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentUserHierarchy, setCurrentUserHierarchy] = useState<number | null>(null);
  const [statusTimeout, setStatusTimeout] = useState<NodeJS.Timeout | null>(null);

  // Traer usuario y permisos
  useEffect(() => {
    const fetchPermissions = async () => {
      const userWithPermissions = await getUserWithPermissions();

      const permissions: string[] = Array.isArray(
        userWithPermissions?.permissions,
      )
        ? userWithPermissions.permissions.map((p: any) => p.code)
        : [];

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

    console.log(myLevel)
    console.log(targetLevel)
    console.log(myLevel > targetLevel)

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

  const updateParams = useCallback(
    (updates: Record<string, string>, resetPage: boolean = false) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Solo resetear página si se indica explícitamente
      if (resetPage) {
        params.set("page", "1");
      }

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [searchParams, router],
  );

    // Handler para cambio de búsqueda con debounce
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    
    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Crear nuevo timeout
    const timeout = setTimeout(() => {
      updateParams({ search: value }, true); // Resetear página al buscar
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ search: searchInput });
    }, 500); // Aumentamos a 500ms para mejor experiencia

    return () => clearTimeout(timer);
  }, [searchInput, updateParams]);

  // Debounce para filtro de perfil
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams({ profile: profileFilter });
    }, 300); // Menos tiempo para el filtro de perfil ya que es más rápido

    return () => clearTimeout(timer);
  }, [profileFilter, updateParams]);

    const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    
    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      updateParams({ status: value }, true);
    }, 300);
    // Nota: Deberías limpiar este timeout en un useEffect o useRef si el usuario clickea muy rápido
    setStatusTimeout(timeout);
  };

  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentSort === column) {
      params.set("order", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", column);
      params.set("order", "asc");
    }
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const getSortIcon = (column: string) => {
    if (currentSort !== column) {
      return (
        <svg
          className="h-4 w-4 text-gray-400"
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
        className="h-4 w-4 text-[#987E71]" // Cambiado a color principal
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
        className="h-4 w-4 text-[#987E71]" // Cambiado a color principal
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
    if (statusTimeout) {
      clearTimeout(statusTimeout);
      setStatusTimeout(null);
    }

    setSearchInput("");
    setProfileFilter("");
    setStatusFilter("");

    // Limpiar filtros manteniendo solo la página
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  // Manejo directo del cambio de perfil (opcional - más rápido)
  const handleProfileFilterChange = (value: string) => {
    setProfileFilter(value);
    // Si quieres que sea instantáneo, descomenta esta línea:
    // updateParams({ profile: value });
  };

  if (loadingPermissions) return null;

  if (!canReadUsers) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">
        No tienes permisos para ver los usuarios.
      </div>
    );
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Búsqueda */}
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
            placeholder="Buscar por nombre o correo..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 md:py-2 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:border-[#987E71] text-base" // Cambiado focus ring y border
          />
        </div>

        {/* Filtro por perfil */}
        <div className="w-full md:w-64">
          <select
            value={profileFilter}
            onChange={(e) => handleProfileFilterChange(e.target.value)}
            className="w-full px-3 md:py-2 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:border-[#987E71] text-base bg-white" // Cambiado focus ring y border
          >
            <option value="">Todos los perfiles</option>
            {allProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por estado */}
        <div className="w-full md:w-40">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="w-full px-3 md:py-2 py-2.5 border border-[#CFC7B8] rounded-lg bg-white text-neutral-900"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>

        {/* Botón limpiar filtros */}
        {(searchInput || profileFilter || statusFilter) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-[#987E71] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" // Cambiado hover color
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex justify-center">
          <div className="bg-[#f5f0ed] text-[#987E71] px-4 py-2 rounded-lg text-sm"> {/* Color de fondo claro y texto principal */}
            Cargando...
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isPending && initialData.users.length === 0 && (
        <>
          {/* Skeleton Desktop */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-gray-100 px-6 py-3 flex justify-between items-center text-gray-700">
                <div className="flex gap-4">
                  <div className="h-4 bg-gray-300 rounded-sm w-24"></div>
                  <div className="h-4 bg-gray-300 rounded-sm w-32"></div>
                  <div className="h-4 bg-gray-300 rounded-sm w-24"></div>
                  <div className="h-4 bg-gray-300 rounded-sm w-20"></div>
                </div>
                <div className="h-4 bg-gray-300 rounded-sm w-16"></div>
              </div>

              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-t border-gray-200 px-6 py-4 flex justify-between items-center"
                >
                  <div className="flex gap-8 items-center">
                    <div className="h-4 bg-gray-200 rounded-sm w-40"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-56"></div>
                    <div className="h-4 bg-gray-200 rounded-sm w-32"></div>
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
                      <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Mobile */}
          <div className="md:hidden space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded-sm w-32"></div>
                    <div className="h-3 bg-gray-200 rounded-sm w-48"></div>
                    <div className="h-3 bg-gray-200 rounded-sm w-24"></div>
                  </div>
                  <div className="h-5 w-5 bg-gray-200 rounded-full ml-3"></div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-6 w-12 bg-gray-200 rounded-full"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
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
          <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Fondo claro y texto principal */}
              <thead className="bg-[#f5f0ed] text-[#987E71]"> 
                <tr>
                  <th
                    onClick={() => handleSort("full_name")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#e8dfd9] select-none" // Hover más claro
                  >
                    <div className="flex items-center gap-2">
                      Nombre
                      {getSortIcon("full_name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#e8dfd9] select-none" // Hover más claro
                  >
                    <div className="flex items-center gap-2">
                      Correo
                      {getSortIcon("email")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Perfil
                  </th>
                  <th
                    onClick={() => handleSort("active")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-[#e8dfd9] select-none" // Hover más claro
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

              <tbody className="bg-white divide-y divide-gray-200">
                {initialData.users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canUpdateUsers ? 5 : 4}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  initialData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 relative">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {user.profile_name || (
                            <span className="text-gray-400 italic">
                              Sin perfil
                            </span>
                          )}
                        </div>
                      </td>
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
                              isHierarchyInsufficient(user)
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                              user.active ? "bg-green-500" : "bg-gray-300"
                            }`}
                            title={ currentUserHierarchy !== null && ((user as any).hierarchy ?? 99) < (currentUserHierarchy ?? 99)
                                  ? "Jerarquía insuficiente"
                                  : user.active 
                                    ? "Click para desactivar" 
                                    : "Click para activar"
                            }
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                user.active ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span
                            className={`ml-3 px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                              user.active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </td>

                      {canUpdateUsers && (
                        <td className="px-6 py-4 text-right align-middle">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-2 rounded-full hover:bg-[#f5f0ed] transition-colors"> {/* Hover con color claro */}
                                <MoreVertical
                                  size={18}
                                  className="text-gray-500 hover:text-[#987E71]" // Hover con color principal
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2" align="end">
                              <Link
                                className={`${isHierarchyInsufficient(user)?'pointer-events-none':''}`}
                                href={`/dashboard/seguridad/usuarios/editar/${user.id}`}
                              >
                                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#f5f0ed] rounded-md"> {/* Hover con color claro */}
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
            {initialData.users.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                No se encontraron usuarios
              </div>
            ) : (
              initialData.users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {user.full_name}
                      </h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Perfil: {user.profile_name || "Sin perfil"}
                      </p>
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.active ? "bg-green-500" : "bg-gray-300"
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
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              user.active ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span
                          className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                            user.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      {/* Botón 3 puntos - redirección a edición */}
                      {canUpdateUsers && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-[#f5f0ed]"> {/* Hover con color claro */}
                              <svg
                                className="h-5 w-5 text-gray-500 hover:text-[#987E71]" // Hover con color principal
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2" align="end">
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
                                className={`w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#f5f0ed] rounded-md ${
                                  isHierarchyInsufficient(user)
                                    ? "opacity-30 cursor-not-allowed text-custom-text-tertiary"
                                    : "text-custom-text-secondary hover:bg-custom-accent-hover hover:text-custom-accent-primary"
                                }`}
                                title={isHierarchyInsufficient(user) ? "Jerarquía insuficiente para editar" : ""}
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {(currentPage - 1) * initialData.pageSize + 1} -{" "}
            {Math.min(currentPage * initialData.pageSize, initialData.total)} de{" "}
            {initialData.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-[#f5f0ed] hover:text-[#987E71] disabled:opacity-50 disabled:cursor-not-allowed flex items-center" // Hover con color claro
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
                        <span className="px-3 py-1 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        disabled={isPending}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${
                          p === currentPage
                            ? "bg-[#987E71] text-white border-[#987E71] hover:bg-[#b19587]" // Color principal y hover
                            : "border-gray-300 text-gray-700 hover:bg-[#f5f0ed] hover:text-[#987E71]" // Hover con color claro y texto principal
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
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-[#f5f0ed] hover:text-[#987E71] disabled:opacity-50 disabled:cursor-not-allowed flex items-center" // Hover con color claro
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