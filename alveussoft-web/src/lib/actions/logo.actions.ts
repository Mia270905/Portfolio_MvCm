"use server"

import { createClient } from '@/lib/supabase/server'


export async function uploadLogo(path: string, file: File){
    const supabase = await createClient()

    const upload = supabase.storage.from('logo').upload(path,file, {
        upsert: true,
        contentType: file.type
    })

    const { error } = await upload;

    if(error){
        console.error('Error loading image:', error)
        return { success: false, error: 'Error al cargar el archivo' }
    }

    return { success: true }
}