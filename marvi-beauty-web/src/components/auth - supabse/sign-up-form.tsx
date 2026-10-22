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
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const returnUrl = searchParams?.get("returnUrl") ?? "/";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // El trigger de Supabase se encargará automáticamente de crear el usuario en la tabla users
      if (data.session) {
        // Si hay sesión inmediatamente (cuando la confirmación de email está desactivada)
        router.push("/");
        router.refresh();
      } else {
        // Esperar confirmación de email
        router.push("/auth/sign-up-success");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const redirectTo = `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(
        returnUrl
      )}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) throw error;

      // La redirección se manejará automáticamente a través del callback
      // El trigger de Supabase creará el usuario en la tabla users
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Error al registrarse con Google"
      );
      setGoogleLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="bg-[#F5F2ED] border-[#D4CEC4]">
        <CardHeader>
          <CardTitle className="text-2xl text-[#8B7968]">Crear cuenta</CardTitle>
          <CardDescription className="text-[#A89585]">Regístrate para comenzar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="!text-[#8B7968]">Nombre completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#D4CEC4] text-[#5C5248] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="!text-[#8B7968]">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  className="w-full px-4 py-3 rounded-lg bg-white border border-[#D4CEC4] text-[#5C5248] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="!text-[#8B7968]">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full px-4 py-3 rounded-lg bg-white border border-[#D4CEC4] text-[#5C5248] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent pr-10"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89585] hover:text-[#8B7968] transition-colors"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repeat-password" className="!text-[#8B7968]">Repetir contraseña</Label>
                <div className="relative">
                  <Input
                    id="repeat-password"
                    type={showRepeatPassword ? "text" : "password"}
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white border border-[#D4CEC4] text-[#5C5248] focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:border-transparent pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89585] hover:text-[#8B7968] transition-colors"
                  >
                    {showRepeatPassword ? (
                      <Eye size={20} />
                    ) : (
                      <EyeOff size={20} />
                    )}
                  </button>
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                type="submit"
                className="w-full py-3 rounded-lg bg-[#A89585] text-white font-medium hover:bg-[#8B7968] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4A5A5] focus:ring-offset-2"
                disabled={isLoading}
              >
                {isLoading ? "Creando cuenta..." : "Registrarse"}
              </Button>

              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#D4CEC4]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#F5F2ED] px-2 text-[#A89585]">O</span>
                </div>
              </div>

              {/* Botón Google */}
              <Button
                type="button"
                onClick={handleGoogleSignUp}
                className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-800 hover:bg-gray-100 transition duration-300 rounded-lg px-4 py-2"
                disabled={googleLoading}
              >
                <Image src="/assets/google.png" alt="" width={20} height={20} />
                {googleLoading ? "Procesando..." : "Registrarse con Google"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm">
              <p className="text-[#8B7968]">
                ¿Ya tienes cuenta?{" "}
                <Link
                  href="/auth/login"
                  className="text-[#D4A5A5] hover:text-[#8B7968] font-medium underline transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}