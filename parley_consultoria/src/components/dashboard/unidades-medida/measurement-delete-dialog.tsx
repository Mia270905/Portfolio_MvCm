'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { deleteMeasurement, checkMeasurementInUse } from '@/lib/actions/measurement.actions'

interface DeleteMeasurementDialogProps {
  measurementId: string
  measurementUnit: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (measurementId: string) => void
}

export function DeleteMeasurementDialog({
  measurementId,
  measurementUnit,
  open,
  onOpenChange,
  onDelete
}: DeleteMeasurementDialogProps) {
  const [confirmationInput, setConfirmationInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [canDelete, setCanDelete] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const supabase = createClient()

  // Verificar si se puede eliminar cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      checkIfCanDelete()
    } else {
      // Resetear estado cuando se cierra
      setCanDelete(true)
      setErrorMessage(null)
      setConfirmationInput('')
    }
  }, [open])

  const checkIfCanDelete = async () => {
    setIsChecking(true)
    try {
      const result = await checkMeasurementInUse(measurementId)
      setCanDelete(!result.isInUse)
      
      if (result.isInUse && result.referencingUnits) {
        const units = result.referencingUnits.map(u => u.unit).join(', ')
        setErrorMessage(`Esta unidad está siendo referenciada por: ${units}`)
      } else {
        setErrorMessage(null)
      }
    } catch (error) {
      console.error("Error al verificar:", error)
      setCanDelete(false)
      setErrorMessage("Error al verificar dependencias")
    } finally {
      setIsChecking(false)
    }
  }

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error("No se puede eliminar esta unidad")
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteMeasurement(measurementId)

      if (result.success) {
        toast.success(`Unidad de medida "${measurementUnit}" eliminada`)
        onDelete(measurementId)
        onOpenChange(false)
        setConfirmationInput('')
      } else {
        toast.error(result.message || "Error al eliminar la unidad de medida")
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error al eliminar la unidad de medida')
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
      <DialogContent className="sm:max-w-md bg-[#0A0F17] border border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white">¿Eliminar unidad de medida?</DialogTitle>
          <DialogDescription className="mt-4 text-gray-400">
            {canDelete ? (
              <>
                Escriba el nombre <span className="font-semibold text-yellow-400">{measurementUnit}</span> para confirmar la eliminación
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">No se puede eliminar</p>
                    <p className="text-red-400 text-sm mt-1">{errorMessage}</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  Para eliminar esta unidad, primero debes:
                </p>
                <ul className="text-gray-400 text-sm space-y-1 list-disc pl-5">
                  <li>Eliminar las unidades que la referencian</li>
                  <li>O cambiar sus referencias a otra unidad</li>
                </ul>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {isChecking ? (
          <div className="py-4 text-center">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
              <span className="text-sm">Verificando dependencias...</span>
            </div>
          </div>
        ) : canDelete ? (
          <>
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3 p-3 bg-green-900/20 border border-green-800/50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-300 text-sm">Esta unidad no tiene dependencias y puede ser eliminada</p>
              </div>
              <Input
                placeholder={measurementUnit}
                value={confirmationInput}
                onChange={(e) => setConfirmationInput(e.target.value)}
                className="w-full bg-[#070B14] border-gray-700 text-white placeholder-gray-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                disabled={isDeleting}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || confirmationInput !== measurementUnit}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              Cerrar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}