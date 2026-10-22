import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { getInventoryLocations } from "@/lib/actions/warehouse.actions";
import { WarehouseTable } from "@/components/dashboard/almacenes/warehouse-table";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
  }>;
};

// Código del permiso que permite crear ubicaciones de inventario
const CREATE_INVENTORY_LOCATION_CODE = "create:management";
// Código del permiso que permite ver la gestión
const READ_MANAGEMENT_CODE = "read:management";

export default async function ManagementPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const sort = (params.sort || "name") as "code" | "name" | "created_at";
  const order = (params.order || "asc") as "asc" | "desc";

  // --- Obtener permisos del usuario ---
  const user = await getUserWithPermissions();
  const userPermissionCodes = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canCreateInventoryLocation = userPermissionCodes.includes(
    CREATE_INVENTORY_LOCATION_CODE,
  );

  const canReadManagement = userPermissionCodes.includes(READ_MANAGEMENT_CODE);

  // Obtener datos de almacenes
  const warehousesData = await getInventoryLocations(
    page,
    10,
    search,
    sort,
    order,
  );

    return (
        <div>
            {/* Back */}
            <div className="mb-6">
                <Link
                    href="/dashboard/inventarios"
                    className="inline-flex items-center text-white hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                        Almacenes
                    </h1>

                    {canCreateInventoryLocation && (
                        <Link href="/dashboard/inventarios/almacenes/registrar">
                            <button
                                className="
                                    inline-flex items-center
                                    px-3 md:px-6 py-2
                                    bg-yellow-500 hover:bg-yellow-400
                                    text-gray-900 font-medium
                                    rounded-lg
                                    transition duration-300 ease-in-out
                                    transform hover:scale-105
                                    hover:shadow-lg hover:shadow-yellow-400/20
                                "
                            >
                                <Plus className="w-5 h-5 md:mr-2" />
                                <span className="hidden md:inline">Nuevo Almacén</span>
                            </button>
                        </Link>
                    )}
                </div>

                {/* Content */}
                {canReadManagement ? (
                    <WarehouseTable
                        initialData={warehousesData}
                        userPermissions={userPermissionCodes}
                    />
                ) : (
                    <div className="bg-[#0A0F17] border border-red-500/30 rounded-lg p-6 text-center">
                        <p className="text-red-400 text-sm font-medium">
                            No tienes permisos para ver la gestión de almacenes.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

}
