export function CompanySkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6 bg-custom-bg-primary rounded-lg border border-custom-border-primary p-6 animate-pulse">
        {/* Información Básica */}
        <div className="space-y-4">
          <div className="h-6 bg-custom-bg-tertiary rounded w-1/4"></div>
          
          {/* Nombre */}
          <div className="space-y-2">
            <div className="h-4 bg-custom-bg-tertiary rounded w-1/6"></div>
            <div className="h-10 bg-custom-bg-tertiary rounded"></div>
          </div>

          {/* RFC */}
          <div className="space-y-2">
            <div className="h-4 bg-custom-bg-tertiary rounded w-1/6"></div>
            <div className="h-10 bg-custom-bg-tertiary rounded"></div>
          </div>
        </div>

        {/* Dirección */}
        <div className="space-y-4">
          <div className="h-6 bg-custom-bg-tertiary rounded w-1/4"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calle */}
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
              <div className="h-10 bg-custom-bg-tertiary rounded"></div>
            </div>

            {/* Número exterior */}
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
              <div className="h-10 bg-custom-bg-tertiary rounded"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Colonia */}
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
              <div className="h-10 bg-custom-bg-tertiary rounded"></div>
            </div>

            {/* Código Postal */}
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
              <div className="h-10 bg-custom-bg-tertiary rounded"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad */}
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
              <div className="h-10 bg-custom-bg-tertiary rounded"></div>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
              <div className="h-10 bg-custom-bg-tertiary rounded"></div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="space-y-4">
          <div className="h-6 bg-custom-bg-tertiary rounded w-1/4"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Teléfono */}
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
              <div className="h-10 bg-custom-bg-tertiary rounded"></div>
            </div>

            {/* Celular */}
            <div className="space-y-2">
              <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
              <div className="h-10 bg-custom-bg-tertiary rounded"></div>
            </div>
          </div>

          {/* Website */}
          <div className="space-y-2">
            <div className="h-4 bg-custom-bg-tertiary rounded w-1/6"></div>
            <div className="h-10 bg-custom-bg-tertiary rounded"></div>
          </div>
        </div>

        {/* Empresa Padre */}
        <div className="space-y-4">
          <div className="h-6 bg-custom-bg-tertiary rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-custom-bg-tertiary rounded w-1/3"></div>
            <div className="h-10 bg-custom-bg-tertiary rounded"></div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-custom-border-primary">
          <div className="h-10 bg-custom-bg-tertiary rounded w-24"></div>
          <div className="h-10 bg-custom-bg-tertiary rounded w-32"></div>
        </div>
      </div>
    </div>
  )
}