"use server";

import { createClient } from "@/lib/supabase/server";
import { BillingData } from "@/components/historial/billing/billing-data-form";

export async function saveBillingInfo(
  userId: string,
  data: BillingData
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("No se pudo obtener el usuario. Por favor inicia sesión.")
  }

  const currentUserId = user.id

  const { data: result, error } = await supabase
    .from("billing_info")
    .insert([
      {
        user_id: userId,
        rfc: data.rfc,
        name: data.name,
        tax_regime: data.tax_regime,
        cfdi_use: data.cfdi_use,
        tax_zip_code: data.zip_code,
        email: data.email,
        street: data.street,
        exterior_number: data.exterior_number,
        interior_number: data.interior_number,
        neighborhood: data.neighborhood,
        locality: data.locality,
        municipality: data.municipality,
        state: data.state,
        country: data.country || "MEX",
        zip_code: data.zip_code,
        created_by: currentUserId,
        updated_by: currentUserId,
      },
    ])
    .select();

  if (error) throw error;
  return result;
}

export async function getBillingData(userId: string): Promise<BillingData | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("billing_info")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      throw error
    }

    return data || null
  } catch (err) {
    console.error("Error al obtener datos de facturación:", err)
    return null
  }
}
