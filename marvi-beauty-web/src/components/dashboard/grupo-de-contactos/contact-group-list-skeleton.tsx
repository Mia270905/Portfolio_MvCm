export function ContactGroupListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between p-4 rounded-lg bg-card border border-input shadow-sm animate-pulse"
        >
          {/* Imagen de grupo */}
          <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0" />

          {/* Información de grupo */}
          <div className="flex-1 ml-4 space-y-2">
            <div className="h-5 bg-muted rounded-sm w-1/3" />
            <div className="h-4 bg-muted rounded-sm w-2/3" />
            <div className="h-3 bg-muted rounded-sm w-1/4 mt-1" />
          </div>

          {/* Acciones */}
          <div className="w-10 h-10 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}