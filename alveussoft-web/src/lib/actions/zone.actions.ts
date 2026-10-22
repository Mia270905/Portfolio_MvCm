"use server";

import { createClient } from "@/lib/supabase/server";

export interface Zone {
  id: string;
  name: string;
  shipping_price: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

interface DeleteZonePayload {
  zoneId: string;
  userId: string;
}

interface CreateZonePayload {
  name: string;
  shipping_price: number;
  userId: string;
}

interface UpdateZonePayload {
  zoneId: string;
  name: string;
  shipping_price: number;
  userId: string;
}

export interface PostalCode {
  id: string;
  code: string;
  zone_id: string;
  created_at: string;
  updated_at: string;
}

export async function createZone({
  name,
  shipping_price,
  userId,
}: CreateZonePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("zones")
    .insert([
      {
        name,
        shipping_price,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as Zone };
}

export async function getZones() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("zones")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateZone({
  zoneId,
  name,
  shipping_price,
  userId,
}: UpdateZonePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("zones")
    .update({
      name,
      shipping_price,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", zoneId)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data: data as Zone };
}

export async function deleteZone({ zoneId, userId }: DeleteZonePayload) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("zones")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq("id", zoneId);

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}


export async function getZoneWithPostalCodes(zoneId: string) {
  const supabase = await createClient();

  // Traer datos de la zona
  const { data: zone, error: zoneError } = await supabase
    .from("zones")
    .select("*")
    .eq("id", zoneId)
    .is("deleted_at", null)
    .single();

  if (zoneError) throw new Error(zoneError.message);
  if (!zone) return null;

  // Traer códigos postales asociados a la zona
  const { data: postalCodes, error: postalError } = await supabase
    .from("postal_codes")
    .select("*")
    .eq("zone_id", zoneId)
    .is("deleted_at", null)
    .order("code", { ascending: true });

  if (postalError) throw new Error(postalError.message);

  return {
    ...zone,
    postal_codes: postalCodes || [],
  };
}

export async function getZones_WithPostalCodes() {
  const supabase = await createClient();

  const { data: zones, error: zonesError } = await supabase
    .from("zones")
    .select(
      `
      *,
      postal_codes (
        id,
        code,
        zone_id,
        created_at,
        updated_at
      )
    `
    )
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (zonesError) throw new Error(zonesError.message);

  return zones || [];
}

export async function addPostalCodesToZone({
  zoneId,
  postalCodes,
  userId,
}: {
  zoneId: string;
  postalCodes: string[];
  userId: string;
}) {
  const supabase = await createClient();

  // Remove duplicates and empty strings
  const uniqueCodes = [...new Set(postalCodes.filter((code) => code.trim()))];

  const postalCodeRecords = uniqueCodes.map((code) => ({
    code: code.trim(),
    zone_id: zoneId,
    created_by: userId,
  }));

  const { data, error } = await supabase
    .from("postal_codes")
    .insert(postalCodeRecords)
    .select();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}


export async function updateZonePostalCodes({
  zoneId,
  postalCodes,
  userId,
}: {
  zoneId: string;
  postalCodes: string[];
  userId: string;
}) {
  const supabase = await createClient();

  const { data: currentCodesData, error: fetchError } = await supabase
    .from("postal_codes")
    .select("id, code, zone_id")
    .eq("zone_id", zoneId)
    .is("deleted_at", null);

  if (fetchError) {
    return { success: false, message: fetchError.message };
  }

  const currentCodes = currentCodesData.map((c: any) => c.code);

  const codesToAdd = postalCodes.filter((c) => !currentCodes.includes(c));

  const codesToUnlink = currentCodesData
    .filter((c: any) => !postalCodes.includes(c.code))
    .map((c: any) => c.id);

  if (codesToAdd.length > 0) {
    const { error: addError } = await supabase
      .from("postal_codes")
      .update({
        zone_id: zoneId,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .in("code", codesToAdd)
      .is("deleted_at", null);

    if (addError) {
      return { success: false, message: addError.message };
    }
  }

  if (codesToUnlink.length > 0) {
    const { error: unlinkError } = await supabase
      .from("postal_codes")
      .update({
        zone_id: null,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .in("id", codesToUnlink);

    if (unlinkError) {
      return { success: false, message: unlinkError.message };
    }
  }

  return { success: true, data: true };
}

export async function deletePostalCode({
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
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", postalCodeId)
    .select()
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}