import Link from "next/link";
import { Plus, ArrowLeft, Contact } from "lucide-react";
import { ContactList } from "@/components/contacts/contact-list";
import { Suspense } from "react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";

function ContactListSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="h-10 bg-[#E3E2DD] rounded-lg animate-pulse border border-gray-900"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-card rounded-lg border border-input p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
              <div className="h-8 w-8 bg-muted rounded-lg ml-2" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/5" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
            <div className="mt-3 pt-3 border-t border-input">
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ContactsPage() {
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canReadContacts = permissions.includes("read:contacts");
  const canCreateContact = permissions.includes("create:contacts");
  const canUpdateContacts = permissions.includes("read:contacts");
  const canDeleteContact = permissions.includes("create:contacts");

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
        {/* Título y botones */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-custom-bg-tertiary rounded-xl border border-custom-border-secondary">
              <Contact className="w-6 h-6 text-custom-accent-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-custom-accent-tertiary">
              Contactos
            </h1>
          </div>

          <div className="flex gap-2 sm:gap-3">
            {canCreateContact && (
              <Link
                href="/dashboard/contacts-parent/contacts/create"
                className="inline-flex items-center px-3 md:px-6 py-2 bg-button-primary hover:bg-button-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-button-primary/30"
              >
                <Plus className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Nuevo Contacto</span>
                <span className="md:hidden">Crear</span>
              </Link>
            )}
          </div>
        </div>

        {/* Lista de contactos */}
        {canReadContacts ? (
          <Suspense fallback={<ContactListSkeleton />}>
            <div className="bg-custom-bg-tertiary rounded-lg border py-6 px-4">
              <ContactList userPermissions={permissions} />
            </div>
          </Suspense>
        ) : (
          <div className="bg-custom-bg-tertiary rounded-lg border p-6 text-center text-red-400">
            No tienes permisos para ver los contactos.
          </div>
        )}
      </div>
    </div>
  );
}
