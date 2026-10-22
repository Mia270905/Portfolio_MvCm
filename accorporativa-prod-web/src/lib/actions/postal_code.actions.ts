"use server";

import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function getZoneByPostalCode(postalCode: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("postal_codes")
    .select(
      `
      code,
      zones:zone_id (
        id,
        name,
        shipping_price
      )
    `
    )
    .eq("code", postalCode)
    .single();

  if (error || !data) {
    console.error("Error fetching postal code zone:", error?.message);
    return null;
  }

  const zone = Array.isArray(data.zones) ? data.zones[0] : data.zones;

  if (!zone) {
    return null;
  }

  return {
    postalCode: data.code,
    zoneName: zone.name,
    shippingPrice: zone.shipping_price,
  };
}

export async function createPostalCode(
  code: string,
  createdBy: string | null,
  zoneId?: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("postal_codes")
    .insert({
      code,
      zone_id: zoneId || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      let duplicatedFields: string[] = [];
      let message = "No se pudo crear el código postal debido a duplicados: ";

      if (error.message.includes("postal_codes_code_key")) {
        duplicatedFields.push("code");
        message += "El código postal ya existe.";
      } else {
        message += "Uno o más campos únicos ya están en uso.";
        duplicatedFields.push("code");
      }

      return { success: false, fields: duplicatedFields, message };
    }

    return { success: false, message: error.message };
  }

  return { success: true, code: data };
}

export async function getAllPostalCodes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("postal_codes")
    .select("*")
    .is("deleted_at", null)
    .order("code", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getPostalCodesByZone(zoneId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("postal_codes")
    .select("code") 
    .eq("zone_id", zoneId)
    .is("deleted_at", null) 
    .order("code", { ascending: true });

  if (error) {
    console.error("Error fetching postal codes by zone:", error.message);
    return [];
  }

  if (!data) return [];

  // Devolver un array de strings con los códigos postales
  return data.map((pc: { code: string }) => pc.code);
}

export async function removePostalCode({
  postalCodeId,
  userId,
}: {
  postalCodeId: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("postal_codes")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq("id", postalCodeId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}
