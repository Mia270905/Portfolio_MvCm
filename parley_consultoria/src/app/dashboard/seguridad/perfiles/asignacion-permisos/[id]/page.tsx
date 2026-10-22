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
        className={`border border-[#f5efe6] rounded-lg shadow-sm overflow-hidden mb-3 transition-all duration-200 ${level > 0 ? "ml-6" : ""} bg-white`}
      >
        <button
          onClick={() => toggleAccordion(module.code)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f5efe6] transition-all duration-200"
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span
              className={`transform transition-transform flex-shrink-0 ${isOpen ? "rotate-90" : "rotate-0"}`}
            >
              ▶
            </span>
            <span
              className="font-semibold text-neutral-900 truncate"
              title={module.name}
            >
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
          <div className="divide-y divide-[#f5efe6]">
            {module.permissions
              ?.filter((p) => !p.code.startsWith("menu:"))
              .map((permission) => {
                const userHasAccess = hasFullAccess || userPermissions.includes(permission.code);
                const canModify = userHasAccess;

                return (
                  <div
                    key={permission.id}
                    className={`flex items-center justify-between px-4 py-3 gap-4 ${
                      !userHasAccess ? 'bg-[#faf8f3]' : ''
                    } rounded-b-lg`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className="font-medium text-neutral-900 truncate"
                          title={permission.name}
                        >
                          {permission.name}
                        </p>
                        {!canModify && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-[#f0e9d5] text-[#7a5a00] rounded-full border border-[#e6d7a3]">
                            <Lock className="w-3 h-3" />
                            Sin acceso
                          </span>
                        )}
                      </div>
                      <p
                        className="text-sm text-neutral-700 truncate"
                        title={permission.code}
                      >
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
              <div className="bg-[#faf8f3] py-2 rounded-b-lg">
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
    <div className="relative min-h-screen pb-20 md:pb-8">
      <div className="mb-6 p-4 lg:p-6">
        <button
          onClick={() => window.location.href = "/dashboard/seguridad/perfiles"}
          className="inline-flex items-center text-neutral-600 hover:text-[#c6a365] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
              Asignar Permisos
            </h1>
            {loadedStatus === "loaded" && profile && (
              <p className="text-neutral-600 mt-2">
                Perfil: <span className="font-medium text-[#b59555]">{profile.name}</span>
              </p>
            )}
          </div>

          {loadedStatus === "loaded" && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsDialogOpen(true)}
                disabled={loading || (!hasFullAccess && userPermissions.length === 0)}
                className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r bg-[#a78447]  hover:bg-[#b59555] disabled:bg-neutral-300 text-white font-medium rounded-lg shadow-sm transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar Permisos
              </button>
            </div>
          )}
        </div>

        {loadedStatus === "loading" ? (
          <div className="border border-[#f5efe6] rounded-lg shadow-sm overflow-hidden mb-3 transition-all duration-200">
            <div className="w-full flex items-center justify-between bg-[#f5efe6] px-4 py-3 animate-pulse">
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 bg-[#e6d7a3] rounded"></span>
                <span className="h-4 w-32 bg-[#e6d7a3] rounded"></span>
              </div>
              <div className="h-4 w-12 bg-[#e6d7a3] rounded"></div>
            </div>
          </div>
        ) : loadedStatus === "failed" ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#fdeaea] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#c62828]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Error al cargar datos
              </h3>
              <p className="text-neutral-600 mb-6">
                {error || "No se pudieron cargar los datos. Por favor, recargue la página."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="text-[#c6a365] hover:text-[#b59555] font-medium"
              >
                Recargar página
              </button>
            </div>
          </div>
        ) : userPermissions.length === 0 && !hasFullAccess ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
              <Lock className="w-12 h-12 text-[#c62828] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Acceso denegado
              </h3>
              <p className="text-neutral-600 mb-6">
                No tienes permisos para asignar permisos a otros perfiles.
              </p>
              <button
                onClick={() => window.location.href = "/dashboard/seguridad/perfiles"}
                className="inline-flex items-center text-[#c6a365] hover:text-[#b59555]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Perfiles
              </button>
            </div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
              <EyeOff className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Sin módulos disponibles
              </h3>
              <p className="text-neutral-600">
                {hasFullAccess
                  ? 'No hay módulos disponibles para mostrar.'
                  : 'No hay módulos disponibles con los permisos que tienes.'}
              </p>
            </div>
          </div>
        ) : (
          modules.filter((m) => m.parent_module_id === null).map((module) => renderModule(module))
        )}
      </div>

      {loadedStatus === "loaded" && !(userPermissions.length === 0 && !hasFullAccess) && (
        <button
          onClick={() => setIsDialogOpen(true)}
          disabled={loading}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] disabled:bg-neutral-300 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50"
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
          <div className="relative bg-white rounded-lg border border-[#f5efe6] shadow-sm max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-neutral-900">¿Confirmar actualización?</h2>
              <p className="mt-2 text-sm text-neutral-700">
                Está a punto de actualizar los permisos del perfil <span className="font-medium text-[#b59555]">{profile.name}</span>.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setIsDialogOpen(false)}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-[#f5efe6] text-neutral-700 font-medium rounded-lg border border-[#CFC7B8] hover:border-[#c6a365] transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePermissions}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] text-white font-medium rounded-lg shadow-sm transition-all duration-200"
              >
                Actualizar Permisos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}