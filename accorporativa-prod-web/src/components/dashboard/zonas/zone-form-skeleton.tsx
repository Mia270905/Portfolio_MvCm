"use client";

export default function ZoneFormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
      <div className="space-y-6">
        {/* Título */}
        <div className="h-8 bg-[#0A0F17] rounded w-1/3"></div>
        <div className="h-4 bg-[#0A0F17] rounded w-1/2"></div>

        {/* Campos del formulario */}
        <div className="space-y-4">
          <div className="h-10 bg-[#0A0F17] rounded w-full"></div>
          <div className="h-10 bg-[#0A0F17] rounded w-full"></div>
          <div className="h-10 bg-[#0A0F17] rounded w-full"></div>
        </div>

        {/* Botón */}
        <div className="flex justify-end">
          <div className="h-10 bg-[#0A0F17] rounded w-32"></div>
        </div>
      </div>
    </div>
  );
}
