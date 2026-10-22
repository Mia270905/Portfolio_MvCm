"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import type {
  PermissionsResponse,
  ModuleWithChildren,
} from "@/lib/definitions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getIcon } from "@/lib/utils/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { DeletePermissionDialog } from "./delete-permission-dialog";

type PermissionsTableProps = {
  initialData: PermissionsResponse;
  modules: Array<ModuleWithChildren>;
  userPermissions?: string[];
};

export default function PermissionsTable({
  initialData,
  modules,
  userPermissions,
}: PermissionsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [permissionToDelete, setPermissionToDelete] = useState<
    PermissionsResponse["permissions"][0] | null
  >(null);
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  const currentPage = Number(searchParams.get("page")) || 1;
  const currentSearch = searchParams.get("search") || "";
  const currentModule = searchParams.get("module") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);
  const currentSort = searchParams.get("sort") || "name";
  const currentOrder = (searchParams.get("order") || "asc") as "asc" | "desc";

  const canRead = userPermissions?.includes("read:permissions") ?? false;
  const canUpdate = userPermissions?.includes("update:permissions") ?? false;
  const canDelete = userPermissions?.includes("delete:permissions") ?? false;

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (key === "search" || key === "module") {
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
          className="h-4 w-4 text-neutral-400"
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

  const handlePageChange = (page: number) => {
    updateParams("page", page.toString());
  };

  const handleModuleChange = (value: string) => {
    updateParams("module", value);
  };

  const findModule = (id: string) => {
    const parent = modules.find((m) => m.id === id);
    if (parent) return parent;

    for (const module of modules) {
      const child = module.children?.find((c) => c.id === id);
      if (child) return child;
    }

    return null;
  };

  // Si no tiene permiso de lectura, mostrar mensaje
  if (!canRead) {
    return (
      <div className="bg-[#fdeaea] rounded-lg border border-[#f5efe6] p-6 text-center text-[#c62828]">
        No tienes permiso para ver esta sección.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Búsqueda */}
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
            placeholder="Buscar permisos..."
            defaultValue={currentSearch}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#CFC7B8] rounded-lg bg-white text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 transition-all duration-200"
          />
        </div>

        {/* Select de módulo */}
        <div className="w-full md:w-64">
          <Select value={currentModule} onValueChange={handleModuleChange}>
            <SelectTrigger className="w-full px-3 py-2 h-auto text-base border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 transition-all duration-200">
              {currentModule ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const selected = findModule(currentModule);
                    if (!selected)
                      return <SelectValue placeholder="Todos los módulos" />;
                    const Icon = getIcon(selected.icon);
                    return (
                      <>
                        <Icon size={20} className="text-[#c6a365]" />
                        <span>{selected.name}</span>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <SelectValue placeholder="Todos los módulos" />
              )}
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#CFC7B8] text-neutral-900 shadow-sm">
              <SelectItem value=" " className="text-base bg-white hover:bg-[#f5efe6] focus:bg-[#f5efe6]">
                <span className="text-neutral-900">Todos los módulos</span>
              </SelectItem>

              {modules.map((parent) => {
                const ParentIcon = getIcon(parent.icon);
                return (
                  <div key={parent.id}>
                    {/* Módulo Padre */}
                    <SelectItem value={parent.id} className="text-base bg-white hover:bg-[#f5efe6] focus:bg-[#f5efe6]">
                      <div className="flex items-center gap-2">
                        <ParentIcon size={20} className="text-[#c6a365]" />
                        <span className="text-neutral-900">{parent.name}</span>
                      </div>
                    </SelectItem>

                    {/* Módulos Hijos */}
                    {parent.children &&
                      parent.children.map((child) => {
                        const ChildIcon = getIcon(child.icon);
                        return (
                          <SelectItem
                            key={child.id}
                            value={child.id}
                            className="text-base bg-white hover:bg-[#f5efe6] focus:bg-[#f5efe6]"
                          >
                            <div className="flex items-center gap-2 pl-6">
                              <ChildIcon size={18} className="text-[#c6a365]" />
                              <span className="text-neutral-900">{child.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </div>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading skeleton */}
      {isPending && (
        <>
          {/* Skeleton Desktop */}
          <div className="hidden md:block bg-white rounded-lg border border-[#f5efe6] overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-[#faf8f3] px-6 py-3 flex gap-4">
                <div className="h-4 bg-[#f5efe6] rounded-sm w-32"></div>
                <div className="h-4 bg-[#f5efe6] rounded-sm w-24"></div>
                <div className="h-4 bg-[#f5efe6] rounded-sm w-48"></div>
                <div className="h-4 bg-[#f5efe6] rounded-sm w-20"></div>
                <div className="h-4 bg-[#f5efe6] rounded-sm w-16"></div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-t border-[#f5efe6] px-6 py-4 flex gap-4"
                >
                  <div className="h-4 bg-[#f5efe6] rounded-sm w-40"></div>
                  <div className="h-4 bg-[#f5efe6] rounded-sm w-32"></div>
                  <div className="h-4 bg-[#f5efe6] rounded-sm w-64"></div>
                  <div className="h-4 bg-[#f5efe6] rounded-sm w-16"></div>
                  <div className="h-4 bg-[#f5efe6] rounded-sm w-8"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Mobile */}
          <div className="md:hidden space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-[#f5efe6] p-4 animate-pulse"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#f5efe6] rounded-sm w-32"></div>
                    <div className="h-3 bg-[#f5efe6] rounded-sm w-24"></div>
                    <div className="h-3 bg-[#f5efe6] rounded-sm w-48"></div>
                  </div>
                  <div className="h-6 bg-[#f5efe6] rounded-full w-16 ml-3"></div>
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
          <div className="hidden md:block bg-white rounded-lg border border-[#f5efe6] overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-[#f5efe6]">
              <thead className="bg-[#faf8f3]">
                <tr>
                  <th
                    onClick={() => handleSort("name")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-900 cursor-pointer hover:bg-[#f5efe6] select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Nombre {getSortIcon("name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("code")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-900 cursor-pointer hover:bg-[#f5efe6] select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Código {getSortIcon("code")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("description")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-900 cursor-pointer hover:bg-[#f5efe6] select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Descripción {getSortIcon("description")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("active")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-900 cursor-pointer hover:bg-[#f5efe6] select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Estado {getSortIcon("active")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-900"></th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-[#f5efe6]">
                {initialData.permissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-neutral-600">
                      No se encontraron permisos
                    </td>
                  </tr>
                ) : (
                  initialData.permissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-[#faf8f3] transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-neutral-900">{permission.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-700 font-mono">{permission.code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-700 max-w-md truncate">{permission.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                            permission.active 
                              ? "bg-green-100 text-green-700 border border-green-200" 
                              : "bg-red-100 text-red-700 border border-red-200"
                          }`}
                        >
                          {permission.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {(canUpdate || canDelete) && (
                          <Popover
                            open={openPopoverId === permission.id}
                            onOpenChange={(isOpen) => setOpenPopoverId(isOpen ? permission.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <button className="p-1 hover:bg-[#f5efe6] rounded transition-all duration-200">
                                <MoreVertical size={18} className="text-neutral-700 hover:text-[#c6a365] transition-colors" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-40 p-2 bg-white border border-[#f5efe6] shadow-sm" align="end">
                              {canUpdate && (
                                <Link href={`/dashboard/seguridad/permisos/editar/${permission.id}`}>
                                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365] rounded-md transition-all duration-200">
                                    Editar
                                  </button>
                                </Link>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => { setPermissionToDelete(permission); setOpenPopoverId(null); }}
                                  className="w-full text-left px-3 py-2 text-sm text-[#c62828] hover:bg-[#fdeaea] hover:text-[#b71c1c] rounded-md transition-all duration-200"
                                >
                                  Eliminar
                                </button>
                              )}
                            </PopoverContent>
                          </Popover>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {permissionToDelete && (
            <DeletePermissionDialog
              permissionId={permissionToDelete.id}
              permissionCode={permissionToDelete.code}
              permissionName={permissionToDelete.name}
              open={!!permissionToDelete}
              onOpenChange={(isOpen) => {
                if (!isOpen) setPermissionToDelete(null);
              }}
            />
          )}

          {/* Vista Mobile - Cards */}
          <div className="md:hidden space-y-3">
            {initialData.permissions.length === 0 ? (
              <div className="bg-white rounded-lg border border-[#f5efe6] p-6 text-center text-neutral-600">
                No se encontraron permisos
              </div>
            ) : (
              initialData.permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="bg-white rounded-lg border border-[#f5efe6] p-4 hover:border-[#e6d7a3] transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-neutral-900 mb-1">
                        {permission.name}
                      </h3>
                      <p className="text-sm text-neutral-700 font-mono mb-1">
                        {permission.code}
                      </p>
                      <p className="text-sm text-neutral-700 line-clamp-2">
                        {permission.description}
                      </p>
                      <span
                        className={`mt-2 px-2.5 py-1 inline-flex items-center text-xs font-semibold rounded-full ${
                          permission.active
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {permission.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    {/* Validación de permisos para editar/eliminar */}
                    {(canUpdate || canDelete) && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-neutral-700 hover:text-[#c6a365] ml-3 p-1 hover:bg-[#f5efe6] rounded transition-all duration-200">
                            <MoreVertical size={18} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2 bg-white border border-[#f5efe6] shadow-sm" align="end">
                          {canUpdate && (
                            <Link
                              href={`/dashboard/seguridad/permisos/editar/${permission.id}`}
                            >
                              <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365] rounded-md transition-all duration-200">
                                Editar
                              </button>
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => {
                                setPermissionToDelete(permission);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-[#c62828] hover:bg-[#fdeaea] hover:text-[#b71c1c] rounded-md transition-all duration-200"
                            >
                              Eliminar
                            </button>
                          )}
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {permissionToDelete && (
        <DeletePermissionDialog
          permissionId={permissionToDelete.id}
          permissionCode={permissionToDelete.code}
          permissionName={permissionToDelete.name}
          open={!!permissionToDelete}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setPermissionToDelete(null);
            }
          }}
        />
      )}

      {/* Paginación */}
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
    </div>
  );
}