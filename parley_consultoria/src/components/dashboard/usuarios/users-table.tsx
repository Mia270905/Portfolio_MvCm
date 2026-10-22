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
} from "@/lib/actions/user.actions";

type UsersTableProps = {
  initialData: UsersResponse;
  allProfiles?: any[];
};

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
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [profileTimeout, setProfileTimeout] = useState<NodeJS.Timeout | null>(null);
  const [statusTimeout, setStatusTimeout] = useState<NodeJS.Timeout | null>(null);

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
    if (currentUserId === targetUser.id) return false;
    const myLevel = currentUserHierarchy ?? 99;
    const targetLevel = targetUser.hierarchy ?? 99;
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

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      updateParams({ search: value }, true);
    }, 500);
    setSearchTimeout(timeout);
  };

  const handleProfileFilterChange = (value: string) => {
    setProfileFilter(value);
    if (profileTimeout) clearTimeout(profileTimeout);
    const timeout = setTimeout(() => {
      updateParams({ profile: value }, true);
    }, 300);
    setProfileTimeout(timeout);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    if (statusTimeout) clearTimeout(statusTimeout);
    const timeout = setTimeout(() => {
      updateParams({ status: value }, true);
    }, 300);
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
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const getSortIcon = (column: string) => {
    if (currentSort !== column) {
      return (
        <svg
          className="h-4 w-4 text-neutral-500"
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
        className="h-4 w-4 text-[#c6a365]"
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
        className="h-4 w-4 text-[#c6a365]"
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
    
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  useEffect(() => {
    setStatusFilter(searchParams.get("status") || "");
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
      if (profileTimeout) clearTimeout(profileTimeout);
      if (statusTimeout) clearTimeout(statusTimeout);
    };
  }, [searchTimeout, profileTimeout, statusTimeout]);

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
      <div className="bg-[#fdeaea] rounded-lg border border-[#f5efe6] p-6 text-center text-[#c62828]">
        No tienes permisos para ver los usuarios.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-neutral-500"
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
            className="w-full pl-10 pr-4 md:py-2 py-2.5 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 text-base transition-all duration-200"
          />
        </div>

        {allProfiles.length > 0 && (
          <div className="w-full md:w-64">
            <select
              value={profileFilter}
              onChange={(e) => handleProfileFilterChange(e.target.value)}
              className="w-full px-3 md:py-2 py-2.5 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 text-base transition-all duration-200"
            >
              <option value="" className="bg-white text-neutral-900">
                Todos los perfiles
              </option>
              {allProfiles.map((profile) => (
                <option 
                  key={profile.id} 
                  value={profile.id}
                  className="bg-white text-neutral-900"
                >
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
        )}

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

        {(searchInput || profileFilter || statusFilter) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-[#c6a365] border border-[#CFC7B8] rounded-lg hover:bg-[#f5efe6] transition-all duration-200"
          >
            Limpiar
          </button>
        )}
      </div>

      {isPending && (
        <div className="flex justify-center">
          <div className="bg-[#f5efe6] text-[#c6a365] px-4 py-2 rounded-lg text-sm border border-[#e6d7a3]">
            Cargando...
          </div>
        </div>
      )}

      {isPending && initialData.users.length === 0 && (
        <>
          <div className="hidden md:block bg-white rounded-lg border border-[#f5efe6] overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-[#faf8f3] px-6 py-3 flex justify-between items-center text-neutral-600">
                <div className="flex gap-4">
                  <div className="h-4 bg-[#f5efe6] rounded-sm w-24"></div>
                  <div className="h-4 bg-[#f5efe6] rounded-sm w-32"></div>
                  {allProfiles.length > 0 && (
                    <div className="h-4 bg-[#f5efe6] rounded-sm w-24"></div>
                  )}
                  <div className="h-4 bg-[#f5efe6] rounded-sm w-20"></div>
                </div>
                <div className="h-4 bg-[#f5efe6] rounded-sm w-16"></div>
              </div>

              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-t border-[#f5efe6] px-6 py-4 flex justify-between items-center"
                >
                  <div className="flex gap-8 items-center">
                    <div className="h-4 bg-[#f5efe6] rounded-sm w-40"></div>
                    <div className="h-4 bg-[#f5efe6] rounded-sm w-56"></div>
                    {allProfiles.length > 0 && (
                      <div className="h-4 bg-[#f5efe6] rounded-sm w-32"></div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-12 bg-[#f5efe6] rounded-full"></div>
                      <div className="h-4 w-16 bg-[#f5efe6] rounded-full"></div>
                    </div>
                  </div>
                  <div className="h-5 w-5 bg-[#f5efe6] rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-[#f5efe6] p-4 animate-pulse"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#f5efe6] rounded-sm w-32"></div>
                    <div className="h-3 bg-[#f5efe6] rounded-sm w-48"></div>
                    {allProfiles.length > 0 && (
                      <div className="h-3 bg-[#f5efe6] rounded-sm w-24"></div>
                    )}
                  </div>
                  <div className="h-5 w-5 bg-[#f5efe6] rounded-full ml-3"></div>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="h-6 w-12 bg-[#f5efe6] rounded-full"></div>
                  <div className="h-4 w-16 bg-[#f5efe6] rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isPending && (
        <>
          <div className="hidden md:block bg-white rounded-lg border border-[#f5efe6] overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-[#f5efe6]">
              <thead className="bg-[#EAD9A5]">
                <tr>
                  <th
                    onClick={() => handleSort("full_name")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#3A2A00] cursor-pointer hover:bg-[#D4C295] select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Nombre
                      {getSortIcon("full_name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#3A2A00] cursor-pointer hover:bg-[#D4C295] select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Correo
                      {getSortIcon("email")}
                    </div>
                  </th>
                  {allProfiles.length > 0 && (
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#3A2A00]">
                      Tipo de Usuario
                    </th>
                  )}
                  <th
                    onClick={() => handleSort("active")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#3A2A00] cursor-pointer hover:bg-[#D4C295] select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Estado
                      {getSortIcon("active")}
                    </div>
                  </th>
                  {canUpdateUsers && (
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#3A2A00]">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-[#f5efe6]">
                {initialData.users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canUpdateUsers ? (allProfiles.length > 0 ? 5 : 4) : (allProfiles.length > 0 ? 4 : 3)}
                      className="px-6 py-4 text-center text-neutral-600"
                    >
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  initialData.users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#faf8f3] transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">
                          {user.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-700">
                          {user.email}
                        </div>
                      </td>
                      {allProfiles.length > 0 && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">
                            {user.profile_name || (
                              <span className="text-neutral-600 italic">
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
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c6a365] disabled:opacity-30 disabled:cursor-not-allowed ${
                              user.active ? "bg-green-500" : "bg-red-400"
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
                          <span
                            className={`ml-3 px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                              user.active 
                                ? "bg-green-100 text-green-700 border border-green-200" 
                                : "bg-red-100 text-red-700 border border-red-200"
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
                              <button className="p-2 rounded-full hover:bg-[#f5efe6] transition-all duration-200">
                                <MoreVertical
                                  size={18}
                                  className="text-neutral-700 hover:text-[#c6a365] transition-colors"
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-40 p-2 bg-white border border-[#f5efe6] rounded-md shadow-sm" 
                              align="end"
                            >
                              <Link href={`/dashboard/seguridad/usuarios/editar/${user.id}`}>
                                <button
                                  disabled={isHierarchyInsufficient(user)}
                                  onClick={(e) => {
                                    if (isHierarchyInsufficient(user)) {
                                      e.preventDefault();
                                      e.stopPropagation();
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 ${
                                    isHierarchyInsufficient(user)
                                      ? "opacity-30 cursor-not-allowed text-neutral-500"
                                      : "text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365]"
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

          <div className="md:hidden space-y-3">
            {initialData.users.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#f5efe6] p-6 text-center text-neutral-600">
                No se encontraron usuarios
              </div>
            ) : (
              initialData.users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg border border-[#f5efe6] p-4 hover:border-[#e6d7a3] transition-all duration-200"
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 mb-1">
                        {user.full_name}
                      </h3>
                      <p className="text-sm text-neutral-700">{user.email}</p>
                      {allProfiles.length > 0 && (
                        <p className="text-sm text-neutral-600 mt-1">
                          Tipo: {user.profile_name || "Sin perfil"}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c6a365] disabled:opacity-50 disabled:cursor-not-allowed ${
                            user.active ? "bg-green-500" : "bg-red-400"
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
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      {canUpdateUsers && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-[#f5efe6] transition-all duration-200">
                              <MoreVertical 
                                size={18}
                                className="text-neutral-700 hover:text-[#c6a365] transition-colors"
                              />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-40 p-2 bg-white border border-[#f5efe6] shadow-sm" 
                            align="end"
                          >
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/seguridad/usuarios/editar/${user.id}`,
                                )
                              }
                              className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365] rounded-md transition-all duration-200"
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

      {initialData.totalPages > 1 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-neutral-600">
            {(currentPage - 1) * initialData.pageSize + 1} -{" "}
            {Math.min(currentPage * initialData.pageSize, initialData.total)} de{" "}
            {initialData.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="px-3 py-2 border border-[#CFC7B8] rounded-md text-sm font-medium text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200"
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
                  return (
                    p === 1 ||
                    p === initialData.totalPages ||
                    (p >= currentPage - 1 && p <= currentPage + 1)
                  );
                })
                .map((p, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && p - prevPage > 1;

                  return (
                    <div key={p} className="flex gap-1">
                      {showEllipsis && (
                        <span className="px-3 py-1 text-neutral-500">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        disabled={isPending}
                        className={`px-3 py-1 border rounded-md text-sm font-medium transition-all duration-200 ${
                          p === currentPage
                            ? "bg-[#c6a365] text-white border-[#c6a365] hover:bg-[#b59555]"
                            : "border-[#CFC7B8] text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365]"
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
              className="px-3 py-2 border border-[#CFC7B8] rounded-md text-sm font-medium text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365] disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200"
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