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
    <div className="bg-card rounded-lg shadow-xs border border-border p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Módulo */}
        <div>
          <label className="block font-medium text-card-foreground mb-2">
            Módulo <span className="text-destructive">*</span>
          </label>
          <Select
            value={formData.module_id || ''}
            onValueChange={handleModuleChange}
          >
            <SelectTrigger className="w-full px-3 py-2 h-auto text-base border border-input rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground">
              {formData.module_id ? (
                <div className="flex items-center gap-2">
                  {(() => {
                    const selected = findModule(formData.module_id);
                    if (!selected) return <SelectValue placeholder="Seleccione un módulo" />;
                    const Icon = getIcon(selected.icon);
                    return (
                      <>
                        <Icon size={20} className="text-primary" />
                        <span>{selected.name}</span>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <SelectValue placeholder="Seleccione un módulo" />
              )}
            </SelectTrigger>
            <SelectContent className="bg-background border border-border text-foreground">
              {modules.map((parent) => {
                const ParentIcon = getIcon(parent.icon);
                return (
                  <div key={parent.id}>
                    {/* Módulo Padre */}
                    <SelectItem value={parent.id} className="text-base hover:bg-muted hover:text-accent-foreground">
                      <div className="flex items-center gap-2">
                        <ParentIcon size={20} className="text-primary" />
                        <span>{parent.name}</span>
                      </div>
                    </SelectItem>
                  
                    {/* Módulos Hijos */}
                    {parent.children && parent.children.map((child) => {
                      const ChildIcon = getIcon(child.icon);
                      return (
                        <SelectItem key={child.id} value={child.id} className="text-base hover:bg-muted hover:text-accent-foreground">
                          <div className="flex items-center gap-2 pl-6">
                            <ChildIcon size={18} className="text-primary" />
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
          {errors.module_id && <p className="text-destructive text-sm mt-1">{errors.module_id}</p>}
        </div>

        {/* Prefijo del Código */}
        <div>
          <label htmlFor="code_prefix" className="block font-medium text-card-foreground mb-2">
            Código <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="code_prefix"
            name="code_prefix"
            value={formData.code_prefix || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="create, update, delete, read, menu"
            disabled={!formData.module_id}
          />
          {errors.code_prefix && <p className="text-destructive text-sm mt-1">{errors.code_prefix}</p>}
          
          {/* Vista previa del código completo */}
          {fullCode && (
            <div className="mt-3 p-3 bg-muted border border-border rounded-lg">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground font-medium">Código completo del permiso:</p>
                  <code className="text-sm font-mono text-primary bg-muted px-2 py-1 rounded-sm mt-1 inline-block">
                    {fullCode}
                  </code>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mt-2">
            Ejemplos: <span className="font-mono bg-muted px-1 rounded text-foreground">create</span>, 
            <span className="font-mono bg-muted px-1 rounded-sm ml-1 text-foreground">update</span>, 
            <span className="font-mono bg-muted px-1 rounded-sm ml-1 text-foreground">delete</span>, 
            <span className="font-mono bg-muted px-1 rounded-sm ml-1 text-foreground">read</span>, 
            <span className="font-mono bg-muted px-1 rounded-sm ml-1 text-foreground">menu</span>
          </p>
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block font-medium text-card-foreground mb-2">
            Nombre <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder-muted-foreground"
            placeholder="Crear usuario"
          />
          {errors.name && <p className="text-destructive text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block font-medium text-card-foreground mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-input rounded-lg focus:outline-hidden focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground placeholder-muted-foreground"
            placeholder="Permite crear nuevos usuarios en el sistema"
          />
          {errors.description && <p className="text-destructive text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Activo/Inactivo */}
        <div>
          <label className="block font-medium text-card-foreground mb-3">Estado</label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                formData.active ? 'bg-green-500' : 'bg-muted'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                formData.active ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
              formData.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {formData.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <a 
            href="/dashboard/seguridad/permisos" 
            className="inline-flex items-center px-6 py-2 bg-muted hover:bg-muted/80 text-muted-foreground font-medium rounded-lg transition-colors"
          >
            Cancelar
          </a>
          <button
            type="submit"
            disabled={loading || !formData.module_id}
            className="inline-flex items-center px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-medium rounded-lg transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? buttonLoadingText : buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}