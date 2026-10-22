export function ModuleItemSkeleton({ isChild = false }: { isChild?: boolean }) {
  return (
    <div className={isChild ? '' : 'mb-2'}>
      <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          {!isChild && <div className="w-[18px] h-[18px] bg-gray-200 rounded-sm animate-pulse" />}
          
          <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
          
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded-sm w-32 animate-pulse" />
            <div className="h-3 bg-gray-200 rounded-sm w-24 animate-pulse" />
          </div>
        </div>

        <div className="w-[18px] h-[18px] bg-gray-200 rounded-sm animate-pulse" />
      </div>
    </div>
  )
}

export function ModuleListSkeleton() {
  return (
    <div className="space-y-1">
      <ModuleItemSkeleton />
      <ModuleItemSkeleton />
      <ModuleItemSkeleton />
      
      <div className="mt-2 space-y-2">
        <ModuleItemSkeleton isChild />
        <ModuleItemSkeleton isChild />
      </div>
      
      <ModuleItemSkeleton />
    </div>
  )
}