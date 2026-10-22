'use server'

import { revalidatePath } from "next/cache";
import { NewProfilePayload } from "../definitions";
import { createClient } from "../supabase/server";
import { type ProfilesResponse } from '@/lib/definitions'
import { getCurrentUser, getUserById } from "./user.actions";

export async function createProfile(profileData: NewProfilePayload): Promise <
  { success: true } | { success: false; field: 'code'; message: string }
> {
  const supabase = await createClient()
  const { data, error  } = await supabase.from('profiles').insert([profileData]).select();
  
  if (error) {
    console.error('Error creating profile:', error)
    
    if (error.code === '23505') {
      if (error.message.includes('profiles_code_active_unique')) {
        return { 
          success: false, 
          field: 'code', 
          message: 'El código ingresado ya se encuentra registrado.' 
        }
      }
    }
    
    return { 
      success: false, 
      field: 'code', 
      message: 'No se pudo crear el perfil. Intente de nuevo.' 
    }
  }  

  revalidatePath('/dashboard/seguridad/perfiles')
  return { success: true }
}

export async function getProfiles(
  page: number = 1,
  pageSize: number = 10,
  search: string = '',
  sortBy: 'code' | 'name' | 'active' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<ProfilesResponse> {
  const supabase = await createClient();
 
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  let query = supabase
    .from('profiles')
    .select('id, code, name, active', { count: 'exact' })
    .is('deleted_at', null)
    .order(sortBy, { ascending: sortOrder === 'asc' });
  
  if (search.trim()) {
    query = query.or(`name.ilike.%${search}%, code.ilike.%${search}%`);
  }
  
  query = query.range(from, to);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('Error fetching profiles:', error);
    throw new Error('Error al cargar perfiles');
  }
  
  const totalPages = count ? Math.ceil(count / pageSize) : 0;
  
  return {
    profiles: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages
  };
}

export async function getOneProfile(profileId: string): Promise<any> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(`*`)
    .eq("id", profileId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return {}
  }

  return data
}

export async function getProfileWithPermissions(profileId: string): Promise<any> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      permissions_profiles (
        active,
        permissions (
          id,
          name,
          code,
          description
        )
      )
    `)
    .eq('id', profileId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    console.error(error);
    return {};
  }

  const permissions = (data.permissions_profiles || []).map((p: any) => {
    return { ...p.permissions, active: !!p.active };
  });

  const { permissions_profiles, ...extra } = data;

  return {
    ...extra,
    permissions,
  };
}



export async function updateProfile(
  profileId: string,
  profileData: NewProfilePayload
): Promise<{ success: true } | { success: false; field: any; message: string }> {
  const supabase = await createClient()
  
  // 1. Obtener datos del perfil objetivo
  const { data: target, error: fetchError } = await supabase
    .from('profiles')
    .select('is_write_protected, hierarchy')
    .eq('id', profileId)
    .single();

  if (fetchError || !target) return { success: false, field: 'code', message: 'Perfil no encontrado.' };

  // 2. Validar Jerarquía
  const validation = await validateHierarchy(supabase, target.hierarchy);
  if (!validation.allowed) return validation.error!;

  // 3. Lógica de Protección de Escritura (Optimizado)
  // Si está protegido, solo permitimos actualizar la jerarquía.
  const dataToUpdate: any = target.is_write_protected 
    ? { hierarchy: profileData.hierarchy } 
    : { ...profileData };

  dataToUpdate.updated_by = validation.userId;
  dataToUpdate.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from('profiles')
    .update(dataToUpdate) 
    .eq('id', profileId);

  if (error) {
    console.error('Error updating profile:', error)
    if (error.code === '23505' && error.message.includes('profiles_code_active_unique')) {
      return { success: false, field: 'code', message: 'El código ingresado ya se encuentra registrado.' };
    }
    return { success: false, field: 'code', message: 'No se pudo actualizar el perfil.'+dataToUpdate.name };
  }

  revalidatePath('/dashboard/seguridad/perfiles')
  return { success: true }
}

export async function updateProfilePermissions(
  profileId: string,
  currentPermissionStates: Record<string, boolean>,
  originalPermissionStates: Record<string, boolean>
): Promise<{ success: true; count: number } | { success: false; error: string }> {
  const supabase = await createClient();
  
  // 1. Obtener la jerarquía del perfil objetivo
  const { data: targetProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('hierarchy')
    .eq('id', profileId)
    .single();

  if (fetchError || !targetProfile) {
    return { success: false, error: 'Perfil no encontrado.' };
  }

  // 2. Validar jerarquía usando la función centralizada
  const validation = await validateHierarchy(supabase, targetProfile.hierarchy);
  if (!validation.allowed) {
    return { success: false, error: validation.error!.message };
  }

  const inserts: any[] = [];
  const updates: any[] = [];

  for (const [permissionId, currentValue] of Object.entries(currentPermissionStates)) {
    const originalValue = originalPermissionStates[permissionId];

    if (originalValue === undefined) {
      // Si no existía antes y ahora está activo → insertar
      if (currentValue) inserts.push({ id_profile: profileId, id_permission: permissionId, active: true });
      // Si está en false → no hacemos nada
    } else if (originalValue !== currentValue) {
      // Si existía y cambió → actualizar
      updates.push({ id_profile: profileId, id_permission: permissionId, active: currentValue });
    }
  }

  try {
    // Insertar nuevos permisos activos
    if (inserts.length > 0) {
      const { error } = await supabase.from("permissions_profiles").insert(inserts);
      if (error) throw error;
    }

    // Actualizar permisos existentes que cambiaron
    for (const update of updates) {
      const { error } = await supabase
        .from("permissions_profiles")
        .update({ active: update.active })
        .eq("id_profile", update.id_profile)
        .eq("id_permission", update.id_permission);
      if (error) throw error;
    }

    return { success: true, count: inserts.length + updates.length };
  } catch (err: any) {
    console.error("Error actualizando permisos:", err);
    return { success: false, error: err.message };
  }
}

export async function deleteProfile(
  profileId: string,
  confirmationCode: string
): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = await createClient()
  
  const { data: target, error: fetchError } = await supabase
    .from('profiles')
    .select('code, is_write_protected, hierarchy')
    .eq('id', profileId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !target) return { success: false, message: 'No se encontró el perfil.' };

  // Regla de Oro: Si está protegido, ni siquiera validamos jerarquía. Bloqueo inmediato.
  if (target.is_write_protected) {
    return { success: false, message: 'No se puede eliminar un perfil protegido contra escritura.' };
  }

  if (target.code !== confirmationCode) {
    return { success: false, message: 'El código no coincide.' };
  }

  // Validar Jerarquía usando la función centralizada
  const validation = await validateHierarchy(supabase, target.hierarchy);
  if (!validation.allowed) return validation.error!;
 
  //** 
  // TODO: NO PERMITIR ELIMINAR PERFILES CON USUARIOS ASIGNADOS, U ACTUALIZARLOS A UN PERFIL BASE*/

  // if (profileData.parent_module_id === null) {
  //   const { data: childModules, error: childError } = await supabase
  //     .from('modules')
  //     .select('id')
  //     .eq('parent_module_id', profileId)
  //     .is('deleted_at', null)
    
  //   if (childError) {
  //     console.error('Error checking child modules:', childError)
  //     return {
  //       success: false,
  //       message: 'No se pudo verificar los módulos relacionados.'
  //     }
  //   }
    
  //   if (childModules && childModules.length > 0) {
  //     return {
  //       success: false,
  //       message: 'No se puede eliminar un perfil padre que tiene submódulos asociados.'
  //     }
  //   }
  // }
 
  const { error } = await supabase
    .from('profiles')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: validation.userId,
      active: false
    })
    .eq('id', profileId);
 
  if (error) {
    console.error('Error deleting profile:', error)
    return {
      success: false,
      message: 'No se pudo eliminar el perfil. Intente de nuevo.'
    }
  }
 
  revalidatePath('/dashboard/seguridad/perfiles')
  return { success: true }
}

// Función interna de utilidad para validar si el editor puede modificar al objetivo
async function validateHierarchy(supabase: any, targetHierarchy: number) {
  const currentUser = await getCurrentUser();
  const currentUserId = currentUser?.data?.user?.id;
  
  // Obtenemos directamente la jerarquía del perfil del usuario logueado en una sola consulta
  const { data: userData } = await supabase
    .from('users')
    .select(`
      profiles:profile_id (
        id,
        name,
        code,
        hierarchy
    )`)
    .eq('id', currentUserId)
    .single();

  const editorHierarchy = userData?.profiles?.hierarchy ?? 999;
  console.log('Editor Hierarchy:', editorHierarchy, 'Target Hierarchy:', targetHierarchy);
  
  // Permitir modificar si tiene jerarquía menor o igual (menor número = mayor rango)
  if (editorHierarchy > targetHierarchy) {
    return { 
      allowed: false, 
      error: { success: false, field: 'hierarchy', message: 'No tienes rango suficiente para modificar este perfil (tu jerarquía debe ser menor o igual).' } 
    };
  }

  return { allowed: true, userId: currentUserId };
}