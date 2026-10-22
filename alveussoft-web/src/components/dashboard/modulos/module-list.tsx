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
        <p className="text-custom-text-tertiary">No hay módulos registrados</p>
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
              userPermissions={userPermissions}
            />
            
            {hasChildren && isExpanded && (
              <div className="mt-2 ml-6 space-y-2 border-l border-custom-border-secondary pl-4">
                {module.children.map(child => (
                  <ModuleItem
                    key={child.id}
                    module={child}
                    isChild={true}
                    userPermissions={userPermissions}
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