"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { removeAccentsAndSpecialChars } from "@/lib/text-utils";
import { ProductPriceList } from "@/components/dashboard/productos/price-list-selector";

export interface Product {
  id: string;
  code: string;
  bar_code: string;
  name: string;
  description: string;
  image_url: string;
  id_price_list?: string | null;
  category_id: string;
  category_name?: string;
  cost_price: number;
  is_available: boolean;
  created_by?: string;
  created_at: string;
  updated_by?: string;
  updated_at: string;
  name_unaccent?: string;
  quantity?: number;
  measure_unit?: string | null;
  type: 'article' | 'service'; 
  measurement?: {
    id: string;
    unit: string;
    quantity: string;
  } | null;
  // product_code_sat?: string | null;
  // product_tax_object_sat?: string | null;
  price_lists?: Array<{
    price_list_id: string;
    price: number;
    price_list?: { code: string }[];
  }>;
  product_taxes?: Array<{
    tax_id: string;
    tax?: {
      id: string;
      name: string;
      rate: number;
      tax_type: string;
    };
  }>;
}

export interface ProductSearch {
  id: string
  name: string
  description: string | null
  image_url: string | null
  category_id: string | null
  is_available: boolean
  measure_unit?: string | null
  measurement?: {
    id: string;
    unit: string;
    quantity: string;
  } | null
  product_categories: {
    title: string
    active: boolean
  } | null
  products_price_lists: {
    price: number
  }[]
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PriceList {
  id: string;
  name: string;
}
export interface ProductTax {
  id: string;
  tax_id: string;
  tax?: {
    id: string;
    name: string;
    rate: number;
    tax_type: string;
  };
}
/**
 * Obtiene productos con paginación (sin filtros, para filtrado en cliente)
 * @param page - Número de página (inicia en 1)
 * @param pageSize - Cantidad de items por página
 * @param searchQuery - Término de búsqueda (opcional - mantener por compatibilidad)
 * @returns Objeto con productos, total, página actual y total de páginas
 */
export async function getProducts(
  page = 1,
  pageSize = 1000,
  searchQuery = "",
  filters?: any
): Promise<ProductsResponse> {
  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("products")
    .select(
      `
      *,
      product_categories!category_id (title),
      measurement:measure_unit (id, unit, quantity),
      products_price_lists (
        price_list_id,
        price,
        price_list:price_lists (
          id,
          code,
          name
        )
      )
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .is("deleted_at", null);

  if (filters?.type) {
    query = query.eq("type", filters.type);
  }

  if (searchQuery) {
    query = query.or(
      `name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,bar_code.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    throw new Error(`Error al obtener productos: ${error.message}`);
  }

  const totalPages = count ? Math.ceil(count / pageSize) : 0;

  const products: Product[] =
    data?.map((prod: any) => ({
      id: prod.id,
      code: prod.code,
      bar_code: prod.bar_code,
      name: prod.name,
      description: prod.description,
      image_url: prod.image_url,
      type: prod.type, 
      category_id: prod.category_id,
      category_name: prod.product_categories?.title,
      cost_price: prod.cost_price,
      is_available: prod.is_available,
      created_at: prod.created_at,
      updated_at: prod.updated_at,
      name_unaccent: prod.name_unaccent,
      created_by: prod.created_by,
      updated_by: prod.updated_by,
      quantity: prod.quantity || 0,
      measure_unit: prod.measure_unit,
      measurement: prod.measurement,
      price_list_id: prod.price_list_id ?? null,
      price_lists: prod.products_price_lists?.map((pl: any) => ({
        price_list_id: pl.price_list_id,
        price: pl.price,
        price_list: pl.price_list
          ? [
              {
                code: pl.price_list.code,
              },
            ]
          : [],
      })),
    })) || [];

  return {
    products,
    total: count || 0,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Obtiene un producto por su ID
 * @param productId - ID del producto
 * @returns Producto encontrado o null
 */
export async function getProductById(
  productId: string
): Promise<Product | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_categories!inner (
        title
      ),
      measurement:measure_unit (id, unit, quantity),
      products_price_lists (
        price_list_id,
        price
      ),
      product_taxes!left (
        tax_id,
        deleted_at,
        taxes!inner (
          id,
          name,
          rate,
          tax_type
        )
      )
    `
    )
    .eq("id", productId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error al obtener producto:", error);
    return null;
  }

  const activeTaxes = (data.product_taxes || []).filter(
    (pt: any) => pt.deleted_at === null,
  );
  
  // Verifica la estructura de data.measurement
  console.log("Datos del producto (measurement):", data.measurement);

  return {
    id: data.id,
    code: data.code,
    bar_code: data.bar_code,
    name: data.name,
    description: data.description,
    image_url: data.image_url,
    type: data.type,
    category_id: data.category_id,
    category_name: data.product_categories?.title,
    cost_price: data.cost_price,
    is_available: data.is_available,
    measure_unit: data.measure_unit,
    measurement: data.measurement,
    created_at: data.created_at,
    updated_at: data.updated_at,
    name_unaccent: data.name_unaccent,
    created_by: data.created_by,
    updated_by: data.updated_by,
    // product_code_sat: data.product_code_sat,
    // product_tax_object_sat: data.product_tax_object_sat,
    price_lists: data.products_price_lists || [],
    product_taxes: activeTaxes.map((pt: any) => ({
      tax_id: pt.tax_id,
      tax: pt.taxes,
    })),
  };
}

/**
 * Obtiene productos por ID de categoría con paginación
 * @param categoryId - ID de la categoría
 * @param limit - Cantidad de productos a obtener
 * @param offset - Desplazamiento para paginación
 * @returns Objeto con productos y total
 */
export async function getProductsByCategoryId(
  categoryId: string,
  limit = 3,
  offset = 0
): Promise<{ products: Product[]; total: number }> {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      description, 
      cost_price, 
      image_url, 
      code, 
      bar_code, 
      category_id, 
      type,
      is_available, 
      created_at, 
      updated_at,
      measure_unit,
      measurement:measure_unit (id, unit, quantity),
      price_lists:products_price_lists!inner(
        price_list_id,
        price,
        price_list:price_lists!inner(
          code
        )
      ),
      product_taxes(
        taxes(
          id,
          tax_type,
          rate,
          sat_tax_type,
          is_active,
          general_type
        )
      )
    `,
      { count: "exact" }
    )
    .eq("category_id", categoryId)
    .eq("is_available", true)
    .eq("price_lists.price_list.code", "default")
    .is("deleted_at", null)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error(
      `Error al obtener productos por categoría: ${error.message}`
    );
  }

  const products: Product[] = (data || []).map((item: any) => ({
    id: item.id,
    code: item.code,
    bar_code: item.bar_code,
    name: item.name,
    description: item.description,
    image_url: item.image_url,
    type: item.type, 
    category_id: item.category_id,
    cost_price: item.cost_price,
    is_available: item.is_available,
    created_at: item.created_at,
    updated_at: item.updated_at,
    name_unaccent: item.name_unaccent,
    measure_unit: item.measure_unit,
    measurement: item.measurement,
    price_lists: item.price_lists?.map((pl: any) => ({
      price_list_id: pl.price_list_id,
      price: pl.price,
      price_list: pl.price_list ? [{ code: pl.price_list.code }] : []
    })) || [],
    taxes:
      item.product_taxes
        ?.map((pt: any) => pt.taxes)
        ?.filter(
          (tax: any) =>
            tax && tax.is_active == true && tax.general_type === "venta",
        )
        ?.map((tax: any) => ({
          tax_type: tax.tax_type,
          rate: tax.rate,
          sat_tax_type: tax.sat_tax_type,
          is_active: tax.is_active,
    })) || []
  }));

  return {
    products,
    total: count || 0,
  };
}

/**
 * Obtiene un producto por su nombre sin acentos
 * @param name - Nombre del producto (sin acentos)
 * @returns Producto encontrado o null
 */
export async function getProductByUnaccentName(
  name: string
): Promise<Product | null> {
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select(
      `
      *,
      price_lists:products_price_lists(
        price_list_id,
        price,
        price_list:price_lists(
          code
        )
      ),
      product_taxes(
        taxes(
          id,
          tax_type,
          rate,
          sat_tax_type,
          is_active,
          general_type
        )
      )
    `
    )
    .ilike("name_unaccent", name)
    .single();

  if (!product) {
    return null;
  }

  /* ===============================
     🔹 Procesar impuestos
  =============================== */
  const taxes =
    product.product_taxes
      ?.map((pt: any) => pt.taxes)
      ?.filter(
        (tax: any) =>
          tax && tax.is_active === true && tax.general_type === "venta",
      ) || [];

  return {
    ...product,
    taxes,
  };
}

/**
 * Crea un nuevo producto
 * @param productData - Datos del producto a crear
 * @returns Resultado de la operación
 */
export async function createProduct(productData: {
  code: string;
  bar_code: string;
  name: string;
  name_unaccent?: string;
  description: string;
  image_url: string;
  id_price_list?: string | null;
  category_id: string;
  cost_price: number;
  is_available: boolean;
  type: 'article' | 'service';
  // product_code_sat?: string | null;
  // product_tax_object_sat?: string | null;
  measure_unit?: string | null;
}): Promise<{
  success: boolean;
  message?: string;
  product?: Product;
  fields?: string[];
}> {
  const supabase = await createClient();

  // Normalizar bar_code (convertir string vacío a null)
  const normalizedBarCode = 
    productData.bar_code.trim() === "" ? null : productData.bar_code;

  const { data, error } = await supabase
    .from("products")
    .insert({
      code: productData.code,
      bar_code: normalizedBarCode, // Usar valor normalizado
      name: productData.name,
      description: productData.description,
      image_url: productData.image_url,
      id_price_list: productData.id_price_list || null,
      category_id: productData.category_id,
      cost_price: productData.cost_price,
      is_available: productData.is_available,
      type: productData.type,
      name_unaccent: productData.name_unaccent,
      measure_unit: productData.measure_unit || null,
      // product_code_sat: productData.product_code_sat || null,
      // product_tax_object_sat: productData.product_tax_object_sat || null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Manejar errores de constraint único con los nuevos índices
    if (error.code === "23505") {
      let duplicatedFields: string[] = [];
      let message = "No se pudo crear el producto debido a duplicados: ";

      if (error.message.includes("products_code_active_unique")) {
        duplicatedFields.push("code");
        message +=
          "El código ya está en uso por otro producto (activo o inactivo).";
      } else if (error.message.includes("products_bar_code_active_unique")) {
        // Solo marcar error si bar_code no es null
        if (normalizedBarCode !== null) {
          duplicatedFields.push("bar_code");
          message +=
            "El código de barras ya está en uso por otro producto (activo o inactivo).";
        }
      } else {
        message +=
          "Uno o más campos únicos ya están en uso por otros productos.";
        duplicatedFields.push("code", "bar_code");
      }

      return {
        success: false,
        fields: duplicatedFields,
        message,
      };
    }

    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/productos");

  return {
    success: true,
    product: data,
  };
}

/**
 * Actualiza un producto existente
 * @param productId - ID del producto a actualizar
 * @param productData - Datos del producto a actualizar
 * @returns Resultado de la operación
 */
export async function updateProduct(
  productId: string,
  productData: {
    code?: string;
    bar_code?: string;
    name?: string;
    name_unaccent?: string;
    description?: string;
    image_url?: string | null;
    id_price_list?: string | null;
    category_id?: string;
    cost_price?: number;
    type?: 'article' | 'service';
    // product_code_sat?: string | null;
    // product_tax_object_sat?: string | null;
    is_available?: boolean;
    measure_unit?: string | null;
  }
): Promise<{
  success: boolean;
  message?: string;
  product?: Product;
  fields?: string[];
}> {
  try {
    const supabase = await createClient();

    // 1. Primero verificar que el producto existe y no está eliminado
    const { data: existingProduct, error: findError } = await supabase
      .from("products")
      .select("id, code, bar_code, name, name_unaccent, is_available, type")
      .eq("id", productId)
      .is("deleted_at", null)
      .single();

    if (findError) {
      console.error("❌ Error al buscar producto:", findError);
      return {
        success: false,
        message: `Producto no encontrado: ${findError.message}`,
      };
    }

    if (!existingProduct) {
      console.error("❌ Producto no existe o fue eliminado");
      return {
        success: false,
        message: "El producto no existe o ha sido eliminado",
      };
    }

    // 2. Normalizar bar_code (convertir string vacío a null)
    const normalizedBarCode =
      productData.bar_code !== undefined
        ? productData.bar_code === null || productData.bar_code.trim() === ""
          ? null
          : productData.bar_code
        : undefined;

    // 3. VALIDACIÓN DE DUPLICADOS - Verificar en productos NO ELIMINADOS
    const fieldsToCheck: string[] = [];
    const conditions: string[] = [];

    if (
      productData.code !== undefined &&
      productData.code !== existingProduct.code
    ) {
      fieldsToCheck.push("code");
      conditions.push(`code.eq.${productData.code}`);
    }

    // Solo validar bar_code si no es null
    if (
      normalizedBarCode !== undefined &&
      normalizedBarCode !== existingProduct.bar_code &&
      normalizedBarCode !== null
    ) {
      fieldsToCheck.push("bar_code");
      conditions.push(`bar_code.eq.${normalizedBarCode}`);
    }

    const nameChanged =
      productData.name !== undefined &&
      productData.name !== existingProduct.name;
    const nameUnaccentChanged =
      productData.name_unaccent !== undefined &&
      productData.name_unaccent !== existingProduct.name_unaccent;

    if (nameChanged || nameUnaccentChanged) {
      const finalNameUnaccent =
        productData.name_unaccent ||
        (productData.name
          ? removeAccentsAndSpecialChars(productData.name)
          : null);

      if (
        finalNameUnaccent &&
        finalNameUnaccent !== existingProduct.name_unaccent
      ) {
        fieldsToCheck.push("name_unaccent");
        conditions.push(`name_unaccent.ilike.${finalNameUnaccent}`);
      }
    }

    // Si hay campos únicos para validar, buscar duplicados
    if (conditions.length > 0) {
      const { data: duplicates, error: duplicateError } = await supabase
        .from("products")
        .select("id, code, bar_code, name_unaccent, is_available")
        .or(conditions.join(","))
        .neq("id", productId)
        .is("deleted_at", null);

      if (duplicateError) {
        console.error("❌ Error al buscar duplicados:", duplicateError);
        return {
          success: false,
          message: `Error al validar duplicados: ${duplicateError.message}`,
        };
      }

      const duplicatedFields: string[] = [];

      if (duplicates && duplicates.length > 0) {
        // Verificar cada campo que estamos actualizando
        if (fieldsToCheck.includes("code")) {
          const codeDuplicate = duplicates.find(
            (dup) => dup.code === productData.code
          );
          if (codeDuplicate) {
            duplicatedFields.push("code");
            console.error(
              `❌ Código duplicado encontrado en producto: ${codeDuplicate.id}`
            );
          }
        }

        if (fieldsToCheck.includes("bar_code")) {
          const barCodeDuplicate = duplicates.find(
            (dup) => dup.bar_code === normalizedBarCode
          );
          if (barCodeDuplicate) {
            duplicatedFields.push("bar_code");
            console.error(
              `❌ Código de barras duplicado encontrado en producto`
            );
          }
        }

        if (fieldsToCheck.includes("name_unaccent")) {
          const finalNameUnaccent =
            productData.name_unaccent ||
            (productData.name
              ? removeAccentsAndSpecialChars(productData.name)
              : null);

          const nameDuplicate = duplicates.find(
            (dup) =>
              dup.name_unaccent?.toLowerCase() ===
              finalNameUnaccent?.toLowerCase()
          );
          if (nameDuplicate) {
            duplicatedFields.push("name_unaccent");
            console.log(`❌ Nombre duplicado encontrado en producto`);
          }
        }
      }

      // Si hay campos duplicados, retornar error
      if (duplicatedFields.length > 0) {
        console.error("❌ Campos duplicados encontrados:", duplicatedFields);

        let message =
          "No se puede actualizar el producto debido a duplicados: ";
        if (duplicatedFields.length === 1) {
          if (duplicatedFields[0] === "code") {
            message += "El código ya está en uso por otro producto.";
          } else if (duplicatedFields[0] === "bar_code") {
            message += "El código de barras ya está en uso por otro producto.";
          } else if (duplicatedFields[0] === "name_unaccent") {
            message +=
              "El nombre de búsqueda ya está en uso por otro producto.";
          }
        } else if (duplicatedFields.length === 2) {
          message += `Los campos ${duplicatedFields[0]} y ${duplicatedFields[1]} ya están en uso por otros productos.`;
        } else {
          message +=
            "Varios campos únicos ya están en uso por otros productos.";
        }

        return {
          success: false,
          fields: duplicatedFields,
          message,
        };
      }
    }

    // 4. Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Agregar solo los campos que tienen valor
    if (productData.code !== undefined) updateData.code = productData.code;
    if (productData.bar_code !== undefined) {
      updateData.bar_code = normalizedBarCode; // Usar el valor normalizado
    }
    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.description !== undefined)
      updateData.description = productData.description;
    if (productData.image_url !== undefined)
      updateData.image_url = productData.image_url;
    if (productData.id_price_list !== undefined)
      updateData.id_price_list = productData.id_price_list;
    if (productData.category_id !== undefined)
      updateData.category_id = productData.category_id;
    if (productData.cost_price !== undefined)
      updateData.cost_price = productData.cost_price;
    if (productData.type !== undefined)
      updateData.type = productData.type;
    if (productData.is_available !== undefined)
      updateData.is_available = productData.is_available;
    if (productData.measure_unit !== undefined)
      updateData.measure_unit = productData.measure_unit;
    // if (productData.product_code_sat !== undefined)
    //   updateData.product_code_sat = productData.product_code_sat;
    // if (productData.product_tax_object_sat !== undefined)
    //   updateData.product_tax_object_sat = productData.product_tax_object_sat;

    // Generar name_unaccent si es necesario
    if (productData.name && !productData.name_unaccent) {
      updateData.name_unaccent = removeAccentsAndSpecialChars(productData.name);
    } else if (productData.name_unaccent !== undefined) {
      updateData.name_unaccent = productData.name_unaccent;
    }

    // 5. Ejecutar el UPDATE
    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error en UPDATE de Supabase:", error);

      // Manejar errores de constraint único (backup)
      if (error.code === "23505") {
        let duplicatedFields: string[] = [];
        let message = "No se pudo actualizar el producto debido a duplicados: ";

        if (error.message.includes("products_code_active_unique")) {
          duplicatedFields.push("code");
          message +=
            "El código ya está en uso por otro producto (activo o inactivo).";
        } else if (error.message.includes("products_bar_code_active_unique")) {
          // Solo marcar error si bar_code no es null
          if (updateData.bar_code !== null) {
            duplicatedFields.push("bar_code");
            message +=
              "El código de barras ya está en uso por otro producto (activo o inactivo).";
          }
        } else {
          message +=
            "Uno o más campos únicos ya están en uso por otros productos.";
        }

        return {
          success: false,
          fields: duplicatedFields,
          message,
        };
      }

      return {
        success: false,
        message: `Error de base de datos: ${error.message}`,
      };
    }

    // 6. Revalidar paths
    revalidatePath("/dashboard/productos");
    revalidatePath("/dashboard/productos/producto");

    return {
      success: true,
      product: data as Product,
    };
  } catch (error: any) {
    console.error("💥 Error general en updateProduct:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}

/**
 * Elimina un producto (soft delete)
 * @param productId - ID del producto a eliminar
 * @returns Objeto con success: true si se eliminó correctamente
 */
interface DeleteProductPayload {
  productId: string;
  userId: string; // ID del usuario que elimina
}

export async function deleteProduct({
  productId,
  userId,
}: DeleteProductPayload): Promise<{ success: boolean }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      deleted_at: new Date().toISOString(),
      is_available: false,
      deleted_by: userId,
    })
    .eq("id", productId);

  if (error) {
    throw new Error(`Error al eliminar producto: ${error.message}`);
  }

  // Revalidar la ruta para refrescar la lista de productos
  revalidatePath("/dashboard/productos");

  return { success: true };
}

/**
 * Obtiene todas las categorías activas
 * @returns Array de categorías
 */
export async function getActiveCategories(): Promise<
  { id: string; title: string }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_categories")
    .select("id, title")
    .eq("active", true)
    .is("deleted_at", null)
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Error al obtener categorías: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene todas las listas de precios activas
 * @returns Array de listas de precios
 */
export async function getPriceLists(): Promise<PriceList[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("price_lists")
    .select("id, code, name")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener listas de precios:", error);
    return [];
  }

  return data || [];
}
interface CreateManyProductPriceListParams {
  product_id: string;
  price_lists: ProductPriceList[];
}

interface CreateManyResult {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Crea los registros relacionales entre un producto y varias listas de precios
 * @param params - Parámetros de la función
 * @returns Promise con success y data o error
 */
export async function createManyProductPriceList({
  product_id,
  price_lists,
}: CreateManyProductPriceListParams): Promise<CreateManyResult> {
  const supabase = await createClient();

  // Validación de parámetros
  if (!product_id || !price_lists || !Array.isArray(price_lists)) {
    return {
      success: false,
      message: "Parámetros inválidos: product_id y price_lists son requeridos",
    };
  }

  try {
    const { data, error } = await supabase
      .from("products_price_lists")
      .insert(
        price_lists.map((list) => ({
          product_id: product_id,
          price_list_id: list.id,
          price: list.price,
        }))
      )
      .select();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error creando relaciones producto-lista de precios:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function updateProductPriceList({ productId, price_lists }: any) {
  const supabase = await createClient();

  if (price_lists && price_lists.length > 0) {
    try {
      // 1. Obtener las listas actuales del producto
      const { data: currentPriceLists } = await supabase
        .from("products_price_lists")
        .select("price_list_id, price")
        .eq("product_id", productId);

      const currentLists = currentPriceLists || [];

      // 2. Identificar cambios
      const listsToAdd = price_lists.filter(
        (newList: any) =>
          !currentLists.find((current) => current.price_list_id === newList.id)
      );

      const listsToUpdate = price_lists.filter((newList: any) => {
        const current = currentLists.find(
          (current) => current.price_list_id === newList.id
        );
        return current && Number(current.price) !== Number(newList.price);
      });

      const listsToRemove = currentLists.filter(
        (current) =>
          !price_lists.find(
            (newList: any) => newList.id === current.price_list_id
          )
      );

      // 3. Ejecutar operaciones
      if (listsToAdd.length > 0) {
        await supabase.from("products_price_lists").insert(
          listsToAdd.map((list: any) => ({
            product_id: productId,
            price_list_id: list.id,
            price: list.price,
          }))
        );
      }

      if (listsToUpdate.length > 0) {
        for (const list of listsToUpdate) {
          await supabase
            .from("products_price_lists")
            .update({ price: list.price })
            .eq("product_id", productId)
            .eq("price_list_id", list.id);
        }
      }

      if (listsToRemove.length > 0) {
        await supabase
          .from("products_price_lists")
          .delete()
          .eq("product_id", productId)
          .in(
            "price_list_id",
            listsToRemove.map((list) => list.price_list_id)
          );
      }

      return { success: true };
    } catch (err) {
      return { success: false };
    }
  }
}

/**
 * Actualiza solo la imagen de un producto
 * @param productId - ID del producto
 * @param imageUrl - Nueva URL de la imagen
 * @returns Resultado de la operación
 */
export async function updateProductImage(
  productId: string,
  imageUrl: string
): Promise<{ success: boolean; message?: string; image_url?: string }> {
  try {
    const supabase = await createClient();

    // Verificar que el producto existe y no está eliminado
    const { data: existingProduct, error: findError } = await supabase
      .from("products")
      .select("id, image_url")
      .eq("id", productId)
      .is("deleted_at", null)
      .single();

    if (findError || !existingProduct) {
      return {
        success: false,
        message: "Producto no encontrado o ha sido eliminado",
      };
    }

    // Actualizar la imagen
    const { data, error } = await supabase
      .from("products")
      .update({
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        message: `Error al actualizar la imagen: ${error.message}`,
      };
    }

    // Revalidar rutas
    revalidatePath("/dashboard/productos");
    revalidatePath("/dashboard/productos/producto");

    return {
      success: true,
      image_url: data.image_url,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}
//------------------------------------------------------------------
export interface InventoryEntryPayload {
  product_id: string;
  input: number;
  date?: string;
  created_by?: string;
}
export interface InventoryEntry {
  id: string;
  product_id: string;
  input: number;
  output: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

/**
 * Registra una nueva entrada en inventarios
 * @param entry - Datos de la entrada
 * @returns Objeto con success: true y el registro creado
 */

export async function createInventoryEntry(
  entry: InventoryEntryPayload
): Promise<{ success: boolean; entry?: InventoryEntry; message?: string }> {
  try {
    const supabase = await createClient();
    const timestamp = entry.date
      ? new Date(entry.date).toISOString()
      : new Date().toISOString();

    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventories_movements")
      .insert([
        {
          product_id: entry.product_id,
          input: entry.input,
          output: 0,
          created_at: timestamp,
          created_by: entry.created_by,
          deleted_at: null,
          deleted_by: null,
        },
      ])
      .select()
      .single();

    if (inventoryError) {
      return { success: false, message: inventoryError.message };
    }

    const { data: product, error: productFetchError } = await supabase
      .from("products")
      .select("quantity")
      .eq("id", entry.product_id)
      .single();

    if (productFetchError || !product) {
      return { success: false, message: "Producto no encontrado" };
    }

    const newQuantity = (product.quantity || 0) + entry.input;

    const { error: productError } = await supabase
      .from("products")
      .update({ quantity: newQuantity })
      .eq("id", entry.product_id);

    if (productError) {
      return { success: false, message: productError.message };
    }

    return {
      success: true,
      entry: inventoryData as InventoryEntry,
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Error desconocido" };
  }
}

/**
 * Busca productos en Supabase que estén disponibles y pertenezcan a categorías activas.
 * Aplica coincidencia parcial (ILIKE) sobre el nombre del producto.
 */
export async function searchProductsByName(query: string): Promise<ProductSearch[]> {
  const supabase = await createClient()

  if (query.trim().length < 2) return []

  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        image_url,
        category_id,
        is_available,
        measure_unit,
        measurement:measure_unit (id, unit, quantity),
        product_categories!inner (
          title,
          active
        ),
        products_price_lists!left (
          price
        )
      `)
      .eq("product_categories.active", true)
      .eq("is_available", true)
      .ilike("name", `%${query}%`)
      .limit(8)

    if (error) {
      console.error("[Supabase] Error searching products:", error)
      return []
    }

    return (data ?? []) as unknown as ProductSearch[]
  } catch (error) {
    console.error("[searchProductsByName] Error:", error);
    return [];
  }
}
/**
 * Obtiene todos los impuestos activos para selección
 * @returns Array de impuestos
 */
export async function getActiveTaxes(): Promise<
  {
    id: string;
    name: string;
    rate: number;
    tax_type: string;
    description: string | null;
  }[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("taxes")
    .select("id, name, rate, tax_type, description")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error al obtener impuestos:", error);
    return [];
  }

  return data || [];
}

/**
 * Actualiza los impuestos asociados a un producto
 */
export async function updateProductTaxes({
  productId,
  tax_ids,
}: {
  productId: string;
  tax_ids: string[];
}): Promise<{ success: boolean; message?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    // 1. Primero, marcar todos los impuestos actuales como eliminados
    const { error: deleteError } = await supabase
      .from("product_taxes")
      .delete()
      .eq("product_id", productId);

    if (deleteError) throw deleteError;

    // 2. Si no hay impuestos que asignar, terminamos aquí
    if (tax_ids.length === 0) {
      return { success: true };
    }

    // 3. Crear los nuevos registros (incluyendo los que ya existían)
    const records = tax_ids.map((tax_id) => ({
      product_id: productId,
      tax_id: tax_id,
      created_by: user?.id,
      created_at: new Date().toISOString(),
      deleted_at: null,
      deleted_by: null,
    }));

    const { error: insertError } = await supabase
      .from("product_taxes")
      .insert(records);

    if (insertError) throw insertError;

    return { success: true };
  } catch (error: any) {
    console.error("Error updating product taxes:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Obtiene el precio de un producto en una lista de precios específica
 * @param productId - ID del producto
 * @param priceListId - ID de la lista de precios
 * @returns Precio en esa lista, o null si no tiene precio asignado
 */
export async function getProductPriceInPriceList(
  productId: string,
  priceListId: string
): Promise<number | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products_price_lists")
      .select("price")
      .eq("product_id", productId)
      .eq("price_list_id", priceListId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      console.error("[getProductPriceInPriceList] Error Supabase:", error);
      return null;
    }

    return data?.price || null;
  } catch (error) {
    console.error("[getProductPriceInPriceList] Error inesperado:", error);
    return null;
  }
}

/**
 * Obtiene todos los precios de un producto en diferentes listas de precios
 */
export async function getProductPriceLists(
  productId: string
): Promise<Array<{ price_list_id: string; price: number }>> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products_price_lists")
      .select("price_list_id, price")
      .eq("product_id", productId)
      .eq("deleted_at", null);

    if (error) {
      console.error("Error obteniendo listas de precios del producto:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error inesperado:", error);
    return [];
  }
}

/**
 * Obtiene el precio por defecto de un producto (de la tabla products)
 */
export async function getProductDefaultPrice(
  productId: string
): Promise<number | null> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select("cost_price")
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      console.error("Error obteniendo precio por defecto:", error);
      return null;
    }

    return data?.cost_price || null;
  } catch (error) {
    console.error("Error inesperado:", error);
    return null;
  }
}