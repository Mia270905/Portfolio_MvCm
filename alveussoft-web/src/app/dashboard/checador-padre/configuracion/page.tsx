"use client";

import { useState, useEffect } from "react";
import { Clock, Edit, CheckCircle, XCircle, AlertCircle, Loader2, ArrowLeft } from "lucide-react"; // Añadido ArrowLeft
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import {
  getToleranceTimeConfig,
  getToleranceTimeMessage
} from "@/lib/actions/configuration.actions";

export default function ToleranceConfigPage() {
  const [toleranceConfig, setToleranceConfig] = useState<any>(null);
  const [toleranceMessage, setToleranceMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const toleranceData = await getToleranceTimeConfig();

      if (toleranceData.success && toleranceData.data) {
        setToleranceConfig(toleranceData.data);
      }

      const message = await getToleranceTimeMessage();
      setToleranceMessage(message);
    } catch (error) {
      toast.error("Error al cargar la configuración");
    } finally {
      setLoading(false);
    }
  };

  const toleranceTime = toleranceConfig?.value || null;
  const active = toleranceConfig?.active ?? false;

  const formatTimeDisplay = (minutes: string) => {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins)) return "No configurado";
    if (mins === 0) return "Sin tolerancia";

    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining === 0 
        ? `${hours} ${hours === 1 ? "hora" : "horas"}`
        : `${hours}h ${remaining}m`;
    }

    return `${mins} ${mins === 1 ? "minuto" : "minutos"}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6 animate-in fade-in duration-500">
      
      {/* Contenedor del Header que incluye la flecha y el título alineados */}
      <div className="mb-6">
        
        {/* Botón Volver (Flecha sola) pegado a la izquierda */}
        <div className="mb-3 -ml-2">
          <Link
            href="/dashboard/checador-padre" 
            className="inline-flex items-center text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors group"
          >
            <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Título y Botón Editar alineados */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-500" />
            Configuración de Tolerancia
          </h1>

          <Link href="/dashboard/checador-padre/configuracion/editar">
            <Button
              size="icon"
              className="bg-purple-500 hover:bg-purple-400 text-gray-900 transition-transform active:scale-95 shadow-lg shadow-purple-500/20"
              title="Editar configuración"
            >
              <Edit className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Card */}
      <div className="bg-[#0A0F17] rounded-xl border border-gray-800 p-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-800 gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Tolerancia del Checador
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Control de tiempo para el registro de asistencias.
            </p>
          </div>

          <div
            className={`inline-flex items-center self-start px-3 py-1 rounded-full text-sm font-medium border ${
              active
                ? "bg-green-400/10 text-green-400 border-green-400/20"
                : "bg-red-400/10 text-red-400 border-red-400/20"
            }`}
          >
            {active ? (
              <><CheckCircle className="w-4 h-4 mr-1.5" /> Activo</>
            ) : (
              <><XCircle className="w-4 h-4 mr-1.5" /> Inactivo</>
            )}
          </div>
        </div>

        <div className="py-8 space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              Tiempo Configurado
            </label>

            <div className="p-6 bg-[#070B14] rounded-xl border border-gray-800 flex items-end gap-3">
              {toleranceTime ? (
                <>
                  <span className="text-4xl font-bold text-white">
                    {formatTimeDisplay(toleranceTime)}
                  </span>
                  <span className="text-gray-500 mb-1.5 font-medium">
                    ({toleranceTime} minutos)
                  </span>
                </>
              ) : (
                <p className="text-gray-500 text-lg italic">No configurado</p>
              )}
            </div>
          </div>

          <div className="bg-purple-500/5 border border-purple-500/10 rounded-xl p-5">
            <h3 className="text-sm font-bold text-purple-400 mb-3 flex items-center gap-2 uppercase tracking-tight">
              <AlertCircle className="w-4 h-4" />
              Reglas de Aplicación
            </h3>

            <p className="text-purple-200/80 text-sm leading-relaxed mb-4 italic">
              "{toleranceMessage || "Cargando reglas..."}"
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Permite registros dentro del margen.",
                "Marca retardos fuera del límite.",
                "Aplica a todos los usuarios.",
                "Auditable por administradores."
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 text-purple-500" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}