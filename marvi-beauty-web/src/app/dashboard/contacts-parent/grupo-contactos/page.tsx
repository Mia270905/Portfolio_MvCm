import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { CategoryList } from "@/components/dashboard/categorias/category-list";
import { Suspense } from "react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { ContactGroupListSkeleton } from "@/components/dashboard/grupo-de-contactos/contact-group-list-skeleton";
import { ContactGroupList } from "@/components/dashboard/grupo-de-contactos/contact-group-list";

export default async function ContactGroupsPage() {
  // Trae los permisos del usuario autenticado
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
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título y botón - Ahora ambos en la misma página */}
        <div className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl md:text-3xl font-bold text-custom-accent-tertiary">
            Grupos de contactos
          </h1>

          {canCreateConctactGroup && (
            <Link
              href="/dashboard/contacts-parent/grupo-contactos/crear"
                className="inline-flex items-center px-3 md:px-6 py-2 bg-button-primary hover:bg-button-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-button-primary/30"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Grupo de Contacos</span>
            </Link>
          )}
        </div>

        {/* Lista de grupos de contactos con control de permisos */}
        {canReadContacGroups ? (
          <Suspense fallback={<ContactGroupListSkeleton />}>
            <ContactGroupList userPermissions={permissions} />
          </Suspense>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">
            No tienes permisos para ver los grupos de contactos.
          </div>
        )}
      </div>
    </div>
  );
}
