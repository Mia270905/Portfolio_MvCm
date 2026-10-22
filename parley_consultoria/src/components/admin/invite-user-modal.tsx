'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { inviteUser } from '@/lib/actions/invite_user.actions'
import { UserPlus, Mail, Loader2 } from 'lucide-react'

export function InviteUserModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Por favor ingresa un correo electrónico')
      return
    }

    setIsLoading(true)

    const result = await inviteUser(email.trim().toLowerCase())

    if (result.success) {
      toast.success(result.data?.message || 'Invitación enviada')
      setEmail('')
      setOpen(false)
    } else {
      toast.error(result.error || 'Error al enviar invitación')
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="group relative inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a365] px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:bg-[#b59555] hover:shadow-lg hover:shadow-[#c6a365]/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c6a365] w-full sm:w-auto">
          <UserPlus className="h-4 w-4" />
          Invitar Usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white border border-[#f5efe6] shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-neutral-900">
            <Mail className="h-5 w-5 text-[#c6a365]" />
            Invitar Nuevo Usuario
          </DialogTitle>
          <DialogDescription className="text-neutral-600">
            Ingresa el correo electrónico del usuario que deseas invitar. Recibirá un enlace para crear su cuenta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-neutral-900">
              Correo Electrónico
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-[#f5efe6] text-neutral-700 font-medium rounded-lg border border-[#CFC7B8] hover:border-[#c6a365] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !email.trim()}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Enviar Invitación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}