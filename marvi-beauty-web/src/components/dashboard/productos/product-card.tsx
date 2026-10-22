"use client";

import { useState } from "react";
import type { Product } from "@/lib/actions/product.actions";
import { ImageIcon, Star, MoreVertical } from "lucide-react";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  userPermissions?: string[];
}

export default function ProductCard({
  product,
  onEdit,
  onDelete,
  userPermissions = [],
}: ProductCardProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const canUpdate = userPermissions.includes("update:product_details");
  const canDelete = userPermissions.includes("delete:product_details");

  const handleCardClick = () => {
    // Opcional: acción al hacer clic en toda la tarjeta
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    router.push(`/dashboard/productos/producto/editar/${product.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    if (onDelete) onDelete(product);
  };

  const handlePopoverTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer overflow-hidden relative"
      onClick={handleCardClick}
    >
      <div className="p-4 flex gap-3">
        {/* Product Image */}
        <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1">
            {product.name}
          </h3>

          {product.name_unaccent && (
            <p className="text-xs text-gray-500 mb-1">
              ({product.name_unaccent})
            </p>
          )}

          {product.bar_code && (
            <p className="text-xs text-gray-600 font-mono mb-1">
              {product.bar_code}
            </p>
          )}

          {product.code && (
            <p className="text-xs text-gray-600 font-mono mb-1">
              [{product.code}]
            </p>
          )}

          {product.price_lists && product.price_lists.length > 0 && (
            <p className="text-sm font-semibold text-gray-900">
              Precio de Lista: $
              {product.price_lists[0].price}
            </p>
          )}

          {product.cost_price !== null && product.cost_price !== undefined && (
            <p className="text-sm font-semibold text-gray-800">
              Precio: $ {Number(product.cost_price).toFixed(2)}
            </p>
          )}

          {product.category_name && (
            <p className="text-xs text-gray-500 mt-1">
              {product.category_name}
            </p>
          )}

          <div className="mt-2">
            {product.is_available ? (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                Activo
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                Inactivo
              </span>
            )}
          </div>
        </div>

        {/* Actions + Favorite */}
        <div className="flex flex-col items-end gap-2">
          {/* Favorite Star */}
          <button
            onClick={handleFavoriteClick}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Star
              className={`w-5 h-5 ${
                isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
            />
          </button>

          {/* Actions Popover */}
          {(canUpdate || canDelete) && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                  onClick={handlePopoverTriggerClick}
                >
                  <MoreVertical size={18} className="text-gray-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-40 p-3 bg-white border border-gray-200 rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  {canUpdate && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      onClick={handleDeleteClick}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
}
