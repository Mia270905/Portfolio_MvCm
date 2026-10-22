'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { deleteProfile } from '@/lib/actions/profile.actions'
import CopyTextButton from '@/components/general/copy-text-button'
import { profile } from 'console'

interface DeleteProfileDialogProps {
  profileId: string
  profileCode: string
  profileName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteProfileDialog({
  profileId,
  profileCode,
  profileName,
  open,
  onOpenChange
}: DeleteProfileDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    const result = await deleteProfile(profileId, confirmationInput)
    
    if (result.success) {
      toast.success('Perfil eliminado correctamente')
      onOpenChange(false)
      setConfirmationInput('')
    } else {
      toast.error(result.message)
    }
    
    setIsDeleting(false)
  }

  const handleCancel = () => {
    setConfirmationInput('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Está seguro que desea eliminar el perfil?</DialogTitle>
          <DialogDescription className='mt-4 text-muted-foreground'>
            Escriba el código <span className="font-semibold text-primary">{profileCode}</span> para eliminar el perfil
          </DialogDescription>
        </DialogHeader>
        <div className="mb-3">
          <CopyTextButton value={profileCode} />
        </div>
        <div className="mb-4">
          <Input
            placeholder={profileCode}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full border-input focus:ring-primary"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            className="border-input text-foreground hover:bg-muted hover:text-foreground"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmationInput !== profileCode}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}