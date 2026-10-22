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
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { TextEffect } from "../ui/text-effect";
import { AnimatedGroup } from "../ui/animated-group";

/* 🎨 Colores base */
const GOLD = "#c6a365";
const BG_SOFT = "#faf8f3";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams?.get("returnUrl") ?? "/";

  useEffect(() => {
    // Verificar si hay reserva pendiente después de verificar email
    const pendingAppointment = localStorage.getItem("pending_appointment_after_verification");
    const pendingRedirect = localStorage.getItem("pending_redirect");
    const pendingEmail = localStorage.getItem("pending_email");

    if (pendingAppointment === "true" && pendingRedirect && pendingEmail) {
      // Pre-llenar el email si coincide
      if (pendingEmail && !email) {
        setEmail(pendingEmail);
      }

      // Limpiar datos pendientes
      localStorage.removeItem("pending_redirect");
      localStorage.removeItem("pending_email");
    }
  }, [email]);

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

      if (userError && userError.code !== "PGRST116") {
        throw userError;
      }

      if (user && !user.active) {
        await supabase.auth.signOut();
        throw new Error("Usuario desactivado");
      }

      // Verificar si venimos de una reserva
      const fromAppointment = searchParams?.get("from_appointment");
      const redirectTo = searchParams?.get("redirect");

      if (fromAppointment === "true" && redirectTo) {
        // Forzar recarga completa para que se carguen los datos temporales
        window.location.href = redirectTo;
      } else {
        router.push(returnUrl);
        router.refresh();
      }
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Primero guardar datos temporales si estamos en proceso de reserva
      const fromAppointment = searchParams?.get("from_appointment");
      const redirectUrlParam = searchParams?.get("redirect");
      
      // URL de redirección
      let redirectTo = `${window.location.origin}/auth/callback`;
      
      // Si viene de una reserva, agregar parámetros
      if (fromAppointment === "true" && redirectUrlParam) {
        // Guardar el flag temporalmente para usar después del OAuth
        localStorage.setItem('google_oauth_from_appointment', 'true');
        localStorage.setItem('google_oauth_redirect', redirectUrlParam);
        
        // Redirigir al callback con parámetros
        redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrlParam)}&from_appointment=true`;
      } else if (redirectUrlParam) {
        redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectUrlParam)}`;
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
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

  // 🔹 Traducción de errores comunes
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

  return (
    <div
      className={cn("flex flex-col gap-6", className)}
      style={{ backgroundColor: BG_SOFT }}
      {...props}
    >
      {/* Fondo */}
      <div className="absolute inset-0 pointer-events-none bg-[#faf8f3]" />

      <Card className="relative bg-white text-neutral-900 rounded-3xl shadow-lg border border-neutral-200 overflow-hidden">
        <CardHeader className="relative z-10 text-center">
          <CardTitle className="text-2xl font-serif font-semibold">
            <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
              Iniciar sesión
            </TextEffect>
          </CardTitle>
          <CardDescription className="text-neutral-600">
            <TextEffect
              preset="fade-in-blur"
              speedSegment={0.3}
              delay={0.2}
              as="span"
            >
              Ingrese su correo electrónico para iniciar sesión.
            </TextEffect>
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10">
          <AnimatedGroup>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                {/* Correo */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-neutral-700">
                    Correo electrónico:
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-white border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-[#c6a365] focus:ring-1 focus:ring-[#c6a365]/30 transition"
                    placeholder="m@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Contraseña */}
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-neutral-700">
                      Contraseña:
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                      style={{ color: GOLD }}
                    >
                      ¿Olvidó su contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="bg-white border-neutral-300 text-neutral-900 focus:border-[#c6a365] focus:ring-1 focus:ring-[#c6a365]/30 transition"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#c6a365] transition"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Botón login */}
                <Button
                  type="submit"
                  className="w-full text-white rounded-xl transition hover:opacity-90"
                  style={{ backgroundColor: GOLD }}
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>

                {/* Separador */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-neutral-500">O</span>
                  </div>
                </div>

                {/* Botón Google */}
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-xl transition"
                >
                  <Image
                    src="/assets/google.png"
                    alt="Google Logo"
                    width={18}
                    height={18}
                  />
                  {googleLoading
                    ? "Procesando..."
                    : "Iniciar sesión con Google"}
                </Button>
              </div>

              {/* Registro */}
              <div className="mt-6 text-center text-sm text-neutral-600">
                ¿No tiene una cuenta?{" "}
                <Link
                  href="/auth/sign-up"
                  className="font-medium underline-offset-4 hover:underline"
                  style={{ color: GOLD }}
                >
                  Registrarse.
                </Link>
              </div>
            </form>
          </AnimatedGroup>
        </CardContent>
      </Card>
    </div>
  );
}
