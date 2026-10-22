'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteModule } from '@/lib/actions/module.actions'
import { toast } from 'sonner'
import CopyTextButton from '@/components/general/copy-text-button'

interface DeleteModuleDialogProps {
  moduleId: string
  moduleCode: string
  moduleName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteModuleDialog({
  moduleId,
  moduleCode,
  moduleName,
  open,
  onOpenChange
}: DeleteModuleDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    
    const result = await deleteModule(moduleId, confirmationInput)
    
    if (result.success) {
      toast.success('Módulo eliminado correctamente')
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
          <DialogTitle>¿Está seguro que desea eliminar el módulo?</DialogTitle>
          <DialogDescription className='mt-4'>
            Escriba el código <span className="font-semibold text-[#987E71]">{moduleCode}</span> para eliminar el módulo
          </DialogDescription>
        </DialogHeader>
        <div className="mb-3">
          <CopyTextButton value={moduleCode} />
        </div>
        <div className="mb-4">
          <Input
            placeholder={moduleCode}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmationInput !== moduleCode}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}