"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const DEFAULT_REASON_ID = "007e8e5d-1e6d-4582-bb25-ad8ae2270f4f";

// Tipos para attendance_reasons
export interface AttendanceReason {
  id: string;
  name: string;
  description: string | null;
  applies_to: "BOTH" | "IN" | "OUT";
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

// Tipos para attendance_transactions
export interface AttendanceTransaction {
  id: string;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  user_id: string;
  event_type: string;
  ocurred_at: string;
  attendance_reason_id: string | null;

  // Relaciones
  reason?: AttendanceReason | null;
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    user_metadata?: {
      name?: string;
    };
  } | null;
}

export interface AttendanceTransactionsResponse {
  transactions: AttendanceTransaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Tipos para filtros
export interface AttendanceFilters {
  event_types?: string[];
  reason_ids?: string[];
  start_date?: string;
  end_date?: string;
  user_id?: string;
  user_name?: string;
}

// Tipos para payloads
export interface CreateAttendanceTransactionPayload {
  user_id: string;
  event_type: string;
  ocurred_at?: string;
  attendance_reason_id?: string | null;
}

export interface UpdateAttendanceTransactionPayload {
  event_type?: string;
  ocurred_at?: string;
  attendance_reason_id?: string | null;
}

/**
 * Obtiene todos los motivos de asistencia (attendance_reasons)
 */
export async function getAttendanceReasons(): Promise<AttendanceReason[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("attendance_reasons")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw error;

  return data || [];
}

/**
 * Crea un nuevo registro de asistencia
 */
export async function createAttendanceTransaction(
  payload: CreateAttendanceTransactionPayload
): Promise<{ success: boolean; message: string; data?: AttendanceTransaction }> {
  try {
    const supabase = await createClient();

    // Verificar usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // Verificar si el usuario existe
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", payload.user_id)
      .single();

    if (userError || !userData) {
      throw new Error("Usuario no encontrado");
    }

    // Usar la razón por defecto si no se especifica ninguna
    const attendanceReasonId = payload.attendance_reason_id || DEFAULT_REASON_ID;

    // Crear el registro
    const { data, error } = await supabase
      .from("attendance_transactions")
      .insert({
        ...payload,
        attendance_reason_id: attendanceReasonId, // Usar la razón por defecto si es null/undefined
        ocurred_at: payload.ocurred_at || new Date().toISOString(),
        created_by: user.id,
        updated_by: user.id,
      })
      .select(`
        *,
        reason:attendance_reasons (*),
        user:users (
          id,
          email,
          full_name,
          user_code
        )
      `)
      .single();

    if (error) throw error;

    // Mostrar nombre del tipo de evento
    const eventType = payload.event_type === "check-in" ? "entrada" : "salida";
    
    return {
      success: true,
      message: `Registro de ${eventType} creado exitosamente`,
      data
    };
  } catch (error) {
    console.error("Error creating attendance transaction:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al crear el registro"
    };
  }
}


/**
 * Obtiene el historial de registros de asistencia
 */
export async function getAttendanceHistory(
  page: number = 1,
  pageSize: number = 20,
  filters?: AttendanceFilters
): Promise<AttendanceTransactionsResponse> {
  try {
    const supabase = await createClient();

    // Verificar usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("attendance_transactions")
      .select(
        `
        *,
        reason:attendance_reasons (*),
        user:users (
          id,
          email,
          full_name,
          user_code
        )
        `,
        { count: "exact" }
      )
      .eq("user_id", user.id) // ¡IMPORTANTE! Filtrar por el usuario actual
      .is("deleted_at", null)
      .order("ocurred_at", { ascending: false });

    // Aplicar filtros (manteniendo los existentes)
    if (filters) {
      if (filters.event_types && filters.event_types.length > 0) {
        query = query.in("event_type", filters.event_types);
      }

      if (filters.reason_ids && filters.reason_ids.length > 0) {
        query = query.in("attendance_reason_id", filters.reason_ids);
      }

      if (filters.start_date) {
        query = query.gte("ocurred_at", new Date(filters.start_date).toISOString());
      }

      if (filters.end_date) {
        query = query.lte("ocurred_at", new Date(filters.end_date).toISOString());
      }
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    return {
      transactions: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error("Error getting attendance history:", error);
    return {
      transactions: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Obtiene el último registro de un usuario
 */
export async function getLastAttendanceRecord(
  userId: string
): Promise<AttendanceTransaction | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("attendance_transactions")
      .select(
        `
        *,
        reason:attendance_reasons (*),
        user:users (
            id,
            email,
            full_name,
            user_code
        )
        `
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("ocurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error getting last attendance record:", error);
    return null;
  }
}

/**
 * Actualiza un registro de asistencia
 */
export async function updateAttendanceTransaction(
  transactionId: string,
  payload: UpdateAttendanceTransactionPayload
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();

    // Verificar usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const { error } = await supabase
      .from("attendance_transactions")
      .update({
        ...payload,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .is("deleted_at", null);

    if (error) throw error;

    revalidatePath("/checador");
    return {
      success: true,
      message: "Registro actualizado exitosamente",
    };
  } catch (error) {
    console.error("Error updating attendance transaction:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error al actualizar el registro",
    };
  }
}

/**
 * Elimina (soft delete) un registro de asistencia
 */
export async function deleteAttendanceTransaction(
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();

    // Verificar usuario autenticado
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const { error } = await supabase
      .from("attendance_transactions")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transactionId)
      .is("deleted_at", null);

    if (error) throw error;

    revalidatePath("/checador");
    return {
      success: true,
      message: "Registro eliminado exitosamente",
    };
  } catch (error) {
    console.error("Error deleting attendance transaction:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error al eliminar el registro",
    };
  }
}

/**
 * Obtiene el resumen diario de asistencia
 */
export async function getDailyAttendanceSummary(date: Date = new Date()) {
  try {
    const supabase = await createClient();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("attendance_transactions")
      .select(
        `
        *,
        user:users (
            id,
            email,
            full_name,
            user_code
        ),
        reason:attendance_reasons (*)
        `
      )
      .gte("ocurred_at", startOfDay.toISOString())
      .lte("ocurred_at", endOfDay.toISOString())
      .is("deleted_at", null)
      .order("ocurred_at", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error getting daily attendance summary:", error);
    return [];
  }
}

/**
 * Obtiene estadísticas de asistencia
 */
export async function getAttendanceStats(startDate: string, endDate: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_attendance_stats", {
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error getting attendance stats:", error);
    return null;
  }
}

/**
 * Función para checar entrada/salida (toggle)
 */
export async function toggleAttendance(
  userId: string,
  reasonId?: string
): Promise<{ success: boolean; message: string; data?: AttendanceTransaction }> {
  try {
    const supabase = await createClient();

    // Verificar usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // Obtener último registro del usuario
    const lastRecord = await getLastAttendanceRecord(userId);

    let eventType: string;
    
    // Determinar si es entrada o salida basado en el último evento
    if (!lastRecord || lastRecord.event_type === "check-out") {
      eventType = "check-in";
    } else {
      eventType = "check-out";
    }

    // Crear el nuevo registro
    // Si reasonId es undefined, se pasará como null y createAttendanceTransaction usará la razón por defecto
    return await createAttendanceTransaction({
      user_id: userId,
      event_type: eventType,
      attendance_reason_id: reasonId || null, // Si es undefined, pasa null
    });
  } catch (error) {
    console.error("Error toggling attendance:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al registrar asistencia"
    };
  }
}

/**
 * Obtiene todos los usuarios para el selector
 */
export async function getUsersForAttendance() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        user_metadata,
        role
      `
      )
      .eq("active", true)
      .order("full_name", { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error getting users for attendance:", error);
    return [];
  }
}

/**
 * Obtiene el historial de TODOS los registros de asistencia
 */
export async function getAttendanceHistoryAll(
  page: number = 1,
  pageSize: number = 20,
  filters?: AttendanceFilters & { user_name?: string }
): Promise<AttendanceTransactionsResponse> {
  try {
    const supabase = await createClient();

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("attendance_transactions")
      .select(
        `
        *,
        reason:attendance_reasons (*),
        user:users (
            id,
            email,
            full_name,
            user_code
        )
        `,
        { count: "exact" }
      )
      .is("deleted_at", null)
      .order("ocurred_at", { ascending: false });

    // Aplicar filtros
    if (filters) {
      if (filters.event_types && filters.event_types.length > 0) {
        query = query.in("event_type", filters.event_types);
      }

      if (filters.reason_ids && filters.reason_ids.length > 0) {
        query = query.in("attendance_reason_id", filters.reason_ids);
      }

      if (filters.start_date) {
        query = query.gte(
          "ocurred_at",
          new Date(filters.start_date).toISOString()
        );
      }

      if (filters.end_date) {
        query = query.lte(
          "ocurred_at",
          new Date(filters.end_date).toISOString()
        );
      }

      // Si se filtra por usuario específico
      if (filters.user_id) {
        query = query.eq("user_id", filters.user_id);
      }

      // Si se filtra por nombre de usuario
      if (filters.user_name) {
        query = query.ilike("users.full_name", `%${filters.user_name}%`);
      }
    }

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    return {
      transactions: data || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error("Error getting attendance history:", error);
    return {
      transactions: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Obtiene usuarios que tienen registros en attendance_transactions
 */
export async function getUsersWithAttendanceRecords() {
  try {
    const supabase = await createClient();

    // Primero obtenemos los user_ids únicos que tienen registros
    const { data: userTransactions, error: transactionsError } = await supabase
      .from("attendance_transactions")
      .select("user_id")
      .is("deleted_at", null)
      .order("user_id", { ascending: true });

    if (transactionsError) throw transactionsError;

    // Extraemos los IDs únicos
    const userIds = [...new Set(userTransactions?.map(item => item.user_id) || [])];
    
    if (userIds.length === 0) return [];

    // Ahora obtenemos la información de esos usuarios
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        user_code,
        active
      `)
      .in("id", userIds)
      .eq("active", true)
      .order("full_name", { ascending: true });

    if (usersError) throw usersError;

    return users || [];
  } catch (error) {
    console.error("Error getting users with attendance records:", error);
    return [];
  }
}

// Tipos para attendance_users
export interface AttendanceUser {
  id: string;
  user_id: string;
  contact_id: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  
  // Relaciones
  user?: {
    id: string;
    email: string;
    full_name?: string | null;
    user_code?: string | null;
    active: boolean;
  } | null;
  
  contact?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface AttendanceUsersResponse {
  attendanceUsers: AttendanceUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Obtiene usuarios registrados en attendance_users (para checador)
 */
export async function getAttendanceUsers(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  sort: string = "full_name",
  order: "asc" | "desc" = "asc"
): Promise<AttendanceUsersResponse> {
  try {
    const supabase = await createClient();
    const from = Math.max(0, (page - 1) * pageSize);

    let query = supabase
      .from("attendance_users")
      .select(
        `
        *,
        user:users!inner (
          id,
          email,
          full_name,
          user_code,
          active,
          profile_id
        )
        `,
        { count: "exact" }
      ); // Solo para attendance_users

    // Filtro de búsqueda
    if (search.trim()) {
      // Para buscar en campos del usuario relacionado
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`, {
        foreignTable: 'user'
      });
    }

    // Obtener conteo total
    const { count, error: countError } = await query;

    if (countError) {
      console.error("Error getting count:", countError);
      throw countError;
    }

    const total = count || 0;
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0;
    const actualPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
    const actualFrom = Math.max(0, (actualPage - 1) * pageSize);
    const actualTo = Math.min(actualFrom + pageSize - 1, total - 1);

    // Obtener los datos paginados
    const { data, error } = await query.range(actualFrom, actualTo);

    if (error) {
      console.error("Error fetching attendance users:", error);
      throw error;
    }

    // Ordenar manualmente los datos
    let sortedData = [...(data || [])];

    if (sort === "full_name") {
      sortedData.sort((a, b) => {
        const nameA = a.user?.full_name || "";
        const nameB = b.user?.full_name || "";
        return order === "asc"
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    } else if (sort === "email") {
      sortedData.sort((a, b) => {
        const emailA = a.user?.email || "";
        const emailB = b.user?.email || "";
        return order === "asc"
          ? emailA.localeCompare(emailB)
          : emailB.localeCompare(emailA);
      });
    } else if (sort === "created_at") {
      sortedData.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return order === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    return {
      attendanceUsers: sortedData,
      total,
      page: actualPage,
      pageSize,
      totalPages,
    };
  } catch (error) {
    console.error("Error getting attendance users:", error);
    return {
      attendanceUsers: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Obtiene usuarios disponibles para agregar al checador (usuarios que NO están en attendance_users)
 */
export async function getAvailableUsersForAttendance(): Promise<any[]> {
  try {
    const supabase = await createClient();

    // Primero, obtener IDs de usuarios que YA están en attendance_users
    const { data: existingAttendanceUsers, error: existingError } = await supabase
      .from("attendance_users")
      .select("user_id");

    if (existingError) throw existingError;

    const existingUserIds = existingAttendanceUsers?.map(au => au.user_id) || [];

    // Obtener usuarios activos que NO están en attendance_users
    let query = supabase
      .from("users")
      .select(`
        id,
        email,
        full_name,
        user_code,
        active
      `)
      .eq("active", true)
      .order("full_name", { ascending: true });

    // Si hay usuarios existentes, excluirlos
    if (existingUserIds.length > 0) {
      query = query.not("id", "in", `(${existingUserIds.join(",")})`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error getting available users for attendance:", error);
    return [];
  }
}

/**
 * Agrega un usuario al checador (crea registro en attendance_users)
 */
export async function addUserToAttendance(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();

    // Verificar usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // Verificar si el usuario ya está en attendance_users
    const { data: existing, error: existingError } = await supabase
      .from("attendance_users")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existingError && existingError.code !== "PGRST116") {
      throw existingError;
    }

    if (existing) {
      return {
        success: false,
        message: "El usuario ya tiene acceso al checador"
      };
    }

    const { data: userInfo } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    const userName = userInfo?.full_name || userInfo?.email || "el usuario";

    // Crear el registro en attendance_users
    const { error } = await supabase
      .from("attendance_users")
      .insert({
        user_id: userId,
        created_by: user.id,
        updated_by: user.id,
      });

    if (error) throw error;

    revalidatePath("/dashboard/checador-padre/usuarios-checador");
    return {
      success: true,
      message: `Se ha agregado a ${userName} al sistema de checador`
    };
  } catch (error) {
    console.error("Error adding user to attendance:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al agregar usuario al checador"
    };
  }
}

/**
 * Elimina un usuario del checador (DELETE físico en attendance_users)
 */
export async function removeUserFromAttendance(attendanceUserId: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();

    // Verificar usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    // Verificar si el registro existe antes de eliminarlo
    const { data: existingRecord, error: checkError } = await supabase
      .from("attendance_users")
      .select("id, user_id")
      .eq("id", attendanceUserId)
      .single();

    if (checkError) {
      throw new Error("Registro no encontrado");
    }

    // Obtener información del usuario para el mensaje
    const { data: userInfo } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", existingRecord.user_id)
      .single();

    const userName = userInfo?.full_name || userInfo?.email || "el usuario";

    // DELETE físico (eliminar permanentemente el registro)
    const { error } = await supabase
      .from("attendance_users")
      .delete()
      .eq("id", attendanceUserId);

    if (error) throw error;

    // Revalidar la página
    revalidatePath("/dashboard/checador-padre/usuarios-checador");
    
    return {
      success: true,
      message: `Se ha removido a ${userName} del sistema de checador`
    };
  } catch (error) {
    console.error("Error removing user from attendance:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error al remover usuario del checador"
    };
  }
}

/**
 * Verifica si un usuario está en la lista de attendance_users
 */
export async function isUserInAttendanceList(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("attendance_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error checking user in attendance list:", error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error("Error in isUserInAttendanceList:", error);
    return false;
  }
}