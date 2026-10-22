import { Suspense } from "react"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { getUserWithPermissions } from "@/lib/actions/user.actions"
import { ManualBillingContainer } from "@/components/dashboard/facturacion/manual/manual-billing-container"

export default async function ManualBillingPage() {
  // Obtener permisos del usuario
  const user = await getUserWithPermissions()
  const permissions = Array.isArray(user?.permissions) ? user.permissions.map((p: any) => p.code) : []

  // Permisos específicos para facturación
  const canCreateBilling = permissions.includes("create:manual_billing")

  return (
    <div className="min-h-screen bg-[#04060B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/facturacion"
            className="inline-flex items-center text-gray-400 hover:text-yellow-400 mb-4 p-2 hover:bg-[#0E1421] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="bg-yellow-400/10 border border-yellow-400/30 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Factura Manual</h1>
              <p className="text-gray-400 mt-1">Emite una factura manual con datos personalizados</p>
            </div>
          </div>
        </div>

        {canCreateBilling ? (
          // El div wrapper es importante aquí
          <div className="space-y-6">
            <Suspense fallback={<div className="text-gray-400 p-4">Cargando formulario...</div>}>
              <ManualBillingContainer />
            </Suspense>
          </div>
        ) : (
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4">
            <div className="text-red-400 font-medium">No tienes permiso para emitir facturas manuales</div>
            <div className="text-red-500 text-sm mt-1">Contacta al administrador para solicitar acceso</div>
          </div>
        )}
      </div>
    </div>
  )
}