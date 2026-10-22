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
        <div className="bg-white rounded-lg border border-[#f5efe6] p-8 max-w-md mx-auto shadow-sm">
          <svg className="w-12 h-12 text-neutral-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-neutral-600">No hay módulos registrados</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
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
              <div className="mt-1 ml-6 space-y-2 border-l border-[#e6d7a3] pl-4">
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