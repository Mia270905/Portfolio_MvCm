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
    <div className="min-h-screen bg-custom-bg-primary">
      <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad"
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {/* Título y botón crear */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-custom-text-primary">Módulos</h1>

          {canCreateModule && (
            <Link
              href="/dashboard/seguridad/modulos/crear"
              className="inline-flex items-center px-3 md:px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-custom-bg-primary font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-custom-accent-border"
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
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-red-400">
            No tienes permisos para ver los módulos.
          </div>
        )}
      </div>
    </div>
  );
}