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
        <div className="absolute inset-0 bg-[#0c0a09]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-gray-900/10 to-black/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-400/3 via-transparent to-transparent"></div>
        
        {/* Partículas de luz */}
        {[...Array(8)].map((_, i) => (
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

      {success ? (
        <Card className="relative bg-[#1a1a1a] text-white rounded-3xl shadow-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
          {/* Efecto de borde luminoso */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-gray-700/5 rounded-3xl"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-medium">
              <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                Revise su correo electrónico
              </TextEffect>
            </CardTitle>
            <CardDescription className="text-gray-300">
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
              <p className="text-sm text-gray-300">
                Si se registró usando un correo y contraseña, recibirá un correo
                para restablecer su contraseña.
              </p>
              <div className="mt-6 text-center text-sm">
                <Link
                  href="/auth/login"
                  className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline transition-all"
                >
                  Iniciar sesión
                </Link>
              </div>
            </AnimatedGroup>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative bg-[#1a1a1a] text-white rounded-3xl shadow-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
          {/* Efecto de borde luminoso */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-gray-700/5 rounded-3xl"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-medium">
              <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                Restablecer su contraseña
              </TextEffect>
            </CardTitle>
            <CardDescription className="text-gray-300">
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
                    <Label htmlFor="email" className="text-gray-200">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@ejemplo.com"
                      className="bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all duration-300"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white transition-all duration-300 ease-in-out transform hover:scale-105 rounded-xl border border-amber-400/30 shadow-lg"  
                    disabled={isLoading}
                  >
                    {isLoading ? "Enviando..." : "Enviar correo"}
                  </Button>
                </div>
                
                <div className="mt-6 text-center text-sm">
                  <span className="text-gray-400">¿Ya tienes una cuenta? </span>
                  <Link
                    href="/auth/login"
                    className="text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline transition-all"
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
