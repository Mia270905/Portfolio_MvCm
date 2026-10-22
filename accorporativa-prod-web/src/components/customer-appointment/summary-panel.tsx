"use client";

import {
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface SummaryPanelProps {
  selectedSlot: string | null;
  availableSlots: Array<{
    id: string;
    appointment_datetime: string;
    space_owner: {
      id: string;
      email: string;
      full_name?: string;
    } | null;
  }>;
  selectedDate: Date | null;
  user: any;
  loading: boolean;
  loadingSlots: boolean;
  onContinue: () => void;
  currentStep: "date" | "info" | "confirmation";
  clientInfo?: {
    full_name: string;
    email: string;
    phone: string;
  } | null;
}

export default function SummaryPanel({
  selectedSlot,
  availableSlots,
  selectedDate,
  user,
  loading,
  loadingSlots,
  onContinue,
  currentStep,
  clientInfo,
}: SummaryPanelProps) {
  const selectedSlotData = availableSlots.find((s) => s.id === selectedSlot);

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, label: "Fecha", active: currentStep === "date" },
      { number: 2, label: "Datos", active: currentStep === "info" },
      { number: 3, label: "Confirmar", active: currentStep === "confirmation" },
    ];

    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 min-w-0">
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`w-full sm:flex-1 flex items-center justify-between sm:justify-start mb-3 sm:mb-0 min-w-0`}
          >
            <div className="flex items-center min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.active
                    ? "bg-amber-500 text-white"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {step.number}
              </div>
              <span
                className={`ml-2 text-sm whitespace-nowrap max-w-full truncate ${
                  step.active ? "text-white font-medium" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="hidden sm:block flex-1 h-0.5 mx-2 bg-gray-700 min-w-[16px]"></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderAppointmentSummary = () => {
    if (!selectedSlotData || !selectedDate) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">
            {currentStep === "date"
              ? "Selecciona una fecha y horario para ver el resumen"
              : "No hay información de cita disponible"}
          </p>
        </div>
      );
    }

    const appointmentDate = new Date(selectedSlotData.appointment_datetime);

    return (
      <div className="space-y-4">
        {/* Fecha y hora */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Fecha</span>
          </div>
          <p className="text-white font-medium">
            {format(appointmentDate, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Hora</span>
          </div>
          <p className="text-white font-medium">
            {format(appointmentDate, "hh:mm a", { locale: es })}
          </p>
        </div>

        {/* Profesional */}
        {selectedSlotData.space_owner && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-400">
              <User className="w-4 h-4" />
              <span className="text-sm">Profesional</span>
            </div>
            <p className="text-white font-medium pb-4">
              {selectedSlotData.space_owner.full_name ||
                selectedSlotData.space_owner.email}
            </p>
          </div>
        )}

        {/* Datos del cliente (solo en pasos 2 y 3) */}
        {currentStep !== "date" && clientInfo && (
          <>    
            <div className="pt-4 border-t border-gray-700 space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Tus datos:</h4>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Nombre</span>
                </div>
                <p className="text-white font-medium">{clientInfo.full_name}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Email</span>
                </div>
                <p className="text-white font-medium">{clientInfo.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">Teléfono</span>
                </div>
                <p className="text-white font-medium">{clientInfo.phone}</p>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderActions = () => {
    if (currentStep === "date") {
      return (
        <Button
          onClick={onContinue}
          disabled={!selectedSlot || loading || loadingSlots}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3"
        >
          {loading || loadingSlots ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Cargando...
            </>
          ) : (
            <>
              Continuar con la reserva
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      );
    }

    if (currentStep === "info") {
      return (
        <div className="pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">
            Completa tus datos en el formulario para continuar
          </p>
        </div>
      );
    }

    // currentStep === "confirmation" (si llegas a usarlo)
    return (
      <div className="pt-4 border-t border-gray-700">
        <div className="flex items-center gap-2 text-green-400 mb-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Todos los datos completados ✓</span>
        </div>
        <p className="text-sm text-gray-400">Listo para confirmar tu reserva</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 min-w-0 overflow-hidden">
        {renderStepIndicator()}

        <h2 className="text-xl font-semibold text-white mb-6 max-w-full truncate">
          {currentStep === "date" && "Resumen de la cita"}
          {currentStep === "info" && "Tu selección"}
          {currentStep === "confirmation" && "Confirma tu Reserva"}
        </h2>

        {renderAppointmentSummary()}

        {renderActions()}
      </div>

      {/* Estado de autenticación */}
      {!user && (
        <div className="text-center p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-sm text-blue-400">
            Debes iniciar sesión para reservar una cita
          </p>
        </div>
      )}
    </div>
  );
}