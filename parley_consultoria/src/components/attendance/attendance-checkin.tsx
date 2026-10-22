"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, LogOut, User, Clock, CheckCircle } from "lucide-react";
import { 
  toggleAttendance, 
  getLastAttendanceRecord,
  getAttendanceReasons,
  type AttendanceReason,
  type AttendanceTransaction
} from "@/lib/actions/attendance.actions";
import { fetchUserProfile } from "@/lib/actions/user.actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define la interface de props
interface AttendanceCheckInProps {
  onCheckInOutSuccess?: () => void;
}

// Recibe las props en la función
export default function AttendanceCheckIn({ onCheckInOutSuccess }: AttendanceCheckInProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [reasonId, setReasonId] = useState<string>("");
  const [reasons, setReasons] = useState<AttendanceReason[]>([]);
  const [lastRecord, setLastRecord] = useState<AttendanceTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [errors, setErrors] = useState<boolean | null>(null);

  // Cargar datos del usuario actual
  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadRecordAndReasons();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    // Buscar el motivo "Por horario laboral" por defecto
    const defaultReason = reasons.find(reason => 
      reason.name?.toLowerCase().includes("laboral") || 
      reason.description?.toLowerCase().includes("horario laboral") ||
      reason.name === "Horario laboral" ||
      reason.description === "Por horario laboral"
    );
    
    if (defaultReason) {
      setReasonId(defaultReason.id);
    }
  }, [reasons]);

  const loadRecordAndReasons = async () => {
    try{
      await loadLastRecord();
      await loadReasons();
    } catch ( error ){
      setErrors(true);
    } finally {
      setLoading(false);
    }
    
  }

  const loadUserData = async () => {
    try {
      const { profile, user } = await fetchUserProfile();
      if (profile && user) {
        setCurrentUser({
          ...profile,
          avatarUrl: user.user_metadata?.avatar_url,
          email: user.email,
          id: user.id
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const loadLastRecord = async () => {
    if (!currentUser?.id) return;
    
    try {
      const record = await getLastAttendanceRecord(currentUser.id);
      setLastRecord(record);
    } catch (error) {
      console.error("Error loading last record:", error);
    }
  };

  const loadReasons = async () => {
    try {
      const reasonsData = await getAttendanceReasons();
      setReasons(reasonsData);
    } catch (error) {
      console.error("Error loading reasons:", error);
    }
  };

  // Determinar el próximo tipo de evento
  const nextActionType = !lastRecord || lastRecord.event_type === "check-out" 
    ? "check-in" 
    : "check-out";

  // Filtrar motivos según el tipo de evento
  const filteredReasons = useMemo(() => {
    if (nextActionType === "check-in") {
      // Para check-in: mostrar motivos con applies_to = "IN" o "BOTH"
      return reasons.filter(reason => 
        reason.applies_to === "IN" || reason.applies_to === "BOTH"
      );
    } else {
      // Para check-out: mostrar motivos con applies_to = "OUT" o "BOTH"
      return reasons.filter(reason => 
        reason.applies_to === "OUT" || reason.applies_to === "BOTH"
      );
    }
  }, [reasons, nextActionType]);

  const defaultReason = useMemo(() => {
    return filteredReasons.find(reason => 
      reason.name?.toLowerCase().includes("laboral") || 
      reason.description?.toLowerCase().includes("horario laboral") ||
      reason.name === "Horario laboral" ||
      reason.description === "Por horario laboral"
    );
  }, [filteredReasons]);

  // Establecer el motivo por defecto si está disponible
  useEffect(() => {
    if (defaultReason && !reasonId) {
      setReasonId(defaultReason.id);
    }
  }, [defaultReason, reasonId]);

  const handleCheckInOut = async () => {
    if (!currentUser?.id) {
      setMessage({
        type: "error",
        text: "No se pudo identificar el usuario"
      });
      return;
    }

    setChecking(true);
    setMessage(null);

    try {
      const result = await toggleAttendance(
        currentUser.id,
        reasonId || undefined
      );

      if (result.success && result.data) {
        setMessage({
          type: "success",
          text: result.message
        });
        setLastRecord(result.data);
        
        // Resetear al motivo por defecto después de registrar
        if (defaultReason) {
          setReasonId(defaultReason.id);
        }
        
        // Llamar a la función para refrescar el historial
        if (onCheckInOutSuccess) {
          onCheckInOutSuccess();
        }

        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        setMessage({
          type: "error",
          text: result.message
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Error al procesar la solicitud"
      });
    } finally {
      setChecking(false);
    }
  };

  const nextAction = !lastRecord || lastRecord.event_type === "check-out" 
    ? { 
        type: "check-in", 
        label: "Entrada", 
        icon: LogIn, 
        bgColor: "bg-green-600 hover:bg-green-700",
        textColor: "text-white"
      }
    : { 
        type: "check-out", 
        label: "Salida", 
        icon: LogOut, 
        bgColor: "bg-[oklch(0.4_0.17_27.1)] hover:bg-[oklch(0.45_0.17_27.1)]",
        textColor: "text-white" 
      };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
            <p className="text-gray-400">Cargando información...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUser || errors) {
    return (
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="py-12">
          <div className="text-center">
            <p className="text-gray-400">No se pudo cargar la información del usuario</p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-6">
          {/* Encabezado con información del usuario */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Información del usuario */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-yellow-500">
                {currentUser?.avatarUrl ? (
                  <AvatarImage 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.full_name || "Usuario"}
                  />
                ) : (
                  <AvatarFallback className="bg-yellow-500 text-gray-900 text-lg font-bold">
                    {currentUser?.full_name?.charAt(0) || currentUser?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-semibold text-white truncate">
                  {currentUser?.full_name || currentUser?.email?.split('@')[0] || "Usuario"}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  {currentUser?.email || "usuario@email.com"}
                </p>
              </div>
            </div>
            
            {/* Hora actual */}
            <div className="sm:text-right">
              <div className="flex flex-col sm:block">
                <div className="text-sm text-gray-400">Hora actual</div>
                <div className="text-lg font-mono text-white">
                  {format(new Date(), "HH:mm")}
                </div>
                <div className="text-xs text-gray-400">
                  {format(new Date(), "PP", { locale: es })}
                </div>
              </div>
            </div>
          </div>

          {/* Información del último registro */}
          {lastRecord && (
            <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Último registro
                </h4>
                <span className={`px-3 py-1 rounded-full text-xs font-medium self-start sm:self-auto ${
                  lastRecord.event_type === "check-in" 
                    ? "bg-green-900/30 text-green-300 border border-green-700" 
                    : "bg-[oklch(0.4_0.17_27.1)]/30 text-white border border-[oklch(0.4_0.17_27.1)]"
                }`}>
                  {lastRecord.event_type === "check-in" ? "Entrada" : "Salida"}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Fecha:</span>
                  <p className="text-white">
                    {format(new Date(lastRecord.ocurred_at), "PP", { locale: es })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Hora:</span>
                  <p className="text-white">
                    {format(new Date(lastRecord.ocurred_at), "p", { locale: es })}
                  </p>
                </div>
                {lastRecord.reason && (
                  <div className="col-span-1 sm:col-span-2">
                    <span className="text-gray-400">Motivo:</span>
                    <p className="text-white">{lastRecord.reason.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Motivo
            </label>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {filteredReasons.map((reason) => (
                  <SelectItem 
                    key={reason.id} 
                    value={reason.id}
                    className="text-white hover:bg-gray-800"
                  >
                    {reason.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mensajes */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.type === "success" 
                ? "bg-green-900/20 border-green-700 text-green-300" 
                : message.type === "error"
                ? "bg-red-900/20 border-red-700 text-red-300"
                : "bg-blue-900/20 border-blue-700 text-blue-300"
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {message.text}
              </div>
            </div>
          )}

          {/* Botón principal */}
          <Button
            onClick={handleCheckInOut}
            disabled={checking}
            className={`w-full py-6 text-lg font-bold ${nextAction.bgColor} transition-all hover:scale-[1.02] ${nextAction.textColor}`}
          >
            {checking ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <nextAction.icon className="w-5 h-5 mr-2" />
                Registrar {nextAction.label}
              </>
            )}
          </Button>

          {/* Indicador de próxima acción */}
          <div className="text-center text-sm text-gray-400 pt-2 border-t border-gray-700">
            <p>
              Próxima acción:{" "}
              <span className="text-yellow-400 font-medium">
                {nextAction.label}
              </span>
            </p>
            <p className="mt-1 text-xs">
              Última actualización: {format(new Date(), "HH:mm")}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              La hora es fija, se actualiza cada que se checa entrada o salida
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}