"use server"

import { createClient } from "@/lib/supabase/server"
import type { ProductCategory } from "@/components/dashboard/categorias/category-list"

interface DeleteCategoryPayload {
  categoryId: string
  userId: string
}

interface CreateCategoryPayload {
  title: string
  description: string
  image_url?: string | null;
  active?: boolean
  userId: string
}

interface UpdateCategoryPayload {
  categoryId: string
  title: string
  description: string
  image_url?: string | null;
  active?: boolean
  userId: string
}

interface UpdateCategoryImagePayload {
  categoryId: string
  image_url?: string | null;
}

export async function createCategory({
  title,
  description,
  image_url = "",
  active = true,
  userId,
}: CreateCategoryPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_categories")
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

  return { success: true, data: data as ProductCategory }
}

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("product_categories")
    .select("id, title, image_url")
    .is("deleted_at", null)
    .eq("active", true)
    .order("title", { ascending: false }) 

  if (error) throw new Error(error.message)
  return data || []
}


export async function updateCategoryImage({ categoryId, image_url }: UpdateCategoryImagePayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_categories")
    .update({
      image_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", categoryId)
    .select()
    .single()

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, data: data as ProductCategory }
}

export async function updateCategory({
  categoryId,
  title,
  description,
  image_url = "",
  active = true,
  userId,
}: UpdateCategoryPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_categories")
    .update({
      title,
      description,
      image_url,
      active,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", categoryId)
    .select()
    .single()

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, data: data as ProductCategory }
}

export async function deleteCategory({ categoryId, userId }: DeleteCategoryPayload) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("product_categories")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      active: false,
    })
    .eq("id", categoryId)

  if (error) {
    return { success: false, message: error.message }
  }

  return { success: true, data }
}
