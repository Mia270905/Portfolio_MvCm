import { Suspense } from 'react'
import { getUsers, getAllActiveProfiles, getUserWithPermissions } from '@/lib/actions/user.actions'
import UsersTable from '@/components/dashboard/usuarios/users-table'
import { ArrowLeft } from 'lucide-react'
import { InviteUserModal } from '@/components/admin/invite-user-modal'

type PageProps = {
  searchParams: Promise<{
    page?: string
    search?: string
    profile?: string 
    status?: string 
    sort?: string
    order?: string
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const profile = params.profile || '';
  const status = params.status || '';
  const sort = (params.sort || 'full_name') as 'email' | 'full_name' | 'active';
  const order = (params.order || 'asc') as 'asc' | 'desc';
  
  const data = await getUsers(page, 10, search, profile, status, sort, order);
  // Obtener perfiles para el filtro
  const allProfiles = await getAllActiveProfiles();

  // Obtener permisos del usuario
    const user = await getUserWithPermissions();
    const permissions = Array.isArray(user?.permissions)
      ? user.permissions.map((p: any) => p.code)
      : [];
  
    // Permisos específicos para invitar
    const canInvite = permissions.includes("invite:users");

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      <div className="mb-6 p-4">
        <a 
          href="/dashboard/seguridad" 
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-custom-text-primary">Usuarios</h1>
          {canInvite && <InviteUserModal />}
        </div>

        <Suspense fallback={<div></div>}>
          {/* Pasar allProfiles a la tabla */}
          <UsersTable initialData={data} allProfiles={allProfiles} />
        </Suspense>
      </div>
    </div>
  )
}