"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

interface ShareButtonProps {
  shareUrl?: string;
  shareTitle?: string;
  shareText?: string;
  className?: string;
}

export default function ShareButton({ 
  shareUrl = "", 
  shareTitle = "Alveus soft",
  shareText = "",
  className = ""
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareData = {
    title: shareTitle,
    text: shareText,
    url: shareUrl || (typeof window !== "undefined" ? window.location.href : ""),
  };

  const handleShare = async () => {
    setIsSharing(true);

    try {
      // Verificar si Web Share API está disponible
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback: copiar al portapapeles
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      // El usuario canceló o hubo un error
      if (error instanceof Error && error.name !== "AbortError") {
        // Si falla, intentar copiar al portapapeles
        try {
          await navigator.clipboard.writeText(shareData.url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (clipboardError) {
          console.error("Error al copiar:", clipboardError);
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`group relative inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-500 hover:scale-105 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label="Compartir esta página"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-green-300" />
          <span>¡Enlace copiado!</span>
        </>
      ) : (
        <>
          {isSharing ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-blue-300" />
          ) : (
            <Share2 className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
          )}
          <span>Compartir</span>
        </>
      )}
    </button>
  );
}