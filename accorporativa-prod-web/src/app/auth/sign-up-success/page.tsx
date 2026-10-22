"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Mail, ArrowLeft } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { TextEffect } from "@/components/ui/text-effect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SignUpSuccessPage() {
  const router = useRouter();
  const [hasPendingAppointment, setHasPendingAppointment] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState("");
  const [professionalCode, setProfessionalCode] = useState("");

  useEffect(() => {
    // Verificar si hay una reserva pendiente
    const pendingAppointment = localStorage.getItem('pending_appointment_after_verification');
    const redirect = localStorage.getItem('pending_redirect');
    const tempAppointmentData = localStorage.getItem('temp_appointment');
    
    if (pendingAppointment === "true" && redirect && tempAppointmentData) {
      const parsedTempAppointment = JSON.parse(tempAppointmentData);
      setProfessionalCode(parsedTempAppointment['profesionalCode']);
      setHasPendingAppointment(true);
      setPendingRedirect(redirect);
    }
  }, []);

  const handleLogin = () => {
    router.push("/auth/login");
  };

  const handleCheckEmail = () => {
    toast.info("Por favor verifica tu correo electrónico primero");
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#0c0a09]">
      {/* Fondos decorativos similares al hero */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0c0a09]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-gray-900/10 to-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/2 to-gray-800/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-400/3 via-transparent to-transparent"></div>
        
        {/* Efecto de luz de faro */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-100"
          style={{
            background: `conic-gradient(from 315deg at 100% 0%, 
              transparent 0deg, 
              rgba(200, 200, 210, 0.1) 30deg,
              rgba(220, 220, 230, 0.15) 45deg,
              rgba(200, 200, 210, 0.1) 60deg,
              transparent 90deg)`,
          }}
        />

        {/* Partículas de luz */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gray-300 rounded-full animate-pulse opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Resplandor central */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-25 scale-100"
          style={{
            background: "radial-gradient(circle, rgba(220, 220, 230, 0.2) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.2,
                },
              },
            },
            item: {
              hidden: { opacity: 0, filter: "blur(12px)", y: 20 },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: { type: "spring", bounce: 0.3, duration: 1.2 },
              },
            },
          }}
        >
          <Card className="relative bg-[#1a1a1a] text-white rounded-3xl shadow-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
            {/* Efecto de borde luminoso */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-gray-700/5 rounded-3xl"></div>
            
            <CardHeader className="text-center relative z-10">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/20 p-3 rounded-full border border-green-500/30">
                  <CheckCircle className="h-12 w-12 text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-medium text-white">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                  ¡Cuenta creada!
                </TextEffect>
              </CardTitle>
              <CardDescription className="text-gray-300">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} delay={0.3} as="span">
                  Revisa tu correo electrónico
                </TextEffect>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4 relative z-10">
              {/* Mensaje especial si hay reserva pendiente */}
              {hasPendingAppointment && (
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <Mail className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-400 font-medium">
                        Tienes una reserva pendiente
                      </p>
                      <p className="text-xs text-gray-300 mt-1">
                        Después de verificar tu email, inicia sesión para confirmar tu cita.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <TextEffect 
                preset="fade-in-blur" 
                speedSegment={0.3} 
                delay={0.4}
                as="p"
                className="text-sm text-gray-300 text-center"
              >
                Te hemos enviado un correo de confirmación. Por favor, revisa tu
                bandeja de entrada y haz clic en el enlace para verificar tu
                cuenta.
              </TextEffect>
              
              <TextEffect 
                preset="fade-in-blur" 
                speedSegment={0.3} 
                delay={0.5}
                as="p"
                className="text-sm text-gray-300 text-center"
              >
                Si no ves el correo, revisa tu carpeta de spam.
              </TextEffect>
              
              <div className="space-y-3">
                <Link href={`/auth/login${hasPendingAppointment ? `?redirect=/cliente-cita/${professionalCode}&from_appointment=true` : '' } `} className="block">
                  <Button 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white transition-all duration-300 ease-in-out transform hover:scale-105 rounded-xl border border-amber-400/30 shadow-lg"
                  >
                    Ir a inicio de sesión
                  </Button>
                </Link>

              </div>
            </CardContent>
          </Card>
        </AnimatedGroup>
      </div>
    </div>
  );
}