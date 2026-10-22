import { Suspense } from 'react'
import { getUserWithPermissions } from '@/lib/actions/user.actions'
import { getAttendanceUsers } from '@/lib/actions/attendance.actions'
import AttendanceUsersTable from '@/components/attendance/attendance-users-table'
import { ArrowLeft } from 'lucide-react'

type PageProps = {
  searchParams: Promise<{
    page?: string
    search?: string
    sort?: string
    order?: string
  }>
}

export default async function AttendanceUsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const sort = (params.sort || 'full_name') as string; 
  const order = (params.order || 'asc') as 'asc' | 'desc';
  
  // Obtener usuarios del checador
  const data = await getAttendanceUsers(page, 10, search, sort, order);

  // Obtener permisos del usuario
  const user = await getUserWithPermissions();
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];
  
  // Permisos específicos para usuarios del checador
  const canManageAttendanceUsers = permissions.includes("read:users-checkin");

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      <div className="mb-6 p-4">
        <a 
          href="/dashboard/checador-padre" 
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-custom-text-primary mb-2">
            Usuarios del Checador
          </h1>
          <p className="text-custom-text-tertiary">
            Registra tu entrada y salida o consulta tu historial de asistencias.
          </p>
        </div>

        {!canManageAttendanceUsers ? (
          <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 text-center text-red-400">
            No tienes permisos para administrar los usuarios del checador.
          </div>
        ) : (
          <Suspense fallback={
            <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-custom-bg-hover rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-custom-bg-hover rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          }>
            <AttendanceUsersTable initialData={data} />
          </Suspense>
        )}
      </div>
    </div>
  )
}