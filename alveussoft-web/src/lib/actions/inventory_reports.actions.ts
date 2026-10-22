"use server";

import { createClient } from "@/lib/supabase/server";

export interface InventoryLocation {
  id: string;
  code: string;
  name: string;
}

export interface InventoryProduct {
  id: string;
  code: string;
  bar_code: string | null;
  name: string;
  quantity: number;
  cost_price: number;
  is_available: boolean;
}

interface ProductInventoryRow {
  id: string;
  quantity: number | null;
  products: {
    id: string;
    code: string;
    bar_code: string | null;
    name: string;
    cost_price: number | null;
    is_available: boolean;
    deleted_at: string | null;
  };
}

// Traer sucursales
export async function getInventoryLocations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("inventories_locations")
    .select("id, code, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }

  return data || [];
}

// Traer productos por sucursal
export async function getInventoryByLocation(locationId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_inventory")
    .select(
      `
      id,
      id_product,
      id_inventory,
      quantity,
      deleted_at,
      products!inner (
        id,
        code,
        bar_code,
        name,
        cost_price,
        is_available,
        deleted_at
      )
    `,
    )
    .eq("id_inventory", locationId);

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // IMPORTANTE: Solo filtramos por productos activos (products.deleted_at = null)
  // NO filtramos por product_inventory.deleted_at porque los registros de inventario
  // pueden estar marcados como eliminados pero aún necesitamos mostrarlos en el reporte.
  // Línea crítica: Solo verificamos que el producto (tabla products) esté activo.
  const filteredData = data.filter((p: any) => {
    const hasProduct = !!p.products;
    const productActive = p.products && !p.products.deleted_at;
    return hasProduct && productActive;
    // const productInventoryActive = !p.deleted_at;
    // return hasProduct && productActive && productInventoryActive;
  });

  // Normalizar para que el front no tenga que reorganizar
  return filteredData.map((p: any) => ({
    id: p.products.id,
    code: p.products.code,
    bar_code: p.products.bar_code,
    name: p.products.name,
    cost_price: Number(p.products.cost_price || 0),
    is_available: p.products.is_available,
    quantity: Number(p.quantity || 0),
  }));
}
