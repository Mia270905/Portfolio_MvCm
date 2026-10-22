"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

// En tax.actions.ts, actualiza las interfaces:
export interface Tax {
  id: string;
  name: string;
  description: string | null;
  tax_type: "percentage" | "fixed_amount";
  general_type: "venta" | "compras" | "ninguno";
  sat_tax_type: "iva" | "isr" | "ieps" | "local";
  //sat_tax_code: string;
  rate: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaxFormData {
  name: string;
  description?: string;
  tax_type: "percentage" | "fixed_amount";
  general_type?: "venta" | "compras" | "ninguno";
  sat_tax_type?: "iva" | "isr" | "ieps" | "local";
  //sat_tax_code?: string;
  rate: number;
  is_active?: boolean;
}

/**
 * Crea un nuevo impuesto
 */
export async function createTax(taxData: TaxFormData): Promise<{
  success: boolean;
  message?: string;
  tax?: Tax;
  fields?: string[];
}> {
  try {
    const supabase = await createClient();

    // Validaciones básicas
    if (!taxData.name || taxData.name.trim() === "") {
      return {
        success: false,
        message: "El nombre del impuesto es requerido",
      };
    }

    if (!taxData.tax_type) {
      return {
        success: false,
        message: "El tipo de impuesto es requerido",
      };
    }

    // Validar según el tipo
    if (taxData.tax_type === "percentage") {
      if (taxData.rate < 0 || taxData.rate > 100) {
        return {
          success: false,
          message: "La tasa porcentual debe estar entre 0 y 100%",
        };
      }
    } else if (taxData.tax_type === "fixed_amount") {
      if (taxData.rate < 0) {
        return {
          success: false,
          message: "El monto fijo debe ser mayor o igual a 0",
        };
      }
    }

    // Verificar si ya existe un impuesto con el mismo nombre
    const { data: existingTax } = await supabase
      .from("taxes")
      .select("id")
      .eq("name", taxData.name.trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (existingTax) {
      return {
        success: false,
        message: `Ya existe un impuesto con el nombre "${taxData.name}"`,
        fields: ["name"],
      };
    }

    // Crear el impuesto
    const { data, error } = await supabase
      .from("taxes")
      .insert([
        {
          name: taxData.name.trim(),
          description: taxData.description?.trim() || null,
          tax_type: taxData.tax_type,
          rate: taxData.rate,
          is_active: taxData.is_active ?? true,
          general_type: taxData.general_type,
          sat_tax_type: taxData.sat_tax_type,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating tax:", error);

      if (error.code === "23505") {
        return {
          success: false,
          message: `Ya existe un impuesto con el nombre "${taxData.name}"`,
          fields: ["name"],
        };
      }

      // Mensajes más amigables para errores comunes
      if (error.message.includes("violates check constraint")) {
        return {
          success: false,
          message: "El valor del impuesto no es válido. Verifica los datos.",
        };
      }

      return {
        success: false,
        message: `Error al crear el impuesto: ${error.message}`,
      };
    }

    // Revalidar rutas
    revalidatePath("/dashboard/impuestos");
    revalidatePath("/dashboard");

    return {
      success: true,
      tax: data,
    };
  } catch (error: any) {
    console.error("Error creating tax:", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado. Inténtalo de nuevo.",
    };
  }
}

/**
 * Actualiza un impuesto existente
 */
export async function updateTax(
  taxId: string,
  taxData: Partial<TaxFormData>,
): Promise<{
  success: boolean;
  message?: string;
  tax?: Tax;
  fields?: string[];
}> {
  try {
    const supabase = await createClient();

    // Verificar que el impuesto existe
    const { data: existingTax, error: findError } = await supabase
      .from("taxes")
      .select("id, name, tax_type")
      .eq("id", taxId)
      .is("deleted_at", null)
      .single();

    if (findError || !existingTax) {
      return {
        success: false,
        message: "Impuesto no encontrado",
      };
    }

    // Validar según el tipo
    if (taxData.rate !== undefined) {
      const taxType = taxData.tax_type || existingTax.tax_type;

      if (taxType === "percentage") {
        if (taxData.rate < 0 || taxData.rate > 100) {
          return {
            success: false,
            message: "La tasa porcentual debe estar entre 0 y 100%",
          };
        }
      } else if (taxType === "fixed_amount") {
        if (taxData.rate < 0) {
          return {
            success: false,
            message: "El monto fijo debe ser mayor o igual a 0",
          };
        }
      }
    }

    // Verificar duplicado de nombre si se está actualizando
    if (taxData.name && taxData.name.trim() !== existingTax.name) {
      const { data: duplicateTax } = await supabase
        .from("taxes")
        .select("id")
        .eq("name", taxData.name.trim())
        .neq("id", taxId)
        .is("deleted_at", null)
        .maybeSingle();

      if (duplicateTax) {
        return {
          success: false,
          message: "Ya existe otro impuesto con ese nombre",
          fields: ["name"],
        };
      }
    }

    // Preparar datos para actualizar
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (taxData.name !== undefined) updateData.name = taxData.name.trim();
    if (taxData.description !== undefined)
      updateData.description = taxData.description?.trim() || null;
    if (taxData.tax_type !== undefined) updateData.tax_type = taxData.tax_type;
    if (taxData.general_type !== undefined)
      updateData.general_type = taxData.general_type;
    if (taxData.sat_tax_type !== undefined)
      updateData.sat_tax_type = taxData.sat_tax_type;
    if (taxData.rate !== undefined) updateData.rate = taxData.rate;
    if (taxData.is_active !== undefined)
      updateData.is_active = taxData.is_active;

    // Actualizar el impuesto
    const { data, error } = await supabase
      .from("taxes")
      .update(updateData)
      .eq("id", taxId)
      .select()
      .single();

    if (error) {
      console.error("Error updating tax:", error);

      if (error.code === "23505") {
        return {
          success: false,
          message: "Ya existe un impuesto con ese nombre",
          fields: ["name"],
        };
      }

      return {
        success: false,
        message: `Error al actualizar el impuesto: ${error.message}`,
      };
    }

    // Revalidar rutas
    revalidatePath("/dashboard/impuestos");
    revalidatePath(`/dashboard/impuestos/editar/${taxId}`);

    return {
      success: true,
      tax: data,
    };
  } catch (error: any) {
    console.error("Error updating tax:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}

/**
 * Elimina un impuesto (soft delete)
 */
export async function deleteTax(taxId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const supabase = await createClient();

    // Primero verificar si el impuesto está siendo usado en productos
    const { data: productsUsingTax, error: checkError } = await supabase
      .from("products")
      .select("id, name")
      .eq("tax_id", taxId) // Ajusta este campo según tu esquema
      .is("deleted_at", null)
      .limit(1);

    if (checkError) {
      console.error("Error checking tax usage:", checkError);
    }

    if (productsUsingTax && productsUsingTax.length > 0) {
      return {
        success: false,
        message:
          "No se puede eliminar el impuesto porque está siendo usado en productos",
      };
    }

    // Realizar soft delete
    const { error } = await supabase
      .from("taxes")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", taxId)
      .is("deleted_at", null);

    if (error) {
      console.error("Error deleting tax:", error);
      return {
        success: false,
        message: `Error al eliminar el impuesto: ${error.message}`,
      };
    }

    // Revalidar rutas
    revalidatePath("/dashboard/impuestos");
    revalidatePath("/dashboard");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error deleting tax:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}

/**
 * Alterna el estado activo/inactivo de un impuesto
 */
export async function toggleTaxStatus(
  taxId: string,
  isActive: boolean,
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("taxes")
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taxId)
      .is("deleted_at", null);

    if (error) {
      console.error("Error toggling tax status:", error);
      return {
        success: false,
        message: `Error al cambiar el estado: ${error.message}`,
      };
    }

    // Revalidar rutas
    revalidatePath("/dashboard/impuestos");

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error toggling tax status:", error);
    return {
      success: false,
      message: `Error inesperado: ${error.message}`,
    };
  }
}

/**
 * Obtiene impuestos para usar en un select
 */
export async function getTaxesForSelect(): Promise<
  { value: string; label: string; rate: number }[]
> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("taxes")
      .select("id, name, rate")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching taxes for select:", error);
      return [];
    }

    return (data || []).map((tax) => ({
      value: tax.id,
      label: `${tax.name} (${tax.rate}%)`,
      rate: tax.rate,
    }));
  } catch (error) {
    console.error("Error fetching taxes for select:", error);
    return [];
  }
}

/**
 * Obtiene todos los impuestos activos (sin paginación)
 */
export async function getAllTaxes(): Promise<Tax[]> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("taxes")
      .select("*")
      //.eq("is_active", true)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching all taxes:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching all taxes:", error);
    return [];
  }
}

/**
 * Obtiene un impuesto por su ID
 */
export async function getTaxById(taxId: string): Promise<Tax | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("taxes")
      .select("*")
      .eq("id", taxId)
      .is("deleted_at", null)
      .single();

    if (error) {
      console.error("Error fetching tax by id:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching tax by id:", error);
    return null;
  }
}
