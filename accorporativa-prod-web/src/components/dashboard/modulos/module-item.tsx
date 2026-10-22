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
          flex items-center justify-between p-4 rounded-lg
          bg-custom-bg-secondary border border-custom-border-secondary
          hover:bg-custom-bg-hover hover:border-custom-accent-border
          shadow-xs hover:shadow-lg hover:shadow-custom-accent-border
          ${isChild ? "ml-6" : ""}
          transition-all duration-200 cursor-pointer group
        `}
      >
        <div
          className="flex items-center gap-3 flex-1"
          onClick={() => hasChildren && onToggle?.()}
        >
          {hasChildren && (
            <button className="text-custom-text-tertiary hover:text-custom-accent-primary transition-all duration-200">
              {isExpanded ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
            </button>
          )}

          {!hasChildren && !isChild && <div className="w-[18px]" />}

          <div className="p-2 rounded-lg bg-custom-bg-tertiary group-hover:bg-custom-accent-hover transition-all duration-200">
            <IconComponent size={32} className="text-custom-accent-primary group-hover:text-custom-accent-secondary transition-colors" />
          </div>

          <div className="flex-1">
            <div className="font-medium text-custom-text-primary group-hover:text-custom-accent-primary transition-colors">{module.name}</div>
            <div className="text-sm text-custom-text-tertiary group-hover:text-custom-text-secondary transition-colors">{module.path}</div>
          </div>
        </div>

        {(canUpdate || canDelete) && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 hover:bg-muted rounded transition-all duration-200 group/menu">
                <MoreVertical 
                  size={18} 
                  className="text-muted-foreground group-hover/menu:text-primary transition-colors" 
                />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-40 p-2 bg-card border border-border shadow-lg" 
              align="end"
            >
              {canUpdate && (
                <Link href={`/dashboard/seguridad/modulos/editar/${module.id}`}>
                  <button className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-primary rounded-md transition-all duration-200">
                    Editar
                  </button>
                </Link>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeleteDialogOpen(true)}
                  className="w-full text-left px-3 py-2 text-sm text-error-text hover:bg-error-bg hover:text-error-text rounded-md transition-all duration-200"
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