'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from "next/cache";
export type User = {
  id: string
  email: string
  full_name: string
  active: boolean
  user_code?: string
  profile_id?: string
  profile_name?: string
  profile_code?: string 
  hierarchy?: number
}

export type UsersResponse = {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type UserDetail = {
  id: string
  email: string
  full_name: string
  active: boolean
  user_code?: string
  profile_id?: string
}

export type UpdateUserPayload = {
  full_name?: string
  email?: string
  active?: boolean
  profile_id?: string | null
  user_code?: string | null
}

export interface UserProfile {
  id: string;
  full_name: any;
  email: string | undefined;
  active: boolean;
  created_at: string;
  updated_at?: string;
  profile_id: null;
  profile_name: string;
  profile_code: string;
  user_code?: undefined;
}

// @/lib/actions/user.actions.ts

export async function getUsers(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  profileFilter: string = "",
  sortBy: "email" | "full_name" | "active" | "user_code" = "full_name", 
  sortOrder: "asc" | "desc" = "asc",
  status: string = "" // <--- 1. Agregamos el séptimo parámetro
): Promise<UsersResponse> {
  const supabase = await createClient();

  // Calcular el offset inicial
  const from = Math.max(0, (page - 1) * pageSize);
  
  let query = supabase
    .from("users")
    .select(
      `
      id,
      email,
      full_name,
      active,
      user_code, 
      profile_id,
      profiles:profile_id (
        id,
        name,
        code,
        hierarchy
      )
    `,
      { count: "exact" },
    )
    .order(sortBy, { ascending: sortOrder === "asc" });

  // --- FILTROS ---

  // Filtro de búsqueda
  if (search.trim()) {
    query = query.or(`email.ilike.%${search}%, full_name.ilike.%${search}%, user_code.ilike.%${search}%`);
  }

  // Filtro por perfil
  if (profileFilter) {
    query = query.eq("profile_id", profileFilter);
  }

  // --- 2. FILTRO DE ESTADO (NUEVO) ---
  if (status === "active") {
    query = query.eq("active", true);
  } else if (status === "inactive") {
    query = query.eq("active", false);
  }

  // --- EJECUCIÓN ---

  // Primero obtener el conteo total con los filtros aplicados
  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error("Error al cargar usuarios");
  }

  const total = count || 0;
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
  const actualPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  
  const actualFrom = Math.max(0, (actualPage - 1) * pageSize);
  const actualTo = Math.min(actualFrom + pageSize - 1, total - 1);

  let paginatedData = data || [];
  if (total > 0) {
    // Aplicamos el rango sobre la query que ya tiene el filtro de status
    const { data: pagedData, error: pagingError } = await query.range(actualFrom, actualTo);
    
    if (pagingError) {
      console.error("Error paginating users:", pagingError);
      throw new Error("Error al paginar usuarios");
    }
    
    paginatedData = pagedData || [];
  }

  const usersWithProfile = paginatedData.map((user: any) => {
  const profileData = Array.isArray(user.profiles)
    ? user.profiles[0]
    : user.profiles;

  return {
    ...user,
    profile_name: profileData?.name ?? null,
    profile_code: profileData?.code ?? null,
    hierarchy: profileData?.hierarchy ?? 99,
  };
});


  return {
    users: usersWithProfile,
    total,
    page: actualPage,
    pageSize,
    totalPages,
  };
}
// Obtener todos los perfiles activos
export async function getAllActiveProfiles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, code')
    .eq('active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }

  return data || []
}

export async function getUsersWithFilters(params: {
  search?: string;
  profile?: string;
  status?: "active" | "inactive";
  page?: number;
  pageSize?: number;
}) {
  const { search = "", profile = "", status, page = 1, pageSize = 10 } = params;
  const supabase = await createClient();

  // Calcular offset para paginación
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("users")
    .select(
      `
      id,
      email,
      full_name,
      active,
      user_code,
      profile_id,
      profiles:profile_id (
        id,
        name,
        code,
        hierarchy
      )
    `,
      { count: "exact" }
    );

  // Filtro de búsqueda
  if (search.trim()) {
    query = query.or(
      `email.ilike.%${search}%, full_name.ilike.%${search}%, user_code.ilike.%${search}%`
    );
  }

  // Filtro por perfil
  if (profile) {
    query = query.eq("profile_id", profile);
  }

  // Filtro por estado
  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);

  // Obtener datos con conteo total
  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error("Error al cargar usuarios");
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  const usersWithProfile = (data || []).map((user: any) => {
    const profileData = Array.isArray(user.profiles)
      ? user.profiles[0]
      : user.profiles;

    return {
      ...user,
      profile_name: profileData?.name ?? null,
      profile_code: profileData?.code ?? null,
      hierarchy: profileData?.hierarchy ?? 99,
    };
  });

  return {
    users: usersWithProfile,
    total,
    page,
    pageSize,
    totalPages,
  };
}

  export async function toggleUserActive(
    userId: string,
    currentActive: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('users')
        .update({ active: !currentActive, updated_at: new Date() })
        .eq('id', userId);
      
      if (error) {
        console.error('Error updating user:', error);
        return { success: false, error: 'Error al actualizar el usuario' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in toggleUserActive:', error);
      return { success: false, error: 'Error inesperado' };
    }
  }


export async function getCurrentUser(){
  const supabase = await createClient()
  const {data, error} = await supabase.auth.getUser();

  return {
    data,
    user: data?.user,
    error,
    rawUser: data?.user,
  }
}

export async function getUserById(userId: string): Promise<UserDetail | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, active, profile_id')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error al obtener usuario por ID:', error)
      return null
    }

    return data || null
  } catch (err) {
    console.error('Error inesperado al obtener usuario:', err)
    return null
  }
}

// Esta función la mantienes para compatibilidad
export async function getProfiles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error al obtener perfiles:', error)
    return []
  }

  return data
}

// export async function getUserWithHierarchy(userId: string): Promise<UserDetail | null> {
//   try {
//     const supabase = await createClient()

//     const { data, error } = await supabase
//       .from('users')
//       .select(`
//         id, 
//         email, 
//         full_name, 
//         active, 
//         profile_id,
//         profiles (
//           hierarchy
//         )
//       `)
//       .eq('id', userId)
//       .single()

//     if (error) {
//       console.error('Error al obtener usuario por ID:', error)
//       return null
//     }

//     // Adaptamos el retorno para que la jerarquía esté al mismo nivel si es necesario
//     if (data) {
//       return {
//         ...data,
//       }
//     }

//     return null
//   } catch (err) {
//     console.error('Error inesperado al obtener usuario:', err)
//     return null
//   }
// }

export async function getUserWithHierarchy(userId: string): Promise<UserDetail | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select(`
        id, email, full_name, active,
        profile_id,
        profiles:profile_id (
          id,
          name,
          code,
          hierarchy
        )`)
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error al obtener usuario por ID:', error)
      return null
    }

    return data || null
  } catch (err) {
    console.error('Error inesperado al obtener usuario:', err)
    return null
  }
}

export async function updateUser(
  userId: string,
  payload: UpdateUserPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const updateData = {
      active: payload.active,
      profile_id: payload.profile_id,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/seguridad/usuarios");

    return { success: true };
  } catch (err) {
    console.error("Error inesperado:", err);
    return { success: false, error: "Error inesperado" };
  }
}


export async function getUserWithPermissions() {
  try {
    const supabase = await createClient()

    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      console.error('No se pudo obtener el usuario autenticado:', authError)
      return null
    }

    const userId = userData.user.id

    const { data, error } = await supabase.rpc('get_user_with_permissions', {
      user_uuid: userId,
    })

    if (error) {
      console.error('Error al obtener usuario con permisos:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error inesperado en getUserWithPermissions:', err)
    return null
  }
}

export async function fetchUserProfile() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { user: null, profile: null, error: "NO_SESSION" }
  }

  const authUser = session.user

  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        active,
        user_code,
        created_at,
        updated_at,
        profile_id,
        profiles:profile_id (
          id,
          name,
          code
        )
      `)
      .eq("id", authUser.id)
      .single()

    // Si hay error o no existe el usuario en la tabla users
    if (error || !userData) {
      console.log('User not found in users table, creating basic profile...')
      
      return {
        user: authUser,
        profile: {
          id: authUser.id,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario',
          email: authUser.email,
          active: true,
          created_at: authUser.created_at,
          user_code: undefined,
          updated_at: authUser.updated_at,
          profile_id: null,
          profile_name: 'Usuario',
          profile_code: 'user',
        },
        error: null,
      }
    }

    const profile = Array.isArray(userData.profiles)
      ? userData.profiles[0]
      : userData.profiles

    return {
      user: authUser,
      profile: {
        ... userData,
        // id: userData.id,
        // full_name: userData.full_name,
        email: userData.email || authUser.email || '',
        //active: userData.active,
        user_code: userData.user_code,
        //created_at: userData.created_at,
        //updated_at: userData.updated_at,
        //profile_id: userData.profile_id,
        profile_name: profile?.name || '',
        profile_code: profile?.code || '',
      },
      error: null,
    }

  } catch (error) {
    console.error('Unexpected error in fetchUserProfile:', error)
    return { 
      user: authUser, 
      profile: null, 
      error: 'Error inesperado al cargar el perfil' 
    }
  }
}

/**
 * Cambia la contraseña del usuario autenticado
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string; provider?: string }> {
  try {
    // 1. Primero verificar si puede cambiar contraseña
    const { canChange, provider, message } = await canUserChangePassword();

    if (!canChange) {
      return {
        success: false,
        error: message || "No puedes cambiar la contraseña",
        provider,
      };
    }

    // 2. Obtener usuario usando getCurrentUser
    const { user, error } = await getCurrentUser();

    if (error || !user?.email) {
      return { success: false, error: "Usuario no autenticado" };
    }

    // 3. Verificar contraseña actual
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      console.error("Error verificando contraseña actual:", signInError);
      return { success: false, error: "Contraseña actual incorrecta" };
    }

    // 4. Validar nueva contraseña
    if (newPassword.length < 6) {
      return {
        success: false,
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      };
    }

    // 5. Cambiar la contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error("Error al cambiar contraseña:", updateError);
      return {
        success: false,
        error: `Error al actualizar contraseña: ${updateError.message}`,
      };
    }

    return { success: true, provider: provider || "email" };
  } catch (error) {
    console.error("Error inesperado al cambiar contraseña:", error);
    return {
      success: false,
      error: "Error inesperado del servidor",
    };
  }
}

/**
 * Verifica si el usuario puede cambiar su contraseña reutilizando getCurrentUser
 */
export async function canUserChangePassword(): Promise<{
  canChange: boolean;
  provider?: string;
  message?: string;
}> {
  try {
    const { user, error } = await getCurrentUser();

    if (error || !user) {
      return {
        canChange: false,
        message: "Usuario no autenticado",
      };
    }

    // Verificar el proveedor de autenticación usando la data de getCurrentUser
    const provider =
      user.app_metadata?.provider || user.user_metadata?.provider || "email";

    // Verificar si es Google desde app_metadata
    if (provider === "google") {
      return {
        canChange: false,
        provider: "google",
        message:
          "Los usuarios que iniciaron sesión con Google no pueden cambiar su contraseña aquí. Por favor, usa google.com para gestionar tu contraseña.",
      };
    }

    // Verificar en identities si existe Google
    if (user.identities && user.identities.length > 0) {
      const googleIdentity = user.identities.find(
        (identity: any) => identity.provider === "google",
      );

      if (googleIdentity) {
        return {
          canChange: false,
          provider: "google",
          message:
            "Cuenta vinculada con Google. Cambia tu contraseña en google.com",
        };
      }
    }

    // Verificar en user_metadata si hay indicios de Google
    const userMetadata = user.user_metadata as any;
    if (
      userMetadata?.avatar_url?.includes("googleusercontent.com") ||
      userMetadata?.full_name?.includes("(Google)") ||
      userMetadata?.provider === "google"
    ) {
      return {
        canChange: false,
        provider: "google",
        message:
          "Método de autenticación Google detectado. Usa la configuración de Google para cambiar tu contraseña.",
      };
    }

    // Si pasó todas las validaciones, puede cambiar
    return {
      canChange: true,
      provider: provider === "email" ? "email" : "other",
      message: "Puedes cambiar tu contraseña",
    };
  } catch (error) {
    console.error("Error verificando proveedor:", error);
    return {
      canChange: false,
      message: "Error al verificar permisos",
    };
  }
}

export async function getCurrentUserPermissions(): Promise<string[]> {
  try {
    const supabase = await createClient();
    
    const { data: userData, error: authError } = await supabase.auth.getUser();
    
    if (authError || !userData?.user?.id) {
      console.error('No se pudo obtener el usuario autenticado:', authError);
      return [];
    }
    
    const userId = userData.user.id;
    
    // Obtener el perfil del usuario
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select(`
        profile_id
      `)
      .eq('id', userId)
      .single();
    
    if (userError || !userProfile?.profile_id) {
      console.error('Error obteniendo perfil del usuario:', userError);
      return [];
    }
    
    // Obtener los permisos activos del perfil del usuario
    const { data: permissions, error: permError } = await supabase
      .from('permissions_profiles')
      .select(`
        permissions!inner (
          code
        )
      `)
      .eq('id_profile', userProfile.profile_id)
      .eq('active', true);
    
    if (permError) {
      console.error('Error obteniendo permisos del usuario:', permError);
      return [];
    }
    
    // Extraer solo los códigos de permisos
    const userPerms = permissions?.map((item: any) => item.permissions.code) || [];
    
    // Verificar si tiene el permiso especial
    const hasFullAccess = userPerms.includes('permission-all:profiles');
    
    return userPerms;
    
  } catch (error) {
    console.error('Error inesperado en getCurrentUserPermissions:', error);
    return [];
  }
}

export async function hasFullPermissionAccess(): Promise<boolean> {
  const permissions = await getCurrentUserPermissions();
  return permissions.includes('permission-all:profiles');
}


export async function hasPermission(permissionCode: string): Promise<boolean> {
  const permissions = await getCurrentUserPermissions();
  return permissions.includes(permissionCode);
}

export async function getContactEmail(user_id?: string) {
  const supabase = await createClient();
  
  try {
    let targetUserId: string;

    // SI SE PROVEE user_id, USAR ESE
    if (user_id) {
      targetUserId = user_id;
    } else {
      //  SI NO HAY user_id, BUSCAR EL USUARIO AUTENTICADO
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: "Usuario no autenticado y no se proporcionó user_id" };
      }
      targetUserId = user.id;
    }

    const { data, error } = await supabase
      .from("users")
      .select("contact_email")
      .eq("id", targetUserId)
      .single();

    if (error) {
      console.error("Error al obtener correo:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.contact_email || "" };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserWithCode(userId: string): Promise<UserDetail | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, active, profile_id, user_code')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error al obtener usuario con código:', error)
      return null
    }

    return data || null
  } catch (err) {
    console.error('Error inesperado al obtener usuario con código:', err)
    return null
  }
}

export async function updateUserCode(
  userId: string,
  userCode: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('users')
      .update({
        user_code: userCode,
        updated_at: new Date()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error al actualizar código de usuario:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error inesperado al actualizar código de usuario:', err)
    return { success: false, error: 'Error inesperado' }
  }
}

export async function checkUserCodeExists(
  userCode: string,
  excludeUserId?: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('users')
      .select('id')
      .eq('user_code', userCode)
      .not('user_code', 'is', null)

    // Excluir usuario actual si se está editando
    if (excludeUserId) {
      query = query.neq('id', excludeUserId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al verificar código de usuario:', error)
      return { exists: false, error: error.message }
    }

    return { exists: (data?.length || 0) > 0 }
  } catch (err) {
    console.error('Error inesperado al verificar código:', err)
    return { exists: false, error: 'Error inesperado' }
  }
}

/**
 * Obtiene los nombres completos de usuarios por sus IDs
 * @param ids - Array de IDs de usuarios
 * @returns Map de ID -> nombre completo
 */
export async function getUserNamesByIds(
  ids: string[]
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name")
    .in("id", ids);

  if (error) {
    console.error("Error al obtener nombres de usuarios:", error);
    return new Map();
  }

  return new Map(data?.map((item) => [item.id, item.full_name]) || []);
}
