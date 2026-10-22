'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { deleteZone, PostalCode } from '@/lib/actions/zone.actions'

interface DeleteZoneDialogProps {
  zoneId: string
  zoneName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (zoneId: string) => void
}

export function DeleteZoneDialog({
  zoneId,
  zoneName,
  open,
  onOpenChange,
  onDelete
}: DeleteZoneDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [linkedPostalCodes, setLinkedPostalCodes] = useState<PostalCode[]>([])
  const supabase = createClient()

  // Traer códigos postales vinculados a la zona al abrir el diálogo
  useEffect(() => {
    if (!open) return

    const fetchPostalCodes = async () => {
      try {
        const { data, error } = await supabase
          .from('postal_codes')
          .select('*')
          .eq('zone_id', zoneId)
          .is('deleted_at', null)
          .order('code', { ascending: true })

        if (error) throw error
        setLinkedPostalCodes(data || [])
      } catch (err: any) {
        console.error(err)
        toast.error('Error al obtener los códigos postales vinculados')
      }
    }

    fetchPostalCodes()
  }, [open, zoneId, supabase])

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Usuario no autenticado')

      // Primero desvincular todos los códigos postales de la zona
      if (linkedPostalCodes.length > 0) {
        const { error: unlinkError } = await supabase
          .from('postal_codes')
          .update({
            zone_id: null,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('zone_id', zoneId)

        if (unlinkError) {
          toast.warning('No se pudieron desvincular algunos códigos postales: ' + unlinkError.message)
        }
      }

      // Luego eliminar la zona (soft delete)
      const result = await deleteZone({ zoneId, userId: user.id })

      if (result.success) {
        toast.success(`Zona "${zoneName}" eliminada`)
        onDelete(zoneId)
        onOpenChange(false)
        setConfirmationInput('')
      } else {
        toast.error(result.message)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al eliminar la zona')
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
          <DialogTitle>¿Está seguro que desea eliminar la zona?</DialogTitle>
          <DialogDescription className="mt-4 text-gray-400">
            Esta acción desvinculará {linkedPostalCodes.length} código(s) postal(es) asociado(s) a esta zona.<br />
            Escriba el nombre <span className="font-semibold text-gray-100">{zoneName}</span> para confirmar la eliminación.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder={zoneName}
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
            disabled={isDeleting || confirmationInput !== zoneName}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
