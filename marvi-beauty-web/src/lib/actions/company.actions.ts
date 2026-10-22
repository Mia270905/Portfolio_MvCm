"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Company {
  id: string;
  name: string;
  street: string | null;
  colony: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  address_number: string | null;
  phone: string | null;
  cellphone: string | null;
  website: string | null;
  rfc: string | null;
  parent_company: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  parent_company_data?: {
    id: string;
    name: string;
    rfc: string | null;
  } | null;
  child_companies?: {
    id: string;
    name: string;
    rfc: string | null;
    parent_company: string | null;
  }[];
}

export interface CompaniesResponse {
  companies: Company[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Obtiene companies con paginación
 * @param page - Número de página (inicia en 1)
 * @param pageSize - Cantidad de items por página
 * @param searchQuery - Término de búsqueda (opcional)
 * @param sortBy - Campo para ordenar (opcional)
 * @param sortOrder - Orden ascendente o descendente (opcional)
 * @returns Objeto con companies, total, página actual y total de páginas
 */
export async function getCompanies(
  page = 1,
  pageSize = 50,
  searchQuery = "",
  sortBy = "created_at",
  sortOrder: "asc" | "desc" = "desc"
): Promise<CompaniesResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc),
      child_companies:companies!parent_company (id, name, rfc, parent_company)
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order(sortBy, { ascending: sortOrder === "asc" });

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,rfc.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Error al obtener empresas: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    companies: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

export async function getRootCompanies(ignoreId?: string): Promise<Company[]> {
  const supabase = await createClient();

   let query = supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc),
      child_companies:companies!parent_company (id, name, rfc, parent_company)
    `
    )
    .is("deleted_at", null)
    .is("parent_company", null) // Solo empresas que no tienen padre
    .order("name", { ascending: true });

  // Aplicar filtro solo si ignoreId existe
  if (ignoreId) {
    query = query.neq("id", ignoreId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener empresas raíz:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene una empresa por su ID (solo si no está eliminada)
 */
export async function getCompanyById(
  companyId: string
): Promise<Company | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc),
      child_companies:companies!parent_company (id, name, rfc, parent_company)
    `
    )
    .eq("id", companyId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener empresa:", error);
    return null;
  }

  return data;
}

/**
 * Obtiene una empresa por su RFC (solo si no está eliminada)
 */
export async function getCompanyByRfc(rfc: string): Promise<Company | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc)
    `
    )
    .eq("rfc", rfc)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener empresa por RFC:", error);
    return null;
  }

  return data;
}

/*
 * Verifica si una empresa tiene empresas hijas
 */
export async function checkCompanyHasChildren(
  companyId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("parent_company", companyId)
    .is("deleted_at", null)
    .limit(1);

  if (error) {
    console.error("Error verificando empresas hijas:", error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * Crea una nueva empresa
 * @param companyData - Datos de la empresa a crear
 * @returns Resultado de la operación
 */
export async function createCompany(companyData: {
  name: string;
  street?: string | null;
  colony?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  address_number?: string | null;
  phone?: string | null;
  cellphone?: string | null;
  website?: string | null;
  rfc?: string | null;
  parent_company?: string | null;
}): Promise<{
  success: boolean;
  message?: string;
  company?: Company;
}> {
  const supabase = await createClient();

  // Validaciones básicas
  if (!companyData.name?.trim()) {
    return { success: false, message: "El nombre es obligatorio" };
  }

  // Validar formato del RFC (si se proporciona)
  if (companyData.rfc && companyData.rfc.trim()) {
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!rfcRegex.test(companyData.rfc.toUpperCase())) {
      return {
        success: false,
        message: "El formato del RFC no es válido",
      };
    }
  }

  // Validar formato del teléfono (si se proporciona)
  if (companyData.phone && companyData.phone.trim()) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(companyData.phone)) {
      return {
        success: false,
        message: "El formato del teléfono no es válido",
      };
    }
  }

  // Validar formato del celular (si se proporciona)
  if (companyData.cellphone && companyData.cellphone.trim()) {
    const cellphoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!cellphoneRegex.test(companyData.cellphone)) {
      return {
        success: false,
        message: "El formato del celular no es válido",
      };
    }
  }

  // Validar formato del website (si se proporciona)
  if (companyData.website && companyData.website.trim()) {
    const websiteRegex =
      /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
    if (!websiteRegex.test(companyData.website)) {
      return {
        success: false,
        message: "El formato del website no es válido",
      };
    }
  }

  // Verificar si el RFC ya existe (si se proporciona)
  if (companyData.rfc && companyData.rfc.trim()) {
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("rfc", companyData.rfc.trim().toUpperCase())
      .is("deleted_at", null)
      .single();

    if (existingCompany) {
      return {
        success: false,
        message: "El RFC ya está en uso por otra empresa",
      };
    }
  }

  // Verificar que la empresa padre existe (si se proporciona)
  if (companyData.parent_company) {
    const { data: parentCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("id", companyData.parent_company)
      .is("deleted_at", null)
      .single();

    if (!parentCompany) {
      return {
        success: false,
        message: "La empresa padre seleccionada no existe",
      };
    }
  }

  try {
    const { data, error } = await supabase
      .from("companies")
      .insert({
        name: companyData.name.trim(),
        street: companyData.street?.trim() || null,
        colony: companyData.colony?.trim() || null,
        city: companyData.city?.trim() || null,
        state: companyData.state?.trim() || null,
        zip_code: companyData.zip_code?.trim() || null,
        address_number: companyData.address_number?.trim() || null,
        phone: companyData.phone?.trim() || null,
        cellphone: companyData.cellphone?.trim() || null,
        website: companyData.website?.trim() || null,
        rfc: companyData.rfc?.trim().toUpperCase() || null,
        parent_company: companyData.parent_company || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        parent_company_data:parent_company (id, name, rfc)
      `
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        if (error.message.includes("rfc")) {
          return {
            success: false,
            message: "El RFC ya está en uso por otra empresa.",
          };
        }
      }
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/companies");
    return { success: true, company: data };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Actualiza una empresa existente
 * @param companyId - ID de la empresa a actualizar
 * @param companyData - Datos de la empresa a actualizar
 * @returns Resultado de la operación
 */
export async function updateCompany(
  companyId: string,
  companyData: {
    name?: string;
    street?: string | null;
    colony?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    address_number?: string | null;
    phone?: string | null;
    cellphone?: string | null;
    website?: string | null;
    rfc?: string | null;
    parent_company?: string | null;
  }
): Promise<{
  success: boolean;
  message?: string;
  company?: Company;
}> {
  try {
    const supabase = await createClient();

    // 1. Verificar que la empresa existe
    const { data: existingCompany, error: findError } = await supabase
      .from("companies")
      .select("id, name, rfc, parent_company")
      .eq("id", companyId)
      .is("deleted_at", null)
      .single();

    if (findError || !existingCompany) {
      return { success: false, message: "Empresa no encontrada" };
    }

    // 2. Validaciones
    if (companyData.name !== undefined && !companyData.name.trim()) {
      return { success: false, message: "El nombre es obligatorio" };
    }

    if (
      companyData.rfc !== undefined &&
      companyData.rfc &&
      companyData.rfc.trim()
    ) {
      const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
      if (!rfcRegex.test(companyData.rfc.toUpperCase())) {
        return {
          success: false,
          message: "El formato del RFC no es válido",
        };
      }

      // Validar RFC único (si se está cambiando)
      if (companyData.rfc.trim().toUpperCase() !== existingCompany.rfc) {
        const { data: duplicate } = await supabase
          .from("companies")
          .select("id, name")
          .eq("rfc", companyData.rfc.trim().toUpperCase())
          .neq("id", companyId)
          .is("deleted_at", null)
          .single();

        if (duplicate) {
          return {
            success: false,
            message: `El RFC ya está en uso por la empresa: ${duplicate.name}`,
          };
        }
      }
    }

    // Validaciones de formato para teléfonos y website
    if (companyData.phone && companyData.phone.trim()) {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(companyData.phone)) {
        return {
          success: false,
          message: "El formato del teléfono no es válido",
        };
      }
    }

    if (companyData.cellphone && companyData.cellphone.trim()) {
      const cellphoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
      if (!cellphoneRegex.test(companyData.cellphone)) {
        return {
          success: false,
          message: "El formato del celular no es válido",
        };
      }
    }

    if (companyData.website && companyData.website.trim()) {
      const websiteRegex =
        /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/;
      if (!websiteRegex.test(companyData.website)) {
        return {
          success: false,
          message: "El formato del website no es válido",
        };
      }
    }

    // 3. Verificar que la empresa padre existe y no crea referencias circulares
    if (companyData.parent_company !== undefined) {
      if (companyData.parent_company === companyId) {
        return {
          success: false,
          message: "Una empresa no puede ser padre de sí misma",
        };
      }

      if (companyData.parent_company) {
        const { data: parentCompany } = await supabase
          .from("companies")
          .select("id, parent_company")
          .eq("id", companyData.parent_company)
          .is("deleted_at", null)
          .single();

        if (!parentCompany) {
          return {
            success: false,
            message: "La empresa padre seleccionada no existe",
          };
        }

        // Verificar referencia circular (la empresa padre no puede ser hija de esta empresa)
        let currentParent = parentCompany.parent_company;
        while (currentParent) {
          if (currentParent === companyId) {
            return {
              success: false,
              message:
                "No se puede asignar como padre una empresa que ya es hija de esta empresa",
            };
          }

          const { data: nextParent } = await supabase
            .from("companies")
            .select("parent_company")
            .eq("id", currentParent)
            .single();

          currentParent = nextParent?.parent_company;
        }
      }
    }

    // 4. Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Agregar solo los campos que tienen valor
    if (companyData.name !== undefined)
      updateData.name = companyData.name.trim();
    if (companyData.street !== undefined)
      updateData.street = companyData.street?.trim() || null;
    if (companyData.colony !== undefined)
      updateData.colony = companyData.colony?.trim() || null;
    if (companyData.city !== undefined)
      updateData.city = companyData.city?.trim() || null;
    if (companyData.state !== undefined)
      updateData.state = companyData.state?.trim() || null;
    if (companyData.zip_code !== undefined)
      updateData.zip_code = companyData.zip_code?.trim() || null;
    if (companyData.address_number !== undefined)
      updateData.address_number = companyData.address_number?.trim() || null;
    if (companyData.phone !== undefined)
      updateData.phone = companyData.phone?.trim() || null;
    if (companyData.cellphone !== undefined)
      updateData.cellphone = companyData.cellphone?.trim() || null;
    if (companyData.website !== undefined)
      updateData.website = companyData.website?.trim() || null;
    if (companyData.rfc !== undefined)
      updateData.rfc = companyData.rfc?.trim().toUpperCase() || null;
    if (companyData.parent_company !== undefined)
      updateData.parent_company = companyData.parent_company;

    // 5. Ejecutar el UPDATE
    const { data, error } = await supabase
      .from("companies")
      .update(updateData)
      .eq("id", companyId)
      .select(
        `
        *,
        parent_company_data:parent_company (id, name, rfc)
      `
      )
      .single();

    if (error) {
      console.error("Error al actualizar empresa:", error);

      if (error.code === "23505") {
        return {
          success: false,
          message: "El RFC ya está en uso por otra empresa.",
        };
      }

      return {
        success: false,
        message: `Error de base de datos: ${error.message}`,
      };
    }

    // 6. Revalidar paths
    revalidatePath("/dashboard/companies");
    revalidatePath("/dashboard/companies/edit");

    return { success: true, company: data };
  } catch (error: any) {
    console.error("Error general en updateCompany:", error);
    return { success: false, message: `Error inesperado: ${error.message}` };
  }
}

/**
 * Elimina una empresa (soft delete)
 * @param companyId - ID de la empresa a eliminar
 * @returns Resultado de la operación
 */
export async function deleteCompany(companyId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  const supabase = await createClient();

  try {
    // Verificar si la empresa tiene empresas hijas
    const { data: childCompanies } = await supabase
      .from("companies")
      .select("id")
      .eq("parent_company", companyId)
      .is("deleted_at", null);

    if (childCompanies && childCompanies.length > 0) {
      return {
        success: false,
        message:
          "No se puede eliminar la empresa porque tiene empresas hijas asociadas. Primero reasigne o elimine las empresas hijas.",
      };
    }

    // Obtener el usuario autenticado para logged de quién eliminó
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("companies")
      .update({
        deleted_at: new Date().toISOString(),
        // deleted_by: user?.id || null, // Si tienes este campo en tu tabla
      })
      .eq("id", companyId);

    if (error) {
      console.error("Error al eliminar empresa:", error);
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/companies");
    return { success: true };
  } catch (error: any) {
    console.error("Error inesperado:", error);
    return { success: false, message: "Ocurrió un error inesperado" };
  }
}

/**
 * Obtiene todas las empresas (sin paginación, solo las no eliminadas)
 */
export async function getAllCompanies(): Promise<Company[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc),
      child_companies:companies!parent_company (id, name, rfc, parent_company)
    `
    )
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener empresas:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene empresas que pueden ser padres (solo empresas raíz y que no tienen hijos)
 */
export async function getAvailableParentCompanies(
  excludeCompanyId?: string
): Promise<Company[]> {
  const supabase = await createClient();

  // Primero obtenemos todas las empresas raíz
  let query = supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc)
    `
    )
    .is("deleted_at", null)
    .is("parent_company", null) // Solo empresas que no tienen padre
    .order("name", { ascending: true });

  if (excludeCompanyId) {
    query = query.neq("id", excludeCompanyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener empresas padre disponibles:", error);
    return [];
  }

  // Ahora filtramos las que NO tienen hijos
  const companiesWithoutChildren = await Promise.all(
    (data || []).map(async (company) => {
      const hasChildren = await checkCompanyHasChildren(company.id);
      return {
        ...company,
        has_children: hasChildren,
      };
    })
  );

  // Solo retornamos las empresas que NO tienen hijos
  return companiesWithoutChildren.filter((company) => !company.has_children);
}

/**
 * Busca empresas por nombre, RFC, ciudad o estado (solo las no eliminadas)
 */
export async function searchCompanies(query: string): Promise<Company[]> {
  const supabase = await createClient();

  if (query.trim().length < 2) return [];

  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc),
      child_companies:companies!parent_company (id, name, rfc, parent_company)
    `
    )
    .is("deleted_at", null)
    .or(
      `name.ilike.%${query}%,rfc.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`
    )
    .order("name", { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error al buscar empresas:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene empresas con información completa de empresas hijas
 */
export async function getCompaniesWithChildren(
  page = 1,
  pageSize = 50,
  searchQuery = ""
): Promise<CompaniesResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc),
      child_companies:companies!parent_company (
        id, 
        name, 
        rfc, 
        parent_company,
        street,
        colony,
        city,
        state,
        zip_code,
        address_number,
        phone,
        cellphone,
        website,
        created_at,
        updated_at
      )
    `,
      { count: "exact" }
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,rfc.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,state.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Error al obtener empresas con hijos: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  return {
    companies: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene el árbol jerárquico de empresas
 */
export async function getCompaniesHierarchy(): Promise<Company[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      parent_company_data:parent_company (id, name, rfc),
      children:companies!parent_company (id, name, rfc, parent_company)
    `
    )
    .is("deleted_at", null)
    .is("parent_company", null) // Solo las raíces
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener jerarquía de empresas:", error);
    return [];
  }

  return data || [];
}
