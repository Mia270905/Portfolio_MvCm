'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deletePermission } from '@/lib/actions/permission.actions'
import { toast } from 'sonner'
import CopyTextButton from '@/components/general/copy-text-button';

interface DeletePermissionDialogProps {
    permissionId: string,
    permissionCode: string,
    permissionName: string,
    open: boolean,
    onOpenChange: (open:boolean) => void
}

export function DeletePermissionDialog({
    permissionId,
    permissionCode,
    permissionName,
    open,
    onOpenChange
}: DeletePermissionDialogProps ){
    const [confirmationInput, setConfirmationInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deletePermission(permissionId, permissionCode);

        if(result.success){
            toast.success('Permiso eliminado correctamente');
            onOpenChange(false);
            setConfirmationInput('');
        } else {
            toast.error(result.message);
        }

        setIsDeleting(false);
    }

    const handleCancel = () => {
        setConfirmationInput('');
        onOpenChange(false);
    }

    return(
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-custom-bg-secondary border border-custom-border-secondary">
                <DialogHeader>
                    <DialogTitle className="text-custom-text-primary">¿Está seguro que desea eliminar el permiso?</DialogTitle>
                    <DialogDescription className='mt-4 text-custom-text-tertiary'>
                        Escriba el código <span className="font-semibold text-custom-text-secondary">{permissionCode}</span> para eliminar el permiso
                    </DialogDescription>
                </DialogHeader>
                <div className="mb-3">
                    <CopyTextButton value={permissionCode} />
                </div>
                <div className="mb-4">
                    <Input
                        placeholder={permissionCode}
                        value={confirmationInput}
                        onChange={(e) => setConfirmationInput(e.target.value)}
                        className="w-full bg-custom-bg-tertiary border-custom-border-primary text-custom-text-primary placeholder-custom-text-tertiary"
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isDeleting}
                        className="border-custom-border-primary text-custom-text-primary hover:bg-custom-bg-hover"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting || confirmationInput !== permissionCode}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog> 
    )
}