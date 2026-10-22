"use client";

import { useState } from "react";
import type { Platform } from "@/lib/actions/platform.actions";
import {
  Globe,
  MoreVertical,
  Code,
  User,
  Calendar,
  Edit,
  Trash2,
  Mail,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PlatformCardProps {
  platform: Platform;
  onEdit?: (platform: Platform) => void;
  onDelete?: (platform: Platform) => void;
  userPermissions?: string[];
}

export default function PlatformCard({
  platform,
  onEdit,
  onDelete,
  userPermissions = [],
}: PlatformCardProps) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);

  const canUpdate = userPermissions.includes("update:platforms");
  const canDelete = userPermissions.includes("delete:platforms");

  const handleCardClick = () => {
    // Podrías redirigir a una vista detallada de la plataforma si lo deseas
    // router.push(`/platforms/${platform.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    router.push(`/dashboard/platforms-parent/platforms/edit/${platform.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    if (onDelete) onDelete(platform);
  };

  const handlePopoverTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Función para formatear dominio (quitar https://)
  const formatDomain = (domain: string) => {
    if (!domain) return "";
    return domain.replace(/^https?:\/\//, "");
  };

  return (
    <div
      className="bg-[#0A0F17] border border-gray-800 rounded-lg hover:shadow-lg hover:shadow-yellow-400/5 hover:border-yellow-400/30 transition-all cursor-pointer overflow-hidden relative"
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white line-clamp-2 mb-3">
              {platform.name}
            </h3>

            {/* Etiqueta del codigo */}
            <div className="mb-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Código: {platform.code}
              </span>
            </div>

            {platform.description && (
              <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                {platform.description}
              </p>
            )}
          </div>

          {/* Actions Popover */}
          {(canUpdate || canDelete) && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 hover:bg-yellow-400/10 rounded-lg transition-colors border border-gray-700 flex-shrink-0 ml-2"
                  onClick={handlePopoverTriggerClick}
                >
                  <MoreVertical size={18} className="text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-40 p-3 bg-[#0A0F17] border border-gray-700 rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  {canUpdate && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-400 rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md transition-colors"
                      onClick={handleDeleteClick}
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Información de la plataforma */}
        <div className="space-y-3">
          {/* Dominio */}
          {platform.domain && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <a
                href={
                  platform.domain.startsWith("http")
                    ? platform.domain
                    : `https://${platform.domain}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {formatDomain(platform.domain)}
              </a>
            </div>
          )}

          {/* Contacto relacionado */}
          {platform.related_contact && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span
                  className="text-gray-300 truncate"
                  title={`Contacto: ${platform.related_contact.full_name}`}
                >
                  {platform.related_contact.full_name}
                </span>
              </div>
              {platform.related_contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-300 truncate">
                    {platform.related_contact.email}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con fechas */}
        <div className="mt-4 pt-3 border-t border-gray-700">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>
              Creado:{" "}
              {new Date(platform.created_at).toLocaleDateString("es-MX")}
            </span>
          </div>
          {platform.updated_at !== platform.created_at && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <Calendar className="w-3 h-3" />
              <span>
                Actualizado:{" "}
                {new Date(platform.updated_at).toLocaleDateString("es-MX")}
              </span>
            </div>
          )}
        </div>

        {/* Botones de acción visibles */}
        {(canUpdate || canDelete) && (
          <div className="mt-4 pt-3 border-t border-gray-700 flex gap-2">
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex-1 bg-transparent border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 hover:text-yellow-300"
              >
                <Edit className="w-4 h-4 mr-1" />
                Editar
              </Button>
            )} 
            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteClick}
                className="flex-1 bg-transparent border-red-400/30 text-red-400 hover:bg-red-400/10 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Eliminar
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
