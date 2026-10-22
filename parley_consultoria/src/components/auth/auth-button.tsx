"use client";

import Link from "next/link";
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
  Clock,
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
            .from('users')
            .select(`
              profiles!users_profile_id_fkey!inner(
                permissions_profiles!inner(
                  active,
                  permissions!inner(code)
                )
              )
            `)
            .eq('id', userData.id)
            .eq('profiles.permissions_profiles.permissions.code','access:dashboard')
            .eq('profiles.permissions_profiles.active', true)
            .limit(1)
            .maybeSingle(),
          areReservationsEnabled(),
          isUserInAttendanceList(userData.id)
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  if (loading && !user) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-[140px] animate-pulse bg-[#faf8f3] border-2 border-[#e7dcc9] rounded-xl" />
      </div>
    );
  }

  if (user) {
    if (mobileView) {
      return (
        <div className="space-y-2 bg-[#faf8f3] px-2 py-2 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 px-3 py-3 border-b border-[#e7dcc9] bg-[#faf8f3] rounded-xl">
            <UserIcon className="h-5 w-5 text-[#c6a365]" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-[#3a332d]">
                Mi cuenta
              </span>
              <span className="text-xs text-[#6b6259] truncate">
                {user.email}
              </span>
            </div>
          </div>

          <Link
            href="/profile"
            className="block py-3 pl-2 rounded-xl font-medium text-[#6b6259] hover:bg-[#e7dcc9]/40 hover:text-[#3a332d] transition-colors"
          >
            Mi Perfil
          </Link>

          {isInAttendanceList && (
            <Link
              href="/checador"
              className="block py-3 pl-2 rounded-xl font-medium text-[#6b6259] hover:bg-[#e7dcc9]/40 hover:text-[#3a332d] transition-colors"
            >
              Checador
            </Link>
          )}

          <Link
            href="/appointments/history"
            className="block py-3 pl-2 rounded-lg font-medium text-[#6b6259] hover:bg-[#e7dcc9]/40 hover:text-[#3a332d] transition-colors"
          >
            Mis citas
          </Link>

          {dashboardAccess && (
            <Link
              href="/dashboard"
              className="block py-3 pl-2 rounded-lg font-medium text-[#6b6259] hover:bg-[#e7dcc9]/40 hover:text-[#3a332d] transition-colors"
            >
              Panel de Control
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-left py-3 pl-2 rounded-xl font-semibold text-[#b85c4d] hover:bg-[#f3e6e3]/70 transition-colors"
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
            className="flex items-center cursor-pointer gap-2 bg-[#faf8f3] border-2 border-[#e7dcc9] text-[#1f1a17] font-semibold rounded-xl px-3 sm:px-5 py-2 sm:py-2.5 hover:text-[#1f1a17] hover:border-[#c6a365] hover:shadow-lg hover:shadow-[#c6a365]/25 hover:scale-105 transition-all duration-300 group"
          >
            <div className="relative">
              <UserCircle2 className="h-5 w-5 text-[#c6a365] group-hover:text-[#1f1a17] transition-colors" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#faf8f3]" />
            </div>
            <span className="hidden sm:inline">Mi cuenta</span>
            <ChevronDown className="h-4 w-4 text-[#c6a365] group-hover:text-[#1f1a17] transition-colors" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-[calc(100vw-1rem)] sm:w-72 bg-[#ffffff] shadow-2xl border-2 border-[#e7dcc9] rounded-2xl p-3 animate-in fade-in-0 zoom-in-95 sm:translate-x-0 translate-x-2 transition-transform duration-300 ease-out"
        >
          <DropdownMenuLabel className="flex items-start gap-3 px-3 py-3 bg-[#faf8f3] rounded-xl mb-2 border border-[#e7dcc9]">
            <div className="flex items-center justify-center w-10 h-10 bg-[#c6a365] rounded-full flex-shrink-0">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-base font-bold text-[#1f1a17]">
                Mi Cuenta
              </span>
              <span className="text-sm text-[#7b746b] truncate">
                {user.email}
              </span>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="my-2 bg-[#e7dcc9]" />

          <DropdownMenuItem 
            asChild
            className="data-[highlighted]:bg-[#e7dcc9]/60 data-[highlighted]:text-[#1f1a17]"
          >
            <Link
              href="/profile"
              className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#e7dcc9]/60 transition-colors duration-200 group"
            >
              <div className="flex items-center justify-center w-9 h-9 bg-[#e7dcc9]/50 rounded-lg border border-[#c6a365]/30 group-hover:bg-[#e7dcc9]/70 transition-colors">
                <UserProfileIcon className="h-5 w-5 text-[#c6a365] group-hover:scale-110 transition-transform" />
              </div>
              <span className="font-semibold text-[#7b746b] group-hover:text-[#1f1a17] text-base">
                Mi Perfil
              </span>
            </Link>
          </DropdownMenuItem>

          {isInAttendanceList && (
            <DropdownMenuItem 
              asChild
              className="data-[highlighted]:bg-[#e7dcc9]/60 data-[highlighted]:text-[#1f1a17]"
            >
              <Link
                href="/checador"
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#e7dcc9]/60 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-[#e7dcc9]/50 rounded-lg border border-[#c6a365]/30 group-hover:bg-[#e7dcc9]/70 transition-colors">
                  <Clock className="h-5 w-5 text-[#c6a365] group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-[#7b746b] group-hover:text-[#1f1a17] text-base">
                  Checador
                </span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem 
            asChild
            className="data-[highlighted]:bg-[#e7dcc9]/60 data-[highlighted]:text-[#1f1a17]"
          >
              <Link
                href="/appointments/history"
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#e7dcc9]/60 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-[#e7dcc9]/50 rounded-lg border border-[#c6a365]/30 group-hover:bg-[#e7dcc9]/70 transition-colors">
                  <Calendar1 className="h-5 w-5 text-[#c6a365] group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-[#7b746b] group-hover:text-[#1f1a17] text-base">
                  Mis citas
                </span>
              </Link>
            </DropdownMenuItem> 

          {dashboardAccess && (
            <DropdownMenuItem 
              asChild
              className="data-[highlighted]:bg-[#e7dcc9]/60 data-[highlighted]:text-[#1f1a17]"
            >
              <Link
                href="/dashboard"
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#e7dcc9]/60 transition-colors duration-200 group"
              >
                <div className="flex items-center justify-center w-9 h-9 bg-[#e7dcc9]/50 rounded-lg border border-[#c6a365]/30 group-hover:bg-[#e7dcc9]/70 transition-colors">
                  <LayoutDashboard className="h-5 w-5 text-[#c6a365] group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-semibold text-[#7b746b] group-hover:text-[#1f1a17] text-base">
                  Panel de control
                </span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-2 bg-[#e7dcc9]" />

          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[#f3e6e3] data-[highlighted]:bg-[#f3e6e3] transition-colors duration-200 group"
          >
            <div className="flex items-center justify-center w-9 h-9 bg-[#f3e6e3] rounded-lg border border-[#e4cfc9]">
              <LogOut className="h-5 w-5 text-[#b85c4d] group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-bold text-[#b85c4d] text-base">
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
        className="w-full md:w-auto text-[#c4a87c] font-semibold px-4 py-2 hover:text-[#b39a6e] hover:bg-transparent hover:scale-105 transition-all duration-300 shadow-xs"
      >
        <Link href="/auth/login">Iniciar sesión</Link>
      </Button>

      <Link href="/auth/sign-up">
        <Button
          size="default"
          className="w-full md:w-auto rounded-md bg-[#c4a87c] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:bg-[#b39a6e] hover:scale-105"
        >
          Registrarse
        </Button>
      </Link>
    </div>
  );
}