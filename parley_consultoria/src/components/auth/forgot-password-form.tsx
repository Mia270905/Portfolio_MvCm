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
      <Card className="relative bg-white text-[#1f1a17] rounded-3xl overflow-hidden border border-[#c6a365]/30 shadow-xl">
        {/* Fondo suave */}
        <div className="absolute inset-0 bg-[#faf8f3] pointer-events-none" />

        {success ? (
          <>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-medium text-[#c6a365]">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                  Revisa tu correo
                </TextEffect>
              </CardTitle>
              <CardDescription className="text-[#7b746b]">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} delay={0.2} as="span">
                  Te enviamos un enlace para restablecer tu contraseña
                </TextEffect>
              </CardDescription>
            </CardHeader>

            <CardContent className="relative z-10">
              <p className="text-sm text-[#7b746b]">
                Si tu correo está registrado, recibirás las instrucciones en unos minutos.
              </p>

              <div className="mt-6 text-center text-sm">
                <Link
                  href="/auth/login"
                  className="text-[#c6a365] hover:text-[#b58f4f] underline-offset-4 hover:underline transition-all"
                >
                  Volver a iniciar sesión
                </Link>
              </div>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader className="relative z-10">
              <CardTitle className="text-2xl font-medium text-[#c6a365]">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                  Restablecer contraseña
                </TextEffect>
              </CardTitle>
              <CardDescription className="text-[#7b746b]">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} delay={0.2} as="span">
                  Ingresa tu correo y te enviaremos un enlace
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
                      <Label htmlFor="email" className="text-[#7b746b]">
                        Correo electrónico
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className="bg-white border border-[#c6a365]/30 text-[#1f1a17]
                                   placeholder:text-[#b9b1a6]
                                   focus:border-[#c6a365] focus:ring-1 focus:ring-[#c6a365]/30
                                   transition-all duration-300"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-sm text-red-500">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[#c6a365] hover:bg-[#b58f4f] text-white
                                 transition-all duration-300 ease-in-out
                                 transform hover:scale-105 rounded-xl
                                 border border-[#c6a365]/40 shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Enviando..." : "Enviar correo"}
                    </Button>
                  </div>

                  <div className="mt-6 text-center text-sm">
                    <span className="text-[#7b746b]">¿Ya tienes cuenta? </span>
                    <Link
                      href="/auth/login"
                      className="text-[#c6a365] hover:text-[#b58f4f] underline-offset-4 hover:underline transition-all"
                    >
                      Inicia sesión
                    </Link>
                  </div>
                </form>
              </AnimatedGroup>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
