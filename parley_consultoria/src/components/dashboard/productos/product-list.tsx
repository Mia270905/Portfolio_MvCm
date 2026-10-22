"use client";

import { useState, useEffect } from "react";
import ProductCard from "./product-card";
import { ProductDialog } from "./product-dialog";
import {
  Plus,
  Grid3x3,
  List,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { ProductPagination } from "./product-pagination";
import {
  getProducts,
  getActiveCategories,
  getPriceLists,
  type Product,
  type ProductsResponse,
} from "@/lib/actions/product.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteProductDialog } from "./delete-product-dialog";

interface ProductListProps {
  userPermissions?: string[];
}

export function ProductList({ userPermissions = [] }: ProductListProps) {
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Todos los productos
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Productos filtrados
  const [productsData, setProductsData] = useState<ProductsResponse>({
    products: [],
    total: 0,
    page: 1,
    pageSize: 9,
    totalPages: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priceMinFilter, setPriceMinFilter] = useState<string>("");
  const [priceMaxFilter, setPriceMaxFilter] = useState<string>("");
  const [priceListFilter, setPriceListFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [categories, setCategories] = useState<{ id: string; title: string }[]>(
    []
  );
  const [priceLists, setPriceLists] = useState<{ id: string; name: string }[]>(
    []
  );

  const [showFilters, setShowFilters] = useState(false);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const canCreateProducts = userPermissions.includes("create:product_details");
  const canUpdateProducts = userPermissions.includes("update:product_details");
  const canDeleteProducts = userPermissions.includes("delete:product_details");
  const canReadProducts = userPermissions.includes("read:product_details");

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (!canReadProducts) {
        setInitialLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [categoriesData, priceListsData, productsData] = await Promise.all([
          getActiveCategories(),
          getPriceLists(),
          getProducts(1, 1000, "") // Traer muchos productos de una vez
        ]);
        
        setCategories(categoriesData);
        setPriceLists(priceListsData);
        setAllProducts(productsData.products);
        setFilteredProducts(productsData.products);
        
        // Configurar paginación inicial
        setProductsData(prev => ({
          ...prev,
          products: productsData.products.slice(0, 9),
          total: productsData.products.length,
          totalPages: Math.ceil(productsData.products.length / 9)
        }));
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
        setFiltersLoading(false);
      }
    };

    loadInitialData();
  }, [canReadProducts]);

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    if (allProducts.length === 0) return;

    setIsSearching(true);
    
    // Usar setTimeout para dar un pequeño delay y mostrar el indicador de búsqueda
    const timer = setTimeout(() => {
      let filtered = [...allProducts];

      // Filtro de búsqueda
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(query) ||
          product.code.toLowerCase().includes(query) ||
          (product.bar_code && product.bar_code.toLowerCase().includes(query))
        );
      }

      // Filtro por categoría
      if (categoryFilter !== "all") {
        filtered = filtered.filter(product => product.category_id === categoryFilter);
      }

      // Filtro por precio mínimo
      if (priceMinFilter) {
        const minPrice = Number.parseFloat(priceMinFilter);
        filtered = filtered.filter(product => product.cost_price >= minPrice);
      }

      // Filtro por precio máximo
      if (priceMaxFilter) {
        const maxPrice = Number.parseFloat(priceMaxFilter);
        filtered = filtered.filter(product => product.cost_price <= maxPrice);
      }

      // Filtro por lista de precios
      if (priceListFilter !== "all") {
        filtered = filtered.filter(product => product.id_price_list === priceListFilter);
      }

      // Filtro por estado
      if (statusFilter !== "all") {
        const isActive = statusFilter === "active";
        filtered = filtered.filter(product => product.is_available === isActive);
      }

      setFilteredProducts(filtered);
      
      // Actualizar paginación
      const currentPageSize = viewMode === "grid" ? 9 : 6;
      const startIndex = (productsData.page - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      
      setProductsData(prev => ({
        ...prev,
        products: filtered.slice(startIndex, endIndex),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / currentPageSize),
        pageSize: currentPageSize
      }));

      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    allProducts,
    searchQuery,
    categoryFilter,
    priceMinFilter,
    priceMaxFilter,
    priceListFilter,
    statusFilter,
    productsData.page,
    viewMode
  ]);

  // Efecto para el debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setProductsData(prev => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Efecto para cambiar el pageSize cuando cambia el viewMode
  useEffect(() => {
    const newPageSize = viewMode === "grid" ? 9 : 6;
    setProductsData(prev => ({
      ...prev,
      page: 1,
      pageSize: newPageSize,
      totalPages: Math.ceil(filteredProducts.length / newPageSize)
    }));
  }, [viewMode, filteredProducts.length]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setPriceMinFilter("");
    setPriceMaxFilter("");
    setPriceListFilter("all");
    setStatusFilter("all");
    setSearchInput("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    categoryFilter !== "all" ||
    priceMinFilter ||
    priceMaxFilter ||
    priceListFilter !== "all" ||
    statusFilter !== "all" ||
    searchQuery;

  const handleEdit = (product: Product) => {
    if (canUpdateProducts) {
      setSelectedProduct(product);
      setIsDialogOpen(true);
    }
  };

  const handleCreate = () => {
    if (canCreateProducts) {
      setSelectedProduct(null);
      setIsDialogOpen(true);
    }
  };

  const handleSave = async () => {
    try {
      // Recargar todos los productos después de guardar
      setLoading(true);
      const data = await getProducts(1, 1000, "");
      setAllProducts(data.products);
      setFilteredProducts(data.products);
    } catch (error) {
      console.error("Error al recargar productos:", error);
    } finally {
      setLoading(false);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteClick = (product: Product) => {
    if (canDeleteProducts) {
      setProductToDelete(product);
      setDeleteDialogOpen(true);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const newAllProducts = allProducts.filter(product => product.id !== productId);
      setAllProducts(newAllProducts);
      
      const newFilteredProducts = filteredProducts.filter(product => product.id !== productId);
      setFilteredProducts(newFilteredProducts);
      
      const currentPageSize = viewMode === "grid" ? 9 : 6;
      const startIndex = (productsData.page - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      
      setProductsData(prev => ({
        ...prev,
        products: newFilteredProducts.slice(startIndex, endIndex),
        total: newFilteredProducts.length,
        totalPages: Math.ceil(newFilteredProducts.length / currentPageSize)
      }));

    } catch (error) {
      console.error("Error al eliminar producto visualmente:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setProductsData((prev) => ({
      ...prev,
      page,
    }));
  };

  if (!canReadProducts && !initialLoading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-white rounded-lg shadow p-6 text-center text-red-600">
          No tienes permisos para ver los productos.
        </div>
      </div>
    );
  }

  // Mostrar skeleton solo para los productos cuando está cargando
  const renderProductList = () => {
    if (loading && initialLoading) {
      return (
        <div className="space-y-4 sm:space-y-6">
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-3"
            }
          >
            {[...Array(productsData.pageSize)].map((_, idx) => (
              <div
                key={idx}
                className={`animate-pulse bg-[#0A0F17] rounded-lg border border-gray-800 p-4 ${
                  viewMode === "list" ? "flex gap-3" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div
                    className={`${
                      viewMode === "list" ? "h-16 w-16" : "h-20 w-20"
                    } bg-gray-800 rounded-md`}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                    <div className="h-3 bg-gray-800 rounded w-1/2" />
                    <div className="h-3 bg-gray-800 rounded w-2/3" />
                    {viewMode === "list" && (
                      <div className="h-3 bg-gray-800 rounded w-1/3" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (productsData.products.length === 0 && searchQuery) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-gray-500 mb-2 text-sm sm:text-base">
            No se encontraron productos que coincidan con `&quot;`{searchQuery}`&quot;`
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Intenta con otros términos de búsqueda
          </p>
        </div>
      );
    }

    if (productsData.products.length === 0 && !searchQuery && !loading) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            No hay productos registrados
          </p>
        </div>
      );
    }

    return (
      <>
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {productsData.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                userPermissions={userPermissions}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {productsData.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                userPermissions={userPermissions}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {/* Controles de búsqueda y vista - Siempre visibles */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
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
            placeholder="Buscar productos por nombre, código o código de barras..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-base text-white placeholder-gray-400"
          />
        </div>

        <div className="hidden md:flex gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "grid"
                ? "bg-blue-900/30 border-blue-600 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
            }`}
            title="Vista de cuadrícula"
          >
            <Grid3x3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg border transition-colors ${
              viewMode === "list"
                ? "bg-blue-900/30 border-blue-600 text-blue-400"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700"
            }`}
            title="Vista de lista"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filtros - Siempre visibles */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-200 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-600 rounded-full">
                {
                  [
                    categoryFilter !== "all",
                    priceMinFilter,
                    priceMaxFilter,
                    priceListFilter !== "all",
                    statusFilter !== "all", 
                  ].filter(Boolean).length
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
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-300 hover:text-gray-100 hover:bg-gray-700 rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
              Limpiar todo
            </button>
          )}
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-3">
            {categoryFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-blue-300 bg-blue-900/40 border border-blue-800 rounded-full">
                Categoría:{" "}
                {categories.find((c) => c.id === categoryFilter)?.title}
                <button
                  onClick={() => setCategoryFilter("all")}
                  className="hover:bg-blue-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceMinFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-300 bg-green-900/40 border border-green-800 rounded-full">
                Precio mín: ${priceMinFilter}
                <button
                  onClick={() => setPriceMinFilter("")}
                  className="hover:bg-green-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceMaxFilter && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-green-300 bg-green-900/40 border border-green-800 rounded-full">
                Precio máx: ${priceMaxFilter}
                <button
                  onClick={() => setPriceMaxFilter("")}
                  className="hover:bg-green-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {priceListFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-purple-300 bg-purple-900/40 border border-purple-800 rounded-full">
                Lista: {priceLists.find((p) => p.id === priceListFilter)?.name}
                <button
                  onClick={() => setPriceListFilter("all")}
                  className="hover:bg-purple-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-orange-300 bg-orange-900/40 border border-orange-800 rounded-full">
                Estado: {statusFilter === "active" ? "Activos" : "Inactivos"}
                <button
                  onClick={() => setStatusFilter("all")}
                  className="hover:bg-orange-800/50 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {showFilters && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label
                  htmlFor="category-filter"
                  className="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                >
                  Categoría
                </Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger
                    id="category-filter"
                    className="h-10 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors text-gray-200"
                  >
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="all" className="text-gray-200 hover:bg-gray-700">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="text-gray-200 hover:bg-gray-700"
                      >
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filters */}
              <div className="space-y-2">
                <Label
                  htmlFor="price-min-filter"
                  className="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                >
                  Precio mínimo
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <Input
                    id="price-min-filter"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={priceMinFilter}
                    onChange={(e) => setPriceMinFilter(e.target.value)}
                    className="h-10 pl-7 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors text-gray-200 placeholder-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="price-max-filter"
                  className="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                >
                  Precio máximo
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    $
                  </span>
                  <Input
                    id="price-max-filter"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={priceMaxFilter}
                    onChange={(e) => setPriceMaxFilter(e.target.value)}
                    className="h-10 pl-7 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors text-gray-200 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Price List Filter */}
              <div className="space-y-2">
                <Label
                  htmlFor="price-list-filter"
                  className="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                >
                  Lista de precios
                </Label>
                <Select
                  value={priceListFilter}
                  onValueChange={setPriceListFilter}
                >
                  <SelectTrigger
                    id="price-list-filter"
                    className="h-10 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors text-gray-200"
                  >
                    <SelectValue placeholder="Todas las listas" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem
                      value="all"
                      className="text-gray-200 hover:bg-gray-700"
                    >
                      Todas las listas
                    </SelectItem>
                    {priceLists.map((priceList) => (
                      <SelectItem
                        key={priceList.id}
                        value={priceList.id}
                        className="text-gray-200 hover:bg-gray-700"
                      >
                        {priceList.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro de Estado */}
              <div className="space-y-2">
                <Label
                  htmlFor="status-filter"
                  className="text-xs font-semibold text-gray-300 uppercase tracking-wide"
                >
                  Estado
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger
                    id="status-filter"
                    className="h-10 bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors text-gray-200"
                  >
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem
                      value="all"
                      className="text-gray-200 hover:bg-gray-700"
                    >
                      Todos los estados
                    </SelectItem>
                    <SelectItem
                      value="active"
                      className="text-gray-200 hover:bg-gray-700"
                    >
                      Activos
                    </SelectItem>
                    <SelectItem
                      value="inactive"
                      className="text-gray-200 hover:bg-gray-700"
                    >
                      Inactivos
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de búsqueda */}
      {isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Aplicando filtros...</span>
          </div>
        </div>
      )}

      {/* Lista de productos - Aquí se aplica el skeleton */}
      {renderProductList()}

      {/* Paginación - Solo visible cuando no está cargando */}
      {!loading && productsData.totalPages > 1 && (
        <ProductPagination
          currentPage={productsData.page}
          totalPages={productsData.totalPages}
          totalItems={productsData.total}
          pageSize={productsData.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Diálogo de eliminación */}
      <DeleteProductDialog
        productId={productToDelete?.id || ""}
        nameUnaccent={productToDelete?.name || ""}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setProductToDelete(null);
          }
        }}
        onDelete={handleDelete}
      />

      {/* Diálogo de producto */}
      {(canCreateProducts || canUpdateProducts) && (
        <ProductDialog
          product={selectedProduct}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          isLoading={false}
        />
      )}
    </>
  );
}

export type { Product };