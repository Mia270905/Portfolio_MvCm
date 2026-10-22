import Link from "next/link"
import { Plus, ArrowLeft, Contact } from "lucide-react"
import { ContactList } from "@/components/contacts/contact-list"
import { Suspense } from "react"
import { getUserWithPermissions } from "@/lib/actions/user.actions"

function ContactListSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 bg-[#F7F5EF]">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="h-10 bg-[#EDE9DF] rounded-lg animate-pulse border border-[#E5E1D8]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-white rounded-lg border border-[#E5E1D8] p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-[#E5E1D8] rounded w-3/4" />
                <div className="h-3 bg-[#E5E1D8] rounded w-1/2" />
                <div className="h-3 bg-[#E5E1D8] rounded w-2/3" />
              </div>
              <div className="h-8 w-8 bg-[#E5E1D8] rounded-lg ml-2" />
            </div>

            <div className="space-y-2">
              <div className="h-4 bg-[#E5E1D8] rounded w-full" />
              <div className="h-4 bg-[#E5E1D8] rounded w-4/5" />
              <div className="h-4 bg-[#E5E1D8] rounded w-3/4" />
            </div>

            <div className="mt-3 pt-3 border-t border-[#E5E1D8]">
              <div className="h-3 bg-[#E5E1D8] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


export default async function ContactsPage() {
  const user = await getUserWithPermissions()
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : []

  const canReadContacts = permissions.includes("read:contacts")
  const canCreateContact = permissions.includes("create:contacts")

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Volver */}
      <div className="mb-6 py-4">
        <Link
          href="/dashboard/contacts-parent"
          className="inline-flex items-center text-gray-600 hover:text-amber-700 p-2 hover:bg-amber-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Contact className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Contactos
            </h1>
          </div>

          {canCreateContact && (
            <Link
              href="/dashboard/contacts-parent/contacts/create"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Nuevo Contacto</span>
              <span className="md:hidden">Crear</span>
            </Link>
          )}
        </div>

        {/* Lista */}
        {canReadContacts ? (
          <Suspense fallback={<ContactListSkeleton />}>
            <div className="bg-white rounded-xl border border-[#E5E1D8] py-6 px-4">
              <ContactList userPermissions={permissions} />
            </div>
          </Suspense>
        ) : (
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center text-red-500">
            No tienes permisos para ver los contactos.
          </div>
        )}
      </div>
    </div>
  )
}
