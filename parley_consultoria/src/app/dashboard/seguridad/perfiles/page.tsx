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

  const data = await getProfiles(page, 10, search, sort, order);

  const user = await getUserWithPermissions();
  const userPermissionCodes = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canCreateProfile = userPermissionCodes.includes("create:profiles");
  const canReadProfiles = userPermissionCodes.includes("read:profiles");

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Botón regresar */}
        <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad"
          className="inline-flex items-center text-yellow-800 hover:text-yellow-600 p-2 hover:bg-yellow-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Perfiles</h1>

          {canCreateProfile && (
            <Link
              href="/dashboard/seguridad/perfiles/crear"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Perfil</span>
              <span className="md:hidden">Crear</span>
            </Link>
          )}
        </div>

        {/* Tabla */}
        {canReadProfiles ? (
          <Suspense
            fallback={
              <div className="text-gray-700">
                Cargando perfiles...
              </div>
            }
          >
            <ProfilesTable
              initialData={data}
              userPermissions={userPermissionCodes}
            />
          </Suspense>
        ) : (
          <div className="bg-white rounded-lg border border-custom-border-primary p-6 text-center text-red-500">
            No tienes permisos para ver los perfiles.
          </div>
        )}
      </div>
    </div>
  );
}
