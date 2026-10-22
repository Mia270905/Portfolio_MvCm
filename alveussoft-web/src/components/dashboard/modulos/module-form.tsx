import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Module, NewModulePayload } from "@/lib/definitions";
import { getIcon } from '@/lib/utils/icons';
import { Info } from 'lucide-react';
import { useEffect } from "react";

interface ModuleFormProps {
  handleSubmit: (e: React.FormEvent) => void
  formData: NewModulePayload,
  hasChildren: boolean,
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  errors: Record<string, string>
  handleSelectChange: (value: string) => void
  parentModules: Pick<Module, 'id' | 'name' | 'icon' | 'path' >[]
  handleToggleActive: () => void
  buttonText: string
  buttonLoadingText: string
  loading: boolean
  onPathChange?: (fullPath: string) => void;
}

export default function ModuleForm({
  handleSubmit,
  formData,
  hasChildren,
  handleChange,
  errors,
  handleSelectChange,
  parentModules,
  handleToggleActive,
  buttonText = 'Guardar',
  buttonLoadingText = 'Guardando...',
  loading,
  onPathChange
}: ModuleFormProps) {
    const parentModule = parentModules.find(m => m.id === formData.parent_module_id);
    const fullPath = formData.path && parentModule
      ? `${parentModule.path}${formData.path}`
      : `${formData.path}`;

    useEffect(() => {
      if (onPathChange) {
        onPathChange(fullPath);
      }
    }, [fullPath, onPathChange]);

    return (
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Código */}
            <div>
              <label htmlFor="code" className="block font-medium text-custom-text-secondary mb-2">
                Código <span className="text-red-400">*</span>
              </label>
              <input
                type="text" id="code" name="code"
                value={formData.code} onChange={handleChange}
                className="w-full px-3 py-2 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary transition-all duration-200"
                placeholder="users"
              />
              {errors.code && <p className="text-red-400 text-sm mt-1">{errors.code}</p>}
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block font-medium text-custom-text-secondary mb-2">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text" id="name" name="name"
                value={formData.name} onChange={handleChange}
                className="w-full px-3 py-2 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary transition-all duration-200"
                placeholder="Usuarios"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Módulo Padre */}
            <div>
              <label className="block font-medium text-custom-text-secondary mb-2">Módulo Padre</label>
              <Select
                  disabled={hasChildren}
                  value={formData.parent_module_id || 'null'}
                  onValueChange={handleSelectChange}
              >
                  <SelectTrigger className="w-full px-3 py-2 h-auto text-base border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary transition-all duration-200">
                      <SelectValue placeholder="Seleccione una opción" />
                  </SelectTrigger>
                  <SelectContent className="bg-custom-bg-secondary border border-custom-border-primary text-custom-text-primary">
                      <SelectItem value="null" className="text-base hover:bg-custom-accent-hover focus:bg-custom-accent-hover">Sin módulo padre</SelectItem>
                      {parentModules.map((module) => {
                        const IconComponent = getIcon(module.icon);
                        return (
                          <SelectItem key={module.id} value={module.id} className="text-base hover:bg-custom-accent-hover focus:bg-custom-accent-hover">
                            <div className="flex items-center gap-2">
                              <IconComponent size={20} className="text-custom-accent-primary" />
                              <span>{module.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
              </Select>
              {hasChildren && <span className="mt-2 text-sm text-custom-text-tertiary italic">Este módulo tiene hijos, elimine las relaciones para convertir este módulo en hijo de otro.</span>}
            </div>

            {/* Ruta */}
            <div>
              <label htmlFor="path" className="block font-medium text-custom-text-secondary mb-2">
                Ruta <span className="text-red-400">*</span>
              </label>
              <input
                type="text" id="path" name="path"
                value={formData.path} onChange={handleChange}
                className="w-full px-3 py-2 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary transition-all duration-200"
                placeholder="/usuarios"
              />
                {errors.path && <p className="text-red-400 text-sm mt-1">{errors.path}</p>}
            </div>

            {/* Vista previa de la ruta completa */}
            {fullPath && (
              <div className="mt-3 p-3 bg-custom-accent-hover border border-custom-accent-border rounded-lg">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-custom-accent-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-custom-accent-primary font-medium">Ruta completa del módulo:</p>
                    <code className="text-sm font-mono text-custom-accent-secondary bg-custom-accent-primary/20 px-2 py-1 rounded-sm mt-1 inline-block" id="fullPath">
                      {fullPath}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block font-medium text-custom-text-secondary mb-2">
                Descripción
              </label>
              <textarea
                id="description" name="description" rows={3}
                value={formData.description || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary transition-all duration-200"
                placeholder="Gestión de usuarios del sistema"
              />
            </div>

            {/* Ícono */}
            <div>
              <label htmlFor="icon" className="block font-medium text-custom-text-secondary mb-2">
                Ícono
              </label>
              <input
                type="text" id="icon" name="icon"
                value={formData.icon || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary transition-all duration-200"
                placeholder="Users"
              />
            </div>

            {/* Activo/Inactivo */}
            <div>
              <label className="block font-medium text-custom-text-secondary mb-3">Estado</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none ${formData.active ? 'bg-green-500' : 'bg-custom-text-tertiary'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${formData.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${formData.active ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                  {formData.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <a 
                href="/dashboard/seguridad/modulos" 
                className="inline-flex items-center justify-center px-6 py-2 bg-custom-bg-tertiary hover:bg-custom-bg-hover text-custom-text-primary font-medium rounded-lg border border-custom-border-primary transition-all duration-200"
              >
                Cancelar
              </a>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary disabled:bg-custom-bg-tertiary text-custom-bg-primary font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? buttonLoadingText : buttonText}
              </button>
            </div>
          </form>
        </div>
    );
}