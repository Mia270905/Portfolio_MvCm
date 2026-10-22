// /app/auth/handle-invite/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HandleInvitePage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleInvite = async () => {
      
      // Extraer parámetros del hash
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      const expires_in = params.get('expires_in')
      const token_type = params.get('token_type')
      const type = params.get('type')

      if (access_token && type === 'invite') {
        try {
          // Establecer la sesión con el token
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          })
          
          if (sessionError) {
            console.error('Error estableciendo sesión:', sessionError)
            router.push('/auth/error?message=session_error')
            return
          }

          // Obtener usuario actual
          const { data: { user }, error: userError } = await supabase.auth.getUser()
          
          if (userError || !user) {
            console.error('Error obteniendo usuario:', userError)
            router.push('/auth/error?message=user_not_found')
            return
          }
          
          // Redirigir a la página de registro con los datos
          const signUpUrl = `/auth/sign-up?type=invite&email=${encodeURIComponent(user.email || '')}`
          router.push(signUpUrl)
          
        } catch (error) {
          console.error('Error procesando invitación:', error)
          router.push('/auth/error')
        }
      } else {
        console.error('Faltan parámetros en el hash')
        router.push('/auth/error?message=invalid_invitation_link')
      }
    }

    handleInvite()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Procesando tu invitación...</p>
      </div>
    </div>
  )
}