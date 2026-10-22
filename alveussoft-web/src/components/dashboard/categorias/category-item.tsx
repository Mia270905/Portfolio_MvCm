import { useState } from "react";
import { ProductCategory } from "./category-list";
import { ImageIcon, MoreVertical } from "lucide-react";
import Image from "next/image";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { DeleteCategoryDialog } from "./delete-category-dialog";

interface CategoryItemProps {
  category: ProductCategory;
  isChild?: boolean;
  onEdit: (category: ProductCategory) => void;
  onDelete: (categoryId: string) => void;
  userPermissions?: string[];
}

export default function CategoryItem({
  category,
  onEdit,
  onDelete,
  isChild = false,
  userPermissions = [],
}: CategoryItemProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const canUpdate = userPermissions.includes("update:categories");
  const canDelete = userPermissions.includes("delete:categories");

  const handleEdit = () => {
    router.push(`/dashboard/productos/categorias/editar/${category.id}`);
    setPopoverOpen(false);
  };

return (
    <div className={isChild ? "ml-4 sm:ml-6 mb-3" : "mb-3"}>
      <div className="flex items-start justify-between p-4 rounded-lg bg-[#0A0F17] border border-gray-800 shadow-xs hover:shadow-lg hover:shadow-yellow-400/5 hover:border-yellow-400/30 transition-all cursor-pointer gap-4">
        {/* Contenido principal */}
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="relative w-16 h-16 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
            {category.image_url ? (
              <Image
                src={typeof category.image_url === "string" ? category.image_url : ""}
                alt={category.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-500" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1 mr-2">
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <h3 className="text-base font-semibold text-white line-clamp-2 leading-tight flex-1 min-w-0">
                {category.title}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium w-fit flex-shrink-0 mt-0.5 border ${
                  category.active
                    ? "bg-green-900/40 text-green-300 border-green-800"
                    : "bg-gray-800 text-gray-300 border-gray-700"
                }`}
              >
                {category.active ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
              {category.description}
            </p>
            <div className="text-xs text-gray-500 hidden sm:block">
              Actualizado:{" "}
              {new Date(category.updated_at).toLocaleDateString("es-ES", {
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
                <button className="p-2 hover:bg-yellow-400/10 rounded-lg transition-colors border border-gray-700">
                  <MoreVertical size={18} className="text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 p-3 bg-[#0A0F17] border border-gray-700 rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  {canUpdate && (
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-400 rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md transition-colors"
                      onClick={handleDeleteClick}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DeleteCategoryDialog
              categoryId={category.id}
              categoryTitle={category.title}
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