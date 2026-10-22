'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { deleteContactGroup } from '@/lib/actions/contact_group.actions'
import CopyTextButton from '@/components/general/copy-text-button'

interface DeleteContactGroupDialogProps {
  contactGroupId: string
  contactGroupTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (contactGroupId: string) => void
}

export function DeleteContactGroupDialog({
  contactGroupId,
  contactGroupTitle,
  open,
  onOpenChange,
  onDelete
}: DeleteContactGroupDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Usuario no autenticado')

      const result = await deleteContactGroup({ contactGroupId, userId: user.id })

      if (result.success) {
        toast.success(`Grupo de contacto "${contactGroupTitle}" eliminado`)
        onDelete(contactGroupId)
        onOpenChange(false)
        setConfirmationInput('')
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al eliminar el grupo de contacto')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setConfirmationInput('')
    onOpenChange(false)
  }

  const isConfirmed = confirmationInput.trim() === contactGroupTitle.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            ¿Está seguro que desea eliminar el grupo de contacto?
          </DialogTitle>
          <DialogDescription className="mt-4 text-muted-foreground">
            Escriba el nombre <span className="font-semibold text-foreground">{contactGroupTitle}</span> para eliminar el grupo de contacto.
          </DialogDescription>
        </DialogHeader>
        <div className="mb-3">
          <CopyTextButton value={contactGroupTitle} />
        </div>
        <div className="mb-4">
          <Input
            placeholder={`Escriba "${contactGroupTitle}" para confirmar`}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full focus:border-destructive focus:ring-destructive bg-background text-foreground"
          />
          {confirmationInput && !isConfirmed && (
            <p className="text-xs text-destructive mt-2">
              El nombre debe coincidir exactamente
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !isConfirmed}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}