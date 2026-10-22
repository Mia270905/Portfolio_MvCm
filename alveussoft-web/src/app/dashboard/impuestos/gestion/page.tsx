import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { TaxesContainer } from "@/components/dashboard/impuestos/taxes-container";

export default async function TaxesPage() {
  // Obtener permisos del usuario
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  // Permisos específicos para impuestos
  const canReadTaxes = permissions.includes("read:tax_management");
  const canCreateTaxes = permissions.includes("create:tax_management");

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 mb-4 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Impuestos</h1>
            </div>

            {canCreateTaxes && (
              <Link
                href="/dashboard/impuestos/gestion/crear"
                className="inline-flex items-center px-4 py-2 bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear impuesto
              </Link>
            )}
          </div>
        </div>

        {canReadTaxes ? (
          <Suspense
            fallback={
              <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-800 rounded"></div>
                    <div className="h-4 bg-gray-800 rounded"></div>
                    <div className="h-4 bg-gray-800 rounded"></div>
                  </div>
                </div>
              </div>
            }
          >
            <TaxesContainer />
          </Suspense>
        ) : (
          <div className="bg-[#0A0F17] rounded-lg border border-gray-800 p-6">
            <div className="text-center p-8 border-2 border-dashed border-gray-700 rounded-lg">
              <div className="text-red-400 font-medium mb-2">
                Sin permisos de acceso
              </div>
              <p className="text-gray-400">
                No tienes permiso para ver la gestión de impuestos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
