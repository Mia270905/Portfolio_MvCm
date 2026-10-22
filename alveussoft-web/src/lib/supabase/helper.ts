// /lib/supabase/user-helper.ts
import { createClient } from './client'

export async function ensureUserInDatabase(userId: string) {
  const supabase = createClient()
  
  try {
    // Verificar si el usuario ya existe en la tabla users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, active')
      .eq('id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    // Si el usuario no existe, crear uno básico
    if (!existingUser) {
      const { data: authUser, error: authError } = await supabase.auth.getUser()
      
      if (authError) throw authError
      
      if (authUser.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authUser.user.id,
            full_name: authUser.user.user_metadata?.full_name || 
                      authUser.user.user_metadata?.name || 
                      authUser.user.email?.split('@')[0] || 
                      'Usuario',
            email: authUser.user.email,
            active: true,
            profile_id: authUser.user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError && insertError.code !== '23505') {
          throw insertError
        }
      }
    }

    return true

  } catch (error) {
    console.error('Error ensuring user in database:', error)
    throw error
  }
}