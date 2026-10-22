"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useCallback } from "react";
import type { AttendanceUsersResponse } from "@/lib/actions/attendance.actions";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVertical, UserPlus, Trash2, User, Search } from "lucide-react";
import {
  getAttendanceUsers,
  removeUserFromAttendance,
  addUserToAttendance,
} from "@/lib/actions/attendance.actions";
import { SelectUserModal } from "./select-user-modal";
import { RemoveUserDialog } from "./delete-user-attendance-dialog";

type AttendanceUsersTableProps = {
  initialData: AttendanceUsersResponse;
};

export default function AttendanceUsersTable({ initialData }: AttendanceUsersTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentSearch = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(currentSearch);
  const currentSort = searchParams.get("sort") || "full_name";
  const currentOrder = (searchParams.get("order") || "asc") as "asc" | "desc";
  
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  
  // Estados para el diálogo de remover
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedAttendanceUser, setSelectedAttendanceUser] = useState<{
    id: string;
    name: string;
  } | null>(null);
  
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string | number>, resetPage: boolean = false) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value || value === 0) {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      if (resetPage) {
        params.set("page", "1");
      }

      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [searchParams, router],
  );

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      updateParams({ search: value }, true);
    }, 500);
    
    setSearchTimeout(timeout);
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
          className="h-4 w-4 text-custom-text-tertiary"
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
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    
    setSearchInput("");
    
    const params = new URLSearchParams();
    params.set("page", currentPage.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleRemoveClick = (attendanceUserId: string, userName: string) => {
    setSelectedAttendanceUser({ id: attendanceUserId, name: userName });
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirmed = async (attendanceUserId: string) => {
    setRemovingId(attendanceUserId);

    setRemovingId(null);
    setRemoveDialogOpen(false);
    setSelectedAttendanceUser(null);
  };

  const handleOpenAddUserModal = async () => {
    try {
      setShowAddUserModal(true);
    } catch (error) {
      console.error("Error opening modal:", error);
      toast.error("Error al abrir el modal");
    }
  };

  const handleAddUser = async (userId: string) => {
    try {
      const result = await addUserToAttendance(userId);
      
      if (result.success) {
        toast.success(result.message);
        setShowAddUserModal(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Error al agregar usuario");
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTimeout]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y botones */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-custom-text-tertiary" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, correo o código..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 md:py-2 py-2.5 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary text-base transition-all duration-200"
          />
        </div>

        {/* Botón agregar usuario */}
        <button
          onClick={handleOpenAddUserModal}
          className="px-4 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 font-medium rounded-lg flex items-center gap-2 transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Usuario
        </button>

        {/* Botón limpiar filtros */}
        {searchInput && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-custom-text-tertiary hover:text-custom-accent-primary border border-custom-border-primary rounded-lg hover:bg-custom-accent-hover transition-all duration-200"
          >
            Limpiar filtros
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
      {isPending && initialData.attendanceUsers.length === 0 && (
        <>
          {/* Skeleton Desktop */}
          <div className="hidden md:block bg-custom-bg-secondary rounded-lg border border-custom-border-secondary overflow-hidden">
            <div className="animate-pulse">
              <div className="bg-custom-bg-tertiary px-6 py-3 flex justify-between items-center text-custom-text-tertiary">
                <div className="flex gap-4">
                  <div className="h-4 bg-custom-bg-hover rounded-sm w-32"></div>
                  <div className="h-4 bg-custom-bg-hover rounded-sm w-40"></div>
                  <div className="h-4 bg-custom-bg-hover rounded-sm w-24"></div>
                  <div className="h-4 bg-custom-bg-hover rounded-sm w-28"></div>
                </div>
                <div className="h-4 bg-custom-bg-hover rounded-sm w-16"></div>
              </div>

              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-t border-custom-border-secondary px-6 py-4 flex justify-between items-center"
                >
                  <div className="flex gap-8 items-center">
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-48"></div>
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-56"></div>
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-32"></div>
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-28"></div>
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
                    <div className="h-4 bg-custom-bg-hover rounded-sm w-40"></div>
                    <div className="h-3 bg-custom-bg-hover rounded-sm w-56"></div>
                    <div className="h-3 bg-custom-bg-hover rounded-sm w-32"></div>
                    <div className="h-3 bg-custom-bg-hover rounded-sm w-24"></div>
                  </div>
                  <div className="h-5 w-5 bg-custom-bg-hover rounded-full ml-3"></div>
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
                  <th
                    onClick={() => handleSort("created_at")}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-custom-bg-hover select-none transition-colors duration-200"
                  >
                    <div className="flex items-center gap-2">
                      Fecha de Registro
                      {getSortIcon("created_at")}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="bg-custom-bg-secondary divide-y divide-custom-border-secondary">
                {initialData.attendanceUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-custom-text-tertiary">
                        <User className="w-12 h-12 mb-3 text-custom-text-muted" />
                        <p className="text-lg mb-2">No hay usuarios en el checador</p>
                        <p className="text-sm mb-4">Agrega usuarios para que puedan usar el sistema de asistencia</p>
                        <button
                          onClick={handleOpenAddUserModal}
                          className="px-4 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 font-medium rounded-lg flex items-center gap-2 transition-all duration-200"
                        >
                          <UserPlus className="w-4 h-4" />
                          Agregar Primer Usuario
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  initialData.attendanceUsers.map((attendanceUser) => {
                    const user = attendanceUser.user;
                    const userName = user?.full_name || "Usuario";
                    const userEmail = user?.email || "Sin correo";
                    
                    return (
                      <tr key={attendanceUser.id} className="hover:bg-custom-bg-hover transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-custom-text-primary">
                            {userName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-custom-text-tertiary">
                            {userEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-custom-text-tertiary">
                            {formatDate(attendanceUser.created_at)}
                          </div>
                        </td>
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
                            <PopoverContent className="w-48 p-2 bg-custom-bg-secondary border border-custom-border-primary" align="end">
                              <button
                                onClick={() => handleRemoveClick(attendanceUser.id, userName)}
                                disabled={removingId === attendanceUser.id}
                                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-all duration-200 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                {removingId === attendanceUser.id ? "Quitando..." : "Quitar del Checador"}
                              </button>
                            </PopoverContent>
                          </Popover>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Vista Mobile - Cards */}
          <div className="md:hidden space-y-3">
            {initialData.attendanceUsers.length === 0 ? (
              <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 text-center">
                <div className="flex flex-col items-center justify-center text-custom-text-tertiary">
                  <User className="w-16 h-16 mb-4 text-custom-text-muted" />
                  <h3 className="text-lg font-medium text-custom-text-primary mb-2">No hay usuarios en el checador</h3>
                  <p className="text-sm mb-6">Agrega usuarios para que puedan usar el sistema de asistencia</p>
                  <button
                    onClick={handleOpenAddUserModal}
                    className="px-4 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-gray-900 font-medium rounded-lg flex items-center gap-2 transition-all duration-200"
                  >
                    <UserPlus className="w-4 h-4" />
                    Agregar Primer Usuario
                  </button>
                </div>
              </div>
            ) : (
              initialData.attendanceUsers.map((attendanceUser) => {
                const user = attendanceUser.user;
                const userName = user?.full_name || "Usuario";
                const userEmail = user?.email || "Sin correo";
                
                return (
                  <div
                    key={attendanceUser.id}
                    className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 hover:border-custom-accent-border transition-all duration-200"
                  >
                    <div className="flex flex-col gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-custom-text-primary mb-1">
                          {userName}
                        </h3>
                        <p className="text-sm text-custom-text-tertiary">{userEmail}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-custom-text-tertiary">
                            Registrado: {formatDate(attendanceUser.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Botón de acciones */}
                      <div className="flex justify-end mt-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="p-1 rounded-full hover:bg-custom-accent-hover transition-all duration-200">
                              <MoreVertical 
                                size={18}
                                className="text-custom-text-tertiary hover:text-custom-accent-primary transition-colors"
                              />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2 bg-custom-bg-secondary border border-custom-border-primary" align="end">
                            <button
                              onClick={() => handleRemoveClick(attendanceUser.id, userName)}
                              disabled={removingId === attendanceUser.id}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-all duration-200 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              {removingId === attendanceUser.id ? "Quitando..." : "Quitar del Checador"}
                            </button>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Paginación */}
      {initialData.totalPages > 1 && initialData.attendanceUsers.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-custom-text-tertiary">
            {(currentPage - 1) * initialData.pageSize + 1} -{" "}
            {Math.min(currentPage * initialData.pageSize, initialData.total)} de{" "}
            {initialData.total} usuarios
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

      {/* Modal para agregar usuarios */}
      <SelectUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSelectUser={handleAddUser}
      />

      {/* Diálogo para quitar usuario */}
      {selectedAttendanceUser && (
        <RemoveUserDialog
          attendanceUserId={selectedAttendanceUser.id}
          userName={selectedAttendanceUser.name}
          open={removeDialogOpen}
          onOpenChange={(open) => {
            setRemoveDialogOpen(open);
            if (!open) {
              setSelectedAttendanceUser(null);
            }
          }}
          onRemove={handleRemoveConfirmed}
        />
      )}
    </div>
  );
}