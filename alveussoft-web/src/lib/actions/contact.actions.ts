"use server";


import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Contact {
  id: string;
  full_name: string;
  job_position: string | null;
  phone: string | null;
  mobile: string | null;
  email: string;
  website: string | null;
  title: string | null;
  rfc: string | null;
  curp: string | null;
  notes: string | null;
  birth_date: string | null;
  related_user_id: string | null;
  related_user?: { id: string; full_name: string; email: string; active: boolean } | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  group_contacts?: { group_id: string; title: string }[]; // ✔ grupos
}
export interface GroupContactItem {
  id_contacts: string;
  group?: { id: string; title: string } | null;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GroupContactsResponse {
  groupContacts: GroupContacts[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
export interface GroupContacts {
  id: string
  id_contact_groups: string
  created_at: string
  updated_at: string
  contact: Contact | null
}

interface CreateGroupContactsPayload {
  id_contact_groups: string
  id_contacts: string
  active?: boolean
  userId: string
}

/**
 * Obtiene contactos con paginación
 * @param page - Número de página (inicia en 1)
 * @param pageSize - Cantidad de items por página
 * @param searchQuery - Término de búsqueda (opcional)
 * @returns Objeto con contactos, total, página actual y total de páginas
 */export async function getContacts(
  page = 1,
  pageSize = 50,
  searchQuery = "",
  includeGroups = false
): Promise<ContactsResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // 🔹 Consulta base de contactos
  let query = supabase
    .from("contacts")
    .select(
      `
      *,
      related_user:related_user_id(id, full_name, email, active)
      `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  // 🔹 Filtro de búsqueda
  if (searchQuery) {
    const q = `%${searchQuery}%`;
    query = query.or(
      `full_name.ilike.${q},email.ilike.${q},phone.ilike.${q},mobile.ilike.${q},notes.ilike.${q}`
    );
  }

  // 🔹 Ejecutar consulta
  const { data: contacts, error, count } = await query.range(from, to);

  if (error) throw new Error(`Error al obtener contactos: ${error.message}`);
  if (!contacts || contacts.length === 0) {
    return {
      contacts: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  let contactsWithGroups: Contact[] = contacts as Contact[];

  if (includeGroups) {
    const contactIds = contactsWithGroups.map(c => c.id);

    type GroupJoin = {
      id_contacts: string;
      group: { id: string; title: string } | null | { id: string; title: string }[];
    };

    const { data: groupsData, error: groupsError } = await supabase
      .from("group_contacts")
      .select(`id_contacts, group: id_contact_groups(id, title)`)
      .in("id_contacts", contactIds) as { data: GroupJoin[]; error: any };

    if (groupsError)
      console.warn("Error al obtener grupos de contactos:", groupsError.message);

    if (groupsData && groupsData.length > 0) {
      contactsWithGroups = contactsWithGroups.map(contact => {
        const contactGroups = groupsData
          .filter(g => g.id_contacts === contact.id)
          .flatMap(g => {
            if (!g.group) return [];
            if (Array.isArray(g.group)) {
              return g.group.map(gr => ({ group_id: gr.id, title: gr.title }));
            } else {
              return [{ group_id: g.group.id, title: g.group.title }];
            }
          });

        return { ...contact, group_contacts: contactGroups };
      });

      // 🔹 IMPRIMIR CONTACTOS POR GRUPO
      const gruposMap: Record<string, { title: string; contacts: Contact[] }> = {};

      contactsWithGroups.forEach(contact => {
        contact.group_contacts?.forEach(g => {
          if (!gruposMap[g.group_id]) {
            gruposMap[g.group_id] = { title: g.title, contacts: [] };
          }
          gruposMap[g.group_id].contacts.push(contact);
        });
      });

      // Mostrar resultados en consola
      for (const groupId in gruposMap) {
        console.log(`Grupo: ${gruposMap[groupId].title}`);
        gruposMap[groupId].contacts.forEach(c =>
          console.log(`  - ${c.full_name} (${c.email})`)
        );
      }
    }
  }

  return {
    contacts: contactsWithGroups,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: count ? Math.ceil(count / pageSize) : 0,
  };
}



/**
 * Obtener todos los grupos únicos para el selector
 */
export async function getContactGroups(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contact_groups") // ← aquí pon el nombre correcto
    .select("id, title")
    .eq("active", true); // si tienes ese campo

  if (error) {
    console.error("Error al obtener grupos:", error.message);
    return [];
  }

  return data ?? [];
}


/**
 * Obtiene un contacto por su ID (solo si no está eliminado)
 */
export async function getContactById(contactId: string): Promise<Contact | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select(`
      *,
      related_user:related_user_id (id, full_name, email, active)
    `)
    .eq("id", contactId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener contacto:", error);
    return null;
  }

  return data;
}

export async function getContactsByGroupIdPaginated(
  groupId: string,
  page = 1,
  pageSize = 50,
  searchQuery = ""
): Promise<GroupContactsResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
  .from("group_contacts")
  .select(`
    id,
    id_contact_groups,
    created_at,
    updated_at,
    contact:id_contacts!inner (  
      *,
      related_user:related_user_id (id, full_name, email, active)
    )
  `, { count: "exact" })
  .eq("id_contact_groups", groupId)
  .eq("active", true)
  .is("deleted_at", null)
  .is("contact.deleted_at", null)

  if (searchQuery) {
    query = query.or(`
      contact.full_name.ilike.%${searchQuery}%,
      contact.email.ilike.%${searchQuery}%,
      contact.phone.ilike.%${searchQuery}%,
      contact.notes.ilike.%${searchQuery}%
    `);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error("Error al obtener contactos del grupo");
  }

  const groupContacts: GroupContacts[] = (data ?? []).map((item: any) => {
    const contactData = Array.isArray(item.contact) ? item.contact[0] : item.contact;
    
    return {
      id: item.id,
      id_contact_groups: item.id_contact_groups,
      created_at: item.created_at,
      updated_at: item.updated_at,
      contact: contactData ?? null,
    };
  });
  
  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
  groupContacts,
  total: count ?? 0,
  page,
  pageSize,
  totalPages: totalPages,
};
}

/**
 * Obtiene los IDs de contactos en un grupo de contactos
 * @param groupId - ID del grupo de contactos
 * @returns Resultado de la operación
 */
async function getContactIdsInGroup(groupId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_contacts")
    .select("id_contacts")
    .eq("id_contact_groups", groupId)
    .eq("active", true)
    .is("deleted_at", null);

  if (error) {
    throw new Error("Error al obtener contactos del grupo");
  }

  return data.map(row => row.id_contacts as string);
}

/**
 * Obtiene contactos disponibles para agregar a un grupo
 */
export async function getAvailableContactsForGroup(
  groupId: string,
  page = 1,
  pageSize = 50,
  searchQuery = ""
): Promise<ContactsResponse> {
  const supabase = await createClient();

  // const excludedIds = await getContactIdsInGroup(groupId);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("contacts")
    .select(`
      *,
      related_user:related_user_id (id, full_name, email, active)
    `, { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // 🔥 excluir SOLO los del grupo actual
  // if (excludedIds.length > 0) {
  //   query = query.not("id", "in", `(${excludedIds.join(",")})`);
  // }

  if (searchQuery) {
    query = query.or(
      `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Error al obtener contactos disponibles: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    contacts: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene los grupos asignados a un contacto
 * @param contactId - ID del contacto
 * @returns Array de grupos asignados
 */
export async function getGroupsByContactId(contactId: string): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_contacts")
    .select(`
      id_contact_groups,
      group:id_contact_groups (id, title)
    `)
    .eq("id_contacts", contactId)
    .eq("active", true)
    .is("deleted_at", null);

  if (error) {
    console.error("Error al obtener grupos del contacto:", error);
    return [];
  }

  // Extraer y formatear la información del grupo
  return (data || []).map((item: any) => {
    // Manejar caso donde group puede ser un array o un objeto (dependiendo de la FK de supabase)
    const groupData = Array.isArray(item.group) ? item.group[0] : item.group;
    return {
      id: groupData?.id || item.id_contact_groups,
      title: groupData?.title || "Grupo desconocido",
    };
  }).filter(g => g.id); // Asegurar que tengan ID
}

/**
 * Actualiza los grupos asignados a un contacto (Reemplazo completo)
 * @param contactId - ID del contacto
 * @param groupIds - Array de IDs de los grupos a asignar
 * @param userId - ID del usuario que realiza la acción
 * @returns Resultado de la operación
 */
export async function updateContactGroups(
  contactId: string,
  groupIds: string[],
  userId?: string
): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  try {
    // 1. Obtener grupos actuales
    const { data: currentGroups, error: fetchError } = await supabase
      .from("group_contacts")
      .select("id_contact_groups, id")
      .eq("id_contacts", contactId)
      .is("deleted_at", null);

    if (fetchError) throw fetchError;

    const currentGroupIds = currentGroups.map(g => g.id_contact_groups);

    // 2. Determinar cuáles agregar y cuáles eliminar lógicamente
    const toAdd = groupIds.filter(id => !currentGroupIds.includes(id));
    const toRemove = currentGroupIds.filter(id => !groupIds.includes(id));

    // 3. Eliminar lógicamente (soft delete) los que ya no están seleccionados
    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("group_contacts")
        .update({
          deleted_at: new Date().toISOString(),
          active: false,
          updated_by: userId || null
        })
        .eq("id_contacts", contactId)
        .in("id_contact_groups", toRemove);

      if (removeError) throw removeError;
    }

    // 4. Agregar los nuevos (upsert para recuperar si estaban soft-deleted)
    if (toAdd.length > 0) {
      const { error: addError } = await supabase
        .from("group_contacts")
        .upsert(
          toAdd.map((groupId) => ({
            id_contacts: contactId,
            id_contact_groups: groupId,
            active: true,
            deleted_at: null, // Reactivar si fue eliminado previamente
            updated_by: userId || null,
          })),
          { onConflict: "id_contacts,id_contact_groups" }
        );

      if (addError) throw addError;
    }

    // Revalidar paths que puedan mostrar la información de grupos
    revalidatePath("/dashboard/contacts-parent/contacts");
    revalidatePath(`/dashboard/contacts-parent/contacts/edit/${contactId}`);
    revalidatePath("/dashboard/contacts-parent/grupo-contactos");

    return { success: true };
  } catch (error: any) {
    console.error("Error al actualizar grupos del contacto:", error);
    return { success: false, message: error.message || "Error al actualizar los grupos" };
  }
}

/**
 * Obtiene los nombres de contactos por sus IDs
 * @param ids - Array de IDs de contactos
 * @returns Map de ID -> nombre
 */
export async function getContactNamesByIds(
  ids: string[]
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("id, full_name")
    .in("id", ids);

  if (error) {
    console.error("Error al obtener nombres de contactos:", error);
    return new Map();
  }

  return new Map(data?.map((item) => [item.id, item.full_name]) || []);
}



/**
 * Crea un nuevo contacto
 * @param contactData - Datos del contacto a crear
 * @returns Resultado de la operación
 */
export async function createContact(contactData: {
  full_name: string;
  job_position?: string;
  phone?: string;
  mobile?: string;
  email: string;
  website?: string;
  title?: string;
  rfc?: string;
  curp?: string;
  notes?: string; 
  birth_date?: string; 
  related_user_id?: string;
}): Promise<{
  success: boolean;
  message?: string;
  contact?: Contact;
}> {
  const supabase = await createClient();

  if (!contactData.full_name?.trim()) {
    return { success: false, message: "El nombre es obligatorio" };
  }

  if (!contactData.email?.trim()) {
    return { success: false, message: "El correo electrónico es obligatorio" };
  }

  // Validar formato de fecha de nacimiento si se proporciona
  if (contactData.birth_date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(contactData.birth_date)) {
      return { success: false, message: "Formato de fecha de nacimiento inválido. Use YYYY-MM-DD" };
    }
  }

  // Verificar si el usuario ya está relacionado con otro contacto
  if (contactData.related_user_id) {
    const { data: existingContactWithUser } = await supabase
      .from("contacts")
      .select("id, full_name")
      .eq("related_user_id", contactData.related_user_id)
      .is("deleted_at", null)
      .single();

    if (existingContactWithUser) {
      return { 
        success: false, 
        message: `El usuario seleccionado ya está relacionado con el contacto: ${existingContactWithUser.full_name}` 
      };
    }
  }

  try {
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        full_name: contactData.full_name,
        job_position: contactData.job_position || null,
        phone: contactData.phone || null,
        mobile: contactData.mobile || null,
        email: contactData.email,
        website: contactData.website || null,
        title: contactData.title || null,
        rfc: contactData.rfc || null,
        curp: contactData.curp || null,
        notes: contactData.notes || null, 
        birth_date: contactData.birth_date || null, 
        related_user_id: contactData.related_user_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        if (error.message.includes("email")) {
          return { success: false, message: "El correo electrónico ya está en uso por otro contacto." };
        }
        if (error.message.includes("related_user_id")) {
          return { success: false, message: "El usuario seleccionado ya está relacionado con otro contacto." };
        }
      }
      return { success: false, message: error.message };
    }

    revalidatePath("dashboard/contacts");
    return { success: true, contact: data };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

export async function createGroupContacts({
  id_contact_groups,
  contactIds,
  active = true,
  userId,
}: {
  id_contact_groups: string;
  contactIds: string[];
  active?: boolean
  userId?: string
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_contacts")
    .upsert(
      contactIds.map((id) => ({
        id_contacts: id,
        id_contact_groups,
        active,
        updated_by: userId ?? null,
      })),
      { onConflict: "id_contacts,id_contact_groups" }
    );

  if (error) {
    return { success: false };
  }

  return {
    success: true,
    inserted: contactIds.length,
  };
}

/**
 * Actualiza un contacto existente
 * @param contactId - ID del contacto a actualizar
 * @param contactData - Datos del contacto a actualizar
 * @returns Resultado de la operación
 */
export async function updateContact(
  contactId: string,
  contactData: {
    full_name?: string;
    job_position?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    website?: string;
    title?: string;
    rfc?: string;
    curp?: string;
    notes?: string;
    birth_date?: string | null;
    related_user_id?: string | null;
  }
): Promise<{
  success: boolean;
  message?: string;
  contact?: Contact;
}> {
  try {
    const supabase = await createClient();

    // 1. Verificar que el contacto existe
    const { data: existingContact, error: findError } = await supabase
      .from("contacts")
      .select("id, email, related_user_id")
      .eq("id", contactId)
      .single();

    if (findError || !existingContact) {
      return { success: false, message: "Contacto no encontrado" };
    }

    // 2. Validaciones 
    if (contactData.full_name !== undefined && !contactData.full_name.trim()) {
      return { success: false, message: "El nombre es obligatorio" };
    }

    if (contactData.email !== undefined && !contactData.email.trim()) {
      return { success: false, message: "El correo electrónico es obligatorio" };
    }

    // Validar formato de fecha de nacimiento si se proporciona
    if (contactData.birth_date !== undefined && contactData.birth_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(contactData.birth_date)) {
        return { success: false, message: "Formato de fecha de nacimiento inválido. Use YYYY-MM-DD" };
      }
    }

    // 3. Validar email único (si se está cambiando)
    if (contactData.email && contactData.email !== existingContact.email) {
      const { data: duplicate } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", contactData.email)
        .neq("id", contactId)
        .single();

      if (duplicate) {
        return { success: false, message: "El correo electrónico ya está en uso por otro contacto." };
      }
    }

    // Verificar si el usuario ya está relacionado con OTRO contacto
    if (contactData.related_user_id && contactData.related_user_id !== existingContact.related_user_id) {
      const { data: existingContactWithUser } = await supabase
        .from("contacts")
        .select("id, full_name")
        .eq("related_user_id", contactData.related_user_id)
        .neq("id", contactId)
        .is("deleted_at", null)
        .single();

      if (existingContactWithUser) {
        return { 
          success: false, 
          message: `El usuario seleccionado ya está relacionado con el contacto: ${existingContactWithUser.full_name}` 
        };
      }
    }

    // 4. Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Agregar solo los campos que tienen valor
    if (contactData.full_name !== undefined) updateData.full_name = contactData.full_name;
    if (contactData.job_position !== undefined) updateData.job_position = contactData.job_position;
    if (contactData.phone !== undefined) updateData.phone = contactData.phone;
    if (contactData.mobile !== undefined) updateData.mobile = contactData.mobile;
    if (contactData.email !== undefined) updateData.email = contactData.email;
    if (contactData.website !== undefined) updateData.website = contactData.website;
    if (contactData.title !== undefined) updateData.title = contactData.title;
    if (contactData.rfc !== undefined) updateData.rfc = contactData.rfc;
    if (contactData.curp !== undefined) updateData.curp = contactData.curp;
    if (contactData.notes !== undefined) updateData.notes = contactData.notes; 
    if (contactData.birth_date !== undefined) updateData.birth_date = contactData.birth_date; 

    // Manejar related_user_id (puede ser null para desvincular)
    if (contactData.related_user_id !== undefined) {
      updateData.related_user_id = contactData.related_user_id;
    }

    // 5. Ejecutar el UPDATE
    const { data, error } = await supabase
      .from("contacts")
      .update(updateData)
      .eq("id", contactId)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar contacto:", error);
      
      // Manejar errores de constraint único
      if (error.code === "23505") {
        return { success: false, message: "El correo electrónico ya está en uso por otro contacto." };
      }

      return { success: false, message: `Error de base de datos: ${error.message}` };
    }

    // 6. Revalidar paths
    revalidatePath("dashboard/contacts");
    revalidatePath("dashboard/contacts/edit");

    return { success: true, contact: data };
  } catch (error: any) {
    console.error("Error general en updateContact:", error);
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Elimina un contacto
 * @param contactId - ID del contacto a eliminar
 * @returns Resultado de la operación
 */
export async function deleteContact(contactId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    // Obtener el usuario autenticado para logged de quién eliminó
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("contacts")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null, 
      })
      .eq("id", contactId);

    if (error) {
      console.error("Error al eliminar contacto:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("dashboard/contacts");
    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Elimina un contacto de un grupo de contactos
 * @param id - ID del contacto a eliminar
 * @returns Resultado de la operación
 */
export async function deleteGroupContacts(id: string) {
  const supabase = await createClient();
   
    const { data, error } = await supabase
      .from("group_contacts")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar contacto del grupo:", error);
      return { success: false, message: error.message };
    }

    return { success: true, data };
}

/**
 * Obtiene todos los contactos (sin paginación, solo los no eliminados)
 */
export async function getAllContacts(): Promise<Contact[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .is("deleted_at", null) // ← FILTRO IMPORTANTE
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error al obtener contactos:", error);
    return [];
  }

  return data || [];
}

/**
 * Busca contactos por nombre o email (solo los no eliminados)
 */
export async function searchContacts(
  query: string, 
  page = 1, 
  pageSize = 50
): Promise<{ contacts: Contact[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const supabase = await createClient();

  let supabaseQuery = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  // Si hay query, aplicar filtro
  if (query.trim().length >= 1) {
    supabaseQuery = supabaseQuery.or(
      `full_name.ilike.%${query}%,email.ilike.%${query}%,notes.ilike.%${query}%`
    );
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabaseQuery.range(from, to);

  if (error) {
    console.error("Error al buscar contactos:", error);
    return { contacts: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    contacts: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}