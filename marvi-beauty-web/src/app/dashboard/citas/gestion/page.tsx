import Link from "next/link";
import { Plus, ArrowLeft, Calendar } from "lucide-react";
import { AppointmentList } from "@/components/dashboard/citas/appointment-list";
import { Suspense } from "react";
import { getUserWithPermissions, fetchUserProfile } from "@/lib/actions/user.actions";
import ShareButton from "@/components/share-button";
import { FloatingActionButton } from "@/components/dashboard/citas/floating-action-button";

// Componente Skeleton para citas
function AppointmentListSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Skeleton de header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-custom-bg-hover rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-custom-bg-hover rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-custom-bg-hover rounded animate-pulse"></div>
      </div>

      {/* Skeleton de barra de búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <div className="h-10 bg-custom-bg-secondary rounded-lg animate-pulse"></div>
        </div>
        <div className="h-10 w-24 bg-custom-bg-hover rounded animate-pulse"></div>
      </div>

      {/* Skeleton de varias citas */}
      {[...Array(3)].map((_, idx) => (
        <div
          key={idx}
          className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4"
        >
          <div className="flex items-start gap-4 flex-1">
            {/* Icono */}
            <div className="h-16 w-16 bg-custom-bg-hover rounded-lg flex-shrink-0" />
            
            {/* Contenido */}
            <div className="flex-1 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <div className="h-6 w-32 bg-custom-bg-hover rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-custom-bg-hover rounded"></div>
                <div className="h-4 w-36 bg-custom-bg-hover rounded"></div>
              </div>
              <div className="flex gap-4">
                <div className="h-3 w-20 bg-custom-bg-hover rounded"></div>
                <div className="h-3 w-24 bg-custom-bg-hover rounded"></div>
              </div>
            </div>
          </div>

          {/* Botón de acciones */}
          <div className="h-8 w-8 bg-custom-bg-hover rounded flex-shrink-0"></div>
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

  const shareUrl = (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <div>
      {/* Volver */}
      <div className="mb-6">
        <Link
          href="/dashboard/citas"
          className="inline-flex items-center text-custom-text-tertiary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-primary/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título y botón - EN ESCRITORIO: alineados horizontalmente, EN MÓVIL: apilados */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Título */}
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-custom-text-primary mb-2">
              Gestión de Citas
            </h1>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {canCreateAppointments && (
              <Link 
                href="/dashboard/citas/gestion/crear"
                className="group relative inline-flex items-center justify-center gap-2 rounded-md bg-custom-accent-primary px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-md transition-all duration-300 hover:bg-custom-accent-secondary hover:scale-105 hover:shadow-lg hover:shadow-custom-accent-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-accent-primary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>Crear Cita</span>
              </Link>
            )}
            
            {hasUserCode && (
              <div className="w-full sm:w-auto">
                <ShareButton 
                  shareUrl={`${shareUrl}/cliente-cita/${userCode}`}
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
          <div className="mb-6 bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-300 text-sm">
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
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-custom-bg-tertiary flex items-center justify-center">
              <Calendar className="w-8 h-8 text-custom-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-custom-text-primary mb-2">
              Acceso restringido
            </h3>
            <p className="text-custom-text-tertiary mb-4">
              No tienes permisos para ver las citas
            </p>
            <p className="text-custom-text-tertiary text-sm">
              Usa el botón flotante para crear citas o compartir tu enlace.
            </p>
            {canCreateAppointments && (
              <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
                <Link 
                  href="/dashboard/citas/gestion/crear"
                  className="group relative inline-flex items-center justify-center gap-2 rounded-md bg-custom-accent-primary px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-md transition-all duration-300 hover:bg-custom-accent-secondary hover:scale-105 hover:shadow-lg hover:shadow-custom-accent-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-accent-primary disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  <Plus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                  <span>Crear Nueva Cita</span>
                </Link>
                {hasUserCode && (
                  <div className="w-full">
                    <ShareButton 
                      shareUrl={`${shareUrl}/cliente-cita/${userCode}`}
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
      {/* Boton flotante con menú */}
      <FloatingActionButton
        canCreateAppointments={canCreateAppointments}
        hasUserCode={hasUserCode}
        shareUrl={`${shareUrl}/cliente-cita/${userCode}`}
        shareTitle="Agenda tu cita"
        shareText="¡Agenda tu cita fácilmente! Haz clic en el enlace para programar tu visita."
      />
    </div>
  );
}