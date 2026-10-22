import Link from "next/link"
import { Plus, ArrowLeft, Globe } from "lucide-react"
import { PlatformList } from "@/components/dashboard/platforms/platform-list"
import { Suspense } from "react"
import { getUserWithPermissions } from "@/lib/actions/user.actions"

function PlatformListSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <div className="h-10 bg-[#0A0F17] rounded-lg animate-pulse"></div>
        </div>
      </div>

      <div className="space-y-3">
        {[...Array(6)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse bg-[#070B14] rounded-lg border border-gray-800 p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-[#0A0F17] rounded w-1/4" />
                  <div className="h-5 bg-[#0A0F17] rounded w-1/6" />
                </div>
                <div className="h-3 bg-[#0A0F17] rounded w-1/2" />
                <div className="h-3 bg-[#0A0F17] rounded w-2/3" />
              </div>
              <div className="h-8 w-8 bg-[#0A0F17] rounded-lg ml-2" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-[#0A0F17] rounded w-full" />
              <div className="h-4 bg-[#0A0F17] rounded w-4/5" />
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="h-3 bg-[#0A0F17] rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function PlatformsPage() {
  const user = await getUserWithPermissions()
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : []

  const canReadPlatforms = permissions.includes("read:platforms")
  const canCreatePlatform = permissions.includes("create:platforms")
  const canUpdatePlatforms = permissions.includes("update:platforms")
  const canDeletePlatform = permissions.includes("delete:platforms")

  return (
    <div className="min-h-screen bg-[#04060B]">
      {/* Volver */}
      <div className="mb-6 bg-[#04060B] py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        {/* Título y botones */}
        <div className="mb-6 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-400/10 rounded-lg">
              <Globe className="w-6 h-6 text-yellow-400" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Plataformas
            </h1>
          </div>

          <div className="flex gap-2 sm:gap-3">
            {canCreatePlatform && (
              <Link
                href="/dashboard/platforms-parent/platforms/create"
                className="inline-flex items-center px-3 md:px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/20"
              >
                <Plus className="w-5 h-5 md:mr-2" />
                <span className="hidden md:inline">Nueva Plataforma</span>
                <span className="md:hidden">Crear</span>
              </Link>
            )}
          </div>
        </div>

        {/* Lista de plataformas */}
        {canReadPlatforms ? (
          <Suspense fallback={<PlatformListSkeleton />}>
            <div className="bg-[#070B14] rounded-lg border border-gray-800 py-6 px-4">
              <PlatformList userPermissions={permissions} />
            </div>
          </Suspense>
        ) : (
          <div className="bg-[#070B14] rounded-lg border border-gray-800 p-6 text-center text-red-400">
            No tienes permisos para ver las plataformas.
          </div>
        )}
      </div>
    </div>
  )
}