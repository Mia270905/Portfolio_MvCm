"use client";

import { useState } from "react";
import { ContactGroup } from "./contact-group-list";
import { ImageIcon, MoreVertical } from "lucide-react";
import Image from "next/image";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { DeleteContactGroupDialog } from "./delete-contact-group-dialog";

interface ContactGroupItemProps {
  contactGroup: ContactGroup;
  isChild?: boolean;
  onEdit: (contactGroup: ContactGroup) => void;
  onDelete: (contactGroupId: string) => void;
  userPermissions?: string[];
}

export default function ContactGroupItem({
  contactGroup,
  onEdit,
  onDelete,
  isChild = false,
  userPermissions = [],
}: ContactGroupItemProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const canUpdate = userPermissions.includes("update:contact-group");
  const canDelete = userPermissions.includes("delete:contact-group");

  const handleEdit = () => {
    router.push(`/dashboard/contacts-parent/grupo-contactos/Editar/${contactGroup.id}`);
    setPopoverOpen(false);
  };

  return (
    <div className={isChild ? "ml-4 sm:ml-6 mb-3" : "mb-3"}>
      <div className="flex items-start justify-between p-4 rounded-lg bg-white border border-[#f5efe6] shadow-sm hover:shadow-lg hover:shadow-[#c6a365]/10 hover:border-[#c6a365]/40 transition-all cursor-pointer gap-4">
        {/* Contenido principal */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="relative w-16 h-16 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-[#faf8f3] flex-shrink-0 border border-[#e6dcc9]">
            {contactGroup.image_url ? (
              <Image
                src={typeof contactGroup.image_url === "string" ? contactGroup.image_url : ""}
                alt={contactGroup.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-[#c6a365]" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1 mr-2">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <h3 className="text-base font-medium text-neutral-900 line-clamp-2 leading-tight flex-1 min-w-0">
                {contactGroup.title}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium w-fit flex-shrink-0 mt-0.5 border ${
                  contactGroup.active
                    ? "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]"
                    : "bg-[#f5efe6] text-neutral-600 border-[#e6dcc9]"
                }`}
              >
                {contactGroup.active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
              {contactGroup.description}
            </p>
            <div className="text-xs text-neutral-500 hidden sm:block">
              Actualizado:{" "}
              {new Date(contactGroup.updated_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Acciones */}
        {(canUpdate || canDelete) && (
          <div className="flex items-start flex-shrink-0 pt-1">
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="p-2 hover:bg-[#f5efe6] rounded-lg transition-colors border border-[#e6dcc9]">
                  <MoreVertical size={18} className="text-neutral-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-40 p-2 bg-white border border-[#e6dcc9] rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  {canUpdate && (
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#c6a365] hover:bg-[#f5efe6] hover:text-[#b59555] rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#c62828] hover:bg-[#fdeaea] hover:text-[#b71c1c] rounded-md transition-colors"
                      onClick={handleDeleteClick}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DeleteContactGroupDialog
              contactGroupId={contactGroup.id}
              contactGroupTitle={contactGroup.title}
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>
    </div>
  );
}