"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface PriceList {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface CreatePriceListDTO {
  code: string;
  name: string;
  description?: string;
  active?: boolean;
}

export interface UpdatePriceListDTO {
  name?: string;
  description?: string | null;
  active?: boolean;
}

interface GetPriceListsResult {
  success: boolean;
  priceLists?: PriceList[];
  error?: string;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

// Crear lista de precios
export async function createPriceList(data: CreatePriceListDTO) {
  const supabase = await createClient();

  // Verificar si ya existe una lista con este código
  const { data: existingLists, error: fetchError } = await supabase
    .from("price_lists")
    .select("id, code, deleted_at")
    .eq("code", data.code);

  if (fetchError) {
    console.error("Error checking existing price lists:", fetchError);
    return {
      success: false,
      error: "Error al verificar el código de la lista de precios",
    };
  }

  // Filtrar listas no eliminadas
  const activeLists = existingLists?.filter((list) => !list.deleted_at) || [];

  if (activeLists.length > 0) {
    return {
      success: false,
      error: "Ya existe una lista de precios activa con este código",
    };
  }

  const priceListData = {
    code: data.code,
    name: data.name,
    description: data.description || null,
    active: data.active ?? true,
  };

  const { data: priceList, error } = await supabase
    .from("price_lists")
    .insert(priceListData)
    .select()
    .single();

  if (error) {
    console.error("Error creating price list:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    priceList,
    message: "Lista de precios creada exitosamente",
  };
}

// Obtener todas las listas de precios
export async function getPriceLists(
  page = 1,
  pageSize = 10,
  isActive?: boolean,
): Promise<GetPriceListsResult> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("price_lists")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Filtrar listas no eliminadas
  query = query.is("deleted_at", null);

  // Excluir la lista con código "default"
  query = query.neq("code", "default");

  if (isActive !== undefined) {
    query = query.eq("active", isActive);
  }

  query = query.range(from, to);
  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching price lists:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    success: true,
    priceLists: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

// Obtener una lista de precios por ID
export async function getPriceListById(
  priceListId: string,
): Promise<{ success: boolean; priceList?: PriceList; error?: string }> {
  const supabase = await createClient();

  const { data: priceList, error } = await supabase
    .from("price_lists")
    .select("*")
    .eq("id", priceListId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching price list:", error);
    return {
      success: false,
      error: "Error al cargar la lista de precios",
    };
  }

  if (!priceList) {
    return {
      success: false,
      error: "Lista de precios no encontrada",
    };
  }

  return {
    success: true,
    priceList,
  };
}

// Actualizar lista de precios
export async function updatePriceList(
  priceListId: string,
  data: UpdatePriceListDTO & { code?: string },
) {
  const supabase = await createClient();

  // Primero, verificar que la lista exista (incluso si está eliminada)
  const { data: existingList, error: fetchError } = await supabase
    .from("price_lists")
    .select("id, code, deleted_at")
    .eq("id", priceListId)
    .maybeSingle();

  if (fetchError) {
    console.error("Error fetching price list:", fetchError);
    return {
      success: false,
      error: "Error al verificar la lista de precios",
    };
  }

  if (!existingList) {
    return {
      success: false,
      error: "Lista de precios no encontrada",
    };
  }

  // Si la lista está marcada como eliminada, restaurarla
  const isRestoring = existingList.deleted_at !== null;

  // Si se incluye código, verificar que no esté en uso por OTRA lista
  if (data.code) {
    const { data: existingLists, error: codeCheckError } = await supabase
      .from("price_lists")
      .select("id, code, deleted_at")
      .eq("code", data.code)
      .neq("id", priceListId);

    if (codeCheckError) {
      console.error("Error checking existing price lists:", codeCheckError);
      return {
        success: false,
        error: "Error al verificar el código de la lista de precios",
      };
    }

    // Filtrar listas que no están eliminadas
    const activeLists =
      existingLists?.filter((list) => list.deleted_at === null) || [];

    if (activeLists.length > 0) {
      return {
        success: false,
        error: "Ya existe otra lista de precios activa con este código",
      };
    }
  }

  // Preparar datos para actualización
  const updateData: any = {
    name: data.name,
    description: data.description || null,
    active: data.active,
    updated_at: new Date().toISOString(),
  };

  // Solo añadir código si se proporciona
  if (data.code) {
    updateData.code = data.code;
  }

  // Si estamos restaurando una lista eliminada
  if (isRestoring) {
    updateData.deleted_at = null;
    updateData.deleted_by = null;
  }

  // Actualizar sin filtrar por deleted_at
  const { data: priceList, error } = await supabase
    .from("price_lists")
    .update(updateData)
    .eq("id", priceListId)
    .select()
    .single();

  if (error) {
    console.error("Error updating price list:", error);
    return {
      success: false,
      error: error.message || "Error al actualizar la lista de precios",
    };
  }

  return {
    success: true,
    priceList,
    message: isRestoring
      ? "Lista de precios restaurada y actualizada exitosamente"
      : "Lista de precios actualizada exitosamente",
  };
}

// Eliminar (soft delete) lista de precios
export async function deletePriceList(
  priceListId: string,
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    // Verificar si hay productos usando esta lista de precios
    const { data: productsUsingPriceList, error: checkError } = await supabase
      .from("products")
      .select("id, name")
      .eq("price_list_id", priceListId)
      .is("deleted_at", null)
      .limit(1);

    if (checkError) {
      console.error("Error checking price list usage:", checkError);
    }

    if (productsUsingPriceList && productsUsingPriceList.length > 0) {
      return {
        success: false,
        message:
          "No se puede eliminar la lista de precios porque está siendo usada en productos",
      };
    }

    // Realizar soft delete
    const { error } = await supabase
      .from("price_lists")
      .update({
        active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", priceListId)
      .is("deleted_at", null);

    if (error) {
      console.error("Error deleting price list:", error);
      return {
        success: false,
        message: `Error al eliminar la lista de precios: ${error.message}`,
      };
    }

    // Revalidar rutas
    revalidatePath("/dashboard/listas-precios");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error deleting price list:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}

// Restaurar lista de precios eliminada
export async function restorePriceList(priceListId: string) {
  const supabase = await createClient();

  const { data: priceList, error } = await supabase
    .from("price_lists")
    .update({
      deleted_at: null,
      deleted_by: null,
    })
    .eq("id", priceListId)
    .select()
    .single();

  if (error) {
    console.error("Error restoring price list:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    priceList,
    message: "Lista de precios restaurada exitosamente",
  };
}

// Cambiar estado de lista de precios
export async function togglePriceListStatus(priceListId: string) {
  const supabase = await createClient();

  // Primero obtener el estado actual
  const { data: priceList, error: fetchError } = await supabase
    .from("price_lists")
    .select("active")
    .eq("id", priceListId)
    .single();

  if (fetchError) {
    console.error("Error fetching price list:", fetchError);
    return {
      success: false,
      error: "Lista de precios no encontrada",
    };
  }

  // Actualizar el estado
  const { data: updatedList, error } = await supabase
    .from("price_lists")
    .update({ active: !priceList.active })
    .eq("id", priceListId)
    .select()
    .single();

  if (error) {
    console.error("Error updating price list status:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    priceList: updatedList,
    message: `Lista de precios ${updatedList.active ? "activada" : "desactivada"} exitosamente`,
  };
}

// Obtener listas de precios activas para selectores
// NOTA: A diferencia de getPriceLists, este método SÍ incluye la lista "default"
export async function getActivePriceLists(): Promise<
  Array<{ id: string; code: string; name: string }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("price_lists")
    .select("id, code, name")
    .eq("active", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching active price lists:", error);
    return [];
  }

  return data || [];
}

// MÉTODOS PARA MANEJAR LISTA DE PRECIOS DE USUARIOS

/**
 * Obtiene la lista de precios asignada a un usuario específico
 * Si el usuario no tiene lista asignada, retorna el ID de la lista "default"
 */
export async function getUserPriceList(userId: string): Promise<string | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("users")
      .select("price_list")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user price list:", error);
      return null;
    }

    // Si el usuario no tiene price_list, buscar la lista "default"
    if (!data?.price_list) {
      const { data: defaultPriceList } = await supabase
        .from("price_lists")
        .select("id")
        .eq("code", "default")
        .is("deleted_at", null)
        .single();

      return defaultPriceList?.id || null;
    }

    return data.price_list;
  } catch (err) {
    console.error(
      "Error inesperado al obtener lista de precios del usuario:",
      err,
    );
    return null;
  }
}

/**
 * Actualiza la lista de precios asignada a un usuario
 * Incluye validación de que la lista existe y está activa
 */
export async function updateUserPriceList(
  userId: string,
  priceListId: string | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Si se proporciona un priceListId, verificar que existe y está activa
    if (priceListId) {
      const { data: priceList, error: priceListError } = await supabase
        .from("price_lists")
        .select("id, active, deleted_at")
        .eq("id", priceListId)
        .single();

      if (priceListError || !priceList) {
        return {
          success: false,
          error: "La lista de precios seleccionada no existe",
        };
      }

      if (!priceList.active || priceList.deleted_at) {
        return {
          success: false,
          error: "La lista de precios seleccionada no está activa",
        };
      }
    }

    const { error } = await supabase
      .from("users")
      .update({
        price_list: priceListId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("Error updating user price list:", error);
      return {
        success: false,
        error: "Error al actualizar la lista de precios del usuario",
      };
    }

    return { success: true };
  } catch (err) {
    console.error("Error inesperado al actualizar lista de precios:", err);
    return {
      success: false,
      error: "Error inesperado del servidor",
    };
  }
}
