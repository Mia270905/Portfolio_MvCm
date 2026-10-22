"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import DateStep from "@/components/customer-appointment/date-step";
import InfoStep from "@/components/customer-appointment/info-step";
import ConfirmationStep from "@/components/customer-appointment/confirmation-step";
import SummaryPanel from "@/components/customer-appointment/summary-panel";
import { bookAppointment } from "@/lib/actions/appointment.actions";
import { ArrowLeft, User } from "lucide-react"; 
import { getRequireAccountForReservation } from "@/lib/actions/appointment.actions";

interface AvailableSlot {
  id: string;
  appointment_datetime: string;
  space_owner: {
    id: string;
    email: string;
    full_name?: string;
    user_code?: string;
  } | null;
}

type AppointmentStep = "date" | "info" | "confirmation";

export default function ProfesionalAppointmentPage() {
  const [currentStep, setCurrentStep] = useState<AppointmentStep>("date");
  const [requireAccount, setRequireAccount] = useState(true);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  // IMPORTANTE: Separamos datos temporales de datos del usuario
  const [temporaryClientInfo, setTemporaryClientInfo] = useState<{
    full_name: string;
    email: string;
    phone: string;
    notes?: string;
  } | null>(null);

  const [spaceOwnerId, setSpaceOwnerId] = useState<string | null>(null);
  const [loadingProfesional, setLoadingProfesional] = useState(true);
  const [profesionalName, setProfesionalName] = useState<string>("");
  const [configLoaded, setConfigLoaded] = useState(false);
  const [hasTempData, setHasTempData] = useState(false);

  const router = useRouter();
  const params = useParams();
  const mainRef = useRef<HTMLDivElement | null>(null);

  const profesionalCode = params?.id as string;
  const supabase = createClient();

  const checkSlotAvailability = async (slotId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, status_id")
        .eq("id", slotId)
        .eq("status_id", "517e3cc0-0763-4fd0-9195-756fe4617706")
        .is("client_name", null)
        .is("client_email", null)
        .is("client_phone", null)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking slot availability:", error);
      return false;
    }
  };
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getRequireAccountForReservation();
        setRequireAccount(config?.value !== "false");
      } catch (error) {
        console.error("Error cargando require_account_for_reservation", error);
      }
    };

    loadConfig();
  }, []);

  // Obtener ID del profesional por su user_code
  useEffect(() => {
    const fetchProfesionalId = async () => {
      if (!profesionalCode || profesionalCode.trim() === "") {
        toast.error("URL inválida - No se especificó el profesional");
        router.push("/cliente-cita");
        return;
      }

      try {
        setLoadingProfesional(true);

        const { data, error } = await supabase
          .from("users")
          .select("id, email, full_name, user_code, active")
          .eq("user_code", profesionalCode)
          .eq("active", true)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            toast.error(
              `El profesional "${profesionalCode}" no existe en la base de datos`
            );
          } else {
            toast.error(`Error técnico: ${error.message}`);
          }
          router.push("/cliente-cita");
          return;
        }

        if (!data) {
          toast.error(`El profesional "${profesionalCode}" no está disponible`);
          router.push("/cliente-cita");
          return;
        }

        setSpaceOwnerId(data.id);
        setProfesionalName(data.full_name || data.email || profesionalCode);
      } catch (error: any) {
        console.error("Error inesperado:", error);
        toast.error(
          `Error: ${error.message || "No se pudo cargar la información"}`
        );
        router.push("/cliente-cita");
      } finally {
        setLoadingProfesional(false);
      }
    };

    if (profesionalCode && profesionalCode.trim() !== "") {
      fetchProfesionalId();
    }
  }, [profesionalCode, supabase, router]);

  // Obtener usuario actual
  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error obteniendo usuario auth:", error);
        }

        setUser(user);
      } catch (error) {
        console.error("Error inesperado al obtener usuario:", error);
      } finally {
        setLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  // Verificar datos temporales al cargar la página
  useEffect(() => {
    const checkTempData = async () => {
      const tempData = localStorage.getItem("temp_appointment");
      if (tempData) {
        try {
          const parsed = JSON.parse(tempData);

          // Verificar que sea para este profesional
          if (parsed.profesionalCode === profesionalCode) {
            // VERIFICAR SI EL SLOT SIGUE DISPONIBLE
            const isSlotAvailable = await checkSlotAvailability(parsed.slotId);
            
            if (!isSlotAvailable) {
              // Slot ya no está disponible
              toast.error("El horario seleccionado ya no está disponible. Lo invitamos a seleccionar otro.");
              localStorage.removeItem("temp_appointment");
              localStorage.removeItem("pending_appointment");
              localStorage.removeItem("pending_appointment_after_verification");
              
              // Resetear estado
              setHasTempData(false);
              setSelectedSlot(null);
              setTemporaryClientInfo(null);
              setCurrentStep("date");
              return;
            }

            setHasTempData(true);

            // Solo cargar datos si no estamos ya en confirmation
            if (currentStep !== "confirmation") {
              setSelectedSlot(parsed.slotId);
              setTemporaryClientInfo(parsed.clientInfo);

              // También cargar la fecha del slot si existe
              if (parsed.dateTime) {
                const slotDate = new Date(parsed.dateTime);
                setSelectedDate(slotDate);
              }

              const pendingAppointmentAfter = localStorage.getItem(
                "pending_appointment_after_verification"
              );
              const pendingAppointment = localStorage.getItem(
                "pending_appointment"
              );

              if (pendingAppointmentAfter === "true" || pendingAppointment === "true") {
                setCurrentStep("confirmation");
              }
              localStorage.removeItem("pending_appointment_after_verification");
              localStorage.removeItem("pending_appointment");
            }
          }
        } catch (error) {
          console.error("Error procesando datos temporales:", error);
        }
      }
    };

    if (!loadingProfesional && spaceOwnerId) {
      checkTempData();
    }
  }, [loadingProfesional, spaceOwnerId, profesionalCode, currentStep]);

  // Solo establecer la fecha inicial cuando el profesional y config estén cargados
  useEffect(() => {
    if (spaceOwnerId && configLoaded && !hasTempData) {
      setTimeout(() => {
        const today = new Date();
        setSelectedDate(today);
      }, 100);
    }
  }, [spaceOwnerId, configLoaded, hasTempData]);

  // Obtener slots para el día seleccionado
  useEffect(() => {
    const fetchDaySlots = async () => {
      if (!selectedDate || !spaceOwnerId) {
        return;
      }

      try {
        setLoadingSlots(true);

        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from("appointments")
          .select(
            `
              id,
              appointment_datetime,
              space_owner:space_owner_user_id (
                id, 
                email, 
                full_name,
                user_code
              )
            `
          )
          .eq("status_id", "517e3cc0-0763-4fd0-9195-756fe4617706")
          .eq("space_owner_user_id", spaceOwnerId)
          .is("client_name", null)
          .is("client_email", null)
          .is("client_phone", null)
          .is("deleted_at", null)
          .gte("appointment_datetime", startDate.toISOString())
          .lte("appointment_datetime", endDate.toISOString())
          .order("appointment_datetime", { ascending: true });

        if (error) {
          console.error("Error consulta slots:", error);
          toast.error("Error al cargar los horarios");
          return;
        }

        const formattedSlots: AvailableSlot[] = (data || []).map(
          (slot: any) => ({
            id: slot.id,
            appointment_datetime: slot.appointment_datetime,
            space_owner: Array.isArray(slot.space_owner)
              ? slot.space_owner[0] || null
              : slot.space_owner || null,
          })
        );

        setAvailableSlots(formattedSlots);

        // Si hay datos temporales, mantener el slot seleccionado
        if (!hasTempData) {
          setSelectedSlot(null);
        }
      } catch (error) {
        console.error("Error al obtener horarios:", error);
        toast.error("Error al cargar los horarios del día");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchDaySlots();
  }, [selectedDate, supabase, spaceOwnerId, hasTempData]);

  // Efecto para limpiar datos temporales VIEJOS (más de 1 hora)
  useEffect(() => {
    const cleanupOldTempData = () => {
      const tempData = localStorage.getItem("temp_appointment");
      if (tempData) {
        try {
          const parsed = JSON.parse(tempData);
          const timestamp = new Date(parsed.timestamp);
          const now = new Date();
          const hoursDiff =
            (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

          // Borrar datos con más de 1 hora
          if (hoursDiff > 1) {
            localStorage.removeItem("temp_appointment");
            localStorage.removeItem("pending_appointment");
            localStorage.removeItem("pending_appointment_after_verification");
            console.log("Datos temporales antiguos eliminados");
          }

          // También verificar si el slot todavía existe
          if (spaceOwnerId && parsed.slotId) {
            const checkSlotStillExists = async () => {
              const { data: slotCheck } = await supabase
                .from("appointments")
                .select("id")
                .eq("id", parsed.slotId)
                .eq("status_id", "517e3cc0-0763-4fd0-9195-756fe4617706")
                .single();

              if (!slotCheck) {
                localStorage.removeItem("temp_appointment");
                localStorage.removeItem("pending_appointment");
                localStorage.removeItem("pending_appointment_after_verification");

                setHasTempData(false);
                console.log(
                  "Slot ya no disponible, eliminando datos temporales"
                );
              }
            };

            checkSlotStillExists();
          }
        } catch (error) {
          console.error("Error limpiando datos temporales:", error);
        }
      }
    };

    if (!loadingProfesional) {
      cleanupOldTempData();
    }
  }, [loadingProfesional, spaceOwnerId, supabase]);

  // Función para notificar que la configuración está cargada
  const handleConfigLoaded = () => {
    setConfigLoaded(true);
  };

  const handleSelectSlot = (slotId: string | null) => {
    setSelectedSlot(slotId);
    // Si selecciona un slot nuevo, limpiar datos temporales
    if (slotId && hasTempData) {
      localStorage.removeItem("temp_appointment");
      setHasTempData(false);
      setTemporaryClientInfo(null);
    }
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    // Si cambia la fecha, limpiar datos temporales
    if (hasTempData) {
      localStorage.removeItem("temp_appointment");
      setHasTempData(false);
      setTemporaryClientInfo(null);
      setCurrentStep("date");
    }
  };

  // Permitir continuar sin sesión
  const handleDateStepContinue = () => {
    if (!selectedSlot) {
      toast.error("Por favor selecciona un horario");
      return;
    }

    // USUARIOS NO AUTENTICADOS PUEDEN CONTINUAR
    setCurrentStep("info");
    setTimeout(() => mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const handleInfoStepBack = () => {
    setCurrentStep("date");
  };

  // Guardar info del cliente (temporal o del usuario)
  const handleInfoStepContinue = (info: {
    full_name: string;
    email: string;
    phone: string;
    notes?: string;
  }) => {
    // Guardar como datos temporales si no hay usuario
    if (!user) {
      setTemporaryClientInfo(info);

      // También guardar en localStorage para persistencia
      const tempData = {
        slotId: selectedSlot,
        clientInfo: info,
        profesionalCode,
        profesionalName,
        dateTime: selectedSlotData
          ? new Date(selectedSlotData.appointment_datetime).toISOString()
          : null,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("temp_appointment", JSON.stringify(tempData));
      setHasTempData(true);
    } else {
      // Si hay usuario, no guardar como temporal
      setTemporaryClientInfo(info);
    }

    setCurrentStep("confirmation");
    setTimeout(() => mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const handleConfirmationStepBack = () => {
    setCurrentStep("info");
  };

 // Manejar confirmación
const handleConfirmAppointment = async () => {
  if (!selectedSlot || !temporaryClientInfo) {
    toast.error("Faltan datos para confirmar la cita");
    return;
  }

  // 🔐 SOLO pedir login si el switch lo exige
  if (!user && requireAccount) {
    const tempAppointmentData = {
      slotId: selectedSlot,
      clientInfo: temporaryClientInfo,
      profesionalCode,
      profesionalName,
      dateTime: selectedSlotData
        ? new Date(selectedSlotData.appointment_datetime).toISOString()
        : null,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(
      "temp_appointment",
      JSON.stringify(tempAppointmentData)
    );
    setHasTempData(true);

    router.push(
      `/auth/login?redirect=/cliente-cita/${profesionalCode}&from_appointment=true`
    );
    return;
  }

  // ✅ Confirmar cita (con o sin usuario)
  try {
    setIsConfirming(true);

    const result = await bookAppointment(
      selectedSlot,
      temporaryClientInfo,
      user?.id ?? null // 👈 importante
    );

    if (result.success) {
      toast.success("¡Cita confirmada exitosamente!");

      // Limpiar datos temporales
      localStorage.removeItem("temp_appointment");
      setHasTempData(false);
      setTemporaryClientInfo(null);
      setSelectedSlot(null);
      setAvailableSlots((prev) => prev.filter((s) => s.id !== selectedSlot));

      setTimeout(() => {
        router.push(`/appointments/history/${result.appointmentId}`);
      }, 1500);
    } else {
      toast.error(result.message || "Error al confirmar la cita");

      if (
        result.message?.includes("no está disponible") ||
        result.message?.includes("ya fue reservada") ||
        result.message?.includes("selecciona otro horario")
      ) {
        setAvailableSlots((prev) =>
          prev.filter((s) => s.id !== selectedSlot)
        );
        setSelectedSlot(null);
        setCurrentStep("date");

        localStorage.removeItem("temp_appointment");
        setHasTempData(false);

        toast.info(
          "El horario seleccionado ya no está disponible. Por favor, selecciona otro."
        );
      }
    }
  } catch (error) {
    console.error("Error al confirmar cita:", error);
    toast.error("Error al confirmar la cita. Por favor intenta nuevamente.");
  } finally {
    setIsConfirming(false);
  }
};


  // Mostrar estado de carga
  if (loadingProfesional) {
    return (
      <div className="min-h-screen bg-custom-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-button-primary mx-auto mb-4"></div>
          <p className="text-gray-300 mb-2">Buscando profesional...</p>
          <p className="text-gray-400 text-sm">
            Código: {profesionalCode || "cargando..."}
          </p>
        </div>
      </div>
    );
  }

  if (!spaceOwnerId) {
    return (
      <div className="min-h-screen bg-custom-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <ArrowLeft className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Profesional no disponible
          </h2>
          <p className="text-gray-400 mb-2">
            No se pudo encontrar el profesional:
          </p>
          <p className="text-custom-accent-primary font-mono mb-6">{profesionalCode}</p>
          <Button
            onClick={() => router.push("/cliente-cita")}
            className="bg-button-primary hover:bg-button-hover text-white"
          >
            Ver todos los profesionales
          </Button>
        </div>
      </div>
    );
  }

  const selectedSlotData = availableSlots.find((s) => s.id === selectedSlot);

  // Determinar qué datos mostrar en info-step
  const getInitialDataForInfoStep = () => {
    // 1. PRIORIDAD: Datos temporales (si existen)
    if (hasTempData && temporaryClientInfo) {
      console.log("INFO: Cargando datos TEMPORALES para info-step");
      return temporaryClientInfo;
    }

    // 2. Datos que ya estaban en el formulario (si el usuario vuelve atrás)
    if (temporaryClientInfo) {
      console.log("INFO: Cargando datos del estado temporal");
      return temporaryClientInfo;
    }

    // 3. Datos del usuario autenticado (SOLO si no hay datos temporales)
    if (user && !hasTempData) {
      console.log("INFO: Cargando datos del USUARIO autenticado");
      return {
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: "", // No precargamos teléfono - usuario lo escribe cada vez
        notes: "",
      };
    }

    // 4. Vacío
    return undefined;
  };

  // Determinar qué datos mostrar en confirmation-step
  const getClientInfoForConfirmation = () => {
    if (hasTempData && temporaryClientInfo) {
      return temporaryClientInfo; // Datos temporales tienen prioridad
    } else if (temporaryClientInfo) {
      return temporaryClientInfo; // Datos del info-step
    } else if (user) {
      // Datos del usuario como fallback
      return {
        full_name: user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: "", // No precargamos teléfono - usuario lo escribe cada vez
        notes: "",
      };
    }
    return null;
  };

  const clientInfoForConfirmation = getClientInfoForConfirmation();

  return (
    <div className="min-h-screen bg-custom-bg-primary min-w-0 overflow-x-hidden">
      {/* Header Mobile */}
      <div className="lg:hidden bg-custom-bg-secondary border-b border-custom-border-primary sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/cliente-cita")}
              className="flex items-center gap-2 text-custom-text-secondary hover:text-custom-accent-primary transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden xs:inline">Atrás</span>
            </button>

            <div className="flex-1 flex flex-col items-center mx-2 min-w-0">
              <h1 className="text-lg font-bold text-custom-text-primary text-center max-w-full truncate">
                Reservar con <span className="text-custom-accent-primary">{profesionalName}</span>
              </h1>
              <p className="text-xs text-custom-text-muted mt-1 text-center">
                {currentStep === "date" && "Selecciona fecha y hora"}
                {currentStep === "info" && "Tus datos"}
                {currentStep === "confirmation" &&
                  (!user ? "Inicia sesión para confirmar" : "Confirmación")}
              </p>
            </div>

            <div className="w-14 flex-shrink-0 flex justify-end">
              {user ? (
                <Link href="/profile" className="flex items-center">
                  <User className="w-5 h-5 text-custom-accent-primary sm:hidden" />
                  <span className="text-xs text-custom-accent-primary font-medium hidden sm:inline">
                    Perfil
                  </span>
                </Link>
              ) : (
                <Link href="/auth/login" className="flex items-center">
                  <User className="w-5 h-5 text-custom-accent-primary sm:hidden" />
                  <span className="text-xs text-custom-accent-primary font-medium hidden sm:inline">
                    Iniciar sesión
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Header Desktop */}
      <div className="hidden lg:block bg-custom-bg-secondary border-b border-custom-border-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-custom-text-primary">
                Reservar cita con{" "}
                <span className="text-custom-accent-primary">{profesionalName}</span>
              </h1>
              <p className="text-gray-500 mt-2">
                {currentStep === "date" &&
                  "Selecciona la fecha y hora para tu cita"}
                {currentStep === "info" && "Completa tus datos de contacto"}
                {currentStep === "confirmation" &&
                  (!user
                    ? "Inicia sesión o regístrate para confirmar tu reserva"
                    : "Confirma tu reserva")}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/cliente-cita">
                <Button
                  variant="outline"
                  className="border-custom-border-primary text-custom-text-secondary hover:bg-custom-bg-tertiary hover:text-custom-text-primary"
                >
                  Ver todos los profesionales
                </Button>
              </Link>
              {user ? (
                <Link href="/profile">
                  <Button
                    variant="outline"
                    className="border-custom-accent-primary text-custom-accent-primary hover:bg-custom-accent-primary/10"
                  >
                    Volver al perfil
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button className="bg-button-primary hover:bg-button-hover text-white">
                    Iniciar sesión
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div ref={mainRef} className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
          <div className="lg:col-span-2 min-w-0">
            {currentStep === "date" && (
              <DateStep
                selectedSlot={selectedSlot}
                onSelectSlot={handleSelectSlot}
                onSelectDate={handleSelectDate}
                selectedDate={selectedDate}
                user={user}
                spaceOwnerId={spaceOwnerId || undefined}
                onConfigLoaded={handleConfigLoaded}
              />
            )}

            {currentStep === "info" && selectedSlotData && (
              <InfoStep
                user={user}
                appointmentDetails={{
                  slotId: selectedSlot!,
                  dateTime: new Date(selectedSlotData.appointment_datetime),
                  professional: selectedSlotData.space_owner
                    ? {
                        name: selectedSlotData.space_owner.full_name || "",
                        email: selectedSlotData.space_owner.email || "",
                      }
                    : null,
                }}
                onBack={handleInfoStepBack}
                onContinue={handleInfoStepContinue}
                initialData={getInitialDataForInfoStep()}
                isTempData={hasTempData}
              />
            )}

            {currentStep === "confirmation" &&
              selectedSlotData &&
              clientInfoForConfirmation && (
                <ConfirmationStep
                  appointmentDetails={{
                    slotId: selectedSlot!,
                    dateTime: new Date(selectedSlotData.appointment_datetime),
                    professional: selectedSlotData.space_owner
                      ? {
                          name: selectedSlotData.space_owner.full_name || "",
                          email: selectedSlotData.space_owner.email || "",
                        }
                      : null,
                  }}
                  clientInfo={clientInfoForConfirmation}
                  user={user}
                  onBack={handleConfirmationStepBack}
                  onConfirm={handleConfirmAppointment}
                  isLoading={isConfirming}
                  professionalCode={profesionalCode}
                  hasTempData={hasTempData}
                />
              )}
          </div>

          <div className="lg:sticky lg:top-24 h-fit min-w-0">
            <SummaryPanel
              selectedSlot={selectedSlot}
              availableSlots={availableSlots}
              selectedDate={selectedDate}
              user={user}
              loading={loading}
              loadingSlots={loadingSlots}
              onContinue={handleDateStepContinue}
              currentStep={currentStep}
              clientInfo={clientInfoForConfirmation}
            />
          </div>
        </div>
      </div>
    </div>
  );
}