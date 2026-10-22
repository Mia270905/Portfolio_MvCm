"use client";

import { ChevronDown, ChevronRight, MoreVertical } from "lucide-react";
import { type Module } from "@/lib/definitions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { getIcon } from "@/lib/utils/icons";
import { useState } from "react";
import { DeleteModuleDialog } from "./delete-module-dialog";

interface ModuleItemProps {
  module: Module & { children?: Module[] };
  isChild?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  userPermissions: string[];
}

export function ModuleItem({
  module,
  isChild = false,
  isExpanded = false,
  onToggle,
  userPermissions,
}: ModuleItemProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const hasChildren = module.children && module.children.length > 0;

  const canUpdate = userPermissions.includes("update:modules");
  const canDelete = userPermissions.includes("delete:modules");

  const IconComponent = getIcon(module.icon);

  return (
    <div className={isChild ? "" : "mb-2"}>
      <div
        className={`
          flex items-center justify-between p-3 rounded-lg
          bg-white border border-gray-200
          hover:bg-[#f5f0ed] hover:border-[#e8dfd9]
          shadow-xs hover:shadow-md
          ${isChild ? "ml-8" : ""}
          transition-all duration-200 cursor-pointer
        `}
      >
        <div
          className="flex items-center gap-3 flex-1"
          onClick={() => hasChildren && onToggle?.()}
        >
          {hasChildren && (
            <button className="text-gray-400 hover:text-[#987E71]">
              {isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          )}

          {!hasChildren && !isChild && <div className="w-[18px]" />}

          <div className="p-2 rounded-lg bg-[#f5f0ed]">
            <IconComponent size={32} className="text-[#987E71]" />
          </div>

          <div className="flex-1">
            <div className="font-medium text-[#987E71]">{module.name}</div>
            <div className="text-sm text-[#987E71]">{module.path}</div>
          </div>
        </div>

        {(canUpdate || canDelete) && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-[#f5f0ed] hover:text-[#987E71] rounded">
                <MoreVertical size={18} className="text-gray-400 hover:text-[#987E71]" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" align="end">
              {canUpdate && (
                <Link href={`/dashboard/seguridad/modulos/editar/${module.id}`}>
                  <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-[#f5f0ed] hover:text-[#987E71] rounded-md transition-colors">
                    Editar
                  </button>
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  Eliminar
                </button>
              )}
            </PopoverContent>
          </Popover>
        )}

        <DeleteModuleDialog
          moduleId={module.id}
          moduleCode={module.code}
          moduleName={module.name}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        />
      </div>
    </div>
  );
}