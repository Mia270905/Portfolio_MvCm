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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextEffect } from "../ui/text-effect";
import { AnimatedGroup } from "../ui/animated-group";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Update this route to redirect to an authenticated route. The user already has an active session.
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? translateError(error.message) : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
  };

  const translateError = (errorMessage: string): string => {
    const translations: { [key: string]: string } = {
      "New password should be different from the old password.": "La nueva contraseña debe ser diferente de la contraseña anterior.",
      "Email not confirmed": "Correo electrónico no confirmado",
      "User not found": "Usuario no encontrado",
      "Invalid email or password": "Correo o contraseña inválidos",
      "Usuario desactivado": "Su cuenta se encuentra inactiva, contacte con un administrador para revisar su situación."
    };
    
    return translations[errorMessage] || errorMessage;
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-white"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#A65B6F]/5 via-transparent to-[#B48993]/10"></div>
        
        {/* Partículas de luz */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#A65B6F]/20 rounded-full animate-pulse"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <Card className="relative bg-white text-[#40222D] rounded-3xl shadow-2xl border border-[#B48993] backdrop-blur-sm overflow-hidden">
        {/* Efecto de borde luminoso */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#A65B6F]/10 via-transparent to-[#B48993]/5 rounded-3xl"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-2xl font-medium">
            <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
              Restablecer tu contraseña
            </TextEffect>
          </CardTitle>
          <CardDescription className="text-[#B48993]">
            <TextEffect preset="fade-in-blur" speedSegment={0.3} delay={0.2} as="span">
              Por favor introduzca su nueva contraseña debajo.
            </TextEffect>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
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
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                {/* Contraseña */}
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-[#40222D]">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      className="bg-white border-[#B48993] text-[#40222D] focus:border-[#A65B6F] focus:ring-1 focus:ring-[#A65B6F]/30 transition-all duration-300 pr-10"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B48993] hover:text-[#A65B6F] transition-colors duration-300"
                    >
                      {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>

                {/* Repetir contraseña */}
                <div className="grid gap-2">
                  <Label htmlFor="repeat-password" className="text-[#40222D]">Repetir contraseña</Label>
                  <div className="relative">
                    <Input
                      id="repeat-password"
                      type={showRepeatPassword ? "text" : "password"}
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="bg-white border-[#B48993] text-[#40222D] focus:border-[#A65B6F] focus:ring-1 focus:ring-[#A65B6F]/30 transition-all duration-300 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B48993] hover:text-[#A65B6F] transition-colors duration-300"
                    >
                      {showRepeatPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-[#A65B6F]/10 border border-[#A65B6F]/30 rounded-lg p-3">
                    <p className="text-sm text-[#A65B6F]">{error}</p>
                  </div>
                )}

                {/* Botón guardar */}
                <Button 
                  type="submit" 
                  className="w-full bg-[#A65B6F] hover:bg-[#40222D] text-white transition-all duration-300 ease-in-out transform hover:scale-105 rounded-xl border border-[#A65B6F]/30 shadow-lg"  
                  disabled={isLoading}
                >
                  {isLoading ? "Guardando..." : "Guardar nueva contraseña"}
                </Button>
              </div>
            </form>
          </AnimatedGroup>
        </CardContent>
      </Card>
    </div>
  );
}