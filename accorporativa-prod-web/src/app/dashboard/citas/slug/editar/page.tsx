"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchUserProfile, updateUserCode, checkUserCodeExists } from "@/lib/actions/user.actions";
import { toast } from "sonner";

export default function EditUserCodePage() {
  const [formData, setFormData] = useState({
    user_code: "",
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { user, profile, error } = await fetchUserProfile();
      
      if (error === "NO_SESSION") {
        toast.error("No hay sesión activa. Por favor, inicia sesión.");
        router.push("/auth/login");
        return;
      } else if (error) {
        toast.error("Error al cargar el perfil del usuario");
        console.error("Error al cargar perfil:", error);
      } else {
        setUserProfile(profile);
        // Si ya tiene un código, lo cargamos
        if (profile?.user_code) {
          setFormData({
            user_code: profile.user_code,
          });
        }
      }
    } catch (error) {
      console.error("Error inesperado:", error);
      toast.error("Error al cargar la información");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Convertir a minúsculas y reemplazar espacios por guiones
    const processedValue = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''); // Solo letras minúsculas, números y guiones

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.user_code.trim()) {
      newErrors.user_code = "El código es obligatorio";
    } else if (formData.user_code.length < 3) {
      newErrors.user_code = "El código debe tener al menos 3 caracteres";
    } else if (formData.user_code.length > 50) {
      newErrors.user_code = "El código no puede exceder los 50 caracteres";
    } else if (!/^[a-z0-9-]+$/.test(formData.user_code)) {
      newErrors.user_code = "Solo se permiten letras minúsculas, números y guiones";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuario no autenticado");
      }

      // Verificar que el código esté disponible
      const { exists } = await checkUserCodeExists(formData.user_code, userProfile?.id);
      if (exists) {
        toast.error("Este código ya está en uso. Por favor, usa otro.");
        setErrors(prev => ({ ...prev, user_code: "Código ya en uso" }));
        setSaving(false);
        return;
      }

      // Actualizar el código del usuario
      const result = await updateUserCode(userProfile?.id, formData.user_code);

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar el código");
      }

      toast.success("Código actualizado correctamente");

      router.push("/dashboard/citas/slug");
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error("Error al guardar código: " + errorMessage);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Link
            href="/dashboard/citas/slug"
            className="inline-flex items-center text-custom-text-primary hover:text-gray-900 p-2 hover:bg-custom-accent-hover rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-custom-bg-secondary rounded w-1/3 mb-6"></div>
            <div className="bg-custom-bg-secondary rounded-lg shadow-xs border border-custom-border-secondary p-6 space-y-4">
              <div>
                <div className="h-4 bg-custom-bg-hover rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-custom-bg-hover rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard/citas/slug"
          className="inline-flex items-center text-custom-text-primary hover:text-gray-900 p-2 hover:bg-custom-accent-hover rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-custom-text-primary flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            {userProfile?.user_code ? "Editar Código de Usuario" : "Asignar Código de Usuario"}
          </h1>
          <p className="text-custom-text-secondary mt-2">
            Define o modifica tu identificador único en el sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-custom-bg-secondary rounded-lg border border-custom-border-secondary p-6">
          {/* Campo de código */}
          <div className="mb-6">
            <label htmlFor="user_code" className="block text-sm font-medium text-custom-text-secondary mb-2">
              Código de Usuario *
            </label>
            
            <input
              type="text"
              id="user_code"
              name="user_code"
              value={formData.user_code}
              onChange={handleChange}
              className={`w-full px-4 py-2 bg-custom-bg-tertiary border ${
                errors.user_code ? 'border-red-500' : 'border-custom-border-primary'
              } rounded-lg text-custom-text-primary placeholder-custom-text-muted focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50`}
              placeholder="Ej: juan-perez"
              maxLength={50}
            />
            
            {errors.user_code ? (
              <p className="mt-1 text-sm text-red-400">{errors.user_code}</p>
            ) : (
              <p className="mt-2 text-sm text-custom-text-tertiary">
                Usa guiones para separar palabras. Solo letras minúsculas, números y guiones.
              </p>
            )}
          </div>

          {/* Información adicional */}
          <div className="mb-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Reglas para el código
            </h3>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• <strong>Único:</strong> No puede repetirse con otro usuario</li>
              <li>• <strong>Longitud:</strong> Entre 3 y 50 caracteres</li>
              <li>• <strong>Recomendado:</strong> Usar nombre o iniciales para fácil identificación</li>
              <li>• <strong>Ejemplos válidos:</strong> juan-perez, jp-001, user-abc123</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-custom-border-secondary">
            <Link
              href="/dashboard/citas/slug"
              className="px-4 py-2 text-sm font-medium text-custom-text-secondary bg-custom-bg-hover border border-custom-border-primary rounded-lg hover:bg-custom-bg-hover transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium bg-blue-500 hover:bg-blue-400 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : userProfile?.user_code ? (
                "Actualizar Código"
              ) : (
                "Asignar Código"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}