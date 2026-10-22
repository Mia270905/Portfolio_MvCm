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
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { TextEffect } from "../ui/text-effect";
import { AnimatedGroup } from "../ui/animated-group";

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
    const pendingAppointment = localStorage.getItem(
      "pending_appointment_after_verification"
    );
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Fondo decorativo similar al hero */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0c0a09]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-gray-900/10 to-black/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-400/3 via-transparent to-transparent"></div>

        {/* Partículas de luz */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gray-300 rounded-full animate-pulse opacity-30"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <Card className="relative bg-[#1a1a1a] text-white rounded-3xl shadow-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
        {/* Efecto de borde luminoso */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-gray-700/5 rounded-3xl"></div>

        <CardHeader className="relative z-10">
          <CardTitle className="text-2xl font-medium">
            <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
              Iniciar sesión
            </TextEffect>
          </CardTitle>
          <CardDescription className="text-gray-300">
            <TextEffect
              preset="fade-in-blur"
              speedSegment={0.3}
              delay={0.2}
              as="span"
            >
              Ingrese su correo electrónico para iniciar sesión
            </TextEffect>
          </CardDescription>
        </CardHeader>

        <CardContent className="relative z-10">
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                    delayChildren: 0.3,
                  },
                },
              },
              item: {
                hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
                visible: {
                  opacity: 1,
                  filter: "blur(0px)",
                  y: 0,
                  transition: { type: "spring", bounce: 0.3, duration: 1 },
                },
              },
            }}
          >
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                {/* Correo */}
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-200">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all duration-300"
                    placeholder="m@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Contraseña */}
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password" className="text-gray-200">
                      Contraseña
                    </Label>
                    <Link
                      href="/auth/forgot-password"
                      className="ml-auto inline-block text-sm text-amber-400 underline-offset-4 hover:underline transition-all"
                    >
                      ¿Olvidó su contraseña?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      className="bg-gray-900/50 border-gray-600 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all duration-300"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-amber-400 transition-colors duration-300"
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Botón login */}
                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white transition-all duration-300 ease-in-out transform hover:scale-105 rounded-xl border border-amber-400/30 shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </Button>

                {/* Separador */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#1a1a1a] px-2 text-gray-400">O</span>
                  </div>
                </div>

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
                  {googleLoading
                    ? "Procesando..."
                    : "Iniciar sesión con Google"}
                </Button>
              </div>

              {/* Enlace registro */}
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-400">¿No tiene una cuenta? </span>
                <Link
                  href="/auth/sign-up"
                  className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline transition-all"
                >
                  Registrarse
                </Link>
              </div>
            </form>
          </AnimatedGroup>
        </CardContent>
      </Card>
    </div>
  );
}
