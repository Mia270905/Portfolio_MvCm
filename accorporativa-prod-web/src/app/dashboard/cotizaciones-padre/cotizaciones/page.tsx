import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { Plus } from "lucide-react";
import { QuotationList } from "@/components/dashboard/quotation/quotation-list";

export default async function QuotationsPage() {
  // Trae los permisos del usuario autenticado
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  // Usa los permisos correctos para cotizaciones
  const canReadQuotations = permissions.includes("read:quotation");
  const canCreateQuotations = permissions.includes("create:quotation");

  return (
    <div>
      {/* Volver */}
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-custom-text-tertiary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-primary/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título y botón */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-custom-text-primary mb-2">
              Cotizaciones
            </h1>
            <p className="text-custom-text-tertiary">
              Gestiona y crea nuevas cotizaciones
            </p>
          </div>
          
          {canCreateQuotations && (
            <Link
              href="/dashboard/cotizaciones-padre/cotizaciones/crear"
              className="inline-flex items-center px-3 md:px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-medium rounded-lg transition duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:shadow-yellow-400/20"
            >
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Cotización</span>
              <span className="md:hidden">Crear</span>
            </Link>
          )}
        </div>

        {/* Información de permisos */}
        {!canReadQuotations && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-300 text-sm">
              <strong>Acceso restringido:</strong> No tienes permisos para ver el módulo de cotizaciones.
              Contacta al administrador para obtener los permisos necesarios.
            </p>
          </div>
        )}

        {/* Lista de cotizaciones */}
        {canReadQuotations ? (
          <QuotationList userPermissions={permissions} />
        ) : (
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-custom-text-muted" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-custom-text-primary mb-2">
              Acceso restringido
            </h3>
            <p className="text-custom-text-tertiary mb-4">
              No tienes permisos para ver las cotizaciones
            </p>
          </div>
        )}
      </div>
    </div>
  );
}