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

  const handleSubmit = async (e:  React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Por favor ingresa un correo electrónico')
      return
    }

    setIsLoading(true)

    const result = await inviteUser(email.trim().toLowerCase())

    if (result.success) {
      toast.success(result.data?. message || 'Invitación enviada')
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
        <Button className="flex items-center gap-2 bg-amber-400 text-black hover:bg-amber-500">
          <UserPlus className="h-4 w-4" />
          Invitar Usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="sm: max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invitar Nuevo Usuario
          </DialogTitle>
          <DialogDescription>
            Ingresa el correo electrónico del usuario que deseas invitar.  Recibirá un enlace para crear su cuenta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              autoComplete="email"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !email.trim()}>
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