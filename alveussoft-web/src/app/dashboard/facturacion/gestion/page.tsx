import { Suspense } from "react";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { BillingContainer } from "@/components/dashboard/facturacion/billing-container";

export default async function BillingPage() {
  // Obtener permisos del usuario
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  // Permisos específicos para facturación
  const canReadBilling = permissions.includes("read:billing_management");
  const canCreateBilling = permissions.includes("create:billing_management");

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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Facturación</h1>
              <p className="text-gray-400 mt-2">
                Gestiona las facturas de los pedidos entregados
              </p>
            </div>

            {canCreateBilling && (
              <Link
                href="/dashboard/facturacion/emitir"
                className="inline-flex items-center px-4 py-2 bg-yellow-400 text-black text-sm font-medium rounded-lg hover:bg-yellow-300 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Emitir Factura
              </Link>
            )}
          </div>
        </div>

        {canReadBilling ? (
          <Suspense
            fallback={
              <div className="text-gray-400 p-4">Cargando facturas...</div>
            }
          >
            <BillingContainer />
          </Suspense>
        ) : (
          <div className="text-red-400 p-4 border border-red-900/50 bg-red-950/20 rounded-lg">
            No tienes permiso para ver la gestión de facturación
          </div>
        )}
      </div>
    </div>
  );
}