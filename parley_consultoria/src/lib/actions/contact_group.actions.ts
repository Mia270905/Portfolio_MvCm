"use server"

import { createClient } from "@/lib/supabase/server"
import { ContactGroup } from "@/components/dashboard/grupo-de-contactos/contact-group-list"

interface CreateContactGroupPayload {
  title: string
  description: string
  image_url?: string | null;
  active?: boolean
  userId: string
}

interface UpdateContactGroupPayload {
  contactGroupId: string
  title: string
  description: string
  image_url?: string | null;
  active?: boolean
  userId: string
}

interface DeleteContactGroupPayload {
  contactGroupId: string
  userId: string
}

export async function createContactGroup({
  title,
  description,
  image_url = "",
  active = true,
  userId,
}: CreateContactGroupPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contact_groups")
    .insert([
      {
        title,
        description,
        image_url,
        active,
        created_by: userId,
      },
    ])
    .select()
    .single()

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, data: data as ContactGroup }
}

export async function updateContactGroup({
  contactGroupId,
  title,
  description,
  image_url = "",
  active = true,
  userId,
}: UpdateContactGroupPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contact_groups")
    .update({
      title,
      description,
      image_url,
      active,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", contactGroupId)
    .select()
    .single()

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, data: data as ContactGroup }
}

export async function deleteContactGroup({ contactGroupId, userId }: DeleteContactGroupPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("contact_groups")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      active: false,
    })
    .eq("id", contactGroupId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, data }
}

/**
 * Obtiene un grupo de contacto por su ID (solo si no está eliminado)
 */
export async function getContactGroupById(contactGroupId: string): Promise<ContactGroup | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contact_groups")
    .select(`
      *,
      related_user:related_user_id (id, title, description, active)
    `)
    .eq("id", contactGroupId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener grupo de contacto:", error);
    return null;
  }

  return data;
}