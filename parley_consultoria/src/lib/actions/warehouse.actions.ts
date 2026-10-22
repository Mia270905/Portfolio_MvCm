"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "../supabase/server";
import { getCurrentUser } from "./user.actions";

export interface NewInventoryLocationPayload {
  code: string;
  name: string;
  description?: string;
  sucursal_id?: string;
  is_write_protected?: boolean;
}

export interface InventoryLocationResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
  is_write_protected: boolean;
  sucursal_id: string | null;
}

// Función auxiliar para verificar duplicados solo por código
async function checkDuplicateWarehouseCode(
  code: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createClient();

  let query = supabase
    .from("inventories_locations")
    .select("code")
    .eq("code", code)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error checking duplicate code:", error);
    return false;
  }

  return data.length > 0;
}

export async function createInventoryLocation(
  locationData: NewInventoryLocationPayload,
): Promise<
  | { success: true; data: any }
  | { success: false; field: "code"; message: string }
> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  // Verificar duplicados solo por código antes de crear
  const duplicateCode = await checkDuplicateWarehouseCode(locationData.code);

  if (duplicateCode) {
    return {
      success: false,
      field: "code",
      message: "El código ingresado ya se encuentra registrado.",
    };
  }

  const payload = {
    ...locationData,
    created_by: currentUser?.data?.user?.id,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("inventories_locations")
    .insert([payload])
    .select();

  if (error) {
    console.error("Error creating inventory location:", error);

    if (error.code === "23505") {
      if (error.message.includes("inventories_locations_code_key")) {
        return {
          success: false,
          field: "code",
          message: "El código ingresado ya se encuentra registrado.",
        };
      }
    }

    return {
      success: false,
      field: "code",
      message: "No se pudo crear el almacén. Intente de nuevo.",
    };
  }

  revalidatePath("/dashboard/inventarios/almacenes");
  return { success: true, data };
}

export async function getInventoryLocations(
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  sortBy: "code" | "name" | "created_at" = "name",
  sortOrder: "asc" | "desc" = "asc",
) {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("inventories_locations")
    .select(
      "id, code, name, description, is_write_protected, sucursal_id, created_at",
      {
        count: "exact",
      },
    )
    .is("deleted_at", null)
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (search.trim()) {
    query = query.or(
      `name.ilike.%${search}%, code.ilike.%${search}%, description.ilike.%${search}%`,
    );
  }

  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching inventory locations:", error);
    throw new Error("Error al cargar ubicaciones de inventario");
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    locations: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

export async function getOneInventoryLocation(
  locationId: string,
): Promise<any> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_locations")
    .select(`*`)
    .eq("id", locationId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    return {};
  }

  return data;
}

export async function updateInventoryLocation(
  locationId: string,
  locationData: NewInventoryLocationPayload,
): Promise<
  { success: true } | { success: false; field: "code"; message: string }
> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  // Verificar duplicados solo por código excluyendo el actual
  const duplicateCode = await checkDuplicateWarehouseCode(
    locationData.code,
    locationId,
  );

  if (duplicateCode) {
    return {
      success: false,
      field: "code",
      message: "El código ingresado ya se encuentra registrado.",
    };
  }

  const { error } = await supabase
    .from("inventories_locations")
    .update({
      ...locationData,
      updated_by: currentUser?.data?.user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", locationId);

  if (error) {
    console.error("Error updating inventory location:", error);

    if (error.code === "23505") {
      if (error.message.includes("inventories_locations_code_key")) {
        return {
          success: false,
          field: "code",
          message: "El código ingresado ya se encuentra registrado.",
        };
      }
    }

    return {
      success: false,
      field: "code",
      message: "No se pudo actualizar el almacén. Intente de nuevo.",
    };
  }

  revalidatePath("/dashboard/inventarios/almacenes");
  return { success: true };
}

export async function deleteInventoryLocation(
  locationId: string,
  confirmationCode: string,
): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const { data: locationData, error: fetchError } = await supabase
    .from("inventories_locations")
    .select("code")
    .eq("id", locationId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !locationData) {
    return {
      success: false,
      message: "No se encontró el almacén.",
    };
  }

  if (locationData.code !== confirmationCode) {
    return {
      success: false,
      message: "El código ingresado no coincide.",
    };
  }

  // Eliminación directa sin verificar inventario asociado
  const { error } = await supabase
    .from("inventories_locations")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: currentUser?.data?.user?.id,
    })
    .eq("id", locationId);

  if (error) {
    console.error("Error deleting inventory location:", error);
    return {
      success: false,
      message: "No se pudo eliminar el almacén. Intente de nuevo.",
    };
  }

  revalidatePath("/dashboard/inventarios/almacenes");
  return { success: true };
}

export async function getActiveInventoryLocations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_locations")
    .select("id, code, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching active inventory locations:", error);
    throw new Error("Error al cargar ubicaciones activas");
  }

  return data || [];
}

export async function checkLocationCodeAvailability(
  code: string,
  excludeId?: string,
): Promise<{ available: boolean }> {
  const supabase = await createClient();

  let query = supabase
    .from("inventories_locations")
    .select("id")
    .eq("code", code)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking code availability:", error);
    return { available: false };
  }

  return { available: !data };
}
