"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, LogOut, Clock, CheckCircle } from "lucide-react";
import { 
  toggleAttendance, 
  getAttendanceReasons,
  type AttendanceReason,
  type AttendanceTransaction
} from "@/lib/actions/attendance.actions";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AttendanceCheckInProps {
  onCheckInOutSuccess?: () => void;
  initialData?: {
    user: {
      id: string;
      full_name?: string;
      email?: string;
      avatarUrl?: string;
    } | null;
    lastRecord?: AttendanceTransaction | null;
  };
}

export default function AttendanceCheckIn({ 
  onCheckInOutSuccess,
  initialData 
}: AttendanceCheckInProps) {
  // Usar refs para evitar cargas duplicadas
  const hasLoadedReasons = useRef(false);
  const isProcessing = useRef(false);
  
  const [currentUser] = useState(initialData?.user || null);
  const [reasonId, setReasonId] = useState<string>("");
  const [reasons, setReasons] = useState<AttendanceReason[]>([]);
  const [lastRecord, setLastRecord] = useState<AttendanceTransaction | null>(
    initialData?.lastRecord || null
  );
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Hora actual
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cargar razones una sola vez cuando hay usuario
  useEffect(() => {
    if (!currentUser?.id || hasLoadedReasons.current) {
      return;
    }

    hasLoadedReasons.current = true;

    const loadReasons = async () => {
      try {
        setLoading(true);
        const reasonsData = await getAttendanceReasons();
        setReasons(reasonsData);
        
        // Establecer motivo por defecto
        const defaultReason = reasonsData.find(reason => 
          reason.description?.toLowerCase().includes("horario laboral") ||
          reason.description?.toLowerCase().includes("laboral")
        ) || reasonsData[0];
        
        if (defaultReason) {
          setReasonId(defaultReason.id);
        }
      } catch (error) {
        console.error("Error loading reasons:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReasons();
  }, [currentUser?.id]);

  // Determinar próxima acción
  const nextActionType = !lastRecord || lastRecord.event_type === "check-out" 
    ? "check-in" 
    : "check-out";

  const filteredReasons = useMemo(() => {
    if (nextActionType === "check-in") {
      return reasons.filter(reason => 
        reason.applies_to === "IN" || reason.applies_to === "BOTH"
      );
    } else {
      return reasons.filter(reason => 
        reason.applies_to === "OUT" || reason.applies_to === "BOTH"
      );
    }
  }, [reasons, nextActionType]);

  // Actualizar reasonId cuando cambien las razones filtradas
  useEffect(() => {
    if (filteredReasons.length > 0 && !reasonId) {
      const defaultReason = filteredReasons.find(reason => 
        reason.description?.toLowerCase().includes("horario laboral") ||
        reason.description?.toLowerCase().includes("laboral")
      ) || filteredReasons[0];
      
      if (defaultReason) {
        setReasonId(defaultReason.id);
      }
    }
  }, [filteredReasons, reasonId]);

  const handleCheckInOut = async () => {
    if (!currentUser?.id) {
      setMessage({
        type: "error",
        text: "No se pudo identificar el usuario"
      });
      return;
    }

    // Prevenir múltiples ejecuciones simultáneas
    if (isProcessing.current || checking) {
      return;
    }

    isProcessing.current = true;
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
        
        // Actualizar motivo al siguiente disponible
        const nextDefaultReason = filteredReasons.find(reason => 
          reason.description?.toLowerCase().includes("horario laboral") ||
          reason.description?.toLowerCase().includes("laboral")
        ) || filteredReasons[0];
        
        if (nextDefaultReason) {
          setReasonId(nextDefaultReason.id);
        }

        // Llamar callback para refrescar historial
        if (onCheckInOutSuccess) {
          onCheckInOutSuccess();
        }

        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({
          type: "error",
          text: result.message
        });
      }
    } catch (error) {
      console.error("Error en check-in/out:", error);
      setMessage({
        type: "error",
        text: "Error al procesar la solicitud"
      });
    } finally {
      setChecking(false);
      isProcessing.current = false;
    }
  };

  // Renderizar skeleton si está cargando
  if (loading) {
    return <CheckInSkeleton />;
  }

  // Renderizar error si no hay usuario
  if (!currentUser) {
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

  const nextAction = !lastRecord || lastRecord.event_type === "check-out" 
    ? { 
        type: "check-in", 
        label: "Entrada", 
        icon: LogIn, 
        bgColor: "bg-green-600 hover:bg-green-700"
      }
    : { 
        type: "check-out", 
        label: "Salida", 
        icon: LogOut, 
        bgColor: "bg-[oklch(0.4_0.17_27.1)] hover:bg-[oklch(0.45_0.17_27.1)]"
      };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-6">
          {/* Encabezado con información del usuario */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                  {format(currentTime, "hh:mm:ss a")}
                </div>
                <div className="text-xs text-gray-400">
                  {format(currentTime, "PP", { locale: es })}
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
                    {format(new Date(lastRecord.ocurred_at), "hh:mm a", { locale: es })}
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

          {/* Selector de motivo */}
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
            disabled={checking || !reasonId}
            className={`w-full py-6 text-lg font-bold ${nextAction.bgColor} transition-all hover:scale-[1.02] text-white disabled:opacity-50 disabled:cursor-not-allowed`}
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CheckInSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
          <div className="h-12 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </CardContent>
    </Card>
  );
}