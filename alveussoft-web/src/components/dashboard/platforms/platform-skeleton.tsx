export function PlatformSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6 bg-[#0A0F17] rounded-lg border border-gray-800 p-6 animate-pulse">
        {/* Información Básica */}
        <div className="space-y-4">
          <div className="h-6 bg-[#0A0F17] rounded w-1/4"></div>
          
          {/* Código */}
          <div className="space-y-2">
            <div className="h-4 bg-[#0A0F17] rounded w-1/6"></div>
            <div className="h-10 bg-[#0A0F17] rounded"></div>
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <div className="h-4 bg-[#0A0F17] rounded w-1/6"></div>
            <div className="h-10 bg-[#0A0F17] rounded"></div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <div className="h-4 bg-[#0A0F17] rounded w-1/6"></div>
            <div className="h-20 bg-[#0A0F17] rounded"></div>
          </div>

          {/* Dominio */}
          <div className="space-y-2">
            <div className="h-4 bg-[#0A0F17] rounded w-1/6"></div>
            <div className="h-10 bg-[#0A0F17] rounded"></div>
          </div>

          {/* Contacto relacionado */}
          <div className="space-y-2">
            <div className="h-4 bg-[#0A0F17] rounded w-1/4"></div>
            <div className="h-10 bg-[#0A0F17] rounded"></div>
          </div>
        </div>

        {/* Módulo */}
        <div className="space-y-4">
          <div className="h-6 bg-[#0A0F17] rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-[#0A0F17] rounded w-1/3"></div>
            <div className="h-10 bg-[#0A0F17] rounded"></div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <div className="h-10 bg-[#0A0F17] rounded w-24"></div>
          <div className="h-10 bg-[#0A0F17] rounded w-32"></div>
        </div>
      </div>
    </div>
  )
}