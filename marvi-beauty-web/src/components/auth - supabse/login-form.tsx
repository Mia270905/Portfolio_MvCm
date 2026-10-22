"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();

  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") ?? "/";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Verificar si el usuario existe en la tabla users y está activo
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("active")
        .eq("id", authData.user.id)
        .single();

      // Si no existe el usuario, el trigger lo creará automáticamente
      // Solo nos preocupamos si hay un error diferente a "no encontrado"
      if (userError && userError.code !== "PGRST116") {
        throw userError;
      }

      // Si el usuario existe pero está inactivo
      if (user && !user.active) {
        await supabase.auth.signOut();
        throw new Error("Usuario desactivado");
      }

      // Redirección exitosa a la página principal
      router.push(returnUrl);
      router.refresh();
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? translateError(error.message)
          : "Ocurrió un error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const translateError = (errorMessage: string): string => {
    const translations: { [key: string]: string } = {
      "Invalid login credentials": "Credenciales inválidas",
      "Email not confirmed": "Correo electrónico no confirmado",
      "User not found": "Usuario no encontrado",
      "Invalid email or password": "Correo o contraseña inválidos",
      "Usuario desactivado":
        "Su cuenta se encuentra inactiva, contacte con un administrador para revisar su situación.",
      "Email not verified": "Correo electrónico no verificado",
      "Too many requests": "Demasiados intentos. Por favor, espere un momento.",
    };
    return translations[errorMessage] || errorMessage;
  };

    const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Redirección manual explícita
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al iniciar sesión con Google"
      );
      setGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-[#F5F2ED]">
        <CardHeader>
          <CardTitle className="text-2xl text-[#8B7968]">Iniciar sesión</CardTitle>
          <CardDescription className="text-[#A89585]">
            Ingrese su correo electrónico para iniciar sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email" className="!text-[#8B7968]">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@ejemplo.com"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#D4CEC4] text-[#5C5248] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="!text-[#8B7968]">Contraseña</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#D4CEC4] text-[#5C5248] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full py-3 rounded-lg bg-[#A89585] text-white font-medium hover:bg-[#8B7968] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:ring-offset-2" disabled={isLoading}>
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </Button>

              {/* Botón Google */}
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900/50 border border-gray-600 text-white hover:bg-gray-800/50 transition-all duration-300 rounded-xl px-4 py-2 hover:border-amber-400/30"
                >
                  <Image
                    src="/assets/google.png"
                    alt="Google Logo"
                    width={20}
                    height={20}
                  />
                  {googleLoading ? "Procesando..." : "Iniciar sesión con Google"}
                </Button>
              <div className="text-center mt-4">
                <p className="text-sm text-[#8B7968]">
                  ¿No tienes una cuenta?{" "}
                  <Link 
                    href="/auth/sign-up" 
                    className="text-[#D4A5A5] hover:text-[#8B7968] font-medium underline transition-colors"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}