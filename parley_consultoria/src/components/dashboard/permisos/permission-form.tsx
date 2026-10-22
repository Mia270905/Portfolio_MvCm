import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModuleWithChildren, NewPermissionPayload } from "@/lib/definitions";
import { getIcon } from '@/lib/utils/icons';
import { Info } from 'lucide-react';

interface PermissionFormProps {
  handleSubmit: (e: React.FormEvent) => void
  formData: NewPermissionPayload,
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  errors: Record<string, string>
  handleModuleChange: (value: string) => void
  modules: ModuleWithChildren[]
  handleToggleActive: () => void
  buttonText: string
  buttonLoadingText: string
  loading: boolean
}

export default function PermissionForm({
  handleSubmit,
  formData,
  handleChange,
  errors,
  handleModuleChange,
  modules,
  handleToggleActive,
  buttonText = 'Guardar',
  buttonLoadingText = 'Guardando...',
  loading
}: PermissionFormProps) {

  const findModule = (id: string) => {
    const parent = modules.find(m => m.id === id);
    if (parent) return parent;
    
    for (const module of modules) {
      const child = module.children?.find(c => c.id === id);
      if (child) return child;
    }
    
    return null;
  };

  const selectedModule = findModule(formData.module_id);
  const fullCode = formData.code_prefix && selectedModule
    ? `${formData.code_prefix}:${selectedModule.code}`
    : '';

   return (
    <div className="bg-white rounded-lg border border-[#f5efe6] p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Módulo */}
        <div>
          <label className="block font-medium text-neutral-900 mb-2">
            Módulo <span className="text-[#c62828]">*</span>
          </label>
          <Select
            value={formData.module_id || ''}
            onValueChange={handleModuleChange}
          >
            <SelectTrigger className="w-full px-3 py-2 h-auto text-base border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 transition-all duration-200">
              {formData.module_id ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const selected = findModule(formData.module_id);
                    if (!selected) return <SelectValue placeholder="Seleccione un módulo" />;
                    const Icon = getIcon(selected.icon);
                    return (
                      <>
                        <Icon size={20} className="text-[#c6a365]" />
                        <span>{selected.name}</span>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <SelectValue placeholder="Seleccione un módulo" />
              )}
            </SelectTrigger>
            <SelectContent className="bg-white border border-[#CFC7B8] text-neutral-900 shadow-sm">
              {modules.map((parent) => {
                const ParentIcon = getIcon(parent.icon);
                return (
                  <div key={parent.id}>
                    {/* Módulo Padre */}
                    <SelectItem value={parent.id} className="text-base bg-white hover:bg-[#f5efe6] focus:bg-[#f5efe6]">
                      <div className="flex items-center gap-2">
                        <ParentIcon size={20} className="text-[#c6a365]" />
                        <span className="text-neutral-900">{parent.name}</span>
                      </div>
                    </SelectItem>
                  
                    {/* Módulos Hijos */}
                    {parent.children && parent.children.map((child) => {
                      const ChildIcon = getIcon(child.icon);
                      return (
                        <SelectItem key={child.id} value={child.id} className="text-base bg-white hover:bg-[#f5efe6] focus:bg-[#f5efe6]">
                          <div className="flex items-center gap-2 pl-6">
                            <ChildIcon size={18} className="text-[#c6a365]" />
                            <span className="text-neutral-900">{child.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </div>
                );
              })}
            </SelectContent>
          </Select>
          {errors.module_id && <p className="text-[#c62828] text-sm mt-1">{errors.module_id}</p>}
        </div>

        {/* Prefijo del Código */}
        <div>
          <label htmlFor="code_prefix" className="block font-medium text-neutral-900 mb-2">
            Código <span className="text-[#c62828]">*</span>
          </label>
          <input
            type="text"
            id="code_prefix"
            name="code_prefix"
            value={formData.code_prefix || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            placeholder="create, update, delete, read, menu"
            disabled={!formData.module_id}
          />
          {errors.code_prefix && <p className="text-[#c62828] text-sm mt-1">{errors.code_prefix}</p>}
          
          {/* Vista previa del código completo */}
          {fullCode && (
            <div className="mt-3 p-3 bg-[#f5efe6] border border-[#e6d7a3] rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-[#c6a365] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-[#b59555] font-medium">Código completo del permiso:</p>
                  <code className="text-sm font-mono text-[#7a5a00] bg-[#f0e9d5] px-2 py-1 rounded-sm mt-1 inline-block">
                    {fullCode}
                  </code>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-xs text-neutral-600 mt-2">
            Ejemplos: <span className="font-mono bg-[#f5efe6] px-1 rounded text-neutral-900">create</span>, 
            <span className="font-mono bg-[#f5efe6] px-1 rounded-sm ml-1 text-neutral-900">update</span>, 
            <span className="font-mono bg-[#f5efe6] px-1 rounded-sm ml-1 text-neutral-900">delete</span>, 
            <span className="font-mono bg-[#f5efe6] px-1 rounded-sm ml-1 text-neutral-900">read</span>, 
            <span className="font-mono bg-[#f5efe6] px-1 rounded-sm ml-1 text-neutral-900">menu</span>
          </p>
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
            placeholder="Crear usuario"
          />
          {errors.name && <p className="text-[#c62828] text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block font-medium text-neutral-900 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-[#CFC7B8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-20 bg-white text-neutral-900 placeholder-neutral-500 transition-all duration-200"
            placeholder="Permite crear nuevos usuarios en el sistema"
          />
          {errors.description && <p className="text-[#c62828] text-sm mt-1">{errors.description}</p>}
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
              formData.active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
            }`}>
              {formData.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#f5efe6]">
          <button
            type="button"
            onClick={() => window.location.href = "/dashboard/seguridad/permisos"}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-white hover:bg-[#f5efe6] text-neutral-700 font-medium rounded-lg border border-[#CFC7B8] hover:border-[#c6a365] transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !formData.module_id}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-[#a78447] to-[#c6a365] hover:from-[#b59555] hover:to-[#d4b24c] text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? buttonLoadingText : buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}