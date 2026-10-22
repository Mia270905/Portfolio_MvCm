"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { 
  Measurement, 
  NewMeasurementPayload, 
  UpdateMeasurementPayload,
  MeasurementsResponse,
  Unspsc
} from "@/lib/definitions";

/**
 * Obtiene unidades de medida con paginación
 */
export async function getMeasurements(
  page = 1,
  pageSize = 50,
  searchQuery = ""
): Promise<MeasurementsResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("measurements")
    .select(`
      *,
      parent_measurement:reference (id, unit, quantity),
      unspsc_data:unspsc (id, code, name, type)
    `, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.or(
      `unit.ilike.%${searchQuery}%,quantity.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error en getMeasurements:", error);
    throw new Error(`Error al obtener unidades de medida: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    measurements: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene una unidad de medida por su ID
 */
export async function getMeasurementById(measurementId: string): Promise<Measurement | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("measurements")
    .select(`
      *,
      parent_measurement:reference (id, unit, quantity),
      unspsc_data:unspsc (id, code, name, type)
    `)
    .eq("id", measurementId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener unidad de medida:", error);
    return null;
  }

  return data;
}

/**
 * Crea una nueva unidad de medida
 */
export async function createMeasurement(
  payload: NewMeasurementPayload
): Promise<{
  success: boolean;
  message?: string;
  measurement?: Measurement;
}> {
  const supabase = await createClient();

  // Validaciones básicas
  if (!payload.unit?.trim()) {
    return { success: false, message: "La unidad es obligatoria" };
  }

  if (!payload.quantity?.trim()) {
    return { success: false, message: "La cantidad es obligatoria" };
  }

  try {
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("measurements")
      .insert({
        unit: payload.unit.trim(),
        quantity: payload.quantity.trim(),
        reference: payload.reference || null,
        unspsc: payload.unspsc || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: user?.id || null,
        updated_by: user?.id || null,
      })
      .select(`
        *,
        parent_measurement:reference (id, unit, quantity),
        unspsc_data:unspsc (id, code, name, type)
      `)
      .single();

    if (error) {
      console.error("Error en createMeasurement:", error);
      
      // Manejar errores de constraints únicos
      if (error.code === "23505") {
        if (error.message.includes("unit")) {
          return { success: false, message: "La unidad ya existe." };
        }
      }
      
      // Verificar si es error de foreign key
      if (error.code === "23503") {
        if (error.message.includes("reference")) {
          return { success: false, message: "La referencia seleccionada no existe." };
        }
        if (error.message.includes("unspsc")) {
          return { success: false, message: "El código UNSPSC seleccionado no existe." };
        }
      }
      
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/productos/unidades-medida");
    return { success: true, measurement: data };
  } catch (error: any) {
    console.error("Error inesperado en createMeasurement:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Actualiza una unidad de medida existente
 */
export async function updateMeasurement(
  measurementId: string,
  payload: UpdateMeasurementPayload
): Promise<{
  success: boolean;
  message?: string;
  measurement?: Measurement;
}> {
  try {
    const supabase = await createClient();

    // 1. Verificar que la unidad de medida existe
    const { data: existingMeasurement, error: findError } = await supabase
      .from("measurements")
      .select("id, unit, reference")
      .eq("id", measurementId)
      .is("deleted_at", null)
      .single();

    if (findError || !existingMeasurement) {
      return { success: false, message: "Unidad de medida no encontrada" };
    }

    // 2. Validaciones
    if (payload.unit !== undefined && !payload.unit.trim()) {
      return { success: false, message: "La unidad es obligatoria" };
    }

    if (payload.quantity !== undefined && !payload.quantity.trim()) {
      return { success: false, message: "La cantidad es obligatoria" };
    }

    // 3. Validar que no se cree una referencia circular a sí misma
    if (payload.reference === measurementId) {
      return { success: false, message: "Una unidad no puede referenciarse a sí misma" };
    }

    // 4. Validar que la unidad sea única (si se está cambiando)
    if (payload.unit && payload.unit !== existingMeasurement.unit) {
      const { data: duplicateUnit } = await supabase
        .from("measurements")
        .select("id")
        .eq("unit", payload.unit)
        .neq("id", measurementId)
        .is("deleted_at", null)
        .single();

      if (duplicateUnit) {
        return { success: false, message: "La unidad ya está en uso por otra medida." };
      }
    }

    // 5. Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();

    // 6. Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
      updated_by: user?.id || null,
    };

    // Agregar solo los campos que tienen valor
    if (payload.unit !== undefined) updateData.unit = payload.unit.trim();
    if (payload.quantity !== undefined) updateData.quantity = payload.quantity.trim();
    if (payload.reference !== undefined) updateData.reference = payload.reference;
    if (payload.unspsc !== undefined) updateData.unspsc = payload.unspsc;

    // 7. Ejecutar el UPDATE
    const { data, error } = await supabase
      .from("measurements")
      .update(updateData)
      .eq("id", measurementId)
      .select(`
        *,
        parent_measurement:reference (id, unit, quantity),
        unspsc_data:unspsc (id, code, name, type)
      `)
      .single();

    if (error) {
      console.error("Error al actualizar unidad de medida:", error);
      
      // Manejar errores de constraint único
      if (error.code === "23505") {
        return { success: false, message: "La unidad ya está en uso por otra medida." };
      }
      
      // Manejar errores de foreign key
      if (error.code === "23503") {
        if (error.message.includes("reference")) {
          return { success: false, message: "La referencia seleccionada no existe." };
        }
        if (error.message.includes("unspsc")) {
          return { success: false, message: "El código UNSPSC seleccionado no existe." };
        }
      }

      return { success: false, message: `Error de base de datos: ${error.message}` };
    }

    // 8. Revalidar paths
    revalidatePath("/dashboard/productos/unidades-medida");
    revalidatePath(`/dashboard/productos/unidades-medida/edit/${measurementId}`);

    return { success: true, measurement: data };
  } catch (error: any) {
    console.error("Error general en updateMeasurement:", error);
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Elimina una unidad de medida (soft delete)
 */
export async function deleteMeasurement(measurementId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    // 1. Verificar si hay otras unidades que referencian esta
    const { data: referencingMeasurements, error: checkError } = await supabase
      .from("measurements")
      .select("id, unit")
      .eq("reference", measurementId)
      .is("deleted_at", null);

    if (checkError) {
      console.error("Error al verificar referencias:", checkError);
      return { success: false, message: "Error al verificar dependencias" };
    }

    // 2. Si hay unidades que referencian esta, no se puede eliminar
    if (referencingMeasurements && referencingMeasurements.length > 0) {
      const referencingUnits = referencingMeasurements.map(m => m.unit).join(", ");
      return { 
        success: false, 
        message: `No se puede eliminar esta unidad porque está siendo referenciada por: ${referencingUnits}. Primero elimina o cambia las referencias.` 
      };
    }

    // 3. Obtener el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    // 4. Realizar el soft delete
    const { error } = await supabase
      .from("measurements")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null,
      })
      .eq("id", measurementId);

    if (error) {
      console.error("Error al eliminar unidad de medida:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/productos/unidades-medida");
    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Obtiene todas las unidades de medida (sin paginación)
 */
export async function getAllMeasurements(): Promise<Measurement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("measurements")
    .select(`
      *,
      parent_measurement:reference (id, unit, quantity),
      unspsc_data:unspsc (id, code, name, type)
    `)
    .is("deleted_at", null)
    .order("unit", { ascending: true });

  if (error) {
    console.error("Error al obtener unidades de medida:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene unidades de medida para dropdown (solo id, unit, quantity)
 */
export async function getMeasurementOptions(): Promise<
  Array<{ id: string; unit: string; quantity: string }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("measurements")
    .select("id, unit, quantity")
    .is("deleted_at", null)
    .order("unit", { ascending: true });

  if (error) {
    console.error("Error al obtener opciones de unidades:", error);
    return [];
  }

  return data || [];
}

/**
 * Busca unidades de medida
 */
export async function searchMeasurements(query: string): Promise<Measurement[]> {
  const supabase = await createClient();

  if (query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from("measurements")
    .select(`
      *,
      parent_measurement:reference (id, unit, quantity),
      unspsc_data:unspsc (id, code, name, type)
    `)
    .is("deleted_at", null)
    .or(`unit.ilike.%${query}%,quantity.ilike.%${query}%`)
    .order("unit", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error al buscar unidades de medida:", error);
    return [];
  }

  return data || [];
}

/**
 * Verifica si una unidad ya existe
 */
export async function checkUnitExists(unit: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from("measurements")
    .select("id")
    .eq("unit", unit.trim())
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    console.error("Error al verificar unidad:", error);
  }

  return !!data;
}

/**
 * Verifica si una unidad de medida está siendo referenciada por otras
 */
export async function checkMeasurementInUse(measurementId: string): Promise<{
  isInUse: boolean;
  referencingUnits?: Array<{ id: string; unit: string }>;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("measurements")
      .select("id, unit")
      .eq("reference", measurementId)
      .is("deleted_at", null);

    if (error) {
      console.error("Error al verificar uso de unidad:", error);
      return { isInUse: false, message: "Error al verificar" };
    }

    const isInUse = data && data.length > 0;
    
    return {
      isInUse,
      referencingUnits: data || [],
      message: isInUse 
        ? `Esta unidad está siendo referenciada por ${data.length} unidad(es)` 
        : "Esta unidad no está siendo referenciada"
    };
  } catch (error) {
    console.error("Error inesperado:", error);
    return { isInUse: false, message: "Error al verificar" };
  }
}
