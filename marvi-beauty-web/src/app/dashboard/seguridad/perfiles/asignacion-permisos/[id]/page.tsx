"use client"

import Toggle from "@/components/ui/toggle"
import { getModulesWithPermissions } from "@/lib/actions/module.actions"
import { getProfileWithPermissions, updateProfilePermissions } from "@/lib/actions/profile.actions"
import { getCurrentUserPermissions, hasFullPermissionAccess } from "@/lib/actions/user.actions"
import { ArrowLeft, RefreshCw, EyeOff, Lock } from "lucide-react"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

type Permission = {
  id: string
  code: string
  name: string
  active?: boolean
}

type ModuleType = {
  id: string
  code: string
  name: string
  active: boolean
  parent_module_id: string | null
  permissions: Permission[]
  children?: ModuleType[]
}

export default function PermissionsManager() {
  const { id: idParams } = useParams()
  const [permissionStates, setPermissionStates] = useState<Record<string, boolean>>({})
  const [originalPermissionStates, setOriginalPermissionStates] = useState<Record<string, boolean>>({})
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({})
  const [modules, setModules] = useState<ModuleType[]>([])
  const [profile, setProfile] = useState<any>({})
  const [loadedStatus, setLoadedStatus] = useState<"loading" | "loaded" | "failed">("loading")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [hasFullAccess, setHasFullAccess] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const profileId = Array.isArray(idParams) ? idParams[0] : idParams
        if (!profileId) return

        // Obtener permisos del usuario actual
        const userPerms = await getCurrentUserPermissions();
        setUserPermissions(userPerms);
        
        // Verificar si tiene acceso completo
        const fullAccess = userPerms.includes('permission-all:profiles');
        setHasFullAccess(fullAccess);

        // Obtener módulos - con o sin filtro dependiendo del acceso
        const [modulesData, profileData] = await Promise.all([
          getModulesWithPermissions({ 
            filterByUserPermissions: fullAccess ? undefined : userPerms,
            hasFullAccess: fullAccess
          }),
          getProfileWithPermissions(profileId),
        ])
        setModules(modulesData || [])
        setProfile(profileData || {})

        // Cargar estados de permisos
        const activePermissions: Record<string, boolean> = {}
        if (profileData && profileData.permissions) {
          for (const perm of profileData.permissions) {
            if (perm.id) {
              // Si tiene acceso completo O tiene permiso para verlo, cargar estado
              if (fullAccess || userPerms.includes(perm.code)) {
                activePermissions[perm.id] = !!perm.active
              }
            }
          }
        }

        setPermissionStates(activePermissions)
        setOriginalPermissionStates({ ...activePermissions })
        setLoadedStatus("loaded")
      } catch (err: any) {
        console.error("Error cargando datos:", err)
        setError(err.message || "Error al cargar, recargue la página o intentelo de nuevo más tarde")
        setLoadedStatus("failed")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [idParams])

  const togglePermission = (module: ModuleType, permission: Permission, checked: boolean) => {
    const isMenu = permission.code.startsWith("menu:")
    setPermissionStates((prev) => {
      const newState = { ...prev }
      if (isMenu) {
        // Si tiene acceso completo, togglear todos los permisos
        // Si no, solo los que puede ver/modificar
        module.permissions.forEach((p) => {
          if (hasFullAccess || userPermissions.includes(p.code)) {
            newState[p.id] = checked
          }
        })
      } else {
        newState[permission.id] = checked

        // Actualizar permiso de menú si corresponde
        const menuPermission = module.permissions.find((p) => p.code.startsWith("menu:"))
        if (menuPermission && (hasFullAccess || userPermissions.includes(menuPermission.code))) {
          if (checked) newState[menuPermission.id] = true
          else {
            const anyActive = module.permissions.some((p) => 
              p.id !== menuPermission.id && 
              newState[p.id] &&
              (hasFullAccess || userPermissions.includes(p.code))
            )
            if (!anyActive) newState[menuPermission.id] = false
          }
        }
      }
      return newState
    })
  }

  const handleSavePermissions = async () => {
    const profileId = Array.isArray(idParams) ? idParams[0] : idParams
    if (!profileId) return

    setIsDialogOpen(false)

    try {
      // Para usuarios con acceso completo, necesitamos todos los permisos
      if (hasFullAccess) {
        // Obtener TODOS los permisos del perfil para actualización completa
        const allProfileData = await getProfileWithPermissions(profileId);
        
        const allOriginalStates: Record<string, boolean> = {};
        allProfileData.permissions?.forEach((perm: any) => {
          allOriginalStates[perm.id] = !!perm.active;
        });

        // Combinar: mantener todos los permisos existentes, actualizar los que el usuario cambió
        const finalPermissionStates: Record<string, boolean> = { ...allOriginalStates };
        Object.keys(permissionStates).forEach(permissionId => {
          finalPermissionStates[permissionId] = permissionStates[permissionId];
        });

        const result = await updateProfilePermissions(
          profileId, 
          finalPermissionStates, 
          allOriginalStates
        );
        
        if (!result.success) {
          toast.error(result.error || "Error al actualizar permisos, intentelo de nuevo más tarde.")
          console.error("Error al actualizar permisos:", result.error)
        } else {
          toast.success(`${result.count} permisos actualizados correctamente`)
          setOriginalPermissionStates({ ...permissionStates })
        }
      } else {
        // Para usuarios sin acceso completo, solo los permisos que pueden ver
        const result = await updateProfilePermissions(
          profileId, 
          permissionStates, 
          originalPermissionStates
        );
        
        if (!result.success) {
          toast.error(result.error || "Error al actualizar permisos, intentelo de nuevo más tarde.")
          console.error("Error al actualizar permisos:", result.error)
        } else {
          toast.success(`${result.count} permisos actualizados correctamente`)
          setOriginalPermissionStates({ ...permissionStates })
        }
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud")
      console.error("Error:", error)
    }
  }

  const toggleAccordion = (moduleCode: string) =>
    setOpenModules((prev) => ({ ...prev, [moduleCode]: !prev[moduleCode] }))

  const renderModule = (module: ModuleType, level = 0) => {
    // Si el módulo no tiene permisos visibles ni hijos, no renderizar
    const hasVisiblePermissions = module.permissions && module.permissions.length > 0;
    const hasVisibleChildren = module.children && module.children.length > 0;
    
    if (!hasVisiblePermissions && !hasVisibleChildren) {
      return null;
    }

    const isOpen = openModules[module.code]
    const menuPermission = module.permissions?.find((p) => p.code.startsWith("menu:"))
    const menuChecked = menuPermission ? !!permissionStates[menuPermission.id] : false

    return (
      <div
        key={module.code}
        className={`border rounded-lg shadow-xs overflow-hidden mb-3 transition-all duration-200 ${level > 0 ? "ml-6" : ""}`}
      >
        <button
          onClick={() => toggleAccordion(module.code)}
          className="w-full flex items-center justify-between bg-custom-accent-hover dark:bg-custom-bg-secondary px-4 py-3 hover:bg-custom-accent-hover dark:hover:bg-custom-bg-hover transition"
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className={`transform transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : "rotate-0"}`}>
              ▶ 
            </span>
            <span className="font-semibold text-gray-800 dark:text-custom-text-primary truncate" title={module.name}>
              {module.name}
            </span>
          </div>
          {menuPermission && (
            <Toggle 
              checked={menuChecked} 
              onChange={(checked) => togglePermission(module, menuPermission, checked)}
              disabled={!hasFullAccess && !userPermissions.includes(menuPermission.code)}
            />
          )}
        </button>

        <div
          className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
        >
          <div className="divide-y divide-gray-200 dark:divide-custom-border-primary">
            {module.permissions
              ?.filter((p) => !p.code.startsWith("menu:"))
              .map((permission) => {
                const userHasAccess = hasFullAccess || userPermissions.includes(permission.code);
                const canModify = userHasAccess;
                
                return (
                  <div
                    key={permission.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-custom-accent-hover dark:hover:bg-custom-bg-hover gap-4 ${
                      !userHasAccess ? 'bg-custom-accent-hover dark:bg-custom-bg-tertiary' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-800 dark:text-custom-text-primary truncate" title={permission.name}>
                          {permission.name}
                        </p>
                        {!canModify && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full">
                            <Lock className="w-3 h-3" />
                            Sin acceso
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-custom-text-muted truncate" title={permission.code}>
                        {permission.code}
                      </p>
                    </div>
                    <Toggle
                      checked={!!permissionStates[permission.id]}
                      onChange={(checked) => togglePermission(module, permission, checked)}
                      disabled={!canModify}
                    />
                  </div>
                );
              })}

            {module.children && module.children.length > 0 && (
              <div className="bg-custom-accent-hover dark:bg-custom-bg-tertiary py-2">
                {module.children.map((child) => renderModule(child, level + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDialogOpen) {
        setIsDialogOpen(false)
      }
    }

    if (isDialogOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [isDialogOpen])

  return (
    <div className="relative min-h-screen pb-20 md:pb-8 bg-custom-bg-primary">
      <div className="mb-6">
        <a
          href="/dashboard/seguridad/perfiles"
          className="inline-flex items-center text-custom-text-tertiary hover:text-gray-900 p-2 hover:bg-custom-accent-hover rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </a>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-custom-text-primary">
            Asignar permisos {loadedStatus === "loaded" && profile && `: ${profile.name}`}
          </h1>

          {loadedStatus === "loaded" && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDialogOpen(true)}
                disabled={loading || (!hasFullAccess && userPermissions.length === 0)}
                className="hidden md:inline-flex items-center gap-2 px-6 py-2 bg-[#4F46E5] hover:bg-[#6366F1] disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>
          )}
        </div>

        {loadedStatus === "loading" ? (
          <div className="border rounded-lg shadow-xs overflow-hidden mb-3 transition-all duration-200">
            <div className="w-full flex items-center justify-between bg-custom-accent-hover dark:bg-custom-bg-secondary px-4 py-3 animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 bg-gray-300 dark:bg-custom-bg-hover rounded"></span>
                <span className="h-4 w-32 bg-gray-300 dark:bg-custom-bg-hover rounded"></span>
              </div>
              <div className="h-4 w-12 bg-gray-300 dark:bg-custom-bg-hover rounded"></div>
            </div>
          </div>
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : userPermissions.length === 0 && !hasFullAccess ? (
          <div className="text-center py-12">
            <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-custom-text-tertiary mb-4">
              No tienes permisos para asignar permisos a otros perfiles.
            </p>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <EyeOff className="w-12 h-12 text-custom-text-tertiary mx-auto mb-4" />
            <p className="text-custom-text-tertiary">
              {hasFullAccess 
                ? 'No hay módulos disponibles para mostrar.' 
                : 'No hay módulos disponibles con los permisos que tienes.'}
            </p>
          </div>
        ) : (
          modules.filter((m) => m.parent_module_id === null).map((module) => renderModule(module))
        )}
      </div>

      {loadedStatus === "loaded" && !(userPermissions.length === 0 && !hasFullAccess) && (
        <button
          onClick={() => setIsDialogOpen(true)}
          disabled={loading}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#4F46E5] hover:bg-[#6366F1] disabled:bg-gray-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
          aria-label="Actualizar permisos"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      )}

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in duration-200"
            onClick={() => setIsDialogOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-white dark:bg-custom-bg-secondary rounded-lg shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-custom-text-primary">¿Confirmar actualización?</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-custom-text-secondary">
                Está a punto de actualizar los permisos del perfil <strong>{profile.name}</strong>. 
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-custom-text-secondary bg-custom-accent-hover dark:bg-custom-bg-hover hover:bg-custom-accent-hover dark:hover:bg-custom-bg-hover rounded-lg transition-colors order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-[#4F46E5] hover:bg-[#6366F1] rounded-lg transition-colors shadow-xs order-1 sm:order-2"
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}