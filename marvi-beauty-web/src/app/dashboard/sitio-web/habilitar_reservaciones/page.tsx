"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, CheckCircle, XCircle, Save, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleReservations, areReservationsEnabled } from "@/lib/actions/configuration.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReservasConfigPage() {
  const [enabled, setEnabled] = useState(true);
  const [originalEnabled, setOriginalEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Cargar configuración
      const isEnabled = await areReservationsEnabled();
      setEnabled(isEnabled);
      setOriginalEnabled(isEnabled);
      
      // Cargar permisos
      const userWithPermissions = await getUserWithPermissions();
      const userPermissions = userWithPermissions?.permissions?.map(
        (p: { code: string }) => p.code
      ) || [];
      
      setCanEdit(userPermissions.includes("update:enable-reservations"));
    } catch (error) {
      console.error("Error cargando configuración:", error);
      setEnabled(true); // Valor por defecto
      setOriginalEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSwitch = () => {
    if (!canEdit) {
      toast.warning("No tienes permisos para editar esta configuración");
      return;
    }
    setEnabled(!enabled);
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast.warning("No tienes permisos para editar esta configuración");
      return;
    }

    if (enabled === originalEnabled) {
      toast.info("No hay cambios para guardar");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.warning("Debes iniciar sesión para guardar cambios");
        return;
      }

      const result = await toggleReservations(enabled, user.id);
      
      if (result.success) {
        setOriginalEnabled(enabled);
        toast.success(
          enabled 
            ? "Botón de reservas ACTIVADO" 
            : "Botón de reservas DESACTIVADO"
        );
        router.refresh();
      } else {
        toast.warning(result.message || "Error al guardar cambios");
        // Revertir en caso de error
        setEnabled(originalEnabled);
      }
    } catch (error) {
      toast.warning("Error al guardar: " + error);
      // Revertir en caso de error
      setEnabled(originalEnabled);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEnabled(originalEnabled);
    toast.info("Cambios cancelados");
  };

  const hasChanges = enabled !== originalEnabled;

  if (loading) {
    return (
      <div className="min-h-screen bg-custom-bg-primary">
        <div className="mb-6 p-4">
          <Link
            href="/dashboard/sitio-web"
            className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-custom-bg-secondary rounded w-1/3 mb-6"></div>
            <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6">
              <div className="h-6 bg-custom-bg-tertiary rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-custom-bg-tertiary rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      <div className="mb-6 p-4">
        <Link
          href="/dashboard/sitio-web"
          className="inline-flex items-center text-custom-text-primary hover:text-custom-accent-primary p-2 hover:bg-custom-accent-hover rounded-lg transition-all duration-200"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-custom-text-primary flex items-center gap-3">
              <Calendar className="w-8 h-8 text-amber-500" />
              Sistema de Reservas
            </h1>
            <p className="text-custom-text-secondary mt-2">
              Controla la visibilidad del enlace "Reservar cita" en el menú de usuarios
            </p>
          </div>
        </div>

        <div className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6">
          <div className="space-y-6">
            {/* Toggle Principal */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-custom-bg-tertiary rounded-lg border border-custom-border-primary gap-4">
              <div className="space-y-2">
                <Label className="text-xl font-semibold text-custom-text-primary">
                  {enabled ? "✅ Reservas Activadas" : "❌ Reservas Desactivadas"}
                </Label>
                <p className="text-custom-text-tertiary">
                  {enabled
                    ? "Los usuarios verán el enlace 'Reservar cita' en su menú"
                    : "El enlace 'Reservar cita' estará oculto para los usuarios"}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Switch con estilos corregidos */}
                <div className="relative inline-block">
                  <Switch
                    checked={enabled}
                    onCheckedChange={handleToggleSwitch}
                    disabled={saving || !canEdit}
                    className={`
                      h-7 w-14 
                      data-[state=checked]:bg-amber-500 
                      data-[state=unchecked]:bg-custom-border-primary 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      [&>span]:h-6 [&>span]:w-6
                      [&>span]:data-[state=checked]:translate-x-7
                      [&>span]:data-[state=unchecked]:translate-x-1
                    `}
                  />
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${enabled ? 'bg-green-400/20 text-green-400' : 'bg-red-400/20 text-red-400'}`}>
                  {enabled ? "ON" : "OFF"}
                </div>
              </div>
            </div>

            {/* Indicador visual */}
            <div className={`p-4 rounded-lg border ${enabled ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              <div className="flex items-start sm:items-center gap-3">
                {enabled ? (
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1 sm:mt-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1 sm:mt-0" />
                )}
                <div>
                  <h3 className="font-semibold text-custom-text-primary">
                    {enabled ? 'Los usuarios verán "Reservar cita" en su menú' : 'Los usuarios NO verán "Reservar cita" en su menú'}
                  </h3>
                  <p className="text-sm text-custom-text-secondary mt-1">
                    {enabled 
                      ? 'Los usuarios autenticados podrán ver y acceder a "Reservar cita" desde su menú desplegable.'
                      : 'El enlace "Reservar cita" no aparecerá en el menú de usuarios autenticados.'}
                  </p>
                </div>
              </div>
            </div>

           {/* Botones de acción */}
            {/* {hasChanges && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="text-amber-400 font-medium">
                      Tienes cambios pendientes para guardar
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-300">
                      Estado actual: <span className="font-semibold">{originalEnabled ? 'ACTIVADO' : 'DESACTIVADO'}</span> → 
                      Nuevo estado: <span className={`font-semibold ${enabled ? 'text-green-400' : 'text-red-400'}`}>{enabled ? 'ACTIVADO' : 'DESACTIVADO'}</span>
                    </span>
                  </div>
                </div>
              </div>
            )} */}

            {/* Botones de guardar/cancelar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 border-t border-custom-border-secondary gap-4">
              {hasChanges ? (
                <>
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="border-custom-border-primary text-custom-text-primary hover:bg-custom-bg-hover hover:text-custom-text-primary"
                    disabled={saving}
                  >
                    Cancelar Cambios
                  </Button>
                  
                  <Button
                    onClick={handleSave}
                    disabled={saving || !canEdit}
                    className="inline-flex items-center px-6 py-3 bg-custom-accent-primary hover:bg-custom-accent-secondary text-custom-bg-primary font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-custom-accent-border hover:scale-105 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        Confirmar Cambios
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-sm text-custom-text-tertiary">
                    {canEdit 
                      ? "Realiza cambios para habilitar los botones de guardar"
                      : "No tienes permisos para editar esta configuración"
                    }
                  </div>
                  
                  <Button
                    onClick={handleSave}
                    disabled={true}
                    className="inline-flex items-center px-6 py-3 bg-custom-bg-tertiary text-custom-text-tertiary font-medium rounded-lg cursor-not-allowed opacity-50"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    Sin cambios para guardar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}