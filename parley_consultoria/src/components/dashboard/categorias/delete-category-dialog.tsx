'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { deleteCategory } from '@/lib/actions/category.actions'

interface DeleteCategoryDialogProps {
  categoryId: string
  categoryTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (categoryId: string) => void
}

export function DeleteCategoryDialog({
  categoryId,
  categoryTitle,
  open,
  onOpenChange,
  onDelete
}: DeleteCategoryDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Obtener usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Usuario no autenticado')

      // Llamar a la función server para eliminar la categoría
      const result = await deleteCategory({ categoryId, userId: user.id })

      if (result.success) {
        toast.success(`Categoría "${categoryTitle}" eliminada`)
        onDelete(categoryId) // actualizar la lista en el frontend
        onOpenChange(false)
        setConfirmationInput('')
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al eliminar la categoría')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setConfirmationInput('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Está seguro que desea eliminar la categoría?</DialogTitle>
          <DialogDescription className="mt-4 text-gray-400">
            Escriba el nombre <span className="font-semibold text-gray-100">{categoryTitle}</span> para eliminar la categoría
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder={categoryTitle}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmationInput !== categoryTitle}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
