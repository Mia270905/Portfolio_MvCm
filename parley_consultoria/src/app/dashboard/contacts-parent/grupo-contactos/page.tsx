import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { ContactGroupListSkeleton } from "@/components/dashboard/grupo-de-contactos/contact-group-list-skeleton";
import { ContactGroupList } from "@/components/dashboard/grupo-de-contactos/contact-group-list";

export default async function ContactGroupsPage() {
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canReadContacGroups = permissions.includes("read:contact-group");
  const canCreateConctactGroup = permissions.includes("create:contact-group");

  return (
    <div>
      {/* Volver */}
      <div className="mb-6">
        <Link
          href="/dashboard/contacts-parent"
          className="
            inline-flex items-center
            text-[#B0883F] 
            hover:text-[#FFD95A] 
            p-2 
            hover:bg-[#FFF5D8] 
            rounded-lg 
            transition-colors 
            whitespace-nowrap
          "
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título y botón */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#B0883F] whitespace-nowrap">
            Grupos de contactos
          </h1>

          {canCreateConctactGroup && (
            <Link
              href="/dashboard/contacts-parent/grupo-contactos/crear"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto">
              <Plus className="w-5 h-5 md:mr-2" />
              Crear Grupo de Contactos
            </Link>
          )}
        </div>

        {/* Lista de grupos de contactos */}
        {canReadContacGroups ? (
          <Suspense fallback={<ContactGroupListSkeleton />}>
            <ContactGroupList userPermissions={permissions} />
          </Suspense>
        ) : (
          <div className="bg-[#FFF5D8] rounded-lg border border-[#FFD95A] p-6 text-center text-[#B0883F] whitespace-nowrap">
            No tienes permisos para ver los grupos de contactos.
          </div>
        )}
      </div>
    </div>
  );
}
