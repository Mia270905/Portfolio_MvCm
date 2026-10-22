"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { 
  Unspsc, 
  NewUnspscPayload, 
  UpdateUnspscPayload,
  UnspscResponse 
} from "@/lib/definitions";

/**
 * Obtiene códigos UNSPSC con paginación
 */
export async function getUnspsc(
  page = 1,
  pageSize = 50,
  searchQuery = ""
): Promise<UnspscResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("unspsc")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("code", { ascending: true });

  if (searchQuery) {
    query = query.or(
      `code.ilike.%${searchQuery}%,name.ilike.%${searchQuery}%,type.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error en getUnspsc:", error);
    throw new Error(`Error al obtener códigos UNSPSC: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    unspsc_codes: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene un código UNSPSC por su ID
 */
export async function getUnspscById(unspscId: string): Promise<Unspsc | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("unspsc")
    .select("*")
    .eq("id", unspscId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener código UNSPSC:", error);
    return null;
  }

  return data;
}

/**
 * Obtiene un código UNSPSC por su código
 */
export async function getUnspscByCode(code: string): Promise<Unspsc | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("unspsc")
    .select("*")
    .eq("code", code)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener código UNSPSC por código:", error);
    return null;
  }

  return data;
}

/**
 * Crea un nuevo código UNSPSC
 */
export async function createUnspsc(
  payload: NewUnspscPayload
): Promise<{
  success: boolean;
  message?: string;
  unspsc?: Unspsc;
}> {
  const supabase = await createClient();

  // Validaciones básicas
  if (!payload.code?.trim()) {
    return { success: false, message: "El código es obligatorio" };
  }

  if (!payload.name?.trim()) {
    return { success: false, message: "El nombre es obligatorio" };
  }

  if (!payload.type?.trim()) {
    return { success: false, message: "El tipo es obligatorio" };
  }

  try {
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("unspsc")
      .insert({
        code: payload.code.trim(),
        name: payload.name.trim(),
        type: payload.type.trim(),
        description: payload.description || null,
        // No incluir 'active' si no existe en la tabla
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || null,
        updated_by: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error en createUnspsc:", error);
      
      // Manejar errores de constraints únicos
      if (error.code === "23505") {
        if (error.message.includes("code")) {
          return { success: false, message: "El código UNSPSC ya existe." };
        }
      }
      
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/productos/unspsc");
    return { success: true, unspsc: data };
  } catch (error: any) {
    console.error("Error inesperado en createUnspsc:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Actualiza un código UNSPSC existente
 */
export async function updateUnspsc(
  unspscId: string,
  payload: UpdateUnspscPayload
): Promise<{
  success: boolean;
  message?: string;
  unspsc?: Unspsc;
}> {
  try {
    const supabase = await createClient();

    // 1. Verificar que el código UNSPSC existe
    const { data: existingUnspsc, error: findError } = await supabase
      .from("unspsc")
      .select("id, code, name, type")
      .eq("id", unspscId)
      .is("deleted_at", null)
      .single();

    if (findError || !existingUnspsc) {
      return { success: false, message: "Código UNSPSC no encontrado" };
    }

    // 2. Validaciones
    if (payload.code !== undefined && !payload.code.trim()) {
      return { success: false, message: "El código es obligatorio" };
    }

    if (payload.name !== undefined && !payload.name.trim()) {
      return { success: false, message: "El nombre es obligatorio" };
    }

    if (payload.type !== undefined && !payload.type.trim()) {
      return { success: false, message: "El tipo es obligatorio" };
    }

    // 3. Validar que el código sea único (si se está cambiando)
    if (payload.code && payload.code !== existingUnspsc.code) {
      const { data: duplicateCode } = await supabase
        .from("unspsc")
        .select("id")
        .eq("code", payload.code)
        .neq("id", unspscId)
        .is("deleted_at", null)
        .single();

      if (duplicateCode) {
        return { success: false, message: "El código UNSPSC ya está en uso." };
      }
    }

    // 4. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    // 5. Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    };

    // Agregar solo los campos que tienen valor
    if (payload.code !== undefined) updateData.code = payload.code.trim();
    if (payload.name !== undefined) updateData.name = payload.name.trim();
    if (payload.type !== undefined) updateData.type = payload.type.trim();
    if (payload.description !== undefined) updateData.description = payload.description;
    // No incluir 'active' si no existe en la tabla

    // 6. Ejecutar el UPDATE
    const { data, error } = await supabase
      .from("unspsc")
      .update(updateData)
      .eq("id", unspscId)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar código UNSPSC:", error);
      
      // Manejar errores de constraint único
      if (error.code === "23505") {
        return { success: false, message: "El código UNSPSC ya está en uso." };
      }

      return { success: false, message: `Error de base de datos: ${error.message}` };
    }

    // 7. Revalidar paths
    revalidatePath("/dashboard/productos/unspsc");
    revalidatePath(`/dashboard/productos/unspsc/edit/${unspscId}`);

    return { success: true, unspsc: data };
  } catch (error: any) {
    console.error("Error general en updateUnspsc:", error);
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Elimina un código UNSPSC (soft delete)
 */
export async function deleteUnspsc(unspscId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    // Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("unspsc")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null,
      })
      .eq("id", unspscId);

    if (error) {
      console.error("Error al eliminar código UNSPSC:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/productos/unspsc");
    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Obtiene todos los códigos UNSPSC (sin paginación)
 */
export async function getAllUnspsc(): Promise<Unspsc[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("unspsc")
    .select("*")
    .is("deleted_at", null)
    .order("code", { ascending: true });

  if (error) {
    console.error("Error al obtener códigos UNSPSC:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene opciones de UNSPSC para dropdown
 */
export async function getUnspscOptions(): Promise<
  Array<{ id: string; code: string; name: string; type: string }>
> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("unspsc")
      .select("id, code, name, type")
      .is("deleted_at", null) // Solo quitar el filtro por 'active'
      .order("code", { ascending: true });

    if (error) {
      console.error("Error al obtener opciones UNSPSC:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error inesperado al obtener UNSPSC:", error);
    return [];
  }
}

/**
 * Busca códigos UNSPSC
 */
export async function searchUnspsc(query: string): Promise<Unspsc[]> {
  const supabase = await createClient();

  if (query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from("unspsc")
    .select("*")
    .is("deleted_at", null)
    .or(`code.ilike.%${query}%,name.ilike.%${query}%,type.ilike.%${query}%`)
    .order("code", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error al buscar códigos UNSPSC:", error);
    return [];
  }

  return data || [];
}

/**
 * Verifica si un código UNSPSC ya existe
 */
export async function checkUnspscCodeExists(code: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from("unspsc")
    .select("id")
    .eq("code", code.trim())
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    console.error("Error al verificar código UNSPSC:", error);
  }

  return !!data;
}