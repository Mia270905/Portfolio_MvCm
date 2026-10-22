import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { getUserWithPermissions } from "@/lib/actions/user.actions";

import { PriceListsTable } from "@/components/dashboard/lista-de-precios/price_list-table";

export default async function PriceListsPage() {
  // Obtener permisos del usuario
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  // Permisos específicos para listas de precios
  const canReadPriceLists = permissions.includes("read:price_management");
  const canCreatePriceLists = permissions.includes("create:price_management");
  const canEditPriceLists = permissions.includes("update:price_management");
  const canDeletePriceLists = permissions.includes("delete:price_management");

  return (
    <div className="min-h-screen bg-[#04060B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 mb-4 p-2 hover:bg-[#070B14] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Listas de precios
              </h1>
            </div>

            {canCreatePriceLists && (
              <Link
                href="/dashboard/lista_de_precios/gestion/crear"
                className="inline-flex items-center px-4 py-2 bg-yellow-500 text-[#04060B] text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors shadow-sm hover:shadow-yellow-400/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear lista
              </Link>
            )}
          </div>
        </div>

        {canReadPriceLists ? (
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                <span className="ml-3 text-gray-400">
                  Cargando listas de precios...
                </span>
              </div>
            }
          >
            <PriceListsTable
              canEdit={canEditPriceLists}
              canDelete={canDeletePriceLists}
            />
          </Suspense>
        ) : (
          <div className="bg-[#070B14] rounded-lg border border-gray-800 p-6 text-center">
            <div className="text-red-400 text-lg font-medium mb-2">
              Acceso restringido
            </div>
            <p className="text-gray-400">
              No tienes permiso para ver las listas de precios. Contacta con el
              administrador si necesitas acceso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}