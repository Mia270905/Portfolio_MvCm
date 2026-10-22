"use server";

import { createClient } from "@/lib/supabase/server";

export interface ShippingRate {
  id: string;
  name: string;
  shipping_method: string;
  price: number | null;
  active: boolean;
  min_order_amount?: number | null;
  max_order_amount?: number | null;
  type_order_amount?: "price";
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface ShippingRateFiltered {
  id: string;
  name: string | null;
  active: boolean | null;
  price: number | null;
  min_order_amount: number | null;
  max_order_amount: number | null;
  type_order_amount: string | null;
  is_default: boolean | null;
  created_at: string;
}

export async function createShippingRate(shippingData: {
  nombre: string;
  metodo_envio: string;
  precio: number | null;
  is_active: boolean;
  precio_minimo: number | null;
  precio_maximo: number | null;
  type_order_amount: string;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.from("shipping_rates").insert({
    name: shippingData.nombre,
    shipping_method_id: shippingData.metodo_envio,
    price: shippingData.precio || null,
    active: shippingData.is_active,
    min_order_amount: shippingData.precio_minimo || null,
    max_order_amount: shippingData.precio_maximo || null,
    type_order_amount: "price",
  });

  if (error) {
    console.error("Error creando tarifa:", error);
    throw new Error("Error al guardar la tarifa de envío");
  }

  return { success: true, id: data};
}

export async function getShippingMethods() {
const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipping_methods")
    .select("id, name, active");

  if (error) {
    console.error("Error al obtener shipping_methods:", error);
    throw new Error("No se pudieron cargar los métodos de envío.");
  }

  // Solo devolver activos
  return data.filter((m) => m.active);
}

// Funcion para consultar las tarifas de envio (para crear un cupon)
export async function getShippingRates(): Promise<ShippingRate[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipping_rates")
    .select(
      `
      id,
      name,
      shipping_method,
      price,
      active,
      min_order_amount,
      max_order_amount,
      type_order_amount
    `,
    )
    .eq("active", true)
    .is("deleted_at", null)
    .is("is_default", false)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener tarifas:", error);
    return [];
  }

  return data || [];
}

export async function updateShippingRate(
  id: string,
  shippingData: {
    nombre: string;
    metodo_envio: string;
    precio: number;
    is_active: boolean;
    precio_minimo: number;
    precio_maximo: number;
    type_order_amount: string;
  }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shipping_rates")
    .update({
      name: shippingData.nombre,
      shipping_method_id: shippingData.metodo_envio,
      price: shippingData.precio || null,
      active: shippingData.is_active,
      min_order_amount: shippingData.precio_minimo || null,
      max_order_amount: shippingData.precio_maximo || null,
      type_order_amount: shippingData.type_order_amount,
      updated_at: new Date().toISOString(),
      updated_by: (await supabase.auth.getUser()).data.user?.id || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error actualizando tarifa:", error);
    throw new Error("Error al actualizar la tarifa de envío");
  }

  return { success: true };
}

export async function getShippingRateById(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error obteniendo tarifa:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("Excepción al obtener tarifa:", err);
    return null;
  }
}

export async function deleteShippingRate(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shipping_rates")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: (await supabase.auth.getUser()).data.user?.id || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error eliminando tarifa:", error);
    throw new Error("Error al eliminar la tarifa de envío");
  }

  return { success: true };
}

export async function createZoneShippingRates(params: {
  zoneId: string;
  shippingPrice: number | null;
  selectedRates: { id: string }[];
}) {
  const supabase = await createClient();
  const { zoneId, shippingPrice, selectedRates } = params;

  //------------------------------------------------------
  // 1) Obtener shipping_method "Envío a domicilio"
  //------------------------------------------------------
  const { data: methodData, error: methodError } = await supabase
    .from("shipping_methods")
    .select("id")
    .eq("name", "Envío a domicilio")
    .eq("active", true)
    .single();

  if (methodError || !methodData) {
    console.error("Error obteniendo método de envío:", methodError);
    throw new Error("No se encontró el método de envío 'Envío a domicilio'");
  }

  // const shippingMethodId = methodData.id;

  //------------------------------------------------------
  // 2) SIEMPRE CREAR UNA TARIFA DEFAULT NUEVA
  //------------------------------------------------------
  // const { data: defaultRateData, error: defaultRateError } = await supabase
  //   .from("shipping_rates")
  //   .insert({
  //     name: "Envío Estándar",
  //     price: shippingPrice ?? 0,
  //     active: true,
  //     min_order_amount: null,
  //     max_order_amount: null,
  //     is_default: true,
  //     shipping_method_id: shippingMethodId,
  //   })
  //   .select("id")
  //   .single();

  // if (defaultRateError || !defaultRateData) {
  //   console.error("Error creando tarifa default:", defaultRateError);
  //   throw new Error("No se pudo crear la tarifa de envío estándar");
  // }

  // const defaultRateId = defaultRateData.id;
  // console.log(defaultRateId)

  // //------------------------------------------------------
  // // 3) Asociar la tarifa default NUEVA a la zona
  // //------------------------------------------------------
  // const { error: linkDefaultError } = await supabase
  //   .from("shipping_rates_zones")
  //   .insert({
  //     shipping_rate_id: defaultRateId,
  //     zone_id: zoneId,
  //     active: true,
  //   });

  // if (linkDefaultError) {
  //   console.error("Error vinculando tarifa default:", linkDefaultError);
  //   throw new Error("No se pudo vincular la tarifa estándar con la zona");
  // }
  // console.log(selectedRates)

  //------------------------------------------------------
  // 4) Asociar TARIFAS SELECCIONADAS con la zona
  //------------------------------------------------------
  if (selectedRates && selectedRates.length > 0) {
    const normalized = selectedRates.map((r) =>
      typeof r === "string" ? { id: r } : { id: r.id }
    );

    const toInsert = normalized.map((r) => ({
      shipping_rate_id: r.id,
      zone_id: zoneId,
      active: true,
    }));

    const { error: linkRatesError } = await supabase
      .from("shipping_rates_zones")
      .insert(toInsert);

    if (linkRatesError) {
      console.error("Error vinculando tarifas seleccionadas:", linkRatesError);
      throw new Error("No se pudieron vincular las tarifas seleccionadas");
    }
  }

  return {
    success: true,
  };
}

export async function updateZoneShippingRates({
  zoneId,
  selectedRates, // IDs de shipping_rates seleccionados en el form
  newShippingPrice,
  userId
}: {
  zoneId: string;
  selectedRates: string[];
  newShippingPrice: number;
  userId: string;
}) {
  const supabase = await createClient();

  // 1) Obtener tarifas actuales de la zona (incluye default)
  const { data: existingRelations, error: fetchErr } = await supabase
    .from("shipping_rates_zones")
    .select("id, shipping_rate_id, deleted_at")
    .eq("zone_id", zoneId);

  if (fetchErr) throw fetchErr;

  const existingRateIds = existingRelations
    .filter((r) => !r.deleted_at)
    .map((r) => r.shipping_rate_id);

  // 2) Obtener la tarifa default de esta zona
  const { data: defaultRate, error: defaultErr } = await supabase
    .from("shipping_rates")
    .select("id")
    .eq("is_default", true)
    .in(
      "id",
      existingRateIds.length ? existingRateIds : ["00000000-0000-0000-0000-000000000000"]
    )
    .single();

  if (defaultErr || !defaultRate)
    throw new Error("No se encontró la tarifa default para esta zona.");

  // 3) Actualizar precio de la tarifa default
  await supabase
    .from("shipping_rates")
    .update({
      price: newShippingPrice,
      updated_by: userId,
      updated_at: new Date(),
    })
    .eq("id", defaultRate.id);

  // 4) Eliminar tarifas que ya no están seleccionadas (eliminado lógico)
  const ratesToRemove = existingRateIds.filter(
    (id) => id !== defaultRate.id && !selectedRates.includes(id)
  );

  if (ratesToRemove.length > 0) {
    await supabase
      .from("shipping_rates_zones")
      .update({
        deleted_at: new Date(),
        deleted_by: userId,
        active: false,
      })
      .in("shipping_rate_id", ratesToRemove)
      .eq("zone_id", zoneId);
  }

  // 5) Insertar nuevas tarifas seleccionadas
  const ratesToAdd = selectedRates.filter(
    (id) => !existingRateIds.includes(id)
  );

  if (ratesToAdd.length > 0) {
    const rows = ratesToAdd.map((id) => ({
      zone_id: zoneId,
      shipping_rate_id: id,
      active: true,
      created_by: userId,
    }));

    await supabase.from("shipping_rates_zones").insert(rows);
  }

  return { success: true };
}


export async function getShippingRatesByZone(zoneId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shipping_rates_zones")
    .select("shipping_rate_id")
    .is("deleted_at", null)
    .eq("zone_id", zoneId);

  if (error) {
    console.error("Error obteniendo tarifas de envío:", error);
    return [];
  }

  return data.map((item) => item.shipping_rate_id);
}

export async function getUserShippingRate(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from("users").select("shipping_rate").eq("id", userId).single()

  if (error) {
    console.error("Error obteniendo tarifa del usuario:", error)
    return null
  }

  return data?.shipping_rate || null
}

export async function updateUserShippingRate(
  userId: string,
  shippingRateId: string | null,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("users")
    .update({
      shipping_rate: shippingRateId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("Error actualizando tarifa del usuario:", error)
    return {
      success: false,
      error: "No se pudo actualizar la tarifa de envío del usuario",
    }
  }

  return { success: true }
}

export async function getZonesByShippingRate(shippingRateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("shipping_rates_zones")
    .select(`
      id,
      zone_id,
      zones (
        id,
        name,
        shipping_price
      )
    `)
    .eq("shipping_rate_id", shippingRateId)
    .is("deleted_at", null)
    .eq("active", true)

  if (error) {
    console.error("Error obteniendo zonas:", error)
    return []
  }

  return data.map((item) => {
    const zone = Array.isArray(item.zones) ? item.zones[0] : item.zones;
    return {
      relationId: item.id,
      id: zone.id,
      name: zone.name,
      shipping_price: zone.shipping_price,
    }
  })
}

export async function getUsersByShippingRate(shippingRateId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, active")
    .eq("shipping_rate", shippingRateId)

  if (error) {
    console.error("Error obteniendo usuarios:", error)
    return []
  }

  return data || []
}

export async function removeZoneFromShippingRate(relationId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get authenticated user server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: "Usuario no autenticado",
    }
  }

  const { error } = await supabase
    .from("shipping_rates_zones")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
      active: false,
    })
    .eq("id", relationId)

  if (error) {
    console.error("Error eliminando zona de la tarifa:", error)
    return {
      success: false,
      error: "No se pudo eliminar la zona de la tarifa",
    }
  }

  return { success: true }
}

export async function removeUserFromShippingRate(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("users")
    .update({
      shipping_rate: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("Error eliminando tarifa del usuario:", error)
    return {
      success: false,
      error: "No se pudo eliminar la tarifa del usuario",
    }
  }

  return { success: true }
}

export async function addZoneToShippingRate(
  shippingRateId: string,
  zoneId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get authenticated user server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      error: "Usuario no autenticado",
    }
  }

  // Check if relation already exists (even if deleted)
  const { data: existing } = await supabase
    .from("shipping_rates_zones")
    .select("id, deleted_at")
    .eq("shipping_rate_id", shippingRateId)
    .eq("zone_id", zoneId)
    .single()

  if (existing) {
    if (existing.deleted_at) {
      // Reactivate
      const { error } = await supabase
        .from("shipping_rates_zones")
        .update({
          deleted_at: null,
          deleted_by: null,
          active: true,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("id", existing.id)

      if (error) {
        return { success: false, error: "No se pudo reactivar la zona" }
      }
    }
    return { success: true }
  }

  // Create new relation
  const { error } = await supabase.from("shipping_rates_zones").insert({
    shipping_rate_id: shippingRateId,
    zone_id: zoneId,
    active: true,
    created_by: user.id,
  })

  if (error) {
    console.error("Error añadiendo zona a la tarifa:", error)
    return {
      success: false,
      error: "No se pudo añadir la zona a la tarifa",
    }
  }

  return { success: true }
}

export async function getAllZones() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("zones")
    .select("id, name, shipping_price")
    .is("deleted_at", null)
    .order("name", { ascending: true })

  if (error) {
    console.error("Error obteniendo zonas:", error)
    return []
  }

  return data || []
}

export async function getAllUsers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, email, active, shipping_rate")
    .eq("active", true)
    .order("full_name", { ascending: true })

  if (error) {
    console.error("Error obteniendo usuarios:", error)
    return []
  }

  return data || []
}

// export async function getApplicableShippingRates(postalCode: string, subtotal: number, userId?: string) {
//   const supabase = await createClient()
//   const applicableRates: Array<{
//     id: string
//     name: string
//     price: number
//     source: "zone" | "user" | "standard"
//     description?: string
//   }> = []

// let zoneId: string | null = null
// let standardShippingRate: any = null   

// // -------------------------------------------
// // 1. Get zone from postal code (solo obtiene zoneId)
// // -------------------------------------------

// const { data: postalCodeData } = await supabase
//   .from("postal_codes")
//   .select("zone_id, zones!inner(id, name, shipping_price, deleted_at)")
//   .eq("code", postalCode)
//   .is("deleted_at", null)
//   .is("zones.deleted_at", null)
//   .single()

// if (postalCodeData?.zones) {
//   zoneId = postalCodeData.zone_id
// }

// // -------------------------------------------
// // 2. Get zone shipping rates first (buscar si hay "Envío Estándar")
// // -------------------------------------------

// if (zoneId) {
//   const { data: zoneRates } = await supabase
//     .from("shipping_rates_zones")
//     .select(`
//       shipping_rates!inner(
//         id,
//         name,
//         price,
//         min_order_amount,
//         max_order_amount,
//         active,
//         deleted_at,
//         is_default
//       )
//     `)
//     .eq("zone_id", zoneId)
//     .eq("active", true)
//     .is("deleted_at", null)
//     .is("shipping_rates.deleted_at", null)
//     .eq("shipping_rates.active", true)

//   if (zoneRates) {
//     // Buscar tarifa "Envío Estándar"
//     standardShippingRate = zoneRates
//       .map((item) => {
//         const rate = Array.isArray(item.shipping_rates)
//           ? item.shipping_rates[0]
//           : item.shipping_rates
//         return rate
//       })
//       .find((rate) => rate?.is_default === true)

//     // Procesar las demás tarifas
//     for (const item of zoneRates) {
//       const rate = Array.isArray(item.shipping_rates) ? item.shipping_rates[0] : item.shipping_rates

//       if (!rate) continue
//       if (rate.is_default === true) continue

//       const minAmount = rate.min_order_amount || 0
//       const maxAmount = rate.max_order_amount

//       const meetsMinimum = subtotal >= minAmount
//       const meetsMaximum = maxAmount === null || subtotal <= maxAmount

//       if (meetsMinimum && meetsMaximum) {
//         applicableRates.push({
//           id: rate.id,
//           name: rate.name || "Tarifa de Zona",
//           price: rate.price || 0,
//           source: "zone",
//           description: `Válida para pedidos de $${minAmount.toFixed(2)}${
//             maxAmount ? ` a $${maxAmount.toFixed(2)}` : " o más"
//           }`,
//         })
//       }
//     }
//   }
// }

// // -------------------------------------------
// // 3. Agregar la tarifa estándar — ya sea la de shipping_rates o zones
// // -------------------------------------------

// // Si SÍ existe tarifa estándar en shipping_rates
// if (standardShippingRate) {
//   applicableRates.push({
//     id: "standard",
//     name: standardShippingRate.name,
//     price: standardShippingRate.price,
//     source: "standard",
//     description: postalCodeData.zones.name,
//   })
// }

// // Si NO existe tarifa estándar en shipping_rates → usar la de zones
// else if (postalCodeData?.zones) {
//   applicableRates.push({
//     id: "standard",
//     name: "Envío Estándar",
//     price: postalCodeData.zones.shipping_price || 0,
//     source: "standard",
//     description: postalCodeData.zones.name,
//   })
// }

//   // 3. Get user's personal shipping rate (if authenticated)
//   if (userId && postalCodeData) {
//     const { data: userData } = await supabase
//       .from("users")
//       .select(`
//         shipping_rate,
//         shipping_rates!inner(
//           id,
//           name,
//           price,
//           min_order_amount,
//           max_order_amount,
//           active,
//           deleted_at
//         )
//       `)
//       .eq("id", userId)
//       .single()

//     if (userData?.shipping_rates) {
//       const rate = userData.shipping_rates

//       // Check if rate is active and not deleted
//       if (rate.active && !rate.deleted_at) {
//         // Check if subtotal meets the rate's conditions
//         const minAmount = rate.min_order_amount || 0
//         const maxAmount = rate.max_order_amount

//         const meetsMinimum = subtotal >= minAmount
//         const meetsMaximum = maxAmount === null || subtotal <= maxAmount

//         if (meetsMinimum && meetsMaximum) {
//           applicableRates.push({
//             id: rate.id,
//             name: rate.name || "Tarifa Personal",
//             price: rate.price || 0,
//             source: "user",
//             description: `Tarifa exclusiva asignada a tu cuenta`,
//           })
//         }
//       }
//     }
//   }

//   // Remove duplicates by ID (prefer user rates over zone rates)
//   const uniqueRates = applicableRates.filter((rate, index, self) => index === self.findIndex((r) => r.id === rate.id))

//   return uniqueRates
// }
