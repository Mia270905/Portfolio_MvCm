export default function DashboardLoading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 dark:bg-zinc-900/50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-lg" />
        <p className="text-sm font-medium text-amber-600 dark:text-amber-500 animate-pulse">
          Cargando entorno de trabajo...
        </p>
      </div>
    </div>
  );
}
