'use server'
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { type NewModulePayload } from '@/lib/definitions';
import { type ModulesHierarchy } from '@/lib/definitions';
import { getCurrentUser } from './user.actions';

export async function createModule(moduleData: NewModulePayload): Promise <
  { success: true } | { success: false; field: 'code' | 'path'; message: string }
> {
  const supabase = await createClient()
  const { data, error  } = await supabase.from('modules').insert([moduleData]).select();
  
  if (error) {
    console.error('Error creating module:', error)
    
    if (error.code === '23505') {
      if (error.message.includes('modules_code_active_unique')) {
        return { 
          success: false, 
          field: 'code', 
          message: 'El código ingresado ya se encuentra registrado.' 
        }
      }
      if (error.message.includes('modules_path_active_unique')) {
        return { 
          success: false, 
          field: 'path', 
          message: 'La ruta especificada ya está en uso.' 
        }
      }
    }
    
    return { 
      success: false, 
      field: 'code', 
      message: 'No se pudo crear el módulo. Intente de nuevo.' 
    }
  }

  
  try{

    const { data: { user } } = await supabase.auth.getUser()
    
    const {error} = await supabase
    .from('permissions')
    .insert({
      code: `menu:${moduleData.code}`,
      name: 'Menu',
      description: 'Permite visualizar el menu',
      active: true,
      module_id: data[0].id,
      created_at: new Date(),
      created_by: user?.id,
      updated_by: user?.id,
    }).select();
  } catch(error){
        return { 
          success: false, 
          field: 'path',
          message: 'No se pudo generar el permiso correspondiente' 
        }
  }
  

  revalidatePath('/dashboard/seguridad/modulos')
  return { success: true }
}

export async function getParentModules(currentParentId?: string): Promise<{id: string, name: string, icon: string, path: string}[]> {
  const supabase = await createClient();

  let query = supabase
    .from('modules')
    .select('id, name, icon, path')
    .is('parent_module_id', null)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (currentParentId) {
    query = query.or(`active.eq.true,id.eq.${currentParentId}`);
  } else {
    query = query.eq('active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching parent modules:', error);
    return [];
  }

  return data;
}


export async function getModulesHierarchy(activeOnly: boolean = true): Promise<ModulesHierarchy> {
  const supabase = await createClient()
  
  let query = supabase
  .from('modules')
  .select('id, code, name, path, description, icon, parent_module_id, active, sidebar_number')
  .is('deleted_at', null)
  .order('sidebar_number', { ascending: true })
  .order('name', { ascending: true });

  
  if (activeOnly) {
    query = query.eq('active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching modules hierarchy:', error)
    return []
  }

  if (!data) return []

  const parentModules = data.filter(m => m.parent_module_id === null)
  const hierarchy = parentModules.map(parent => ({
    ...parent,
    children: data.filter(m => m.parent_module_id === parent.id)
  }))

  return hierarchy
}

export async function getOneModule(moduleId: string): Promise<any> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('modules')
    .select(`
      *,
      children:modules!parent_module_id(id)
    `)
    .eq("id", moduleId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return {}
  }

  return data
}

export async function getModulesWithPermissions(
  options?: { filterByUserPermissions?: string[], hasFullAccess?: boolean }
): Promise<any> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modules")
    .select(`
      id,
      name,
      code,
      parent_module_id,
      active,
      permissions:permissions!inner(
        id,
        code,
        name,
        description,
        active
      ),
      children:modules!parent_module_id(
        id,
        name,
        code,
        active,
        permissions:permissions!inner(
          id,
          code,
          name,
          description,
          active
        )
      )
    `)
    .eq("active", true)
    .is("deleted_at", null)
    .eq("permissions.active", true)
    .is("permissions.deleted_at", null)
    .order("id", { ascending: true });

  if (error) throw error;
  
  // Si el usuario tiene acceso completo (permission-all:profiles), retornar TODO
  if (options?.hasFullAccess) {
    return data;
  }
  
  // Si se solicita filtrar por permisos de usuario
  if (options?.filterByUserPermissions && options.filterByUserPermissions.length > 0) {
    
    // Función para filtrar módulos recursivamente
    const filterModulesByUserPermissions = (modules: any[]): any[] => {
      const filterModule = (module: any): any | null => {
        // Filtrar permisos visibles para este módulo
        const visiblePermissions = module.permissions?.filter((permission: any) => 
          options.filterByUserPermissions!.includes(permission.code)
        ) || [];
        
        // Procesar hijos recursivamente
        const filteredChildren = (module.children || [])
          .map(filterModule)
          .filter(Boolean);
        
        // Determinar si el módulo debe mostrarse
        const hasVisiblePermissions = visiblePermissions.length > 0;
        const hasVisibleChildren = filteredChildren.length > 0;
        
        if (hasVisiblePermissions || hasVisibleChildren) {
          return {
            ...module,
            permissions: visiblePermissions,
            children: filteredChildren
          };
        }
        
        return null;
      };
      
      // Filtrar solo módulos padre
      const parentModules = modules.filter(m => m.parent_module_id === null);
      
      const filtered = parentModules
        .map(filterModule)
        .filter(Boolean);
      
      return filtered;
    };
    
    return filterModulesByUserPermissions(data);
  }
  
  return data;
}

export async function getModulesWithPermissionsFiltered(userPermissions?: string[]): Promise<any> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("modules")
    .select(`
      id,
      name,
      code,
      parent_module_id,
      active,
      permissions:permissions!inner(
        id,
        code,
        name,
        description,
        active
      ),
      children:modules!parent_module_id(
        id,
        name,
        code,
        active,
        permissions:permissions!inner(
          id,
          code,
          name,
          description,
          active
        )
      )
    `)
    .eq("active", true)
    .is("deleted_at", null)
    .eq("permissions.active", true)
    .is("permissions.deleted_at", null)
    .order("id", { ascending: true });

  if (error) throw error;
  
  // Si no hay permisos de usuario o el usuario tiene acceso completo, retornar todo
  if (!userPermissions || userPermissions.length === 0 || userPermissions.includes('*')) {
    return data;
  }
  
  // Filtrar módulos por permisos del usuario
  return filterModulesByUserPermissions(data, userPermissions);
}

// Función auxiliar para filtrar módulos
function filterModulesByUserPermissions(modules: any[], userPermissions: string[]): any[] {
  const filterModule = (module: any): any | null => {
    // Filtrar permisos visibles para este módulo
    const visiblePermissions = module.permissions?.filter((permission: any) => 
      userPermissions.includes(permission.code)
    ) || [];
    
    // Procesar hijos recursivamente
    const filteredChildren = (module.children || [])
      .map(filterModule)
      .filter(Boolean); // Eliminar nulls
    
    // Determinar si el módulo debe mostrarse
    const hasVisiblePermissions = visiblePermissions.length > 0;
    const hasVisibleChildren = filteredChildren.length > 0;
    
    // Si el módulo tiene permisos visibles O hijos visibles, incluirlo
    if (hasVisiblePermissions || hasVisibleChildren) {
      return {
        ...module,
        permissions: visiblePermissions,
        children: filteredChildren
      };
    }
    
    return null; // Módulo no visible
  };
  
  // Filtrar solo módulos padre (parent_module_id === null)
  const parentModules = modules.filter(m => m.parent_module_id === null);
  
  return parentModules
    .map(filterModule)
    .filter(Boolean); // Solo módulos visibles
}

export async function getModuleWithChildren(moduleCode: string): Promise<{
  parent: {
    id: string
    code: string
    name: string
    description: string
    icon: string
  } | null
  children: Array<{
    id: string
    code: string
    name: string
    description: string
    icon: string
    path: string
  }>
}> {
  const supabase = await createClient()

  const { data: parentData, error: parentError } = await supabase
    .from('modules')
    .select('id, code, name, description, icon')
    .eq('code', moduleCode)
    .eq('active', true)
    .is('deleted_at', null)
    .single()

  if (parentError || !parentData) {
    console.error('Error fetching parent module:', parentError)
    return { parent: null, children: [] }
  }

  const { data: childrenData, error: childrenError } = await supabase
    .from('modules')
    .select('id, code, name, description, icon, path')
    .eq('parent_module_id', parentData.id)
    .eq('active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (childrenError) {
    console.error('Error fetching children modules:', childrenError)
    return { parent: parentData, children: [] }
  }

  return {
    parent: parentData,
    children: childrenData || []
  }
}

export async function updateModule(
  moduleId: string,
  moduleData: NewModulePayload
): Promise<{ success: true } | { success: false; field: 'code' | 'path'; message: string }> {
  const supabase = await createClient()
  const currentUser = await getCurrentUser();

  // 1. Extraemos solo lo que la tabla 'modules' realmente necesita
  const payload = {
    code: moduleData.code,
    name: moduleData.name,
    path: moduleData.path,
    description: moduleData.description || null,
    icon: moduleData.icon || null,
    parent_module_id: moduleData.parent_module_id === 'null' ? null : moduleData.parent_module_id,
    active: Boolean(moduleData.active), // Forzamos que sea booleano puro
    updated_by: currentUser?.data?.user?.id,
    updated_at: new Date().toISOString(), // Usar formato ISO para Postgres
  };

  const { error } = await supabase
    .from('modules')
    .update(payload)
    .eq('id', moduleId) 

  if (error) {
    console.error('Error updating module:', error)
    
    if (error.code === '23505') {
      if (error.message.includes('modules_code_active_unique')) {
        return { 
          success: false, 
          field: 'code', 
          message: 'El código ingresado ya se encuentra registrado.' 
        }
      }
      if (error.message.includes('modules_path_active_unique')) {
        return { 
          success: false, 
          field: 'path', 
          message: 'La ruta especificada ya está en uso.' 
        }
      }
    }
    
    return { 
      success: false, 
      field: 'code', 
      message: 'No se pudo actualizar el módulo. Intente de nuevo.' 
    }
  }

  revalidatePath('/dashboard/seguridad/modulos')
  return { success: true }
}

export async function deleteModule(
  moduleId: string,
  confirmationCode: string
): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = await createClient()
  const currentUser = await getCurrentUser()
 
  const { data: moduleData, error: fetchError } = await supabase
    .from('modules')
    .select('code, parent_module_id')
    .eq('id', moduleId)
    .is('deleted_at', null)
    .single()
 
  if (fetchError || !moduleData) {
    return {
      success: false,
      message: 'No se encontró el módulo.'
    }
  }
 
  if (moduleData.code !== confirmationCode) {
    return {
      success: false,
      message: 'El código ingresado no coincide.'
    }
  }
 
  if (moduleData.parent_module_id === null) {
    const { data: childModules, error: childError } = await supabase
      .from('modules')
      .select('id')
      .eq('parent_module_id', moduleId)
      .is('deleted_at', null)
    
    if (childError) {
      console.error('Error checking child modules:', childError)
      return {
        success: false,
        message: 'No se pudo verificar los módulos relacionados.'
      }
    }
    
    if (childModules && childModules.length > 0) {
      return {
        success: false,
        message: 'No se puede eliminar un módulo padre que tiene submódulos asociados.'
      }
    }
  }
 
  const { error } = await supabase
    .from('modules')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: currentUser?.data?.user?.id,
      active: false
    })
    .eq('id', moduleId)
 
  if (error) {
    console.error('Error deleting module:', error)
    return {
      success: false,
      message: 'No se pudo eliminar el módulo. Intente de nuevo.'
    }
  }
 
  revalidatePath('/dashboard/seguridad/modulos')
  return { success: true }
}
