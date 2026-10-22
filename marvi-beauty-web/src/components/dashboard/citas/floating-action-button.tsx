"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Calendar, Share2, Check, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FloatingActionButtonProps {
  canCreateAppointments: boolean;
  hasUserCode: boolean;
  shareUrl: string;
  shareTitle?: string;
  shareText?: string;
}

export function FloatingActionButton({
  canCreateAppointments,
  hasUserCode,
  shareUrl,
  shareTitle = "Agenda tu cita",
  shareText = "¡Agenda tu cita fácilmente! Haz clic en el enlace para programar tu visita.",
}: FloatingActionButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: shareTitle,
      text: shareText,
      url: shareUrl,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (clipboardError) {
          console.error("Error al copiar:", clipboardError);
        }
      }
    }
    setIsOpen(false);
  };

  // Si no tiene ningún permiso, no mostrar el botón
  if (!canCreateAppointments && !hasUserCode) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-6 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="group flex h-14 w-14 items-center justify-center rounded-full bg-custom-accent-primary text-gray-900 shadow-lg transition-all duration-300 hover:bg-custom-accent-secondary hover:scale-110 hover:shadow-xl hover:shadow-custom-accent-primary/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-custom-accent-primary"
            aria-label="Acciones de citas"
          >
            <Plus
              className={`h-6 w-6 transition-transform duration-300 ${
                isOpen ? "rotate-45" : "group-hover:rotate-90"
              }`}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          side="top"
          sideOffset={12}
          className="w-56 bg-custom-bg-secondary border-custom-border-secondary"
        >
          {canCreateAppointments && (
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link
                href="/dashboard/citas/gestion/crear"
                className="flex items-center gap-3 px-3 py-2.5 text-custom-text-primary hover:text-custom-text-primary"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-custom-accent-primary/20">
                  <Calendar className="h-4 w-4 text-custom-accent-primary" />
                </div>
                <div>
                  <p className="font-medium">Crear Cita</p>
                  <p className="text-xs text-custom-text-tertiary">
                    Agregar espacio
                  </p>
                </div>
              </Link>
            </DropdownMenuItem>
          )}

          {hasUserCode && (
            <DropdownMenuItem
              onClick={handleShare}
              className="cursor-pointer flex items-center gap-3 px-3 py-2.5 text-custom-text-primary hover:text-custom-text-primary"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-custom-accent-primary/20">
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Share2 className="h-4 w-4 text-blue-400" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {copied ? "¡Enlace copiado!" : "Compartir Enlace"}
                </p>
                <p className="text-xs text-custom-text-tertiary">
                  {copied ? "Listo para pegar" : "Envía a tus clientes"}
                </p>
              </div>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}