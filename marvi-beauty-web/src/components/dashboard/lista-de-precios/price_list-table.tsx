"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Package, Search } from "lucide-react";
import { toast } from "sonner";
import {
  getPriceLists,
  deletePriceList,
  type PriceList,
} from "@/lib/actions/price_list.actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PriceListPagination } from "./price_list-pagination";
import { DeletePriceListDialog } from "./delete-price-list-dialog";

interface PriceListsTableProps {
  canEdit: boolean;
  canDelete: boolean;
}

export function PriceListsTable({ canEdit, canDelete }: PriceListsTableProps) {
  const router = useRouter();
  const [allPriceLists, setAllPriceLists] = useState<PriceList[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);
  const [mobilePopoverOpen, setMobilePopoverOpen] = useState<string | null>(
    null,
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [priceListToDelete, setPriceListToDelete] = useState<PriceList | null>(
    null,
  );

  const pageSize = 10;

  // Cargar TODAS las listas de precios una sola vez
  const loadAllPriceLists = async () => {
    setLoading(true);
    try {
      // Llamamos sin paginación para traer todos los registros
      const result = await getPriceLists(1, 1000, undefined);

      if (result.success && result.priceLists) {
        setAllPriceLists(result.priceLists);
      } else {
        toast.error(result.error || "Error al cargar las listas de precios");
      }
    } catch (error) {
      console.error("Error loading price lists:", error);
      toast.error("Error al cargar las listas de precios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPriceLists();
  }, []);

  // Función para abrir el diálogo de eliminación
  const handleOpenDeleteDialog = (priceList: PriceList) => {
    setPriceListToDelete(priceList);
    setDeleteDialogOpen(true);
    // Cerrar popovers
    setPopoverOpen(null);
    setMobilePopoverOpen(null);
  };

  // Función para manejar eliminación exitosa
  const handleDeleteSuccess = async (deletedId: string) => {
    // Eliminar localmente del estado
    const updatedPriceLists = allPriceLists.filter(
      (list) => list.id !== deletedId,
    );
    setAllPriceLists(updatedPriceLists);

    // Cerrar el diálogo
    setDeleteDialogOpen(false);
    setPriceListToDelete(null);
  };

  // Filtrar y buscar del lado del cliente
  const filteredAndSearchedLists = useMemo(() => {
    let filtered = allPriceLists;

    // Aplicar filtro de estado
    if (filterActive !== undefined) {
      filtered = filtered.filter((list) => list.active === filterActive);
    }

    // Aplicar búsqueda
    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();

      // Función para normalizar texto (quitar acentos)
      const normalizeText = (text: string) => {
        return text
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      };

      const normalizedSearch = normalizeText(searchTerm);

      filtered = filtered.filter((list) => {
        // Normalizar todos los campos para búsqueda
        const normalizedCode = normalizeText(list.code);
        const normalizedName = normalizeText(list.name);
        const normalizedDescription = list.description
          ? normalizeText(list.description)
          : "";

        return (
          normalizedCode.includes(normalizedSearch) ||
          normalizedName.includes(normalizedSearch) ||
          normalizedDescription.includes(normalizedSearch)
        );
      });
    }

    return filtered;
  }, [allPriceLists, filterActive, searchTerm]);

  // Paginación del lado del cliente
  const paginatedLists = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSearchedLists.slice(startIndex, endIndex);
  }, [filteredAndSearchedLists, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSearchedLists.length / pageSize);
  const total = filteredAndSearchedLists.length;

  // Resetear a la primera página cuando cambian los filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [filterActive, searchTerm]);

  const handleEditClick = (priceListId: string) => {
    setPopoverOpen(null);
    setMobilePopoverOpen(null);
    router.push(`/dashboard/lista_de_precios/gestion/editar/${priceListId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        <span className="ml-3 text-gray-400">
          Cargando listas de precios...
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Barra de búsqueda y filtros */}
        <div className="bg-[#070B14] rounded-lg border border-gray-800 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-gray-200 placeholder-gray-400"
              />
            </div>

            {/* Filtro de estado */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
                Estado:
              </label>
              <select
                value={
                  filterActive === undefined
                    ? "all"
                    : filterActive
                      ? "active"
                      : "inactive"
                }
                onChange={(e) => {
                  const value = e.target.value;
                  setFilterActive(
                    value === "all" ? undefined : value === "active",
                  );
                }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="all" className="bg-gray-800">Todas</option>
                <option value="active" className="bg-gray-800">Activas</option>
                <option value="inactive" className="bg-gray-800">Inactivas</option>
              </select>
            </div>
          </div>

          {/* Indicadores de filtros activos */}
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-400">
            <span>Mostrando:</span>
            <span className="px-2 py-1 bg-gray-800 rounded">
              {total} lista{total !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Vista de escritorio - Tabla */}
        <div className="hidden md:block bg-[#070B14] rounded-lg border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0A0F1C] border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Estado
                  </th>
                  {(canEdit || canDelete) && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {paginatedLists.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canEdit || canDelete ? 5 : 4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Package className="w-12 h-12 text-gray-700 mb-3" />
                        <p className="text-lg font-medium text-white mb-1">
                          No se encontraron listas de precios
                        </p>
                        <p className="text-gray-400">
                          {searchTerm
                            ? `No hay listas que coincidan con "${searchTerm}"`
                            : "No hay listas que coincidan con los filtros aplicados"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedLists.map((priceList) => (
                    <tr
                      key={priceList.id}
                      className="hover:bg-[#0A0F1C] transition-colors bg-[#070B14]"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-white">
                          {priceList.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-white">
                          {priceList.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">
                          {priceList.description || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            priceList.active
                              ? "bg-green-900/40 text-green-300 border border-green-800"
                              : "bg-red-900/40 text-red-300 border border-red-800"
                          }`}
                        >
                          {priceList.active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Popover
                              open={popoverOpen === priceList.id}
                              onOpenChange={(open) =>
                                setPopoverOpen(open ? priceList.id : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <button className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                                  <MoreVertical
                                    size={16}
                                    className="text-gray-400"
                                  />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-48 p-3 bg-[#0A0F1C] border border-gray-800 rounded-lg shadow-lg"
                                align="end"
                              >
                                <div className="space-y-1">
                                  {canEdit && (
                                    <button
                                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-300 rounded-md transition-colors"
                                      onClick={() =>
                                        handleEditClick(priceList.id)
                                      }
                                    >
                                      Editar
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/40 hover:text-red-300 rounded-md transition-colors"
                                      onClick={() =>
                                        handleOpenDeleteDialog(priceList)
                                      }
                                    >
                                      Eliminar
                                    </button>
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación integrada */}
          <PriceListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Vista móvil - Cards */}
        <div className="md:hidden space-y-3">
          {paginatedLists.length === 0 ? (
            <div className="bg-[#070B14] rounded-lg border border-gray-800 p-6 text-center">
              <div className="flex flex-col items-center justify-center">
                <Package className="w-12 h-12 text-gray-700 mb-3" />
                <p className="text-lg font-medium text-white mb-1">
                  No se encontraron listas de precios
                </p>
                <p className="text-gray-400">
                  {searchTerm
                    ? `No hay listas que coincidan con "${searchTerm}"`
                    : "No hay listas que coincidan con los filtros aplicados"}
                </p>
              </div>
            </div>
          ) : (
            paginatedLists.map((priceList) => (
              <div
                key={priceList.id}
                className="bg-[#070B14] rounded-lg border border-gray-800 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {priceList.code}
                      </div>
                      <div className="text-sm text-gray-300 mt-1">
                        {priceList.name}
                      </div>
                      {priceList.description && (
                        <div className="text-xs text-gray-400 mt-1">
                          {priceList.description}
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          priceList.active
                            ? "bg-green-900/40 text-green-300 border border-green-800"
                            : "bg-red-900/40 text-red-300 border border-red-800"
                        }`}
                      >
                        {priceList.active ? "Activa" : "Inactiva"}
                      </span>

                      {(canEdit || canDelete) && (
                        <Popover
                          open={mobilePopoverOpen === priceList.id}
                          onOpenChange={(open) =>
                            setMobilePopoverOpen(open ? priceList.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
                              <MoreVertical
                                size={16}
                                className="text-gray-400"
                              />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-48 p-3 bg-[#0A0F1C] border border-gray-800 rounded-lg shadow-lg"
                            align="end"
                          >
                            <div className="space-y-1">
                              {canEdit && (
                                <button
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-blue-900/40 hover:text-blue-300 rounded-md transition-colors"
                                  onClick={() => handleEditClick(priceList.id)}
                                >
                                  Editar
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/40 hover:text-red-300 rounded-md transition-colors"
                                  onClick={() =>
                                    handleOpenDeleteDialog(priceList)
                                  }
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Paginación para móvil */}
          <PriceListPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Diálogo de eliminación */}
      {priceListToDelete && (
        <DeletePriceListDialog
          priceList={priceListToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={handleDeleteSuccess}
          deleteFunction={deletePriceList}
          showProductWarning={true}
        />
      )}
    </>
  );
}