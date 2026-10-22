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
import { CheckCircle, Mail } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { TextEffect } from "@/components/ui/text-effect";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SignUpSuccessPage() {
  const router = useRouter();
  const [hasPendingAppointment, setHasPendingAppointment] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState("");
  const [professionalCode, setProfessionalCode] = useState("");

  useEffect(() => {
    const pendingAppointment = localStorage.getItem(
      "pending_appointment_after_verification"
    );
    const redirect = localStorage.getItem("pending_redirect");
    const tempAppointmentData = localStorage.getItem("temp_appointment");

    if (pendingAppointment === "true" && redirect && tempAppointmentData) {
      const parsed = JSON.parse(tempAppointmentData);
      setProfessionalCode(parsed["profesionalCode"]);
      setHasPendingAppointment(true);
      setPendingRedirect(redirect);
    }
  }, []);
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center px-6 pt-28 pb-16 bg-[#faf8f3]">
      {/* Fondo suave */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#faf8f3]" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-[#c6a365]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <AnimatedGroup>
          <Card className="relative bg-white text-[#1f1a17] rounded-3xl shadow-xl border border-[#c6a365]/30 overflow-hidden">
            {/* Fondo del card */}
            <div className="absolute inset-0 bg-[#faf8f3] pointer-events-none" />

            <CardHeader className="text-center relative z-10">
              <div className="flex justify-center mb-4">
                <div className="bg-green-500/15 p-3 rounded-full border border-green-500/30">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <CardTitle className="text-2xl font-medium text-[#c6a365]">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                  ¡Cuenta creada!
                </TextEffect>
              </CardTitle>

              <CardDescription className="text-[#7b746b]">
                <TextEffect
                  preset="fade-in-blur"
                  speedSegment={0.3}
                  delay={0.2}
                  as="span"
                >
                  Revisa tu correo electrónico
                </TextEffect>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 relative z-10">
              {/* Reserva pendiente */}
              {hasPendingAppointment && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-full">
                      <Mail className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600">
                        Tienes una reserva pendiente
                      </p>
                      <p className="text-xs text-[#7b746b] mt-1">
                        Verifica tu correo y luego inicia sesión para confirmarla.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-[#7b746b] text-center">
                Te enviamos un correo de confirmación. Haz clic en el enlace para
                activar tu cuenta.
              </p>

              <p className="text-sm text-[#7b746b] text-center">
                Si no lo ves, revisa spam.
              </p>

              <Link
                href={`/auth/login${
                  hasPendingAppointment
                    ? `?redirect=/cliente-cita/${professionalCode}&from_appointment=true`
                    : ""
                }`}
                className="block"
              >
                <Button className="w-full bg-[#c6a365] hover:bg-[#b58f4f] text-white rounded-xl transition-all duration-300 hover:scale-105">
                  Ir a inicio de sesión
                </Button>
              </Link>
            </CardContent>
          </Card>
        </AnimatedGroup>
      </div>
    </div>
  );
}
