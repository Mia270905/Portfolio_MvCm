"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Platform {
  id: string;
  code: string;
  name: string;
  description: string | null;
  domain: string;
  is_write_protected?: boolean;
  active: boolean;
  contact_id: string | null;
  related_contact?: { // Datos del contacto relacionado
    id: string;
    full_name: string;
    email: string;
    job_position: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface PlatformsResponse {
  platforms: Platform[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Obtiene plataformas con paginación
 * @param page - Número de página (inicia en 1)
 * @param pageSize - Cantidad de items por página
 * @param searchQuery - Término de búsqueda (opcional)
 * @param sortBy - Campo para ordenar (opcional)
 * @param sortOrder - Orden ascendente o descendente (opcional)
 * @returns Objeto con plataformas, total, página actual y total de páginas
 */
export async function getPlatforms(
  page = 1,
  pageSize = 50,
  searchQuery = "",
  sortBy = "created_at",
  sortOrder: "asc" | "desc" = "desc"
): Promise<PlatformsResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("platforms")
    .select(`
      *,
      related_contact:contact_id (id, full_name, email, job_position)
    `, { count: "exact" })
    .is("deleted_at", null)
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (searchQuery) {
    query = query.or(
      `code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,domain.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Error al obtener plataformas: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    platforms: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene una plataforma por su ID (solo si no está eliminada)
 */
export async function getPlatformById(platformId: string): Promise<Platform | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platforms")
    .select(`
      *,
      related_contact:contact_id (id, full_name, email, job_position)
    `)
    .eq("id", platformId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener plataforma:", error);
    return null;
  }

  return data;
}

/**
 * Obtiene una plataforma por su código (solo si no está eliminada)
 */
export async function getPlatformByCode(code: string): Promise<Platform | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platforms")
    .select(`
      *,
      related_contact:contact_id (id, full_name, email, job_position)
    `)
    .eq("code", code)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener plataforma por código:", error);
    return null;
  }

  return data;
}

/**
 * Crea una nueva plataforma
 * @param platformData - Datos de la plataforma a crear
 * @returns Resultado de la operación
 */
export async function createPlatform(platformData: {
  code: string;
  name: string;
  description?: string;
  domain: string;
  active?: boolean;
  contact_id?: string | null;
}): Promise<{
  success: boolean;
  message?: string;
  platform?: Platform;
}> {
  const supabase = await createClient();

  console.log("log create");

  // Validaciones básicas
  if (!platformData.code?.trim()) {
    return { success: false, message: "El código es obligatorio" };
  }
  console.log("validacion1");

  if (!platformData.name?.trim()) {
    return { success: false, message: "El nombre es obligatorio" };
  }
  console.log("validacion2");

  if (!platformData.domain?.trim()) {
    return { success: false, message: "El dominio es obligatorio" };
  }
  console.log("validacion3");

  // Validar formato del código (solo letras minúsculas, números y guiones)
  const codeRegex = /^[a-z0-9-]+$/;
  if (!codeRegex.test(platformData.code)) {
    return { 
      success: false, 
      message: "El código solo puede contener letras minúsculas, números y guiones" 
    };
  }
  console.log("log coderegex");

  // Validar formato del dominio
  const domainRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
  if (!domainRegex.test(platformData.domain)) {
    return { 
      success: false, 
      message: "El formato del dominio no es válido" 
    };
  }
  console.log("log domainregex");

  // Verificar si el código ya existe
  const { data: existingPlatform } = await supabase
    .from("platforms")
    .select("id")
    .eq("code", platformData.code)
    .is("deleted_at", null)
    .single();

  if (existingPlatform) {
    console.log("log if existingplatform");
    return { 
      success: false, 
      message: "El código ya está en uso por otra plataforma" 
    };
  }

  try {
    console.log("log try");
    const { data, error } = await supabase
      .from("platforms")
      .insert({
        code: platformData.code,
        name: platformData.name,
        description: platformData.description || null,
        domain: platformData.domain,
        contact_id: platformData.contact_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        *,
        related_contact:contact_id (id, full_name, email, job_position)
      `)
      .single();
      console.log("log try2");

    if (error) {
      console.log("log if error");
      if (error.code === "23505") {
        if (error.message.includes("code")) {
          return { success: false, message: "El código ya está en uso por otra plataforma." };
        }
        if (error.message.includes("contact_id")) {
          return { success: false, message: "El contacto seleccionado ya está relacionado con otra plataforma." };
        }
      }
      console.log("log erroraaa");
      return { success: false, message: error.message };
    }

    console.log("log revalidate");
    revalidatePath("/dashboard/platforms");
    return { success: true, platform: data };
  } catch (error: any) {
    console.log("log catch");
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Actualiza una plataforma existente
 * @param platformId - ID de la plataforma a actualizar
 * @param platformData - Datos de la plataforma a actualizar
 * @returns Resultado de la operación
 */
export async function updatePlatform(
  platformId: string,
  platformData: {
    code?: string;
    name?: string;
    description?: string;
    domain?: string;
    active?: boolean;
    contact_id?: string | null;
  }
): Promise<{
  success: boolean;
  message?: string;
  platform?: Platform;
}> {
  try {
    const supabase = await createClient();

    // 1. Verificar que la plataforma existe
    const { data: existingPlatform, error: findError } = await supabase
      .from("platforms")
      .select("id, code, contact_id, is_write_protected")
      .eq("id", platformId)
      .is("deleted_at", null)
      .single();

    if (findError || !existingPlatform) {
      return { success: false, message: "Plataforma no encontrada" };
    }

    // 2. Verificar si está protegida contra escritura
    if (existingPlatform.is_write_protected) {
      return { success: false, message: "La plataforma está protegida contra escritura y no puede ser modificada" };
    }

    // 3. Validaciones
    if (platformData.code !== undefined) {
      if (!platformData.code.trim()) {
        return { success: false, message: "El código es obligatorio" };
      }
      
      const codeRegex = /^[a-z0-9-]+$/;
      if (!codeRegex.test(platformData.code)) {
        return { 
          success: false, 
          message: "El código solo puede contener letras minúsculas, números y guiones" 
        };
      }

      // Validar código único (si se está cambiando)
      if (platformData.code !== existingPlatform.code) {
        const { data: duplicate } = await supabase
          .from("platforms")
          .select("id")
          .eq("code", platformData.code)
          .neq("id", platformId)
          .is("deleted_at", null)
          .single();

        if (duplicate) {
          return { success: false, message: "El código ya está en uso por otra plataforma." };
        }
      }
    }

    if (platformData.name !== undefined && !platformData.name.trim()) {
      return { success: false, message: "El nombre es obligatorio" };
    }

    if (platformData.domain !== undefined) {
      if (!platformData.domain.trim()) {
        return { success: false, message: "El dominio es obligatorio" };
      }
      
      const domainRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
      if (!domainRegex.test(platformData.domain)) {
        return { 
          success: false, 
          message: "El formato del dominio no es válido" 
        };
      }
    }

    // 4. Verificar si el contacto ya está relacionado con OTRA plataforma
    if (platformData.contact_id !== undefined && 
        platformData.contact_id !== existingPlatform.contact_id) {
      
      const { data: existingPlatformWithContact } = await supabase
        .from("platforms")
        .select("id, name")
        .eq("contact_id", platformData.contact_id)
        .neq("id", platformId) // Excluir la plataforma actual
        .is("deleted_at", null)
        .single();

      if (existingPlatformWithContact) {
        return { 
          success: false, 
          message: `El contacto seleccionado ya está relacionado con la plataforma: ${existingPlatformWithContact.name}` 
        };
      }
    }

    // 5. Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Agregar solo los campos que tienen valor
    if (platformData.code !== undefined) updateData.code = platformData.code;
    if (platformData.name !== undefined) updateData.name = platformData.name;
    if (platformData.description !== undefined) updateData.description = platformData.description;
    if (platformData.domain !== undefined) updateData.domain = platformData.domain;
    if (platformData.active !== undefined) updateData.active = platformData.active;
    if (platformData.contact_id !== undefined) updateData.contact_id = platformData.contact_id;

    // 6. Ejecutar el UPDATE
    const { data, error } = await supabase
      .from("platforms")
      .update(updateData)
      .eq("id", platformId)
      .select(`
        *,
        related_contact:contact_id (id, full_name, email, job_position)
      `)
      .single();

    if (error) {
      console.error("Error al actualizar plataforma:", error);
      
      // Manejar errores de constraint único
      if (error.code === "23505") {
        return { success: false, message: "El código ya está en uso por otra plataforma." };
      }

      return { success: false, message: `Error de base de datos: ${error.message}` };
    }

    // 7. Revalidar paths
    revalidatePath("/dashboard/platforms");
    revalidatePath("/dashboard/platforms/edit");

    return { success: true, platform: data };
  } catch (error: any) {
    console.error("Error general en updatePlatform:", error);
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Elimina una plataforma (soft delete)
 * @param platformId - ID de la plataforma a eliminar
 * @returns Resultado de la operación
 */
export async function deletePlatform(platformId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    // Verificar si la plataforma está protegida contra escritura
    const { data: platform } = await supabase
      .from("platforms")
      .select("is_write_protected")
      .eq("id", platformId)
      .single();

    if (platform?.is_write_protected) {
      return { success: false, message: "La plataforma está protegida contra escritura y no puede ser eliminada" };
    }

    // Obtener el usuario autenticado para logged de quién eliminó
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("platforms")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null,
      })
      .eq("id", platformId);

    if (error) {
      console.error("Error al eliminar plataforma:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/platforms");
    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Obtiene todas las plataformas (sin paginación, solo las no eliminadas)
 */
export async function getAllPlatforms(): Promise<Platform[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("platforms")
    .select(`
      *,
      related_contact:contact_id (id, full_name, email, job_position)
    `)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener platforms:", error);
    return [];
  }

  return data || [];
}

/**
 * Busca plataformas por código, nombre o dominio (solo las no eliminadas)
 */
export async function searchPlatforms(query: string): Promise<Platform[]> {
  const supabase = await createClient();

  if (query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from("platforms")
    .select(`
      *,
      related_contact:contact_id (id, full_name, email, job_position)
    `)
    .is("deleted_at", null)
    .or(`code.ilike.%${query}%,name.ilike.%${query}%,domain.ilike.%${query}%`)
    .order("name", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error al buscar plataformas:", error);
    return [];
  }

  return data || [];
}

/**
 * Cambia el estado activo/inactivo de una plataforma
 */
export async function togglePlatformActive(
  platformId: string,
  active: boolean
): Promise<{
  success: boolean;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    // Verificar si la plataforma está protegida contra escritura
    const { data: platform } = await supabase
      .from("platforms")
      .select("is_write_protected")
      .eq("id", platformId)
      .single();

    if (platform?.is_write_protected) {
      return { success: false, message: "La plataforma está protegida contra escritura y no puede ser modificada" };
    }

    const { error } = await supabase
      .from("platforms")
      .update({
        active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", platformId);

    if (error) {
      console.error("Error al cambiar estado de plataforma:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/platforms");
    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}