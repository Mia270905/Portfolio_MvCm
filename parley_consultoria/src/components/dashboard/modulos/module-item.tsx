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
  className?: string; // opcional para personalizar desde ModuleList
}

export function ModuleItem({
  module,
  isChild = false,
  isExpanded = false,
  onToggle,
  userPermissions,
  className = "",
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
          flex items-center justify-between p-4 rounded-lg
          bg-white border border-[#f5efe6]
          hover:bg-[#faf8f3] hover:border-[#e6d7a3]
          shadow-sm hover:shadow-md hover:shadow-[#e6d7a3]/30
          ${isChild ? "ml-6" : ""}
          transition-all duration-200 cursor-pointer group
          ${className}
        `}
      >
        <div
          className="flex items-center gap-3 flex-1"
          onClick={() => hasChildren && onToggle?.()}
        >
          {hasChildren && (
            <button className="text-[#c6a365] hover:text-[#b59555] transition-all duration-200">
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
          )}

          {!hasChildren && !isChild && <div className="w-[18px]" />}

          <div className="p-2 rounded-lg bg-[#f5efe6] group-hover:bg-[#e6d7a3] transition-all duration-200">
            <IconComponent className="w-8 h-8 text-[#c6a365] group-hover:text-[#b59555] transition-colors" />
          </div>

          <div className="flex-1">
            <div className="font-medium text-neutral-900 group-hover:text-[#b59555] transition-colors">
              {module.name}
            </div>
            <div className="text-sm text-neutral-600 group-hover:text-neutral-700 transition-colors">
              {module.path}
            </div>
          </div>
        </div>

        {(canUpdate || canDelete) && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-[#f5efe6] rounded transition-all duration-200">
                <MoreVertical className="w-5 h-5 text-neutral-700 hover:text-[#c6a365] transition-colors" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-40 p-2 bg-white border border-[#f5efe6] shadow-sm"
              align="end"
            >
              {canUpdate && (
                <Link href={`/dashboard/seguridad/modulos/editar/${module.id}`}>
                  <button className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-[#f5efe6] hover:text-[#c6a365] rounded-md transition-all duration-200">
                    Editar
                  </button>
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full text-left px-3 py-2 text-sm text-[#c62828] hover:bg-[#fdeaea] hover:text-[#b71c1c] rounded-md transition-all duration-200"
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