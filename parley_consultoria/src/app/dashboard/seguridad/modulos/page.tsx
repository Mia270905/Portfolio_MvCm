import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { getModulesHierarchy } from "@/lib/actions/module.actions";
import { ModuleList } from "@/components/dashboard/modulos/module-list";
import { ModuleListSkeleton } from "@/components/dashboard/modulos/module-skeleton";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { Suspense } from "react";

export default async function Page() {
  // Trae jerarquía de módulos
  const modules = await getModulesHierarchy(false);

  // Trae los permisos del usuario autenticado
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canReadModules = permissions.includes("read:modules");
  const canCreateModule = permissions.includes("create:modules");

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

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {/* Título y botón crear */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-yellow-800">Módulos</h1>

          {canCreateModule && (
            <Link
              href="/dashboard/seguridad/modulos/crear"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Módulo</span>
              <span className="md:hidden">Crear</span>
            </Link>
          )}
        </div>

        {/* Lista de módulos */}
        {canReadModules ? (
          <Suspense fallback={<ModuleListSkeleton />}>
            <ModuleList modules={modules} userPermissions={permissions} />
          </Suspense>
        ) : (
          <div className="bg-white rounded-lg border border-yellow-200 p-6 text-center text-yellow-800">
            No tienes permisos para ver los módulos.
          </div>
        )}
      </div>
    </div>
  );
}
