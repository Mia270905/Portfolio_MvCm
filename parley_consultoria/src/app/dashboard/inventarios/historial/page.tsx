import { Suspense } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import {
  getInventoryMovementsGrouped,
  getAllProductsForFilters,
  getAllLocations,
} from "@/lib/actions/inventory.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import MovementsTable from "@/components/dashboard/inventarios/movements-table";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    product_id?: string;
    from_location?: string;
    to_location?: string;
    date_from?: string;
    date_to?: string;
    movement_type?: string;
  }>;
}

export default async function MovementsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const pageSize = 15;
  const currentPage = Number(params.page) || 1;

  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  
  const canReadRecords = permissions.includes("read:record");
  const canCreateEntry = permissions.includes("create_entry:record");
  const canCreateDeparture = permissions.includes("create_departure:record");
  const canCreateTranfer = permissions.includes("create_transfer:record");
  console.log("User Permissions:", canReadRecords, canCreateEntry, canCreateDeparture, canCreateTranfer);
  const serverFilters = {
    search: params.search || "",
    product_id: params.product_id || "",
    from_location: params.from_location || "",
    to_location: params.to_location || "",
    movement_type: params.movement_type || "",
    date_from: params.date_from || "",
    date_to: params.date_to || "",
  };

  const [groupedData, productsData, locationsData] = await Promise.all([
    getInventoryMovementsGrouped(serverFilters, currentPage, pageSize),
    getAllProductsForFilters(),
    getAllLocations(),
  ]);

  const locationsForFilters = locationsData.map((loc) => ({
    id: loc.id,
    name: loc.name,
    code: loc.code,
  }));

  const totalIndividualMovements = groupedData.groups.reduce(
    (total, group) => total + group.total_products,
    0,
  );

  const initialData = {
    groups: groupedData.groups,
    total: groupedData.total,
    page: groupedData.page,
    pageSize: groupedData.pageSize,
    totalPages: groupedData.totalPages,
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/inventarios"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Historial de movimientos
                </h1>
                <p className="text-gray-400 mt-1">
                  {groupedData.total} grupo{groupedData.total !== 1 ? "s" : ""}
                  {" • "}
                  {totalIndividualMovements} movimiento
                  {totalIndividualMovements !== 1 ? "s" : ""} total
                  {currentPage > 1 &&
                    ` • Página ${currentPage} de ${groupedData.totalPages}`}
                </p>

                <div className="flex flex-col gap-3 w-full mt-4 md:hidden">
                  {canCreateEntry && (
                    <Link
                      href="/dashboard/inventarios/historial/entradas/crear"
                      className="w-full inline-flex items-center px-4 py-2
                      bg-green-600 text-white text-sm font-medium rounded-lg
                      hover:bg-green-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar entrada
                    </Link>
                  )}

                  {canCreateDeparture && (
                    <Link
                      href="/dashboard/inventarios/historial/salidas/crear"
                      className="w-full inline-flex items-center px-4 py-2
                      bg-red-600 text-white text-sm font-medium rounded-lg
                      hover:bg-red-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar salida
                    </Link>
                  )}

                  {canCreateTranfer && (
                    <Link
                      href="/dashboard/inventarios/historial/traspaso/crear"
                      className="w-full inline-flex items-center px-4 py-2
                      bg-gray-800 text-white text-sm font-medium rounded-lg
                      hover:bg-gray-900 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar traspaso
                    </Link>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-3">
              {canCreateEntry && (
                <Link
                  href="/dashboard/inventarios/historial/entradas/crear"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar entrada
                </Link>
              )}
              {canCreateDeparture && (
                <Link
                  href="/dashboard/inventarios/historial/salidas/crear"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar salida
                </Link>
              )}
              {canCreateTranfer && (
                <Link
                  href="/dashboard/inventarios/historial/traspaso/crear"
                  className="inline-flex items-center px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar traspaso
                </Link>
              )}
            </div>
          </div>
        </div>

        {canReadRecords ? (
          <Suspense
            fallback={
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="animate-pulse text-gray-500">
                  Cargando movimientos...
                </div>
              </div>
            }
          >
            <MovementsTable
              initialData={initialData}
              products={productsData}
              locations={locationsForFilters}
              searchParams={params}
              pageSize={pageSize}
            />
          </Suspense>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="text-red-600 font-medium">
              No tienes permisos para ver el historial de movimientos.
            </div>
            <div className="text-gray-500 text-sm mt-2">
              Contacta al administrador si necesitas acceso.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
