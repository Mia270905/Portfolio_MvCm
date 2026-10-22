"use server";

import { createClient } from "@/lib/supabase/server";

export interface Address {
  id: string;
  user_id: string;
  contact_id: string;
  postal_code: string;
  neighborhood: string;
  street: string;
  exterior_number: string;
  interior_number?: string;
  phone_number: string;
  full_name: string;
  email?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  deleted_by?: string;
}

export async function getUserAddresses() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { addresses: [], error: "Usuario no autenticado" };
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return { addresses: [], error: "Error al cargar direcciones" };
  }

  return { addresses: data ?? [], error: null };
}

export async function getContactAddresses(contactId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("contact_id", contactId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching addresses:", error);
    return { addresses: [], error: "Error al cargar direcciones" };
  }

  return { addresses: data ?? [], error: null };
}

// Guardar dirección para un contacto
export async function saveContactAddress(
  contactId: string,
  addressData: {
    postal_code: string;
    neighborhood: string;
    street: string;
    exterior_number: string;
    interior_number?: string | null;
    phone_number: string;
    full_name: string;
    email?: string | null;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient();

  // Verificar que el contacto existe
  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .single();

  if (!contact) {
    return { success: false, error: "Contacto no encontrado" };
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      contact_id: contactId,
      postal_code: addressData.postal_code || "",
      neighborhood: addressData.neighborhood || "",
      street: addressData.street || "",
      exterior_number: addressData.exterior_number || "",
      interior_number: addressData.interior_number || null,
      phone_number: addressData.phone_number || "",
      full_name: addressData.full_name || "",
      email: addressData.email || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving address:", error);
    return { success: false, error: "Error al guardar la dirección" };
  }

  return { success: true, id: data.id };
}


export async function saveAddress(addressData: {
  postal_code: string;
  neighborhood: string;
  street: string;
  exterior_number: string;
  interior_number?: string | null;
  phone_number: string;
  full_name: string;
  email?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuario no autenticado" };
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      postal_code: addressData.postal_code || "",
      neighborhood: addressData.neighborhood || "",
      street: addressData.street || "",
      exterior_number: addressData.exterior_number || "",
      interior_number: addressData.interior_number || null,
      phone_number: addressData.phone_number || "",
      full_name: addressData.full_name || "", 
      email: addressData.email || null, 
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving address:", error);
    return { success: false, error: "Error al guardar la dirección" };
  }

  return { success: true, id: data.id };
}

export async function saveAnonymousAddress(addressData: {
  postal_code: string;
  neighborhood: string;
  street: string;
  exterior_number: string;
  interior_number?: string | null;
  phone_number: string;
  full_name: string;
  email?: string | null;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("addresses")
    .insert(addressData)
    .select()
    .single();

  if (error) {
    console.error("Error saving anonymous address:", error);
    return { success: false, error: "Error al guardar la dirección" };
  }

  return { success: true, id: data.id };
}

export async function updateAddress(
  addressId: string,
  addressData: {
    postal_code: string;
    neighborhood: string;
    street: string;
    exterior_number: string;
    interior_number?: string | null;
    phone_number: string;
    full_name: string;
    email?: string | null;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("addresses")
    .update({
      ...addressData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", addressId);

  if (error) {
    console.error("Error updating address:", error);
    return { success: false, error: "Error al actualizar la dirección" };
  }

  return { success: true };
}

// Eliminar dirección
export async function deleteAddress(
  addressId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("addresses")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("id", addressId);

  if (error) {
    console.error("Error deleting address:", error);
    return { success: false, error: "Error al eliminar la dirección" };
  }

  return { success: true };
}
