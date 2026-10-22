"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers/auth-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  UserCircle2,
  LayoutDashboard,
  LogOut,
  UserIcon,
  Calendar,
  UserCircleIcon as UserProfileIcon,
  Calendar1,
  Clock, // Icono para el checador
} from "lucide-react";
export function AuthButton({ mobileView = false }: { mobileView?: boolean }) {
  const { user, dashboardAccess, reservationsEnabled, isInAttendanceList, loading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (loading && !user) {
    return (
      <div className="flex items-center gap-2">
        {/* Este div imita la forma de tu botón "Mi cuenta" */}
        <div className="h-10 w-[140px] animate-pulse bg-gray-800 border-2 border-gray-700 rounded-xl" />
      </div>
    );
  }

  if (user) {
    if (mobileView) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-3 border-b border-gray-600">
            <UserIcon className="h-5 w-5 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">
                Mi cuenta
              </span>
              <span className="text-xs text-gray-300 truncate">
                {user.email}
              </span>
            </div>
          </div>

          <Link
            href="/profile"
            className="block py-3 pl-1.5 rounded-lg font-medium text-gray-200 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
          >
            Mi Perfil
          </Link>

          {isInAttendanceList && (
            <Link
              href="/checador"
              className="block py-3 pl-1.5 rounded-lg font-medium text-gray-200 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
            >
              Checador
            </Link>
          )}

      

          
          <Link
            href="/appointments/history"
            className="block py-3 rounded-lg font-medium text-gray-200 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
          >
            Mis citas
          </Link>

          {dashboardAccess && (
            <Link
              href="/dashboard"
              prefetch={true}
              className="block py-3 rounded-lg pl-1.5 font-medium text-gray-200 hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
            >
              Panel de control
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-left py-3 pl-1.5 rounded-lg font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      );
    }

    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center cursor-pointer gap-2 bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-amber-500 text-white font-semibold rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 hover:bg-amber-500 hover:border-amber-400 hover:text-white hover:shadow-lg hover:shadow-amber-500/25 hover:scale-105 transition-all duration-300 group"
          >
            <div className="relative">
              <UserCircle2 className="h-5 w-5 sm:h-5 sm:w-5 transition-transform group-hover:scale-110 text-amber-400 group-hover:text-white" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800 group-hover:border-amber-500" />
            </div>
            <span className="hidden sm:inline">Mi cuenta</span>
            <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180 duration-300 text-amber-400 group-hover:text-white" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[calc(100vw-1rem)] sm:w-72 bg-gray-900 shadow-2xl border-2 border-gray-700 rounded-2xl p-3 animate-in fade-in-0 zoom-in-95
          sm:translate-x-0 translate-x-2 transition-transform duration-300 ease-out"
        >
          <DropdownMenuLabel className="flex items-start gap-3 px-3 py-3 bg-gradient-to-r from-amber-500/10 to-amber-500/5 rounded-xl mb-2 border border-amber-500/20">
            <div className="flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full flex-shrink-0">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base font-bold text-white">Mi Cuenta</span>
              <span className="text-sm text-gray-300 truncate">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-2 bg-gray-700" />

          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-amber-500/20 transition-colors duration-200 group"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors border border-amber-500/30">
                <UserProfileIcon className="h-5 w-5 text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-semibold text-gray-200 group-hover:text-amber-400 text-base">
                Mi Perfil
              </span>
            </Link>
          </DropdownMenuItem>

          {isInAttendanceList && (
            <DropdownMenuItem asChild>
              <Link
                href="/checador"
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-amber-500/20 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors border border-amber-500/30">
                  <Clock className="h-5 w-5 text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-gray-200 group-hover:text-amber-400 text-base">
                  Checador
                </span>
              </Link>
            </DropdownMenuItem>
          )}


          
          <>
            <DropdownMenuItem asChild>
              <Link
                href="/appointments/history"
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-amber-500/20 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors border border-amber-500/30">
                  <Calendar1 className="h-5 w-5 text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-gray-200 group-hover:text-amber-400 text-base">
                  Mis citas
                </span>
              </Link>
            </DropdownMenuItem> 
          </>
        

          {dashboardAccess && (
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                prefetch={true}
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-amber-500/20 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors border border-amber-500/30">
                  <LayoutDashboard className="h-5 w-5 text-amber-400 group-hover:text-amber-300 group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-gray-200 group-hover:text-amber-400 text-base">
                  Panel de control
                </span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-2 bg-gray-700" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-red-500/20 transition-colors duration-200 group"
          >
            <div className="flex items-center justify-center w-9 h-9 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors border border-red-500/30">
              <LogOut className="h-5 w-5 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-bold text-red-400 group-hover:text-red-300 text-base">
              Cerrar sesión
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex flex-col gap-2 md:flex-row md:gap-2">
      <Button
        asChild
        size="default"
        variant="outline"
        className="w-full md:w-auto bg-gray-800 border border-amber-500 text-amber-500 font-semibold rounded-lg px-4 py-2 hover:bg-amber-500/10 hover:scale-105 transition-all duration-300 shadow-xs"
      >
        <Link href="/auth/login">Iniciar sesión</Link>
      </Button>

      <Link href="/auth/sign-up">
        <Button
          size="default"
          className="w-full md:w-auto rounded-md bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-amber-600 hover:scale-105"
        >
          Registrarse
        </Button>
      </Link>
    </div>
  );
}
