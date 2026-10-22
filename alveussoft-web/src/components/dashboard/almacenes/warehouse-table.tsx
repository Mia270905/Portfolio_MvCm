"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Trash2,
  Warehouse,
  ChevronUp,
  ChevronDown,
  X,
  Package,
  Truck,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ConfirmDeleteWarehouseDialog } from "@/components/dashboard/almacenes/confirm-delete-warehouse-dialog";
import { deleteInventoryLocation } from "@/lib/actions/warehouse.actions";
import { toast } from "sonner";

interface Warehouse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_write_protected: boolean;
  sucursal_id: string | null;
  created_at: string;
}

interface WarehouseTableProps {
  initialData: {
    locations: Warehouse[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  userPermissions: string[];
}

interface WarehouseFilters {
  type: "fisica" | "virtual" | "all";
  search: string;
}

export function WarehouseTable({
  initialData,
  userPermissions,
}: WarehouseTableProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>(
    initialData.locations,
  );
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"code" | "name" | "created_at">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    warehouse: Warehouse | null;
    isDeleting: boolean;
  }>({
    open: false,
    warehouse: null,
    isDeleting: false,
  });

  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const [filters, setFilters] = useState<WarehouseFilters>({
    type: "fisica",
    search: "",
  });

  // Estados para paginación del cliente
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const canEdit = userPermissions.includes("update:management");
  const canDelete = userPermissions.includes("delete:management");

  // No permitir editar almacenes virtuales
  const canEditWarehouse = (warehouse: Warehouse): boolean => {
    if (warehouse.is_write_protected) return false;
    return canEdit;
  };

  // No permitir eliminar almacenes virtuales
  const canDeleteWarehouse = (warehouse: Warehouse): boolean => {
    if (warehouse.is_write_protected) return false;
    return canDelete;
  };

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        target.closest("[data-action-menu]") ||
        target.closest("[data-action-button]")
      ) {
        return;
      }

      setOpenActionMenuId(null);
    };

    if (openActionMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openActionMenuId]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setFilters((prev) => ({ ...prev, search: searchInput }));
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Aplicar filtros y ordenamiento con useMemo
  const filteredAndSortedWarehouses = useMemo(() => {
    setIsSearching(true);

    let filtered = [...warehouses];

    // Aplicar filtros
    if (filters.type !== "all") {
      const isVirtual = filters.type === "virtual";
      filtered = filtered.filter(
        (warehouse) => warehouse.is_write_protected === isVirtual,
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (warehouse) =>
          warehouse.code.toLowerCase().includes(query) ||
          warehouse.name.toLowerCase().includes(query) ||
          (warehouse.description &&
            warehouse.description.toLowerCase().includes(query)),
      );
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue?.toLowerCase() || "";
        bValue = bValue?.toLowerCase() || "";
      }

      return sortOrder === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
          ? 1
          : -1;
    });

    setIsSearching(false);
    return filtered;
  }, [warehouses, filters, searchQuery, sortBy, sortOrder]);

  // Obtener datos paginados
  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedWarehouses.slice(startIndex, endIndex);
  }, [filteredAndSortedWarehouses, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(
    filteredAndSortedWarehouses.length / itemsPerPage,
  );

  const handleSort = (column: "code" | "name" | "created_at") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleFilterChange = (key: keyof WarehouseFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ type: "fisica", search: "" });
    setSearchInput("");
    setCurrentPage(1);
  };

  const handleDeleteClick = (warehouse: Warehouse) => {
    setDeleteDialog({
      open: true,
      warehouse,
      isDeleting: false,
    });
    setOpenActionMenuId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.warehouse) return;

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

    try {
      const result = await deleteInventoryLocation(
        deleteDialog.warehouse.id,
        deleteDialog.warehouse.code,
      );

      if (result.success) {
        setWarehouses((prev) =>
          prev.filter((w) => w.id !== deleteDialog.warehouse!.id),
        );
        toast.success("✅ Almacén eliminado exitosamente");

        if (paginatedWarehouses.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } else {
        toast.error(`❌ ${result.message}`);
      }
    } catch (error: any) {
      console.error("Error al eliminar almacén:", error);
      toast.error("❌ Error al eliminar el almacén");
    } finally {
      setDeleteDialog({ open: false, warehouse: null, isDeleting: false });
    }
  };

  const toggleActionMenu = (warehouseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setOpenActionMenuId(openActionMenuId === warehouseId ? null : warehouseId);
  };

  const getSortIcon = (column: "code" | "name" | "created_at") => {
    if (sortBy !== column) return <ChevronUp className="w-4 h-4 opacity-30" />;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const hasActiveFilters = filters.type !== "fisica" || searchQuery !== "";

  // Componente para tarjeta móvil
  const WarehouseCard = ({ warehouse }: { warehouse: Warehouse }) => (
    <div className="bg-[#0A0F17] border border-gray-800 rounded-lg p-4 space-y-3 relative">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300 mb-2">
            {warehouse.code}
          </span>
          <h3 className="text-sm font-medium text-white">
            {warehouse.name}
          </h3>
        </div>
        {warehouse.is_write_protected ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300">
            <Package className="w-3 h-3" />
            Virtual
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300">
            <Truck className="w-3 h-3" />
            Física
          </span>
        )}
      </div>

      <div className="text-sm text-gray-400">
        {warehouse.description || (
          <span className="text-gray-500 italic">Sin descripción</span>
        )}
      </div>

      {(canEditWarehouse(warehouse) || canDeleteWarehouse(warehouse)) && (
        <div className="flex justify-end">
          <div className="relative">
            <button
              data-action-button
              onClick={(e) => toggleActionMenu(warehouse.id, e)}
              className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
              aria-label="Abrir menú de acciones"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {openActionMenuId === warehouse.id && (
              <div
                data-action-menu
                className="absolute right-0 bottom-full mb-1 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]"
              >
                {canEditWarehouse(warehouse) && (
                  <Link
                    href={`/dashboard/inventarios/almacenes/editar/${warehouse.id}`}
                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                    onClick={() => setOpenActionMenuId(null)}
                  >
                    Editar
                  </Link>
                )}
                {canDeleteWarehouse(warehouse) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(warehouse);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Funciones para paginación
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-4">
      <ConfirmDeleteWarehouseDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        warehouseName={deleteDialog.warehouse?.name || ""}
        warehouseCode={deleteDialog.warehouse?.code || ""}
        isDeleting={deleteDialog.isDeleting}
      />

      {/* BUSCADOR Y FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-200 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                {
                  [filters.type !== "fisica", searchQuery !== ""].filter(
                    Boolean,
                  ).length
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
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* BADGES DE FILTROS ACTIVOS */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.type !== "fisica" && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 border border-blue-800 rounded-full">
              Tipo:{" "}
              {filters.type === "virtual"
                ? "Salidas Virtuales"
                : "Todos los tipos"}
              <button 
                onClick={() => handleFilterChange("type", "fisica")}
                className="hover:bg-blue-800/50 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-300 bg-green-900/40 border border-green-800 rounded-full">
              Búsqueda: "{searchQuery}"
              <button 
                onClick={() => setSearchInput("")}
                className="hover:bg-green-800/50 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* PANEL DE FILTROS */}
      {showFilters && (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
          <div className="space-y-4">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Tipo de Salida
              </Label>
              <div className="space-y-2 bg-gray-800 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-fisica"
                    checked={filters.type === "fisica"}
                    onCheckedChange={() => handleFilterChange("type", "fisica")}
                    className="text-blue-600 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor="type-fisica"
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 text-gray-200"
                  >
                    <Truck className="w-4 h-4 text-green-400" />
                    Salidas Físicas
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-virtual"
                    checked={filters.type === "virtual"}
                    onCheckedChange={() =>
                      handleFilterChange("type", "virtual")
                    }
                    className="text-blue-600 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor="type-virtual"
                    className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 text-gray-200"
                  >
                    <Package className="w-4 h-4 text-purple-400" />
                    Salidas Virtuales
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-all"
                    checked={filters.type === "all"}
                    onCheckedChange={() => handleFilterChange("type", "all")}
                    className="text-blue-600 border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <label
                    htmlFor="type-all"
                    className="text-sm font-medium leading-none cursor-pointer text-gray-200"
                  >
                    Todos los tipos
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MENSAJE DE CARGA */}
      {isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Aplicando filtros...</span>
          </div>
        </div>
      )}

      {/* CONTADOR DE RESULTADOS */}
      {!isSearching && (
        <div className="text-sm text-gray-400">
          Mostrando {paginatedWarehouses.length} de{" "}
          {filteredAndSortedWarehouses.length} almacenes
        </div>
      )}

      {/* VISTA MÓVIL - TARJETAS */}
      <div className="block md:hidden space-y-3">
        {isSearching ? (
          [...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-[#0A0F17] border border-gray-800 rounded-lg p-4 space-y-3 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-4 bg-gray-800 rounded w-20"></div>
                <div className="h-6 bg-gray-800 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-800 rounded w-32"></div>
              <div className="h-3 bg-gray-800 rounded w-24"></div>
            </div>
          ))
        ) : paginatedWarehouses.length === 0 ? (
          <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-8 text-center">
            <Warehouse className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-300 mb-2">No se encontraron almacenes</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          paginatedWarehouses.map((warehouse) => (
            <WarehouseCard key={warehouse.id} warehouse={warehouse} />
          ))
        )}
      </div>

      {/* VISTA ESCRITORIO - TABLA */}
      <div className="hidden md:block bg-[#0A0F17] rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-800">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort("code")}
                >
                  <div className="flex items-center gap-1">
                    Código
                    {getSortIcon("code")}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Nombre
                    {getSortIcon("name")}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tipo
                </th>
                {(canEdit || canDelete) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-[#0A0F17] divide-y divide-gray-800">
              {isSearching ? (
                [...Array(5)].map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-800 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-800 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-800 rounded w-48"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-800 rounded w-20"></div>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-8 bg-gray-800 rounded w-8"></div>
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedWarehouses.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit || canDelete ? 5 : 4}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Warehouse className="w-12 h-12 mb-3 text-gray-500" />
                      <p className="text-lg font-medium mb-1 text-white">
                        No se encontraron almacenes
                      </p>
                      <p className="text-sm text-gray-300">
                        {hasActiveFilters
                          ? "Intenta con otros términos de búsqueda"
                          : "No hay almacenes registrados"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedWarehouses.map((warehouse) => (
                  <tr
                    key={warehouse.id}
                    className="hover:bg-gray-900 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/40 text-blue-300">
                        {warehouse.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {warehouse.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                      {warehouse.description || (
                        <span className="text-gray-500 italic">
                          Sin descripción
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {warehouse.is_write_protected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/40 text-purple-300">
                          <Package className="w-3 h-3" />
                          Virtual
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300">
                          <Truck className="w-3 h-3" />
                          Física
                        </span>
                      )}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {(canEditWarehouse(warehouse) ||
                          canDeleteWarehouse(warehouse)) && (
                          <div className="relative">
                            <button
                              data-action-button
                              onClick={(e) => toggleActionMenu(warehouse.id, e)}
                              className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded transition-colors"
                              aria-label="Abrir menú de acciones"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openActionMenuId === warehouse.id && (
                              <div
                                data-action-menu
                                className="absolute right-0 top-0 mt-8 z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-[120px]"
                              >
                                {canEditWarehouse(warehouse) && (
                                  <Link
                                    href={`/dashboard/inventarios/almacenes/editar/${warehouse.id}`}
                                    className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 transition-colors"
                                    onClick={() => setOpenActionMenuId(null)}
                                  >
                                    Editar
                                  </Link>
                                )}
                                {canDeleteWarehouse(warehouse) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(warehouse);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación del lado del cliente */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAndSortedWarehouses.length,
                )}{" "}
                de {filteredAndSortedWarehouses.length} almacenes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Anterior
                </Button>
                <span className="text-sm text-gray-400">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
