import Link from "next/link"
import { Plus, ArrowLeft, Globe } from "lucide-react"
import { CompanyList } from "@/components/dashboard/empresas/company-list"
import { Suspense } from "react"
import { getUserWithPermissions } from "@/lib/actions/user.actions"

function EmpresasListSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="h-10 bg-white rounded-lg animate-pulse border border-gray-300"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-white rounded-lg border border-gray-300 p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-custom-bg-tertiary rounded w-3/4" />
                <div className="h-3 bg-custom-bg-tertiary rounded w-1/2" />
                <div className="h-3 bg-custom-bg-tertiary rounded w-2/3" />
              </div>
              <div className="h-8 w-8 bg-custom-bg-tertiary rounded-lg ml-2" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-full" />
              <div className="h-4 bg-custom-bg-tertiary rounded w-4/5" />
              <div className="h-4 bg-custom-bg-tertiary rounded w-3/4" />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="h-3 bg-custom-bg-tertiary rounded w-1/3" />
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
  const canUpdateEmpresas = permissions.includes("update:empresas")
  const canDeleteEmpresas = permissions.includes("delete:empresas")

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      {/* Volver */}
      <div className="mb-6 py-4">
          <Link
            href="/dashboard"
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {/* Título y botones */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400/10 rounded-lg">
              <Globe className="w-6 h-6 text-pink-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-custom-text-primary">
              Empresas
            </h1>
          </div>

          <div className="flex gap-2 sm:gap-3">
            {canCreateEmpresas && (
              <Link
                href="/dashboard/empresas-padre/empresas/crear"
                className="inline-flex items-center px-3 md:px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary text-custom-bg-primary font-medium rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-custom-accent-border disabled:transform-none disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Nueva Empresa</span>
                <span className="md:hidden">Crear</span>
              </Link>
            )}
          </div>
        </div>

        {/* Lista de empresas */}
        {canReadEmpresas ? (
          <Suspense fallback={<EmpresasListSkeleton />}>
            <div className="bg-white rounded-lg border border-gray-300 py-6 px-4">
              <CompanyList userPermissions={permissions} />
            </div>
          </Suspense>
        ) : (
          <div className="bg-white rounded-lg border border-gray-300 p-6 text-center text-red-400">
            No tienes permisos para ver las empresas.
          </div>
        )}
      </div>
    </div>
  )
}