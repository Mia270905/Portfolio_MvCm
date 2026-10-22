"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  UserCircle2,
  LayoutDashboard,
  LogOut,
  UserIcon,
  Calendar1,
  Clock,
  UserCircleIcon as UserProfileIcon,
} from "lucide-react";
import { areReservationsEnabled } from "@/lib/actions/configuration.actions";
import { isUserInAttendanceList } from "@/lib/actions/attendance.actions";

export function AuthButton({ mobileView = false }: { mobileView?: boolean }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [dashboardAccess, setDashboardAccess] = useState(false);
  const [reservationsEnabled, setReservationsEnabled] = useState(false);
  const [isInAttendanceList, setIsInAttendanceList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndConfig = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = session.user;
      setUser(userData);

      try {
        const [accessResult, enabled, inList] = await Promise.all([
          supabase
            .from("users")
            .select(`
              profiles!users_profile_id_fkey!inner(
                permissions_profiles!inner(
                  active,
                  permissions!inner(code)
                )
              )
            `)
            .eq("id", userData.id)
            .eq("profiles.permissions_profiles.permissions.code", "access:dashboard")
            .eq("profiles.permissions_profiles.active", true)
            .limit(1)
            .maybeSingle(),
          areReservationsEnabled(),
          isUserInAttendanceList(userData.id),
        ]);

        setDashboardAccess(!!accessResult.data);
        setReservationsEnabled(enabled);
        setIsInAttendanceList(inList);
      } catch (error) {
        console.error("Error en carga paralela:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndConfig();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserAndConfig();
      } else {
        setUser(null);
        setDashboardAccess(false);
        setReservationsEnabled(false);
        setIsInAttendanceList(false);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Skeleton loader con colores beige/café
  if (loading && !user) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-[140px] animate-pulse bg-[#987E71]/20 border-2 border-[#987E71]/40 rounded-full" />
      </div>
    );
  }

  if (user) {
    if (mobileView) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2 py-3 border-b border-[#987E71]">
            <UserIcon className="h-5 w-5 text-[#987E71]" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-[#987E71]">Mi cuenta</span>
              <span className="text-xs text-[#86746b] truncate">{user.email}</span>
            </div>
          </div>

          <Link
            href="/profile"
            className="block py-3 pl-1.5 rounded-lg font-medium text-[#987E71] hover:text-[#40222D] hover:bg-[#987E71]/20 transition-colors"
          >
            Mi Perfil
          </Link>

          {isInAttendanceList && (
            <Link
              href="/checador"
              className="block py-3 pl-1.5 rounded-lg font-medium text-[#987E71] hover:text-[#40222D] hover:bg-[#987E71]/20 transition-colors"
            >
              Checador
            </Link>
          )}

          <Link
            href="/appointments/history"
            className="block py-3 pl-1.5 rounded-lg font-medium text-[#987E71] hover:text-[#40222D] hover:bg-[#987E71]/20 transition-colors"
          >
            Mis citas
          </Link>

          {dashboardAccess && (
            <Link
              href="/dashboard"
              className="block py-3 pl-1.5 rounded-lg font-medium text-[#987E71] hover:text-[#40222D] hover:bg-[#987E71]/20 transition-colors"
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
            className="flex items-center cursor-pointer gap-2 bg-transparent
            border border-[#987E71]
            text-[#987E71]
            px-4 py-2
            rounded-full
            hover:bg-[#40222D]
            hover:text-white
            transition-all group"
          >
            <div className="relative">
              <UserCircle2 className="h-5 w-5 sm:h-5 sm:w-5 transition-colors" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800 group-hover:border-[#40222D]" />
            </div>
            <span className="hidden sm:inline">Mi cuenta</span>
            <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180 duration-300" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[calc(100vw-1rem)] sm:w-72 border-[#987E71] shadow-2xl border-2 rounded-2xl p-3 animate-in fade-in-0 zoom-in-95
          sm:translate-x-0 translate-x-2 transition-transform duration-300 ease-out"
        >
          <DropdownMenuLabel className="flex items-start gap-3 px-3 py-3 bg-gradient-to-r from-[#987E71] to-[#8C7062] rounded-xl mb-2 border border-[#987E71]/20">
            <div className="flex items-center justify-center w-10 h-10 bg-[#987E71] rounded-full flex-shrink-0">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base font-bold text-white">Mi Cuenta</span>
              <span className="text-sm text-[#40222D] truncate">{user.email}</span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-2 bg-[#987E71]/40" />

          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-[#987E71]/20 transition-colors duration-200 group"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-[#987E71]/20 rounded-lg group-hover:bg-[#987E71]/30 transition-colors border border-[#987E71]/30">
                <UserProfileIcon className="h-5 w-5 text-[#987E71] group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-semibold text-[#987E71] group-hover:text-[#40222D] text-base">
                Mi Perfil
              </span>
            </Link>
          </DropdownMenuItem>

          {isInAttendanceList && (
            <DropdownMenuItem asChild>
              <Link
                href="/checador"
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-[#987E71]/20 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-[#987E71]/20 rounded-lg group-hover:bg-[#987E71]/30 transition-colors border border-[#987E71]/30">
                  <Clock className="h-5 w-5 text-[#987E71] group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-[#987E71] group-hover:text-[#40222D] text-base">
                  Checador
                </span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link
              href="/appointments/history"
              className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-[#987E71]/20 transition-colors duration-200 group"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-[#987E71]/20 rounded-lg group-hover:bg-[#987E71]/30 transition-colors border border-[#987E71]/30">
                <Calendar1 className="h-5 w-5 text-[#987E71] group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-semibold text-[#987E71] group-hover:text-[#40222D] text-base">
                Mis citas
              </span>
            </Link>
          </DropdownMenuItem>

          {dashboardAccess && (
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-[#987E71]/20 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-[#987E71]/20 rounded-lg group-hover:bg-[#987E71]/30 transition-colors border border-[#987E71]/30">
                  <LayoutDashboard className="h-5 w-5 text-[#987E71] group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-[#987E71] group-hover:text-[#40222D] text-base">
                  Panel de control
                </span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-2 bg-[#987E71]/40" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 cursor-pointer rounded-xl hover:bg-red-500/20 transition-colors duration-200 group"
          >
            <div className="flex items-center justify-center w-9 h-9 bg-[#987E71]/20 rounded-lg group-hover:bg-red-500/30 transition-colors border border-red-500/30">
              <LogOut className="h-5 w-5 text-[#987E71] group-hover:text-red-300 group-hover:scale-110 transition-transform" />
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
        className="w-full md:w-auto border-[#987E71] text-[#987E71] border font-semibold rounded-lg px-4 py-2 hover:bg-[#987E71]/10 hover:scale-105 transition-all duration-300 shadow-xs"
      >
        <Link href="/auth/login">Iniciar sesión</Link>
      </Button>

      <Link href="/auth/sign-up">
        <Button
          size="default"
          className="w-full md:w-auto rounded-md bg-[#987E71] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#8C7062] hover:scale-105"
        >
          Registrarse
        </Button>
      </Link>
    </div>
  );
}