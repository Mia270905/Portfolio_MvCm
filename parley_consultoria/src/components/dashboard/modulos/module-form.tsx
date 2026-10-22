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
      <div className="bg-white rounded-lg border border-[#f5efe6] p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Código */}
          <div>
            <label htmlFor="code" className="block font-medium text-neutral-900 mb-2">
              Código <span className="text-[#c62828]">*</span>
            </label>
            <input
              type="text" 
              id="code" 
              name="code"
              value={formData.code} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
              placeholder="users"
            />
            {errors.code && <p className="text-[#c62828] text-sm mt-1">{errors.code}</p>}
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="name" className="block font-medium text-neutral-900 mb-2">
              Nombre <span className="text-[#c62828]">*</span>
            </label>
            <input
              type="text" 
              id="name" 
              name="name"
              value={formData.name} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
              placeholder="Usuarios"
            />
            {errors.name && <p className="text-[#c62828] text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Módulo Padre */}
          <div>
            <label className="block font-medium text-neutral-900 mb-2">Módulo Padre</label>
            <Select
              disabled={hasChildren}
              value={formData.parent_module_id || 'null'}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="w-full px-3 py-2 h-auto text-base border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 transition-all duration-200">
                <SelectValue placeholder="Seleccione una opción" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[#CFC7B8] text-neutral-900 shadow-sm">
                <SelectItem value="null" className="text-base bg-white hover:bg-[#f5efe6] focus:bg-[#f5efe6]">
                  <span className="text-neutral-900">Sin módulo padre</span>
                </SelectItem>
                {parentModules.map((module) => {
                  const IconComponent = getIcon(module.icon);
                  return (
                    <SelectItem key={module.id} value={module.id} className="text-base bg-white hover:bg-[#f5efe6] focus:bg-[#f5efe6]">
                      <div className="flex items-center gap-2">
                        <IconComponent size={20} className="text-[#c6a365]" />
                        <span className="text-neutral-900">{module.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {hasChildren && (
              <p className="mt-2 text-sm text-neutral-500 italic">
                Este módulo tiene hijos, elimine las relaciones para convertirlo en hijo de otro módulo.
              </p>
            )}
          </div>

          {/* Ruta */}
          <div>
            <label htmlFor="path" className="block font-medium text-neutral-900 mb-2">
              Ruta <span className="text-[#c62828]">*</span>
            </label>
            <input
              type="text" 
              id="path" 
              name="path"
              value={formData.path} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
              placeholder="/usuarios"
            />
            {errors.path && <p className="text-[#c62828] text-sm mt-1">{errors.path}</p>}
          </div>

          {/* Vista previa de la ruta completa */}
          {fullPath && (
            <div className="mt-3 p-3 bg-[#f5efe6] border border-[#e6d7a3] rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-[#c6a365] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-[#b59555] font-medium">Ruta completa del módulo:</p>
                  <code className="text-sm font-mono text-[#7a5a00] bg-[#f0e9d5] px-2 py-1 rounded-sm mt-1 inline-block" id="fullPath">
                    {fullPath}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label htmlFor="description" className="block font-medium text-neutral-900 mb-2">
              Descripción
            </label>
            <textarea
              id="description" 
              name="description" 
              rows={3}
              value={formData.description || ''} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
              placeholder="Gestión de usuarios del sistema"
            />
          </div>

          {/* Ícono */}
          <div>
            <label htmlFor="icon" className="block font-medium text-neutral-900 mb-2">
              Ícono
            </label>
            <input
              type="text" 
              id="icon" 
              name="icon"
              value={formData.icon || ''} 
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
              placeholder="Users"
            />
          </div>

          {/* Activo/Inactivo */}
          <div>
            <label className="block font-medium text-neutral-900 mb-3">Estado</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleActive}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c6a365] ${
                  formData.active ? 'bg-green-500' : 'bg-red-400'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${
                  formData.active ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                formData.active 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {formData.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#f5efe6]">
            <button
              type="button"
              onClick={() => window.location.href = "/dashboard/seguridad/modulos"}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-[#f5efe6] text-neutral-700 font-medium rounded-lg border border-[#CFC7B8] hover:border-[#c6a365] transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? buttonLoadingText : buttonText}
            </button>
          </div>
        </form>
      </div>
    );
}