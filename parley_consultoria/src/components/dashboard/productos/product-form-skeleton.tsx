
export function ProductFormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-8 bg-gray-800 rounded-sm w-1/3 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-800 rounded-sm w-1/2 animate-pulse"></div>
      </div>

      <div className="bg-[#0A0F17] shadow-xs rounded-lg p-6 border border-gray-800">
        {/* Nombre skeleton */}
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-800 rounded-sm w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
        </div>

        {/* Código y Código de barras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded-sm w-1/3 animate-pulse"></div>
            <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded-sm w-1/3 animate-pulse"></div>
            <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-800 rounded-sm w-1/4 animate-pulse"></div>
          <div className="h-24 bg-gray-800 rounded animate-pulse"></div>
        </div>

        {/* Categoría y Precio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded-sm w-1/3 animate-pulse"></div>
            <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-800 rounded-sm w-1/3 animate-pulse"></div>
            <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Imagen URL */}
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-800 rounded-sm w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-800 rounded animate-pulse"></div>
        </div>

        {/* Disponibilidad */}
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-gray-800 rounded-sm w-1/4 animate-pulse"></div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-11 bg-gray-800 rounded-full animate-pulse"></div>
            <div className="h-6 w-24 bg-gray-800 rounded-sm animate-pulse"></div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
          <div className="h-10 w-24 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}