// components/confirm-remove-driver-dialog.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmRemoveDriverDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  driverName: string
  orderNumber: string
  isRemoving: boolean
}

export function ConfirmRemoveDriverDialog({
  open,
  onOpenChange,
  onConfirm,
  driverName,
  orderNumber,
  isRemoving
}: ConfirmRemoveDriverDialogProps) {
  const [confirmationText, setConfirmationText] = useState('')

  const handleConfirm = () => {
    if (confirmationText === driverName) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    setConfirmationText('')
    onOpenChange(false)
  }

  const isConfirmed = confirmationText === driverName

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Quitar repartidor asignado?</DialogTitle>
          <DialogDescription className="mt-4 space-y-2">
            <p>
              Escriba el nombre del repartidor <span className="font-semibold text-gray-900">{driverName}</span> para confirmar que desea quitarlo del pedido <span className="font-semibold text-gray-900">{orderNumber}</span>.
            </p>
            <p className="text-amber-600 font-medium">
              Esta acción no se puede deshacer.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <input
            type="text"
            placeholder={driverName}
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isRemoving}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isRemoving || !isConfirmed}
          >
            {isRemoving ? 'Quitando...' : 'Quitar repartidor'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}