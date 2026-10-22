import { Clock } from "lucide-react";

export default function FloatingInfo() {
  return (
    <>
      {/* MÓVIL */}
      <div
        className="
          fixed bottom-4 left-4 right-4
          md:hidden
          bg-white
          shadow-xl
          rounded-2xl
          px-4 py-3
          z-50
          border border-neutral-100
          flex items-center gap-3
        "
      >
        <div className="bg-gray-100 p-2 rounded-full shrink-0">
          <Clock className="w-5 h-5 text-[#c2a66c]" />
        </div>

        <div className="flex flex-col">
          <span className="font-semibold text-neutral-800 text-sm">
            Respuesta en 24h
          </span>
          <span className="text-xs text-neutral-500">
            Lun–Vie 9:00 - 18:00 · Tepic, Nayarit
          </span>
        </div>
      </div>

      {/* DESKTOP */}
      <div
        className="
          hidden md:flex
          fixed right-3 top-1/3
          bg-white
          shadow-xl
          rounded-2xl
          px-4 py-3
          flex-col gap-0.5
          z-50
          border border-neutral-100
        "
      >
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 p-2 rounded-full">
            <Clock className="w-5 h-5 text-[#c2a66c]" />
          </div>
          <span className="font-semibold text-neutral-800">
            Respuesta en 24h
          </span>
        </div>

        <span className="text-sm text-neutral-500">
          Lunes a Viernes 9:00 - 18:00
        </span>
        <span className="text-sm text-neutral-500">
          Tepic, Nayarit
        </span>
      </div>
    </>
  );
}
