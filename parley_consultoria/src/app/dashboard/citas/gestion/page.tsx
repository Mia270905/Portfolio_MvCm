import Link from "next/link";
import { Plus, ArrowLeft, Calendar } from "lucide-react";
import { AppointmentList } from "@/components/dashboard/citas/appointment-list";
import { Suspense } from "react";
import { getUserWithPermissions, fetchUserProfile } from "@/lib/actions/user.actions";
import ShareButton from "@/components/share-button";

// Componente Skeleton para citas
function AppointmentListSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Skeleton de header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-[#f5efe6] rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-[#f5efe6] rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-[#f5efe6] rounded animate-pulse"></div>
      </div>

      {/* Skeleton de barra de búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <div className="h-10 bg-[#faf8f3] rounded-lg animate-pulse"></div>
        </div>
        <div className="h-10 w-24 bg-[#f5efe6] rounded animate-pulse"></div>
      </div>

      {/* Skeleton de varias citas */}
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-lg border border-[#f5efe6] p-4"
        >
          <div className="flex items-start gap-4 flex-1">
            {/* Icono */}
            <div className="h-16 w-16 bg-[#faf8f3] rounded-lg flex-shrink-0" />
            
            {/* Contenido */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="h-6 w-32 bg-[#faf8f3] rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-[#faf8f3] rounded"></div>
                <div className="h-4 w-36 bg-[#faf8f3] rounded"></div>
              </div>
              <div className="flex gap-4">
                <div className="h-3 w-20 bg-[#faf8f3] rounded"></div>
                <div className="h-3 w-24 bg-[#faf8f3] rounded"></div>
              </div>
            </div>
          </div>

          {/* Botón de acciones */}
          <div className="h-8 w-8 bg-[#faf8f3] rounded flex-shrink-0"></div>
        </div>
      ))}
    </div>
  );
}

export default async function CitasPage() {
  // Trae los permisos del usuario autenticado
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];

  const { profile } = await fetchUserProfile();
  const userCode = profile?.user_code;
  const hasUserCode = !!userCode;

  const canReadAppointments = permissions.includes("read:appointments");
  const canCreateAppointments = permissions.includes("create:appointments");

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {/* Volver */}
      <div className="mb-6 p-4 lg:p-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título y botón - EN ESCRITORIO: alineados horizontalmente, EN MÓVIL: apilados */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Título */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 mb-2">
              Gestión de Citas
            </h1>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {canCreateAppointments && (
              <Link 
                href="/dashboard/citas/gestion/crear"
                className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>Crear Cita</span>
              </Link>
            )}
            
            {hasUserCode && (
              <div className="w-full sm:w-auto">
                <ShareButton 
                  shareUrl={`/cliente-cita/${userCode}`}
                  shareTitle="Agenda tu cita"
                  shareText="¡Agenda tu cita fácilmente! Haz clic en el enlace para programar tu visita."
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Información de permisos */}
        {!canReadAppointments && canCreateAppointments && (
          <div className="mb-6 bg-[#f5efe6] border border-[#e6dcc9] rounded-lg p-4">
            <p className="text-neutral-700 text-sm">
              <strong>Nota:</strong> Puedes crear citas pero no ver la lista completa. 
              Contacta al administrador para obtener permisos de lectura.
            </p>
          </div>
        )}

        {/* Lista de citas con control de permisos */}
        {canReadAppointments ? (
          <Suspense fallback={<AppointmentListSkeleton />}>
            <AppointmentList userPermissions={permissions} />
          </Suspense>
        ) : (
          <div className="bg-white rounded-xl border border-[#f5efe6] p-8 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#faf8f3] flex items-center justify-center">
              <Calendar className="w-8 h-8 text-[#c6a365]" />
            </div>
            <h3 className="text-lg font-serif font-medium text-neutral-900 mb-2">
              Acceso restringido
            </h3>
            <p className="text-neutral-600 mb-6">
              No tienes permisos para ver las citas
            </p>
            {canCreateAppointments && (
              <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                <Link 
                  href="/dashboard/citas/gestion/crear"
                  className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full"
                >
                  <Plus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span>Crear Nueva Cita</span>
                </Link>
                {hasUserCode && (
                  <div className="w-full">
                    <ShareButton 
                      shareUrl={`/cliente-cita/${userCode}`}
                      shareTitle="Agenda tu cita"
                      shareText="¡Agenda tu cita fácilmente! Haz clic en el enlace para programar tu visita."
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}