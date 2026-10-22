"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, User, AlertCircle, CheckCircle } from "lucide-react";
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
      <div className="min-h-screen bg-[#faf8f3]">
        <div className="mb-6 p-4 lg:p-6">
          <Link
            href="/dashboard/citas/slug"
            className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
          </Link>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-[#f5efe6] rounded w-1/3 mb-6"></div>
            <div className="bg-white rounded-xl border border-[#f5efe6] p-6 space-y-4">
              <div>
                <div className="h-4 bg-[#faf8f3] rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-[#faf8f3] rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      <div className="mb-6 p-4 lg:p-6">
        <Link
          href="/dashboard/citas/slug"
          className="inline-flex items-center text-[#c6a365] hover:text-[#b59555] p-2 hover:bg-[#f5efe6] rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 flex items-center gap-3">
            <User className="w-8 h-8 text-[#c6a365]" />
            {userProfile?.user_code ? "Editar Código de Usuario" : "Asignar Código de Usuario"}
          </h1>
          <p className="text-neutral-600 mt-2">
            Define o modifica tu identificador único en el sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-[#f5efe6] p-6 shadow-sm">
          {/* Campo de código */}
          <div className="mb-6">
            <label htmlFor="user_code" className="block text-sm font-medium text-neutral-700 mb-2">
              Código de Usuario *
            </label>
            
            <input
              type="text"
              id="user_code"
              name="user_code"
              value={formData.user_code}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-[#faf8f3] border ${
                errors.user_code ? 'border-[#c62828]' : 'border-[#f5efe6]'
              } rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-[#c6a365] focus:ring-2 focus:ring-[#c6a365] focus:ring-opacity-50`}
              placeholder="Ej: juan-perez"
              maxLength={50}
            />
            
            {errors.user_code ? (
              <p className="mt-1 text-sm text-[#c62828]">{errors.user_code}</p>
            ) : (
              <p className="mt-2 text-sm text-neutral-600">
                Usa guiones para separar palabras. Solo letras minúsculas, números y guiones.
              </p>
            )}
          </div>

          {/* Información adicional */}
          <div className="mb-6 bg-[#e8f4fd] border border-[#bbdefb] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1565c0] mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Reglas para el código
            </h3>
            <ul className="text-sm text-[#1565c0] space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                <span><strong>Único:</strong> No puede repetirse con otro usuario</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                <span><strong>Longitud:</strong> Entre 3 y 50 caracteres</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                <span><strong>Recomendado:</strong> Usar nombre o iniciales para fácil identificación</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#1565c0] mt-0.5 flex-shrink-0" />
                <span><strong>Ejemplos válidos:</strong> juan-perez, jp-001, user-abc123</span>
              </li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#f5efe6]">
            <Link
              href="/dashboard/citas/slug"
              className="px-6 py-3 text-sm font-medium text-neutral-700 bg-white border border-[#f5efe6] rounded-lg hover:bg-[#faf8f3] transition-colors text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-sm font-medium bg-[#c6a365] hover:bg-[#b59555] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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