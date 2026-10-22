"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CategoryItem from "./category-item";
import { CategoryDialog } from "./category-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { CategoryPagination } from "./category-pagination";

export interface ProductCategory {
  id: string;
  title: string;
  description: string;
  image_url: string | File;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CategoriesResponse {
  categories: ProductCategory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CategoryListProps {
  userPermissions?: string[];
}

const supabase = createClient();

export function CategoryList({ userPermissions = [] }: CategoryListProps) {
  const [categoriesData, setCategoriesData] = useState<CategoriesResponse>({
    categories: [],
    total: 0,
    page: 1,
    pageSize: 5,
    totalPages: 0,
  });
  const [selectedCategory, setSelectedCategory] =
    useState<ProductCategory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const canCreateCategories = userPermissions.includes("create:categories");
  const canUpdateCategories = userPermissions.includes("update:categories");
  const canDeleteCategories = userPermissions.includes("delete:categories");
  const canReadCategories = userPermissions.includes("read:categories");

  // Efecto para búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setCategoriesData((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Traer datos de Supabase con paginación y búsqueda
  useEffect(() => {
    const fetchCategories = async () => {
      // Si no tiene permiso de lectura, no hacer la petición
      if (!canReadCategories) {
        setInitialLoading(false);
        return;
      }

      if (searchQuery) {
        setIsSearching(true);
      }

      const from = (categoriesData.page - 1) * categoriesData.pageSize;
      const to = from + categoriesData.pageSize - 1;

      let query = supabase
        .from("product_categories")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: true })
        .is("deleted_at", null);

      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error("Error al obtener categorías:", error.message);
      } else {
        const totalPages = count
          ? Math.ceil(count / categoriesData.pageSize)
          : 0;

        setCategoriesData((prev) => ({
          ...prev,
          categories: data.map((cat) => ({
            id: cat.id,
            title: cat.title,
            description: cat.description,
            image_url: cat.image_url,
            active: cat.active,
            created_at: cat.created_at,
            updated_at: cat.updated_at,
          })),
          total: count || 0,
          totalPages,
        }));
      }

      if (initialLoading) {
        setInitialLoading(false);
      }

      setIsSearching(false);
    };

    fetchCategories();
  }, [categoriesData.page, searchQuery, initialLoading, canReadCategories]);

  const handleEdit = (category: ProductCategory) => {
    if (canUpdateCategories) {
      setSelectedCategory(category);
      setIsDialogOpen(true);
    }
  };

  const handleCreate = () => {
    if (canCreateCategories) {
      setSelectedCategory(null);
      setIsDialogOpen(true);
    }
  };

  const handleSave = (category: Partial<ProductCategory>) => {
    if (!canCreateCategories && !canUpdateCategories) return;

    if (selectedCategory && selectedCategory.id) {
      setCategoriesData((prev) => ({
        ...prev,
        categories: prev.categories.map((cat) =>
          cat.id === selectedCategory.id ? { ...cat, ...category } : cat
        ),
      }));
    } else {
      setCategoriesData((prev) => ({
        ...prev,
        categories: [
          ...prev.categories,
          {
            id: Date.now().toString(),
            title: category.title || "Nueva categoría",
            description: category.description || "",
            image_url: category.image_url || "",
            active: category.active ?? true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
      }));
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (categoryId: string) => {
    if (!canDeleteCategories) return;

    setCategoriesData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat.id !== categoryId),
      total: prev.total - 1,
      totalPages: Math.ceil((prev.total - 1) / prev.pageSize),
    }));
  };

  const handlePageChange = (page: number) => {
    setCategoriesData((prev) => ({
      ...prev,
      page,
    }));
  };

  // Si no tiene permiso de lectura
  if (!canReadCategories && !initialLoading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">
          No tienes permisos para ver las categorías.
        </div>
      </div>
    );
  }

  // Mostrar skeleton solo en carga inicial
  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Skeleton de barra de búsqueda */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="h-10 bg-[#0A0F17] rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton de varias categorías */}
        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0A0F17] rounded-lg shadow-xs border border-gray-800 p-4"
          >
            {/* Contenedor de imagen y texto */}
            <div className="flex items-center space-x-4">
              {/* Imagen */}
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-800 rounded-full" />

              {/* Texto */}
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-800 rounded-sm w-3/4" />
                <div className="h-3 bg-gray-800 rounded-sm w-1/2" />
              </div>
            </div>

            {/* Botones de acciones (editar/eliminar) */}
            <div className="flex justify-end sm:justify-start space-x-2">
              <div className="h-8 w-8 bg-gray-800 rounded" />
              <div className="h-8 w-8 bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (categoriesData.categories.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-white mb-4 text-sm sm:text-base">
          No hay categorías registradas
        </p>
        {canCreateCategories && (
          <Link href="/dashboard/productos/categorias/crear">
            <Button className="inline-flex items-center px-3 md:px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg">
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Primera Categoría</span>
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Barra de búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
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
            placeholder="Buscar categorías por título..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-base text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Mostrar indicador de búsqueda solo cuando hay query */}
      {isSearching && searchQuery && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Buscando categorías...</span>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay resultados de búsqueda */}
      {categoriesData.categories.length === 0 &&
        searchQuery &&
        !isSearching && (
          <div className="text-center py-8 sm:py-12 px-4">
            <p className="text-gray-300 mb-2 text-sm sm:text-base">
              No se encontraron categorías que coincidan con `&quot;`{searchQuery}`&quot;`
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}

      {/* Lista de categorías - Siempre visible excepto durante búsqueda con query */}
      {(!isSearching || !searchQuery) && (
        <div className="space-y-3 sm:space-y-4">
          {categoriesData.categories.map((category) => (
            <CategoryItem
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onDelete={handleDelete}
              userPermissions={userPermissions}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {categoriesData.totalPages > 1 && !isSearching && (
        <CategoryPagination
          currentPage={categoriesData.page}
          totalPages={categoriesData.totalPages}
          totalItems={categoriesData.total}
          pageSize={categoriesData.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Dialog para editar/crear - Solo si tiene permisos */}
      {(canCreateCategories || canUpdateCategories) && (
        <CategoryDialog
          category={selectedCategory}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          isLoading={false}
          onImageChange={(urlOrFile) => {
          }}
          errors={{}}
        />
      )}
    </>
  );
}
