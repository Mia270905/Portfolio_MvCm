"use client"

import { ArrowLeft, Image } from "lucide-react";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import { toast } from 'sonner';

export default function Page() {
    const router = useRouter()
    const [user, setUser] = useState()
    const [permissions, setPermissions] = useState<string[]>([])
    
    useEffect(() => {
        const loadUserAndPermissions = async () => {
        try {
            const localUser = await getUserWithPermissions();
            const localPermissions = Array.isArray(localUser?.permissions)
            ? localUser.permissions.map((p: any) => p.code)
            : [];
            await setUserAndPermissions(localUser,localPermissions);            
        } catch (error) {
            toast.error("No se pudieron cargar los permisos del usuario.")
        }
        };
        loadUserAndPermissions();
    }, []);

    async function setUserAndPermissions(user: any, permissions: string[]){
        setUser(user);
        setPermissions(permissions)

        if(!permissions.includes('menu:logo')){
            toast.error("No tiene permiso para acceder a este módulo.")
            router.push('/dashboard/seguridad')
        }
    }

    return (
        <div className="min-h-screen bg-custom-bg-primary">
            <div className="mb-6 p-4">
                <a href="/dashboard/seguridad" className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                </a>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-custom-text-primary">Logos</h1>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-3">
                    <div>
                        <div className="mb-3">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-custom-bg-secondary border border-custom-border-secondary hover:bg-custom-bg-hover transition-all duration-200 cursor-pointer group">
                                <div className="p-2 rounded-lg bg-custom-bg-tertiary group-hover:bg-custom-accent-hover transition-colors">
                                    <Image size={32} className="text-custom-text-tertiary group-hover:text-custom-accent-primary transition-colors"/>
                                </div>
                                <div className="flex items-center gap-3 flex-1 ml-4">
                                    <div className="flex-1">
                                        <div className="font-medium text-custom-text-primary group-hover:text-custom-accent-primary transition-colors">Logo</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-custom-bg-secondary border border-custom-border-secondary hover:bg-custom-bg-hover transition-all duration-200 cursor-pointer group">
                                <div className="p-2 rounded-lg bg-custom-bg-tertiary group-hover:bg-custom-accent-hover transition-colors">
                                    <Image size={32} className="text-custom-text-tertiary group-hover:text-custom-accent-primary transition-colors"/>
                                </div>
                                <div className="flex items-center gap-3 flex-1 ml-4">
                                    <div className="flex-1">
                                        <div className="font-medium text-custom-text-primary group-hover:text-custom-accent-primary transition-colors">Logo Largo</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mb-3">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-custom-bg-secondary border border-custom-border-secondary hover:bg-custom-bg-hover transition-all duration-200 cursor-pointer group">
                                <div className="p-2 rounded-lg bg-custom-bg-tertiary group-hover:bg-custom-accent-hover transition-colors">
                                    <Image size={32} className="text-custom-text-tertiary group-hover:text-custom-accent-primary transition-colors"/>
                                </div>
                                <div className="flex items-center gap-3 flex-1 ml-4">
                                    <div className="flex-1">
                                        <div className="font-medium text-custom-text-primary group-hover:text-custom-accent-primary transition-colors">Logo pequeño</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}