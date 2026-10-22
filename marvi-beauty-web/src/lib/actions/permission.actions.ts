'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { type NewPermissionPayload, type PermissionsResponse } from '@/lib/definitions'
import { getCurrentUser } from './user.actions'

export async function createPermission(data: NewPermissionPayload) {
  const supabase = await createClient()

  try {
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('code')
      .eq('id', data.module_id)
      .is('deleted_at', null)
      .single()

    if (moduleError || !module) {
      return {
        success: false,
        field: 'module_id',
        message: 'El módulo seleccionado no existe'
      }
    }

    const fullCode = `${data.code_prefix}:${module.code}`

    const { data: existingPermission } = await supabase
      .from('permissions')
      .select('id')
      .eq('code', fullCode)
      .is('deleted_at', null)
      .single()

    if (existingPermission) {
      return {
        success: false,
        field: 'code_prefix',
        message: `El permiso "${fullCode}" ya existe`
      }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase
      .from('permissions')
      .insert({
        code: fullCode,
        name: data.name,
        description: data.description,
        active: data.active,
        module_id: data.module_id,
        created_at: new Date(),
        created_by: user?.id,
        updated_by: user?.id,
      })

    if (insertError) {
      console.error('Error al crear permiso:', insertError)
      return {
        success: false,
        field: 'general',
        message: 'Error al crear el permiso'
      }
    }

    revalidatePath('/dashboard/permisos')

    return {
      success: true,
      message: 'Permiso creado exitosamente'
    }
  } catch (error) {
    console.error('Error inesperado al crear permiso:', error)
    return {
      success: false,
      field: 'general',
      message: 'Error inesperado al crear el permiso'
    }
  }
}

export async function getPermissions(
  page: number = 1,
  pageSize: number = 10,
  search: string = '',
  sortBy: 'code' | 'name' | 'description' | 'active' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  moduleId: string = ''
): Promise<PermissionsResponse> {
  const supabase = await createClient();
 
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  let query = supabase
    .from('permissions')
    .select('id, code, name, description, active, module_id', { count: 'exact' })
    .is('deleted_at', null)
    .order(sortBy, { ascending: sortOrder === 'asc' });
  
  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%, code.ilike.%${search}%, description.ilike.%${search}%`);
  }
  
  if (moduleId.trim()) {
    query = query.eq('module_id', moduleId);
  }
  
  query = query.range(from, to);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching permissions:', error);
    throw new Error('Error al cargar permisos');
  }
  
  const totalPages = count ? Math.ceil(count / pageSize) : 0;
  
  return {
    permissions: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages
  };
}

export async function getOnePermission(permissionId: string): Promise<any> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('permissions')
    .select(`*`)
    .eq("id", permissionId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return {}
  }

  return data
}

export async function updatePermission(id: string, data: NewPermissionPayload) {
  const supabase = await createClient()
  try {
    const { data: existingPermission, error: permissionError } = await supabase
      .from('permissions')
      .select('id, code')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (permissionError || !existingPermission) {
      return {
        success: false,
        field: 'general',
        message: 'El permiso no existe'
      }
    }

    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('code')
      .eq('id', data.module_id)
      .is('deleted_at', null)
      .single()

    if (moduleError || !module) {
      return {
        success: false,
        field: 'module_id',
        message: 'El módulo seleccionado no existe'
      }
    }

    const fullCode = `${data.code_prefix}:${module.code}`

    const { data: duplicatePermission } = await supabase
      .from('permissions')
      .select('id')
      .eq('code', fullCode)
      .neq('id', id)
      .is('deleted_at', null)
      .maybeSingle()

    if (duplicatePermission) {
      return {
        success: false,
        field: 'code_prefix',
        message: `El permiso "${fullCode}" ya existe`
      }
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error: updateError } = await supabase
      .from('permissions')
      .update({
        code: fullCode,
        name: data.name,
        description: data.description,
        active: data.active,
        module_id: data.module_id,
        updated_at: new Date(),
        updated_by: user?.id,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error al actualizar permiso:', updateError)
      return {
        success: false,
        field: 'general',
        message: 'Error al actualizar el permiso'
      }
    }

    revalidatePath('/dashboard/permisos')
    return {
      success: true,
      message: 'Permiso actualizado exitosamente'
    }
  } catch (error) {
    console.error('Error inesperado al actualizar permiso:', error)
    return {
      success: false,
      field: 'general',
      message: 'Error inesperado al actualizar el permiso'
    }
  }
}
export async function deletePermission(
  permissionId: string,
  confirmationCode: string
): Promise<{ success: true } | { success: false; message: string }>{
  const supabase = await createClient()
  const currentUser = await getCurrentUser();

  const {data:permissionData,error:fetchError} = await supabase.from('permissions').select('code, module_id').eq('id',permissionId).is('deleted_at',null).single();

  if(fetchError || !permissionData){
    return  {
      success: false,
      message: 'No se encontró el permiso.'
    }
  }

    const { error } = await supabase
    .from('permissions')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: currentUser?.data?.user?.id,
      active: false
    })
    .eq('id', permissionId)
 
  if (error) {
    console.error('Error deleting permission:', error)
    return {
      success: false,
      message: 'No se pudo eliminar el permiso. Intente de nuevo.'
    }
  }
 
  revalidatePath('/dashboard/permisos')
  return { success: true }

}
