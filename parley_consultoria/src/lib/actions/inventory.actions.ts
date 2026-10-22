"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  adjustProductInventory,
  getLocationByCode,
} from "@/lib/actions/product_inventory.actions"

export interface InventoryMovement {
  id: string;
  product_id: string;
  quantity: number;
  from_location: string;
  to_location: string;
  inventory_movement_id: string | null;
  movement_type:
    | "purchase"
    | "sale"
    | "transfer"
    | "adjustment"
    | "loss"
    | "return"
    | "initial"
    | "production";
  // movement_number: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  product?: {
    id: string;
    name: string;
    code: string;
    bar_code: string;
    quantity?: number;
  };
  from_location_data?: {
    id: string;
    name: string;
    code: string;
  };
  to_location_data?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface InventoryLocation {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
}

export interface LocationForSelector {
  id: string;
  code: string;
  name: string;
  description: string;
}

/**
 * Interfaz para movimientos agrupados
 */
export interface GroupedInventoryMovement {
  id: string;
  inventory_movement_id: string | null;
  related_movement_id: string | null;
  movements: InventoryMovement[];
  total_quantity: number;
  total_products: number;
  created_at: string;
  movement_type: string;
  // movement_number: string | null;
  notes: string | null;
  from_location?: string;
  to_location?: string;
  from_location_data?: any;
  to_location_data?: any;
  order_number?: string | null;
}

/**
 * Obtiene todas las ubicaciones de inventario (excluyendo Sucursal 1 como destino)
 */

export async function getExitLocations(): Promise<LocationForSelector[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_locations")
    .select("id, code, name, description")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener ubicaciones:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene todas las ubicaciones (incluyendo todas para mostrar)
 */
export async function getAllLocations(): Promise<InventoryLocation[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_locations")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener ubicaciones:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene productos con su stock calculado
 */
export async function getProductsWithStock(
  page = 1,
  pageSize = 1000,
  searchQuery = "",
  locationId?: string,
): Promise<{ products: any[]; total: number }> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(
      `
       *,
       product_categories!category_id (title)
     `,
      { count: "exact" },
    )
    .is("deleted_at", null);

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,bar_code.ilike.%${searchQuery}%`,
    );
  }

  const { data: products, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Error al obtener productos: ${error.message}`);
  }

  if (!products || products.length === 0) {
    return {
      products: [],
      total: count || 0,
    };
  }

  // Obtener el stock por ubicación para cada producto
  const productsWithStock = await Promise.all(
    products.map(async (product) => {
      let locationStock = 0;
      let totalStock = product.quantity || 0;

      if (locationId) {
        try {
          // Obtener stock específico de la ubicación
          const { data: inventoryRecord, error: inventoryError } =
            await supabase
              .from("product_inventory")
              .select("quantity")
              .eq("id_product", product.id)
              .eq("id_inventory", locationId)
              .single();

          if (!inventoryError && inventoryRecord) {
            locationStock = inventoryRecord.quantity || 0;
          }
        } catch (error) {
          console.warn(
            `No se encontró stock para producto ${product.id} en ubicación ${locationId}`,
          );
          locationStock = 0;
        }
      }

      return {
        ...product,
        quantity: locationId ? locationStock : totalStock,
        total_quantity: totalStock,
        location_stock: locationStock,
      };
    }),
  );

  return {
    products: productsWithStock,
    total: count || 0,
  };
}

/**
 * Registra una salida de inventario
 * | "sale"
    | "transfer"
    | "adjustment"
    | "loss"
    | "return"
    | "initial"
    | "production";
 */
export async function createInventoryExit(formData: {
  entries: Array<{
    product_id: string;
    quantity: number;
  }>;
  movement_type: "sale" | "transfer" | "adjustment" | "loss" | "return" | "initial" | "production" | "purchase";
  from_location: string;
  to_location: string;
  inventory_movement_id?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
  movement_id?: string;
  failedEntries?: Array<{ product_id: string; error: string }>;
  inventory_movement_id?: string;
}> {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // Validar que hay al menos una entrada
    if (!formData.entries || formData.entries.length === 0) {
      return { success: false, message: "No hay productos para registrar" };
    }

    // Validar que las ubicaciones existen
    const { data: fromLocation, error: fromLocationError } = await supabase
      .from("inventories_locations")
      .select("id, name, code")
      .eq("id", formData.from_location)
      .is("deleted_at", null)
      .single();

    if (fromLocationError || !fromLocation) {
      return { success: false, message: "Ubicación de origen no válida" };
    }

    const { data: toLocation, error: toLocationError } = await supabase
      .from("inventories_locations")
      .select("id, name, code")
      .eq("id", formData.to_location)
      .is("deleted_at", null)
      .single();

    if (toLocationError || !toLocation) {
      return { success: false, message: "Ubicación de destino no válida" };
    }

    // Verificar stock de TODOS los productos ANTES de crear el movimiento
    const failedEntries: Array<{ product_id: string; error: string }> = [];
    const stockCheckPromises = formData.entries.map(async (entry) => {
      try {
        // Verificar stock disponible en la ubicación de origen
        const { data: inventoryRecord, error: inventoryError } = await supabase
          .from("product_inventory")
          .select("quantity")
          .eq("id_product", entry.product_id)
          .eq("id_inventory", formData.from_location)
          .single();

        if (inventoryError) {
          throw new Error("No se pudo verificar el stock disponible");
        }

        const currentLocationStock = inventoryRecord?.quantity || 0;

        if (entry.quantity > currentLocationStock) {
          throw new Error(
            `Stock insuficiente. Disponible: ${currentLocationStock}`,
          );
        }

        return { success: true, product_id: entry.product_id };
      } catch (error: any) {
        return {
          success: false,
          product_id: entry.product_id,
          error: error.message,
        };
      }
    });

    const stockCheckResults = await Promise.all(stockCheckPromises);

    // Filtrar productos que no pasaron la validación de stock
    stockCheckResults.forEach((result) => {
      if (!result.success) {
        failedEntries.push({
          product_id: result.product_id,
          error: result.error,
        });
      }
    });

    // Si TODOS los productos fallaron en la validación de stock, no crear movimiento
    if (failedEntries.length === formData.entries.length) {
      return {
        success: false,
        message: "Todos los productos tienen stock insuficiente",
        failedEntries,
      };
    }

    // Filtrar solo los productos que pasaron la validación
    const validEntries = formData.entries.filter(
      (entry) =>
        !failedEntries.some((failed) => failed.product_id === entry.product_id),
    );

    // 1. Crear el movimiento general
    const movementData: any = {
      created_by: user.id,
      updated_by: user.id,
      from_location: formData.from_location,
      to_location: formData.to_location,
      movement_type: formData.movement_type,
      notes: formData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Solo agregar related_movement_id si se proporciona (para movimientos automáticos)
    if (formData.inventory_movement_id) {
      movementData.related_movement_id = formData.inventory_movement_id;
    }

    const { data: movement, error: movementError } = await supabase
      .from("inventories_movements")
      .insert([movementData])
      .select("id, related_movement_id")
      .single();

    if (movementError) {
      return {
        success: false,
        message: `Error al crear movimiento: ${movementError.message}`,
      };
    }

    const movementId = movement.id;
    const actualRelatedMovementId = movement.related_movement_id;

    const processFailedEntries: Array<{ product_id: string; error: string }> =
      [];
    const successfulEntries: Array<{ product_id: string; quantity: number }> =
      [];

    // 2. Procesar cada producto válido en la tabla de detalles
    for (const entry of validEntries) {
      try {
        // Validar que el producto existe
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("id, name, code, bar_code")
          .eq("id", entry.product_id)
          .is("deleted_at", null)
          .single();

        if (productError || !product) {
          throw new Error("Producto no encontrado");
        }

        // 3. Crear el registro en inventories_movements_details
        // IMPORTANTE: Para movimientos manuales, usar movementId como inventory_movement_id en los detalles
        const detailData = {
          inventory_movement_id: movementId,
          product_id: entry.product_id,
          quantity: entry.quantity,
        };

        const { error: detailError } = await supabase
          .from("inventories_movements_details")
          .insert([detailData]);

        if (detailError) {
          throw new Error(`Error al guardar detalle: ${detailError.message}`);
        }

        // 4. Actualizar el inventario (restar stock)
        const adjustResult = await adjustProductInventory(
          entry.product_id,
          formData.from_location,
          -entry.quantity,
          user.id,
        );

        if (!adjustResult.success) {
          throw new Error(adjustResult.message || "Error al actualizar stock");
        }

        successfulEntries.push({
          product_id: entry.product_id,
          quantity: entry.quantity,
        });
      } catch (error: any) {
        processFailedEntries.push({
          product_id: entry.product_id,
          error: error.message,
        });
      }
    }

    // Combinar errores de validación de stock con errores de procesamiento
    const allFailedEntries = [...failedEntries, ...processFailedEntries];

    // Verificar si al menos un producto se procesó correctamente
    if (successfulEntries.length > 0) {
      let message = "";

      if (allFailedEntries.length === 0) {
        message = `Salida registrada exitosamente. ${successfulEntries.length} producto(s) procesado(s).`;
      } else {
        message = `Salida parcialmente registrada. ${successfulEntries.length} exitoso(s), ${allFailedEntries.length} fallido(s).`;
      }

      revalidatePath("/dashboard/inventarios");
      revalidatePath("/dashboard/inventarios/movimientos");
      revalidatePath("/dashboard/productos");

      return {
        success: true,
        message,
        movement_id: movementId,
        // Solo retornar inventory_movement_id si existe (para movimientos automáticos)
        inventory_movement_id: actualRelatedMovementId || undefined,
        failedEntries:
          allFailedEntries.length > 0 ? allFailedEntries : undefined,
      };
    } else {
      // Si TODOS los productos fallaron después de crear el movimiento, eliminarlo
      await supabase
        .from("inventories_movements")
        .delete()
        .eq("id", movementId);

      return {
        success: false,
        message: "No se pudo registrar ningún producto",
        failedEntries: allFailedEntries,
      };
    }
  } catch (error: any) {
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Registra un traspaso de inventario
 */
export async function createInventoryTranfer(formData: {
  entries: Array<{
    product_id: string;
    quantity: number;
  }>;
  movement_type: "sale" | "transfer" | "adjustment" | "loss" | "return" | "initial " | "production" | "purchase";
  from_location: string;
  to_location: string;
  inventory_movement_id?: string; // Para movimientos relacionados con ventas/pedidos
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
  movement_id?: string;
  failedEntries?: Array<{ product_id: string; error: string }>;
  inventory_movement_id?: string;
}> {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // Validar que hay al menos una entrada
    if (!formData.entries || formData.entries.length === 0) {
      return { success: false, message: "No hay productos para traspasar" };
    }

    // Validar que las ubicaciones existen
    const { data: fromLocation, error: fromLocationError } = await supabase
      .from("inventories_locations")
      .select("id, name, code")
      .eq("id", formData.from_location)
      .is("deleted_at", null)
      .single();

    if (fromLocationError || !fromLocation) {
      return { success: false, message: "Ubicación de origen no válida" };
    }

    const { data: toLocation, error: toLocationError } = await supabase
      .from("inventories_locations")
      .select("id, name, code")
      .eq("id", formData.to_location)
      .is("deleted_at", null)
      .single();

    if (toLocationError || !toLocation) {
      return { success: false, message: "Ubicación de destino no válida" };
    }

    // Verificar stock de TODOS los productos ANTES de crear el movimiento
    const failedEntries: Array<{ product_id: string; error: string }> = [];
    const stockCheckPromises = formData.entries.map(async (entry) => {
      try {
        // Verificar stock disponible en la ubicación de origen
        const { data: inventoryRecord, error: inventoryError } = await supabase
          .from("product_inventory")
          .select("quantity")
          .eq("id_product", entry.product_id)
          .eq("id_inventory", formData.from_location)
          .single();

        if (inventoryError) {
          throw new Error("No se pudo verificar el stock disponible");
        }

        const currentLocationStock = inventoryRecord?.quantity || 0;

        if (entry.quantity > currentLocationStock) {
          throw new Error(
            `Stock insuficiente. Disponible: ${currentLocationStock}`,
          );
        }

        return { success: true, product_id: entry.product_id };
      } catch (error: any) {
        return {
          success: false,
          product_id: entry.product_id,
          error: error.message,
        };
      }
    });

    const stockCheckResults = await Promise.all(stockCheckPromises);

    // Filtrar productos que no pasaron la validación de stock
    stockCheckResults.forEach((result) => {
      if (!result.success) {
        failedEntries.push({
          product_id: result.product_id,
          error: result.error,
        });
      }
    });

    // Si TODOS los productos fallaron en la validación de stock, no crear movimiento
    if (failedEntries.length === formData.entries.length) {
      return {
        success: false,
        message: "Todos los productos tienen stock insuficiente",
        failedEntries,
      };
    }

    // Filtrar solo los productos que pasaron la validación
    const validEntries = formData.entries.filter(
      (entry) =>
        !failedEntries.some((failed) => failed.product_id === entry.product_id),
    );

    // 1. Crear el movimiento general
    const movementData: any = {
      created_by: user.id,
      updated_by: user.id,
      from_location: formData.from_location,
      to_location: formData.to_location,
      movement_type: formData.movement_type,
      notes: formData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Solo agregar related_movement_id si se proporciona
    if (formData.inventory_movement_id) {
      movementData.related_movement_id = formData.inventory_movement_id;
    }

    const { data: movement, error: movementError } = await supabase
      .from("inventories_movements")
      .insert([movementData])
      .select("id, related_movement_id")
      .single();

    if (movementError) {
      return {
        success: false,
        message: `Error al crear movimiento: ${movementError.message}`,
      };
    }

    const movementId = movement.id;
    const actualRelatedMovementId = movement.related_movement_id;

    const processFailedEntries: Array<{ product_id: string; error: string }> =
      [];
    const successfulEntries: Array<{ product_id: string; quantity: number }> =
      [];

    // 2. Procesar cada producto válido en la tabla de detalles
    for (const entry of validEntries) {
      try {
        // Validar que el producto existe
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("id, name, code, bar_code")
          .eq("id", entry.product_id)
          .is("deleted_at", null)
          .single();

        if (productError || !product) {
          throw new Error("Producto no encontrado");
        }

        // 3. Crear el registro en inventories_movements_details
        const detailData = {
          inventory_movement_id: movementId,
          product_id: entry.product_id,
          quantity: entry.quantity,
        };

        const { error: detailError } = await supabase
          .from("inventories_movements_details")
          .insert([detailData]);

        if (detailError) {
          throw new Error(`Error al guardar detalle: ${detailError.message}`);
        }

        // 4. Actualizar el inventario (restar stock del origen)
        const adjustResultFrom = await adjustProductInventory(
          entry.product_id,
          formData.from_location,
          -entry.quantity,
          user.id,
        );

        if (!adjustResultFrom.success) {
          throw new Error(
            adjustResultFrom.message || "Error al actualizar stock de origen",
          );
        }

        // 5. Actualizar el inventario (sumar stock al destino)
        const adjustResultTo = await adjustProductInventory(
          entry.product_id,
          formData.to_location,
          entry.quantity,
          user.id,
        );

        if (!adjustResultTo.success) {
          // Si falla agregar al destino, revertir la resta del origen
          await adjustProductInventory(
            entry.product_id,
            formData.from_location,
            entry.quantity, // Revertir la resta
            user.id,
          );
          throw new Error(
            adjustResultTo.message || "Error al actualizar stock de destino",
          );
        }

        successfulEntries.push({
          product_id: entry.product_id,
          quantity: entry.quantity,
        });
      } catch (error: any) {
        processFailedEntries.push({
          product_id: entry.product_id,
          error: error.message,
        });
      }
    }

    // Combinar errores de validación de stock con errores de procesamiento
    const allFailedEntries = [...failedEntries, ...processFailedEntries];

    // Verificar si al menos un producto se procesó correctamente
    if (successfulEntries.length > 0) {
      let message = "";

      if (allFailedEntries.length === 0) {
        message = `Traspaso registrado exitosamente. ${successfulEntries.length} producto(s) procesado(s).`;
      } else {
        message = `Traspaso parcialmente registrado. ${successfulEntries.length} exitoso(s), ${allFailedEntries.length} fallido(s).`;
      }

      revalidatePath("/dashboard/inventarios");
      revalidatePath("/dashboard/inventarios/movimientos");
      revalidatePath("/dashboard/productos");

      return {
        success: true,
        message,
        movement_id: movementId,
        // Solo retornar inventory_movement_id si existe (para movimientos automáticos)
        inventory_movement_id: actualRelatedMovementId || undefined,
        failedEntries:
          allFailedEntries.length > 0 ? allFailedEntries : undefined,
      };
    } else {
      // Si TODOS los productos fallaron después de crear el movimiento, eliminarlo
      await supabase
        .from("inventories_movements")
        .delete()
        .eq("id", movementId);

      return {
        success: false,
        message: "No se pudo registrar ningún producto",
        failedEntries: allFailedEntries,
      };
    }
  } catch (error: any) {
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Obtiene todos los productos para filtros (simplificado)
 */
export async function getAllProductsForFilters(): Promise<
  Array<{
    id: string;
    name: string;
    code: string;
  }>
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id, name, code")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene TODOS los movimientos de inventario (sin paginación en servidor)
 */
export async function getInventoryMovements(filters?: {
  movement_type?: string;
  from_location?: string;
  to_location?: string;
  date_from?: string;
  date_to?: string;
  product_id?: string;
  search?: string;
}): Promise<InventoryMovement[]> {
  const supabase = await createClient();

  // Construir consulta base SIN paginación
  let query = supabase.from("inventories_movements").select("*");

  // Aplicar filtros si están presentes
  if (filters?.movement_type) {
    query = query.eq("movement_type", filters.movement_type);
  }

  if (filters?.from_location) {
    query = query.eq("from_location", filters.from_location);
  }

  if (filters?.to_location) {
    query = query.eq("to_location", filters.to_location);
  }

  if (filters?.product_id) {
    query = query.eq("product_id", filters.product_id);
  }

  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }

  if (filters?.date_to) {
    // Agregar un día completo para incluir la fecha final
    const endDate = new Date(filters.date_to);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt("created_at", endDate.toISOString());
  }

  // Ordenar por fecha más reciente primero
  query = query.order("created_at", { ascending: false });

  const { data: movementsData, error } = await query;

  if (error) {
    throw new Error(`Error al obtener movimientos: ${error.message}`);
  }

  // Si no hay datos, retornar vacío
  if (!movementsData || movementsData.length === 0) {
    return [];
  }

  // Obtener datos relacionados (productos y ubicaciones)
  const productIds = [
    ...new Set(movementsData.map((m) => m.product_id).filter(Boolean)),
  ];

  const allLocationIds = [
    ...movementsData.map((m) => m.from_location).filter(Boolean),
    ...movementsData.map((m) => m.to_location).filter(Boolean),
  ];
  const locationIds = [...new Set(allLocationIds)];

  const [{ data: products }, { data: locations }] = await Promise.all([
    productIds.length > 0
      ? supabase
          .from("products")
          .select("id, name, code, bar_code")
          .in("id", productIds)
      : { data: [] },
    locationIds.length > 0
      ? supabase
          .from("inventories_locations")
          .select("id, name, code")
          .in("id", locationIds)
      : { data: [] },
  ]);

  // Mapear los movimientos con sus relaciones
  const movementsWithRelations: InventoryMovement[] = movementsData.map(
    (movement) => {
      const product = products?.find((p) => p.id === movement.product_id);
      const fromLocation = locations?.find(
        (l) => l.id === movement.from_location,
      );
      const toLocation = locations?.find((l) => l.id === movement.to_location);

      return {
        ...movement,
        product: product
          ? {
              id: product.id,
              name: product.name,
              code: product.code,
              bar_code: product.bar_code,
            }
          : undefined,
        from_location_data: fromLocation
          ? {
              id: fromLocation.id,
              name: fromLocation.name,
              code: fromLocation.code,
            }
          : undefined,
        to_location_data: toLocation
          ? {
              id: toLocation.id,
              name: toLocation.name,
              code: toLocation.code,
            }
          : undefined,
      } as InventoryMovement;
    },
  );

  return movementsWithRelations;
}

/**
 * Registra una entrada de inventario
 */
export async function createInventoryEntry(formData: {
  entries: Array<{
    product_id: string;
    quantity: number;
  }>;
  movement_type:
    | "purchase"
    | "sale"
    | "transfer"
    | "adjustment"
    | "return"
    | "loss"
    | "initial"
    | "production";
  from_location: string;
  to_location: string;
  inventory_movement_id?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
  movement_id?: string;
  failedEntries?: Array<{ product_id: string; error: string }>;
  inventory_movement_id?: string;
  movements?: any;
}> {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // Validar que hay al menos una entrada
    if (!formData.entries || formData.entries.length === 0) {
      return { success: false, message: "No hay productos para registrar" };
    }

    // Validar que las ubicaciones existen
    const { data: fromLocation, error: fromLocationError } = await supabase
      .from("inventories_locations")
      .select("id, name, code")
      .eq("id", formData.from_location)
      .is("deleted_at", null)
      .single();

    if (fromLocationError || !fromLocation) {
      return { success: false, message: "Ubicación de origen no válida" };
    }

    const { data: toLocation, error: toLocationError } = await supabase
      .from("inventories_locations")
      .select("id, name, code")
      .eq("id", formData.to_location)
      .is("deleted_at", null)
      .single();

    if (toLocationError || !toLocation) {
      return { success: false, message: "Ubicación de destino no válida" };
    }

    // 1. Crear el movimiento general en inventories_movements
    const movementData: any = {
      created_by: user.id,
      updated_by: user.id,
      from_location: formData.from_location,
      to_location: formData.to_location,
      movement_type: formData.movement_type,
      notes: formData.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Solo agregar related_movement_id si se proporcion
    // Para movimientos manuales, este campo quedará como null
    if (formData.inventory_movement_id) {
      movementData.related_movement_id = formData.inventory_movement_id;
    }

    const { data: movement, error: movementError } = await supabase
      .from("inventories_movements")
      .insert([movementData])
      .select("id, related_movement_id, movement_type")
      .single();

    if (movementError) {
      return {
        success: false,
        message: `Error al crear movimiento: ${movementError.message}`,
      };
    }

    const movementId = movement.id;
    const actualRelatedMovementId = movement.related_movement_id;

    const failedEntries: Array<{ product_id: string; error: string }> = [];
    const successfulEntries: Array<{ product_id: string; quantity: number }> =
      [];

    // 2. Procesar cada producto en la tabla de detalles
    for (const entry of formData.entries) {
      try {
        // Validar que el producto existe
        const { data: product, error: productError } = await supabase
          .from("products")
          .select("id, name, code, bar_code, quantity")
          .eq("id", entry.product_id)
          .is("deleted_at", null)
          .single();

        if (productError || !product) {
          throw new Error("Producto no encontrado");
        }

        // Crear el registro en inventories_movements_details
        // IMPORTANTE: La tabla details SÍ tiene inventory_movement_id
        const detailData = {
          inventory_movement_id: movementId,
          product_id: entry.product_id,
          quantity: entry.quantity,
        };

        const { error: detailError } = await supabase
          .from("inventories_movements_details")
          .insert([detailData]);

        if (detailError) {
          throw new Error(`Error al guardar detalle: ${detailError.message}`);
        }

        // Actualizar el inventario (sumar stock al destino)
        const adjustResult = await adjustProductInventory(
          entry.product_id,
          formData.to_location,
          entry.quantity,
          user.id,
        );

        if (!adjustResult.success) {
          throw new Error(adjustResult.message || "Error al actualizar stock");
        }

        successfulEntries.push({
          product_id: entry.product_id,
          quantity: entry.quantity,
        });
      } catch (error: any) {
        failedEntries.push({
          product_id: entry.product_id,
          error: error.message,
        });
      }
    }

    // Verificar si al menos un producto se procesó correctamente
    if (successfulEntries.length > 0) {
      let message = "";
      if (failedEntries.length === 0) {
        message = `Entrada registrada exitosamente. ${successfulEntries.length} producto(s) procesado(s).`;
      } else {
        message = `Entrada parcialmente registrada. ${successfulEntries.length} exitoso(s), ${failedEntries.length} fallido(s).`;
      }

      revalidatePath("/dashboard/inventarios");
      revalidatePath("/dashboard/inventarios/movimientos");
      revalidatePath("/dashboard/productos");

      return {
        success: true,
        message,
        movement_id: movementId,
        // Solo retornar inventory_movement_id si existe (para movimientos automáticos)
        inventory_movement_id: actualRelatedMovementId || undefined,
        failedEntries: failedEntries.length > 0 ? failedEntries : undefined,
      };
    } else {
      // Si TODOS los productos fallaron, eliminar el movimiento principal
      await supabase
        .from("inventories_movements")
        .delete()
        .eq("id", movementId);

      return {
        success: false,
        message: "No se pudo registrar ningún producto",
        failedEntries,
      };
    }
  } catch (error: any) {
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Obtiene las ubicaciones de origen para entradas de inventario
 */
export async function getEntryLocations(): Promise<LocationForSelector[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_locations")
    .select("id, code, name, description")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Error al obtener ubicaciones para entradas:", error);
    return [];
  }

  return data || [];
}

//-----------------------------------------------------------------------------------
/*
 * Verifica y crea las ubicaciones necesarias para pedidos online
 */
export async function ensureOnlineSalesLocations(): Promise<{
  branch1: string;
  clients: string;
  onlineExits: string;
}> {
  const supabase = await createClient();

  // Obtener usuario system para creación
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const systemUser = user?.id;

  const requiredLocations = [
    {
      code: "BRANCH_1",
      name: "Sucursal 1",
      description: "Sucursal principal de inventario",
    },
    {
      code: "CLIENTS",
      name: "Clientes",
      description: "Ubicación para productos vendidos a clientes",
    },
    {
      code: "SALIDAS_ONLINE",
      name: "Salidas Online",
      description: "Ubicación temporal para pedidos online pendientes de pago",
    },
  ];

  const locationIds: any = {};

  for (const loc of requiredLocations) {
    const { data: existing } = await supabase
      .from("inventories_locations")
      .select("id")
      .eq("code", loc.code)
      .is("deleted_at", null)
      .single();

    if (existing) {
      locationIds[
        loc.code === "BRANCH_1"
          ? "branch1"
          : loc.code === "CLIENTS"
            ? "clients"
            : "onlineExits"
      ] = existing.id;
    } else {
      const { data: newLocation, error } = await supabase
        .from("inventories_locations")
        .insert({
          code: loc.code,
          name: loc.name,
          description: loc.description,
          created_by: systemUser,
          updated_by: systemUser,
          is_write_protected: false,
        })
        .select("id")
        .single();

      if (error) {
        console.error(`Error creando ubicación ${loc.code}:`, error);
        throw new Error(`No se pudo crear la ubicación ${loc.name}`);
      }

      locationIds[
        loc.code === "BRANCH_1"
          ? "branch1"
          : loc.code === "CLIENTS"
            ? "clients"
            : "onlineExits"
      ] = newLocation.id;
    }
  }

  return locationIds;
}

/**
 * Obtiene los IDs de las ubicaciones para pedidos online
 */
async function getOnlineLocationIds(): Promise<{
  branch1: string;
  clients: string;
  onlineExits: string;
}> {
  return await ensureOnlineSalesLocations();
}

/**
 * Registra movimiento cuando un pedido se crea (Pendiente de pago)
 */
export async function registerPendingPaymentMovement(
  orderData: {
    order_id: string;
    order_number: string;
    products: Array<{
      product_id: string;
      quantity: number;
    }>;
    notes?: string;
  },
  userId: string,
): Promise<{
  success: boolean;
  message?: string;
  movement?: any;
}> {
  // Ya no se crean movimientos en estado pendiente
  // Solo se registran cuando el pedido se paga
  return {
    success: true,
    message: "No se requiere movimiento en estado pendiente de pago",
  };
}

/**
 * Registra movimiento cuando un pedido se paga
 */
export async function registerPaidMovement(
  orderData: {
    order_id: string;
    order_number: string;
    products: Array<{
      product_id: string;
      quantity: number;
    }>;
    notes?: string;
  },
  userId: string,
): Promise<{
  success: boolean;
  message?: string;
  movement?: any;
}> {
  try {
    const supabase = await createClient();
    const locations = await getOnlineLocationIds();

    // Verificar ubicaciones
    const { data: fromLocation, error: fromError } = await supabase
      .from("inventories_locations")
      .select("id, name")
      .eq("id", locations.branch1)
      .single();

    const { data: toLocation, error: toError } = await supabase
      .from("inventories_locations")
      .select("id, name")
      .eq("id", locations.onlineExits)
      .single();

    if (fromError || !fromLocation || toError || !toLocation) {
      return { success: false, message: "Ubicaciones no válidas" };
    }

    // 1. Crear UN SOLO movimiento principal
    const movementData: any = {
      created_by: userId,
      updated_by: userId,
      from_location: locations.branch1, // De Sucursal 1
      to_location: locations.onlineExits, // A Salidas Online
      movement_type: "sale",
      related_movement_id: orderData.order_id,
      notes:
        orderData.notes ||
        `Pedido pagado - Orden #${orderData.order_number} (${orderData.products.length} productos)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: movement, error: movementError } = await supabase
      .from("inventories_movements")
      .insert([movementData])
      .select("id")
      .single();

    if (movementError) {
      console.error("❌ Error al crear movimiento de pago:", movementError);
      return { success: false, message: movementError.message };
    }

    const movementId = movement.id;

    // 2. Crear MÚLTIPLES detalles
    const detailsData = orderData.products.map((product) => ({
      inventory_movement_id: movementId,
      product_id: product.product_id,
      quantity: product.quantity,
    }));

    const { error: detailError } = await supabase
      .from("inventories_movements_details")
      .insert(detailsData);

    if (detailError) {
      console.error("Error creando detalles de pago:", detailError);
      // Revertir el movimiento principal si hay error en los detalles
      await supabase
        .from("inventories_movements")
        .delete()
        .eq("id", movementId);
      return { success: false, message: detailError.message };
    }

    // 3. Actualizar inventario para cada producto (restar de Sucursal 1)
    for (const product of orderData.products) {
      try {
        const adjustResult = await adjustProductInventory(
          product.product_id,
          locations.branch1, // Restar de Sucursal 1
          -product.quantity, // Restar cantidad
          userId,
        );

        if (!adjustResult.success) {
          console.error(
            `Error actualizando inventario para producto ${product.product_id}:`,
            adjustResult.message,
          );
          // Podrías decidir revertir todo o continuar
        }
      } catch (error) {
        console.error(
          `Error procesando producto ${product.product_id}:`,
          error,
        );
      }
    }

    // 4. Obtener movimiento completo con TODOS los detalles
    const { data: fullMovement, error: fetchError } = await supabase
      .from("inventories_movements")
      .select(
        `
          *,
          from_location_data:inventories_locations!from_location(id, name, code),
          to_location_data:inventories_locations!to_location(id, name, code),
          details:inventories_movements_details(
            id,
            product_id,
            quantity,
            product:products(id, name, sku)
          )
        `,
      )
      .eq("id", movementId)
      .single();

    if (fetchError) {
      console.error("Error obteniendo movimiento completo:", fetchError);
      return {
        success: false,
        message: fetchError.message,
        movement: { id: movementId },
      };
    }

    return {
      success: true,
      message: `Movimiento de pago registrado con ${orderData.products.length} productos`,
      movement: fullMovement,
    };
  } catch (error: any) {
    console.error("💥 Error inesperado en registerPaidMovement:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Registra una transferencia de inventario sin afectar el stock total del producto.
 * Esta función es útil para mover stock entre ubicaciones internas donde no hay una entrada o salida real de inventario.
 */
export async function createInventoryTransfer(formData: {
  product_id: string;
  quantity: number;
  movement_type: "sale" | "transfer" | "adjustment" | "loss" | "return" | "initial " | "production" | "purchase";
  from_location: string;
  to_location: string;
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
  movement?: InventoryMovement;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, message: "Usuario no autenticado" };
    }

    // Validaciones de producto y ubicaciones (puedes reutilizar las de createInventoryExit si quieres)
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", formData.product_id)
      .single();
    if (productError || !product)
      return { success: false, message: "Producto no encontrado" };

    const { data: fromLocation, error: fromLocationError } = await supabase
      .from("inventories_locations")
      .select("id, name")
      .eq("id", formData.from_location)
      .single();
    if (fromLocationError || !fromLocation)
      return { success: false, message: "Ubicación de origen no válida" };

    const { data: toLocation, error: toLocationError } = await supabase
      .from("inventories_locations")
      .select("id, name")
      .eq("id", formData.to_location)
      .single();
    if (toLocationError || !toLocation)
      return { success: false, message: "Ubicación de destino no válida" };

    // Crear el movimiento de transferencia
    const movementData = {
      product_id: formData.product_id,
      quantity: formData.quantity,
      from_location: formData.from_location,
      to_location: formData.to_location,
      movement_type: formData.movement_type,
      notes: formData.notes || null,
      created_by: user.id,
      updated_by: user.id,
    };

    const { data: movement, error: movementError } = await supabase
      .from("inventories_movements")
      .insert(movementData)
      .select(
        `
        *,
        product:products(id, name, code, bar_code),
        from_location_data:inventories_locations!from_location(id, name, code),
        to_location_data:inventories_locations!to_location(id, name, code)
      `,
      )
      .single();

    if (movementError) {
      console.error("Error al crear transferencia:", movementError);
      return {
        success: false,
        message: `Error al registrar transferencia: ${movementError.message}`,
      };
    }

    // No se actualiza el stock del producto porque es una transferencia interna

    revalidatePath("/dashboard/inventarios/movimientos");

    return {
      success: true,
      message: `Transferencia registrada de ${fromLocation.name} a ${toLocation.name}`,
      movement: movement as InventoryMovement,
    };
  } catch (error: any) {
    console.error("Error:", error);
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Registra movimiento cuando un pedido se cancela (Cancelado)
 */
export async function registerCancelledMovement(
  orderData: {
    order_id: string;
    order_number: string;
    products: Array<{
      product_id: string;
      quantity: number;
    }>;
    notes?: string;
  },
  userId: string,
): Promise<{
  success: boolean;
  message?: string;
  movement?: any;
}> {
  try {
    const supabase = await createClient();
    const locations = await getOnlineLocationIds();

    const branchLocation = await getLocationByCode("BRANCH_1");
    if (!branchLocation) {
      return { success: false, message: "Ubicación BRANCH_1 no encontrada" };
    }

    // 1. Crear UN SOLO movimiento
    const movementData: any = {
      created_by: userId,
      updated_by: userId,
      from_location: locations.onlineExits,
      to_location: branchLocation.id,
      movement_type: "return",
      related_movement_id: orderData.order_id,
      notes:
        orderData.notes ||
        `Pedido cancelado - Orden #${orderData.order_number}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: movement, error: movementError } = await supabase
      .from("inventories_movements")
      .insert([movementData])
      .select("id")
      .single();

    if (movementError) {
      return { success: false, message: movementError.message };
    }

    const movementId = movement.id;

    // 2. Crear múltiples detalles
    const detailsToInsert = orderData.products.map((product) => ({
      inventory_movement_id: movementId,
      product_id: product.product_id,
      quantity: product.quantity,
    }));

    if (detailsToInsert.length > 0) {
      const { error: detailError } = await supabase
        .from("inventories_movements_details")
        .insert(detailsToInsert);

      if (detailError) {
        // Eliminar movimiento si fallan los detalles
        await supabase
          .from("inventories_movements")
          .delete()
          .eq("id", movementId);
        return { success: false, message: detailError.message };
      }
    }

    // 3. Actualizar inventario para cada producto
    for (const product of orderData.products) {
      await adjustProductInventory(
        product.product_id,
        branchLocation.id,
        product.quantity,
        userId,
      );
    }

    return {
      success: true,
      message: "Movimiento de cancelación registrado correctamente",
      movement: { id: movementId, ...movementData },
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
/**
 * Verifica si existe un movimiento pendiente para un pedido
 */
export async function hasPendingMovement(
  orderNumber: string,
  productId: string,
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_movements")
    .select("id")
    .eq("inventory_movement_id", orderNumber)
    .eq("product_id", productId)
    .eq("movement_type", "sale")
    .is("deleted_at", null)
    .single();

  return !!data && !error;
}

/**
 * Método completo para manejar cambio de estado de pedido
 */
export async function handleOrderStatusChange(orderData: {
  order_id: string;
  order_number: string;
  products: Array<{
    product_id: string;
    quantity: number;
  }>;
  previous_status: string;
  new_status: string;
  notes?: string;
}): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const supabase = await createClient();
    let result;

    const { data: order, error: orderError } = await supabase
      .from("sale_orders")
      .select("user_id")
      .eq("id", orderData.order_id)
      .single();

    if (orderError) {
      console.error("❌ Error: ", orderError);
      return { success: false, message: "No se pudo obtener la orden" };
    }

    const userId = order.user_id;

    switch (orderData.new_status) {
      case "Pagado":
        if (orderData.previous_status === "Pendiente de pago") {
          result = await registerPaidMovement(orderData, userId);
        }
        break;

      case "Entregado":
        if (orderData.previous_status === "En camino") {
          result = await registerDeliveredMovement(orderData, userId);
        }
        break;

      case "Cancelado":
        if (orderData.previous_status === "Pendiente de pago") {
          result = await registerCancelledMovement(orderData, userId);
        }
        break;

      default:
        return {
          success: true,
          message: "No se requiere movimiento para este estado",
        };
    }

    return {
      success: result?.success || true,
      message: result?.message,
    };
  } catch (error: any) {
    console.error("Error", error);
    return { success: false, message: error.message };
  }
}

/**
 * Registra movimiento cuando un pedido es entregado físicamente
 */
export async function registerDeliveredMovement(
  orderData: {
    order_id: string;
    order_number: string;
    products: {
      product_id: string;
      quantity: number;
    }[];
    notes?: string;
  },
  userId: string,
): Promise<{
  success: boolean;
  message?: string;
  movement?: any;
}> {
  try {
    const supabase = await createClient();
    const locations = await getOnlineLocationIds();

    // Verificar ubicaciones
    const { data: fromLocation, error: fromError } = await supabase
      .from("inventories_locations")
      .select("id, name")
      .eq("id", locations.onlineExits)
      .single();

    const { data: toLocation, error: toError } = await supabase
      .from("inventories_locations")
      .select("id, name")
      .eq("id", locations.clients)
      .single();

    if (fromError || !fromLocation || toError || !toLocation) {
      return { success: false, message: "Ubicaciones no válidas" };
    }

    // 1. Crear UN SOLO movimiento principal
    const movementData: any = {
      created_by: userId,
      updated_by: userId,
      from_location: locations.onlineExits,
      to_location: locations.clients,
      movement_type: "sale",
      related_movement_id: orderData.order_id,
      notes:
        orderData.notes ||
        `Entrega física confirmada - Orden #${orderData.order_number} (${orderData.products.length} productos)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: movement, error: movementError } = await supabase
      .from("inventories_movements")
      .insert([movementData])
      .select("id")
      .single();

    if (movementError) {
      console.error("❌ Error al crear movimiento de entrega:", movementError);
      return { success: false, message: movementError.message };
    }

    const movementId = movement.id;

    // 2. Crear MÚLTIPLES detalles
    const detailsData = orderData.products.map((product) => ({
      inventory_movement_id: movementId,
      product_id: product.product_id,
      quantity: product.quantity,
    }));

    const { error: detailError } = await supabase
      .from("inventories_movements_details")
      .insert(detailsData);

    if (detailError) {
      console.error("Error creando detalles de entrega:", detailError);
      // Revertir el movimiento principal si hay error en los detalles
      await supabase
        .from("inventories_movements")
        .delete()
        .eq("id", movementId);
      return { success: false, message: detailError.message };
    }

    // 3. Obtener movimiento completo con TODOS los detalles
    const { data: fullMovement, error: fetchError } = await supabase
      .from("inventories_movements")
      .select(
        `
         *,
         from_location_data:inventories_locations!from_location(id, name, code),
         to_location_data:inventories_locations!to_location(id, name, code),
         details:inventories_movements_details(
           id,
           product_id,
           quantity,
           product:products(id, name, sku)
         )
       `,
      )
      .eq("id", movementId)
      .single();

    if (fetchError) {
      console.error("Error obteniendo movimiento completo:", fetchError);
      return {
        success: false,
        message: fetchError.message,
        movement: { id: movementId },
      };
    }

    return {
      success: true,
      message: `Movimiento de entrega registrado con ${orderData.products.length} productos`,
      movement: fullMovement,
    };
  } catch (error: any) {
    console.error("💥 Error inesperado:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Obtiene todos los movimientos relacionados con una orden específica
 */
export async function getMovementsByOrderId(
  orderId: string,
): Promise<InventoryMovement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_movements")
    .select(
      `
      *,
      product:products(id, name, code, bar_code),
      from_location_data:inventories_locations!from_location(id, name, code),
      to_location_data:inventories_locations!to_location(id, name, code)
    `,
    )
    .eq("inventory_movement_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al obtener movimientos por orden:", error);
    return [];
  }

  return (data as InventoryMovement[]) || [];
}

/**
 * Obtiene movimientos de inventario agrupados
 */
export async function getInventoryMovementsGrouped(
  filters?: {
    movement_type?: string;
    from_location?: string;
    to_location?: string;
    date_from?: string;
    date_to?: string;
    product_id?: string;
    search?: string;
  },
  page: number = 1,
  pageSize: number = 20,
): Promise<{
  groups: GroupedInventoryMovement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const supabase = await createClient();

  // Construir consulta principal de movimientos
  let query = supabase
    .from("inventories_movements")
    .select(
      `
        *,
        from_location_data:inventories_locations!from_location(id, name, code),
        to_location_data:inventories_locations!to_location(id, name, code),
        details:inventories_movements_details(
          id,
          inventory_movement_id,
          product_id,
          quantity,
          product:products(id, name, code, bar_code)
        )
      `,
      { count: "exact" },
    )
    .is("deleted_at", null);

  // Aplicar filtros
  if (filters?.movement_type) {
    query = query.eq("movement_type", filters.movement_type);
  }

  if (filters?.from_location) {
    query = query.eq("from_location", filters.from_location);
  }

  if (filters?.to_location) {
    query = query.eq("to_location", filters.to_location);
  }

  if (filters?.date_from) {
    query = query.gte("created_at", filters.date_from);
  }

  if (filters?.date_to) {
    const endDate = new Date(filters.date_to);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt("created_at", endDate.toISOString());
  }

  query = query.order("created_at", { ascending: false });

  // Aplicar paginación
  const fromIndex = (page - 1) * pageSize;
  const toIndex = fromIndex + pageSize - 1;

  const {
    data: movements,
    error,
    count,
  } = await query.range(fromIndex, toIndex);

  if (error) {
    console.error("Error al obtener movimientos:", error);
    throw new Error(`Error al obtener movimientos: ${error.message}`);
  }

  if (!movements || movements.length === 0) {
    return {
      groups: [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }

  // Obtener solo order_number de las órdenes relacionadas
  const relatedMovementIds = [
    ...new Set(
      movements
        .map((m) => m.related_movement_id)
        .filter((id): id is string => {
          return (
            id !== null &&
            id !== undefined &&
            id !== "" &&
            typeof id === "string" &&
            id.trim().length > 0
          );
        }),
    ),
  ];

  const orderNumbersMap = new Map<string, string>();

  if (relatedMovementIds.length > 0) {
    try {
      // Solo obtener id y order_number
      const { data: saleOrders, error: saleOrdersError } = await supabase
        .from("sale_orders")
        .select("id, order_number")
        .in("id", relatedMovementIds);

      if (!saleOrdersError && saleOrders && saleOrders.length > 0) {
        saleOrders.forEach((order) => {
          if (order.id && order.order_number) {
            orderNumbersMap.set(order.id, order.order_number);
          }
        });
      }
    } catch (error) {
      console.error("Error al obtener números de orden:", error);
    }
  }

  // Agrupar movimientos - ¡ESTA ES LA PARTE CLAVE!
  const groupsMap = new Map<string, GroupedInventoryMovement>();

  movements.forEach((movement) => {
    // Usar related_movement_id para agrupar por orden
    const groupId = movement.related_movement_id
      ? movement.related_movement_id // Misma ID para todos los movimientos de esta orden
      : `manual_${movement.id}`; // Movimientos manuales se agrupan individualmente

    const orderNumber = movement.related_movement_id
      ? orderNumbersMap.get(movement.related_movement_id) || null
      : null;

    if (!groupsMap.has(groupId)) {
      // Crear nuevo grupo
      groupsMap.set(groupId, {
        id: groupId,
        inventory_movement_id: movement.id, // ID del movimiento principal
        related_movement_id: movement.related_movement_id,
        order_number: orderNumber,
        movements: [],
        total_quantity: 0,
        total_products: 0,
        created_at: movement.created_at,
        movement_type: movement.movement_type,
        // movement_number: movement.movement_number,
        notes: movement.notes, // Solo usar notas del primer movimiento
        from_location: movement.from_location,
        to_location: movement.to_location,
        from_location_data: movement.from_location_data,
        to_location_data: movement.to_location_data,
      });
    }

    const group = groupsMap.get(groupId)!;

    // Procesar detalles del movimiento
    const movementDetails = movement.details || [];

    movementDetails.forEach((detail: any) => {
      group.total_quantity += detail.quantity || 0;
      group.total_products++;

      // Agregar detalle como movimiento en el grupo
      group.movements.push({
        id: detail.id,
        product_id: detail.product_id,
        quantity: detail.quantity,
        from_location: movement.from_location,
        to_location: movement.to_location,
        inventory_movement_id: movement.related_movement_id,
        movement_type: movement.movement_type,
        // movement_number: movement.movement_number,
        notes: movement.notes,
        created_at: movement.created_at,
        updated_at: movement.updated_at,
        deleted_at: movement.deleted_at,
        product: detail.product
          ? {
              id: detail.product.id,
              name: detail.product.name,
              code: detail.product.code,
              bar_code: detail.product.bar_code,
            }
          : undefined,
        from_location_data: movement.from_location_data,
        to_location_data: movement.to_location_data,
      });
    });

    // Si hay múltiples movimientos para la misma orden, consolidar notas
    if (movement.notes && movement.notes !== group.notes) {
      if (group.notes) {
        group.notes = `${group.notes}\n${movement.notes}`;
      } else {
        group.notes = movement.notes;
      }
    }
  });

  // Convertir a array y ordenar
  const groups = Array.from(groupsMap.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  // Aplicar filtros adicionales
  let filteredGroups = groups;

  if (filters?.product_id) {
    filteredGroups = filteredGroups.filter((group) =>
      group.movements.some(
        (movement) => movement.product_id === filters.product_id,
      ),
    );
  }

  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    filteredGroups = filteredGroups.filter((group) => {
      // Buscar en notas del grupo
      const groupNotesMatch = group.notes?.toLowerCase().includes(searchLower);

      // Buscar en número de orden
      const orderNumberMatch = group.order_number
        ?.toLowerCase()
        .includes(searchLower);

      // Buscar en productos
      const productMatch = group.movements.some(
        (movement) =>
          movement.product?.name?.toLowerCase().includes(searchLower) ||
          movement.product?.code?.toLowerCase().includes(searchLower) ||
          movement.product?.bar_code?.toLowerCase().includes(searchLower),
      );

      return groupNotesMatch || orderNumberMatch || productMatch;
    });
  }

  return {
    groups: filteredGroups,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Obtiene movimientos individuales por inventory_movement_id
 */
export async function getMovementsByRelatedId(
  relatedMovementId: string,
): Promise<InventoryMovement[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_movements")
    .select(
      `
      *,
      product:products(id, name, code, bar_code),
      from_location_data:inventories_locations!from_location(id, name, code),
      to_location_data:inventories_locations!to_location(id, name, code)
    `,
    )
    .eq("inventory_movement_id", relatedMovementId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "Error al obtener movimientos por inventory_movement_id:",
      error,
    );
    return [];
  }

  return (data as InventoryMovement[]) || [];
}

export async function getProductStockByLocation(
  productId: string,
  locationId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_inventory")
    .select("quantity")
    .eq("id_product", productId)
    .eq("id_inventory", locationId)
    .single();

  if (error) {
    console.warn(
      `No se encontró stock para producto ${productId} en ubicación ${locationId}`,
    );
    return 0;
  }

  return data.quantity || 0;
}
