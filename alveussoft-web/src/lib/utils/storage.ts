import { createClient } from "@/lib/supabase/client";

/**
 * Sube una imagen al bucket de Supabase Storage
 * @param file - Archivo de imagen a subir
 * @param bucket - Nombre del bucket (por defecto 'company-logos')
 * @param folder - Carpeta dentro del bucket (opcional)
 * @returns URL pública de la imagen o null si hay error
 */
export async function uploadImage(
  file: File,
  bucket: string = "company-logos",
  folder?: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  try {
    const supabase = createClient();

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

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    
    // Construir la ruta completa
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Subir el archivo
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
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
 * Elimina una imagen del bucket de Supabase Storage
 * @param path - Ruta del archivo en el bucket
 * @param bucket - Nombre del bucket (por defecto 'company-logos')
 * @returns true si se eliminó correctamente, false si hubo error
 */
export async function deleteImage(
  path: string,
  bucket: string = "company-logos"
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = createClient();

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
 * Reemplaza una imagen existente por una nueva
 * @param oldPath - Ruta de la imagen antigua
 * @param newFile - Nuevo archivo de imagen
 * @param bucket - Nombre del bucket
 * @param folder - Carpeta dentro del bucket
 * @returns URL y ruta de la nueva imagen
 */
export async function replaceImage(
  oldPath: string | null,
  newFile: File,
  bucket: string = "company-logos",
  folder?: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  // Subir la nueva imagen
  const uploadResult = await uploadImage(newFile, bucket, folder);

  if (uploadResult.error || !uploadResult.url) {
    return uploadResult;
  }

  // Eliminar la imagen antigua si existe
  if (oldPath) {
    await deleteImage(oldPath, bucket);
  }

  return uploadResult;
}
