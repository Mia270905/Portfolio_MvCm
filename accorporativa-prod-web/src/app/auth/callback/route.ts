// /app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const redirect = searchParams.get('redirect') || '/'

  // CASO 1: Invitaciones - redirigir al manejador de cliente
  if (type === 'invite') {
    return NextResponse.redirect(`${origin}/auth/handle-invite?type=invite`)
  }

  // CASO 2: Flujo OAuth normal con code
  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code:', error)
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      if (data.user) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single()

        if (userError && userError.code !== 'PGRST116') {
          console.error('Error checking user:', userError)
        }
        
        // Si no existe, esperar un momento para que el trigger funcione
        if (!user) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`)
      
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  }

  // CASO 3: No hay parámetros válidos
  return NextResponse.redirect(`${origin}/auth/error?message=invalid_callback`)
}