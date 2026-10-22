"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ArrowLeft, User, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getRequireAccountForReservation } from "@/lib/actions/appointment.actions";


interface ConfirmationStepProps {
  appointmentDetails: {
    slotId: string;
    dateTime: Date;
    professional?: {
      name?: string;
      email?: string;
    } | null;
  };
  clientInfo: {
    full_name: string;
    email: string;
    phone: string;
  };
  user: any;
  onBack: () => void;
  onConfirm: (params: { asGuest: boolean }) => Promise<void>;
  isLoading?: boolean;
  professionalCode?: string;
  hasTempData?: boolean;
  requireAccount?: boolean;
}


export default function ConfirmationStep({ 
  appointmentDetails, 
  clientInfo, 
  user, 
  onBack, 
  onConfirm,
  isLoading = false,
  professionalCode,
  hasTempData = false,
  requireAccount = true
}: ConfirmationStepProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const router = useRouter();

  // Verificar si hay datos temporales cuando el componente se monta
  useEffect(() => {
    if (hasTempData && !user && requireAccount) {
      toast.info("Tienes una reserva pendiente. Inicia sesión para confirmarla.");
    }
  }, [hasTempData, user, requireAccount]);

         const handleConfirm = async () => {
  // 🔒 Solo bloquea si SE REQUIERE cuenta
  if (!user && requireAccount) {
      console.log("CLICK CONFIRMAR", {
    user,
    requireAccount,
    asGuest: !user,
  });
    toast.error("Debes iniciar sesión para confirmar la cita");
    return;
  }

  setIsConfirming(true);

  try {
    await onConfirm({
      asGuest: !user, // 👈 CLAVE
    });
  } catch (error) {
    console.error("Error al confirmar:", error);
    toast.error("Error al confirmar la cita");
  } finally {
    setIsConfirming(false);
  }
};

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 min-w-0 overflow-hidden">
      {/* Título - Cambia según si hay usuario o no */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            user ? "bg-green-500/20" : "bg-blue-500/20"
          }`}>
            {user ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <User className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white max-w-full truncate">
              {user || !requireAccount ? "¡Último paso!" : "¡Ya casi terminas!"}
            </h2>
            <p className="text-gray-400 mt-1">
              {user || !requireAccount
                ? "Confirma tu reserva para completar el proceso"
                : "Solo necesitas crear una cuenta o iniciar sesión para confirmar tu cita"}
            </p>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${
          user 
            ? "bg-blue-500/10 border-blue-500/30" 
            : "bg-amber-500/10 border-amber-500/30"
        }`}>
          <p className={`text-sm flex items-center gap-2 ${
            user ? "text-blue-400" : "text-amber-400"
          }`}>
            <AlertCircle className="w-4 h-4" />
            {user 
              ? "Revisa que todos los datos en el panel de resumen sean correctos antes de confirmar."
              : `Tu cita con ${clientInfo.full_name} está lista. Los datos se guardarán automáticamente.`}
          </p>
        </div>
      </div>

      {/* Contenido principal - Cambia según si hay usuario o no */}
      <div className="space-y-6">
        {!user && requireAccount ? (
          // Vista para usuarios NO autenticados
          <div className="space-y-6">

            {/* Opciones de autenticación */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-5">
              <h4 className="text-lg font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Elige cómo continuar
              </h4>
              <p className="text-sm text-gray-300 mb-6">
                Para proteger tu reserva y que puedas gestionarla después, necesitas una cuenta.
                Es rápido y seguro.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Botón de Iniciar Sesión */}
                <Button 
                  onClick={() => {
                    // Guardar datos actuales antes de redirigir
                    const tempData = {
                      slotId: appointmentDetails.slotId,
                      clientInfo,
                      profesionalCode: professionalCode,
                      dateTime: appointmentDetails.dateTime.toISOString(),
                      timestamp: new Date().toISOString(),
                    };
                    localStorage.setItem('temp_appointment', JSON.stringify(tempData));
                    localStorage.setItem('pending_appointment', "true");
                    
                    router.push(`/auth/login?redirect=/cliente-cita/${professionalCode}&from_appointment=true`);
                  }}
                  variant="outline"
                  className="w-full border-blue-500 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400 h-12"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Ya tengo cuenta
                </Button>

                {/* Botón de Registrarse */}
                <Button 
                  onClick={() => {
                    // Guardar datos actuales antes de redirigir
                    const tempData = {
                      slotId: appointmentDetails.slotId,
                      clientInfo,
                      profesionalCode: professionalCode,
                      dateTime: appointmentDetails.dateTime.toISOString(),
                      timestamp: new Date().toISOString(),
                    };
                    localStorage.setItem('temp_appointment', JSON.stringify(tempData));
                    localStorage.setItem('pending_appointment', "true");
                    
                    router.push(`/auth/sign-up?redirect=/cliente-cita/${professionalCode}&from_appointment=true`);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-12"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear cuenta nueva
                </Button>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Al crear una cuenta aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        ) : (
          // Vista para usuarios autenticados
          <>
            {/* Información importante simplificada */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Información importante
              </h4>
              <ul className="space-y-2 text-sm text-amber-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span>Recibirás un correo de confirmación en <strong>{clientInfo.email}</strong></span>
                </li>
                {hasTempData && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>Usando los datos de tu reserva temporal</span>
                  </li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* Botones de acción - CAMBIO PRINCIPAL AQUÍ */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          {/* Botón "Volver para revisar" - SIEMPRE visible */}
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full sm:flex-1 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            disabled={isConfirming || isLoading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver para revisar
          </Button>
          
          {/* Botón "Confirmar Reserva" - SOLO visible si hay usuario autenticado */}
          {(user || !requireAccount) && (
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || isLoading}
              className="w-full sm:flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-green-500/25 transition-shadow"
            >
              {isConfirming || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Reserva
                </>
              )}
            </Button>
          )}

        </div>
      </div>
    </div>
  );
}