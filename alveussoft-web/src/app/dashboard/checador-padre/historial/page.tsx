import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminAttendanceHistory from "@/components/attendance/admin-attendance-list";
import { getUserWithPermissions } from "@/lib/actions/user.actions";

export default async function AdminAttendanceHistoryPage() {
  // Trae los permisos del usuario autenticado
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const canViewAllAttendance = permissions.includes("read:historial")

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
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-custom-text-primary mb-2">
            Historial del checador
          </h1>
          <p className="text-custom-text-tertiary">
            Visualiza todos los registros de entrada y salida del sistema
          </p>
        </div>

        {/* Información de permisos */}
        {!canViewAllAttendance && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-300 text-sm">
              <strong>Acceso restringido:</strong> No tienes permisos para ver todos los registros de asistencia.
              Contacta al administrador para obtener los permisos necesarios.
            </p>
          </div>
        )}

        {/* Lista de historial del administrador */}
        {canViewAllAttendance ? (
          <AdminAttendanceHistory />
        ) : (
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
              <svg className="w-8 h-8 text-custom-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-custom-text-primary mb-2">
              Acceso restringido
            </h3>
            <p className="text-custom-text-tertiary mb-4">
              No tienes permisos para ver el historial completo de asistencia
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
              <Link 
                href="/checador"
                className="group relative inline-flex items-center justify-center gap-2 rounded-md bg-custom-accent-primary px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-md transition-all duration-300 hover:bg-custom-accent-secondary hover:scale-105 hover:shadow-lg hover:shadow-custom-accent-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-accent-primary"
              >
                Ver mi historial personal
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}