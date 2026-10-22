export function ModuleFormSkeleton() {
  return (
    <div>
        {/* Form container */}
        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6 space-y-6">
          {/* Código */}
          <div>
            <div className="w-24 h-4 bg-custom-bg-tertiary rounded-sm mb-2 animate-pulse" />
            <div className="w-full h-10 bg-custom-bg-tertiary rounded-sm animate-pulse" />
          </div>

          {/* Nombre */}
          <div>
            <div className="w-24 h-4 bg-custom-bg-tertiary rounded-sm mb-2 animate-pulse" />
            <div className="w-full h-10 bg-custom-bg-tertiary rounded-sm animate-pulse" />
          </div>

          {/* Ruta */}
          <div>
            <div className="w-16 h-4 bg-custom-bg-tertiary rounded-sm mb-2 animate-pulse" />
            <div className="w-full h-10 bg-custom-bg-tertiary rounded-sm animate-pulse" />
          </div>

          {/* Descripción */}
          <div>
            <div className="w-32 h-4 bg-custom-bg-tertiary rounded-sm mb-2 animate-pulse" />
            <div className="w-full h-24 bg-custom-bg-tertiary rounded-sm animate-pulse" />
          </div>

          {/* Ícono */}
          <div>
            <div className="w-16 h-4 bg-custom-bg-tertiary rounded-sm mb-2 animate-pulse" />
            <div className="w-full h-10 bg-custom-bg-tertiary rounded-sm animate-pulse" />
          </div>

          {/* Módulo Padre */}
          <div>
            <div className="w-32 h-4 bg-custom-bg-tertiary rounded-sm mb-2 animate-pulse" />
            <div className="w-full h-10 bg-custom-bg-tertiary rounded-sm animate-pulse" />
          </div>

          {/* Estado */}
          <div>
            <div className="w-20 h-4 bg-custom-bg-tertiary rounded-sm mb-2 animate-pulse" />
            <div className="w-24 h-6 bg-custom-bg-tertiary rounded-full animate-pulse" />
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
            <div className="w-full sm:w-28 h-10 bg-custom-bg-tertiary rounded-sm animate-pulse" />
            <div className="w-full sm:w-32 h-10 bg-custom-bg-tertiary rounded-sm animate-pulse" />
          </div>
        </div>
    </div>
  )
}