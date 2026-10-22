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
    <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Módulo */}
        <div>
          <label className="block font-medium text-custom-text-secondary mb-2">
            Módulo <span className="text-red-400">*</span>
          </label>
          <Select
            value={formData.module_id || ''}
            onValueChange={handleModuleChange}
          >
            <SelectTrigger className="w-full px-3 py-2 h-auto text-base border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary transition-all duration-200">
              {formData.module_id ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const selected = findModule(formData.module_id);
                    if (!selected) return <SelectValue placeholder="Seleccione un módulo" />;
                    const Icon = getIcon(selected.icon);
                    return (
                      <>
                        <Icon size={20} className="text-custom-accent-primary" />
                        <span>{selected.name}</span>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <SelectValue placeholder="Seleccione un módulo" />
              )}
            </SelectTrigger>
            <SelectContent className="bg-custom-bg-secondary border border-custom-border-primary text-custom-text-primary">
              {modules.map((parent) => {
                const ParentIcon = getIcon(parent.icon);
                return (
                  <div key={parent.id}>
                    {/* Módulo Padre */}
                    <SelectItem value={parent.id} className="text-base hover:bg-custom-accent-hover focus:bg-custom-accent-hover">
                      <div className="flex items-center gap-2">
                        <ParentIcon size={20} className="text-custom-accent-primary" />
                        <span>{parent.name}</span>
                      </div>
                    </SelectItem>
                  
                    {/* Módulos Hijos */}
                    {parent.children && parent.children.map((child) => {
                      const ChildIcon = getIcon(child.icon);
                      return (
                        <SelectItem key={child.id} value={child.id} className="text-base hover:bg-custom-accent-hover focus:bg-custom-accent-hover">
                          <div className="flex items-center gap-2 pl-6">
                            <ChildIcon size={18} className="text-custom-accent-primary" />
                            <span>{child.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </div>
                );
              })}
            </SelectContent>
          </Select>
          {errors.module_id && <p className="text-red-400 text-sm mt-1">{errors.module_id}</p>}
        </div>

        {/* Prefijo del Código */}
        <div>
          <label htmlFor="code_prefix" className="block font-medium text-custom-text-secondary mb-2">
            Código <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="code_prefix"
            name="code_prefix"
            value={formData.code_prefix || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            placeholder="create, update, delete, read, menu"
            disabled={!formData.module_id}
          />
          {errors.code_prefix && <p className="text-red-400 text-sm mt-1">{errors.code_prefix}</p>}
          
          {/* Vista previa del código completo */}
          {fullCode && (
            <div className="mt-3 p-3 bg-custom-accent-hover border border-custom-accent-border rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-custom-accent-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-custom-accent-primary font-medium">Código completo del permiso:</p>
                  <code className="text-sm font-mono text-custom-accent-secondary bg-custom-accent-primary/20 px-2 py-1 rounded-sm mt-1 inline-block">
                    {fullCode}
                  </code>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-xs text-custom-text-tertiary mt-2">
            Ejemplos: <span className="font-mono bg-custom-bg-tertiary px-1 rounded text-custom-text-secondary">create</span>, 
            <span className="font-mono bg-custom-bg-tertiary px-1 rounded-sm ml-1 text-custom-text-secondary">update</span>, 
            <span className="font-mono bg-custom-bg-tertiary px-1 rounded-sm ml-1 text-custom-text-secondary">delete</span>, 
            <span className="font-mono bg-custom-bg-tertiary px-1 rounded-sm ml-1 text-custom-text-secondary">read</span>, 
            <span className="font-mono bg-custom-bg-tertiary px-1 rounded-sm ml-1 text-custom-text-secondary">menu</span>
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block font-medium text-custom-text-secondary mb-2">
            Nombre <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary transition-all duration-200"
            placeholder="Crear usuario"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block font-medium text-custom-text-secondary mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-custom-border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-custom-accent-primary bg-custom-bg-tertiary text-custom-text-primary placeholder-custom-text-tertiary transition-all duration-200"
            placeholder="Permite crear nuevos usuarios en el sistema"
          />
          {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Activo/Inactivo */}
        <div>
          <label className="block font-medium text-custom-text-secondary mb-3">Estado</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none ${
                formData.active ? 'bg-green-500' : 'bg-custom-text-tertiary'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-200 ${
                formData.active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              formData.active ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'
            }`}>
              {formData.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <a 
            href="/dashboard/seguridad/permisos" 
            className="inline-flex items-center justify-center px-6 py-2 bg-custom-bg-tertiary hover:bg-custom-bg-hover text-custom-text-primary font-medium rounded-lg border border-custom-border-primary transition-all duration-200"
          >
            Cancelar
          </a>
          <button
            type="submit"
            disabled={loading || !formData.module_id}
            className="inline-flex items-center justify-center px-6 py-2 bg-custom-accent-primary hover:bg-custom-accent-secondary disabled:bg-custom-bg-tertiary text-custom-bg-primary font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? buttonLoadingText : buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}