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
        <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Código */}
            <div>
              <label htmlFor="code" className="block font-medium text-gray-700 mb-2">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text" id="code" name="code"
                value={formData.code} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:border-[#987E71]"
                placeholder="users"
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
            </div>

            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block font-medium text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text" id="name" name="name"
                value={formData.name} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:border-[#987E71]"
                placeholder="Usuarios"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Módulo Padre */}
            <div>
              <label className="block font-medium text-gray-700 mb-2">Módulo Padre</label>
              <Select
                  disabled={hasChildren}
                  value={formData.parent_module_id || 'null'}
                  onValueChange={handleSelectChange}
              >
                  <SelectTrigger className="w-full px-3 py-2 h-auto text-base border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:border-[#987E71]">
                      <SelectValue placeholder="Seleccione una opción" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="null" className="text-base">Sin módulo padre</SelectItem>
                      {parentModules.map((module) => {
                        const IconComponent = getIcon(module.icon);
                        return (
                          <SelectItem key={module.id} value={module.id} className="text-base">
                            <div className="flex items-center gap-2">
                              <IconComponent size={20} className="text-[#987E71]" />
                              <span>{module.name}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
              </Select>
              {hasChildren && <span className="md:ml-4 text-gray-500 font-light italic">Este módulo tiene hijos, elimine las relaciones para convertir este módulo en hijo de otro.</span>}
            </div>

            {/* Ruta */}
            <div>
              <label htmlFor="path" className="block font-medium text-gray-700 mb-2">
                Ruta <span className="text-red-500">*</span>
              </label>
              <input
                type="text" id="path" name="path"
                value={formData.path} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:border-[#987E71]"
                placeholder="/usuarios"
              />
                {errors.path && <p className="text-red-500 text-sm mt-1">{errors.path}</p>}
            </div>

            {/* Vista previa de la ruta completa */}
            {fullPath && (
              <div className="mt-3 p-3 bg-[#f5f0ed] border border-[#e8dfd9] rounded-lg">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-[#987E71] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-[#7a665c] font-medium">Ruta completa del módulo:</p>
                    <code className="text-sm font-mono text-[#987E71] bg-[#f0e9e6] px-2 py-1 rounded-sm mt-1 inline-block" id="fullPath">
                      {fullPath}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description" name="description" rows={3}
                value={formData.description || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:border-[#987E71]"
                placeholder="Gestión de usuarios del sistema"
              />
            </div>

            {/* Ícono */}
            <div>
              <label htmlFor="icon" className="block font-medium text-gray-700 mb-2">
                Ícono
              </label>
              <input
                type="text" id="icon" name="icon"
                value={formData.icon || ''} onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:border-[#987E71]"
                placeholder="Users"
              />
            </div>

            {/* Activo/Inactivo */}
            <div>
              <label className="block font-medium text-gray-700 mb-3">Estado</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleActive}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-[#987E71] focus:ring-offset-2 ${formData.active ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${formData.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {formData.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-4">
              <a
                href="/dashboard/seguridad/modulos"
                className="inline-flex items-center px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancelar
              </a>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2 bg-[#987E71] hover:bg-[#b19587] disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-300"
              >
                {loading ? buttonLoadingText : buttonText}
              </button>
            </div>
          </form>
        </div>
    );
}