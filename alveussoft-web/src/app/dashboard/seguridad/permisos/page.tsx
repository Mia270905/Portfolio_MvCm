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

  const data = await getPermissions(page, 50, search, sort, order, moduleId);
  const modules = await getModulesHierarchy();

  // --- Obtener permisos del usuario ---
  const user = await getUserWithPermissions();
  const userPermissionCodes = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canCreatePermission = userPermissionCodes.includes(
    CREATE_PERMISSION_CODE
  );

   return (
    <div className="min-h-screen bg-custom-bg-primary">
      <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad"
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-custom-text-primary">Permisos</h1>

          {canCreatePermission && (
            <Link
              href="/dashboard/seguridad/permisos/crear"
              className="inline-flex items-center px-3 md:px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-custom-bg-primary font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-custom-accent-border disabled:transform-none disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Permiso</span>
            </Link>
          )}
        </div>

        {user && userPermissionCodes.includes("read:permissions") ? (
          <Suspense fallback={<div className="text-custom-text-primary">Cargando permisos...</div>}>
            <PermissionsTable
              initialData={data}
              modules={modules}
              userPermissions={userPermissionCodes}
            />
          </Suspense>
        ) : (
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-red-400">
            No tienes permisos para ver la tabla de permisos.
          </div>
        )}
      </div>
    </div>
  );
}