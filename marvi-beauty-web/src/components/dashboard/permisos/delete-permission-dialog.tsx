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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>¿Está seguro que desea eliminar el permiso?</DialogTitle>
                    <DialogDescription className='mt-4 text-muted-foreground'>
                        Escriba el código <span className="font-semibold text-primary">{permissionCode}</span> para eliminar el permiso
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
                        disabled={isDeleting || confirmationInput !== permissionCode}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog> 
    )
}