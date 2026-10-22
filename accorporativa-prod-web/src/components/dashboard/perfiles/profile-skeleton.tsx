export function ProfileFormSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
      <form className="space-y-6">
        {/* Código */}
        <div>
          <div className="h-4 bg-gray-300 rounded-sm w-24 mb-2" />
          <div className="h-9 bg-gray-300 rounded-lg w-full" />
        </div>

        {/* Nombre */}
        <div>
          <div className="h-4 bg-gray-300 rounded-sm w-20 mb-2" />
          <div className="h-9 bg-gray-300 rounded-lg w-full" />
        </div>

        {/* Estado */}
        <div>
          <div className="h-4 bg-gray-300 rounded-sm w-16 mb-3" />
          <div className="flex items-center gap-3">
            <div className="w-11 h-6 bg-gray-300 rounded-full" />
            <div className="w-16 h-5 bg-gray-300 rounded-full" />
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 pt-4">
          <div className="h-9 w-28 bg-gray-300 rounded-lg" />
          <div className="h-9 w-28 bg-gray-300 rounded-lg" />
        </div>
      </form>
    </div>
  )
}