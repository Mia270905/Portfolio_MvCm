"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { areReservationsEnabled } from "@/lib/actions/configuration.actions";
import { isUserInAttendanceList } from "@/lib/actions/attendance.actions";

interface AuthContextType {
  user: User | null;
  dashboardAccess: boolean;
  reservationsEnabled: boolean;
  isInAttendanceList: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dashboardAccess: false,
  reservationsEnabled: false,
  isInAttendanceList: false,
  loading: false,
  logout: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
  initialUser: User | null;
  initialDashboardAccess: boolean;
  initialReservationsEnabled: boolean;
  initialIsInAttendanceList: boolean;
}

export function AuthProvider({ 
  children,
  initialUser,
  initialDashboardAccess,
  initialReservationsEnabled,
  initialIsInAttendanceList
}: AuthProviderProps) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(initialUser);
  const [dashboardAccess, setDashboardAccess] = useState(initialDashboardAccess);
  const [reservationsEnabled, setReservationsEnabled] = useState(initialReservationsEnabled);
  const [isInAttendanceList, setIsInAttendanceList] = useState(initialIsInAttendanceList);
  const [loading, setLoading] = useState(false); // Inicia en falso porque los datos iniciales ya vienen completos del servidor

  useEffect(() => {
    let isMounted = true;
    let isInitialLoad = true;

    const fetchUserAndConfig = async () => {
      // 1. Obtener la sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        if (isMounted) {
          setUser(null);
          setDashboardAccess(false);
          setReservationsEnabled(false);
          setIsInAttendanceList(false);
          setLoading(false);
        }
        return;
      }

      // Si es la carga inicial y el usuario de la sesión coincide con el que SSR nos pasó,
      // no hacemos más requests a Supabase (¡Ahorro de ms!).
      if (isInitialLoad && session.user.id === initialUser?.id) {
        isInitialLoad = false;
        return;
      }

      const userData = session.user;
      if (isMounted) {
        setUser(userData);
        setLoading(true); // Solo mostramos loading si el usuario cambió en el cliente
      }

      // 2. Ejecutar llamadas de datos en paralelo SOLO cuando el usuario cambie de identidad (por ej. login)
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

        if (isMounted) {
          setDashboardAccess(!!accessResult.data);
          setReservationsEnabled(enabled);
          setIsInAttendanceList(inList);
        }
      } catch (error) {
        console.error("Error en carga paralela (AuthProvider):", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserAndConfig();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserAndConfig();
      } else {
        if (isMounted) {
          setUser(null);
          setDashboardAccess(false);
          setReservationsEnabled(false);
          setIsInAttendanceList(false);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        dashboardAccess,
        reservationsEnabled,
        isInAttendanceList,
        loading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
