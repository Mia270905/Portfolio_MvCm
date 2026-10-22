"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, ArrowLeft, User, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
  professionalCode?: string;
  hasTempData?: boolean;
}

export default function ConfirmationStep({ 
  appointmentDetails, 
  clientInfo, 
  user, 
  onBack, 
  onConfirm,
  isLoading = false,
  professionalCode,
  hasTempData = false
}: ConfirmationStepProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const router = useRouter();

  // Verificar si hay datos temporales cuando el componente se monta
  useEffect(() => {
    if (hasTempData && !user) {
      toast.info("Tienes una reserva pendiente. Inicia sesión para confirmarla.", {
        style: {
          backgroundColor: '#e8f4fd', 
          border: '1px solid #bbdefb',
          color: '#1565c0', 
        },
        icon: <AlertCircle className="w-5 h-5 text-[#1565c0]" />,
      });
    }
  }, [hasTempData, user]);

  const handleConfirm = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para confirmar la cita", {
        style: {
          backgroundColor: '#fdeaea', 
          border: '1px solid #ffcdd2',
          color: '#c62828',
        },
        icon: <AlertCircle className="w-5 h-5 text-[#c62828]" />,
      });
      return;
    }

    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Error al confirmar:", error);
      toast.error("Error al confirmar la cita", {
        style: {
          backgroundColor: '#fdeaea',
          border: '1px solid #ffcdd2', 
          color: '#c62828', 
        },
        icon: <AlertCircle className="w-5 h-5 text-[#c62828]" />,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="bg-custom-bg-tertiary rounded-xl border border-custom-border-secondary p-4 sm:p-6 shadow-sm w-full max-w-full overflow-hidden">
      {/* Título - Cambia según si hay usuario o no */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-start sm:items-center gap-3 mb-4">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            user ? "bg-success-bg" : "bg-info-bg"
          }`}>
            {user ? (
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-success-text" />
            ) : (
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-info-text" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-serif font-semibold text-custom-text-primary">
              {user ? "¡Último paso!" : "¡Ya casi terminas!"}
            </h2>
            <p className="text-sm sm:text-base text-custom-text-secondary mt-1 break-words">
              {user 
                ? "Confirma tu reserva para completar el proceso"
                : "Solo necesitas crear una cuenta o iniciar sesión para confirmar tu cita"}
            </p>
          </div>
        </div>

        <div className={`p-3 sm:p-4 rounded-lg border ${
          user 
            ? "bg-info-bg border-info-bg/30" 
            : "bg-custom-accent-primary/10 border-custom-accent-primary/30"
        }`}>
          <p className={`text-xs sm:text-sm flex items-start sm:items-center gap-2 ${
            user ? "text-info-text" : "text-custom-accent-primary"
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 sm:mt-0" />
            <span className="break-words">
              {user 
                ? "Revisa que todos los datos en el panel de resumen sean correctos antes de confirmar."
                : `Tu cita con ${clientInfo.full_name} está lista. Los datos se guardarán automáticamente.`}
            </span>
          </p>
        </div>
      </div>

      {/* Contenido principal - Cambia según si hay usuario o no */}
      <div className="space-y-6">
        {!user ? (
          // Vista para usuarios NO autenticados
          <div className="space-y-6">
            {/* PANEL */}
            <div className="bg-info-bg border border-info-bg/30 rounded-lg p-4 sm:p-5">
              <h4 className="text-base sm:text-lg font-serif font-semibold text-info-text mb-3 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                Elige cómo continuar
              </h4>
              <p className="text-xs sm:text-sm text-custom-text-secondary mb-4 sm:mb-6 break-words">
                Para proteger tu reserva y que puedas gestionarla después, necesitas una cuenta.
                Es rápido y seguro.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Botón de Iniciar Sesión */}
                <Button 
                  onClick={() => {
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
                  className="w-full sm:flex-1 border-info-text text-info-text hover:bg-info-bg hover:text-info-text/80 h-10 sm:h-12 transition-colors text-sm sm:text-base"
                >
                  <LogIn className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Ya tengo cuenta</span>
                </Button>

                {/* Botón de Registrarse */}
                <Button 
                  onClick={() => {
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
                  className="w-full sm:flex-1 bg-gradient-to-r from-button-primary to-button-hover hover:from-button-hover hover:to-button-primary text-white h-10 sm:h-12 transition-colors text-sm sm:text-base"
                >
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Crear cuenta nueva</span>
                </Button>
              </div>

              <p className="text-xs text-custom-text-muted mt-4 text-center break-words">
                Al crear una cuenta aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        ) : (
          // Vista para usuarios autenticados
          <>
            {/* Información importante simplificada */}
            <div className="bg-custom-accent-primary/10 border border-custom-accent-primary/30 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-semibold text-custom-accent-primary mb-2 sm:mb-3 flex items-center gap-2">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Información importante
              </h4>
              <ul className="space-y-2 text-xs sm:text-sm text-custom-text-secondary">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-custom-accent-primary mt-0.5 flex-shrink-0" />
                  <span className="break-words">
                    Recibirás un correo de confirmación en <strong className="text-custom-text-primary break-all">{clientInfo.email}</strong>
                  </span>
                </li>
                {hasTempData && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-custom-accent-primary mt-0.5 flex-shrink-0" />
                    <span className="break-words">Usando los datos de tu reserva temporal</span>
                  </li>
                )}
              </ul>
            </div>
          </>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
          {/* Botón "Volver para revisar" - SIEMPRE visible */}
          <Button
            onClick={onBack}
            variant="outline"
            className="w-full sm:flex-1 border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-secondary hover:text-custom-text-primary h-10 sm:h-12 text-sm sm:text-base"
            disabled={isConfirming || isLoading}
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
            <span className="truncate">Volver para revisar</span>
          </Button>
          
          {/* Botón "Confirmar Reserva" - SOLO visible si hay usuario autenticado */}
          {user && (
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || isLoading}
              className="w-full sm:flex-1 bg-gradient-to-r from-success-text to-success-text/80 hover:from-success-text/80 hover:to-success-text text-white shadow-lg hover:shadow-success-text/25 transition-shadow h-10 sm:h-12 text-sm sm:text-base"
            >
              {isConfirming || isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-2 flex-shrink-0"></div>
                  <span className="truncate">Confirmando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Confirmar Reserva</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}