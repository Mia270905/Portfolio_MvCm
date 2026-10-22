"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  getToleranceTimeConfig,
  createToleranceTimeConfig,
  updateToleranceTimeConfig,
} from "@/lib/actions/configuration.actions";
import { toast } from "sonner";

export default function EditToleranceConfigPage() {
  const [formData, setFormData] = useState({
    tolerance_minutes: "10",
    tolerance_active: true,
  });

  const [configId, setConfigId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const router = useRouter();

  const quickOptions = [
    { label: "5 min", value: "5" },
    { label: "10 min", value: "10" },
    { label: "15 min", value: "15" },
    { label: "20 min", value: "20" },
    { label: "30 min", value: "30" },
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await getToleranceTimeConfig();
      if (response.success && response.data) {
        setConfigId(response.data.id);
        setFormData({
          tolerance_minutes: String(response.data.value || "10"),
          tolerance_active: response.data.active !== false,
        });
      }
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (value: string) => {
    setFormData((prev) => ({ ...prev, tolerance_minutes: value }));
    if (errors.tolerance_minutes) {
      setErrors((prev) => ({ ...prev, tolerance_minutes: "" }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (name === "tolerance_minutes") {
      const numbersOnly = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, tolerance_minutes: numbersOnly }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const getTimeDescription = (minutes: string) => {
    const mins = parseInt(minutes || "0", 10);
    if (mins === 0) return "Sin tolerancia";
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining === 0 ? `${hours} horas` : `${hours}h ${remaining}m`;
    }
    return `${mins} minutos`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const payload = {
        minutes: parseInt(formData.tolerance_minutes, 10),
        active: formData.tolerance_active,
        userId: user.id,
      };

      const result = configId 
        ? await updateToleranceTimeConfig({ id: configId, ...payload })
        : await createToleranceTimeConfig(payload);

      if (!result.success) throw new Error(result.message);

      toast.success("Configuración guardada correctamente");
      router.push("/dashboard/checador-padre/configuracion");
      router.refresh();
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6">
        <Link
          href="/dashboard/checador-padre/configuracion"
          className="inline-flex items-center text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver
        </Link>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-[#0A0F17] border border-gray-800 rounded-xl p-6 shadow-xl">
            {/* Encabezado de la tarjeta */}
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-purple-500/10 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Tiempo de Tolerancia</h2>
                <p className="text-sm text-gray-400">Establece el tiempo de gracia para el registro de entrada</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Input Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Tiempo en minutos *
                </label>
                <input
                  type="text"
                  name="tolerance_minutes"
                  inputMode="numeric"
                  value={formData.tolerance_minutes}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[#070B14] border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              {/* Equivalencia (Estilo Imagen) */}
              <div className="bg-[#111827]/50 border border-gray-800 p-3 rounded-lg">
                <p className="text-sm text-gray-300">
                  <span className="text-purple-400 font-medium">Equivalente a:</span> {getTimeDescription(formData.tolerance_minutes)}
                </p>
              </div>

              {/* Selección Rápida */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Selección rápida:</p>
                <div className="flex flex-wrap gap-2">
                  {quickOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleQuickSelect(opt.value)}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-all border ${
                        formData.tolerance_minutes === opt.value
                          ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                          : "bg-gray-800/40 border-gray-700 text-gray-400 hover:border-gray-500"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuadro de Ayuda (Estilo Imagen) */}
              <div className="bg-purple-900/10 border border-purple-500/20 rounded-lg p-5">
                <div className="flex items-center gap-2 text-purple-400 mb-3">
                  <Info className="w-4 h-4" />
                  <span className="font-bold text-sm">¿Cómo funciona?</span>
                </div>
                <ul className="space-y-2">
                  <li className="text-sm text-gray-400 flex gap-2">
                    <span className="text-purple-500">•</span>
                    Los empleados pueden marcar entrada sin retardo hasta este tiempo.
                  </li>
                  <li className="text-sm text-gray-400 flex gap-2">
                    <span className="text-purple-500">•</span>
                    Pasado este tiempo, el sistema registrará automáticamente un retardo.
                  </li>
                  <li className="text-sm text-gray-400 flex gap-2">
                    <span className="text-purple-500">•</span>
                    Valor mínimo recomendado: 5 minutos.
                  </li>
                </ul>
              </div>

              {/* Toggle de Activo */}
              <div className="flex items-center gap-3 p-3 bg-gray-800/20 rounded-lg border border-gray-800">
                <input
                  type="checkbox"
                  id="tolerance_active"
                  name="tolerance_active"
                  className="w-5 h-5 accent-purple-500 cursor-pointer"
                  checked={formData.tolerance_active}
                  onChange={handleChange}
                />
                <label htmlFor="tolerance_active" className="text-gray-300 cursor-pointer select-none text-sm">
                  Activar tiempo de tolerancia en el checador
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-purple-900/20"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Guardar Configuración"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}