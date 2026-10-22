"use server"

import { createClient } from "@/lib/supabase/server"

export interface Address {
  id: string
  user_id: string
  postal_code: string
  neighborhood: string
  street: string
  exterior_number: string
  interior_number?: string
  phone_number: string
  created_at: string
  updated_at: string
  deleted_at?: string
  deleted_by?: string
}

export async function getUserAddresses(): Promise<Address[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching addresses:", error)
    return []
  }

  return data || []
}

export async function saveAddress(addressData: {
  postal_code: string
  neighborhood: string
  street: string
  exterior_number: string
  interior_number?: string | null
  phone_number: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Usuario no autenticado" }
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      ...addressData,
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving address:", error)
    return { success: false, error: "Error al guardar la dirección" }
  }

  return { success: true, id: data.id }
}

export async function saveAnonymousAddress(addressData: {
  postal_code: string
  neighborhood: string
  street: string
  exterior_number: string
  interior_number?: string | null
  phone_number: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      ...addressData,
      // No incluimos user_id, será null
    })
    .select()
    .single()

  if (error) {
    console.error("Error saving anonymous address:", error)
    return { success: false, error: "Error al guardar la dirección" }
  }

  return { success: true, id: data.id }
}

export async function updateAddress(
  addressId: string,
  addressData: {
    postal_code: string
    neighborhood: string
    street: string
    exterior_number: string
    interior_number?: string | null
    phone_number: string
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Usuario no autenticado" }
  }

  const { error } = await supabase
    .from("addresses")
    .update({
      ...addressData,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq("id", addressId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error updating address:", error)
    return { success: false, error: "Error al actualizar la dirección" }
  }

  return { success: true }
}

export async function deleteAddress(addressId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Usuario no autenticado" }
  }

  const { error } = await supabase
    .from("addresses")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq("id", addressId)
    .eq("user_id", user.id)

  if (error) {
    console.error("Error deleting address:", error)
    return { success: false, error: "Error al eliminar la dirección" }
  }

  return { success: true }
}
