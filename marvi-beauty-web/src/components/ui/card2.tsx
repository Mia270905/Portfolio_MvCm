"use client";

import * as React from "react";

function Card({
  src,
  title,
  className,
}: {
  src: string;
  title: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      {/* --- Imagen principal --- */}
      <div
        onClick={openModal}
        className={`group relative overflow-hidden rounded-lg border shadow-sm cursor-pointer transition-all duration-300 hover:shadow-lg ${className || ""}`}
      >
        <img
          src={src || "/placeholder.svg"}
          alt={title || "Imagen"}
          className="w-full h-56 object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
        />
      </div>

      {/* --- Modal --- */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Fondo oscuro */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Contenedor de la imagen */}
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full px-4 py-2 transition-colors"
            >
              X
            </button>

            <img
              src={src || "/placeholder.svg"}
              alt={title || "Imagen ampliada"}
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}

export { Card };
