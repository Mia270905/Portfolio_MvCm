"use server";
import { createClient } from "@/lib/supabase/server";

export async function uploadFile(bucket: string, entityId: string, file: File) {
  const supabase = await createClient();

  // Obtener extensión del nuevo archivo
  const newExtension = file.name.split(".").pop();
  const newPath = `${entityId}.${newExtension}`;

  try {
    // 1️Listar archivos existentes con el ID 
    const { data: existingFiles, error: listError } = await supabase.storage
      .from(bucket)
      .list("", {
        search: entityId,
      });

    if (listError) {
      console.warn("No se pudieron listar archivos existentes:", listError);
    } else if (existingFiles && existingFiles.length > 0) {
      // Eliminar cualquier archivo previo con el mismo entityId
      const filesToRemove = existingFiles
        .filter((f) => f.name.startsWith(entityId))
        .map((f) => f.name);

      if (filesToRemove.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(bucket)
          .remove(filesToRemove);

        if (removeError) {
          console.error("Error eliminando archivos anteriores:", removeError);
        }
      }
    }

    // Subir el nuevo archivo con upsert true 
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(newPath, file, {
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Error al subir archivo:", uploadError);
      return { success: false, error: "Error al cargar el archivo" };
    }

    // Obtener URL pública del nuevo archivo
    const { data } = supabase.storage.from(bucket).getPublicUrl(newPath);

    return { success: true, url: data.publicUrl };
  } catch (err) {
    console.error("Error inesperado al subir archivo:", err);
    return { success: false, error: "Error inesperado al cargar el archivo" };
  }
}

 /**
 * 🖼️ Obtiene la URL pública de una imagen dentro de un bucket,
 * sin importar su extensión (png, jpg, webp, etc.)
 */
export async function getImageUrl(bucket: string, baseName: string) {
  const supabase = await createClient();

  try {
    // 1️⃣ Listar todos los archivos del bucket
    const { data: files, error } = await supabase.storage.from(bucket).list("");

    if (error) {
      console.error("Error al listar archivos del bucket:", error);
      return null;
    }

    // 2️⃣ Buscar el archivo que comience con el nombre indicado
    const matchedFile = files?.find((f) =>
      f.name.startsWith(baseName)
    );

    if (!matchedFile) {
      console.warn(`No se encontró archivo con el nombre base "${baseName}"`);
      return null;
    }

    // 3️⃣ Obtener la URL pública del archivo encontrado
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(matchedFile.name);

    return data.publicUrl;
  } catch (err) {
    console.error("Error al obtener imagen:", err);
    return null;
  }
}