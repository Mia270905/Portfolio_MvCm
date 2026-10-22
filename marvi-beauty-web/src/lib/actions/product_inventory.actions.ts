"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProductInventory {
  id: string;
  id_inventory: string;
  id_product: string;
  quantity: number;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

export interface ProductInventoryWithRelations extends ProductInventory {
  product?: {
    id: string;
    name: string;
    code: string;
    bar_code: string;
  };
  location?: {
    id: string;
    code: string;
    name: string;
    description: string;
  };
}

/**
 * Obtiene el stock de un producto en una ubicación específica
 */
export async function getProductStockByLocation(
  productId: string,
  locationId: string
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_inventory")
    .select("quantity")
    .eq("id_product", productId)
    .eq("id_inventory", locationId)
    .single();

  if (error) {
    // Si no existe el registro (PGRST116), retornar 0
    if (error.code === "PGRST116") {
      return 0;
    }
    console.error("Error al obtener stock por ubicación:", error);
    return 0;
  }

  return data?.quantity || 0;
}

/**
 * Obtiene el stock total de un producto sumando todas las ubicaciones
 */
export async function getTotalProductStock(productId: string): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_inventory")
    .select("quantity")
    .eq("id_product", productId);

  if (error) {
    console.error("Error al obtener stock total:", error);
    return 0;
  }

  return data?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
}

/**
 * Crea o actualiza el stock de un producto en una ubicación específica
 */
export async function upsertProductInventory(
  productId: string,
  locationId: string,
  quantity: number,
  userId: string
): Promise<{
  success: boolean;
  message?: string;
  inventory?: ProductInventory;
}> {
  try {
    const supabase = await createClient();

    // Validar cantidad no negativa
    if (quantity < 0) {
      return {
        success: false,
        message: "La cantidad no puede ser negativa",
      };
    }

    // Validar que el producto existe
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name")
      .eq("id", productId)
      .is("deleted_at", null)
      .single();

    if (productError || !product) {
      return {
        success: false,
        message: "Producto no encontrado",
      };
    }

    // Validar que la ubicación existe
    const { data: location, error: locationError } = await supabase
      .from("inventories_locations")
      .select("id, name")
      .eq("id", locationId)
      .is("deleted_at", null)
      .single();

    if (locationError || !location) {
      return {
        success: false,
        message: "Ubicación no encontrada",
      };
    }

    const now = new Date().toISOString();

    // ✅ Usar UPSERT de PostgreSQL
    const { data, error } = await supabase
      .from("product_inventory")
      .upsert(
        {
          id_product: productId,
          id_inventory: locationId,
          quantity: quantity,
          created_by: userId,
          created_at: now,
          updated_by: userId,
          updated_at: now,
        },
        {
          onConflict: "id_product,id_inventory",
          ignoreDuplicates: false,
        }
      )
      .select();
      console.log("Upsert Product Inventory Data:", data, "Error:", error);
    if (error) {
      console.error("❌ Error en UPSERT:", error);
      return {
        success: false,
        message: `Error al guardar stock: ${error.message}`,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        message: "No se pudo guardar el registro de inventario",
      };
    }

    // Actualizar products.quantity con el total
    await syncProductTotalStock(productId, userId);

    return {
      success: true,
      message: `Stock actualizado en ${location.name}`,
      inventory: data[0] as ProductInventory,
    };
  } catch (error: any) {
    console.error("❌ Error en upsertProductInventory:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}

/**
 * Incrementa o decrementa el stock en una ubicación específica
 */
export async function adjustProductInventory(
  productId: string,
  locationId: string,
  adjustment: number, // Positivo para sumar, negativo para restar
  userId: string
): Promise<{
  success: boolean;
  message?: string;
  newQuantity?: number;
  inventory?: ProductInventory;
}> {
  try {
    const supabase = await createClient();

    // Obtener stock actual en la ubicación
    const currentStock = await getProductStockByLocation(productId, locationId);

    // Calcular nuevo stock
    const newQuantity = currentStock + adjustment;

    // Validar que no sea negativo
    if (newQuantity < 0) {
      const { data: location } = await supabase
        .from("inventories_locations")
        .select("name")
        .eq("id", locationId)
        .single();

      return {
        success: false,
        message: `Stock insuficiente en ${location?.name || "esta ubicación"}. Stock actual: ${currentStock}, ajuste solicitado: ${adjustment}`,
      };
    }

    // Actualizar stock
    const result = await upsertProductInventory(
      productId,
      locationId,
      newQuantity,
      userId
    );
    console.log("Adjust Product Inventory Result:", result);
    return {
      ...result,
      newQuantity: newQuantity,
    };
  } catch (error: any) {
    console.error("Error en adjustProductInventory:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}

/**
 * Sincroniza products.quantity con la suma de product_inventory
 */
export async function syncProductTotalStock(
  productId: string,
  userId: string
): Promise<{ success: boolean; totalStock?: number }> {
  try {
    const supabase = await createClient();

    // Calcular stock total
    const totalStock = await getTotalProductStock(productId);

    // Actualizar products.quantity
    const { error } = await supabase
      .from("products")
      .update({
        quantity: totalStock,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (error) {
      console.error("Error al sincronizar stock total:", error);
      return { success: false };
    }

    revalidatePath("/dashboard/productos");
    revalidatePath("/dashboard/inventarios");

    return { success: true, totalStock };
  } catch (error: any) {
    console.error("Error en syncProductTotalStock:", error);
    return { success: false };
  }
}

/**
 * Obtiene todos los inventarios de un producto (stock por ubicación)
 */
export async function getProductInventoryByProduct(
  productId: string
): Promise<ProductInventoryWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_inventory")
    .select(
      `
      *,
      products!inner (
        id,
        name,
        code,
        bar_code
      ),
      inventories_locations!inner (
        id,
        code,
        name,
        description
      )
    `
    )
    .eq("id_product", productId)
    .order("inventories_locations(name)", { ascending: true });

  if (error) {
    console.error("Error al obtener inventarios por producto:", error);
    return [];
  }

  return (
    data?.map((item: any) => ({
      id: item.id,
      id_inventory: item.id_inventory,
      id_product: item.id_product,
      quantity: item.quantity || 0,
      created_by: item.created_by,
      created_at: item.created_at,
      updated_by: item.updated_by,
      updated_at: item.updated_at,
      product: item.products
        ? {
            id: item.products.id,
            name: item.products.name,
            code: item.products.code,
            bar_code: item.products.bar_code,
          }
        : undefined,
      location: item.inventories_locations
        ? {
            id: item.inventories_locations.id,
            code: item.inventories_locations.code,
            name: item.inventories_locations.name,
            description: item.inventories_locations.description,
          }
        : undefined,
    })) || []
  );
}

/**
 * Obtiene todos los productos con su stock en una ubicación específica
 */
export async function getProductsInventoryByLocation(
  locationId: string
): Promise<ProductInventoryWithRelations[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_inventory")
    .select(
      `
      *,
      products!inner (
        id,
        name,
        code,
        bar_code
      ),
      inventories_locations!inner (
        id,
        code,
        name,
        description
      )
    `
    )
    .eq("id_inventory", locationId)
    .order("products(name)", { ascending: true });

  if (error) {
    console.error("Error al obtener productos por ubicación:", error);
    return [];
  }

  return (
    data?.map((item: any) => ({
      id: item.id,
      id_inventory: item.id_inventory,
      id_product: item.id_product,
      quantity: item.quantity || 0,
      created_by: item.created_by,
      created_at: item.created_at,
      updated_by: item.updated_by,
      updated_at: item.updated_at,
      product: item.products
        ? {
            id: item.products.id,
            name: item.products.name,
            code: item.products.code,
            bar_code: item.products.bar_code,
          }
        : undefined,
      location: item.inventories_locations
        ? {
            id: item.inventories_locations.id,
            code: item.inventories_locations.code,
            name: item.inventories_locations.name,
            description: item.inventories_locations.description,
          }
        : undefined,
    })) || []
  );
}


/**
 * Elimina un registro de product_inventory (soft delete si tienes deleted_at, o hard delete)
 */
export async function deleteProductInventory(
  inventoryId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = await createClient();

    // Obtener info antes de eliminar para sincronizar después
    const { data: inventory } = await supabase
      .from("product_inventory")
      .select("id_product")
      .eq("id", inventoryId)
      .single();

    if (!inventory) {
      return { success: false, message: "Registro no encontrado" };
    }

    // Hard delete (no tienes deleted_at en product_inventory según tu estructura)
    const { error } = await supabase
      .from("product_inventory")
      .delete()
      .eq("id", inventoryId);

    if (error) {
      return {
        success: false,
        message: `Error al eliminar: ${error.message}`,
      };
    }

    // Obtener usuario actual para sincronizar
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Sincronizar el stock total del producto
      await syncProductTotalStock(inventory.id_product, user.id);
    }

    revalidatePath("/dashboard/productos");
    revalidatePath("/dashboard/inventarios");

    return { success: true, message: "Registro eliminado correctamente" };
  } catch (error: any) {
    console.error("Error en deleteProductInventory:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}

/**
 * Valida si hay stock suficiente en una ubicación para una cantidad específica
 */
export async function validateStockAvailability(
  productId: string,
  locationId: string,
  requiredQuantity: number
): Promise<{
  available: boolean;
  currentStock: number;
  message?: string;
}> {
  const currentStock = await getProductStockByLocation(productId, locationId);

  if (currentStock >= requiredQuantity) {
    return {
      available: true,
      currentStock,
    };
  }

  return {
    available: false,
    currentStock,
    message: `Stock insuficiente. Disponible: ${currentStock}, Requerido: ${requiredQuantity}`,
  };
}

/**
 * Obtiene una ubicación por su código
 */
export async function getLocationByCode(code: string): Promise<{
  id: string;
  code: string;
  name: string;
  description: string;
} | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_locations")
    .select("id, code, name, description")
    .eq("code", code)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error(`Error al obtener ubicación con código ${code}:`, error);
    return null;
  }

  return data;
}

/**
 * Obtiene el stock de un producto en una ubicación por código
 */
export async function getProductStockByLocationCode(
  productId: string,
  locationCode: string
): Promise<number> {
  const supabase = await createClient();

  // Primero obtener la ubicación
  const location = await getLocationByCode(locationCode);
  if (!location) {
    return 0;
  }

  // Luego obtener el stock
  const { data, error } = await supabase
    .from("product_inventory")
    .select("quantity")
    .eq("id_product", productId)
    .eq("id_inventory", location.id)
    .single();

  if (error) {
    // Si no existe el registro (PGRST116), retornar 0
    if (error.code === "PGRST116") {
      return 0;
    }
    console.error("Error al obtener stock por ubicación:", error);
    return 0;
  }

  return data?.quantity || 0;
}