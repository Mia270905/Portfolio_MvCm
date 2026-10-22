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
    sort?: string
    order?: string
    status?: string 
  }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || '';
  const profile = params.profile || '';
  const status = params.status || ''; // <-- Capturamos el status
  const sort = (params.sort || 'full_name') as 'email' | 'full_name' | 'active';
  const order = (params.order || 'asc') as 'asc' | 'desc';
  
  // Ahora enviamos el "status" como el último argumento
  const data = await getUsers(page, 10, search, profile, sort, order, status);
  
  const allProfiles = await getAllActiveProfiles();
  const user = await getUserWithPermissions();
  
  const permissions = Array.isArray(user?.permissions)
    ? user.permissions.map((p: any) => p.code)
    : [];
  
  const canInvite = permissions.includes("invite:users");

  return (
    <div className="min-h-screen bg-[#F5F1E8] pb-8">
      {/* Botón regresar */}
     <div className="mb-6 p-4">
        <a
          href="/dashboard/seguridad"
          className="inline-flex items-center text-yellow-800 hover:text-yellow-600 p-2 hover:bg-yellow-100 rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
          {canInvite && <InviteUserModal />}
        </div>

        {/* Tabla */}
        <Suspense fallback={<div className="text-gray-500">Cargando usuarios...</div>}>
          <UsersTable initialData={data} allProfiles={allProfiles} />
        </Suspense>
      </div>
    </div>
  )
}
