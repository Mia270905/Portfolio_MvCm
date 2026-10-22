'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

//Invita a un usuario por correo electrónico
export async function inviteUser(email:  string) {
  try {
    if (!email || !email.includes('@')) {
      return {
        success: false,
        error: 'El correo electrónico no es válido',
      }
    }

    //Verificar permisos del usuario actual
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase. auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const origin = `${protocol}://${host}`

    //Usar cliente admin para invitar
    const adminClient = createAdminClient()

    const { data, error } = await adminClient. auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${origin}/auth/callback?type=invite`,
        data: {
          invited_by: user.id,
          invited_at: new Date().toISOString(),
        },
      }
    )

    if (error) {
      console.error('Error inviting user:', error)
      return {
        success: false,
        error: error.message || 'Error al enviar la invitación',
      }
    }

    return {
      success: true,
      data: {
        user: data.user,
        message: `Invitación enviada a ${email}`,
      },
    }
  } catch (error) {
    console.error('Unexpected error in inviteUser:', error)
    return {
      success: false,
      error: 'Error inesperado al invitar usuario',
    }
  }
}