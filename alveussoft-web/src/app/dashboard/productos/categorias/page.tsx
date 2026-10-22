import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { CategoryList } from "@/components/dashboard/categorias/category-list";
import { Suspense } from "react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { CategoryListSkeleton } from "@/components/dashboard/categorias/category-list-skeleton";

export default async function CategoriesPage() {
  // Trae los permisos del usuario autenticado
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canReadProducts = permissions.includes("read:categories");
  const canCreateCategory = permissions.includes("create:categories");

  return (
    <div>
      {/* Volver */}
      <div className="mb-6">
        <Link
          href="/dashboard/productos"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título y botón - Ahora ambos en la misma página */}
        <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
            Categorías de productos
          </h1>

          {canCreateCategory && (
            <Link
              href="/dashboard/productos/categorias/crear"
                className="inline-flex items-center px-3 md:px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/20"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Categoría</span>
            </Link>
          )}
        </div>

        {/* Lista de categorías con control de permisos */}
        {canReadProducts ? (
          <Suspense fallback={<CategoryListSkeleton />}>
            <CategoryList userPermissions={permissions} />
          </Suspense>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">
            No tienes permisos para ver las categorías de productos.
          </div>
        )}
      </div>
    </div>
  );
}
