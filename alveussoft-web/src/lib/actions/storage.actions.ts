"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Crea un cliente de Supabase con Service Role Key para operaciones de Storage
 * Esto permite bypass de RLS para subir archivos
 */
function createStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Faltan variables de entorno de Supabase");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Server Action: Sube una imagen al bucket de Supabase Storage
 * Usa el cliente de servidor con Service Role para evitar problemas de RLS
 * @param file - Archivo de imagen
 * @param companyId - ID de la empresa (opcional, usa este ID como nombre de archivo)
 * @param bucket - Nombre del bucket
 */
export async function uploadImageAction(
  file: File,
  companyId?: string,
  bucket: string = "company-logos"
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  try {
    const supabase = createStorageClient();

    // Validar que sea una imagen
    if (!file.type.startsWith("image/")) {
      return {
        url: null,
        path: null,
        error: "El archivo debe ser una imagen",
      };
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        url: null,
        path: null,
        error: "La imagen no debe superar los 5MB",
      };
    }

    // Generar nombre del archivo
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    let fileName: string;
    
    if (companyId) {
      // Si hay companyId, usar solo el ID SIN extensión (se reemplaza automáticamente)
      fileName = companyId;
    } else {
      // Si no hay ID, usar timestamp + random con extensión (para casos temporales)
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      fileName = `${timestamp}-${randomString}.${fileExt}`;
    }
    
    // La ruta completa es solo el nombre del archivo (sin subfolder)
    const filePath = fileName;

    // Convertir File a ArrayBuffer para el servidor
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir el archivo (upsert:true permite sobrescribir si existe)
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "public, max-age=0, must-revalidate", // Forzar revalidación
        upsert: true, // Permite sobrescribir archivo existente
      });

    if (uploadError) {
      console.error("Error al subir imagen:", uploadError);
      return {
        url: null,
        path: null,
        error: uploadError.message || "Error al subir la imagen",
      };
    }

    // Construir URL pública manualmente usando la variable dedicada de Storage
    const storageBase = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    // Limpiar slashes al inicio y final
    const cleanBase = storageBase.replace(/^\/+|\/+$/g, "");
    const normalizedBase = cleanBase
      ? cleanBase.startsWith("http")
        ? cleanBase
        : `https://${cleanBase}`
      : "";
    const publicUrl = `${normalizedBase}/storage/v1/object/public/${bucket}/${filePath}`;

    return {
      url: publicUrl,
      path: filePath,
      error: null,
    };
  } catch (error: any) {
    console.error("Error inesperado al subir imagen:", error);
    return {
      url: null,
      path: null,
      error: error.message || "Error inesperado al subir la imagen",
    };
  }
}

/**
 * Server Action: Elimina una imagen del bucket de Supabase Storage
 */
export async function deleteImageAction(
  path: string,
  bucket: string = "company-logos"
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createStorageClient();

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Error al eliminar imagen:", error);
      return {
        success: false,
        error: error.message || "Error al eliminar la imagen",
      };
    }

    return {
      success: true,
      error: null,
    };
  } catch (error: any) {
    console.error("Error inesperado al eliminar imagen:", error);
    return {
      success: false,
      error: error.message || "Error inesperado al eliminar la imagen",
    };
  }
}

/**
 * Server Action: Reemplaza una imagen existente por una nueva
 */
export async function replaceImageAction(
  oldPath: string | null,
  newFile: File,
  bucket: string = "company-logos",
  folder?: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  // Subir la nueva imagen
  const uploadResult = await uploadImageAction(newFile, bucket, folder);

  if (uploadResult.error || !uploadResult.url) {
    return uploadResult;
  }

  // Eliminar la imagen antigua si existe
  if (oldPath) {
    await deleteImageAction(oldPath, bucket);
  }

  return uploadResult;
}
