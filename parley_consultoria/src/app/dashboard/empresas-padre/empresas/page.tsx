import Link from "next/link"
import { Plus, ArrowLeft, Globe } from "lucide-react"
import { CompanyList } from "@/components/dashboard/empresas/company-list"
import { Suspense } from "react"
import { getUserWithPermissions } from "@/lib/actions/user.actions"

/* ---------- Skeleton ---------- */
function EmpresasListSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="h-10 bg-gray-100 rounded-lg border border-gray-200 animate-pulse" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function EmpresasPage() {
  const user = await getUserWithPermissions()
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : []

  const canReadEmpresas = permissions.includes("read:empresas")
  const canCreateEmpresas = permissions.includes("create:empresas")

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Volver */}
      <div className="py-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-700 p-2 hover:bg-[#FAF7F2] rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {/* Header */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Globe className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
                Empresas
              </h1>
              <p className="text-sm text-gray-500">
                Gestión de empresas registradas
              </p>
            </div>
          </div>

          {canCreateEmpresas && (
            <Link
              href="/dashboard/empresas-padre/empresas/crear"
              className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              Nueva Empresa
            </Link>
          )}
        </div>

        {/* Contenido */}
        {canReadEmpresas ? (
          <Suspense fallback={<EmpresasListSkeleton />}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-6">
              <CompanyList userPermissions={permissions} />
            </div>
          </Suspense>
        ) : (
          <div className="bg-white rounded-xl border border-red-200 p-6 text-center text-red-500 shadow-sm">
            No tienes permisos para ver las empresas.
          </div>
        )}
      </div>
    </div>
  )
}
