"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Interfaces principales
export interface AppointmentStatus {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface AppointmentStatusWithRelations extends AppointmentStatus {
  // Puedes agregar relaciones aquí si es necesario
  // Por ejemplo, contar cuántas citas tienen este estado
  appointments_count?: number;
}

export interface AppointmentStatusResponse {
  statuses: AppointmentStatus[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Types para payloads
export interface NewAppointmentStatusPayload {
  name: string;
  description?: string | null;
}

export interface UpdateAppointmentStatusPayload {
  name?: string;
  description?: string | null;
}

/**
 * Obtiene todos los estados de citas
 */
export async function getAllAppointmentStatuses(): Promise<AppointmentStatus[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointment_status")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener estados de citas:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene estados de citas con paginación
 */
export async function getAppointmentStatuses(
  page = 1,
  pageSize = 50,
  searchQuery = ""
): Promise<AppointmentStatusResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("appointment_status")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("Error al obtener estados de citas:", error);
    throw new Error(`Error al obtener estados de citas: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    statuses: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene un estado de cita por su ID
 */
export async function getAppointmentStatusById(
  statusId: string
): Promise<AppointmentStatus | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointment_status")
    .select("*")
    .eq("id", statusId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener estado de cita:", error);
    return null;
  }

  return data;
}

/**
 * Obtiene un estado de cita por su nombre
 */
export async function getAppointmentStatusByName(
  name: string
): Promise<AppointmentStatus | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointment_status")
    .select("*")
    .eq("name", name)
    .is("deleted_at", null)
    .single();

  if (error) {
    // Si no existe el registro (PGRST116), retornar null
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error al obtener estado de cita por nombre:", error);
    return null;
  }

  return data;
}
