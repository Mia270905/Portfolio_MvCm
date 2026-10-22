import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { getPermissions } from "@/lib/actions/permission.actions";
import { getModulesHierarchy } from "@/lib/actions/module.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import PermissionsTable from "@/components/dashboard/permisos/permissions-table";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
    module?: string;
  }>;
};

// Código del permiso que permite crear permisos
const CREATE_PERMISSION_CODE = "create:permissions";

export default async function PermissionsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const sort = (params.sort || "name") as
    | "code"
    | "name"
    | "description"
    | "active";
  const order = (params.order || "asc") as "asc" | "desc";
  const moduleId = params.module || "";

  const data = await getPermissions(page, 10, search, sort, order, moduleId);
  const modules = await getModulesHierarchy();

  // --- Obtener permisos del usuario ---
  const user = await getUserWithPermissions();
  const userPermissionCodes = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canCreatePermission = userPermissionCodes.includes(CREATE_PERMISSION_CODE);

  return (
    <div >
      <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad"
          className="inline-flex items-center text-yellow-800 hover:text-yellow-600 p-2 hover:bg-yellow-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Permisos</h1>

          {canCreatePermission && (
            <Link
              href="/dashboard/seguridad/permisos/crear"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Permiso</span>
              <span className="md:hidden">Crear</span>
            </Link>
          )}
        </div>

        {user && userPermissionCodes.includes("read:permissions") ? (
          <Suspense fallback={<div className="text-gray-700">Cargando permisos...</div>}>
            <PermissionsTable
              initialData={data}
              modules={modules}
              userPermissions={userPermissionCodes}
            />
          </Suspense>
        ) : (
          <div className="bg-white rounded-lg border border-gray-300 p-6 text-center text-red-500">
            No tienes permisos para ver la tabla de permisos.
          </div>
        )}
      </div>
    </div>
  );
}
