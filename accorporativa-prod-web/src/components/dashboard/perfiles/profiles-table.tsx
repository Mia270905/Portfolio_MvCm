"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { DeleteProfileDialog } from "./delete-profile-dialog";
import { ProfilesResponse } from "@/lib/definitions";

type ProfilesTableProps = {
  initialData: ProfilesResponse;
  userPermissions?: string[];
};

export default function ProfilesTable({
  initialData,
  userPermissions,
}: ProfilesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPage = Number(searchParams.get("page")) || 1;
  const currentSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);
  const currentSort = searchParams.get("sort") || "name";
  const currentOrder = (searchParams.get("order") || "asc") as "asc" | "desc";
  const [profileToDelete, setProfileToDelete] = useState<
    ProfilesResponse["profiles"][0] | null
  >(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const canRead = userPermissions?.includes("read:profiles") ?? false;
  const canUpdate = userPermissions?.includes("update:profiles") ?? false;
  const canDelete = userPermissions?.includes("delete:profiles") ?? false;
  const canAssignPermissions =
    userPermissions?.includes("permissions:profiles") ?? false;

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key === "search") {
      params.set("page", "1");
    }

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParams("search", searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

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
          className="h-4 w-4 text-muted-foreground"
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
        className="h-4 w-4 text-primary"
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
        className="h-4 w-4 text-primary"
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

  const handlePageChange = (page: number) => {
    updateParams("page", page.toString());
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-muted-foreground"
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
            placeholder="Buscar por código o nombre..."
            defaultValue={currentSearch}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 md:py-2 py-2.5 border border-input rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary text-base bg-background text-foreground placeholder-muted-foreground"
          />
        </div>
      </div>

      {/* Loading indicator */}
      {isPending && (
        <div className="flex justify-center">
          <div className="bg-muted text-primary px-4 py-2 rounded-lg text-sm">
            Cargando...
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isPending && initialData.profiles.length === 0 && (
        <>
          {/* Skeleton Desktop */}
          <div className="hidden md:block bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-muted px-6 py-3 flex justify-between items-center text-muted-foreground">
                <div className="flex gap-4">
                  <div className="h-4 bg-input rounded-sm w-32"></div>
                  <div className="h-4 bg-input rounded-sm w-24"></div>
                  <div className="h-4 bg-input rounded-sm w-20"></div>
                </div>
                <div className="h-4 bg-input rounded-sm w-16"></div>
              </div>

              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-t border-border px-6 py-4 flex justify-between items-center"
                >
                  <div className="flex gap-8 items-center">
                    <div className="h-4 bg-muted rounded-sm w-40"></div>
                    <div className="h-4 bg-muted rounded-sm w-32"></div>
                    <div className="h-6 w-16 bg-muted rounded-full"></div>
                  </div>
                  <div className="h-5 w-5 bg-muted rounded-full"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Mobile */}
          <div className="md:hidden space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-lg shadow-sm border border-border p-4 animate-pulse"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded-sm w-32"></div>
                    <div className="h-3 bg-muted rounded-sm w-24"></div>
                  </div>
                  <div className="h-5 w-5 bg-muted rounded-full ml-3"></div>
                </div>
                <div className="h-6 w-16 bg-muted rounded-full"></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Tabla - Desktop / Cards - Mobile */}
      {!isPending && (
        <>
          {/* Vista Desktop - Tabla */}
          <div className="hidden md:block bg-card rounded-lg shadow-sm overflow-hidden border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted text-primary">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/80 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Nombre
                      {getSortIcon("name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("code")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/80 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Código
                      {getSortIcon("code")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("active")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/80 select-none"
                  >
                    <div className="flex items-center gap-2">
                      Estado
                      {getSortIcon("active")}
                    </div>
                  </th>
                  {(canUpdate || canDelete || canAssignPermissions) && (
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {initialData.profiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-muted-foreground"
                    >
                      No se encontraron perfiles
                    </td>
                  </tr>
                ) : (
                  initialData.profiles.map((profile) => (
                    <tr key={profile.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-card-foreground">
                          {profile.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-muted-foreground font-mono">
                          {profile.code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                            profile.active
                              ? "bg-success-bg text-success-text"
                              : "bg-error-bg text-error-text"
                          }`}
                        >
                          {profile.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      {(canUpdate || canDelete || canAssignPermissions) && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-2 rounded-full hover:bg-muted transition-colors group">
                                <MoreVertical
                                  size={18}
                                  className="text-muted-foreground group-hover:text-primary transition-colors"
                                />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-40 p-2 bg-card border border-border shadow-lg" 
                              align="end"
                            >
                              {canAssignPermissions && (
                                <Link
                                  href={`/dashboard/seguridad/perfiles/asignacion-permisos/${profile.id}`}
                                >
                                  <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-primary rounded-md transition-all duration-200">
                                    Asignar permisos
                                  </button>
                                </Link>
                              )}
                              {canUpdate && (
                                <Link
                                  href={`/dashboard/seguridad/perfiles/editar/${profile.id}`}
                                >
                                  <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-primary rounded-md transition-all duration-200">
                                    Editar
                                  </button>
                                </Link>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => {
                                    setProfileToDelete(profile);
                                    setOpenPopoverId(null);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-error-text hover:bg-error-bg hover:text-error-text rounded-md transition-all duration-200"
                                >
                                  Eliminar
                                </button>
                              )}
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
            {initialData.profiles.length === 0 ? (
              <div className="bg-card rounded-lg shadow-sm p-6 text-center text-muted-foreground">
                No se encontraron perfiles
              </div>
            ) : (
              initialData.profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-card rounded-lg shadow-sm border border-border p-4"
                >
                  <div className="flex flex-col gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-card-foreground mb-1">
                        {profile.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-mono mb-2">
                        {profile.code}
                      </p>
                      <span
                        className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                          profile.active
                            ? "bg-success-bg text-success-text"
                            : "bg-error-bg text-error-text"
                        }`}
                      >
                        {profile.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {/* Botón de acciones */}
                    {(canUpdate || canDelete || canAssignPermissions) && (
                      <div className="flex justify-end mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-muted group">
                              <svg
                                className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40 p-2 bg-card border border-border shadow-lg" align="end">
                            {canAssignPermissions && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/seguridad/perfiles/asignacion-permisos/${profile.id}`,
                                  )
                                }
                                className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-primary rounded-md transition-all duration-200"
                              >
                                Asignar permisos
                              </button>
                            )}
                            {canUpdate && (
                              <button
                                onClick={() =>
                                  router.push(
                                    `/dashboard/seguridad/perfiles/editar/${profile.id}`,
                                  )
                                }
                                className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-primary rounded-md transition-all duration-200"
                              >
                                Editar
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => setProfileToDelete(profile)}
                                className="w-full text-left px-3 py-2 text-sm text-error-text hover:bg-error-bg hover:text-error-text rounded-md transition-all duration-200"
                              >
                                Eliminar
                              </button>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {profileToDelete && (
        <DeleteProfileDialog
          profileId={profileToDelete.id}
          profileCode={profileToDelete.code}
          profileName={profileToDelete.name}
          open={!!profileToDelete}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setProfileToDelete(null);
            }
          }}
        />
      )}

      {/* Paginación */}
      {initialData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {(currentPage - 1) * initialData.pageSize + 1} -{" "}
            {Math.min(currentPage * initialData.pageSize, initialData.total)} de{" "}
            {initialData.total}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isPending}
              className="px-3 py-2 border border-input rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                        <span className="px-3 py-1 text-muted-foreground">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        disabled={isPending}
                        className={`px-3 py-1 border rounded-md text-sm font-medium ${
                          p === currentPage
                            ? "bg-primary text-primary-foreground border-primary hover:bg-button-hover"
                            : "border-input text-muted-foreground hover:bg-muted hover:text-primary"
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
              className="px-3 py-2 border border-input rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
    </div>
  );
}