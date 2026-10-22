import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { getProfiles } from "@/lib/actions/profile.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import ProfilesTable from "@/components/dashboard/perfiles/profiles-table";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    search?: string;
    sort?: string;
    order?: string;
  }>;
};

export default async function ProfilesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const sort = (params.sort || "name") as "code" | "name" | "active";
  const order = (params.order || "asc") as "asc" | "desc";

  // --- Obtener datos de la tabla ---
  const data = await getProfiles(page, 50, search, sort, order);

  // --- Obtener permisos del usuario ---
  const user = await getUserWithPermissions();
  const userPermissionCodes = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canCreateProfile = userPermissionCodes.includes("create:profiles");
  const canReadProfiles = userPermissionCodes.includes("read:profiles");

  return (
    <div className="min-h-screen bg-custom-bg-primary ">
      <div className="mb-6">
        <a
          href="/dashboard/seguridad"
          className="inline-flex items-center text-custom-text-disabled hover:text-gray-900 p-2 hover:bg-custom-accent-hover rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-custom-text-primary mb-6">Perfiles</h1>

          {canCreateProfile && (
            <Link
              href="/dashboard/seguridad/perfiles/crear"
              className="inline-flex items-center px-3 md:px-6 py-2 bg-yellow-500 hover:bg-custom-accent-secondary disabled:bg-gray-600 text-gray-900 font-medium rounded-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-custom-accent-border disabled:transform-none disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Perfil</span>
              <span className="md:hidden">Crear</span>
            </Link>
          )}
        </div>

        {/* --- Mostrar tabla solo si tiene permiso de lectura --- */}
        {canReadProfiles ? (
          <Suspense
            fallback={<div className="text-custom-text-tertiary">Cargando perfiles...</div>}
          >
            <ProfilesTable
              initialData={data}
              userPermissions={userPermissionCodes}
            />
          </Suspense>
        ) : (
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-red-400">
            No tienes permisos para ver los perfiles.
          </div>
        )}
      </div>
    </div>
  );
}
