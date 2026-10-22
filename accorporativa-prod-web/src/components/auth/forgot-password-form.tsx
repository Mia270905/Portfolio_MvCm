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
import { useState } from "react";
import { TextEffect } from "../ui/text-effect";
import { AnimatedGroup } from "../ui/animated-group";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // The url which will be included in the email. This URL needs to be configured in your redirect URLs in the Supabase dashboard at https://supabase.com/dashboard/project/_/auth/url-configuration
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Ocurrió un error");
    } finally {
      setIsLoading(false);
    }
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

      {success ? (
        <Card className="relative bg-white text-[#40222D] rounded-3xl shadow-2xl border border-[#B48993] backdrop-blur-sm overflow-hidden">
          {/* Efecto de borde luminoso */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#A65B6F]/10 via-transparent to-[#B48993]/5 rounded-3xl"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-medium">
              <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                Revise su correo electrónico
              </TextEffect>
            </CardTitle>
            <CardDescription className="text-[#B48993]">
              <TextEffect preset="fade-in-blur" speedSegment={0.3} delay={0.2} as="span">
                Se enviaron las instrucciones para restablecer su contraseña
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
              <p className="text-sm text-[#B48993]">
                Si se registró usando un correo y contraseña, recibirá un correo
                para restablecer su contraseña.
              </p>
              <div className="mt-6 text-center text-sm">
                <Link
                  href="/auth/login"
                  className="text-[#A65B6F] hover:text-[#40222D] underline-offset-4 hover:underline transition-all"
                >
                  Iniciar sesión
                </Link>
              </div>
            </AnimatedGroup>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative bg-white text-[#40222D] rounded-3xl shadow-2xl border border-[#B48993] backdrop-blur-sm overflow-hidden">
          {/* Efecto de borde luminoso */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#A65B6F]/10 via-transparent to-[#B48993]/5 rounded-3xl"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-medium">
              <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                Restablecer su contraseña
              </TextEffect>
            </CardTitle>
            <CardDescription className="text-[#B48993]">
              <TextEffect preset="fade-in-blur" speedSegment={0.3} delay={0.2} as="span">
                Escriba su correo electrónico y nosotros le enviaremos un enlace para
                restablecer su contraseña
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
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-[#40222D]">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@ejemplo.com"
                      className="bg-white border-[#B48993] text-[#40222D] placeholder:text-[#B48993] focus:border-[#A65B6F] focus:ring-1 focus:ring-[#A65B6F]/30 transition-all duration-300"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-[#A65B6F]/10 border border-[#A65B6F]/30 rounded-lg p-3">
                      <p className="text-sm text-[#A65B6F]">{error}</p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#A65B6F] hover:bg-[#40222D] text-white transition-all duration-300 ease-in-out transform hover:scale-105 rounded-xl border border-[#A65B6F]/30 shadow-lg"  
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Enviar correo"}
                  </Button>
                </div>
                
                <div className="mt-6 text-center text-sm">
                  <span className="text-[#B48993]">¿Ya tienes una cuenta? </span>
                  <Link
                    href="/auth/login"
                    className="text-[#A65B6F] hover:text-[#40222D] underline-offset-4 hover:underline transition-all"
                  >
                    Iniciar sesión
                  </Link>
                </div>
              </form>
            </AnimatedGroup>
          </CardContent>
        </Card>
      )}
    </div>
  );
}