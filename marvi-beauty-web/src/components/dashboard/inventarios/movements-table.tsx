"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Calendar,
  ChevronDown,
  Printer,
  ChevronRight,
  Hash,
  Package,
  ShoppingCart,
  Move,
  RefreshCw,
  AlertTriangle,
  ArrowLeftRight,
} from "lucide-react";
import { GroupedInventoryMovement } from "@/lib/actions/inventory.actions";
import ProductSearch from "@/components/dashboard/inventarios/product-search";
import { MovementsPagination } from "./movements-pagination";
import { MovementTicketPreview } from "./movement-ticket-preview";

interface MovementsTableProps {
  initialData: {
    groups: GroupedInventoryMovement[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  products: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  locations: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  searchParams: {
    page?: string;
    search?: string;
    product_id?: string;
    from_location?: string;
    to_location?: string;
    date_from?: string;
    date_to?: string;
    movement_type?: string;
  };
  pageSize: number;
}

export default function MovementsTable({
  initialData,
  products,
  locations,
  searchParams,
  pageSize,
}: MovementsTableProps) {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.page) || 1,
  );
  const [previewGroup, setPreviewGroup] =
    useState<GroupedInventoryMovement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [groupProductSearch, setGroupProductSearch] = useState<{
    [key: string]: string;
  }>({});

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [filters, setFilters] = useState({
    date_from: searchParams.date_from || "",
    date_to: searchParams.date_to || "",
    product_id: searchParams.product_id || "",
    from_location: searchParams.from_location || "",
    to_location: searchParams.to_location || "",
    movement_type: searchParams.movement_type || "",
    search: searchParams.search || "",
  });

  useEffect(() => {
    setFilters({
      date_from: searchParams.date_from || "",
      date_to: searchParams.date_to || "",
      product_id: searchParams.product_id || "",
      from_location: searchParams.from_location || "",
      to_location: searchParams.to_location || "",
      movement_type: searchParams.movement_type || "",
      search: searchParams.search || "",
    });
  }, [searchParams]);

  const updateURL = useCallback(
    (newFilters: typeof filters, newPage?: number) => {
      const params = new URLSearchParams();

      if (newPage && newPage > 1) {
        params.set("page", newPage.toString());
      }

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== "") {
          params.set(key, value);
        }
      });

      const queryString = params.toString();
      const url = queryString
        ? `/dashboard/inventarios/historial?${queryString}`
        : "/dashboard/inventarios/historial";

      router.push(url);
    },
    [router],
  );

  // Usar directamente los datos del servidor sin filtrado adicional en el cliente
  const displayedGroups = initialData.groups;
  const totalItems = initialData.total;
  const totalPages = initialData.totalPages;

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  };

  const clearFilters = () => {
    const newFilters = {
      date_from: "",
      date_to: "",
      product_id: "",
      from_location: "",
      to_location: "",
      movement_type: "",
      search: "",
    };
    setFilters(newFilters);
    setCurrentPage(1);
    updateURL(newFilters, 1);
  };

  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      updateURL(filters, newPage);
      window.scrollTo(0, 0);
    }
  };

  const getMovementTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      sale: "bg-red-100 text-red-800",
      purchase: "bg-green-100 text-green-800",
      transfer: "bg-blue-100 text-blue-800",
      adjustment: "bg-yellow-100 text-yellow-800",
      loss: "bg-gray-100 text-gray-800",
      return: "bg-purple-100 text-purple-800",
      initial: "bg-indigo-100 text-indigo-800",
      production: "bg-teal-100 text-teal-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      sale: "Venta",
      purchase: "Compra",
      transfer: "Transferencia",
      adjustment: "Ajuste",
      loss: "Pérdida",
      return: "Devolución",
      initial: "Stock Inicial",
      production: "Producción",
    };
    return labels[type] || type;
  };

  const getMovementTypeIcon = (type: string) => {
    const icons: { [key: string]: any } = {
      sale: ShoppingCart,
      purchase: Package,
      transfer: ArrowLeftRight,
      adjustment: RefreshCw,
      loss: AlertTriangle,
      return: RefreshCw,
      initial: Package,
      production: Package,
    };
    return icons[type] || Package;
  };

  const getQuantityColor = (type: string) => {
    return type === "sale" || type === "loss"
      ? "text-red-600"
      : type === "purchase" ||
          type === "return" ||
          type === "initial" ||
          type === "production"
        ? "text-green-600"
        : "text-blue-600";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePreviewTicket = (group: GroupedInventoryMovement) => {
    setPreviewGroup(group);
  };

  const handleClosePreview = () => {
    setPreviewGroup(null);
  };

  const handlePrintTicket = async () => {
    if (!previewGroup) return;

    setIsGenerating(true);
    try {
      setTimeout(() => {
        setIsGenerating(false);
        setPreviewGroup(null);
      }, 1500);
    } catch (error) {
      console.error("Error al imprimir:", error);
      setIsGenerating(false);
    }
  };

  const getGroupType = (group: GroupedInventoryMovement) => {
    return group.inventory_movement_id ? "related" : "manual";
  };

  const getFilteredGroupMovements = (groupId: string, movements: any[]) => {
    const searchTerm = groupProductSearch[groupId]?.toLowerCase() || "";
    if (!searchTerm) {
      return movements.slice(0, 5);
    }

    return movements.filter(
      (movement) =>
        movement.product?.name?.toLowerCase().includes(searchTerm) ||
        movement.product?.code?.toLowerCase().includes(searchTerm) ||
        movement.product?.bar_code?.toLowerCase().includes(searchTerm) ||
        movement.notes?.toLowerCase().includes(searchTerm),
    );
  };

  const handleGroupProductSearch = (groupId: string, value: string) => {
    setGroupProductSearch((prev) => ({
      ...prev,
      [groupId]: value,
    }));
  };

  const hasActiveFilters = Object.values(filters).some((value) => value !== "");

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "Todos";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    });
  };

  const getDateRangeText = () => {
    if (!filters.date_from && !filters.date_to) {
      return "Todos los días";
    }

    if (filters.date_from && filters.date_to) {
      return `${formatDisplayDate(filters.date_from)} - ${formatDisplayDate(
        filters.date_to,
      )}`;
    }

    if (filters.date_from) {
      return `Desde ${formatDisplayDate(filters.date_from)}`;
    }

    if (filters.date_to) {
      return `Hasta ${formatDisplayDate(filters.date_to)}`;
    }

    return "Filtrando por fecha";
  };

  return (
    <>
      <div className="space-y-4">
        <div className="bg-[#0A0F17] border border-gray-800 rounded-lg p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-400">Filtros</h3>
              <span className="ml-2 text-xs text-gray-500">
                {getDateRangeText()}
              </span>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronDown
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          <div
            className={`${showFilters ? "block" : "hidden"} md:block space-y-4`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    placeholder="Notas, referencias, producto..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Movimiento
                </label>
                <select
                  value={filters.movement_type}
                  onChange={(e) =>
                    handleFilterChange("movement_type", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-[#0A0F17] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="sale">Venta</option>
                  <option value="purchase">Compra</option>
                  <option value="transfer">Transferencia</option>
                  <option value="adjustment">Ajuste</option>
                  <option value="loss">Pérdida</option>
                  <option value="return">Devolución</option>
                  <option value="initial">Stock Inicial</option>
                  <option value="production">Producción</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Origen
                </label>
                <select
                  value={filters.from_location}
                  onChange={(e) =>
                    handleFilterChange("from_location", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-[#0A0F17] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos</option>
                  {locations.map((location) => (
                    <option key={`from-${location.id}`} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Destino
                </label>
                <select
                  value={filters.to_location}
                  onChange={(e) =>
                    handleFilterChange("to_location", e.target.value)
                  }
                  className="w-full px-3 py-2 bg-[#0A0F17] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Todos</option>
                  {locations.map((location) => (
                    <option key={`to-${location.id}`} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Desde
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.date_from}
                    onChange={(e) =>
                      handleFilterChange("date_from", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    max={getTodayDate()}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hasta
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={filters.date_to}
                    onChange={(e) =>
                      handleFilterChange("date_to", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    max={getTodayDate()}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Limpiar Todos los Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla para desktop */}
        <div className="hidden md:block bg-[#0A0F17] border border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                    {/* Expand/Collapse */}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Fecha / Referencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tipo / Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Productos / Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Notas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-24">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {hasActiveFilters
                        ? "No se encontraron movimientos con los filtros aplicados"
                        : "No hay movimientos registrados"}
                    </td>
                  </tr>
                ) : (
                  displayedGroups.map((group) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const displayedMovements = isExpanded
                      ? getFilteredGroupMovements(group.id, group.movements)
                      : [];
                    const groupType = getGroupType(group);
                    const MovementIcon = getMovementTypeIcon(
                      group.movement_type,
                    );

                    return (
                      <>
                        {/* Fila principal del grupo */}
                        <tr
                          key={`group-row-${group.id}`}
                          className="hover:bg-[#070B14] transition-colors bg-[#0A0F17]"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {group.total_products > 0 && (
                              <button
                                onClick={() => toggleGroup(group.id)}
                                className="p-1 hover:bg-[#070B14] rounded transition-colors"
                                title={isExpanded ? "Plegar" : "Expandir"}
                              >
                                <ChevronRight
                                  className={`w-5 h-5 text-gray-300 transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                  }`}
                                />
                              </button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-300">
                              {formatDate(group.created_at)}
                            </div>

                            <div className="mt-2 space-y-1">
                              {/* {group.movement_number && (
                                <div className="text-xs text-purple-600 flex items-center gap-1">
                                  <Move className="w-3 h-3" />
                                  <span className="font-medium">
                                    Movimiento #{group.movement_number}
                                  </span>
                                </div>
                              )} */}

                              {group.order_number && (
                                <div className="text-xs text-blue-600 flex items-center gap-1">
                                  <Hash className="w-3 h-3" />
                                  <span className="font-medium">
                                    Orden #{group.order_number}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MovementIcon className="w-4 h-4" />
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementTypeColor(
                                  group.movement_type,
                                )}`}
                              >
                                {getMovementTypeLabel(group.movement_type)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400">
                              <div className="flex items-center gap-1">
                                <span className="truncate max-w-[100px] font-medium">
                                  {group.from_location_data?.name || "N/A"}
                                </span>
                                <span className="text-gray-300">→</span>
                                <span className="truncate max-w-[100px] font-medium">
                                  {group.to_location_data?.name || "N/A"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {group.total_products === 0 ? (
                              <div className="text-sm text-gray-400">
                                Sin productos
                              </div>
                            ) : (
                              <div className="space-y-1">
                                {group.movements
                                  .slice(0, 2)
                                  .map((movement, idx) => (
                                    <div
                                      key={`preview-${group.id}-${movement.id}-${idx}`}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="truncate max-w-[150px]">
                                        {movement.product?.name || "Producto"}
                                      </span>
                                      <span
                                        className={`font-medium ml-2 ${getQuantityColor(
                                          group.movement_type,
                                        )}`}
                                      >
                                        {movement.quantity}
                                      </span>
                                    </div>
                                  ))}
                                {group.total_products > 2 && (
                                  <div className="text-xs text-gray-500 pt-1">
                                    +{group.total_products - 2} productos más
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-md line-clamp-3 break-words text-sm text-gray-400">
                              {group.notes || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handlePreviewTicket(group)}
                              className="p-2 hover:bg-blue-50 rounded transition-colors text-blue-600 border border-blue-200"
                              title="Ver detalles del movimiento"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Filas expandidas con los movimientos del grupo */}
                        {isExpanded && group.total_products > 0 && (
                          <>
                            {/* Barra de búsqueda para los movimientos del grupo */}
                            <tr
                              key={`search-${group.id}`}
                              className="bg-[#0A0F17] border-t border-gray-200"
                            >
                              <td colSpan={6} className="px-6 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium text-gray-300">
                                    Detalles del grupo ({group.movements.length}{" "}
                                    productos)
                                  </div>
                                  <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                      type="text"
                                      value={groupProductSearch[group.id] || ""}
                                      onChange={(e) =>
                                        handleGroupProductSearch(
                                          group.id,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Buscar producto en este grupo..."
                                      className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* Encabezado para los detalles */}
                            <tr
                              key={`header-${group.id}`}
                              className="bg-[#0A0F17]"
                            >
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                                #
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Producto
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Código
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Cantidad
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Ubicaciones
                              </th>
                              <th className="px-6 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Notas
                              </th>
                            </tr>

                            {/* Movimientos filtrados */}
                            {displayedMovements.length === 0 ? (
                              <tr
                                key={`empty-${group.id}`}
                                className="bg-[#0A0F17]"
                              >
                                <td
                                  colSpan={6}
                                  className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                  {groupProductSearch[group.id]
                                    ? "No se encontraron productos con ese criterio"
                                    : "No hay productos para mostrar"}
                                </td>
                              </tr>
                            ) : (
                              displayedMovements.map((movement, index) => (
                                <tr
                                  key={`detail-${group.id}-${movement.id}`}
                                  className="bg-[#0A0F17] hover:bg-[#070B14] transition-colors"
                                >
                                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                                    {movement.product?.name ||
                                      "Producto sin nombre"}
                                  </td>
                                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                                    {movement.product?.code || "-"}
                                  </td>
                                  <td className="px-6 py-3 whitespace-nowrap">
                                    <span
                                      className={`text-sm font-semibold ${getQuantityColor(
                                        movement.movement_type,
                                      )}`}
                                    >
                                      {movement.quantity}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3">
                                    <div className="text-xs text-gray-400">
                                      <div className="flex items-center gap-1">
                                        <span>
                                          {movement.from_location_data?.name ||
                                            "N/A"}
                                        </span>
                                        <span className="text-gray-400">→</span>
                                        <span>
                                          {movement.to_location_data?.name ||
                                            "N/A"}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-3">
                                    <div className="max-w-md line-clamp-2 break-words text-xs text-gray-400">
                                      {movement.notes || "-"}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}

                            {/* Mostrar mensaje si hay más de 5 movimientos y no hay búsqueda */}
                            {!groupProductSearch[group.id] &&
                              group.movements.length > 5 && (
                                <tr
                                  key={`more-${group.id}`}
                                  className="bg-[#0A0F17]"
                                >
                                  <td
                                    colSpan={6}
                                    className="px-6 py-3 text-center"
                                  >
                                    <div className="text-sm text-gray-400">
                                      Mostrando 5 de {group.movements.length}{" "}
                                      productos.
                                      <button
                                        onClick={() =>
                                          handleGroupProductSearch(group.id, "")
                                        }
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                      >
                                        Buscar para ver más
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}
                          </>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <MovementsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={changePage}
              />
            </div>
          )}
        </div>

        {/* Versión móvil - Cards */}
        <div className="md:hidden space-y-4">
          {displayedGroups.length === 0 ? (
            <div className="bg-[#0A0F17] border border-gray-800 rounded-lg p-6 text-center text-gray-500">
              {hasActiveFilters
                ? "No se encontraron movimientos con los filtros aplicados"
                : "No hay movimientos registrados"}
            </div>
          ) : (
            displayedGroups.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              const groupType = getGroupType(group);
              const MovementIcon = getMovementTypeIcon(group.movement_type);

              return (
                <div
                  key={`mobile-${group.id}`}
                  className="bg-[#0A0F17] border border-gray-800 rounded-lg overflow-hidden"
                >
                  {/* Encabezado de la card */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MovementIcon className="w-4 h-4 text-gray-600" />
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementTypeColor(
                              group.movement_type,
                            )}`}
                          >
                            {getMovementTypeLabel(group.movement_type)}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatShortDate(group.created_at)}
                        </div>
                      </div>
                      <button
                        onClick={() => handlePreviewTicket(group)}
                        className="p-2 hover:bg-blue-50 rounded transition-colors text-blue-600 border border-blue-200"
                        title="Ver detalles del movimiento"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Información de ubicaciones */}
                    <div className="flex items-center text-xs text-gray-600 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="truncate font-medium">
                            {group.from_location_data?.name || "N/A"}
                          </span>
                          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate font-medium">
                            {group.to_location_data?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Información de orden si existe */}
                    <div className="mt-2 space-y-1">
                      {/* {group.movement_number && (
                        <div className="text-xs text-purple-600 flex items-center gap-1">
                          <Move className="w-3 h-3" />
                          <span className="font-medium">
                            Movimiento #{group.movement_number}
                          </span>
                        </div>
                      )} */}

                      {group.order_number && (
                        <div className="text-xs text-blue-600 flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          <span className="font-medium">
                            Orden #{group.order_number}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Resumen de productos */}
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-1">
                        Productos
                      </div>
                      {group.total_products === 0 ? (
                        <div className="text-sm text-gray-400">
                          Sin productos
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {group.movements.slice(0, 2).map((movement, idx) => (
                            <div
                              key={`mobile-preview-${group.id}-${movement.id}-${idx}`}
                              className="flex items-center justify-between text-sm"
                            >
                              <span className="truncate flex-1 mr-2">
                                {movement.product?.name || "Producto"}
                              </span>
                              <span
                                className={`font-medium ${getQuantityColor(
                                  group.movement_type,
                                )}`}
                              >
                                {movement.quantity}
                              </span>
                            </div>
                          ))}
                          {group.total_products > 2 && (
                            <div className="text-xs text-gray-500 pt-1">
                              +{group.total_products - 2} productos más
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Notas */}
                    {group.notes && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Notas</div>
                        <div className="text-sm text-gray-600 line-clamp-2">
                          {group.notes}
                        </div>
                      </div>
                    )}

                    {/* Botón para expandir/colapsar */}
                    {group.total_products > 0 && (
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className="flex items-center justify-center w-full py-2 text-sm text-blue-600 hover:text-blue-800 border-t border-gray-200 mt-3"
                      >
                        <span>
                          {isExpanded
                            ? "Ver menos detalles"
                            : "Ver todos los productos"}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 ml-2 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Sección expandida - Detalles de productos */}
                  {isExpanded && group.total_products > 0 && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Detalles del grupo ({group.movements.length}{" "}
                          productos)
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={groupProductSearch[group.id] || ""}
                            onChange={(e) =>
                              handleGroupProductSearch(group.id, e.target.value)
                            }
                            placeholder="Buscar producto en este grupo..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-[#0A0F17]"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {getFilteredGroupMovements(group.id, group.movements)
                          .length === 0 ? (
                          <div className="text-center text-sm text-gray-500 py-4">
                            {groupProductSearch[group.id]
                              ? "No se encontraron productos con ese criterio"
                              : "No hay productos para mostrar"}
                          </div>
                        ) : (
                          getFilteredGroupMovements(
                            group.id,
                            group.movements,
                          ).map((movement, index) => (
                            <div
                              key={`mobile-detail-${group.id}-${movement.id}`}
                              className="bg-[#0A0F17] border border-gray-800 rounded-lg p-3"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">
                                    {movement.product?.name ||
                                      "Producto sin nombre"}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Código: {movement.product?.code || "-"}
                                  </div>
                                </div>
                                <span
                                  className={`font-semibold text-sm ${getQuantityColor(
                                    movement.movement_type,
                                  )}`}
                                >
                                  {movement.quantity}
                                </span>
                              </div>

                              <div className="text-xs text-gray-600 mb-2">
                                <div className="flex items-center gap-1">
                                  <span className="truncate">
                                    {movement.from_location_data?.name || "N/A"}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  <span className="truncate">
                                    {movement.to_location_data?.name || "N/A"}
                                  </span>
                                </div>
                              </div>

                              {movement.notes && (
                                <div className="text-xs text-gray-600">
                                  <div className="font-medium text-gray-500 mb-1">
                                    Notas:
                                  </div>
                                  <div className="line-clamp-2">
                                    {movement.notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Mostrar mensaje si hay más de 5 movimientos y no hay búsqueda */}
                      {!groupProductSearch[group.id] &&
                        group.movements.length > 5 && (
                          <div className="text-center text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200">
                            Mostrando 5 de {group.movements.length} productos.
                            <button
                              onClick={() =>
                                handleGroupProductSearch(group.id, "")
                              }
                              className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Buscar para ver más
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Paginación móvil */}
          {totalPages > 1 && (
            <div className="bg-[#0A0F17] border border-gray-800 rounded-lg p-4">
              <MovementsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={changePage}
                isMobile={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Preview del ticket */}
      {previewGroup && (
        <MovementTicketPreview
          movement={previewGroup.movements[0]}
          group={previewGroup as any}
          isOpen={!!previewGroup}
          onClose={handleClosePreview}
          onPrint={handlePrintTicket}
          isGenerating={isGenerating}
        />
      )}
    </>
  );
}
