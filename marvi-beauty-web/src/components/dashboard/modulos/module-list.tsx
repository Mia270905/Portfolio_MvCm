'use client'

import { useState } from 'react'
import { ModuleItem } from './module-item'
import { type ModulesHierarchy } from '@/lib/definitions'

interface ModuleListProps {
  modules: ModulesHierarchy
  userPermissions: string[]
}

export function ModuleList({ modules, userPermissions }: ModuleListProps) {
  const [expandedModules, setExpandedModules] = useState<string[]>([])

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  if (modules.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#987E71]">No hay módulos registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {modules.map(module => {
        const isExpanded = expandedModules.includes(module.id)
        const hasChildren = module.children && module.children.length > 0

        return (
          <div key={module.id}>
            <ModuleItem
              module={module}
              isExpanded={isExpanded}
              onToggle={() => toggleModule(module.id)}
              userPermissions={userPermissions} // <-- Pasamos los permisos
            />
            
            {hasChildren && isExpanded && (
              <div className="mt-2 space-y-2">
                {module.children.map(child => (
                  <ModuleItem
                    key={child.id}
                    module={child}
                    isChild={true}
                    userPermissions={userPermissions} // <-- También a los hijos
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
