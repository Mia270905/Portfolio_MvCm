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
import { Eye, EyeOff, Info, Mail } from "lucide-react";
import Image from "next/image";
import { TextEffect } from "../ui/text-effect";
import { AnimatedGroup } from "../ui/animated-group";
import { toast } from "sonner";

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

  const isInvite = searchParams.get("type") === "invite";
  const returnUrl = searchParams?.get("redirect") || "/";
  const fromAppointment = searchParams?.get("from_appointment") === "true";
  
  // Si es invitación, obtener el email del usuario autenticado
  useEffect(() => {
    const loadInvitedUser = async () => {
      if (isInvite) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?. email) {
          setEmail(user.email);
        } else {
          setError("La invitación ha expirado.  Solicita una nueva.");
        }
      }
    };

    loadInvitedUser();
  }, [isInvite]);

  // Mostrar mensaje si viene de una reserva
  useEffect(() => {
    if (fromAppointment) {
      const tempData = localStorage.getItem('temp_appointment');
      if (tempData) {
        toast.info("Crea una cuenta para confirmar tu reserva pendiente");
      }
    }
  }, [fromAppointment]);

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
      if (isInvite) {
        // FLUJO DE INVITACIÓN:  Actualizar usuario existente
        const { error:  updateError } = await supabase. auth.updateUser({
          password: password,
          data: {
            full_name:  fullName,
          },
        });

        if (updateError) throw updateError;

        toast.success("¡Registro completado exitosamente!");
        router.push("/dashboard");
        router.refresh();
      } else {
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

        // Si el registro requiere confirmación de email
        if (!data.session) {
          // Guardar datos para después de la verificación
          if (fromAppointment) {
            localStorage.setItem('pending_appointment_after_verification', 'true');
            localStorage.setItem('pending_redirect', returnUrl);
            localStorage.setItem('pending_email', email);
          }
          router.push("/auth/sign-up-success");
          return;
        }

        // Si no requiere confirmación, iniciar sesión automáticamente
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;

        // Redirigir según si viene de una reserva
        if (fromAppointment) {
          // Forzar recarga completa para que se carguen los datos temporales
          window.location.href = returnUrl;
        } else {
          router.push(returnUrl);
          router.refresh();
        }
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Ocurrió un error";
      setError(translateError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Guardar datos de reserva en una cookie temporal antes de redirigir
      if (fromAppointment) {
        const tempData = localStorage.getItem('temp_appointment');
        if (tempData) {
          try {
            const parsed = JSON.parse(tempData);
            // Guardar datos importantes en cookie de sesión
            document.cookie = `temp_appointment_data=${encodeURIComponent(tempData)}; path=/; max-age=300`; 
            document.cookie = `from_appointment=true; path=/; max-age=300`;
          } catch (error) {
            console.error('Error guardando datos en cookie:', error);
          }
        }
      }
      
      // Redirección que incluye los parámetros originales
      const redirectUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(returnUrl)}&from_appointment=${fromAppointment}`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
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
          : "Error al registrarse con Google"
      );
      setGoogleLoading(false);
    }
  };

  // 🔹 Traducción de errores comunes
  const translateError = (errorMessage: string): string => {
    const translations: { [key: string]: string } = {
      "User already registered": "El usuario ya está registrado",
      "Invalid email": "Correo electrónico inválido",
      "Email not confirmed": "Correo electrónico no confirmado",
      "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
      "Too many requests": "Demasiados intentos. Por favor, espere un momento.",
    };
    return translations[errorMessage] || errorMessage;
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Mostrar mensaje si viene de una reserva */}
      {fromAppointment && (
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-400 font-medium">
                Tienes una reserva pendiente
              </p>
              <p className="text-xs text-gray-300 mt-1">
                Crea una cuenta para confirmar tu cita. Los datos de tu reserva se guardarán automáticamente.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
       


        
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

       <Card className="relative bg-white text-[#1f1a17] rounded-3xl overflow-hidden border border-[#c6a365]/30 shadow-xl">
  {/* Fondo igual al login */}
  <div className="absolute inset-0 pointer-events-none bg-[#faf8f3]" />


      <CardHeader className="relative z-10">
        <CardTitle className="text-2xl font-medium text-[#c6a365]">
          <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
            Crear cuenta
          </TextEffect>
        </CardTitle>
        <CardDescription className="text-[#7b746b]">
          <TextEffect preset="fade-in-blur" speedSegment={0.3} delay={0.2} as="span">
            Regístrate para agendar tu cita, si ya tienes una cuenta da click 
            </TextEffect>
            <Link
              href="/auth/login"
              className="font-semibold text-[#c6a365] hover:underline"
            >
              <TextEffect
               preset="fade-in-blur"
              speedSegment={0.3}
               delay={0.35}
              >
                aquí.
              </TextEffect>
            </Link>
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10">
        {/* Banner de invitación */}
        {isInvite && (
          <div className="mb-6 p-4 bg-[#c6a365]/10 border border-[#c6a365]/30 rounded-xl flex items-start gap-3">
            <Mail className="h-5 w-5 text-[#c6a365] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#c6a365]">Has sido invitado</p>
              <p className="text-xs text-[#7b746b] mt-1">
                Completa tu nombre y establece una contraseña para acceder a la plataforma
              </p>
            </div>
          </div>
        )}

        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.08,
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
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              {/* Nombre completo */}
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-[#7b746b]">Nombre completo:</Label>
                <Input
                  id="fullName"
                  type="text"
                  className="bg-white border border-[#c6a365]/30 text-[#1f1a17] placeholder:text-[#b9b1a6]
                            focus:border-[#c6a365] focus:ring-1 focus:ring-[#c6a365]/30 transition-all duration-300"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              {/* Correo electrónico */}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[#7b746b]">Correo electrónico:</Label>
                <Input
                  id="email"
                  type="email"
                  className={cn(
                    "bg-white border border-[#c6a365]/30 text-[#1f1a17] placeholder:text-[#b9b1a6] transition-all duration-300",
                    isInvite
                      ? "cursor-not-allowed opacity-70"
                      : "focus:border-[#c6a365] focus:ring-1 focus:ring-[#c6a365]/30"
                  )}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isInvite}
                  readOnly={isInvite}
                  placeholder={isInvite ? "" : "tu@email.com"}
                />
                {isInvite && (
                  <p className="text-xs text-[#7b746b]">
                    Este es el email con el que fuiste invitado
                  </p>
                )}
              </div>

              {/* Contraseña */}
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-[#7b746b]">Contraseña:</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="bg-white border border-[#c6a365]/30 text-[#1f1a17]
                              focus:border-[#c6a365] focus:ring-1 focus:ring-[#c6a365]/30
                              transition-all duration-300 pr-10"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c6a365] hover:text-[#9a8a5c] transition-colors duration-300"
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              {/* Repetir contraseña */}
              <div className="grid gap-2">
                <Label htmlFor="repeat-password" className="text-[#7b746b]">Repetir contraseña:</Label>
                <div className="relative">
                  <Input
                    id="repeat-password"
                    type={showRepeatPassword ? "text" : "password"}
                    required
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    className="bg-white border border-[#c6a365]/30 text-[#1f1a17]
                              focus:border-[#c6a365] focus:ring-1 focus:ring-[#c6a365]/30
                              transition-all duration-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c6a365] hover:text-[#9a8a5c] transition-colors duration-300"
                  >
                    {showRepeatPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Botón registro */}
              <Button
                type="submit"
                className="w-full bg-[#c6a365] hover:bg-[#b58f4f] text-white transition-all duration-300 ease-in-out transform hover:scale-105 rounded-xl border border-[#c6a365]/40 shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? "Creando cuenta..." : "Registrarse"}
              </Button>

              {/* Google */}
              {!isInvite && (
                <>
                  {/* Separador */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-[#c6a365]/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-[#7b746b]">O</span>
                    </div>
                  </div>

                  {/* Botón Google */}
                  <Button
                    type="button"
                    onClick={handleGoogleSignUp}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-[#c6a365]/30 text-[#1f1a17]
                              hover:bg-[#f7f3ec] transition-all duration-300 rounded-xl px-4 py-2 hover:border-[#c6a365]/50"
                    disabled={googleLoading}
                  >
                    <Image 
                      src="/assets/google.png" 
                      alt="Google Logo" 
                      width={20} 
                      height={20} 
                    />
                    {googleLoading ? "Procesando..." : "Registrarse con Google"}
                  </Button>
                </>
              )}
            </div>

            {/* Enlace login */}
            {!isInvite && (
              <div className="mt-6 text-center text-sm">
                <span className="text-[#7b746b]">¿Ya tienes cuenta? </span>
                <Link
                  href={`/auth/login?redirect=${encodeURIComponent(returnUrl)}&from_appointment=${fromAppointment}`}
                  className="text-[#c6a365] hover:text-[#b58f4f] underline-offset-4 hover:underline transition-all"
                >
                  Inicia sesión.
                </Link>
              </div>
            )}
          </form>
        </AnimatedGroup>
      </CardContent>
    </Card>
    </div>
  );
}