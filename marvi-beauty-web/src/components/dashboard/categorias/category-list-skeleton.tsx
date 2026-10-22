export function CategoryListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200 shadow-xs animate-pulse"
        >
          {/* Imagen de categoría */}
          <div className="w-20 h-20 bg-gray-700 rounded-lg flex-shrink-0" />

          {/* Información de categoría */}
          <div className="flex-1 ml-4 space-y-2">
            <div className="h-5 bg-gray-700 rounded-sm w-1/3" /> {/* Título */}
            <div className="h-4 bg-gray-700 rounded-sm w-2/3" /> {/* Descripción */}
            <div className="h-3 bg-gray-700 rounded-sm w-1/4 mt-1" /> {/* Fecha */}
          </div>

          {/* Acciones */}
          <div className="w-10 h-10 bg-gray-700 rounded-full" />
        </div>
      ))}
    </div>
  );
}
