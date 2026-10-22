"use client";
import { Menu, User, Maximize2, LogOut, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Swal from "sweetalert2";
import CompanySelector from "./company-selector";

interface DashboardHeaderProps {
  onMenuToggle: () => void;
}

export default function DashboardHeader({ onMenuToggle }: DashboardHeaderProps) {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Cerrar Sesión",
      text: "¿Estás seguro de que desea cerrar sesión?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#B49464",
      cancelButtonColor: "#A6A4A1",
      confirmButtonText: "Sí, seguro",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  // Función opcional para manejar cambios en la selección
  const handleSelectionChange = (selectedIds: string[]) => {
    console.log("Empresas seleccionadas:", selectedIds);
  };

  return (
    <header className="h-18 bg-white dark:bg-[#070B14] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 z-10">
      {/* Botón hamburguesa */}
      <button
        onClick={onMenuToggle}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      </button>
      
      {/* Espaciador */}
      <div className="flex-1"></div>
      
      {/* Acciones de la derecha */}
      <div className="flex items-center gap-2">
        {/* Botón fullscreen */}
        <button
          onClick={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Toggle fullscreen"
        >
          <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <div className="mr-2">
          <CompanySelector onSelectionChange={handleSelectionChange} />
        </div>
        
        {/* Botón de usuario */}
        <div className="mr-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="User menu"
              >
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-48 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700" 
              align="end"
            >
              <button
                onClick={() => router.push("/")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <Globe className="w-4 h-4" />
                Sitio Web
              </button>

              <button
                onClick={() => router.push("/profile")}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <User className="w-4 h-4" />
                Perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}